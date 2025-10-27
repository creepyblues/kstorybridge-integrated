/**
 * Phase 1 Only Testing Script - FORMAL BASELINE
 *
 * Tests 15 queries with FORMAL BASELINE variant only (USE_FORMAL_BASELINE=true)
 * after clearing conversation history to ensure pure formal responses.
 *
 * This script re-runs Phase 1 after identifying that conversation history
 * was contaminating the formal baseline responses.
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
// Use environment variable or production default (matches .env.local)
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// Test user credentials (use a real test buyer account)
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

// 15 Test queries covering all intent types (same as three-way test)
const TEST_QUERIES = [
  // DISCOVERY (5 queries)
  {
    id: 1,
    query: "I'm looking for character-driven Korean content with strong emotional arcs",
    intent: "discovery",
    description: "Discovery query with specific story craft elements"
  },
  {
    id: 2,
    query: "Show me action titles",
    intent: "discovery",
    description: "Simple discovery query by genre"
  },
  {
    id: 3,
    query: "romantic webtoon",
    intent: "discovery",
    description: "Short discovery query (2 words)"
  },
  {
    id: 4,
    query: "I want something dark and psychological",
    intent: "discovery",
    description: "Discovery by tone and theme"
  },
  {
    id: 5,
    query: "Find me stories about family dynamics",
    intent: "discovery",
    description: "Discovery by theme/subject"
  },

  // INFORMATION (3 queries)
  {
    id: 6,
    query: "Tell me about First Love",
    intent: "information",
    description: "Information query about specific title"
  },
  {
    id: 7,
    query: "What's the story about Bride of the Water God?",
    intent: "information",
    description: "Information query with 'what's the story' pattern"
  },
  {
    id: 8,
    query: "First Love",
    intent: "information",
    description: "Single title name (minimal query)"
  },

  // COMPARISON (2 queries)
  {
    id: 9,
    query: "What's the difference between Korean romance webtoons and Korean thriller webtoons?",
    intent: "comparison",
    description: "Genre comparison query"
  },
  {
    id: 10,
    query: "How does First Love compare to other romance titles?",
    intent: "comparison",
    description: "Title comparison query"
  },

  // RECOMMENDATION (3 queries)
  {
    id: 11,
    query: "I need something for Netflix that can work as a limited series",
    intent: "recommendation",
    description: "Recommendation with business context"
  },
  {
    id: 12,
    query: "What would you recommend for a female 25-34 audience?",
    intent: "recommendation",
    description: "Recommendation by target audience"
  },
  {
    id: 13,
    query: "I'm developing for Apple TV+, what fits their brand?",
    intent: "recommendation",
    description: "Platform-specific recommendation"
  },

  // FOLLOW-UP (2 queries)
  {
    id: 14,
    query: "Tell me more",
    intent: "follow-up",
    description: "Generic follow-up (tests context handling)"
  },
  {
    id: 15,
    query: "What else is similar?",
    intent: "follow-up",
    description: "Similarity-based follow-up"
  }
];

async function authenticate() {
  console.log('🔐 Authenticating...');

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables are required');
  }

  // Validate anon key format (basic JWT check)
  if (!SUPABASE_ANON_KEY || !SUPABASE_ANON_KEY.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_ANON_KEY - must be a valid JWT token');
  }

  console.log('   Using Supabase URL:', SUPABASE_URL);
  console.log('   Using anon key prefix:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.message?.includes('Invalid API key') || error.message?.includes('API key')) {
      console.error('💡 Hint: The anon key may be outdated. Check .env.local for the current key.');
    }
    throw error;
  }

  console.log('✅ Authenticated successfully');
  console.log('   User:', data.session.user.email);
  return data.session.access_token;
}

async function sendChatMessage(authToken, message) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = { error: errorText };
    }
    throw new Error(`Edge function error: ${JSON.stringify(errorDetails)}`);
  }

  // Handle streaming SSE response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let fullResponse = '';
  let suggestedQueries = [];
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          // Check for stream end
          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(data);

            // Accumulate text chunks (edge function sends type: 'text', text: '...')
            if (parsed.type === 'text' && parsed.text) {
              fullResponse += parsed.text;
            }

            // Extract suggested queries (sent after completion)
            if (parsed.type === 'suggestions' && parsed.suggestedQueries) {
              suggestedQueries = parsed.suggestedQueries;
            }

            // Handle complete response (if sent as single event - legacy support)
            if (parsed.reply) {
              fullResponse = parsed.reply;
            }
            if (parsed.suggestedQueries) {
              suggestedQueries = parsed.suggestedQueries;
            }
          } catch (parseError) {
            // Skip malformed JSON lines (common in SSE streams)
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Validate we got a response
  if (!fullResponse || fullResponse.trim().length === 0) {
    throw new Error('No content received from streaming response');
  }

  return {
    reply: fullResponse,
    suggestedQueries: suggestedQueries || []
  };
}

async function runTests(authToken) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing FORMAL BASELINE variant`);
  console.log(`${'='.repeat(80)}\n`);

  const results = [];

  for (const testCase of TEST_QUERIES) {
    console.log(`\n📝 Test ${testCase.id}/15: ${testCase.description}`);
    console.log(`   Intent: ${testCase.intent}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Testing...`);

    const startTime = Date.now();

    try {
      const response = await sendChatMessage(authToken, testCase.query);
      const responseTime = Date.now() - startTime;

      console.log(`   ✅ Response received (${responseTime}ms)`);
      console.log(`   📊 Response length: ${response.reply?.length || 0} characters`);

      // Check for conversational markers (these should NOT be present)
      const conversationalMarkers = [
        "I'm excited", "I'm curious", "What hooked me", "Love it",
        "Great question", "continue our discussion", "Let me tell you why"
      ];

      const foundMarkers = conversationalMarkers.filter(marker =>
        response.reply.toLowerCase().includes(marker.toLowerCase())
      );

      if (foundMarkers.length > 0) {
        console.log(`   ⚠️  WARNING: Found conversational markers: ${foundMarkers.join(', ')}`);
      } else {
        console.log(`   ✅ VERIFIED: No conversational markers detected`);
      }

      results.push({
        testId: testCase.id,
        query: testCase.query,
        intent: testCase.intent,
        description: testCase.description,
        response: response.reply,
        suggestedQueries: response.suggestedQueries || [],
        responseTime,
        timestamp: new Date().toISOString(),
        variant: 'FORMAL',
        conversationalMarkersFound: foundMarkers
      });

      // Wait 2 seconds between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        testId: testCase.id,
        query: testCase.query,
        intent: testCase.intent,
        description: testCase.description,
        error: error.message,
        timestamp: new Date().toISOString(),
        variant: 'FORMAL'
      });
    }
  }

  return results;
}

function saveResults(formalResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `phase-2-formal-retest-${timestamp}.json`;

  const output = {
    metadata: {
      testDate: new Date().toISOString(),
      totalQueries: TEST_QUERIES.length,
      testType: 'Phase 1 Retest - FORMAL BASELINE Only',
      variant: 'FORMAL BASELINE (USE_FORMAL_BASELINE=true)',
      purpose: 'Retest after clearing conversation history to ensure pure formal responses',
      chatHistoryCleared: true
    },
    formalResults,
    testQueries: TEST_QUERIES
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to: ${filename}`);
  console.log(`   Total responses: ${TEST_QUERIES.length}`);

  return filename;
}

async function main() {
  try {
    console.log('🚀 Phase 1 FORMAL BASELINE Retest');
    console.log('==================================\n');
    console.log('Purpose: Verify formal baseline after clearing conversation history\n');
    console.log('⚠️  Prerequisites:');
    console.log('   1. Chat history must be cleared (run clear-chat-history.js first)');
    console.log('   2. USE_FORMAL_BASELINE flag must be set to true\n');
    console.log('Total runtime: ~20 minutes (15 queries × 1 variant)\n');

    // Step 1: Authenticate
    const authToken = await authenticate();

    console.log('\n⚠️  Starting FORMAL baseline testing in 5 seconds...');
    console.log('Press Ctrl+C to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Set USE_FORMAL_BASELINE flag
    console.log('\n' + '='.repeat(80));
    console.log('📋 PHASE 1: FORMAL BASELINE (Non-Conversational)');
    console.log('='.repeat(80));
    console.log('\n🔄 Setting USE_FORMAL_BASELINE=true...\n');

    try {
      execSync('npx supabase secrets set USE_FORMAL_BASELINE=true --project-ref dlrnrgcoguxlkkcitlpd', {
        stdio: 'inherit'
      });
      console.log('\n✅ Flag set successfully');
    } catch (error) {
      console.error('\n❌ Failed to set flag:', error.message);
      throw new Error('Failed to enable USE_FORMAL_BASELINE flag');
    }

    console.log('\n⏳ Waiting 60 seconds for edge function to reload...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Step 3: Run tests
    const formalResults = await runTests(authToken);

    // Step 4: Save results
    const filename = saveResults(formalResults);

    // Step 5: Analyze results
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ PHASE 1 RETEST COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Results saved to: ${filename}`);

    // Check for conversational markers in results
    const responsesWithMarkers = formalResults.filter(r =>
      r.conversationalMarkersFound && r.conversationalMarkersFound.length > 0
    );

    console.log('\n📋 Quality Check:');
    console.log(`   Total responses: ${formalResults.length}`);
    console.log(`   Responses with conversational markers: ${responsesWithMarkers.length}`);
    console.log(`   Pure formal responses: ${formalResults.length - responsesWithMarkers.length}`);

    if (responsesWithMarkers.length === 0) {
      console.log('\n✅ SUCCESS: All responses are pure formal (no conversational markers)');
      console.log('   Ready to merge with ORIGINAL and ENHANCED results for three-way analysis');
    } else {
      console.log('\n⚠️  WARNING: Some responses still contain conversational markers:');
      responsesWithMarkers.forEach(r => {
        console.log(`   - Query ${r.testId}: ${r.conversationalMarkersFound.join(', ')}`);
      });
      console.log('\n   Further investigation needed.');
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Review the JSON results file');
    console.log('   2. If pure formal responses: Merge with original three-way test results');
    console.log('   3. Proceed with scoring and analysis');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();
