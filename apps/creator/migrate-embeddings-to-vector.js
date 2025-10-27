#!/usr/bin/env node

/**
 * Embedding Migration Script
 * Converts existing JSON string embeddings to proper PostgreSQL vector(1536) format
 *
 * CRITICAL: This script fixes the root cause of vector search returning 0 results
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isDryRun = process.argv.includes('--dry-run');
const batchSize = parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 10;

function parseStoredEmbedding(embeddingData) {
  if (!embeddingData) return null;

  try {
    let embedding;

    if (typeof embeddingData === 'string') {
      // Parse JSON string to array
      embedding = JSON.parse(embeddingData);
    } else if (Array.isArray(embeddingData)) {
      // Already an array
      embedding = embeddingData;
    } else {
      console.log(`⚠️ Unexpected embedding format: ${typeof embeddingData}`);
      return null;
    }

    // Ensure exactly 1536 dimensions
    if (embedding.length !== 1536) {
      console.log(`⚠️ Dimension mismatch: ${embedding.length} → 1536`);

      // Truncate or pad to 1536
      const formattedEmbedding = new Array(1536).fill(0);
      for (let i = 0; i < Math.min(1536, embedding.length); i++) {
        formattedEmbedding[i] = parseFloat(embedding[i]) || 0;
      }
      return formattedEmbedding;
    }

    // Ensure all values are numbers
    return embedding.map(val => parseFloat(val) || 0);

  } catch (error) {
    console.log(`❌ Error parsing embedding: ${error.message}`);
    return null;
  }
}

async function analyzeMigrationNeeds() {
  console.log('🔍 ANALYZING MIGRATION NEEDS');
  console.log('='.repeat(50));

  try {
    // Get titles with embeddings
    const { data: titles, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding')
      .not('combined_embedding', 'is', null)
      .limit(5); // Sample for analysis

    if (error) {
      console.log('❌ Cannot read titles:', error.message);
      return null;
    }

    if (!titles || titles.length === 0) {
      console.log('❌ No titles with embeddings found');
      return null;
    }

    console.log(`📊 Found ${titles.length} sample titles with embeddings`);

    let needsMigration = 0;
    let alreadyCorrect = 0;
    let parseErrors = 0;

    for (const title of titles) {
      const embedding = title.combined_embedding;
      console.log(`\n📋 ${title.title_name_en}:`);
      console.log(`   Type: ${typeof embedding}`);
      console.log(`   Length: ${embedding?.length || 'N/A'}`);

      if (typeof embedding === 'string') {
        console.log('   Status: ❌ JSON string - NEEDS MIGRATION');
        needsMigration++;

        // Test parsing
        const parsed = parseStoredEmbedding(embedding);
        if (parsed) {
          console.log(`   ✅ Can parse → ${parsed.length} dimensions`);
        } else {
          console.log('   ❌ Parse error');
          parseErrors++;
        }
      } else if (Array.isArray(embedding)) {
        if (embedding.length === 1536) {
          console.log('   Status: ✅ Already correct vector format');
          alreadyCorrect++;
        } else {
          console.log(`   Status: ⚠️ Array but wrong dimensions (${embedding.length})`);
          needsMigration++;
        }
      } else {
        console.log('   Status: ❓ Unknown format');
        needsMigration++;
      }
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('titles')
      .select('title_id', { count: 'exact', head: true })
      .not('combined_embedding', 'is', null);

    const totalEmbeddings = count || 0;

    console.log(`\n📊 MIGRATION ANALYSIS:`);
    console.log(`   Total embeddings: ${totalEmbeddings}`);
    console.log(`   Need migration: ${needsMigration}/${titles.length} sampled`);
    console.log(`   Already correct: ${alreadyCorrect}/${titles.length} sampled`);
    console.log(`   Parse errors: ${parseErrors}/${titles.length} sampled`);

    const estimatedNeedsMigration = Math.round((needsMigration / titles.length) * totalEmbeddings);
    console.log(`   Estimated total needing migration: ${estimatedNeedsMigration}`);

    return {
      totalEmbeddings,
      estimatedNeedsMigration,
      hasParseErrors: parseErrors > 0
    };

  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
    return null;
  }
}

async function migrateEmbeddingsBatch(offset = 0, limit = batchSize) {
  console.log(`\n🔄 Processing batch: ${offset}-${offset + limit - 1}`);

  try {
    // Get titles with embeddings
    const { data: titles, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding')
      .not('combined_embedding', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.log('❌ Cannot read titles batch:', error.message);
      return { success: false, processed: 0, errors: [] };
    }

    if (!titles || titles.length === 0) {
      console.log('✅ No more titles to process');
      return { success: true, processed: 0, errors: [] };
    }

    console.log(`📋 Processing ${titles.length} titles...`);

    let processed = 0;
    const errors = [];

    for (const title of titles) {
      try {
        const embedding = parseStoredEmbedding(title.combined_embedding);

        if (!embedding) {
          errors.push(`${title.title_name_en}: Cannot parse embedding`);
          continue;
        }

        console.log(`   ✅ ${title.title_name_en}: ${embedding.length} dimensions`);

        if (!isDryRun) {
          // Update with properly formatted vector
          const { error: updateError } = await supabase
            .from('titles')
            .update({
              combined_embedding: embedding,
              embedding_updated_at: new Date().toISOString()
            })
            .eq('title_id', title.title_id);

          if (updateError) {
            errors.push(`${title.title_name_en}: ${updateError.message}`);
            continue;
          }
        } else {
          console.log(`   🧪 DRY RUN: Would update ${title.title_name_en}`);
        }

        processed++;

      } catch (error) {
        errors.push(`${title.title_name_en}: ${error.message}`);
      }
    }

    return { success: true, processed, errors, hasMore: titles.length === limit };

  } catch (error) {
    console.log('❌ Batch processing failed:', error.message);
    return { success: false, processed: 0, errors: [error.message] };
  }
}

async function testVectorOperationsAfterMigration() {
  console.log('\n🧪 TESTING VECTOR OPERATIONS');
  console.log('='.repeat(40));

  try {
    // Get a sample embedding for testing
    const { data: sample, error } = await supabase
      .from('titles')
      .select('combined_embedding')
      .not('combined_embedding', 'is', null)
      .limit(1);

    if (error || !sample || sample.length === 0) {
      console.log('❌ Cannot get sample for testing');
      return;
    }

    const testEmbedding = sample[0].combined_embedding;

    // Test vector search function
    const { data: results, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: testEmbedding,
      match_threshold: 0.1,
      match_count: 5
    });

    if (searchError) {
      console.log('❌ Vector search still failing:', searchError.message);
    } else {
      console.log(`✅ Vector search works! Found ${results ? results.length : 0} results`);

      if (results && results.length > 0) {
        console.log(`   Best matches:`);
        results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title_name_en} (similarity: ${result.similarity?.toFixed(3)})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 EMBEDDING MIGRATION SCRIPT');
  console.log('='.repeat(50));

  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied!');
  }

  console.log(`📦 Batch size: ${batchSize}`);

  // Step 1: Analyze migration needs
  const analysis = await analyzeMigrationNeeds();
  if (!analysis) {
    console.log('❌ Cannot proceed without analysis');
    return;
  }

  if (analysis.estimatedNeedsMigration === 0) {
    console.log('✅ No migration needed - all embeddings already in correct format');
    await testVectorOperationsAfterMigration();
    return;
  }

  console.log(`\n📋 MIGRATION PLAN:`);
  console.log(`   • Process ${analysis.estimatedNeedsMigration} embeddings`);
  console.log(`   • Convert JSON strings to vector(1536) format`);
  console.log(`   • Batch size: ${batchSize} titles at a time`);

  if (isDryRun) {
    console.log('\n🧪 DRY RUN: Testing migration process...');
  } else {
    console.log('\n⚠️  PROCEED WITH MIGRATION? This will modify your database.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Step 2: Process in batches
  let offset = 0;
  let totalProcessed = 0;
  const allErrors = [];

  while (true) {
    const result = await migrateEmbeddingsBatch(offset, batchSize);

    if (!result.success) {
      console.log('❌ Migration failed');
      break;
    }

    totalProcessed += result.processed;
    allErrors.push(...result.errors);

    if (result.errors.length > 0) {
      console.log(`⚠️  ${result.errors.length} errors in this batch`);
    }

    if (!result.hasMore) {
      console.log('✅ All batches processed');
      break;
    }

    offset += batchSize;

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 3: Summary
  console.log(`\n📊 MIGRATION SUMMARY:`);
  console.log(`   • Total processed: ${totalProcessed}`);
  console.log(`   • Total errors: ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    allErrors.slice(0, 10).forEach(error => console.log(`   • ${error}`));
    if (allErrors.length > 10) {
      console.log(`   • ... and ${allErrors.length - 10} more errors`);
    }
  }

  // Step 4: Test vector operations
  if (!isDryRun && totalProcessed > 0) {
    await testVectorOperationsAfterMigration();
  }

  console.log(`\n✅ Migration ${isDryRun ? 'simulation' : 'completed'}`);
}

main().catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});