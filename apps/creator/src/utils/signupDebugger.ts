/**
 * Comprehensive Signup Flow Debugger
 *
 * This utility helps identify and troubleshoot signup flow issues by testing
 * all components of the signup process systematically.
 */

import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/auth';
import { createBuyerProfileAtomic, createCreatorProfileAtomic } from '@/utils/atomicProfileCreator';
import { isBlockedEmail } from '@/components/auth/validation';
import type { BuyerFormData, CreatorFormData } from '@/components/auth/types';

export interface SignupDebugResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
  warnings?: string[];
  timestamp: string;
}

export interface SignupTestConfig {
  accountType: 'buyer' | 'creator';
  testEmail: string;
  testPassword: string;
  profileData: BuyerFormData | CreatorFormData;
  skipEmailValidation?: boolean;
  skipDatabaseCleanup?: boolean;
}

/**
 * Comprehensive signup flow test
 */
export async function debugSignupFlow(config: SignupTestConfig): Promise<SignupDebugResult[]> {
  const results: SignupDebugResult[] = [];
  const timestamp = new Date().toISOString();

  console.log('🔍 Starting comprehensive signup debug for:', config.accountType, config.testEmail);

  // Step 1: Check email validation
  try {
    const isBlocked = isBlockedEmail(config.testEmail);
    results.push({
      step: 'Email Validation',
      success: !isBlocked,
      error: isBlocked ? 'Email is blocked' : undefined,
      data: { email: config.testEmail, blocked: isBlocked },
      timestamp
    });
  } catch (error) {
    results.push({
      step: 'Email Validation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      timestamp
    });
  }

  // Step 2: Check database connectivity
  try {
    const { data: testQuery } = await supabase.from('user_buyers').select('count').limit(1);
    results.push({
      step: 'Database Connectivity',
      success: true,
      data: { connected: true, testQuery },
      timestamp
    });
  } catch (error) {
    results.push({
      step: 'Database Connectivity',
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp
    });
  }

  // Step 3: Test user creation (auth)
  try {
    console.log('🔐 Testing user authentication creation...');

    const authResult = await authService.signUp({
      email: config.testEmail,
      password: config.testPassword,
      metadata: config.accountType === 'buyer'
        ? {
            full_name: (config.profileData as BuyerFormData).full_name,
            buyer_company: (config.profileData as BuyerFormData).buyer_company,
            buyer_role: (config.profileData as BuyerFormData).buyer_role,
            linkedin_url: (config.profileData as BuyerFormData).linkedin_url,
            account_type: 'buyer',
            tier: (config.profileData as BuyerFormData).tier || 'basic'
          }
        : {
            full_name: (config.profileData as CreatorFormData).full_name,
            pen_name: (config.profileData as CreatorFormData).pen_name,
            ip_owner_role: (config.profileData as CreatorFormData).ip_owner_role,
            ip_owner_company: (config.profileData as CreatorFormData).ip_owner_company,
            website_url: (config.profileData as CreatorFormData).website_url,
            account_type: 'creator',
            invitation_status: (config.profileData as CreatorFormData).invitation_status || 'invited'
          }
    });

    results.push({
      step: 'Auth User Creation',
      success: !authResult.error,
      error: authResult.error,
      data: {
        userId: authResult.user?.id,
        email: authResult.user?.email,
        metadata: authResult.user?.user_metadata
      },
      warnings: authResult.user ? [] : ['User object missing from auth result'],
      timestamp
    });

    // Step 4: Test profile creation
    if (authResult.user && !authResult.error) {
      try {
        console.log('👤 Testing profile creation...');

        let profileResult;
        if (config.accountType === 'buyer') {
          const buyerData = config.profileData as BuyerFormData;
          profileResult = await createBuyerProfileAtomic({
            id: authResult.user.id,
            email: config.testEmail,
            full_name: buyerData.full_name,
            buyer_company: buyerData.buyer_company,
            buyer_role: buyerData.buyer_role,
            linkedin_url: buyerData.linkedin_url || null,
            tier: buyerData.tier || 'basic'
          });
        } else {
          const creatorData = config.profileData as CreatorFormData;
          profileResult = await createCreatorProfileAtomic({
            id: authResult.user.id,
            email: config.testEmail,
            full_name: creatorData.full_name,
            pen_name: creatorData.pen_name,
            ip_owner_role: creatorData.ip_owner_role,
            ip_owner_company: creatorData.ip_owner_company,
            website_url: creatorData.website_url,
            invitation_status: creatorData.invitation_status || 'invited'
          });
        }

        results.push({
          step: 'Profile Creation',
          success: profileResult.success,
          error: profileResult.error,
          data: {
            profile: profileResult.profile,
            existed: profileResult.existed,
            created: profileResult.created,
            retryCount: profileResult.retryCount
          },
          warnings: profileResult.existed ? ['Profile already existed'] : [],
          timestamp
        });

      } catch (error) {
        results.push({
          step: 'Profile Creation',
          success: false,
          error: error instanceof Error ? error.message : 'Profile creation failed',
          timestamp
        });
      }

      // Step 5: Verify profile exists in database
      try {
        console.log('🔍 Verifying profile in database...');

        const tableName = config.accountType === 'buyer' ? 'user_buyers' : 'user_creators';
        const { data: profileData, error: selectError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', authResult.user.id)
          .single();

        results.push({
          step: 'Profile Verification',
          success: !selectError && !!profileData,
          error: selectError?.message,
          data: profileData,
          warnings: !profileData ? ['Profile not found in database'] : [],
          timestamp
        });

      } catch (error) {
        results.push({
          step: 'Profile Verification',
          success: false,
          error: error instanceof Error ? error.message : 'Profile verification failed',
          timestamp
        });
      }

      // Step 6: Test authentication state
      try {
        console.log('🔑 Testing authentication state...');

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        results.push({
          step: 'Auth State Verification',
          success: !sessionError && !userError && !!sessionData.session,
          error: sessionError?.message || userError?.message,
          data: {
            session: !!sessionData.session,
            user: !!userData.user,
            userId: userData.user?.id,
            userEmail: userData.user?.email
          },
          warnings: !sessionData.session ? ['No active session'] : [],
          timestamp
        });

      } catch (error) {
        results.push({
          step: 'Auth State Verification',
          success: false,
          error: error instanceof Error ? error.message : 'Auth state verification failed',
          timestamp
        });
      }

      // Cleanup: Delete test user and profile
      if (!config.skipDatabaseCleanup) {
        try {
          console.log('🧹 Cleaning up test data...');

          const tableName = config.accountType === 'buyer' ? 'user_buyers' : 'user_creators';
          await supabase.from(tableName).delete().eq('id', authResult.user.id);

          // Note: We can't delete auth users through the client, only through admin API
          results.push({
            step: 'Cleanup',
            success: true,
            data: { profileDeleted: true, authUserNote: 'Auth user requires admin deletion' },
            warnings: ['Auth user remains in system (requires admin deletion)'],
            timestamp
          });

        } catch (error) {
          results.push({
            step: 'Cleanup',
            success: false,
            error: error instanceof Error ? error.message : 'Cleanup failed',
            timestamp
          });
        }
      }
    }

  } catch (error) {
    results.push({
      step: 'Auth User Creation',
      success: false,
      error: error instanceof Error ? error.message : 'Auth creation failed',
      timestamp
    });
  }

  return results;
}

/**
 * Quick validation check for form data
 */
export function validateSignupData(accountType: 'buyer' | 'creator', formData: BuyerFormData | CreatorFormData): SignupDebugResult {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validation
  if (!formData.email) errors.push('Email is required');
  if (!formData.password) errors.push('Password is required');
  if (!formData.full_name) errors.push('Full name is required');

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Invalid email format');
  }

  // Password strength
  if (formData.password && formData.password.length < 6) {
    warnings.push('Password is shorter than 6 characters');
  }

  // Account type specific validation
  if (accountType === 'buyer') {
    const buyerData = formData as BuyerFormData;
    if (!buyerData.buyer_company) errors.push('Company is required for buyers');
    if (!buyerData.buyer_role) errors.push('Role is required for buyers');
  } else {
    const creatorData = formData as CreatorFormData;
    if (!creatorData.pen_name) errors.push('Pen name is required for creators');
  }

  return {
    step: 'Form Validation',
    success: errors.length === 0,
    error: errors.length > 0 ? errors.join(', ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    data: { accountType, validFields: Object.keys(formData).length },
    timestamp
  };
}

/**
 * Print debug results in a formatted way
 */
export function printDebugResults(results: SignupDebugResult[]): void {
  console.log('\n🔍 Signup Debug Results');
  console.log('='.repeat(50));

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.step}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join(', ')}`);
    }

    if (result.data) {
      console.log(`   Data:`, result.data);
    }
  });

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  console.log('\n📊 Summary');
  console.log(`   Successful steps: ${successCount}/${results.length}`);
  console.log(`   Failed steps: ${failureCount}/${results.length}`);

  if (failureCount > 0) {
    console.log('\n⚠️ Failed Steps:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   - ${result.step}: ${result.error}`);
    });
  }
}

/**
 * Test configuration presets for common scenarios
 */
export const TEST_CONFIGS = {
  buyerBasic: {
    accountType: 'buyer' as const,
    testEmail: 'test-buyer@example.com',
    testPassword: 'testpass123',
    profileData: {
      email: 'test-buyer@example.com',
      password: 'testpass123',
      full_name: 'Test Buyer',
      buyer_company: 'Test Company',
      buyer_role: 'Other',
      linkedin_url: '',
      tier: 'basic' as const
    }
  },
  creatorBasic: {
    accountType: 'creator' as const,
    testEmail: 'test-creator@example.com',
    testPassword: 'testpass123',
    profileData: {
      email: 'test-creator@example.com',
      password: 'testpass123',
      full_name: 'Test Creator',
      pen_name: 'Test Pen Name',
      ip_owner_role: '',
      ip_owner_company: '',
      website_url: '',
      invitation_status: 'invited' as const
    }
  }
};