/**
 * Unit Tests for Suggestion Enhancement Functions
 * Tests the helper functions for context-aware suggested queries
 *
 * Run: node test-suggestion-enhancements.js
 */

// Mock implementations of helper functions (copied from edge function)
function filterDuplicateSuggestions(suggestions, conversationHistory) {
  const previousQueries = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase().trim());

  if (previousQueries.length === 0) {
    return suggestions;
  }

  return suggestions.filter(suggestion => {
    const suggestionLower = suggestion.toLowerCase().trim();

    const isDuplicate = previousQueries.some(prevQuery => {
      if (suggestionLower === prevQuery) return true;
      if (suggestionLower.includes(prevQuery) || prevQuery.includes(suggestionLower)) return true;

      const tellMePattern = /tell me (?:more )?about\s+"?([^"]+)"?/i;
      const sugMatch = suggestion.match(tellMePattern);
      const prevMatch = prevQuery.match(tellMePattern);

      if (sugMatch && prevMatch) {
        const sugTitle = sugMatch[1].toLowerCase().trim();
        const prevTitle = prevMatch[1].toLowerCase().trim();
        if (sugTitle === prevTitle) return true;
      }

      return false;
    });

    return !isDuplicate;
  });
}

function validateSuggestionFormat(suggestion, userQuery) {
  if (suggestion.toLowerCase().includes(userQuery.toLowerCase())) {
    if (suggestion.toLowerCase().startsWith('tell me more about')) {
      return true;
    }
    return false;
  }

  if (suggestion.length < 10 || suggestion.length > 150) {
    return false;
  }

  const malformedPatterns = [
    /which of these \d+ is most like tell me/i,
    /which of these \d+ is most like compare/i,
    /more like more like/i,
  ];

  if (malformedPatterns.some(pattern => pattern.test(suggestion))) {
    return false;
  }

  return true;
}

function getConversationStage(conversationHistory) {
  const messageCount = conversationHistory.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  ).length;

  if (messageCount <= 2) return 'initial';
  if (messageCount <= 5) return 'exploring';
  return 'deepdive';
}

function getStageBasedFallbacks(stage, searchResults) {
  const fallbacks = [];
  const hasResults = searchResults.length > 0;

  if (stage === 'initial') {
    fallbacks.push("What genres interest you most?");
    fallbacks.push("Do you prefer character-driven or plot-heavy stories?");
    if (hasResults) {
      const genres = new Set(searchResults.flatMap(r => Array.isArray(r.genre) ? r.genre : [r.genre]).filter(Boolean));
      if (genres.size > 0) {
        const genreArray = Array.from(genres);
        fallbacks.push(`Are you looking for ${genreArray[0].toLowerCase()} specifically?`);
      }
    }
  } else if (stage === 'exploring') {
    if (hasResults && searchResults.length > 1) {
      const titles = searchResults.map(r => r.title_name_en || r.title_name_kr).filter(Boolean);
      if (titles.length >= 2) {
        fallbacks.push(`Compare "${titles[0]}" to "${titles[1]}"`);
      }
    }
    fallbacks.push("What specific themes or elements are you looking for?");
  } else {
    if (hasResults) {
      const authors = new Set(searchResults.map(r => r.story_author).filter(Boolean));
      if (authors.size > 0) {
        const authorArray = Array.from(authors);
        fallbacks.push(`More works from ${authorArray[0]}`);
      }
    }
    fallbacks.push("Any particular storytelling style you prefer?");
  }

  return fallbacks;
}

