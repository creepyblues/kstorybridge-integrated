/**
 * Test comp-navigator exactly as dashboard calls it
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDashboardCall() {
  console.log('Testing exact dashboard call...\n');

  const requestBody = {
    comp_titles: ['This Is Us'],
    user_email: 'sungho@kstorybridge.com',
    save_search: true,
    search_name: 'Test Search'
  };

  console.log('Request:', JSON.stringify(requestBody, null, 2));

  const { data, error } = await supabase.functions.invoke('comp-navigator', {
    body: requestBody
  });

  console.log('\nResponse:');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }

  // Also check if anything was saved to comp_searches
  console.log('\nChecking comp_searches table:');
  const { data: searches, error: searchError } = await supabase
    .from('comp_searches')
    .select('*')
    .eq('user_email', 'sungho@kstorybridge.com')
    .order('created_at', { ascending: false })
    .limit(5);

  if (searchError) {
    console.error('Search query error:', searchError);
  } else {
    console.log(`Found ${searches.length} recent searches`);
    searches.forEach(s => {
      console.log(`  - "${s.search_name}": ${s.result_count} results, avg score: ${s.avg_match_score}`);
    });
  }
}

testDashboardCall();
