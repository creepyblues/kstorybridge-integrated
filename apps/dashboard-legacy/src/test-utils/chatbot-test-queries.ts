/**
 * Chatbot Test Queries
 *
 * Standard set of test queries for chatbot functionality testing.
 * Covers all intent types and ensures consistent test coverage.
 *
 * Usage:
 *   import { STANDARD_TEST_QUERIES, TEST_QUERIES_BY_INTENT } from '@/test-utils/chatbot-test-queries';
 */

export interface TestQuery {
  id: string;
  query: string;
  intent: 'discovery' | 'comparison' | 'information' | 'recommendation' | 'follow-up';
  expectedResults?: {
    minTitles?: number;
    maxTitles?: number;
    shouldIncludePitch?: boolean;
    shouldHaveLinks?: boolean;
    minResponseLength?: number;
  };
  tags: string[];
  description: string;
}

/**
 * Standard test queries organized by intent type
 */
export const TEST_QUERIES_BY_INTENT = {
  /**
   * Discovery Queries - User exploring catalog
   */
  DISCOVERY: [
    {
      id: 'discovery-01',
      query: 'Tell me about romantic webtoons',
      intent: 'discovery' as const,
      expectedResults: {
        minTitles: 3,
        maxTitles: 10,
        shouldHaveLinks: true,
        minResponseLength: 200,
      },
      tags: ['romance', 'genre-search'],
      description: 'Basic genre discovery query',
    },
    {
      id: 'discovery-02',
      query: 'What fantasy titles do you have?',
      intent: 'discovery' as const,
      expectedResults: {
        minTitles: 3,
        maxTitles: 10,
        shouldHaveLinks: true,
      },
      tags: ['fantasy', 'genre-search'],
      description: 'Fantasy genre exploration',
    },
    {
      id: 'discovery-03',
      query: 'Show me titles with high view counts',
      intent: 'discovery' as const,
      expectedResults: {
        minTitles: 5,
        shouldHaveLinks: true,
      },
      tags: ['popularity', 'metrics'],
      description: 'Popularity-based discovery',
    },
    {
      id: 'discovery-04',
      query: 'What webtoons have strong female leads?',
      intent: 'discovery' as const,
      expectedResults: {
        minTitles: 3,
        shouldHaveLinks: true,
      },
      tags: ['female-lead', 'character-trait'],
      description: 'Character-based discovery',
    },
    {
      id: 'discovery-05',
      query: 'Are there any action thrillers available?',
      intent: 'discovery' as const,
      expectedResults: {
        minTitles: 2,
        shouldHaveLinks: true,
      },
      tags: ['action', 'thriller', 'multi-genre'],
      description: 'Multi-genre discovery',
    },
  ],

  /**
   * Comparison Queries - User comparing multiple titles
   */
  COMPARISON: [
    {
      id: 'comparison-01',
      query: 'Compare Love in Seoul and Midnight Confession',
      intent: 'comparison' as const,
      expectedResults: {
        minTitles: 2,
        shouldHaveLinks: true,
        minResponseLength: 250,
      },
      tags: ['romance', 'compare-titles'],
      description: 'Direct title comparison',
    },
    {
      id: 'comparison-02',
      query: 'What are the differences between Tower of Trials and Moonlight Academy?',
      intent: 'comparison' as const,
      expectedResults: {
        minTitles: 2,
        shouldHaveLinks: true,
      },
      tags: ['fantasy', 'compare-titles'],
      description: 'Fantasy title comparison',
    },
    {
      id: 'comparison-03',
      query: 'Which has better ratings: Shadow Hunter or Neon Blade?',
      intent: 'comparison' as const,
      expectedResults: {
        minTitles: 2,
        shouldHaveLinks: true,
      },
      tags: ['action', 'ratings', 'metrics'],
      description: 'Rating-based comparison',
    },
  ],

  /**
   * Information Queries - User asking about specific title
   */
  INFORMATION: [
    {
      id: 'information-01',
      query: 'Tell me more about Love in Seoul',
      intent: 'information' as const,
      expectedResults: {
        minTitles: 1,
        shouldHaveLinks: true,
        shouldIncludePitch: true,
        minResponseLength: 200,
      },
      tags: ['romance', 'specific-title'],
      description: 'General information request',
    },
    {
      id: 'information-02',
      query: 'What is the synopsis of Tower of Trials?',
      intent: 'information' as const,
      expectedResults: {
        minTitles: 1,
        shouldHaveLinks: true,
      },
      tags: ['fantasy', 'synopsis'],
      description: 'Synopsis-specific query',
    },
    {
      id: 'information-03',
      query: 'How many chapters does The Last Mage have?',
      intent: 'information' as const,
      expectedResults: {
        minTitles: 1,
      },
      tags: ['fantasy', 'chapters', 'metrics'],
      description: 'Specific metric query',
    },
    {
      id: 'information-04',
      query: 'Who wrote Shadow Hunter?',
      intent: 'information' as const,
      expectedResults: {
        minTitles: 1,
      },
      tags: ['action', 'author'],
      description: 'Author information query',
    },
    {
      id: 'information-05',
      query: 'What is the rating for Moonlight Academy?',
      intent: 'information' as const,
      expectedResults: {
        minTitles: 1,
      },
      tags: ['fantasy', 'rating', 'metrics'],
      description: 'Rating query',
    },
  ],

  /**
   * Recommendation Queries - User seeking suggestions
   */
  RECOMMENDATION: [
    {
      id: 'recommendation-01',
      query: 'Recommend me something like Love in Seoul',
      intent: 'recommendation' as const,
      expectedResults: {
        minTitles: 3,
        maxTitles: 5,
        shouldHaveLinks: true,
        minResponseLength: 200,
      },
      tags: ['romance', 'similar'],
      description: 'Similar title recommendation',
    },
    {
      id: 'recommendation-02',
      query: 'What should I read if I like fantasy with magic schools?',
      intent: 'recommendation' as const,
      expectedResults: {
        minTitles: 2,
        shouldHaveLinks: true,
      },
      tags: ['fantasy', 'magic', 'school'],
      description: 'Theme-based recommendation',
    },
    {
      id: 'recommendation-03',
      query: 'Best titles for fans of psychological thrillers',
      intent: 'recommendation' as const,
      expectedResults: {
        minTitles: 3,
        shouldHaveLinks: true,
      },
      tags: ['thriller', 'psychological', 'best-of'],
      description: 'Genre-based best-of recommendation',
    },
    {
      id: 'recommendation-04',
      query: 'What completed series should I binge read?',
      intent: 'recommendation' as const,
      expectedResults: {
        minTitles: 3,
        shouldHaveLinks: true,
      },
      tags: ['completed', 'binge-read'],
      description: 'Completion status recommendation',
    },
  ],

  /**
   * Follow-up Queries - Contextual queries based on previous conversation
   */
  FOLLOW_UP: [
    {
      id: 'followup-01',
      query: 'Tell me more about the characters',
      intent: 'follow-up' as const,
      expectedResults: {
        minResponseLength: 100,
      },
      tags: ['characters', 'contextual'],
      description: 'Character follow-up (requires context)',
    },
    {
      id: 'followup-02',
      query: 'What about the plot?',
      intent: 'follow-up' as const,
      expectedResults: {
        minResponseLength: 100,
      },
      tags: ['plot', 'contextual'],
      description: 'Plot follow-up (requires context)',
    },
    {
      id: 'followup-03',
      query: 'Is it completed?',
      intent: 'follow-up' as const,
      expectedResults: {
        minResponseLength: 50,
      },
      tags: ['completion', 'contextual'],
      description: 'Completion status follow-up',
    },
    {
      id: 'followup-04',
      query: 'What are the viewer counts?',
      intent: 'follow-up' as const,
      expectedResults: {
        minResponseLength: 50,
      },
      tags: ['metrics', 'contextual'],
      description: 'Metrics follow-up',
    },
  ],
};

