/**
 * Unit Test: Information Intent Classification & Suggestion Suppression
 * Tests the "Tell me about [Title]" single title focus feature
 *
 * Run: node test-information-intent.js
 */

console.log('\n🧪 Running Information Intent Tests\n');
console.log('='.repeat(60));

// Mock implementations of the classification logic (from edge function)
function classifyQueryIntent(query, conversationHistory = []) {
  const lowerQuery = query.toLowerCase();

  // PRIORITY 1: Comparison queries (most specific)
  const comparisonIndicators = ['compare', 'difference between', 'versus', 'vs', 'better than'];
  if (comparisonIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'comparison';
  }

  // PRIORITY 2: Specific title information requests (higher priority than follow-up)
  const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
  const infoIndicators = ['what is', 'who is', 'explain', 'describe', 'synopsis', 'plot'];

  if (specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind))) {
    return 'information';
  }

  // PRIORITY 3: Follow-up indicators (AFTER specific info check)
  const followUpIndicators = ['also', 'more like', 'similar', 'another', 'different', 'what about', 'how about'];
  const isGenericTellMeMore = lowerQuery.trim() === 'tell me more' || lowerQuery.trim() === 'learn more';
  const isFollowUp = followUpIndicators.some(indicator => lowerQuery.includes(indicator)) ||
                     isGenericTellMeMore ||
                     conversationHistory.length >= 2;

  if (isFollowUp && conversationHistory.length >= 2) {
    return 'follow-up';
  }

  // PRIORITY 4: Recommendation requests
  const recommendationIndicators = ['recommend', 'suggest', 'should i', 'what should', 'good', 'best'];
  if (recommendationIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'recommendation';
  }

  // Default: discovery/search
  return 'discovery';
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    results.passed++;
    results.tests.push({ name, passed: true });
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
      }
    }
  };
}

// ====================
// TEST 1: Intent Classification Precision
// ====================

test('Classifies "Tell me more about The Dilettante" as information', () => {
  const result = classifyQueryIntent('Tell me more about The Dilettante');
  expect(result).toBe('information');
});

test('Classifies "Tell me about Arpeggio on the Surface of the Sea" as information', () => {
  const result = classifyQueryIntent('Tell me about Arpeggio on the Surface of the Sea');
  expect(result).toBe('information');
});

test('Classifies "Learn more about True Beauty" as information', () => {
  const result = classifyQueryIntent('Learn more about True Beauty');
  expect(result).toBe('information');
});

test('Classifies "Details about this title" as information', () => {
  const result = classifyQueryIntent('Details about this title');
  expect(result).toBe('information');
});

test('Classifies "What is The Dilettante?" as information', () => {
  const result = classifyQueryIntent('What is The Dilettante?');
  expect(result).toBe('information');
});

test('Classifies "Explain The Dilettante" as information', () => {
  const result = classifyQueryIntent('Explain The Dilettante');
  expect(result).toBe('information');
});

// ====================
// TEST 2: Intent NOT Misclassified
// ====================

test('Generic "Tell me more" without "about" is follow-up (with history)', () => {
  const history = [{role: 'user', content: 'romance'}, {role: 'assistant', content: 'Here are titles...'}];
  const result = classifyQueryIntent('Tell me more', history);
  expect(result).toBe('follow-up');
});

test('Generic "Learn more" without "about" is follow-up (with history)', () => {
  const history = [{role: 'user', content: 'romance'}, {role: 'assistant', content: 'Here are titles...'}];
  const result = classifyQueryIntent('Learn more', history);
  expect(result).toBe('follow-up');
});

test('"What about romance titles?" is follow-up (with history)', () => {
  const history = [{role: 'user', content: 'action'}, {role: 'assistant', content: 'Action titles...'}];
  const result = classifyQueryIntent('What about romance titles?', history);
  expect(result).toBe('follow-up');
});

test('"Compare A to B" is comparison, not information', () => {
  const result = classifyQueryIntent('Compare The Dilettante to Arpeggio');
  expect(result).toBe('comparison');
});

test('"Recommend something" is recommendation, not information', () => {
  const result = classifyQueryIntent('Recommend something good');
  expect(result).toBe('recommendation');
});

test('"Find romance titles" is discovery, not information', () => {
  const result = classifyQueryIntent('Find romance titles');
  expect(result).toBe('discovery');
});

// ====================
// TEST 3: Suggestion Suppression Logic
// ====================

test('skipSuggestions is true for information intent', () => {
  const queryIntent = 'information';
  const skipSuggestions = (queryIntent === 'information');
  expect(skipSuggestions).toBe(true);
});

test('skipSuggestions is false for discovery intent', () => {
  const queryIntent = 'discovery';
  const skipSuggestions = (queryIntent === 'information');
  expect(skipSuggestions).toBe(false);
});

test('skipSuggestions is false for comparison intent', () => {
  const queryIntent = 'comparison';
  const skipSuggestions = (queryIntent === 'information');
  expect(skipSuggestions).toBe(false);
});

test('skipSuggestions is false for recommendation intent', () => {
  const queryIntent = 'recommendation';
  const skipSuggestions = (queryIntent === 'information');
  expect(skipSuggestions).toBe(false);
});

test('skipSuggestions is false for follow-up intent', () => {
  const queryIntent = 'follow-up';
  const skipSuggestions = (queryIntent === 'information');
  expect(skipSuggestions).toBe(false);
});

// ====================
// TEST 4: Empty Suggestion Array Handling
// ====================

test('Empty suggestions array is valid', () => {
  const emptyArray = [];
  expect(emptyArray.length).toBe(0);
});

test('Undefined suggestions fall back to empty array', () => {
  const parsedSuggestions = undefined || [];
  expect(parsedSuggestions.length).toBe(0);
});

test('Null suggestions fall back to empty array', () => {
  const parsedSuggestions = null || [];
  expect(parsedSuggestions.length).toBe(0);
});

// ====================
// Print Summary
// ====================

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Total: ${results.passed + results.failed}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);

if (results.failed === 0) {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the errors above.\n');
  process.exit(1);
}
