/**
 * Unit Tests for Smart Prioritization Algorithm
 *
 * These tests verify the scoring formula:
 * finalScore = (similarity × 35%) + (hasPitchDeck × 25%) + (priority × 20%) + (verified × 10%) + (engagement × 10%)
 */

import { describe, it, expect } from 'vitest';

// Extracted prioritization logic for testing
// (mirrors the edge function implementation)

interface CandidateWithPriority {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  synopsis: string;
  similarity: number;
  priority: string | null;
  verified: boolean;
  views: number;
  likes: number;
  hasPitchDeck?: boolean;
  priorityScore?: number;
}

function calculatePriorityScore(
  candidate: CandidateWithPriority,
  maxEngagement: number
): number {
  // Weights: similarity (35%) + pitch deck (25%) + priority (20%) + verified (10%) + engagement (10%)
  const similarityScore = (candidate.similarity || 0) * 0.35;

  const pitchDeckScore = candidate.hasPitchDeck ? 0.25 : 0;

  // Priority: '1' = 1.0, '2' = 0.5, '3' or null = 0
  const priorityValue = candidate.priority === '1' ? 1.0 : candidate.priority === '2' ? 0.5 : 0;
  const priorityScore = priorityValue * 0.20;

  const verifiedScore = candidate.verified ? 0.10 : 0;

  // Normalize engagement to 0-1 range
  const engagement = ((candidate.views || 0) + (candidate.likes || 0)) / Math.max(maxEngagement, 1);
  const engagementScore = Math.min(engagement, 1) * 0.10;

  return similarityScore + pitchDeckScore + priorityScore + verifiedScore + engagementScore;
}

function applySmartPrioritization(
  candidates: CandidateWithPriority[],
  titlesWithPitchDeck: Set<string>
): CandidateWithPriority[] {
  if (candidates.length === 0) return [];

  // Calculate max engagement for normalization
  const maxEngagement = Math.max(
    ...candidates.map(c => (c.views || 0) + (c.likes || 0)),
    1
  );

  // Add pitch deck info and calculate priority scores
  const candidatesWithScores = candidates.map(c => ({
    ...c,
    hasPitchDeck: titlesWithPitchDeck.has(c.title_id),
    priorityScore: 0,
  }));

  // Calculate priority scores
  for (const candidate of candidatesWithScores) {
    candidate.priorityScore = calculatePriorityScore(candidate, maxEngagement);
  }

  // Sort by priority score (descending)
  candidatesWithScores.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  return candidatesWithScores;
}

// Helper to create test candidates
function createCandidate(overrides: Partial<CandidateWithPriority>): CandidateWithPriority {
  return {
    title_id: 'uuid-' + Math.random().toString(36).substr(2, 9),
    title_name_en: 'Test Title',
    title_name_kr: '테스트',
    synopsis: 'A story',
    similarity: 0.8,
    priority: null,
    verified: false,
    views: 0,
    likes: 0,
    ...overrides,
  };
}