/**
 * Flattened array of all test queries
 */
export const STANDARD_TEST_QUERIES: TestQuery[] = [
  ...TEST_QUERIES_BY_INTENT.DISCOVERY,
  ...TEST_QUERIES_BY_INTENT.COMPARISON,
  ...TEST_QUERIES_BY_INTENT.INFORMATION,
  ...TEST_QUERIES_BY_INTENT.RECOMMENDATION,
  ...TEST_QUERIES_BY_INTENT.FOLLOW_UP,
];

/**
 * Test conversation flows (multi-turn conversations)
 */
export const TEST_CONVERSATIONS = [
  {
    id: 'conv-01',
    name: 'Discovery → Information → Follow-up',
    messages: [
      'Tell me about romantic webtoons',
      'Tell me more about Love in Seoul',
      'What about the characters?',
      'Is it completed?',
    ],
    expectedBehavior: 'Should maintain context across all 4 messages, no repetition',
  },
  {
    id: 'conv-02',
    name: 'Recommendation → Comparison',
    messages: [
      'Recommend me some fantasy titles',
      'Compare Tower of Trials and The Last Mage',
    ],
    expectedBehavior: 'Should reference titles from first recommendation in comparison',
  },
  {
    id: 'conv-03',
    name: 'Specific Title Deep Dive',
    messages: [
      'Tell me about Shadow Hunter',
      'What are the main characters?',
      'How does the plot develop?',
      'What makes it unique?',
    ],
    expectedBehavior: 'All responses should focus on Shadow Hunter, no repetition',
  },
];

