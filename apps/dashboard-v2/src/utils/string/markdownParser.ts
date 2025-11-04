/**
 * Markdown Parser for Chat Messages
 *
 * Parses chatbot responses to extract structured elements like title links,
 * suggested queries, and formatted text. Handles custom markdown patterns
 * used by the chatbot.
 */

export interface ParsedMessage {
  /** Raw text content */
  text: string;
  /** Extracted title references with their positions */
  titleReferences: TitleReference[];
  /** Suggested follow-up queries */
  suggestedQueries: string[];
  /** Whether message contains pitch deck reference */
  hasPitchReference: boolean;
}

export interface TitleReference {
  /** Title name as it appears in message */
  titleName: string;
  /** Starting position in text */
  startIndex: number;
  /** Ending position in text */
  endIndex: number;
  /** Whether this is a Korean title */
  isKorean: boolean;
}

/**
 * Title link pattern: [Title Name](title-id)
 * Example: [The Story](abc-123)
 */
const TITLE_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Suggested query pattern: - "Query text"
 * Example: - "Tell me more about this"
 */
const SUGGESTED_QUERY_REGEX = /^-\s+"([^"]+)"/gm;

/**
 * Pitch deck reference patterns
 */
const PITCH_REFERENCE_PATTERNS = [
  /pitch deck/i,
  /view pitch/i,
  /see the pitch/i,
  /pitch for this title/i,
];

/**
 * Parse a chatbot message into structured elements
 *
 * @param message - Raw chatbot message text
 * @returns Parsed message with extracted elements
 *
 * @example
 * parseMessage('Check out [The Story](title-123)! - "Tell me more"')
 * // Returns { text: '...', titleReferences: [...], suggestedQueries: ['Tell me more'], ... }
 */
export function parseMessage(message: string): ParsedMessage {
  const titleReferences = extractTitleReferences(message);
  const suggestedQueries = extractSuggestedQueries(message);
  const hasPitchReference = checkPitchReference(message);

  return {
    text: message,
    titleReferences,
    suggestedQueries,
    hasPitchReference
  };
}

/**
 * Extract title references from message
 *
 * Finds all [Title](id) patterns in the message.
 *
 * @param message - Message text
 * @returns Array of title references with positions
 */
export function extractTitleReferences(message: string): TitleReference[] {
  const references: TitleReference[] = [];
  const regex = new RegExp(TITLE_LINK_REGEX);
  let match;

  while ((match = regex.exec(message)) !== null) {
    const titleName = match[1];
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    references.push({
      titleName,
      startIndex,
      endIndex,
      isKorean: containsKorean(titleName)
    });
  }

  return references;
}

/**
 * Extract suggested queries from message
 *
 * Finds all - "Query text" patterns, typically at the end of messages.
 *
 * @param message - Message text
 * @returns Array of suggested query strings
 */
export function extractSuggestedQueries(message: string): string[] {
  const queries: string[] = [];
  const regex = new RegExp(SUGGESTED_QUERY_REGEX);
  let match;

  while ((match = regex.exec(message)) !== null) {
    queries.push(match[1]);
  }

  return queries;
}

/**
 * Check if message contains pitch deck reference
 *
 * @param message - Message text
 * @returns True if message mentions pitch deck
 */
export function checkPitchReference(message: string): boolean {
  return PITCH_REFERENCE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Remove markdown formatting for plain text display
 *
 * @param message - Message with markdown
 * @returns Plain text without markdown
 *
 * @example
 * stripMarkdown('**Bold** and _italic_') // Returns 'Bold and italic'
 */
export function stripMarkdown(message: string): string {
  return message
    // Remove bold/italic
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // Remove title links
    .replace(TITLE_LINK_REGEX, '$1')
    // Remove suggested queries
    .replace(SUGGESTED_QUERY_REGEX, '')
    .trim();
}

/**
 * Convert message to React-friendly format
 *
 * Splits message into segments that can be rendered with different components.
 * Preserves title links as separate segments for clickable rendering.
 *
 * @param message - Raw message text
 * @returns Array of segments (text or title link)
 */
export function splitMessageSegments(message: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const titleRefs = extractTitleReferences(message);

  if (titleRefs.length === 0) {
    return [{ type: 'text', content: message }];
  }

  let lastIndex = 0;

  for (const ref of titleRefs) {
    // Add text before title link
    if (ref.startIndex > lastIndex) {
      const textContent = message.slice(lastIndex, ref.startIndex);
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Add title link segment
    segments.push({
      type: 'titleLink',
      content: ref.titleName,
      titleName: ref.titleName
    });

    lastIndex = ref.endIndex;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    const textContent = message.slice(lastIndex);
    if (textContent) {
      segments.push({ type: 'text', content: textContent });
    }
  }

  return segments;
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'titleLink'; content: string; titleName: string };

/**
 * Check if string contains Korean characters
 *
 * @param text - Text to check
 * @returns True if text contains Hangul characters
 */
function containsKorean(text: string): boolean {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}
