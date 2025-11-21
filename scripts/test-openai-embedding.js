/**
 * Test OpenAI embedding generation to verify dimension
 */

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Missing required environment variable: OPENAI_API_KEY');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function testEmbedding() {
  console.log('🧪 Testing OpenAI embedding generation...\n');

  const testText = 'This Is Us - A heartwarming family drama about the lives of siblings';

  console.log(`Input text: "${testText}"\n`);

  try {
    console.log('📡 Calling OpenAI API...');
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testText
    });

    const embedding = response.data[0].embedding;

    console.log(`✅ API call successful\n`);
    console.log(`📊 Embedding dimensions: ${embedding.length}`);
    console.log(`📊 Expected dimensions: 1536`);
    console.log(`📊 Match: ${embedding.length === 1536 ? '✅ YES' : '❌ NO'}\n`);

    // Check first few values
    console.log(`First 5 values: ${embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}`);
    console.log(`Last 5 values: ${embedding.slice(-5).map(v => v.toFixed(6)).join(', ')}\n`);

    // Check for nulls or NaN
    const hasNull = embedding.some(v => v === null || v === undefined);
    const hasNaN = embedding.some(v => isNaN(v));

    console.log(`Contains null: ${hasNull ? '❌ YES' : '✅ NO'}`);
    console.log(`Contains NaN: ${hasNaN ? '❌ YES' : '✅ NO'}\n`);

    if (embedding.length !== 1536) {
      console.log('❌ CRITICAL: OpenAI returned wrong dimension!');
      console.log('   This indicates an API issue or wrong model.');
    } else {
      console.log('✅ OpenAI API is working correctly!');
      console.log('   The corruption must be happening during database update.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testEmbedding();
