/**
 * Chat Configuration Constants
 *
 * Centralized configuration for chatbot behavior, limits, and settings.
 */

/**
 * Maximum number of messages to display in chat history
 */
export const MAX_CHAT_HISTORY = 50;

/**
 * Maximum number of recent messages to send for context
 */
export const CONTEXT_MESSAGE_LIMIT = 5;

/**
 * Similarity threshold for fuzzy title matching (80%)
 */
export const TITLE_MATCH_THRESHOLD = 0.8;

/**
 * Number of titles to cache for quick lookup
 */
export const TITLE_CACHE_SIZE = 1000;

/**
 * Debounce delay for input typing (ms)
 */
export const INPUT_DEBOUNCE_MS = 300;

/**
 * Auto-scroll behavior threshold (px from bottom)
 */
export const AUTO_SCROLL_THRESHOLD = 100;

/**
 * Message streaming chunk size (characters)
 */
export const STREAMING_CHUNK_SIZE = 10;

/**
 * Streaming animation delay (ms)
 */
export const STREAMING_DELAY_MS = 20;

/**
 * Maximum title cache staleness (ms) - 5 minutes
 */
export const TITLE_CACHE_STALE_TIME = 5 * 60 * 1000;

/**
 * TanStack Query cache time for titles (ms) - 10 minutes
 */
export const QUERY_CACHE_TIME = 10 * 60 * 1000;

/**
 * Default suggested queries for new users
 */
export const DEFAULT_SUGGESTED_QUERIES = [
  "What genres do you have?",
  "Show me popular romance titles",
  "Tell me about trending webtoons",
  "What's new this month?"
];

/**
 * Chatbot persona name
 */
export const BOT_NAME = 'Jinu';

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "I'm having trouble connecting. Please check your internet and try again.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again later.",
  NO_TITLES_FOUND: "I couldn't find any titles matching your query.",
  TITLE_LOAD_ERROR: "I couldn't load the title details. Please try again."
} as const;

/**
 * Loading messages (shown while waiting for response)
 */
export const LOADING_MESSAGES = [
  "Thinking...",
  "Searching titles...",
  "Looking that up...",
  "Let me check..."
] as const;

/**
 * Empty state messages (shown when no chat history)
 */
export const EMPTY_STATE = {
  GREETING: `Hi! I'm ${BOT_NAME}, your K-content discovery assistant.`,
  SUBTITLE: "Ask me about Korean stories, webtoons, and dramas you might love!",
  PLACEHOLDER: "Try asking about genres, popular titles, or specific stories..."
} as const;
