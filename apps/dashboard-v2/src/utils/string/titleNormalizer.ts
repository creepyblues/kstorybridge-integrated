/**
 * Title Name Normalizer
 *
 * Cleans and normalizes title names for consistent matching across different formats.
 * Handles Korean/English titles, special characters, and common variations.
 */

/**
 * Common title prefixes to remove for better matching
 */
const COMMON_PREFIXES = [
  'the ',
  'a ',
  'an ',
  '더 ',
  '그 ',
];

/**
 * Special characters to remove (keep alphanumeric, Korean, spaces, and basic punctuation)
 */
const SPECIAL_CHARS_REGEX = /[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?-]/g;

/**
 * Multiple spaces regex
 */
const MULTIPLE_SPACES_REGEX = /\s+/g;

/**
 * Normalize a title for matching
 *
 * Steps:
 * 1. Convert to lowercase
 * 2. Remove special characters (keep Korean, alphanumeric, basic punctuation)
 * 3. Remove common prefixes (the, a, an, etc.)
 * 4. Trim whitespace
 * 5. Collapse multiple spaces
 *
 * @param title - Title string to normalize
 * @returns Normalized title string
 *
 * @example
 * normalizeTitle('The Story of My Life!') // Returns 'story of my life'
 * normalizeTitle('  A   Tale  ') // Returns 'tale'
 * normalizeTitle('그 이야기') // Returns '이야기'
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';

  let normalized = title.toLowerCase().trim();

  // Remove special characters
  normalized = normalized.replace(SPECIAL_CHARS_REGEX, '');

  // Remove common prefixes
  for (const prefix of COMMON_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break; // Only remove one prefix
    }
  }

  // Collapse multiple spaces and trim
  normalized = normalized.replace(MULTIPLE_SPACES_REGEX, ' ').trim();

  return normalized;
}

/**
 * Normalize both title variants for comparison
 *
 * Handles cases where titles have Korean and English versions.
 * Returns both normalized versions for matching.
 *
 * @param titleKr - Korean title (optional)
 * @param titleEn - English title (optional)
 * @returns Object with normalized Korean and English titles
 *
 * @example
 * normalizeTitleVariants('그 이야기', 'The Story')
 * // Returns { kr: '이야기', en: 'story' }
 */
export function normalizeTitleVariants(
  titleKr?: string | null,
  titleEn?: string | null
): { kr: string; en: string } {
  return {
    kr: normalizeTitle(titleKr || ''),
    en: normalizeTitle(titleEn || '')
  };
}

/**
 * Extract title name from a message
 *
 * Looks for quoted strings, title patterns, or fallback to entire message.
 * Handles common formats:
 * - "Title Name" (quoted)
 * - Title Name (unquoted but capitalized)
 * - title: Title Name
 *
 * @param message - Message text containing title reference
 * @returns Extracted and normalized title, or empty string
 *
 * @example
 * extractTitleFromMessage('Tell me about "The Story"') // Returns 'story'
 * extractTitleFromMessage('What is the plot of A Tale?') // Returns 'tale'
 */
export function extractTitleFromMessage(message: string): string {
  if (!message) return '';

  // Try to find quoted title first
  const quotedMatch = message.match(/["'「『]([^"'」』]+)["'」』]/);
  if (quotedMatch) {
    return normalizeTitle(quotedMatch[1]);
  }

  // Try to find "title: <name>" pattern
  const titlePatternMatch = message.match(/title:\s*(.+?)(?:\?|\.|\n|$)/i);
  if (titlePatternMatch) {
    return normalizeTitle(titlePatternMatch[1]);
  }

  // Fallback: use entire message if it's short enough (likely a title)
  if (message.length < 100) {
    return normalizeTitle(message);
  }

  return '';
}

/**
 * Check if a message contains a title reference
 *
 * @param message - Message text to check
 * @returns True if message likely contains a title reference
 *
 * @example
 * containsTitleReference('Tell me about "The Story"') // Returns true
 * containsTitleReference('What genres do you have?') // Returns false
 */
export function containsTitleReference(message: string): boolean {
  if (!message) return false;

  // Check for quoted strings
  if (/"[^"]+"|'[^']+'|「[^」]+」|『[^』]+』/.test(message)) {
    return true;
  }

  // Check for "title:" pattern
  if (/title:/i.test(message)) {
    return true;
  }

  return false;
}
