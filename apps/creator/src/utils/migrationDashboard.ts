/**
 * Migration Dashboard - Monitor Auth Package Migration Progress
 *
 * Run this in browser console to see current migration status:
 * window.authMigrationDashboard()
 */

import { getAuthMigrationStatus } from '@/services/auth/authServiceRouter';
import { getMigrationConfig } from '@/config/authMigration';

export function createMigrationDashboard() {
  const status = getAuthMigrationStatus();
  const config = getMigrationConfig();

  console.log(`
🚀 AUTH MIGRATION DASHBOARD
═══════════════════════════

📊 CURRENT STATUS
├─ Auth Service: ${status.migrationProgress.authService.toUpperCase()}
├─ Database Client: ${status.migrationProgress.databaseClient.toUpperCase()}
├─ Auth Callback: ${status.migrationProgress.components.authCallback.toUpperCase()}
├─ Signup Form: ${status.migrationProgress.components.signupForm.toUpperCase()}
└─ Signin Form: ${status.migrationProgress.components.signinForm.toUpperCase()}

🛡️ SAFETY FEATURES
├─ Migration Logging: ${status.safetyFeatures.loggingEnabled ? '✅ ENABLED' : '❌ DISABLED'}
├─ Performance Comparison: ${status.safetyFeatures.performanceComparison ? '✅ ENABLED' : '❌ DISABLED'}
└─ Auto Rollback: ${status.safetyFeatures.rollbackOnError ? '✅ ENABLED' : '❌ DISABLED'}

📈 MIGRATION PROGRESS
${'█'.repeat(Math.round(getMigrationPercentage()))}${'░'.repeat(20 - Math.round(getMigrationPercentage()))} ${getMigrationPercentage().toFixed(1)}%

🎯 NEXT STEPS
${getNextSteps().map(step => `├─ ${step}`).join('\n')}

⚡ QUICK ACTIONS
├─ Enable Auth Service Migration: updateMigrationConfig({ useAuthServiceAdapter: true })
├─ Enable Database Client Migration: updateMigrationConfig({ useDatabaseClientAdapter: true })
├─ View Performance Logs: Look for 📊 PERF messages in console
└─ View Migration Logs: Look for 🔄 AUTH_MIGRATION messages in console
  `);

  return {
    status,
    config,
    migrationPercentage: getMigrationPercentage(),
    nextSteps: getNextSteps()
  };
}

function getMigrationPercentage(): number {
  const config = getMigrationConfig();
  const flags = [
    config.useAuthServiceAdapter,
    config.useDatabaseClientAdapter,
    config.useAuthCallbackAdapter,
    config.useSignupFormAdapter,
    config.useSigninFormAdapter
  ];

  const enabledCount = flags.filter(Boolean).length;
  return (enabledCount / flags.length) * 100;
}

function getNextSteps(): string[] {
  const config = getMigrationConfig();
  const steps = [];

  if (!config.useAuthServiceAdapter) {
    steps.push('🥇 PHASE 1: Enable Auth Service migration (safest first step)');
  } else if (!config.useDatabaseClientAdapter) {
    steps.push('🥈 PHASE 2: Enable Database Client migration');
  } else if (!config.useAuthCallbackAdapter) {
    steps.push('🥉 PHASE 3: Enable Auth Callback migration');
  } else if (!config.useSignupFormAdapter) {
    steps.push('🏁 PHASE 4: Enable Signup Form migration');
  } else if (!config.useSigninFormAdapter) {
    steps.push('🎯 FINAL: Enable Signin Form migration');
  } else {
    steps.push('✅ COMPLETE: All components migrated to sealed auth package!');
  }

  return steps;
}

// Make available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).authMigrationDashboard = createMigrationDashboard;
}