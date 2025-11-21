/**
 * Verify if regeneration actually worked by checking database directly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyDatabaseState() {
  console.log('🔍 Verifying actual database state...\n');

  // 1. Check "I Became a Doting Father" specifically
  console.log('1️⃣ Checking "I Became a Doting Father":');
  const { data: dotingFather, error: dfError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding, embedding_updated_at, updated_at')
    .eq('title_name_en', 'I Became a Doting Father')
    .single();

  if (dfError) {
    console.error('   ❌ Error:', dfError.message);
  } else if (dotingFather) {
    const emb = dotingFather.combined_embedding;
    const embType = typeof emb;
    const isArray = Array.isArray(emb);
    const dim = emb ? emb.length : 0;
    const status = dim === 1536 ? '✅ VALID' : dim === 0 ? '⚪ NULL' : '❌ INVALID';
    console.log(`   ${status} - Dimension: ${dim}`);
    console.log(`   Type: ${embType}, Is Array: ${isArray}`);

    if (embType === 'string') {
      console.log(`   ⚠️  WARNING: Embedding is a STRING (${dim} characters), not an array!`);
      console.log(`   First 100 chars: ${emb.substring(0, 100)}...`);
    } else if (isArray) {
      console.log(`   First 3 values: [${emb.slice(0, 3).map(v => typeof v === 'number' ? v.toFixed(6) : v).join(', ')}]`);
    }

    console.log(`   Last embedding update: ${dotingFather.embedding_updated_at || 'Never'}`);
    console.log(`   Last title update: ${dotingFather.updated_at}`);
    console.log('');
  }

  // 2. Get all titles and analyze dimensions
  console.log('2️⃣ Analyzing all titles:');
  const { data: allTitles, error: allError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding, embedding_updated_at')
    .limit(1000);

  if (allError) {
    console.error('   ❌ Error:', allError.message);
    return;
  }

  const dimensionCounts = {};
  const validTitles = [];
  const invalidTitles = [];
  const nullTitles = [];
  const recentUpdates = [];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const title of allTitles) {
    const dim = title.combined_embedding ? title.combined_embedding.length : 0;

    dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;

    if (dim === 1536) {
      validTitles.push(title.title_name_en);
    } else if (dim === 0) {
      nullTitles.push(title.title_name_en);
    } else {
      invalidTitles.push({ name: title.title_name_en, dim });
    }

    // Track recent updates
    if (title.embedding_updated_at && new Date(title.embedding_updated_at) > oneDayAgo) {
      recentUpdates.push({
        name: title.title_name_en,
        dim,
        updated: title.embedding_updated_at
      });
    }
  }

  console.log(`   Total titles: ${allTitles.length}\n`);

  console.log('   Embedding Dimensions Distribution:');
  Object.keys(dimensionCounts).sort((a, b) => b - a).forEach(dim => {
    const count = dimensionCounts[dim];
    const isDim = parseInt(dim);
    const status = isDim === 1536 ? '✅ Valid' : isDim === 0 ? '⚪ NULL' : '❌ Invalid';
    console.log(`   ${status} - ${dim} dimensions: ${count} titles`);
  });

  console.log(`\n   Summary:`);
  console.log(`   ✅ Valid (1536 dim): ${validTitles.length}`);
  console.log(`   ⚪ NULL embeddings: ${nullTitles.length}`);
  console.log(`   ❌ Invalid embeddings: ${invalidTitles.length}\n`);

  // 3. Show recent updates (last 24 hours)
  console.log('3️⃣ Recent embedding updates (last 24 hours):');
  if (recentUpdates.length === 0) {
    console.log('   ⚠️  NO RECENT UPDATES FOUND');
    console.log('   This suggests regeneration updates did NOT persist!\n');
  } else {
    console.log(`   Found ${recentUpdates.length} titles updated recently:`);
    recentUpdates.slice(0, 10).forEach(t => {
      const status = t.dim === 1536 ? '✅' : t.dim === 0 ? '⚪' : '❌';
      console.log(`   ${status} ${t.name} (${t.dim} dim) - ${new Date(t.updated).toLocaleString()}`);
    });
    if (recentUpdates.length > 10) {
      console.log(`   ... and ${recentUpdates.length - 10} more\n`);
    }
  }

  // 4. Final diagnosis
  console.log('\n' + '='.repeat(70));
  console.log('📊 DIAGNOSIS:');

  if (validTitles.length === 0 && nullTitles.length === 0 && invalidTitles.length > 0) {
    console.log('❌ CRITICAL: All embeddings are still corrupted!');
    console.log('   Regeneration did NOT persist to database.');
    console.log('   Possible causes:');
    console.log('   1. Database replication lag (wait 5-10 minutes)');
    console.log('   2. Transaction rollback or permission issue');
    console.log('   3. Updates going to wrong database/environment');
  } else if (validTitles.length > 0 && validTitles.length < allTitles.length) {
    console.log('⚠️  PARTIAL SUCCESS: Some titles regenerated, others still corrupted');
    console.log(`   Valid: ${validTitles.length}, Invalid: ${invalidTitles.length}, NULL: ${nullTitles.length}`);
  } else if (validTitles.length === allTitles.length) {
    console.log('✅ SUCCESS: All titles have valid 1536-dimension embeddings!');
  } else if (nullTitles.length === allTitles.length) {
    console.log('⚪ All embeddings are NULL - ready for regeneration');
  }

  console.log('='.repeat(70) + '\n');
}

verifyDatabaseState();
