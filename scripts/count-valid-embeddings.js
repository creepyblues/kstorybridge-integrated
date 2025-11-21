/**
 * Count how many titles have valid vs invalid embeddings
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function countEmbeddings() {
  console.log('📊 Counting embeddings in titles table...\n');

  // Get all titles with embeddings
  const { data: titles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding')
    .not('combined_embedding', 'is', null)
    .limit(1000);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total titles with combined_embedding: ${titles.length}\n`);

  // Also check how many have NULL embeddings
  const { count: nullCount } = await supabase
    .from('titles')
    .select('*', { count: 'exact', head: true })
    .is('combined_embedding', null);

  console.log(`Titles with NULL embedding: ${nullCount}\n`);

  const dimensionCounts = {};
  const validTitles = [];
  const invalidTitles = [];

  for (const title of titles) {
    const dim = title.combined_embedding ? title.combined_embedding.length : 0;

    dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;

    if (dim === 1536) {
      validTitles.push(title.title_name_en);
    } else {
      invalidTitles.push({ name: title.title_name_en, dim });
    }
  }

  console.log('Embedding Dimensions Distribution:');
  Object.keys(dimensionCounts).sort((a, b) => b - a).forEach(dim => {
    const count = dimensionCounts[dim];
    const isValid = dim == 1536 ? '✅' : '❌';
    console.log(`  ${isValid} ${dim} dimensions: ${count} titles`);
  });

  console.log(`\n✅ Valid embeddings (1536 dim): ${validTitles.length}`);
  console.log(`❌ Invalid embeddings: ${invalidTitles.length}\n`);

  if (validTitles.length > 0 && validTitles.length <= 20) {
    console.log('Valid titles:');
    validTitles.forEach(t => console.log(`  - ${t}`));
  }

  if (invalidTitles.length > 0 && invalidTitles.length <= 20) {
    console.log('\nInvalid titles:');
    invalidTitles.forEach(t => console.log(`  - ${t.name} (${t.dim} dim)`));
  } else if (invalidTitles.length > 20) {
    console.log(`\nShowing first 10 invalid titles:`);
    invalidTitles.slice(0, 10).forEach(t => console.log(`  - ${t.name} (${t.dim} dim)`));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (validTitles.length === 0) {
    console.log('⚠️  NO VALID EMBEDDINGS FOUND!');
    console.log('   This explains why searches return 0 results.');
    console.log('   All embeddings need to be regenerated.');
  } else {
    console.log(`✅ ${validTitles.length} titles have valid embeddings and can be searched.`);
    if (invalidTitles.length > 0) {
      console.log(`⚠️  ${invalidTitles.length} titles have invalid embeddings and won't appear in searches.`);
    }
  }
}

countEmbeddings();
