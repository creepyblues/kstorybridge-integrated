/**
 * Test User Setup Utilities
 *
 * Create and manage test users for automated and manual testing.
 * All test users have email addresses starting with "test-" for easy identification.
 *
 * Usage:
 *   import { createTestBuyer, createTestCreator, loginAs } from '@/test-utils/setup-test-user';
 *
 *   const { user, email } = await createTestBuyer('pro');
 *   await loginAs(email);
 */

import { supabase } from '@/integrations/supabase/client';

// Standard test password for all test users
// Must contain: uppercase, lowercase, number, and special character
export const TEST_PASSWORD = 'Test-Password-123';

export interface TestUser {
  email: string;
  password: string;
  user: any; // Supabase User object
  profile?: any; // user_buyers or user_creators profile
}

/**
 * Generate unique test email to avoid conflicts
 */
function generateTestEmail(prefix: string, domain: string = 'testcompany.com'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${prefix}-${timestamp}-${random}@${domain}`;
}

/**
 * Create test buyer with specified tier
 *
 * @param tier - Buyer tier ('basic', 'pro', or 'suite')
 * @param customEmail - Optional custom email (must start with 'test-')
 * @returns TestUser object with email, password, user, and profile
 */
export async function createTestBuyer(
  tier: 'basic' | 'pro' | 'suite' = 'basic',
  customEmail?: string
): Promise<TestUser> {
  const email = customEmail || generateTestEmail(`buyer-${tier}`);

  if (!email.startsWith('test-')) {
    throw new Error('Test user emails must start with "test-"');
  }

  console.log(`[TEST] Creating test buyer: ${email} (tier: ${tier})`);

  // Step 1: Sign up via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: TEST_PASSWORD,
    options: {
      data: {
        account_type: 'buyer',
        full_name: `Test Buyer ${tier.toUpperCase()}`,
        buyer_company: 'Test Company LLC',
        buyer_role: tier === 'suite' ? 'Executive Producer' : tier === 'pro' ? 'Senior Producer' : 'Producer',
        tier,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (authError) {
    console.error('[TEST] Auth signup error:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User creation failed - no user returned');
  }

  console.log(`[TEST] ✅ Auth user created: ${authData.user.id}`);

  // Step 2: Create profile via edge function (simulating normal signup flow)
  const { data: profileData, error: profileError } = await supabase.functions.invoke('create-buyer-profile', {
    body: {
      email,
      full_name: `Test Buyer ${tier.toUpperCase()}`,
      buyer_company: 'Test Company LLC',
      buyer_role: tier === 'suite' ? 'Executive Producer' : tier === 'pro' ? 'Senior Producer' : 'Producer',
      tier,
    },
  });

  if (profileError) {
    console.error('[TEST] Profile creation error:', profileError);
    // Don't throw - profile might already exist
  }

  // Step 3: Fetch profile to verify
  const { data: profile, error: fetchError } = await supabase
    .from('user_buyers')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('[TEST] Profile fetch error:', fetchError);
  }

  console.log(`[TEST] ✅ Profile ${profile ? 'verified' : 'created'}: ${email}`);

  return {
    email,
    password: TEST_PASSWORD,
    user: authData.user,
    profile: profile || undefined,
  };
}

/**
 * Create test creator with specified role
 *
 * @param role - Creator role ('author' or 'agent')
 * @param customEmail - Optional custom email (must start with 'test-')
 * @returns TestUser object with email, password, user, and profile
 */
export async function createTestCreator(
  role: 'author' | 'agent' = 'author',
  customEmail?: string
): Promise<TestUser> {
  const email = customEmail || generateTestEmail(`creator-${role}`, 'gmail.com');

  if (!email.startsWith('test-')) {
    throw new Error('Test user emails must start with "test-"');
  }

  console.log(`[TEST] Creating test creator: ${email} (role: ${role})`);

  // Step 1: Sign up via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: TEST_PASSWORD,
    options: {
      data: {
        account_type: 'creator',
        full_name: `Test ${role === 'author' ? 'Author' : 'Agent'}`,
        pen_name: role === 'author' ? 'Test Pen Name' : 'Test Agency',
        ip_owner_role: role,
        ip_owner_company: role === 'agent' ? 'Test Literary Agency' : undefined,
        invitation_status: 'active',
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (authError) {
    console.error('[TEST] Auth signup error:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User creation failed - no user returned');
  }

  console.log(`[TEST] ✅ Auth user created: ${authData.user.id}`);

  // Step 2: Create profile via edge function
  const { data: profileData, error: profileError } = await supabase.functions.invoke('create-creator-profile', {
    body: {
      email,
      full_name: `Test ${role === 'author' ? 'Author' : 'Agent'}`,
      pen_name: role === 'author' ? 'Test Pen Name' : 'Test Agency',
      ip_owner_role: role,
      ip_owner_company: role === 'agent' ? 'Test Literary Agency' : undefined,
      invitation_status: 'active',
    },
  });

  if (profileError) {
    console.error('[TEST] Profile creation error:', profileError);
  }

  // Step 3: Fetch profile to verify
  const { data: profile, error: fetchError } = await supabase
    .from('user_creators')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[TEST] Profile fetch error:', fetchError);
  }

  console.log(`[TEST] ✅ Profile ${profile ? 'verified' : 'created'}: ${email}`);

  return {
    email,
    password: TEST_PASSWORD,
    user: authData.user,
    profile: profile || undefined,
  };
}

/**
 * Login as existing test user
 *
 * @param email - Test user email (must start with 'test-')
 * @param password - Password (defaults to TEST_PASSWORD)
 * @returns Supabase session
 */
export async function loginAs(email: string, password: string = TEST_PASSWORD) {
  if (!email.startsWith('test-')) {
    throw new Error('Can only login as test users (email must start with "test-")');
  }

  console.log(`[TEST] Logging in as: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[TEST] Login error:', error);
    throw error;
  }

  console.log(`[TEST] ✅ Logged in successfully`);
  return data.session;
}

/**
 * Logout current user
 */
export async function logout() {
  console.log('[TEST] Logging out...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[TEST] Logout error:', error);
    throw error;
  }
  console.log('[TEST] ✅ Logged out successfully');
}

/**
 * Get current test user session
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Quick test user presets for common scenarios
 */
export const TEST_USER_PRESETS = {
  BUYER_BASIC: 'test-buyer-basic@testcompany.com',
  BUYER_PRO: 'test-buyer-pro@testcompany.com',
  BUYER_SUITE: 'test-buyer-suite@testcompany.com',
  CREATOR_AUTHOR: 'test-creator-author@gmail.com',
  CREATOR_AGENT: 'test-creator-agent@agency.com',
} as const;

/**
 * Quick login to preset test users (if they exist)
 */
export async function loginAsPreset(preset: keyof typeof TEST_USER_PRESETS) {
  return loginAs(TEST_USER_PRESETS[preset]);
}
