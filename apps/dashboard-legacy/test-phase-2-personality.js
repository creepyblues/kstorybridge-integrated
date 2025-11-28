/**
 * Phase 2 Enhanced Personality Three-Way A/B Testing Script
 *
 * Tests 15 queries with THREE personality variants:
 * 1. FORMAL BASELINE (USE_FORMAL_BASELINE=true) - Pure informational, no conversational markers
 * 2. ORIGINAL (both flags false) - Conversational with story craft language
 * 3. ENHANCED (ENABLE_NEW_PERSONALITY=true) - Enthusiastic "story nerd" personality
 *
 * Saves all 45 responses for comprehensive comparison and scoring
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

// 15 Test queries covering all intent types
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
            // Only log in verbose mode to avoid cluttering output
            // console.warn('  ⚠️ Skipped malformed SSE data:', data.substring(0, 50) + '...');
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

async function runTests(authToken, variantName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing ${variantName} variant`);
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

      results.push({
        testId: testCase.id,
        query: testCase.query,
        intent: testCase.intent,
        description: testCase.description,
        response: response.reply,
        suggestedQueries: response.suggestedQueries || [],
        responseTime,
        timestamp: new Date().toISOString(),
        variant: variantName
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
        variant: variantName
      });
    }
  }

  return results;
}

function saveResults(formalResults, originalResults, enhancedResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `phase-2-test-results-three-way-${timestamp}.json`;

  const output = {
    metadata: {
      testDate: new Date().toISOString(),
      totalQueries: TEST_QUERIES.length,
      totalResponses: TEST_QUERIES.length * 3,
      testType: 'Three-Way A/B Test',
      variants: [
        'FORMAL BASELINE (USE_FORMAL_BASELINE=true)',
        'ORIGINAL conversational (both flags false)',
        'ENHANCED enthusiastic (ENABLE_NEW_PERSONALITY=true)'
      ]
    },
    formalResults,
    originalResults,
    enhancedResults,
    testQueries: TEST_QUERIES
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to: ${filename}`);
  console.log(`   Total responses: ${TEST_QUERIES.length * 3} (${TEST_QUERIES.length} queries × 3 variants)`);

  return filename;
}

async function main() {
  try {
    console.log('🚀 Phase 2 Enhanced Personality Three-Way A/B Testing');
    console.log('=====================================================\n');
    console.log('Testing THREE personality variants:');
    console.log('  1️⃣  FORMAL BASELINE (non-conversational)');
    console.log('  2️⃣  ORIGINAL (conversational with story craft language)');
    console.log('  3️⃣  ENHANCED (enthusiastic "story nerd" personality)\n');
    console.log('Total runtime: ~60-75 minutes (15 queries × 3 variants)\n');

    // Step 1: Authenticate
    const authToken = await authenticate();

    console.log('\n⚠️  Starting three-way testing in 5 seconds...');
    console.log('Press Ctrl+C to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========== PHASE 1: FORMAL BASELINE ==========
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 PHASE 1/3: FORMAL BASELINE (Non-Conversational)');
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

    const formalResults = await runTests(authToken, 'FORMAL');

    // ========== PHASE 2: ORIGINAL CONVERSATIONAL ==========
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 PHASE 2/3: ORIGINAL (Conversational)');
    console.log('='.repeat(80));
    console.log('\n🔄 Disabling USE_FORMAL_BASELINE (both flags OFF)...\n');

    try {
      execSync('npx supabase secrets set USE_FORMAL_BASELINE=false --project-ref dlrnrgcoguxlkkcitlpd', {
        stdio: 'inherit'
      });
      console.log('\n✅ Flag disabled successfully');
    } catch (error) {
      console.error('\n❌ Failed to set flag:', error.message);
      throw new Error('Failed to disable USE_FORMAL_BASELINE flag');
    }

    console.log('\n⏳ Waiting 60 seconds for edge function to reload...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    const originalResults = await runTests(authToken, 'ORIGINAL');

    // ========== PHASE 3: ENHANCED ENTHUSIASTIC ==========
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 PHASE 3/3: ENHANCED (Enthusiastic "Story Nerd")');
    console.log('='.repeat(80));
    console.log('\n🔄 Enabling ENABLE_NEW_PERSONALITY=true...\n');

    try {
      execSync('npx supabase secrets set ENABLE_NEW_PERSONALITY=true --project-ref dlrnrgcoguxlkkcitlpd', {
        stdio: 'inherit'
      });
      console.log('\n✅ Flag enabled successfully');
    } catch (error) {
      console.error('\n❌ Failed to set flag:', error.message);
      throw new Error('Failed to enable ENABLE_NEW_PERSONALITY flag');
    }

    console.log('\n⏳ Waiting 60 seconds for edge function to reload...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    const enhancedResults = await runTests(authToken, 'ENHANCED');

    // ========== SAVE RESULTS ==========
    const filename = saveResults(formalResults, originalResults, enhancedResults);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ THREE-WAY A/B TESTING COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Results saved to: ${filename}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Review the JSON results file (45 total responses)');
    console.log('   2. Score all responses on 5 metrics (1-5 scale)');
    console.log('   3. Calculate THREE improvement percentages:');
    console.log('      - FORMAL → ORIGINAL (conversational baseline impact)');
    console.log('      - ORIGINAL → ENHANCED (incremental enhancement)');
    console.log('      - FORMAL → ENHANCED (total improvement)');
    console.log('   4. Create PHASE_2_TEST_RESULTS.md with three-way analysis');
    console.log('   5. Make go/no-go recommendation');
    console.log('\n💡 Tip: Look for "Let me tell you why..." in FORMAL (should be absent),');
    console.log('   ORIGINAL (present), and ENHANCED (present with "Oh, you found a gem!")');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();
