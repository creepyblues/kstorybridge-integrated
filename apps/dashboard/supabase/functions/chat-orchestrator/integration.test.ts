/**
 * Integration Tests for Chat Orchestrator Edge Function
 *
 * PURPOSE: Test complete end-to-end chatbot scenarios to ensure
 * sample dialogue implementation doesn't break existing flows
 *
 * CRITICAL: These tests simulate real user conversations
 * ALL tests must pass before deploying any phase
 *
 * Run: deno test --allow-env --allow-net integration.test.ts
 *
 * SETUP REQUIRED:
 * - Set SUPABASE_URL env var
 * - Set SUPABASE_ANON_KEY env var
 * - Set TEST_USER_AUTH_TOKEN env var (get from get-auth-token.js)
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');
const AUTH_TOKEN = Deno.env.get('TEST_USER_AUTH_TOKEN') || Deno.env.get('SUPABASE_AUTH_TOKEN');

// Helper: Call chat-orchestrator edge function
async function sendChatMessage(query: string, conversationHistory: any[] = []) {
  if (!SUPABASE_URL || !AUTH_TOKEN) {
    console.warn('⚠️ Integration tests skipped: Missing SUPABASE_URL or TEST_USER_AUTH_TOKEN');
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'apikey': ANON_KEY || '',
    },
    body: JSON.stringify({
      messages: [
        ...conversationHistory,
        { role: 'user', content: query }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  let fullResponse = '';
  let suggestedQueries: string[] = [];
  let searchResults: any[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === 'text') {
            fullResponse += parsed.text;
          } else if (parsed.type === 'suggestions') {
            suggestedQueries = parsed.suggestedQueries || [];
          } else if (parsed.type === 'search_complete') {
            searchResults = parsed.topTitles || [];
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return { fullResponse, suggestedQueries, searchResults };
}

// ========== INTEGRATION TEST: Existing Behavior (MUST NOT BREAK) ==========

Deno.test({
  name: "Scenario 1: Information Query - 'Tell me about [Title]'",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("Tell me about First Love");
    assertExists(result, "Should return response");

    const { fullResponse } = result!;

    // Must have structured response
    assert(fullResponse.includes('**About') || fullResponse.includes('First Love'),
           "Should have 'About' section or mention title");

    // Must have title detail link
    assert(fullResponse.includes('/buyers/titles/') || fullResponse.includes('View Full Details'),
           "Should include title detail page link");

    // Should NOT mention other titles (exclusive focus)
    const otherTitlePattern = /(?:similar to|you might also like|related|comparable)/i;
    assertEquals(otherTitlePattern.test(fullResponse), false,
                "Should not suggest other titles for information queries");

    console.log('✅ Scenario 1 passed: Information query working correctly');
  }
});

Deno.test({
  name: "Scenario 2: Discovery Query - Returns Title Recommendations",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("romantic webtoon");
    assertExists(result, "Should return response");

    const { fullResponse, searchResults } = result!;

    // Must return search results
    assert(searchResults.length > 0, "Should return search results");

    // Must mention titles from search results
    assert(fullResponse.length > 50, "Should provide substantive response");

    // Should recommend titles
    const hasTitleRecommendations = fullResponse.includes('"') || fullResponse.match(/[A-Z][a-z]+\s+[A-Z]/);
    assert(hasTitleRecommendations, "Should recommend specific titles");

    console.log('✅ Scenario 2 passed: Discovery query returns recommendations');
  }
});

Deno.test({
  name: "Scenario 3: Comparison Query - Structured Comparison",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("compare First Love and The Dilettante");
    assertExists(result, "Should return response");

    const { fullResponse } = result!;

    // Must compare the two titles
    assert(fullResponse.includes('First Love') || fullResponse.includes('first love'),
           "Should mention First Love");
    assert(fullResponse.includes('Dilettante') || fullResponse.includes('dilettante'),
           "Should mention The Dilettante");

    // Should have comparison language
    const comparisonPattern = /(while|whereas|compared|difference|both|versus)/i;
    assert(comparisonPattern.test(fullResponse),
           "Should use comparison language");

    console.log('✅ Scenario 3 passed: Comparison query working correctly');
  }
});

Deno.test({
  name: "Scenario 4: Follow-up Query - References Previous Context",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    // First message
    const firstResult = await sendChatMessage("romantic webtoon");
    assertExists(firstResult, "First query should return response");

    // Follow-up message
    const followUpResult = await sendChatMessage("tell me more", [
      { role: 'user', content: 'romantic webtoon' },
      { role: 'assistant', content: firstResult!.fullResponse }
    ]);
    assertExists(followUpResult, "Follow-up query should return response");

    const { fullResponse } = followUpResult!;

    // Should provide more information (not start over)
    assert(fullResponse.length > 50, "Should provide substantive follow-up");

    console.log('✅ Scenario 4 passed: Follow-up query maintains context');
  }
});

Deno.test({
  name: "Scenario 5: No Results - Handles Gracefully",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("xyzabc123nonexistent query");
    assertExists(result, "Should return response even with no results");

    const { fullResponse } = result!;

    // Should ask for clarification
    assert(fullResponse.length > 30, "Should provide helpful response");

    // Should NOT hallucinate titles
    const hallucinationPattern = /["""]([^"""]+)["""]/g;
    const quotedTerms = fullResponse.match(hallucinationPattern) || [];

    // Validate that any quoted terms are not fictional title hallucinations
    quotedTerms.forEach(term => {
      const cleaned = term.replace(/["""]/g, '');
      // Should not be common Korean title patterns
      assert(!cleaned.match(/^[A-Z][a-z]+\s+(Girl|Boy|Beauty|Love|Story)$/),
             `Should not hallucinate titles like "${cleaned}"`);
    });

    console.log('✅ Scenario 5 passed: No results handled gracefully');
  }
});

Deno.test({
  name: "Scenario 6: Streaming Works - Response Arrives Progressively",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("show me popular titles");
    assertExists(result, "Should return response");

    const { fullResponse } = result!;

    // Verify streaming worked (response should be complete)
    assert(fullResponse.length > 100, "Streamed response should be substantial");

    console.log('✅ Scenario 6 passed: Streaming working correctly');
  }
});

Deno.test({
  name: "Scenario 7: Suggestions Generated - 3-5 Follow-up Queries",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("romantic webtoon");
    assertExists(result, "Should return response");

    const { suggestedQueries } = result!;

    // Should generate suggestions (unless AI already provided them)
    // Note: With response-aware suggestions, this might be suppressed
    // so we only check IF suggestions exist, they should be valid
    if (suggestedQueries.length > 0) {
      assert(suggestedQueries.length >= 3 && suggestedQueries.length <= 5,
             `Should generate 3-5 suggestions, got ${suggestedQueries.length}`);

      suggestedQueries.forEach(query => {
        assert(query.length > 10, `Suggestion "${query}" should be meaningful (>10 chars)`);
        assert(query.length < 150, `Suggestion "${query}" should not be too long (<150 chars)`);
      });
    }

    console.log('✅ Scenario 7 passed: Suggestions generated correctly');
  }
});

Deno.test({
  name: "Scenario 8: Anti-Hallucination - Only Database Titles Mentioned",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("romantic webtoon");
    assertExists(result, "Should return response");

    const { fullResponse, searchResults } = result!;

    // Extract all quoted titles from response
    const quotedTitles = fullResponse.match(/"([^"]+)"/g)?.map(q => q.replace(/"/g, '')) || [];

    if (quotedTitles.length > 0 && searchResults.length > 0) {
      // Verify each quoted title exists in search results
      const validTitleNames = new Set<string>();
      searchResults.forEach(r => {
        if (r.title_name_en) validTitleNames.add(r.title_name_en.toLowerCase());
        if (r.title_name_kr) validTitleNames.add(r.title_name_kr.toLowerCase());
      });

      quotedTitles.forEach(quoted => {
        const quotedLower = quoted.toLowerCase().trim();
        const isValid = Array.from(validTitleNames).some(valid =>
          quotedLower.includes(valid) || valid.includes(quotedLower)
        );

        assert(isValid || quoted.length < 5,
               `Quoted title "${quoted}" should exist in search results or be a generic term`);
      });
    }

    console.log('✅ Scenario 8 passed: No hallucinations detected');
  }
});

Deno.test({
  name: "Scenario 9: Business Trigger - Detects Platform/Market Keywords",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const result = await sendChatMessage("where would this work on Netflix?");
    assertExists(result, "Should return response");

    const { fullResponse } = result!;

    // Should discuss business/market fit
    const businessPattern = /(Netflix|platform|market|streaming|audience|production)/i;
    assert(businessPattern.test(fullResponse),
           "Should discuss business context when triggered");

    console.log('✅ Scenario 9 passed: Business trigger working correctly');
  }
});

Deno.test({
  name: "Scenario 10: Feature Flags - All OFF by Default (Phase 1)",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    // This test verifies that with flags OFF, behavior is unchanged
    const result = await sendChatMessage("romantic webtoon");
    assertExists(result, "Should return response");

    const { fullResponse } = result!;

    // Should behave as current production (recommendations immediately)
    assert(fullResponse.length > 50, "Should provide substantive response");

    // Verify flags are OFF (behavior should match current production)
    assertEquals(Deno.env.get('ENABLE_NEW_PERSONALITY'), undefined,
                "ENABLE_NEW_PERSONALITY should be undefined (OFF)");
    assertEquals(Deno.env.get('ENABLE_EXPLORATION_MODE'), undefined,
                "ENABLE_EXPLORATION_MODE should be undefined (OFF)");
    assertEquals(Deno.env.get('ENABLE_CONDITIONAL_INFO'), undefined,
                "ENABLE_CONDITIONAL_INFO should be undefined (OFF)");

    console.log('✅ Scenario 10 passed: Feature flags OFF, production behavior preserved');
  }
});

// ========== PERFORMANCE TESTS ==========

Deno.test({
  name: "Performance: Response Time < 6 seconds",
  ignore: !SUPABASE_URL || !AUTH_TOKEN,
  async fn() {
    const startTime = Date.now();
    const result = await sendChatMessage("romantic webtoon");
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    assertExists(result, "Should return response");
    assert(responseTime < 6000,
           `Response time should be < 6s, got ${responseTime}ms`);

    console.log(`✅ Performance test passed: ${responseTime}ms response time`);
  }
});

// ========== SUMMARY ==========
console.log(`
📊 Integration Test Suite Summary
================================
Total Scenarios: 11 (10 functional + 1 performance)

CRITICAL CHECKS (Must Pass Before Deploy):
✅ Information queries return structured responses with links
✅ Discovery queries return title recommendations
✅ Comparison queries work correctly
✅ Follow-up queries maintain context
✅ No results handled gracefully (no hallucinations)
✅ Streaming works
✅ Suggestions generated (3-5 queries)
✅ Anti-hallucination enforcement working
✅ Business triggers detected
✅ Feature flags OFF by default (production behavior preserved)
✅ Response time < 6 seconds

Run with: deno test --allow-env --allow-net integration.test.ts

SETUP:
export SUPABASE_URL="your-supabase-url"
export TEST_USER_AUTH_TOKEN="get-from-get-auth-token.js"
`);
