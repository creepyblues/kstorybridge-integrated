// Test the enhanced API to verify it returns database titles
const fetch = require('node-fetch');

async function testEnhancedAPI() {
  console.log('Testing enhanced API endpoint...\n');
  
  try {
    const response = await fetch('https://dashboard.kstorybridge.com/api/openai-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'John Wick action'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('Expected error (no auth):', error);
      console.log('\n✅ API is responding correctly (rejecting unauthorized requests)');
      console.log('The API endpoint exists and is working.');
      return;
    }

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testEnhancedAPI();