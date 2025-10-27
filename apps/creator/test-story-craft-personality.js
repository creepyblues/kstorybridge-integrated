/**
 * Story Craft Personality Test Suite
 * Validates Hollywood Showrunner personality implementation
 *
 * Tests the new Jinu personality focusing on:
 * - 70% story craft (character arcs, structure, themes)
 * - 30% business awareness (reactive to user signals)
 * - Real industry examples (no fictional experience)
 * - Casual, enthusiastic tone
 *
 * Run: SUPABASE_AUTH_TOKEN="token" node test-story-craft-personality.js
 */

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat-orchestrator`;

// IMPORTANT: Set your auth token before running
const AUTH_TOKEN = process.env.SUPABASE_AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ Error: SUPABASE_AUTH_TOKEN environment variable not set');
  console.log('\nTo get your auth token:');
  console.log('1. Open http://localhost:8081/buyers/chat in browser');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem(\'supabase.auth.token\')');
  console.log('4. Copy the token value');
  console.log('5. Run: SUPABASE_AUTH_TOKEN="your-token-here" node test-story-craft-personality.js\n');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${name}`);
  if (details) console.log(`   ${details}`);

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

/**
 * Send message to chat orchestrator
 */
async function sendMessage(messages, options = {}) {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        messages,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullResponse += parsed.text;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
}

/**
 * Test 1: Story Craft Focus (70%)
 * Response should lead with story elements, not business
 */
async function testStoryCraftFocus() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 1: Story Craft Primary Focus (70%)');
  console.log('═══════════════════════════════════════════════');

  const query = 'Tell me about The Dilettante';
  const messages = [{ role: 'user', content: query }];

  try {
    const response = await sendMessage(messages);

    // Story craft indicators (should be prominent)
    const storyCraftPatterns = [
      /character/i,
      /arc/i,
      /structure/i,
      /theme/i,
      /story/i,
      /narrative/i,
      /emotional/i,
      /journey/i,
      /protagonist/i
    ];

    // Business indicators (should be minimal or absent)
    const businessPatterns = [
      /market/i,
      /platform/i,
      /netflix/i,
      /hbo/i,
      /network/i,
      /budget/i,
      /production/i
    ];

    const storyCraftMatches = storyCraftPatterns.filter(pattern => pattern.test(response)).length;
    const businessMatches = businessPatterns.filter(pattern => pattern.test(response)).length;

    // Story craft should dominate (at least 3x more mentions than business)
    const passed = storyCraftMatches >= businessMatches * 3 && storyCraftMatches >= 3;

    logTest(
      'Story craft dominates response',
      passed,
      `Story craft indicators: ${storyCraftMatches}, Business indicators: ${businessMatches} (target: 3:1 ratio)`
    );

    console.log('\n   📋 Response preview (first 200 chars):');
    console.log(`   "${response.substring(0, 200)}..."`);

    return passed;
  } catch (error) {
    logTest('Story craft focus test', false, error.message);
    return false;
  }
}

/**
 * Test 2: Business Layer Reactive to User Signals
 * Business discussion should only appear when user signals interest
 */
async function testBusinessReactivity() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 2: Business Layer User-Triggered (30%)');
  console.log('═══════════════════════════════════════════════');

  // First message: No business signal
  const query1 = 'What makes True Beauty compelling?';
  const messages1 = [{ role: 'user', content: query1 }];

  // Second message: Business signal
  const query2 = 'Where would this work as an adaptation?';

  try {
    // Test 1: No business signal
    console.log('\n   🔍 Test 2a: No business signal in query');
    const response1 = await sendMessage(messages1);

    const businessPatterns = /market|platform|netflix|hbo|network|budget|production/gi;
    const businessMatches1 = (response1.match(businessPatterns) || []).length;

    const test1Passed = businessMatches1 <= 2; // Minimal or no business talk
    logTest(
      'No business discussion without signal',
      test1Passed,
      `Business mentions: ${businessMatches1} (target: ≤2)`
    );

    await sleep(2000);

    // Test 2: Business signal present
    console.log('\n   🔍 Test 2b: Business signal in query');
    const messages2 = [
      { role: 'user', content: query1 },
      { role: 'assistant', content: response1 },
      { role: 'user', content: query2 }
    ];

    const response2 = await sendMessage(messages2);
    const businessMatches2 = (response2.match(businessPatterns) || []).length;

    const test2Passed = businessMatches2 >= 3; // Now business discussion appears
    logTest(
      'Business discussion when user signals interest',
      test2Passed,
      `Business mentions: ${businessMatches2} (target: ≥3)`
    );

    return test1Passed && test2Passed;
  } catch (error) {
    logTest('Business reactivity test', false, error.message);
    return false;
  }
}

