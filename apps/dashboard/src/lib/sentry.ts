/**
 * Sentry Error Tracking Configuration
 *
 * Monitors production errors and performance issues.
 * Test users are automatically filtered out.
 *
 * Setup:
 * 1. Create Sentry project at https://sentry.io
 * 2. Add VITE_SENTRY_DSN to .env.local
 * 3. Import this file in src/main.tsx
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for production error tracking
 */
export function initSentry() {
  // Only run in production
  if (!import.meta.env.PROD) {
    console.log('[Sentry] Skipping initialization in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all XHR/fetch requests
        traceFetch: true,
        traceXHR: true,

        // Trace React Router navigation
        enableInp: true,
      }),

      // Session replay for debugging
      Sentry.replayIntegration({
        // Capture replays on error
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // Environment
    environment: import.meta.env.MODE,

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Filter out test users and noise
    beforeSend(event, hint) {
      // Filter out test users (email starts with "test-")
      if (event.user?.email?.includes('test-')) {
        return null;
      }

      // Filter out known non-critical errors
      const errorMessage = event.exception?.values?.[0]?.value || '';

      // Ignore favicon errors
      if (errorMessage.includes('favicon')) {
        return null;
      }

      // Ignore analytics/tracking errors
      if (errorMessage.includes('analytics') || errorMessage.includes('gtag')) {
        return null;
      }

      // Ignore browser extension errors
      if (
        errorMessage.includes('chrome-extension://') ||
        errorMessage.includes('moz-extension://')
      ) {
        return null;
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension',
      'moz-extension',

      // Random plugins/extensions
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed',

      // Network errors (user's connection issue)
      'Network request failed',
      'NetworkError',
      'Failed to fetch',

      // Browser quirks
      'Non-Error promise rejection captured',
    ],
  });

  console.log('[Sentry] Error tracking initialized');
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry] Would capture exception:', error, context);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry] Would capture ${level}:`, message);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}
