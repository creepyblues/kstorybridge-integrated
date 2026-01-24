import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompNavigator() {
  console.log('Testing comp-navigator edge function...\n');

  const testRequest = {
    comp_titles: ['This Is Us'],
    user_email: 'sungho@kstorybridge.com',
    save_search: false
  };

  console.log('Request body:', JSON.stringify(testRequest, null, 2));

  try {
    const { data, error } = await supabase.functions.invoke('comp-navigator', {
      body: testRequest,
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (error) {
      console.error('\n❌ Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    
    if (data) {
      if (data.error) {
        console.error('\n❌ Edge function returned error:', data.error);
      } else {
        console.log('\n✅ Success!');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.error('\n❌ Exception:', e.message);
    console.error('Full error:', e);
  }
}

testCompNavigator();
