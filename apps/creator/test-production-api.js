#!/usr/bin/env node

/**
 * Test script for production OpenAI API endpoint
 * Tests both local and deployed API endpoints
 */

import fetch from 'node-fetch';

// Configuration
const LOCAL_API = 'http://localhost:3000/api/openai-chat'; // Vercel dev server
const PROD_API = 'https://dashboard.kstorybridge.com/api/openai-chat'; // Production

// Test data
const TEST_REQUEST = {
  query: "recommend a romantic comedy webtoon",
  conversationHistory: []
};

// Fake JWT token for testing (replace with real token)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // You'll need a real token

async function testAPI(url, description) {
  console.log(`\n🧪 Testing ${description}...`);
  console.log(`📍 URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Origin': 'https://dashboard.kstorybridge.com'
      },
      body: JSON.stringify(TEST_REQUEST)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Response length: ${data.message?.length || 0} characters`);
    console.log(`💡 Suggested queries: ${data.suggestedQueries?.length || 0} items`);
    
    if (data.message) {
      console.log(`📝 First 100 chars: "${data.message.substring(0, 100)}..."`);
    }

    return true;
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return false;
  }
}

async function testCORS(url) {
  console.log(`\n🌐 Testing CORS for ${url}...`);

  try {
    // Test OPTIONS request
    const optionsResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://dashboard.kstorybridge.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log(`📊 OPTIONS Status: ${optionsResponse.status}`);
    console.log(`🔐 CORS Headers:`);
    console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers.get('access-control-allow-methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers.get('access-control-allow-headers')}`);

    return optionsResponse.status === 200;
  } catch (error) {
    console.log(`❌ CORS Test Error: ${error.message}`);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Environment Variables Check:');
  console.log('='.repeat(40));
  
  const vars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_KEY',
    'VITE_OPENAI_ENABLED'
  ];

  vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      if (varName.includes('KEY')) {
        console.log(`✅ ${varName}: ${value.substring(0, 10)}... (length: ${value.length})`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });
}

async function main() {
  console.log('🚀 OpenAI Production API Test');
  console.log('='.repeat(50));

  // Check environment variables
  await checkEnvironmentVariables();

  // Test CORS
  console.log('\n🌐 CORS Tests:');
  await testCORS(LOCAL_API);
  await testCORS(PROD_API);

  // Test API endpoints
  console.log('\n🧪 API Endpoint Tests:');
  
  if (TEST_TOKEN === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') {
    console.log('⚠️  WARNING: Using fake test token');
    console.log('   Get a real JWT token from Supabase dashboard session');
    console.log('   Check browser dev tools → Application → Local Storage → supabase.auth.token');
  }

  // Test local development server (if running)
  const localResult = await testAPI(LOCAL_API, 'Local Development Server');
  
  // Test production deployment
  const prodResult = await testAPI(PROD_API, 'Production Deployment');

  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('='.repeat(30));
  console.log(`🏠 Local API: ${localResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`🚀 Production API: ${prodResult ? '✅ Working' : '❌ Failed'}`);

  if (!localResult && !prodResult) {
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. For local testing: Run `vercel dev` in dashboard directory');
    console.log('2. For production: Check Vercel deployment and environment variables');
    console.log('3. Get real JWT token from browser dev tools');
    console.log('4. Verify you\'re in the allowed users list');
  }

  if (prodResult) {
    console.log('\n🎉 Production API is working!');
    console.log('Your OpenAI chatbot is ready for production use.');
  }
}

// Run tests
main().catch(console.error);