describe('calculatePriorityScore', () => {
  describe('similarity scoring (35% weight)', () => {
    it('should give 0.35 for perfect similarity (1.0)', () => {
      const candidate = createCandidate({ similarity: 1.0 });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.35, 2);
    });

    it('should give 0.175 for 50% similarity', () => {
      const candidate = createCandidate({ similarity: 0.5 });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.175, 2);
    });

    it('should give 0 for no similarity', () => {
      const candidate = createCandidate({ similarity: 0 });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0, 2);
    });

    it('should handle undefined similarity', () => {
      const candidate = createCandidate({});
      // @ts-ignore - Testing edge case
      candidate.similarity = undefined;
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBe(0);
    });
  });

  describe('pitch deck scoring (25% weight)', () => {
    it('should give 0.25 bonus for having pitch deck', () => {
      const candidate = createCandidate({ similarity: 0, hasPitchDeck: true });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.25, 2);
    });

    it('should give 0 for no pitch deck', () => {
      const candidate = createCandidate({ similarity: 0, hasPitchDeck: false });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0, 2);
    });
  });

  describe('priority scoring (20% weight)', () => {
    it('should give 0.20 for priority 1', () => {
      const candidate = createCandidate({ similarity: 0, priority: '1' });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.20, 2);
    });

    it('should give 0.10 for priority 2', () => {
      const candidate = createCandidate({ similarity: 0, priority: '2' });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.10, 2);
    });

    it('should give 0 for priority 3', () => {
      const candidate = createCandidate({ similarity: 0, priority: '3' });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0, 2);
    });

    it('should give 0 for null priority', () => {
      const candidate = createCandidate({ similarity: 0, priority: null });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0, 2);
    });
  });

  describe('verified scoring (10% weight)', () => {
    it('should give 0.10 for verified titles', () => {
      const candidate = createCandidate({ similarity: 0, verified: true });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0.10, 2);
    });

    it('should give 0 for unverified titles', () => {
      const candidate = createCandidate({ similarity: 0, verified: false });
      const score = calculatePriorityScore(candidate, 1);
      expect(score).toBeCloseTo(0, 2);
    });
  });

  describe('engagement scoring (10% weight)', () => {
    it('should give 0.10 for max engagement', () => {
      const candidate = createCandidate({ similarity: 0, views: 100000, likes: 50000 });
      const score = calculatePriorityScore(candidate, 150000);
      expect(score).toBeCloseTo(0.10, 2);
    });

    it('should give 0.05 for half of max engagement', () => {
      const candidate = createCandidate({ similarity: 0, views: 50000, likes: 25000 });
      const score = calculatePriorityScore(candidate, 150000);
      expect(score).toBeCloseTo(0.05, 2);
    });

    it('should give 0 for no engagement', () => {
      const candidate = createCandidate({ similarity: 0, views: 0, likes: 0 });
      const score = calculatePriorityScore(candidate, 150000);
      expect(score).toBeCloseTo(0, 2);
    });

    it('should handle maxEngagement of 0', () => {
      const candidate = createCandidate({ similarity: 0, views: 100, likes: 50 });
      const score = calculatePriorityScore(candidate, 0);
      // Should use 1 as minimum to avoid division by zero
      expect(score).toBeCloseTo(0.10, 2);
    });

    it('should cap engagement score at 0.10 even if exceeds max', () => {
      const candidate = createCandidate({ similarity: 0, views: 200000, likes: 100000 });
      const score = calculatePriorityScore(candidate, 100000);
      // engagement = 300000 / 100000 = 3.0, but capped at 1.0
      expect(score).toBeLessThanOrEqual(0.10);
    });
  });

  describe('combined scoring', () => {
    it('should calculate perfect score (all factors maxed)', () => {
      const candidate = createCandidate({
        similarity: 1.0,
        priority: '1',
        verified: true,
        views: 100000,
        likes: 50000,
        hasPitchDeck: true,
      });
      const score = calculatePriorityScore(candidate, 150000);
      // 0.35 + 0.25 + 0.20 + 0.10 + 0.10 = 1.0
      expect(score).toBeCloseTo(1.0, 2);
    });

    it('should calculate typical high-quality title score', () => {
      const candidate = createCandidate({
        similarity: 0.85,
        priority: '1',
        verified: true,
        views: 50000,
        likes: 10000,
        hasPitchDeck: true,
      });
      const score = calculatePriorityScore(candidate, 100000);
      // 0.85 * 0.35 + 0.25 + 0.20 + 0.10 + 0.60 * 0.10
      // = 0.2975 + 0.25 + 0.20 + 0.10 + 0.06 = 0.9075
      expect(score).toBeGreaterThan(0.85);
      expect(score).toBeLessThan(1.0);
    });

    it('should calculate low-quality title score', () => {
      const candidate = createCandidate({
        similarity: 0.65,
        priority: '3',
        verified: false,
        views: 100,
        likes: 10,
        hasPitchDeck: false,
      });
      const score = calculatePriorityScore(candidate, 100000);
      // Only similarity contributes: 0.65 * 0.35 = 0.2275
      expect(score).toBeCloseTo(0.2275, 2);
    });
  });
});

