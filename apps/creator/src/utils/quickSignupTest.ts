/**
 * Quick Signup Test - Run in browser console
 *
 * This is a lightweight test that can be pasted into browser console
 * to quickly identify signup issues without needing full UI.
 */

import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/auth/authService';
import { createBuyerProfileAtomic } from '@/utils/atomicProfileCreator';

// Make functions available globally for console testing
declare global {
  interface Window {
    quickTestSignup: typeof quickTestSignup;
    testDatabaseConnection: typeof testDatabaseConnection;
    testAuthCreation: typeof testAuthCreation;
    testProfileCreation: typeof testProfileCreation;
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<void> {
  console.log('🔍 Testing database connection...');

  try {
    const { data, error } = await supabase.from('user_buyers').select('count').limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }

    console.log('✅ Database connection successful:', data);

    // Test both tables
    const { data: creatorsData, error: creatorsError } = await supabase.from('user_creators').select('count').limit(1);

    if (creatorsError) {
      console.error('❌ Creators table access failed:', creatorsError);
      return;
    }

    console.log('✅ Creators table access successful:', creatorsData);

  } catch (error) {
    console.error('❌ Database test threw exception:', error);
  }
}

/**
 * Test auth user creation only
 */
export async function testAuthCreation(email?: string): Promise<void> {
  const testEmail = email || `test-${Date.now()}@example.com`;
  const testPassword = 'testpass123';

  console.log('🔍 Testing auth user creation for:', testEmail);

  try {
    const result = await authService.signUp({
      email: testEmail,
      password: testPassword,
      metadata: {
        full_name: 'Test User',
        account_type: 'buyer',
        buyer_company: 'Test Company',
        buyer_role: 'Other',
        tier: 'basic'
      }
    });

    if (result.error) {
      console.error('❌ Auth creation failed:', result.error);
      return;
    }

    console.log('✅ Auth user created successfully:', {
      userId: result.user?.id,
      email: result.user?.email,
      metadata: result.user?.user_metadata
    });

    // Test getting the user back
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Failed to retrieve created user:', userError);
    } else {
      console.log('✅ User retrieval successful:', userData.user?.email);
    }

  } catch (error) {
    console.error('❌ Auth creation test threw exception:', error);
  }
}

/**
 * Test profile creation with existing user
 */
export async function testProfileCreation(): Promise<void> {
  console.log('🔍 Testing profile creation...');

  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('❌ No authenticated user found. Run testAuthCreation() first.');
      return;
    }

    const user = userData.user;
    console.log('📋 Using existing user:', user.email);

    // Test profile creation
    const profileResult = await createBuyerProfileAtomic({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || 'Test User',
      buyer_company: user.user_metadata?.buyer_company || 'Test Company',
      buyer_role: user.user_metadata?.buyer_role || 'Other',
      linkedin_url: user.user_metadata?.linkedin_url || null,
      tier: user.user_metadata?.tier || 'basic'
    });

    if (!profileResult.success) {
      console.error('❌ Profile creation failed:', profileResult.error);
      return;
    }

    console.log('✅ Profile created successfully:', {
      profile: profileResult.profile,
      existed: profileResult.existed,
      created: profileResult.created
    });

    // Verify profile in database
    const { data: dbProfile, error: dbError } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('❌ Failed to verify profile in database:', dbError);
    } else {
      console.log('✅ Profile verified in database:', dbProfile);
    }

  } catch (error) {
    console.error('❌ Profile creation test threw exception:', error);
  }
}

/**
 * Complete signup test
 */
export async function quickTestSignup(email?: string): Promise<void> {
  const testEmail = email || `test-${Date.now()}@example.com`;

  console.log('🚀 Starting complete signup test for:', testEmail);
  console.log('='.repeat(50));

  // Step 1: Test database connection
  await testDatabaseConnection();

  // Step 2: Test auth creation
  await testAuthCreation(testEmail);

  // Step 3: Test profile creation
  await testProfileCreation();

  console.log('='.repeat(50));
  console.log('🏁 Signup test completed. Check logs above for issues.');
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  window.quickTestSignup = quickTestSignup;
  window.testDatabaseConnection = testDatabaseConnection;
  window.testAuthCreation = testAuthCreation;
  window.testProfileCreation = testProfileCreation;

  console.log('🔧 Quick signup test functions available:');
  console.log('- quickTestSignup() - Complete test');
  console.log('- testDatabaseConnection() - Test DB only');
  console.log('- testAuthCreation(email?) - Test auth only');
  console.log('- testProfileCreation() - Test profile only');
}