/**
 * Edge case queries for testing robustness
 */
export const EDGE_CASE_QUERIES = [
  {
    id: 'edge-01',
    query: 'asdfghjkl',
    expectedBehavior: 'Should handle gracefully with "I don\'t understand" message',
    tags: ['error-handling', 'gibberish'],
  },
  {
    id: 'edge-02',
    query: 'Tell me about a title that doesn\'t exist',
    expectedBehavior: 'Should indicate title not found, suggest alternatives',
    tags: ['error-handling', 'not-found'],
  },
  {
    id: 'edge-03',
    query: '',
    expectedBehavior: 'Should handle empty query gracefully',
    tags: ['error-handling', 'empty'],
  },
  {
    id: 'edge-04',
    query: 'Show me titles with 10 billion views',
    expectedBehavior: 'Should explain no titles match criteria, suggest alternatives',
    tags: ['error-handling', 'unrealistic'],
  },
];

/**
 * Performance test queries (stress testing)
 */
export const PERFORMANCE_TEST_QUERIES = [
  {
    id: 'perf-01',
    query: 'Tell me about all your titles',
    expectedMaxResponseTime: 5000, // 5 seconds
    tags: ['performance', 'large-result'],
  },
  {
    id: 'perf-02',
    query: 'Compare all action titles with all romance titles',
    expectedMaxResponseTime: 8000, // 8 seconds
    tags: ['performance', 'complex-query'],
  },
];

/**
 * Helper: Get test queries by tag
 */
export function getQueriesByTag(tag: string): TestQuery[] {
  return STANDARD_TEST_QUERIES.filter(q => q.tags.includes(tag));
}

/**
 * Helper: Get test queries by intent
 */
export function getQueriesByIntent(intent: TestQuery['intent']): TestQuery[] {
  return STANDARD_TEST_QUERIES.filter(q => q.intent === intent);
}

/**
 * Helper: Get random test query
 */
export function getRandomTestQuery(): TestQuery {
  const randomIndex = Math.floor(Math.random() * STANDARD_TEST_QUERIES.length);
  return STANDARD_TEST_QUERIES[randomIndex];
}

/**
 * Helper: Get test query by ID
 */
export function getTestQueryById(id: string): TestQuery | undefined {
  return STANDARD_TEST_QUERIES.find(q => q.id === id);
}

/**
 * Quick test suite for smoke testing
 */
export const SMOKE_TEST_QUERIES = [
  TEST_QUERIES_BY_INTENT.DISCOVERY[0], // Romance discovery
  TEST_QUERIES_BY_INTENT.INFORMATION[0], // Love in Seoul info
  TEST_QUERIES_BY_INTENT.RECOMMENDATION[0], // Similar to Love in Seoul
];
