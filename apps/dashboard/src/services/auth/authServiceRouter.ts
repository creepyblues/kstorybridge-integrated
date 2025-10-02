/**
 * Auth Service Router - Safe Migration Controller
 *
 * This router allows switching between old and new auth implementations
 * based on feature flags, ensuring zero downtime migration
 */

import { getMigrationConfig, logMigration } from '@/config/authMigration';
import { authService } from './AuthService';
import { authServiceMigrated } from './AuthServiceMigrated';

/**
 * Routes auth calls to the appropriate implementation based on migration flags
 *
 * Usage:
 * - import { getAuthService } from '@/services/auth/authServiceRouter';
 * - const authSvc = getAuthService();
 * - authSvc.signUp(...) // Will use old or new implementation based on flags
 */
export function getAuthService() {
  const config = getMigrationConfig();

  if (config.useAuthServiceAdapter) {
    logMigration('AuthServiceRouter', 'Routing to migrated auth service');
    return authServiceMigrated;
  } else {
    logMigration('AuthServiceRouter', 'Routing to original auth service');
    return authService;
  }
}

/**
 * Direct access to specific implementations for testing/debugging
 */
export const authServiceRouter = {
  original: authService,
  migrated: authServiceMigrated,
  current: getAuthService
};

/**
 * Type-safe interface that works with both implementations
 */
export type AuthServiceInterface = typeof authService;

/**
 * Migration status helper
 */
export function getAuthMigrationStatus() {
  const config = getMigrationConfig();

  return {
    isUsingMigratedService: config.useAuthServiceAdapter,
    isUsingMigratedDatabaseClient: config.useDatabaseClientAdapter,
    migrationProgress: {
      authService: config.useAuthServiceAdapter ? 'migrated' : 'original',
      databaseClient: config.useDatabaseClientAdapter ? 'migrated' : 'original',
      components: {
        authCallback: config.useAuthCallbackAdapter ? 'migrated' : 'original',
        signupForm: config.useSignupFormAdapter ? 'migrated' : 'original',
        signinForm: config.useSigninFormAdapter ? 'migrated' : 'original'
      }
    },
    safetyFeatures: {
      loggingEnabled: config.enableMigrationLogging,
      performanceComparison: config.enablePerformanceComparison,
      rollbackOnError: config.rollbackOnError
    }
  };
}