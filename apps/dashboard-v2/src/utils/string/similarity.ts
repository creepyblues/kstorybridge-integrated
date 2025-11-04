/**
 * String Similarity Scoring
 *
 * Provides various similarity metrics for comparing strings, particularly for title matching.
 * Uses Levenshtein distance as the primary algorithm with configurable thresholds.
 */

import { normalizedLevenshteinDistance } from './levenshtein';

/**
 * Default similarity threshold (80%)
 * Titles with similarity >= 0.8 are considered matches
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.8;

/**
 * Calculate similarity score between two strings (0 to 1)
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity score (0 = completely different, 1 = identical)
 *
 * @example
 * calculateSimilarity('The Story', 'The Story') // Returns 1.0
 * calculateSimilarity('The Story', 'A Story') // Returns ~0.67
 */
export function calculateSimilarity(str1: string, str2: string): number {
  return normalizedLevenshteinDistance(str1, str2);
}

/**
 * Check if two strings are similar based on threshold
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param threshold - Minimum similarity score (default: 0.8)
 * @returns True if similarity >= threshold
 *
 * @example
 * isSimilar('Hello World', 'Hello World') // Returns true
 * isSimilar('Hello World', 'Goodbye World') // Returns false (default 0.8 threshold)
 * isSimilar('Hello World', 'Goodbye World', 0.3) // Returns true (lower threshold)
 */
export function isSimilar(
  str1: string,
  str2: string,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find best match from a list of candidates
 *
 * @param target - String to match against
 * @param candidates - List of candidate strings
 * @param threshold - Minimum similarity score (default: 0.8)
 * @returns Best matching candidate and its score, or null if no match
 *
 * @example
 * findBestMatch('The Story', ['A Story', 'The Tale', 'The Story Book'])
 * // Returns { match: 'The Story Book', score: 0.92 }
 */
export function findBestMatch(
  target: string,
  candidates: string[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): { match: string; score: number } | null {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = calculateSimilarity(target, candidate);
    if (score >= threshold && score > bestScore) {
      bestMatch = candidate;
      bestScore = score;
    }
  }

  return bestMatch ? { match: bestMatch, score: bestScore } : null;
}

/**
 * Find all matches above threshold
 *
 * @param target - String to match against
 * @param candidates - List of candidate strings
 * @param threshold - Minimum similarity score (default: 0.8)
 * @returns Array of matches with scores, sorted by score descending
 *
 * @example
 * findAllMatches('Story', ['The Story', 'A Story', 'Different Title'])
 * // Returns [{ match: 'The Story', score: 0.83 }, { match: 'A Story', score: 0.86 }]
 */
export function findAllMatches(
  target: string,
  candidates: string[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Array<{ match: string; score: number }> {
  return candidates
    .map((candidate) => ({
      match: candidate,
      score: calculateSimilarity(target, candidate)
    }))
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
