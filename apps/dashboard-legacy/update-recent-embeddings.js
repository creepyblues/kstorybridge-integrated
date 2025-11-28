#!/usr/bin/env node

/**
 * Script to regenerate embeddings for recently updated titles
 * Useful when you've updated keywords, genres, or other searchable fields
 *
 * Usage:
 * node update-recent-embeddings.js [--dry-run] [--hours=N] [--since=YYYY-MM-DD] [--limit=N]
 *
 * Options:
 * --dry-run: Show what would be processed without actually updating
 * --hours=N: Update titles modified in the last N hours (default: 24)
 * --since=YYYY-MM-DD: Update titles modified since this date
 * --limit=N: Maximum number of titles to process (safety limit, default: 50)
 *
 * Examples:
 * node update-recent-embeddings.js --hours=24 --dry-run
 * node update-recent-embeddings.js --since=2025-10-18
 * node update-recent-embeddings.js --hours=48 --limit=20
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// Use service role key for embedding updates (bypasses RLS policies)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const hoursArg = args.find(arg => arg.startsWith('--hours='));
const sinceArg = args.find(arg => arg.startsWith('--since='));
const limitArg = args.find(arg => arg.startsWith('--limit='));

const hoursAgo = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
const sinceDate = sinceArg ? sinceArg.split('=')[1] : null;
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

// Initialize clients with service role key (required for embedding updates)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Check for required API keys
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
if (!openaiApiKey || openaiApiKey === 'sk-your_actual_api_key_here') {
  console.error('❌ OpenAI API key not found!');
  console.error('   Set VITE_OPENAI_API_KEY environment variable');
  console.error('   Example: export VITE_OPENAI_API_KEY=sk-your-actual-key-here');
  process.exit(1);
}

if (!usingServiceRole) {
  console.warn('\n⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set!');
  console.warn('   Using ANON_KEY may cause permission errors when storing embeddings.');
  console.warn('   Get service_role key from: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api');
  console.warn('   Then set: export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const EMBEDDING_MODEL = 'text-embedding-ada-002';

/**
 * Calculate the cutoff timestamp for finding recently updated titles
 */
