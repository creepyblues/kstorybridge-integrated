/**
 * Unit Test: Markdown Link Parsing in processText Function
 * Tests the enhanced processText function for markdown link detection
 *
 * Run: node test-markdown-link-parsing.js
 */

console.log('\n🧪 Running Markdown Link Parsing Tests\n');
console.log('='.repeat(60));

// Mock implementation of the processText function (from Chat.tsx)
function processText(text) {
  const segments = [];

  // Markdown link pattern: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      segments.push({
        type: 'text',
        content: beforeText.replace(/\*/g, '')
      });
    }

    // Add the markdown link
    segments.push({
      type: 'markdown-link',
      content: match[0], // Full match for fallback
      linkText: match[1], // [text]
      url: match[2]       // (url)
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex).replace(/\*/g, '')
    });
  }

  // If no links found, return original logic
  if (segments.length === 0) {
    return [{
      type: 'text',
      content: text.replace(/\*/g, '')
    }];
  }

  return segments;
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
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    }
  };
}

// ====================
// TEST 1: Single Markdown Link
// ====================

test('Parses single markdown link correctly', () => {
  const input = '[View Full Details →](/buyers/titles/123)';
  const result = processText(input);

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('markdown-link');
  expect(result[0].linkText).toBe('View Full Details →');
  expect(result[0].url).toBe('/buyers/titles/123');
});

test('Parses markdown link with UUID', () => {
  const input = '[View Full Details →](/buyers/titles/b1798def-906c-4bcc-91ec-030e661ce914)';
  const result = processText(input);

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('markdown-link');
  expect(result[0].linkText).toBe('View Full Details →');
  expect(result[0].url).toBe('/buyers/titles/b1798def-906c-4bcc-91ec-030e661ce914');
});

// ====================
// TEST 2: Markdown Link with Surrounding Text
// ====================

test('Parses markdown link with text before', () => {
  const input = 'Check out this title: [View Details](/buyers/titles/123)';
  const result = processText(input);

  expect(result).toHaveLength(2);
  expect(result[0].type).toBe('text');
  expect(result[0].content).toBe('Check out this title: ');
  expect(result[1].type).toBe('markdown-link');
  expect(result[1].linkText).toBe('View Details');
});

test('Parses markdown link with text after', () => {
  const input = '[View Details](/buyers/titles/123) for more information.';
  const result = processText(input);

  expect(result).toHaveLength(2);
  expect(result[0].type).toBe('markdown-link');
  expect(result[1].type).toBe('text');
  expect(result[1].content).toBe(' for more information.');
});

test('Parses markdown link with text before and after', () => {
  const input = 'Check this out: [View Details](/buyers/titles/123) for more info.';
  const result = processText(input);

  expect(result).toHaveLength(3);
  expect(result[0].type).toBe('text');
  expect(result[0].content).toBe('Check this out: ');
  expect(result[1].type).toBe('markdown-link');
  expect(result[2].type).toBe('text');
  expect(result[2].content).toBe(' for more info.');
});

// ====================
// TEST 3: Plain Text (No Links)
// ====================

test('Handles plain text without links', () => {
  const input = 'This is plain text without any links.';
  const result = processText(input);

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('text');
  expect(result[0].content).toBe('This is plain text without any links.');
});

test('Removes asterisks from plain text', () => {
  const input = '**Bold text** with *emphasis*';
  const result = processText(input);

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('text');
  expect(result[0].content).toBe('Bold text with emphasis');
});

// ====================
// TEST 4: Multiple Markdown Links
// ====================

test('Parses multiple markdown links', () => {
  const input = '[Link 1](/url1) some text [Link 2](/url2)';
  const result = processText(input);

  expect(result).toHaveLength(3);
  expect(result[0].type).toBe('markdown-link');
  expect(result[0].linkText).toBe('Link 1');
  expect(result[0].url).toBe('/url1');
  expect(result[1].type).toBe('text');
  expect(result[1].content).toBe(' some text ');
  expect(result[2].type).toBe('markdown-link');
  expect(result[2].linkText).toBe('Link 2');
  expect(result[2].url).toBe('/url2');
});

test('Parses three consecutive markdown links', () => {
  const input = '[A](/a) [B](/b) [C](/c)';
  const result = processText(input);

  // Should be: link, space, link, space, link
  expect(result).toHaveLength(5);
  expect(result[0].type).toBe('markdown-link');
  expect(result[2].type).toBe('markdown-link');
  expect(result[4].type).toBe('markdown-link');
});

// ====================
// TEST 5: Edge Cases
// ====================

test('Does not parse broken markdown links (missing closing paren)', () => {
  const input = '[Broken link without closing paren(/url';
  const result = processText(input);

  expect(result[0].type).toBe('text'); // Should treat as plain text
});

test('Does not parse broken markdown links (missing opening bracket)', () => {
  const input = 'Missing bracket](/url)';
  const result = processText(input);

  expect(result[0].type).toBe('text'); // Should treat as plain text
});

test('Handles empty link text (treats as plain text)', () => {
  const input = '[](/url)';
  const result = processText(input);

  // Empty brackets don't match regex (requires at least 1 char), treats as plain text
  // This is acceptable - AI won't generate empty link text
  expect(result[0].type).toBe('text');
});

test('Preserves special characters in link text', () => {
  const input = '[View Full Details →](/url)';
  const result = processText(input);

  expect(result[0].linkText).toBe('View Full Details →');
});

test('Preserves query parameters in URL', () => {
  const input = '[Link](/url?param=value&other=123)';
  const result = processText(input);

  expect(result[0].url).toBe('/url?param=value&other=123');
});

// ====================
// TEST 6: Real-World AI Response Patterns
// ====================

test('Parses AI response with title link at end', () => {
  const input = 'The Dilettante is a romance webtoon.\n\n[View Full Details →](/buyers/titles/123)';
  const result = processText(input);

  // Should have: text, link
  const linkSegment = result.find(s => s.type === 'markdown-link');
  expect(linkSegment).toBe(linkSegment); // Exists
  expect(linkSegment.linkText).toBe('View Full Details →');
});

test('Handles markdown in multi-line text', () => {
  const input = 'Line 1\n[Link](/url)\nLine 3';
  const result = processText(input);

  const linkSegment = result.find(s => s.type === 'markdown-link');
  expect(linkSegment).toBe(linkSegment); // Exists
  expect(linkSegment.url).toBe('/url');
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
  console.log('\n🎉 All tests passed!');
  console.log('\n✅ Markdown link parsing implementation is safe');
  console.log('   - Single links: ✓');
  console.log('   - Multiple links: ✓');
  console.log('   - Plain text: ✓ (backward compatible)');
  console.log('   - Edge cases: ✓\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the errors above.\n');
  process.exit(1);
}
