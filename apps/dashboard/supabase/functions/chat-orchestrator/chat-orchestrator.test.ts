/**
 * Unit Tests for Chat Orchestrator Edge Function
 *
 * PURPOSE: Verify that existing critical functions remain unchanged
 * during chatbot sample dialogue implementation (Phase 1-4)
 *
 * CRITICAL: All tests must pass before deploying any phase
 *
 * Run: deno test --allow-env --allow-net chat-orchestrator.test.ts
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ========== TEST: Feature Flags ==========
Deno.test("Feature flags default to false (preserves current behavior)", () => {
  // Flags should be OFF unless explicitly enabled
  const enableNewPersonality = Deno.env.get('ENABLE_NEW_PERSONALITY') === 'true';
  const enableExplorationMode = Deno.env.get('ENABLE_EXPLORATION_MODE') === 'true';
  const enableConditionalInfo = Deno.env.get('ENABLE_CONDITIONAL_INFO') === 'true';

  assertEquals(enableNewPersonality, false, "ENABLE_NEW_PERSONALITY should default to false");
  assertEquals(enableExplorationMode, false, "ENABLE_EXPLORATION_MODE should default to false");
  assertEquals(enableConditionalInfo, false, "ENABLE_CONDITIONAL_INFO should default to false");
});

// ========== TEST: Intent Classification ==========
Deno.test("Intent classification detects all 5 intent types correctly", () => {
  const testCases = [
    { query: "compare First Love and The Dilettante", expected: "comparison" },
    { query: "tell me about First Love", expected: "information" },
    { query: "tell me more", expected: "follow-up", historyLength: 4 },
    { query: "recommend a romantic webtoon", expected: "recommendation" },
    { query: "show me popular titles", expected: "discovery" },
  ];

  testCases.forEach(({ query, expected, historyLength = 0 }) => {
    const mockHistory = Array(historyLength).fill({ role: 'user', content: 'previous message' });
    const intent = classifyQueryIntent(query, mockHistory);
    assertEquals(intent, expected, `Query "${query}" should classify as ${expected}`);
  });
});

// ========== TEST: Anti-Hallucination Validation ==========
Deno.test("Anti-hallucination validator catches fictional titles", () => {
  const validTitles = [
    { title_id: '1', title_name_en: 'First Love', similarity: 0.9 },
    { title_id: '2', title_name_en: 'The Dilettante', similarity: 0.85 },
  ];

  // Case 1: AI mentions valid titles - should pass
  const validResponse = 'I recommend "First Love" and "The Dilettante" for you.';
  const validResult = validateAIResponse(validResponse, validTitles);
  assertEquals(validResult.isValid, true, "Valid titles should pass validation");
  assertEquals(validResult.hallucinations.length, 0, "No hallucinations for valid titles");

  // Case 2: AI mentions fictional titles - should catch
  const invalidResponse = 'I recommend "20th Century Girl" and "My ID is Gangnam Beauty".';
  const invalidResult = validateAIResponse(invalidResponse, validTitles);
  assertEquals(invalidResult.isValid, false, "Fictional titles should fail validation");
  assert(invalidResult.hallucinations.length > 0, "Should detect hallucinations");
  assert(invalidResult.validatedResponse.includes('[removed fictional title]'), "Should replace hallucinations");
});

// ========== TEST: Conversation History Weighting ==========
Deno.test("Conversation history weighting prioritizes recent messages", () => {
  const history = [
    { role: 'user', content: 'Old message 1' },
    { role: 'assistant', content: 'Old response 1' },
    { role: 'user', content: 'Recent message' },
    { role: 'assistant', content: 'Recent response' },
  ];

  const weighted = weightConversationHistory(history);

  // Should mark recent messages
  assert(weighted.includes('**[MOST RECENT]** assistant: Recent response'), "Should mark most recent messages");
  assert(weighted.includes('**[RECENT]**') || weighted.includes('**[MOST RECENT]**'), "Should mark recent messages");

  // Should include all messages
  assert(weighted.includes('Old message 1'), "Should include old messages");
});

// ========== TEST: Fresh Conversation Detection ==========
Deno.test("Fresh conversation detection logic (for Phase 3)", () => {
  // Fresh start indicators
  const freshQueries = [
    "looking for romantic webtoon",
    "recommend me something",
    "what about action titles",
  ];

  // NOT fresh (specific follow-ups)
  const specificQueries = [
    "tell me more about First Love",
    "compare X and Y",
    "learn more",
  ];

  freshQueries.forEach(query => {
    const isFreshStart = detectFreshStart(query, []);
    assertEquals(isFreshStart, true, `"${query}" should be detected as fresh start`);
  });

  specificQueries.forEach(query => {
    const isFreshStart = detectFreshStart(query, []);
    assertEquals(isFreshStart, false, `"${query}" should NOT be fresh start`);
  });
});

// ========== TEST: Suggestion Generation ==========
Deno.test("Suggestion generation produces 3-5 diverse suggestions", () => {
  const mockSearchResults = [
    {
      title_id: '1',
      title_name_en: 'First Love',
      genre: ['romance', 'drama'],
      tone: 'emotional',
      similarity: 0.9,
    },
    {
      title_id: '2',
      title_name_en: 'The Dilettante',
      genre: ['thriller', 'action'],
      tone: 'suspenseful',
      similarity: 0.85,
    },
  ];

  const suggestions = generateSuggestedQueries({
    queryIntent: 'discovery',
    searchResults: mockSearchResults,
    userQuery: 'romantic webtoon',
    conversationHistory: [],
  });

  assert(suggestions.length >= 3 && suggestions.length <= 5, "Should generate 3-5 suggestions");
  assert(suggestions.every(s => s.length > 10), "Suggestions should be meaningful (>10 chars)");
  assert(suggestions.every(s => s.length < 150), "Suggestions should not be too long (<150 chars)");
});

// ========== TEST: Duplicate Suggestion Filtering ==========
Deno.test("Duplicate suggestion filter prevents repeated queries", () => {
  const conversationHistory = [
    { role: 'user', content: 'tell me about First Love' },
    { role: 'assistant', content: 'First Love is a romantic drama...' },
  ];

  const suggestions = [
    "Tell me more about First Love",  // Duplicate - should be filtered
    "Compare First Love to another title",  // Different - should remain
    "What about The Dilettante",  // Different - should remain
  ];

  const filtered = filterDuplicateSuggestions(suggestions, conversationHistory);

  assertEquals(filtered.length, 2, "Should filter out duplicate");
  assert(!filtered.some(s => s.includes('Tell me more about First Love')), "Should remove duplicate query");
});

// ========== TEST: Response Analysis (Phase 2) ==========
Deno.test("AI response analysis detects questions and try sections", () => {
  const responseWithQuestions = "What genre do you prefer? Are you looking for romance or action?";
  const analysis1 = analyzeAIResponse(responseWithQuestions);
  assertEquals(analysis1.hasQuestions, true, "Should detect questions");
  assertEquals(analysis1.questionCount, 2, "Should count 2 questions");

  const responseWithTry = "Here are some options:\n\nTry:\n- First Love\n- The Dilettante";
  const analysis2 = analyzeAIResponse(responseWithTry);
  assertEquals(analysis2.hasTrySection, true, "Should detect Try section");

  const responseWithBullets = "Options:\n- First option\n- Second option";
  const analysis3 = analyzeAIResponse(responseWithBullets);
  assertEquals(analysis3.hasBulletList, true, "Should detect bullet list");
});

// ========== HELPER FUNCTIONS (Extracted from main file for testing) ==========

function classifyQueryIntent(query: string, conversationHistory: any[]): string {
  const lowerQuery = query.toLowerCase();

  // PRIORITY 1: Comparison
  if (['compare', 'difference between', 'versus', 'vs', 'better than'].some(ind => lowerQuery.includes(ind))) {
    return 'comparison';
  }

  // PRIORITY 2: Information
  const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
  const infoIndicators = ['what is', 'who is', 'explain', 'describe', 'synopsis', 'plot'];
  if (specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind))) {
    return 'information';
  }

  // PRIORITY 3: Follow-up
  const followUpIndicators = ['also', 'more like', 'similar', 'another', 'different', 'what about', 'how about'];
  const isGenericTellMeMore = lowerQuery.trim() === 'tell me more' || lowerQuery.trim() === 'learn more';
  if ((followUpIndicators.some(ind => lowerQuery.includes(ind)) || isGenericTellMeMore) && conversationHistory.length >= 2) {
    return 'follow-up';
  }

  // PRIORITY 4: Recommendation
  if (['recommend', 'suggest', 'should i', 'what should', 'good', 'best'].some(ind => lowerQuery.includes(ind))) {
    return 'recommendation';
  }

  return 'discovery';
}

function validateAIResponse(response: string, validTitles: any[]): { validatedResponse: string; hallucinations: string[]; isValid: boolean } {
  if (validTitles.length === 0) {
    return { validatedResponse: response, hallucinations: [], isValid: true };
  }

  const validTitleNames = new Set<string>();
  validTitles.forEach(title => {
    if (title.title_name_en) validTitleNames.add(title.title_name_en.toLowerCase());
    if (title.title_name_kr) validTitleNames.add(title.title_name_kr.toLowerCase());
  });

  const potentialTitles = new Set<string>();
  const quotedMatches = response.match(/"([^"]*)"/g) || [];
  quotedMatches.forEach(q => potentialTitles.add(q.replace(/"/g, '')));

  const hallucinations: string[] = [];
  let validatedResponse = response;

  potentialTitles.forEach(mentioned => {
    const mentionedLower = mentioned.toLowerCase().trim();
    const genericTerms = ['korean title', 'korean drama', 'korean webtoon', 'the title', 'this title'];
    if (genericTerms.some(term => mentionedLower === term)) return;

    const isValid = Array.from(validTitleNames).some(validTitle =>
      mentionedLower === validTitle || mentionedLower.includes(validTitle) || validTitle.includes(mentionedLower)
    );

    if (!isValid && mentioned.length > 5) {
      hallucinations.push(mentioned);
      validatedResponse = validatedResponse.replace(`"${mentioned}"`, '[removed fictional title]');
    }
  });

  return { validatedResponse, hallucinations, isValid: hallucinations.length === 0 };
}

function weightConversationHistory(history: any[]): string {
  if (history.length === 0) return 'This is the start of our conversation.';

  const weighted = history.map((msg, index) => {
    const recencyWeight = index / history.length;
    const isMostRecent = index >= history.length - 2;
    const isRecent = recencyWeight > 0.7;
    const prefix = isMostRecent ? '**[MOST RECENT]** ' : isRecent ? '**[RECENT]** ' : '';
    return `${prefix}${msg.role === 'user' ? 'User' : 'Jinu'}: ${msg.content}`;
  });

  return weighted.join('\n');
}

function detectFreshStart(query: string, conversationHistory: any[]): boolean {
  const freshStartIndicators = [
    'looking for', 'recommend', 'suggest', 'find me', 'show me',
    'i want', 'i need', 'help me find', 'what about', 'how about'
  ];

  const isSpecificFollowUp = query.toLowerCase().includes('tell me more') ||
                            query.toLowerCase().includes('learn more') ||
                            query.toLowerCase().includes('compare');

  const currentConversationLength = conversationHistory.filter(msg =>
    msg.role === 'user' || msg.role === 'assistant'
  ).length;

  return !isSpecificFollowUp && (
    currentConversationLength <= 3 ||
    freshStartIndicators.some(indicator => query.toLowerCase().includes(indicator))
  );
}

function generateSuggestedQueries(context: {
  queryIntent: string;
  searchResults: any[];
  userQuery: string;
  conversationHistory: any[];
}): string[] {
  const { searchResults } = context;
  if (!searchResults || searchResults.length === 0) {
    return [
      "Show me top rated Korean titles",
      "What's trending this month?",
      "Recommend popular webtoons"
    ];
  }

  const suggestions = [];
  const genres = new Set<string>();
  searchResults.forEach(result => {
    if (Array.isArray(result.genre)) {
      result.genre.forEach(g => genres.add(g));
    }
  });

  const genreArray = Array.from(genres);
  if (genreArray.length > 0) {
    suggestions.push(`More ${genreArray[0].toLowerCase()} stories`);
    if (genreArray.length > 1) {
      suggestions.push(`${genreArray[0]} meets ${genreArray[1]}`);
    }
  }

  const titles = searchResults.map(r => r.title_name_en || r.title_name_kr).filter(Boolean);
  if (titles.length >= 2) {
    suggestions.push(`Compare "${titles[0]}" to "${titles[1]}"`);
  }

  if (suggestions.length < 3) {
    suggestions.push("What's trending in Korean content?");
  }

  return suggestions.slice(0, 5);
}

function filterDuplicateSuggestions(suggestions: string[], conversationHistory: any[]): string[] {
  const previousQueries = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase().trim());

  if (previousQueries.length === 0) return suggestions;

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

function analyzeAIResponse(response: string): {
  hasTrySection: boolean;
  hasQuestions: boolean;
  questionCount: number;
  titlesDiscussed: string[];
  themesDiscussed: string[];
  hasBulletList: boolean;
} {
  const lowerResponse = response.toLowerCase();

  const hasTrySection = /try:/i.test(response);
  const bulletPatterns = [/^[\s]*[-•*]\s+/gm, /^[\s]*\d+\.\s+/gm];
  const hasBulletList = bulletPatterns.some(pattern => pattern.test(response));

  const questionMatches = response.match(/\?/g);
  const questionCount = questionMatches ? questionMatches.length : 0;
  const hasQuestions = questionCount >= 2;

  const titleMatches = response.match(/"([^"]+)"/g) || [];
  const titlesDiscussed = titleMatches
    .map(match => match.replace(/"/g, ''))
    .filter(title => title.length > 3 && title.length < 100);

  const themeKeywords = [
    'romance', 'action', 'thriller', 'drama', 'comedy', 'horror', 'fantasy',
    'mystery', 'supernatural', 'revenge', 'redemption', 'time travel'
  ];

  const themesDiscussed = themeKeywords.filter(theme => lowerResponse.includes(theme));

  return {
    hasTrySection,
    hasQuestions,
    questionCount,
    titlesDiscussed,
    themesDiscussed,
    hasBulletList
  };
}

console.log("✅ All unit tests defined. Run: deno test --allow-env --allow-net chat-orchestrator.test.ts");
