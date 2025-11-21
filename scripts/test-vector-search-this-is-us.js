/**
 * Test vector search to see if "I Became a Doting Father" appears
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Missing required environment variable: OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function testVectorSearch() {
  console.log('🔍 Testing vector search for "This Is Us"...\n');

  // Generate embedding for "This Is Us"
  console.log('📝 Generating embedding for "This Is Us"...');
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: 'This Is Us'
  });

  const embedding = response.data[0].embedding;
  console.log(`✅ Generated ${embedding.length}-dimension embedding\n`);

  // Test with different thresholds
  const thresholds = [0.5, 0.6, 0.7];

  for (const threshold of thresholds) {
    console.log(`🔍 Testing with threshold ${threshold}:`);

    const { data, error } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 30
    });

    if (error) {
      console.error(`   ❌ Error:`, error);
      continue;
    }

    console.log(`   Found ${data.length} titles`);

    // Check if "I Became a Doting Father" is in the results
    const dotingFather = data.find(t => t.title_name_en === 'I Became a Doting Father');

    if (dotingFather) {
      console.log(`   ✅ "I Became a Doting Father" FOUND!`);
      console.log(`      Similarity: ${dotingFather.similarity}`);
      console.log(`      Rank: ${data.indexOf(dotingFather) + 1} / ${data.length}`);
    } else {
      console.log(`   ❌ "I Became a Doting Father" NOT in results`);
    }

    if (data.length > 0) {
      console.log(`   Top 3 matches:`);
      data.slice(0, 3).forEach((t, i) => {
        console.log(`      ${i + 1}. ${t.title_name_en} (${t.similarity.toFixed(3)})`);
      });
    }

    console.log('');
  }
}

testVectorSearch();
