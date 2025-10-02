/**
 * Simple test runner for auth package without complex mocking
 */

import { AUTH_CONFIG } from './config.js';

console.log('🧪 Running simple auth package tests...');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, testFn: () => void | Promise<void>) {
  try {
    const result = testFn();
    if (result instanceof Promise) {
      result.then(() => {
        testsPassed++;
        console.log(`✅ ${name}`);
      }).catch((error) => {
        testsFailed++;
        console.error(`❌ ${name}: ${error.message}`);
      });
    } else {
      testsPassed++;
      console.log(`✅ ${name}`);
    }
  } catch (error) {
    testsFailed++;
    console.error(`❌ ${name}: ${error.message}`);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

// Configuration tests
test('AUTH_CONFIG should be defined', () => {
  assertTrue(AUTH_CONFIG !== undefined, 'AUTH_CONFIG is undefined');
});

test('AUTH_CONFIG should have Supabase configuration', () => {
  assertTrue(!!AUTH_CONFIG.supabase.url, 'Missing Supabase URL');
  assertTrue(!!AUTH_CONFIG.supabase.anonKey, 'Missing Supabase anon key');
});

test('AUTH_CONFIG should have reasonable timeout values', () => {
  assertTrue(AUTH_CONFIG.timeouts.sessionCheck > 1000, 'Session check timeout too short');
  assertTrue(AUTH_CONFIG.timeouts.sessionCheck < 30000, 'Session check timeout too long');
  assertTrue(AUTH_CONFIG.timeouts.oauthExchange > 1000, 'OAuth exchange timeout too short');
  assertTrue(AUTH_CONFIG.timeouts.oauthExchange < 30000, 'OAuth exchange timeout too long');
});

test('AUTH_CONFIG should have conservative retry values', () => {
  assertTrue(AUTH_CONFIG.retries.profileCreation <= 3, 'Profile creation retries too high');
  assertTrue(AUTH_CONFIG.retries.sessionRefresh <= 3, 'Session refresh retries too high');
  assertTrue(AUTH_CONFIG.retries.metadataUpdate <= 3, 'Metadata update retries too high');
});

test('AUTH_CONFIG should be frozen', () => {
  assertTrue(Object.isFrozen(AUTH_CONFIG), 'AUTH_CONFIG is not frozen');
});

test('OAuth providers should be correctly configured', () => {
  assertTrue(Array.isArray(AUTH_CONFIG.oauth.providers), 'OAuth providers is not an array');
  assertTrue(AUTH_CONFIG.oauth.providers.includes('google'), 'Missing Google provider');
  assertTrue(AUTH_CONFIG.oauth.providers.includes('github'), 'Missing GitHub provider');
  assertEquals(AUTH_CONFIG.oauth.redirectPath, '/auth/callback', 'Incorrect redirect path');
});

test('Session configuration should be reasonable', () => {
  assertEquals(AUTH_CONFIG.session.expiryMs, 3600000, 'Incorrect session expiry'); // 1 hour
  assertTrue(AUTH_CONFIG.session.refreshThresholdMs < AUTH_CONFIG.session.expiryMs, 'Refresh threshold too high');
  assertTrue(AUTH_CONFIG.session.refreshThresholdMs >= 60000, 'Refresh threshold too low'); // At least 1 minute
});

test('Error tracking should be enabled', () => {
  assertEquals(AUTH_CONFIG.errorTracking.enabled, true, 'Error tracking should be enabled');
  assertEquals(AUTH_CONFIG.errorTracking.maxRetries, 1, 'Incorrect max retries');
});

// Wait for async tests to complete
setTimeout(() => {
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}, 100);