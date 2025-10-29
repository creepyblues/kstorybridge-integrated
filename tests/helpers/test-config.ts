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
    dashboard: 'https://dashboard-v2.kstorybridge.com',
    creator: 'https://creator-v2.kstorybridge.com',
    website: 'https://kstorybridge.com',
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
