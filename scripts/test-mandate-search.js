// Test script for mandate matcher
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dlrnrgcoguxlkkcitlpd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testMandateSearch() {
  console.log('🔍 Testing mandate search...\n');

  // 1. Check if titles have embeddings
  console.log('1️⃣ Checking titles with embeddings...');
  const { data: titlesData, error: titlesError, count } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_embedding', { count: 'exact', head: false })
    .not('title_embedding', 'is', null)
    .limit(5);

  if (titlesError) {
    console.error('❌ Error fetching titles:', titlesError);
    return;
  }

  console.log(`✅ Found ${count} titles with embeddings`);
  if (titlesData && titlesData.length > 0) {
    console.log('Sample titles:');
    titlesData.forEach(t => {
      console.log(`  - ${t.title_name_en} (${t.title_id})`);
    });
  }
  console.log('');

  // 2. Test the edge function
  console.log('2️⃣ Testing edge function with sample mandate...');
  const testMandate = 'Looking for action-thriller with strong female lead, Korean setting';

  const { data: searchData, error: searchError } = await supabase.functions.invoke('mandate-matcher', {
    body: {
      mandate_text: testMandate,
      user_email: 'test@example.com',
      limit: 5
    }
  });

  if (searchError) {
    console.error('❌ Edge function error:', searchError);
    return;
  }

  if (searchData.error) {
    console.error('❌ Edge function returned error:', searchData.error);
    console.error('Details:', searchData.details);
    return;
  }

  console.log('✅ Edge function response:');
  console.log(`  - Results: ${searchData.results?.length || 0}`);
  console.log(`  - Processing time: ${searchData.processing_time_ms}ms`);
  console.log(`  - Cost: $${searchData.cost_estimate?.toFixed(6) || '0'}`);

  if (searchData.results && searchData.results.length > 0) {
    console.log('\nTop matches:');
    searchData.results.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.title_name_en} (${result.match_score}%)`);
    });
  } else {
    console.log('\n⚠️ No results returned');
  }
}

testMandateSearch().catch(console.error);
