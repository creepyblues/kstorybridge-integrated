/**
 * Test configuration for different environments
 */

export type Environment = 'staging' | 'production' | 'localhost'

export interface EnvironmentConfig {
  dashboard: string
  creator: string
  website: string
}

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  staging: {
    // Using Vercel auto-domains (*.vercel.app) to bypass custom domain SSL issues
    // Custom domains have DNS configuration issues preventing SSL provisioning
    // These Vercel domains have auto-managed SSL and work immediately
    dashboard: 'https://dashboard-staging.kstorybridge.com',
    creator: 'https://creator-staging.kstorybridge.com',
    website: 'https://kstorybridge.com', // Website has no staging environment
  },
  production: {
    dashboard: 'https://dashboard.kstorybridge.com',
    creator: 'https://creator.kstorybridge.com',
    website: 'https://kstorybridge.com',
  },
  localhost: {
    dashboard: 'http://localhost:8081',
    creator: 'http://localhost:8083',
    website: 'http://localhost:5173',
  },
}

/**
 * Get environment configuration from ENV variable
 * Defaults to staging
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = (process.env.TEST_ENV || 'staging') as Environment
  return ENVIRONMENTS[env]
}

/**
 * Timeout values for different operations
 */
export const TIMEOUTS = {
  oauth: 30000, // OAuth flows can take longer
  navigation: 10000, // Page navigation
  api: 15000, // API calls including chatbot
  default: 5000, // Default timeout
}

/**
 * Test users (DO NOT USE REAL USER CREDENTIALS)
 * These should be test accounts created specifically for testing
 */
export const TEST_USERS = {
  buyer: {
    email: process.env.TEST_BUYER_EMAIL || 'test-buyer@example.com',
    password: process.env.TEST_BUYER_PASSWORD || 'test-password-123',
  },
  creator: {
    email: process.env.TEST_CREATOR_EMAIL || 'test-creator@example.com',
    password: process.env.TEST_CREATOR_PASSWORD || 'test-password-123',
  },
}
