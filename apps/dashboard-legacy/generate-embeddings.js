#!/usr/bin/env node

/**
 * Script to generate embeddings for titles in the database
 * This script will process titles and generate vector embeddings for semantic search
 * 
 * Usage:
 * node generate-embeddings.js [--dry-run] [--limit=N] [--title-id=ID]
 * 
 * Options:
 * --dry-run: Show what would be processed without actually generating embeddings
 * --limit=N: Process only N titles (default: 10 for testing)
 * --title-id=ID: Process only a specific title ID
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const titleIdArg = args.find(arg => arg.startsWith('--title-id='));

const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;
const specificTitleId = titleIdArg ? titleIdArg.split('=')[1] : null;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// OpenAI client - requires API key
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
if (!openaiApiKey || openaiApiKey === 'sk-your_actual_api_key_here') {
  console.error('❌ OpenAI API key not found!');
  console.error('   Set VITE_OPENAI_API_KEY environment variable');
  console.error('   Example: export VITE_OPENAI_API_KEY=sk-your-actual-key-here');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const EMBEDDING_MODEL = 'text-embedding-ada-002';

async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    console.log(`  🔄 Generating embedding for text: "${text.substring(0, 50)}..."`);
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    console.log(`  ✅ Generated embedding with ${embedding.length} dimensions`);
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

    const contentText = [
      titleText,
      descriptionText,
      title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : '',
      title.tone || '',
      title.tags ? (Array.isArray(title.tags) ? title.tags.join(', ') : title.tags) : '',
      title.author || '',
      title.rights_owner || ''
    ].filter(Boolean).join(' ');

    const combinedText = [
      `Title: ${titleText}`,
      `Description: ${descriptionText}`,
      `Genre: ${title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : 'Not specified'}`,
      `Tone: ${title.tone || 'Not specified'}`,
      `Format: ${title.content_format || 'Not specified'}`,
      `Author: ${title.author || 'Not specified'}`,
      title.completed ? 'Status: Completed' : 'Status: Ongoing'
    ].join('\n');

    console.log('📝 Text representations prepared:');
    console.log(`   Title text: "${titleText}"`);
    console.log(`   Description: "${descriptionText.substring(0, 100)}..."`);
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

    if (!titleEmbedding || !descriptionEmbedding || !contentEmbedding || !combinedEmbedding) {
      throw new Error('Failed to generate one or more embeddings');
    }

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

    const { data: updateResult, error } = await supabase
      .from('titles')
      .update({
        title_embedding: embeddings.title_embedding,
        synopsis_embedding: embeddings.synopsis_embedding,
        content_embedding: embeddings.content_embedding,
        combined_embedding: embeddings.combined_embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_created_at: new Date().toISOString(),
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', titleId)
      .select('combined_embedding, embedding_model'); // Verify what was stored

    if (error) {
      console.error('❌ Database error storing embeddings:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('🔧 SOLUTION: Run the database migration SQL to add embedding columns');
      } else if (error.message?.includes('vector') || error.message?.includes('type')) {
        console.error('🔧 SOLUTION: Fix database column types - run fix-embedding-database.sql');
      }
      
      return false;
    }

    // Verify the embedding was actually stored correctly
    const storedEmbedding = updateResult?.[0]?.combined_embedding;
    const isValidEmbedding = Array.isArray(storedEmbedding) && storedEmbedding.length === 1536;
    
    if (!isValidEmbedding) {
      console.error(`❌ Embedding verification failed for title: ${titleId}`);
      console.error(`   Expected: Array with 1536 dimensions`);
      console.error(`   Got: ${typeof storedEmbedding} ${Array.isArray(storedEmbedding) ? `with ${storedEmbedding.length} items` : ''}`);
      console.error('🔧 SOLUTION: Database column types may be incorrect - run fix-embedding-database.sql');
      return false;
    }

    console.log(`✅ Embeddings stored and verified for title: ${titleId}`);
    console.log(`   Stored embedding: ${storedEmbedding.length} dimensions`);
    return true;
  } catch (error) {
    console.error('❌ Error storing embeddings:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting embedding generation process...');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE PROCESSING'}`);
  
  if (specificTitleId) {
    console.log(`🎯 Processing specific title: ${specificTitleId}`);
  } else {
    console.log(`📊 Processing limit: ${limit} titles`);
  }

  try {
    // Fetch titles that need processing
    let query = supabase
      .from('titles')
      .select('*')
      .is('combined_embedding', null); // Only titles without embeddings

    if (specificTitleId) {
      query = query.eq('title_id', specificTitleId);
    } else {
      query = query.limit(limit);
    }

    const { data: titles, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch titles: ${error.message}`);
    }

    if (!titles || titles.length === 0) {
      console.log('ℹ️ No titles found that need embedding processing');
      if (specificTitleId) {
        console.log('   • The specific title ID may not exist or already has embeddings');
      } else {
        console.log('   • All titles may already have embeddings generated');
        console.log('   • Try running without --limit to see all titles');
      }
      return;
    }

    console.log(`📚 Found ${titles.length} titles to process`);
    
    // Show what will be processed
    console.log('\n📋 Titles to be processed:');
    titles.forEach((title, index) => {
      console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr} (${title.title_id})`);
    });

    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No actual processing will occur');
      console.log('Remove --dry-run flag to generate embeddings');
    }

    // Process each title
    let processed = 0;
    let failed = 0;
    let totalTokens = 0;

    for (const title of titles) {
      try {
        console.log(`\n📖 Processing ${processed + 1}/${titles.length}...`);
        
        const embeddings = await generateTitleEmbeddings(title);
        
        if (!isDryRun) {
          const stored = await storeTitleEmbeddings(title.title_id, embeddings);
          if (stored) {
            processed++;
            totalTokens += embeddings.total_tokens || 0;
            console.log(`✅ Successfully processed: ${title.title_name_en || title.title_name_kr}`);
          } else {
            failed++;
            console.log(`❌ Failed to store: ${title.title_name_en || title.title_name_kr}`);
          }
        } else {
          processed++;
          console.log(`✅ DRY RUN: Would process ${title.title_name_en || title.title_name_kr}`);
        }

        // Add delay between requests to avoid rate limits
        if (!isDryRun) {
          console.log('⏳ Waiting 1 second to avoid rate limits...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        failed++;
        console.error(`❌ Failed to process ${title.title_name_en || title.title_name_kr}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    if (isDryRun) {
      console.log(`🔍 DRY RUN COMPLETE`);
      console.log(`📋 Would process: ${processed} titles`);
      console.log(`❌ Would fail: ${failed} titles`);
    } else {
      console.log(`✅ Successfully processed: ${processed} titles`);
      console.log(`❌ Failed: ${failed} titles`);
      console.log(`🎯 Total tokens used: ${totalTokens.toLocaleString()}`);
      
      const estimatedCost = (totalTokens / 1000) * 0.0001; // $0.0001 per 1K tokens for ada-002
      console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
    }
    
    console.log('\n🎉 Embedding generation complete!');
    
    if (!isDryRun && processed > 0) {
      console.log('\n🔍 Next steps:');
      console.log('1. Verify embeddings were stored: Check titles table in Supabase');
      console.log('2. Test vector search: Try the OpenAI chatbot');
      console.log('3. Generate more embeddings: Run this script with higher --limit');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);