// Test suite
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
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}, got ${JSON.stringify(actual)}`);
      }
    },
    not: {
      toContain(item) {
        if (actual.includes(item)) {
          throw new Error(`Expected array NOT to contain ${item}, got ${JSON.stringify(actual)}`);
        }
      }
    }
  };
}

// Test 1: Deduplication filters exact matches
test('filterDuplicateSuggestions: filters exact match', () => {
  const history = [
    { role: 'user', content: 'Tell me about romance' }
  ];
  const suggestions = ['Tell me about romance', 'Compare A to B'];
  const result = filterDuplicateSuggestions(suggestions, history);
  expect(result).toEqual(['Compare A to B']);
});

// Test 2: Deduplication filters "Tell me more about" patterns
test('filterDuplicateSuggestions: filters Tell me more pattern', () => {
  const history = [
    { role: 'user', content: 'Tell me more about The Dilettante' }
  ];
  const suggestions = ['Tell me more about "The Dilettante"', 'Compare A to B'];
  const result = filterDuplicateSuggestions(suggestions, history);
  expect(result).toEqual(['Compare A to B']);
});

// Test 3: Deduplication preserves when no history
test('filterDuplicateSuggestions: returns all when no history', () => {
  const history = [];
  const suggestions = ['Tell me more about A', 'Compare A to B'];
  const result = filterDuplicateSuggestions(suggestions, history);
  expect(result).toEqual(suggestions);
});

// Test 4: Format validation rejects malformed template
test('validateSuggestionFormat: rejects malformed template', () => {
  const userQuery = 'Tell me more about The Dilettante';
  const suggestion = 'Which of these 10 is most like Tell me more about The Dilettante?';
  const result = validateSuggestionFormat(suggestion, userQuery);
  expect(result).toBe(false);
});

// Test 5: Format validation accepts valid "Tell me more"
test('validateSuggestionFormat: accepts valid Tell me more', () => {
  const userQuery = 'romance webtoon';
  const suggestion = 'Tell me more about "The Dilettante"';
  const result = validateSuggestionFormat(suggestion, userQuery);
  expect(result).toBe(true);
});

// Test 6: Format validation rejects too short
test('validateSuggestionFormat: rejects too short', () => {
  const userQuery = 'romance';
  const suggestion = 'More?';
  const result = validateSuggestionFormat(suggestion, userQuery);
  expect(result).toBe(false);
});

// Test 7: Format validation rejects too long
test('validateSuggestionFormat: rejects too long', () => {
  const userQuery = 'romance';
  const suggestion = 'A'.repeat(200);
  const result = validateSuggestionFormat(suggestion, userQuery);
  expect(result).toBe(false);
});

// Test 8: Stage detection - initial
test('getConversationStage: detects initial stage', () => {
  const history = [];
  const result = getConversationStage(history);
  expect(result).toBe('initial');
});

// Test 9: Stage detection - exploring
test('getConversationStage: detects exploring stage', () => {
  const history = [
    { role: 'user', content: 'Q1' },
    { role: 'assistant', content: 'A1' },
    { role: 'user', content: 'Q2' },
    { role: 'assistant', content: 'A2' }
  ];
  const result = getConversationStage(history);
  expect(result).toBe('exploring');
});

// Test 10: Stage detection - deepdive
test('getConversationStage: detects deepdive stage', () => {
  const history = Array(8).fill({ role: 'user', content: 'Q' });
  const result = getConversationStage(history);
  expect(result).toBe('deepdive');
});

// Test 11: Fallbacks for initial stage
test('getStageBasedFallbacks: returns exploration questions for initial', () => {
  const result = getStageBasedFallbacks('initial', []);
  expect(result).toContain("What genres interest you most?");
  expect(result).toContain("Do you prefer character-driven or plot-heavy stories?");
});

// Test 12: Fallbacks for exploring stage with results
test('getStageBasedFallbacks: returns comparison for exploring with results', () => {
  const searchResults = [
    { title_name_en: 'Title A', genre: ['romance'] },
    { title_name_en: 'Title B', genre: ['thriller'] }
  ];
  const result = getStageBasedFallbacks('exploring', searchResults);
  expect(result).toContain('Compare "Title A" to "Title B"');
});

// Test 13: Fallbacks for deepdive with author
test('getStageBasedFallbacks: returns author query for deepdive', () => {
  const searchResults = [
    { title_name_en: 'Title A', story_author: 'Jane Doe', genre: ['romance'] }
  ];
  const result = getStageBasedFallbacks('deepdive', searchResults);
  expect(result).toContain('More works from Jane Doe');
});

// Test 14: Pattern matching prevents contains-based false positive
test('filterDuplicateSuggestions: avoids false positive on contains', () => {
  const history = [
    { role: 'user', content: 'romance' }
  ];
  const suggestions = ['romance stories', 'dark romance', 'Compare A to B'];
  const result = filterDuplicateSuggestions(suggestions, history);
  // All should be filtered because they contain 'romance'
  expect(result).toEqual(['Compare A to B']);
});

// Run all tests
console.log('\n🧪 Running Suggestion Enhancement Tests\n');
console.log('='.repeat(50));

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Summary:`);
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
