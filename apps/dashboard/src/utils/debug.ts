/**
 * Debug Logging Utility
 *
 * Conditionally logs messages based on environment
 * - DEV mode: All debug logs shown
 * - PRODUCTION: Only errors shown
 *
 * Usage:
 * import { debug } from '@/utils/debug';
 * debug.log('User logged in:', user);
 * debug.error('Failed to fetch:', error);
 */

const IS_DEV = import.meta.env.DEV;

export const debug = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args: unknown[]): void => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: unknown[]): void => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always shown, even in production)
   * Use this for actual errors that should be monitored
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log with table format (only in development)
   */
  table: (data: unknown): void => {
    if (IS_DEV) {
      console.table(data);
    }
  },

  /**
   * Group related logs (only in development)
   */
  group: (label: string): void => {
    if (IS_DEV) {
      console.group(label);
    }
  },

  /**
   * End a log group (only in development)
   */
  groupEnd: (): void => {
    if (IS_DEV) {
      console.groupEnd();
    }
  },

  /**
   * Time an operation (only in development)
   */
  time: (label: string): void => {
    if (IS_DEV) {
      console.time(label);
    }
  },

  /**
   * End timing an operation (only in development)
   */
  timeEnd: (label: string): void => {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  },
};

// Export individual functions for convenience
export const { log, warn, error, table, group, groupEnd, time, timeEnd } = debug;
