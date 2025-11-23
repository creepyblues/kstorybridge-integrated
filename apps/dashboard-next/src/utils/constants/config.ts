/**
 * Application Configuration Constants
 *
 * Centralized configuration values for the dashboard-next application.
 * Extract magic numbers and common values to improve maintainability.
 */

// ======================
// Cache Configuration
// ======================

/**
 * Number of titles to load into memory for fuzzy matching in chat
 * Reduced from 1500 to 500 for better performance
 */
export const TITLE_CACHE_SIZE = 500;

/**
 * Cache expiration time in milliseconds (24 hours)
 */
export const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// ======================
// Pagination
// ======================

/**
 * Default page size for title listings
 */
export const DEFAULT_PAGE_SIZE = 12;

/**
 * Page size for search results
 */
export const SEARCH_PAGE_SIZE = 30;

// ======================
// Vector Search
// ======================

/**
 * Maximum results to return from vector search
 */
export const VECTOR_SEARCH_LIMIT = 30;

/**
 * Minimum similarity threshold for vector search (0-1)
 */
export const VECTOR_SEARCH_THRESHOLD = 0.4;

/**
 * Maximum results for mandate matcher
 */
export const MANDATE_SEARCH_LIMIT = 15;

// ======================
// Character Limits
// ======================

/**
 * Maximum characters for mandate text input
 */
export const MANDATE_MAX_CHARS = 1000;

/**
 * Maximum characters for comp refinement input
 */
export const COMP_REFINEMENT_MAX_CHARS = 200;

// ======================
// Comp Navigator
// ======================

/**
 * Minimum number of comps required
 */
export const MIN_COMPS = 1;

/**
 * Maximum number of comps allowed
 */
export const MAX_COMPS = 3;

/**
 * Maximum saved searches to display in history
 */
export const MAX_SAVED_SEARCHES = 50;

// ======================
// API Timeouts
// ======================

/**
 * Default API request timeout in milliseconds
 */
export const API_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Edge function timeout for complex operations (e.g., comp search)
 */
export const EDGE_FUNCTION_TIMEOUT_MS = 60000; // 60 seconds

// ======================
// UI Constants
// ======================

/**
 * Number of title cards to show in grid before "Show More"
 */
export const TITLES_GRID_INITIAL_COUNT = 6;

/**
 * Debounce delay for search input (milliseconds)
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Toast notification duration (milliseconds)
 */
export const TOAST_DURATION_MS = 3000;

// ======================
// Fuzzy Matching
// ======================

/**
 * Minimum similarity score for fuzzy title matching (0-1)
 * 0.8 = 80% similarity required
 */
export const FUZZY_MATCH_THRESHOLD = 0.8;

// ======================
// Session Management
// ======================

/**
 * Time to keep chat messages in session (milliseconds)
 * Default: 24 hours
 */
export const CHAT_MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum chat sessions to keep per user
 */
export const MAX_CHAT_SESSIONS = 10;

// ======================
// Analytics
// ======================

/**
 * Batch size for analytics events
 */
export const ANALYTICS_BATCH_SIZE = 10;

/**
 * Analytics flush interval (milliseconds)
 */
export const ANALYTICS_FLUSH_INTERVAL_MS = 5000; // 5 seconds

// ======================
// Feature Flags
// ======================

/**
 * Enable debug logging in development
 */
export const DEBUG_MODE = import.meta.env.DEV;

/**
 * Enable authentication debug mode
 */
export const AUTH_DEBUG = import.meta.env.VITE_AUTH_DEBUG === 'true';

/**
 * Enable OAuth testing mode
 */
export const OAUTH_TESTING = import.meta.env.VITE_OAUTH_TESTING === 'true';