describe('applySmartPrioritization', () => {
  describe('empty input handling', () => {
    it('should return empty array for empty candidates', () => {
      const result = applySmartPrioritization([], new Set());
      expect(result).toEqual([]);
    });
  });

  describe('sorting behavior', () => {
    it('should sort candidates by priority score descending', () => {
      const candidates = [
        createCandidate({ title_id: 'low', similarity: 0.5, priority: '3' }),
        createCandidate({ title_id: 'high', similarity: 0.9, priority: '1', verified: true }),
        createCandidate({ title_id: 'medium', similarity: 0.7, priority: '2' }),
      ];

      const result = applySmartPrioritization(candidates, new Set());

      expect(result[0].title_id).toBe('high');
      expect(result[1].title_id).toBe('medium');
      expect(result[2].title_id).toBe('low');
    });

    it('should prioritize pitch deck titles', () => {
      const candidates = [
        createCandidate({ title_id: 'no-deck', similarity: 0.9 }),
        createCandidate({ title_id: 'has-deck', similarity: 0.7 }),
      ];

      const titlesWithPitchDeck = new Set(['has-deck']);
      const result = applySmartPrioritization(candidates, titlesWithPitchDeck);

      // has-deck: 0.7 * 0.35 + 0.25 = 0.495
      // no-deck: 0.9 * 0.35 = 0.315
      expect(result[0].title_id).toBe('has-deck');
      expect(result[0].hasPitchDeck).toBe(true);
    });

    it('should boost verified titles', () => {
      const candidates = [
        createCandidate({ title_id: 'unverified', similarity: 0.8, verified: false }),
        createCandidate({ title_id: 'verified', similarity: 0.75, verified: true }),
      ];

      const result = applySmartPrioritization(candidates, new Set());

      // verified: 0.75 * 0.35 + 0.10 = 0.3625
      // unverified: 0.8 * 0.35 = 0.28
      expect(result[0].title_id).toBe('verified');
    });
  });

  describe('score assignment', () => {
    it('should assign priorityScore to all candidates', () => {
      const candidates = [
        createCandidate({ title_id: 'a' }),
        createCandidate({ title_id: 'b' }),
      ];

      const result = applySmartPrioritization(candidates, new Set());

      result.forEach(candidate => {
        expect(candidate.priorityScore).toBeDefined();
        expect(typeof candidate.priorityScore).toBe('number');
        expect(candidate.priorityScore).toBeGreaterThanOrEqual(0);
        expect(candidate.priorityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should assign hasPitchDeck correctly', () => {
      const candidates = [
        createCandidate({ title_id: 'with-deck' }),
        createCandidate({ title_id: 'without-deck' }),
      ];

      const titlesWithPitchDeck = new Set(['with-deck']);
      const result = applySmartPrioritization(candidates, titlesWithPitchDeck);

      const withDeck = result.find(c => c.title_id === 'with-deck');
      const withoutDeck = result.find(c => c.title_id === 'without-deck');

      expect(withDeck?.hasPitchDeck).toBe(true);
      expect(withoutDeck?.hasPitchDeck).toBe(false);
    });
  });

  describe('engagement normalization', () => {
    it('should normalize engagement across candidates', () => {
      const candidates = [
        createCandidate({ title_id: 'popular', similarity: 0.7, views: 1000000, likes: 500000 }),
        createCandidate({ title_id: 'unpopular', similarity: 0.9, views: 100, likes: 10 }),
      ];

      const result = applySmartPrioritization(candidates, new Set());

      // popular: 0.7 * 0.35 + 0.10 = 0.345
      // unpopular: 0.9 * 0.35 + ~0 = 0.315
      expect(result[0].title_id).toBe('popular');
    });
  });

  describe('real-world scenario', () => {
    it('should correctly rank mixed quality titles', () => {
      const candidates = [
        // High semantic match, no business signals
        createCandidate({
          title_id: 'semantic-only',
          title_name_en: 'Semantic Match',
          similarity: 0.95,
          priority: null,
          verified: false,
          views: 0,
          likes: 0,
        }),
        // Medium semantic match, but priority 1 with pitch deck
        createCandidate({
          title_id: 'business-ready',
          title_name_en: 'Business Ready',
          similarity: 0.75,
          priority: '1',
          verified: true,
          views: 50000,
          likes: 10000,
        }),
        // Low semantic match, but verified with high engagement
        createCandidate({
          title_id: 'popular',
          title_name_en: 'Popular Title',
          similarity: 0.65,
          priority: '2',
          verified: true,
          views: 100000,
          likes: 50000,
        }),
      ];

      const titlesWithPitchDeck = new Set(['business-ready']);
      const result = applySmartPrioritization(candidates, titlesWithPitchDeck);

      // business-ready: 0.75*0.35 + 0.25 + 0.20 + 0.10 + 0.40*0.10 = 0.8625
      // popular: 0.65*0.35 + 0 + 0.10 + 0.10 + 1.0*0.10 = 0.5275
      // semantic-only: 0.95*0.35 + 0 + 0 + 0 + 0 = 0.3325

      expect(result[0].title_id).toBe('business-ready');
      expect(result[0].priorityScore).toBeGreaterThan(0.8);

      // Semantic-only should be last despite high similarity
      expect(result[2].title_id).toBe('semantic-only');
    });
  });
});

describe('edge cases and error handling', () => {
  it('should handle negative values gracefully', () => {
    const candidate = createCandidate({
      similarity: -0.5,
      views: -100,
      likes: -50,
    });
    const score = calculatePriorityScore(candidate, 1000);
    // Should not throw, negative similarity gives negative contribution
    expect(typeof score).toBe('number');
  });

  it('should handle very large numbers', () => {
    const candidate = createCandidate({
      similarity: 1.0,
      views: Number.MAX_SAFE_INTEGER,
      likes: 1000000,
    });
    const score = calculatePriorityScore(candidate, Number.MAX_SAFE_INTEGER);
    // Should cap at 1.0 and not overflow
    expect(score).toBeLessThanOrEqual(1.0);
    expect(isFinite(score)).toBe(true);
  });

  it('should handle NaN values gracefully', () => {
    const candidate = createCandidate({
      similarity: NaN,
    });
    const score = calculatePriorityScore(candidate, 1000);
    // NaN is falsy, so (NaN || 0) = 0, resulting in score of 0
    // This is actually correct defensive behavior
    expect(score).toBe(0);
    expect(isFinite(score)).toBe(true);
  });
});
