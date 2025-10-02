/**
 * Auth Migration Configuration
 *
 * Controls gradual migration from direct Supabase calls to sealed auth package
 * SAFE ROLLOUT: Can enable/disable individual components without affecting others
 */

export interface AuthMigrationConfig {
  // Core services migration flags
  useAuthServiceAdapter: boolean;
  useDatabaseClientAdapter: boolean;

  // Business services migration flags
  useChatOrchestratorAdapter: boolean;
  useEmbeddingServiceAdapter: boolean;
  useOAuthProfileAdapter: boolean;

  // Component-level migration flags
  useAuthCallbackAdapter: boolean;
  useSignupFormAdapter: boolean;
  useSigninFormAdapter: boolean;

  // Development and testing flags
  enableMigrationLogging: boolean;
  enablePerformanceComparison: boolean;
  rollbackOnError: boolean;
}

/**
 * Migration configuration
 * Start with everything disabled for safety
 */
export const authMigrationConfig: AuthMigrationConfig = {
  // Phase 1: Core Services (Start here)
  useAuthServiceAdapter: false,  // AuthService.ts migration
  useDatabaseClientAdapter: false,  // DatabaseClient.ts migration

  // Phase 2: Business Services
  useChatOrchestratorAdapter: false,  // Chat service migration
  useEmbeddingServiceAdapter: false,  // AI embedding service migration
  useOAuthProfileAdapter: false,  // OAuth profile service migration

  // Phase 3: User-Facing Components
  useAuthCallbackAdapter: false,  // OAuth callback migration
  useSignupFormAdapter: false,  // Signup form migration
  useSigninFormAdapter: false,  // Signin form migration

  // Development flags
  enableMigrationLogging: true,  // Always log during migration
  enablePerformanceComparison: true,  // Compare old vs new performance
  rollbackOnError: true,  // Auto-rollback on errors
};

/**
 * Get migration config for specific component
 */
export function getMigrationConfig(): AuthMigrationConfig {
  return authMigrationConfig;
}

/**
 * Update migration config (for testing/development)
 */
export function updateMigrationConfig(updates: Partial<AuthMigrationConfig>) {
  Object.assign(authMigrationConfig, updates);
}

/**
 * Migration logging helper
 */
export function logMigration(component: string, action: string, data?: any) {
  if (authMigrationConfig.enableMigrationLogging) {
    console.log(`🔄 AUTH_MIGRATION [${component}]: ${action}`, data);
  }
}

/**
 * Performance comparison helper
 */
export function comparePerformance(
  component: string,
  oldTime: number,
  newTime: number,
  operation: string
) {
  if (authMigrationConfig.enablePerformanceComparison) {
    const diff = newTime - oldTime;
    const improvement = diff < 0 ? `${Math.abs(diff)}ms faster` : `${diff}ms slower`;
    console.log(`📊 PERF [${component}] ${operation}: ${improvement}`);
  }
}