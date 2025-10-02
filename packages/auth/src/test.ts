/**
 * Simple test to verify the auth package exports work correctly
 */

import { auth, AuthUser, AuthSession, AUTH_CONFIG } from './index.js';

console.log('🧪 Testing auth package exports...');

// Test 1: Check that auth instance exists and has required methods
console.log('1. Auth instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(auth)));

// Test 2: Check that types are exported (this will fail at compile time if types are missing)
const testUser: AuthUser = {
  id: 'test',
  email: 'test@example.com',
  accountType: 'buyer'
};

const testSession: AuthSession = {
  user: testUser,
  accessToken: 'test-token',
  expiresAt: Date.now() + 3600000
};

console.log('2. Types work correctly ✅');

// Test 3: Check configuration is loaded
console.log('3. Config loaded:', {
  hasSupabaseUrl: !!AUTH_CONFIG.supabase.url,
  hasSupabaseKey: !!AUTH_CONFIG.supabase.anonKey,
  siteUrl: AUTH_CONFIG.site.url
});

// Test 4: Check auth methods exist
const methods = ['signUp', 'signIn', 'signOut', 'getSession', 'requireUser', 'exchangeCodeForSession', 'updateUser'];
const missingMethods = methods.filter(method => typeof (auth as any)[method] !== 'function');

if (missingMethods.length === 0) {
  console.log('4. All required auth methods exist ✅');
} else {
  console.error('4. Missing auth methods:', missingMethods);
}

console.log('🎉 Auth package test complete!');

export { testUser, testSession };