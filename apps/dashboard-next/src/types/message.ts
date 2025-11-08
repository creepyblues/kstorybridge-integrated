/**
 * Message Type Definitions
 *
 * Types for individual chat messages, including user and bot messages,
 * with support for rich content like title references and pitch decks.
 */

/**
 * Message sender type
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message sender (user or assistant) */
  role: MessageRole;
  /** Message text content */
  content: string;
  /** Timestamp when message was created */
  timestamp: Date;
  /** Whether message is currently streaming */
  isStreaming?: boolean;
  /** Parsed message metadata */
  metadata?: MessageMetadata;
}

/**
 * Message metadata (extracted during parsing)
 */
export interface MessageMetadata {
  /** Title references found in message */
  titleReferences?: TitleReference[];
  /** Suggested follow-up queries */
  suggestedQueries?: string[];
  /** Whether message mentions pitch deck */
  hasPitchReference?: boolean;
  /** Matched titles from database */
  matchedTitles?: MatchedTitle[];
}

/**
 * Title reference in message
 */
export interface TitleReference {
  /** Title name as mentioned in message */
  titleName: string;
  /** Normalized title for matching */
  normalizedName: string;
  /** Position in message text */
  startIndex: number;
  /** End position in message text */
  endIndex: number;
  /** Whether this is a Korean title */
  isKorean: boolean;
}

/**
 * Matched title from database
 */
export interface MatchedTitle {
  /** Title ID */
  titleId: string;
  /** Korean title name */
  titleNameKr: string | null;
  /** English title name */
  titleNameEn: string | null;
  /** Match confidence (0-1) */
  matchScore: number;
  /** Whether title has pitch deck */
  hasPitch: boolean;
  /** Pitch URL if available */
  pitchUrl?: string | null;
}

/**
 * Message formatting options
 */
export interface MessageFormatOptions {
  /** Whether to parse title links */
  parseTitles?: boolean;
  /** Whether to extract suggested queries */
  parseSuggestedQueries?: boolean;
  /** Whether to check for pitch references */
  checkPitchReferences?: boolean;
  /** Whether to match titles against database */
  matchTitlesInDatabase?: boolean;
}

/**
 * Message display component props
 */
export interface MessageDisplayProps {
  /** Message to display */
  message: ChatMessage;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
  /** Whether to enable title link clicks */
  enableTitleLinks?: boolean;
  /** Callback when title is clicked */
  onTitleClick?: (titleId: string) => void;
  /** Callback when suggested query is clicked */
  onSuggestedQueryClick?: (query: string) => void;
}

/**
 * Suggested query button props
 */
export interface SuggestedQueryProps {
  /** Query text */
  query: string;
  /** Click handler */
  onClick: (query: string) => void;
  /** Disabled state */
  disabled?: boolean;
}
