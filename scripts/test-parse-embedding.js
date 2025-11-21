/**
 * Test parsing string embedding back to array
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testParsing() {
  console.log('🧪 Testing Embedding String Parsing\n');

  const { data, error } = await supabase
    .from('titles')
    .select('title_name_en, combined_embedding')
    .eq('title_name_en', 'I Became a Doting Father')
    .single();

  if (error || !data) {
    console.error('Error:', error);
    return;
  }

  const embString = data.combined_embedding;

  console.log(`Raw type: ${typeof embString}`);
  console.log(`Raw length: ${embString.length} characters`);
  console.log(`First 150 chars: ${embString.substring(0, 150)}...\n`);

  // Parse the JSON string into array
  try {
    const embArray = JSON.parse(embString);

    console.log(`✅ Successfully parsed!`);
    console.log(`Parsed type: ${typeof embArray}`);
    console.log(`Is array: ${Array.isArray(embArray)}`);
    console.log(`Array length: ${embArray.length} dimensions`);
    console.log(`First 5 values: [${embArray.slice(0, 5).map(v => v.toFixed(6)).join(', ')}]`);
    console.log(`Last 5 values: [${embArray.slice(-5).map(v => v.toFixed(6)).join(', ')}]\n`);

    // Validate
    if (embArray.length === 1536) {
      console.log(`✅ CORRECT! The embedding IS 1536 dimensions when parsed!`);
      console.log(`\n📊 DIAGNOSIS:`);
      console.log(`   - Embeddings are stored CORRECTLY in database`);
      console.log(`   - Supabase JS client returns them as JSON strings`);
      console.log(`   - Need to JSON.parse() before using\n`);
    } else {
      console.log(`❌ Wrong dimension after parsing: ${embArray.length}`);
    }

  } catch (parseError) {
    console.error('❌ Parse error:', parseError.message);
  }
}

testParsing();
