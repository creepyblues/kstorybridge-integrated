/**
 * Levenshtein Distance Algorithm
 *
 * Calculates the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into another. Used for fuzzy matching of title names.
 *
 * Time Complexity: O(m * n) where m and n are string lengths
 * Space Complexity: O(min(m, n)) using optimized row-based approach
 *
 * @example
 * levenshteinDistance('kitten', 'sitting') // Returns 3
 * levenshteinDistance('Saturday', 'Sunday') // Returns 3
 */

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Minimum number of edits required to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Handle edge cases
  if (str1 === str2) return 0;
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  // Optimize by ensuring str1 is shorter (reduces space complexity)
  if (str1.length > str2.length) {
    [str1, str2] = [str2, str1];
  }

  const m = str1.length;
  const n = str2.length;

  // Use single array instead of matrix (space optimization)
  let previousRow = Array.from({ length: m + 1 }, (_, i) => i);
  let currentRow = new Array(m + 1);

  for (let j = 1; j <= n; j++) {
    currentRow[0] = j;

    for (let i = 1; i <= m; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      currentRow[i] = Math.min(
        previousRow[i] + 1,           // Deletion
        currentRow[i - 1] + 1,         // Insertion
        previousRow[i - 1] + substitutionCost  // Substitution
      );
    }

    // Swap rows for next iteration
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[m];
}

/**
 * Calculate normalized Levenshtein distance (0 to 1)
 *
 * Returns a value between 0 (completely different) and 1 (identical).
 * Useful for setting similarity thresholds.
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Normalized distance (0 = different, 1 = identical)
 *
 * @example
 * normalizedLevenshteinDistance('hello', 'hello') // Returns 1.0
 * normalizedLevenshteinDistance('hello', 'world') // Returns ~0.2
 */
export function normalizedLevenshteinDistance(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  // Avoid division by zero
  if (maxLength === 0) return 1.0;

  return 1 - (distance / maxLength);
}