/**
 * Test 3: Real Industry Examples (No Fictional Experience)
 * Should reference real Korean IP adaptations, not personal stories
 */
async function testRealExamples() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 3: Real Industry Examples Only');
  console.log('═══════════════════════════════════════════════');

  const query = 'How do Korean stories translate to American audiences?';
  const messages = [{ role: 'user', content: query }];

  try {
    const response = await sendMessage(messages);

    // Real industry examples that should appear
    const realExamples = [
      /squid game/i,
      /pachinko/i,
      /extraordinary attorney woo/i,
      /mask girl/i,
      /netflix/i,
      /apple tv/i,
      /hbo/i
    ];

    // Fictional personal experience indicators (should NOT appear)
    const fictionalPatterns = [
      /when i was working/i,
      /in my experience/i,
      /i worked on/i,
      /i developed/i,
      /i pitched/i,
      /back when i/i
    ];

    const realExampleMatches = realExamples.filter(pattern => pattern.test(response)).length;
    const fictionalMatches = fictionalPatterns.filter(pattern => pattern.test(response)).length;

    // Should use real examples, no fictional personal history
    const passed = realExampleMatches >= 2 && fictionalMatches === 0;

    logTest(
      'Uses real industry examples, no fictional experience',
      passed,
      `Real examples: ${realExampleMatches}, Fictional: ${fictionalMatches} (target: ≥2 real, 0 fictional)`
    );

    console.log('\n   📋 Response preview (first 300 chars):');
    console.log(`   "${response.substring(0, 300)}..."`);

    return passed;
  } catch (error) {
    logTest('Real examples test', false, error.message);
    return false;
  }
}

/**
 * Test 4: Casual Enthusiastic Tone
 * Should sound like excited colleague, not formal consultant
 */
async function testCasualTone() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 4: Casual Enthusiastic Tone');
  console.log('═══════════════════════════════════════════════');

  const query = 'What do you think about romance webtoons?';
  const messages = [{ role: 'user', content: query }];

  try {
    const response = await sendMessage(messages);

    // Casual enthusiastic indicators
    const casualPatterns = [
      /love/i,
      /!\s/,  // Exclamation marks
      /\?\s/, // Questions (engaging user)
      /really/i,
      /honestly/i,
      /check out/i,
      /notice how/i,
      /what makes/i,
      /tell me/i
    ];

    // Formal consultant indicators (should be minimal)
    const formalPatterns = [
      /pursuant to/i,
      /in conclusion/i,
      /it is recommended/i,
      /furthermore/i,
      /therefore/i,
      /additionally/i
    ];

    const casualMatches = casualPatterns.filter(pattern => pattern.test(response)).length;
    const formalMatches = formalPatterns.filter(pattern => pattern.test(response)).length;

    // Should be casual (multiple indicators) and not formal
    const passed = casualMatches >= 3 && formalMatches === 0;

    logTest(
      'Casual enthusiastic tone maintained',
      passed,
      `Casual indicators: ${casualMatches}, Formal indicators: ${formalMatches} (target: ≥3 casual, 0 formal)`
    );

    console.log('\n   📋 Response preview (first 300 chars):');
    console.log(`   "${response.substring(0, 300)}..."`);

    return passed;
  } catch (error) {
    logTest('Casual tone test', false, error.message);
    return false;
  }
}

/**
 * Test 5: Story Development Questions
 * Should ask questions to understand user's story interests
 */
