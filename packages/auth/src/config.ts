import { z } from 'zod';

/**
 * Centralized authentication configuration with hard validation
 *
 * This ensures all auth config is validated at startup and fails fast
 * if any required environment variables are missing or invalid.
 */

const AuthEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(10, 'Supabase anon key too short'),
  SITE_URL: z.string().url('Invalid site URL').optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    // In browser, use import.meta.env, in Node use process.env
    const env = typeof window !== 'undefined'
      ? import.meta.env
      : process.env;

    // Add fallback for SITE_URL if not provided
    // Use dynamic port detection in browser environment
    const dynamicSiteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:8081';

    const envWithDefaults = {
      ...env,
      SITE_URL: env.SITE_URL || env.VITE_SITE_URL || dynamicSiteUrl
    };

    return AuthEnvSchema.parse(envWithDefaults);
  } catch (error) {
    console.error('❌ Auth Configuration Error:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid auth configuration. Check environment variables.');
  }
};

const env = parseEnv();

/**
 * Frozen auth configuration object
 *
 * This is the single source of truth for all auth configuration.
 * Change values here to update configuration across the entire auth system.
 */
export const AUTH_CONFIG = Object.freeze({
  // Supabase configuration
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },

  // Site configuration
  site: {
    url: env.SITE_URL,
  },

  // Timeouts and retry configuration
  timeouts: {
    sessionCheck: 5000,
    oauthExchange: 6000,
    profileCreation: 10000,
    metadataUpdate: 3000,
  },

  retries: {
    profileCreation: 1, // Reduced from 3
    sessionRefresh: 1,  // Reduced from multiple
    metadataUpdate: 1,
  },

  // Session configuration
  session: {
    expiryMs: 3600000, // 1 hour
    refreshThresholdMs: 300000, // 5 minutes before expiry
  },

  // OAuth configuration
  oauth: {
    providers: ['google', 'github'] as const,
    redirectPath: '/auth/callback',
  },

  // Error tracking
  errorTracking: {
    enabled: true,
    maxRetries: 1,
  }
});

export type AuthConfig = typeof AUTH_CONFIG;