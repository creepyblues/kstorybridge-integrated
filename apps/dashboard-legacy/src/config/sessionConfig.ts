/**
 * Session Management Configuration
 *
 * Centralized configuration for all session-related timeouts, intervals, and thresholds.
 * This file is the single source of truth for session timing values across the application.
 *
 * @module SessionConfig
 */

/**
 * Session timing constants in milliseconds
 */
export const SESSION_CONFIG = {
  /**
   * Health check interval - how often to verify session integrity
   * Used by: useAuth.tsx periodic health monitoring
   * Reduced to 10 minutes to decrease load during outages
   */
  HEALTH_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes (reduced from 5 minutes)

  /**
   * Protected route throttle - minimum time between session checks on route navigation
   * Used by: ProtectedRoute.tsx to prevent excessive health checks
   */
  PROTECTED_ROUTE_THROTTLE: 30 * 1000, // 30 seconds

  /**
   * New user detection window - users created within this window are considered "new"
   * Used by: useAuth.tsx to determine if welcome email should be sent
   */
  NEW_USER_WINDOW: 5 * 60 * 1000, // 5 minutes

  /**
   * Session expiry warning threshold (in seconds)
   * Used by: sessionManager.ts to warn when session is about to expire
   */
  SESSION_EXPIRY_WARNING: 5 * 60, // 5 minutes (300 seconds)

  /**
   * Critical session expiry threshold (in seconds)
   * Sessions expiring within this window require immediate action
   * Used by: sessionManager.ts for critical expiry checks
   */
  SESSION_EXPIRY_CRITICAL: 1 * 60, // 1 minute (60 seconds)

  /**
   * Info-level session expiry threshold (in seconds)
   * Sessions expiring within this window show informational warnings
   * Used by: sessionManager.ts for early expiry warnings
   */
  SESSION_EXPIRY_INFO: 15 * 60, // 15 minutes (900 seconds)

  /**
   * Default buffer for session expiry checks (in minutes)
   * Used by: sessionManager.ts isSessionExpiredOrExpiring function
   */
  SESSION_EXPIRY_BUFFER_MINUTES: 5, // 5 minutes
} as const;

/**
 * Session retry configuration
 */
export const SESSION_RETRY_CONFIG = {
  /**
   * Maximum number of retry attempts for session operations
   */
  MAX_RETRIES: 3,

  /**
   * Base delay between retry attempts (in milliseconds)
   * Actual delay increases exponentially: baseDelay * attemptNumber
   */
  RETRY_DELAY: 1000, // 1 second

  /**
   * Timeout for session initialization attempts (in milliseconds)
   */
  INITIALIZATION_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Session integrity check configuration
 */
export const SESSION_INTEGRITY_CONFIG = {
  /**
   * Minimum valid access token length
   */
  MIN_TOKEN_LENGTH: 20,

  /**
   * Maximum session age (in milliseconds)
   */
  MAX_SESSION_AGE: 24 * 60 * 60 * 1000, // 24 hours

  /**
   * Patterns that indicate a corrupted session token
   */
  SUSPICIOUS_PATTERNS: ['undefined', 'null', 'NaN', '{}', '[]'],
} as const;

/**
 * Type definitions for TypeScript autocomplete
 */
export type SessionConfig = typeof SESSION_CONFIG;
export type SessionRetryConfig = typeof SESSION_RETRY_CONFIG;
export type SessionIntegrityConfig = typeof SESSION_INTEGRITY_CONFIG;