async function testDevelopmentQuestions() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 5: Story Development Questions');
  console.log('═══════════════════════════════════════════════');

  const query = 'I want to find titles with strong character development';
  const messages = [{ role: 'user', content: query }];

  try {
    const response = await sendMessage(messages);

    // Development question patterns
    const questionPatterns = [
      /what.*you.*looking for/i,
      /are you into/i,
      /what draws you/i,
      /what type of/i,
      /do you prefer/i,
      /tell me more/i,
      /curious about/i,
      /what kind of/i
    ];

    // Should include questions and specific character/story terms
    const hasQuestions = questionPatterns.some(pattern => pattern.test(response));
    const hasCharacterFocus = /character|arc|journey|development/i.test(response);

    const passed = hasQuestions && hasCharacterFocus;

    logTest(
      'Asks story development questions',
      passed,
      `Has questions: ${hasQuestions}, Character focus: ${hasCharacterFocus}`
    );

    console.log('\n   📋 Response preview (first 300 chars):');
    console.log(`   "${response.substring(0, 300)}..."`);

    return passed;
  } catch (error) {
    logTest('Development questions test', false, error.message);
    return false;
  }
}

/**
 * Test 6: Context Awareness
 * Should reference previous conversation and build continuity
 */
async function testContextAwareness() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST 6: Conversation Context Awareness');
  console.log('═══════════════════════════════════════════════');

  const conversation = [
    { role: 'user', content: 'I love character-driven thrillers' },
    { role: 'assistant', content: 'Character-driven thrillers are amazing! The tension comes from the character\'s psychology...' },
    { role: 'user', content: 'Show me something similar' }
  ];

  try {
    const response = await sendMessage(conversation);

    // Context awareness indicators
    const contextPatterns = [
      /you mentioned/i,
      /earlier/i,
      /since you/i,
      /based on what/i,
      /you said/i,
      /character-driven/i, // Should reference user's preference
      /thriller/i
    ];

    const contextMatches = contextPatterns.filter(pattern => pattern.test(response)).length;

    // Should reference earlier conversation
    const passed = contextMatches >= 2;

    logTest(
      'Maintains conversation context',
      passed,
      `Context references: ${contextMatches} (target: ≥2)`
    );

    console.log('\n   📋 Response preview (first 300 chars):');
    console.log(`   "${response.substring(0, 300)}..."`);

    return passed;
  } catch (error) {
    logTest('Context awareness test', false, error.message);
    return false;
  }
}

/**
 * Run all personality tests
 */
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   STORY CRAFT PERSONALITY TEST SUITE          ║');
  console.log('║   Hollywood Showrunner Identity Validation    ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  console.log('Testing new Jinu personality...\n');

  // Run tests sequentially with delays to avoid rate limiting
  await testStoryCraftFocus();
  await sleep(2000);

  await testBusinessReactivity();
  await sleep(2000);

  await testRealExamples();
  await sleep(2000);

  await testCasualTone();
  await sleep(2000);

  await testDevelopmentQuestions();
  await sleep(2000);

  await testContextAwareness();

  // Print summary
  console.log('\n\n╔═══════════════════════════════════════════════╗');
  console.log('║              TEST SUMMARY                     ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);

  console.log('Detailed Results:');
  results.tests.forEach((test, idx) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${idx + 1}. ${status} ${test.name}`);
    if (test.details) {
      console.log(`   ${test.details}`);
    }
  });

  console.log('\n\n📝 Personality Validation Checklist:');
  console.log('   • Story craft primary focus (70%) - Test 1');
  console.log('   • Business layer reactive to signals (30%) - Test 2');
  console.log('   • Real industry examples only - Test 3');
  console.log('   • Casual enthusiastic tone - Test 4');
  console.log('   • Story development questions - Test 5');
  console.log('   • Context awareness - Test 6');

  console.log('\n\n🎯 Expected Personality Traits:');
  console.log('   ✅ Leads with story craft (character arcs, structure, themes)');
  console.log('   ✅ Discusses business only when user signals interest');
  console.log('   ✅ References real adaptations (Squid Game, Pachinko, etc.)');
  console.log('   ✅ Sounds like excited colleague, not formal consultant');
  console.log('   ✅ Asks development questions to understand preferences');
  console.log('   ✅ Maintains conversation continuity');

  console.log('\n🔗 Edge Function Logs:');
  console.log('   https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions\n');

  console.log('💡 Manual Verification:');
  console.log('   1. Test in browser: http://localhost:8081/buyers/chat');
  console.log('   2. Ask: "Tell me about The Dilettante"');
  console.log('   3. Verify story craft focus in response');
  console.log('   4. Follow up: "Where would this work?" to trigger business layer');
  console.log('   5. Confirm casual tone and real industry examples\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
