// Direct REST API test to bypass Supabase JS library
export async function testDirectApiCall() {
  console.log('🔧 DIRECT API: Testing direct REST API call...');

  try {
    const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

    const url = `${SUPABASE_URL}/rest/v1/titles?select=title_id,title_name_en,title_name_kr&limit=5`;

    console.log('🔧 DIRECT API: Making fetch request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    console.log('🔧 DIRECT API: Response status:', response.status);
    console.log('🔧 DIRECT API: Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔧 DIRECT API: Error response:', errorText);
      return { titles: [], error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('🔧 DIRECT API: Success! Got', data.length, 'titles');
    console.log('🔧 DIRECT API: Sample data:', data.slice(0, 2));

    return { titles: data, error: null };

  } catch (error) {
    console.error('🔧 DIRECT API: Fetch error:', error);
    return { titles: [], error: error.message };
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).testDirectApiCall = testDirectApiCall;
}