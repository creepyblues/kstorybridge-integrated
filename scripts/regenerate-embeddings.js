/**
 * Batch Embedding Regeneration Script
 * Regenerates embeddings for titles with NULL combined_embedding
 * Prioritizes high-value titles (most viewed, with pitch analytics)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configuration
const BATCH_SIZE = 10; // Process 10 titles at a time
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay to avoid rate limits
const MAX_TITLES = 50; // Limit for testing (remove for full regeneration)

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000) // Limit to 8000 chars to avoid token limits
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('  ❌ OpenAI API error:', error.message);
    return null;
  }
}

function createEmbeddingText(title) {
  // Combine multiple fields for better embedding quality
  const parts = [
    title.title_name_en || '',
    title.title_name_kr || '',
    title.synopsis || '',
    title.description || '',
    title.description_kr || '',
    (title.genre || []).join(' '),
    title.tone || '',
    title.perfect_for || '',
    title.audience || ''
  ].filter(Boolean);

  return parts.join(' ').trim();
}

async function fetchTitlesNeedingEmbeddings(limit = null) {
  console.log('🔍 Fetching titles with NULL embeddings...\n');

  // Fetch titles without embeddings, prioritized by views
  const query = supabase
    .from('titles')
    .select(`
      title_id,
      title_name_en,
      title_name_kr,
      synopsis,
      description,
      description_kr,
      genre,
      tone,
      perfect_for,
      audience,
      views
    `)
    .is('combined_embedding', null)
    .order('views', { ascending: false, nullsLast: true });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching titles:', error);
    return [];
  }

  return data || [];
}

async function updateTitleEmbedding(titleId, embedding) {
  const { error } = await supabase
    .from('titles')
    .update({
      combined_embedding: embedding,
      embedding_model: 'text-embedding-ada-002',
      embedding_updated_at: new Date().toISOString()
    })
    .eq('title_id', titleId);

  if (error) {
    console.error('  ❌ Database update error:', error.message);
    return false;
  }

  return true;
}

async function regenerateEmbeddings() {
  console.log('🚀 Starting Batch Embedding Regeneration\n');
  console.log('=' + '='.repeat(60) + '\n');

  // Fetch titles
  const titles = await fetchTitlesNeedingEmbeddings(MAX_TITLES);

  if (titles.length === 0) {
    console.log('✅ No titles need embedding regeneration!\n');
    return;
  }

  console.log(`📊 Found ${titles.length} titles to process\n`);

  // Process in batches
  let successCount = 0;
  let failCount = 0;
  let totalCost = 0;

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(titles.length / BATCH_SIZE);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} titles)`);
    console.log('-'.repeat(60));

    for (const title of batch) {
      const titleName = title.title_name_en || title.title_name_kr || 'Unknown';
      process.stdout.write(`  ${titleName.substring(0, 50).padEnd(50)} ... `);

      // Create embedding text
      const embeddingText = createEmbeddingText(title);

      if (!embeddingText) {
        console.log('⚠️  SKIP (no text)');
        failCount++;
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText);

      if (!embedding) {
        console.log('❌ FAIL (API error)');
        failCount++;
        continue;
      }

      // Validate embedding
      if (embedding.length !== 1536) {
        console.log(`❌ FAIL (wrong dimension: ${embedding.length})`);
        failCount++;
        continue;
      }

      // Update database
      const updated = await updateTitleEmbedding(title.title_id, embedding);

      if (updated) {
        console.log('✅ SUCCESS');
        successCount++;
        totalCost += 0.0001; // $0.0001 per embedding
      } else {
        console.log('❌ FAIL (DB update)');
        failCount++;
      }
    }

    console.log('');

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < titles.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Summary
  console.log('=' + '='.repeat(60));
  console.log('📊 REGENERATION COMPLETE\n');
  console.log(`✅ Success: ${successCount} titles`);
  console.log(`❌ Failed:  ${failCount} titles`);
  console.log(`💰 Cost:    $${totalCost.toFixed(4)}\n`);

  if (failCount > 0) {
    console.log('⚠️  Some titles failed. You can re-run this script to retry.');
  }
}

// Main execution
console.log('\n');
regenerateEmbeddings().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
