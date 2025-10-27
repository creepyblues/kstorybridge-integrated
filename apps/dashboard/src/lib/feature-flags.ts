/**
 * Feature Flags System
 *
 * Centralized feature flags for development and testing modes.
 * Allows bypassing external services, auto-login, and other dev conveniences.
 *
 * Usage:
 *   import { DEV_FLAGS, isTestMode, shouldSkipEmail } from '@/lib/feature-flags';
 *
 *   if (shouldSkipEmail()) {
 *     console.log('Skipping email send in test mode');
 *     return;
 *   }
 */

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
  return import.meta.env.VITE_TEST_MODE === 'true';
}

/**
 * Check if we're in local development
 */
export function isLocalDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Development Feature Flags
 */
export const DEV_FLAGS = {
  /**
   * Skip sending actual emails (use console.log instead)
   * Active when: TEST_MODE or LOCAL_TESTING
   */
  SKIP_EMAIL_SEND: isTestMode() || import.meta.env.VITE_LOCAL_TESTING === 'true',

  /**
   * Use Stripe test mode (test API keys, no real charges)
   * Active when: TEST_MODE or USE_TEST_STRIPE explicitly set
   */
  USE_TEST_STRIPE: isTestMode() || import.meta.env.VITE_USE_TEST_STRIPE === 'true',

  /**
   * Mock OpenAI responses (don't call real API)
   * Active when: MOCK_OPENAI explicitly set
   * Note: Keep false by default even in test mode to test real AI responses
   */
  MOCK_OPENAI: import.meta.env.VITE_MOCK_OPENAI === 'true',

  /**
   * Auto-login email (skip login form, auto-login as this user)
   * Useful for rapid testing of logged-in features
   */
  AUTO_LOGIN_EMAIL: isTestMode() ? import.meta.env.VITE_AUTO_LOGIN_EMAIL || null : null,

  /**
   * Use local Supabase instance instead of production
   * Active when: USE_LOCAL_SUPABASE explicitly set
   */
  USE_LOCAL_SUPABASE: import.meta.env.VITE_USE_LOCAL_SUPABASE === 'true',

  /**
   * Verbose logging (show all debug logs)
   * Active when: DEBUG_MODE or VERBOSE_LOGS set
   */
  VERBOSE_LOGS: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.VITE_VERBOSE_LOGS === 'true',

  /**
   * Auth debug mode (show detailed auth flow logs)
   * Active when: AUTH_DEBUG set
   */
  AUTH_DEBUG: import.meta.env.VITE_AUTH_DEBUG === 'true',

  /**
   * OAuth testing mode (allows localhost redirects, shows debug info)
   * Active when: OAUTH_TESTING set
   */
  OAUTH_TESTING: import.meta.env.VITE_OAUTH_TESTING === 'true',

  /**
   * Use mock data instead of real API calls
   * Active when: USE_MOCK_DATA set
   */
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',

  /**
   * Reset database on app start (DANGEROUS - CI/CD only!)
   * Active when: RESET_DB_ON_START explicitly set
   * This should NEVER be true in production or regular development
   */
  RESET_DB_ON_START: import.meta.env.VITE_RESET_DB_ON_START === 'true',
} as const;

/**
 * Helper: Should skip email sending?
 */
export function shouldSkipEmail(): boolean {
  return DEV_FLAGS.SKIP_EMAIL_SEND;
}

/**
 * Helper: Should use test Stripe?
 */
export function shouldUseTestStripe(): boolean {
  return DEV_FLAGS.USE_TEST_STRIPE;
}

/**
 * Helper: Should mock OpenAI?
 */
export function shouldMockOpenAI(): boolean {
  return DEV_FLAGS.MOCK_OPENAI;
}

/**
 * Helper: Get auto-login email (if configured)
 */
export function getAutoLoginEmail(): string | null {
  return DEV_FLAGS.AUTO_LOGIN_EMAIL;
}

/**
 * Helper: Should show verbose logs?
 */
export function shouldShowVerboseLogs(): boolean {
  return DEV_FLAGS.VERBOSE_LOGS;
}

/**
 * Helper: Is auth debug enabled?
 */
export function isAuthDebugEnabled(): boolean {
  return DEV_FLAGS.AUTH_DEBUG;
}

/**
 * Helper: Is OAuth testing enabled?
 */
export function isOAuthTestingEnabled(): boolean {
  return DEV_FLAGS.OAUTH_TESTING;
}

/**
 * Conditional logging based on verbose flag
 */
export function devLog(message: string, ...args: any[]): void {
  if (shouldShowVerboseLogs()) {
    console.log(`[DEV] ${message}`, ...args);
  }
}

/**
 * Auth-specific logging
 */
export function authLog(message: string, ...args: any[]): void {
  if (isAuthDebugEnabled()) {
    console.log(`[AUTH] ${message}`, ...args);
  }
}

/**
 * Test-specific logging
 */
export function testLog(message: string, ...args: any[]): void {
  if (isTestMode()) {
    console.log(`[TEST] ${message}`, ...args);
  }
}

/**
 * Print current feature flag status (useful for debugging)
 */
export function printFeatureFlags(): void {
  console.log('🚩 Feature Flags Status:');
  console.log('  Environment:');
  console.log(`    - Test Mode: ${isTestMode()}`);
  console.log(`    - Local Development: ${isLocalDevelopment()}`);
  console.log(`    - Production: ${isProduction()}`);
  console.log('  Flags:');
  Object.entries(DEV_FLAGS).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`    ${icon} ${key}: ${value}`);
  });
}

/**
 * Validate feature flag configuration (prevent dangerous combinations)
 */
export function validateFeatureFlags(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // DANGER: Reset DB on start should NEVER be true in non-test environments
  if (DEV_FLAGS.RESET_DB_ON_START && !isTestMode()) {
    errors.push('RESET_DB_ON_START is enabled outside test mode - THIS IS DANGEROUS!');
  }

  // Warning: Test mode in production
  if (isTestMode() && isProduction()) {
    warnings.push('Test mode is enabled in production build');
  }

  // Warning: Mock OpenAI without test mode
  if (DEV_FLAGS.MOCK_OPENAI && !isTestMode()) {
    warnings.push('OpenAI mocking is enabled outside test mode');
  }

  // Warning: Auto-login in production
  if (DEV_FLAGS.AUTO_LOGIN_EMAIL && isProduction()) {
    errors.push('Auto-login is configured in production - THIS IS A SECURITY RISK!');
  }

  const valid = errors.length === 0;

  return {
    valid,
    warnings,
    errors,
  };
}

/**
 * Assert valid feature flag configuration (throw if invalid)
 */
export function assertValidFeatureFlags(): void {
  const validation = validateFeatureFlags();

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Feature Flag Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (!validation.valid) {
    console.error('❌ Feature Flag Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid feature flag configuration');
  }
}

// Validate on module load
if (isLocalDevelopment()) {
  const validation = validateFeatureFlags();
  if (validation.warnings.length > 0 || !validation.valid) {
    console.log('\n');
    printFeatureFlags();
    console.log('\n');
    if (!validation.valid) {
      assertValidFeatureFlags();
    }
  }
}

// Export flag summary for external use
export const FEATURE_FLAG_SUMMARY = {
  testMode: isTestMode(),
  localDev: isLocalDevelopment(),
  production: isProduction(),
  flags: DEV_FLAGS,
  validation: validateFeatureFlags(),
} as const;
