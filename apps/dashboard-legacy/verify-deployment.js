/**
 * Deployment Verification Script
 * Tests Enhanced Personality deployment with 3 sample queries
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const TEST_EMAIL = process.env.TEST_EMAIL || 'sungho@kstorybridge.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD;

const TEST_QUERIES = [
  {
    query: "I'm looking for character-driven content",
    type: "Discovery"
  },
  {
    query: "Tell me about First Love",
    type: "Information"
  },
  {
    query: "What's the difference between romance and thriller webtoons?",
    type: "Comparison"
  }
];

async function verifyDeployment() {
  console.log('🚀 Enhanced Personality Deployment Verification');
  console.log('='.repeat(60));
  console.log();

  if (!TEST_PASSWORD) {
    console.error('❌ Error: TEST_PASSWORD environment variable required');
    console.log('   Usage: TEST_EMAIL="sungho@kstorybridge.com" TEST_PASSWORD="..." node verify-deployment.js');
    process.exit(1);
  }

  // Authenticate
  console.log('🔐 Authenticating...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError || !authData.session) {
    console.error('❌ Authentication failed:', authError?.message);
    process.exit(1);
  }

  console.log(`✅ Authenticated as ${TEST_EMAIL}\n`);

  const authToken = authData.session.access_token;

  // Test each query
  let successCount = 0;
  let enthusiasmDetected = 0;

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`📝 Test ${i + 1}/3: ${test.type} Query`);
    console.log(`   Query: "${test.query}"`);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: test.query }
          ]
        })
      });

      if (!response.ok) {
        console.log(`   ❌ Failed (HTTP ${response.status})`);
        continue;
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  fullResponse += data.text;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Check for enthusiasm markers
      const enthusiasmMarkers = [
        'such a rich area',
        'Oh,',
        'Let me tell you why',
        "I'm thrilled",
        "What hooked me",
        "love that you're",
        "Let's explore",
        "I'm curious"
      ];

      const hasEnthusiasm = enthusiasmMarkers.some(marker =>
        fullResponse.toLowerCase().includes(marker.toLowerCase())
      );

      if (hasEnthusiasm) {
        enthusiasmDetected++;
        console.log(`   ✅ Success (${fullResponse.length} chars, enthusiasm detected)`);
      } else {
        console.log(`   ⚠️  Success (${fullResponse.length} chars, no enthusiasm markers)`);
      }

      // Show first 150 characters
      console.log(`   Preview: "${fullResponse.substring(0, 150)}..."`);

      successCount++;

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log();
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful queries: ${successCount}/3`);
  console.log(`🎭 Enthusiasm detected: ${enthusiasmDetected}/3`);
  console.log();

  if (successCount === 3 && enthusiasmDetected >= 2) {
    console.log('✅ DEPLOYMENT VERIFIED - Enhanced Personality is active!');
    console.log('   Next: Check edge function logs for "🎭 Using ENHANCED personality prompt"');
    process.exit(0);
  } else if (successCount === 3) {
    console.log('⚠️  PARTIAL SUCCESS - Queries work but enthusiasm markers not detected');
    console.log('   Action: Check edge function logs to verify personality prompt');
    process.exit(1);
  } else {
    console.log('❌ DEPLOYMENT ISSUE - Some queries failed');
    console.log('   Action: Check edge function logs for errors');
    process.exit(1);
  }
}

verifyDeployment().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