function getTimestampCutoff() {
  if (sinceDate) {
    const date = new Date(sinceDate);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${sinceDate}. Use YYYY-MM-DD`);
    }
    return date.toISOString();
  } else {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursAgo);
    return cutoff.toISOString();
  }
}

async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    return {
      embedding,
      model: EMBEDDING_MODEL,
      usage: response.usage
    };
  } catch (error) {
    console.error('  ❌ Error generating embedding:', error.message);
    throw error;
  }
}

async function generateTitleEmbeddings(title) {
  console.log(`\n🎯 Processing: ${title.title_name_en || title.title_name_kr}`);

  try {
    // Prepare different text representations
    const titleText = [title.title_name_en, title.title_name_kr]
      .filter(Boolean)
      .join(' | ');

    const descriptionText = [title.synopsis, title.tagline]
      .filter(Boolean)
      .join(' ');

    // Include keywords in the content text
    const keywordsText = title.keywords
      ? (Array.isArray(title.keywords) ? title.keywords.join(', ') : title.keywords)
      : '';

    const contentText = [
      titleText,
      descriptionText,
      title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : '',
      title.tone || '',
      keywordsText,  // Keywords included here
      title.story_author || '',
      title.art_author || ''
    ].filter(Boolean).join(' ');

    const combinedText = [
      `Title: ${titleText}`,
      `Description: ${descriptionText}`,
      `Genre: ${title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : 'Not specified'}`,
      `Tone: ${title.tone || 'Not specified'}`,
      `Keywords: ${keywordsText || 'Not specified'}`,
      `Format: ${title.content_format || 'Not specified'}`,
      `Author: ${title.story_author || title.art_author || 'Not specified'}`,
      title.completed ? 'Status: Completed' : 'Status: Ongoing'
    ].join('\n');

    console.log('📝 Text representations prepared:');
    console.log(`   Title text: "${titleText}"`);
    console.log(`   Keywords: "${keywordsText}"`);
    console.log(`   Combined length: ${combinedText.length} characters`);

    if (isDryRun) {
      console.log('🔍 DRY RUN: Would generate embeddings for this content');
      return {
        title_embedding: null,
        synopsis_embedding: null,
        content_embedding: null,
        combined_embedding: null,
        dry_run: true
      };
    }

    // Generate embeddings in parallel
    console.log('🚀 Generating embeddings in parallel...');
    const [titleEmbedding, descriptionEmbedding, contentEmbedding, combinedEmbedding] = await Promise.all([
      generateEmbedding(titleText),
      generateEmbedding(descriptionText),
      generateEmbedding(contentText),
      generateEmbedding(combinedText)
    ]);

    return {
      title_embedding: titleEmbedding.embedding,
      synopsis_embedding: descriptionEmbedding.embedding,
      content_embedding: contentEmbedding.embedding,
      combined_embedding: combinedEmbedding.embedding,
      total_tokens: titleEmbedding.usage.total_tokens +
                   descriptionEmbedding.usage.total_tokens +
                   contentEmbedding.usage.total_tokens +
                   combinedEmbedding.usage.total_tokens
    };
  } catch (error) {
    console.error(`❌ Error processing title ${title.title_id}:`, error.message);
    throw error;
  }
}

async function storeTitleEmbeddings(titleId, embeddings) {
  if (isDryRun) {
    console.log('🔍 DRY RUN: Would store embeddings in database');
    return true;
  }

  try {
    console.log(`💾 Storing embeddings for title: ${titleId}`);

    // Store each embedding separately to isolate potential issues
    const { error } = await supabase
      .from('titles')
      .update({
        title_embedding: embeddings.title_embedding,
        synopsis_embedding: embeddings.synopsis_embedding,
        content_embedding: embeddings.content_embedding,
        combined_embedding: embeddings.combined_embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', titleId);

    if (error) {
      console.error('❌ Database error storing embeddings:');
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Update query executed successfully');

    // Wait a moment for database to commit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the embedding was stored correctly by fetching it back
    console.log('🔍 Verifying stored embedding...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('titles')
      .select('combined_embedding, embedding_model, embedding_updated_at')
      .eq('title_id', titleId)
      .single();

    if (verifyError) {
      console.error('❌ Verification fetch failed:', verifyError.message);
      return false;
    }

    // Check if embedding exists (Supabase might return it in different formats)
    const storedEmbedding = verifyData?.combined_embedding;
    const hasEmbedding = !!storedEmbedding;

    if (!hasEmbedding) {
      console.error(`❌ No embedding found after storage for title: ${titleId}`);
      console.error(`   Verification data:`, JSON.stringify(verifyData, null, 2));
      return false;
    }

    // For pgvector, Supabase might return the embedding as a string or array
    // We'll accept both as long as it exists
    const embeddingType = typeof storedEmbedding;
    const isArray = Array.isArray(storedEmbedding);
    const length = isArray ? storedEmbedding.length : 'N/A';

    console.log(`✅ Embedding verified:`, {
      type: embeddingType,
      isArray,
      length,
      model: verifyData.embedding_model,
      updated: verifyData.embedding_updated_at
    });

    // Consider it successful if embedding exists, even if format is unexpected
    // (pgvector columns can be serialized differently)
    console.log(`✅ Embeddings stored successfully for title: ${titleId}`);
    return true;

  } catch (error) {
    console.error('❌ Error storing embeddings:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting bulk embedding update for recently modified titles...');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE PROCESSING'}`);
  console.log(`Auth: ${usingServiceRole ? '✅ Service Role (Full Permissions)' : '⚠️  Anon Key (Limited Permissions)'}`);

  try {
    const timestampCutoff = getTimestampCutoff();

    console.log('\n📅 Time Filter:');
    if (sinceDate) {
      console.log(`   Since: ${sinceDate}`);
    } else {
      console.log(`   Last ${hoursAgo} hours`);
    }
    console.log(`   Cutoff: ${timestampCutoff}`);
    console.log(`   Limit: ${limit} titles\n`);

    // Fetch recently updated titles
    const { data: titles, error } = await supabase
      .from('titles')
      .select('*')
      .gte('updated_at', timestampCutoff)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch titles: ${error.message}`);
    }

    if (!titles || titles.length === 0) {
      console.log('ℹ️ No titles found that were updated in the specified time range');
      console.log('   • Try a longer time period (--hours=48)');
      console.log('   • Or specify an earlier date (--since=2025-10-15)');
      return;
    }

    console.log(`📚 Found ${titles.length} titles updated since ${timestampCutoff}`);

    // Show what will be processed
    console.log('\n📋 Titles to be updated:');
    titles.forEach((title, index) => {
      const updated = new Date(title.updated_at).toLocaleString();
      const keywords = title.keywords
        ? (Array.isArray(title.keywords) ? title.keywords.join(', ') : title.keywords)
        : 'None';
      console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr}`);
      console.log(`   ID: ${title.title_id}`);
      console.log(`   Updated: ${updated}`);
      console.log(`   Keywords: ${keywords}`);
    });

    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No actual processing will occur');
      console.log('Remove --dry-run flag to regenerate embeddings');

      // Show estimated cost
      const estimatedTokens = titles.length * 800; // Rough estimate: 4 embeddings x 200 tokens each
      const estimatedCost = (estimatedTokens / 1000) * 0.0001;
      console.log(`\n💰 Estimated cost: $${estimatedCost.toFixed(4)} (${estimatedTokens.toLocaleString()} tokens)`);
      return;
    }

    // Process each title
    let processed = 0;
    let failed = 0;
    let totalTokens = 0;

    for (const title of titles) {
      try {
        console.log(`\n📖 Processing ${processed + 1}/${titles.length}...`);

        const embeddings = await generateTitleEmbeddings(title);
        const stored = await storeTitleEmbeddings(title.title_id, embeddings);

        if (stored) {
          processed++;
          totalTokens += embeddings.total_tokens || 0;
          console.log(`✅ Successfully processed: ${title.title_name_en || title.title_name_kr}`);
        } else {
          failed++;
          console.log(`❌ Failed to store: ${title.title_name_en || title.title_name_kr}`);
        }

        // Add delay between requests to avoid rate limits
        console.log('⏳ Waiting 1 second to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failed++;
        console.error(`❌ Failed to process ${title.title_name_en || title.title_name_kr}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${processed} titles`);
    console.log(`❌ Failed: ${failed} titles`);
    console.log(`🎯 Total tokens used: ${totalTokens.toLocaleString()}`);

    const actualCost = (totalTokens / 1000) * 0.0001; // $0.0001 per 1K tokens for ada-002
    console.log(`💰 Total cost: $${actualCost.toFixed(4)}`);

    console.log('\n🎉 Bulk embedding update complete!');

    if (processed > 0) {
      console.log('\n🔍 Next steps:');
      console.log('1. Test the chat: Updated keywords should now be searchable');
      console.log('2. Verify in database: Check embedding_updated_at timestamps');
      console.log('3. Monitor chat quality: Keywords should improve search relevance');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
