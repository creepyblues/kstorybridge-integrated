/**
 * Test write/read cycle to diagnose embedding corruption
 * Writes a 1536-dim embedding and immediately reads it back to check dimensions
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

async function testWriteReadCycle() {
  console.log('🧪 Testing Write/Read Embedding Cycle\n');
  console.log('=' + '='.repeat(60) + '\n');

  // Step 1: Generate a fresh embedding from OpenAI
  console.log('1️⃣ Generating embedding from OpenAI...');
  const testText = 'Test Title - A Korean drama about family';

  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: testText
  });

  const freshEmbedding = response.data[0].embedding;
  console.log(`   ✅ Generated: ${freshEmbedding.length} dimensions\n`);

  // Step 2: Find a test title to update
  console.log('2️⃣ Finding test title...');
  const { data: testTitle, error: findError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding')
    .eq('title_name_en', 'I Became a Doting Father')
    .single();

  if (findError || !testTitle) {
    console.error('   ❌ Error finding title:', findError);
    return;
  }

  console.log(`   ✅ Found: "${testTitle.title_name_en}"`);
  const currentDim = testTitle.combined_embedding ? testTitle.combined_embedding.length : 0;
  console.log(`   Current embedding: ${currentDim} dimensions\n`);

  // Step 3: Write the fresh embedding
  console.log('3️⃣ Writing fresh 1536-dim embedding to database...');
  console.log(`   Embedding sample: [${freshEmbedding.slice(0, 3).map(v => v.toFixed(6)).join(', ')}, ...]`);

  const { error: writeError } = await supabase
    .from('titles')
    .update({
      combined_embedding: freshEmbedding,
      embedding_model: 'text-embedding-ada-002',
      embedding_updated_at: new Date().toISOString()
    })
    .eq('title_id', testTitle.title_id);

  if (writeError) {
    console.error('   ❌ Write error:', writeError);
    return;
  }

  console.log('   ✅ Write successful\n');

  // Step 4: Immediately read it back
  console.log('4️⃣ Reading embedding back from database...');

  const { data: readBack, error: readError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding')
    .eq('title_id', testTitle.title_id)
    .single();

  if (readError || !readBack) {
    console.error('   ❌ Read error:', readError);
    return;
  }

  const readDim = readBack.combined_embedding ? readBack.combined_embedding.length : 0;
  console.log(`   Read back: ${readDim} dimensions`);
  console.log(`   Sample: [${readBack.combined_embedding.slice(0, 3).map(v => v.toFixed(6)).join(', ')}, ...]\n`);

  // Step 5: Compare
  console.log('5️⃣ Comparison:');
  console.log(`   Written:   ${freshEmbedding.length} dimensions`);
  console.log(`   Read back: ${readDim} dimensions`);

  if (readDim === 1536) {
    console.log('   ✅ MATCH! Write/read cycle is working correctly.\n');

    // Compare first few values to ensure data integrity
    const valuesMatch = freshEmbedding.slice(0, 5).every((v, i) =>
      Math.abs(v - readBack.combined_embedding[i]) < 0.000001
    );

    if (valuesMatch) {
      console.log('   ✅ Values also match! No corruption detected.');
    } else {
      console.log('   ⚠️  Dimensions match but values differ!');
      console.log(`      Written: [${freshEmbedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}]`);
      console.log(`      Read:    [${readBack.combined_embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}]`);
    }
  } else {
    console.log('   ❌ MISMATCH! Corruption detected during write/read cycle.\n');
    console.log('   📊 Diagnosis:');
    console.log(`      - Wrote ${freshEmbedding.length} dimensions`);
    console.log(`      - Got back ${readDim} dimensions`);
    console.log(`      - Difference: ${readDim - freshEmbedding.length} extra dimensions`);
    console.log(`      - Ratio: ${(readDim / freshEmbedding.length).toFixed(2)}x\n`);

    // Check if it's a string/text format issue
    if (typeof readBack.combined_embedding === 'string') {
      console.log('   ⚠️  WARNING: Embedding returned as STRING, not array!');
      console.log(`      Type: ${typeof readBack.combined_embedding}`);
    } else if (Array.isArray(readBack.combined_embedding)) {
      console.log(`   Type check: Array ✅`);

      // Check for nested arrays
      const firstElement = readBack.combined_embedding[0];
      if (Array.isArray(firstElement)) {
        console.log('   ⚠️  WARNING: Nested array detected!');
        console.log(`      First element is array of length: ${firstElement.length}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

testWriteReadCycle().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
