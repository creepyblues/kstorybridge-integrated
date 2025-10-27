/**
 * Onboarding Debug Utilities
 *
 * These functions are available in the browser console for debugging
 * and testing the onboarding system.
 *
 * Usage in browser console:
 * - window.debugOnboarding.testOnboardingCheck()
 * - window.debugOnboarding.forceShowOnboarding()
 * - window.debugOnboarding.resetOnboarding()
 * - window.debugOnboarding.checkDatabaseConnection()
 */

import { supabase } from '@/integrations/supabase/client';
import { OnboardingService, type OnboardingStatus } from '@/services/onboardingService';

interface DebugOnboardingUtils {
  testOnboardingCheck: (userId?: string) => Promise<void>;
  forceShowOnboarding: () => void;
  resetOnboarding: (userId?: string) => Promise<void>;
  checkDatabaseConnection: () => Promise<void>;
  getOnboardingStatus: (userId?: string) => Promise<OnboardingStatus | null>;
  listAllOnboardingRecords: () => Promise<void>;
  createTestOnboardingRecord: (userId?: string) => Promise<void>;
  getCurrentUser: () => any;
}

class OnboardingDebugUtils implements DebugOnboardingUtils {

  /**
   * Test the onboarding check for the current user
   */
  async testOnboardingCheck(userId?: string): Promise<void> {
    console.log('🧪 ONBOARDING DEBUG: Starting manual onboarding check test...');

    try {
      const user = this.getCurrentUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        console.error('❌ ONBOARDING DEBUG: No user ID available. Please log in first.');
        return;
      }

      console.log('🎯 ONBOARDING DEBUG: Testing for user ID:', targetUserId);

      // Test the full onboarding check flow
      const shouldShow = await OnboardingService.shouldShowOnboarding(targetUserId);

      console.log('✅ ONBOARDING DEBUG: Test completed successfully', {
        userId: targetUserId,
        shouldShow,
        recommendation: shouldShow ? 'Onboarding SHOULD be shown' : 'Onboarding should NOT be shown'
      });

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Test failed:', error);
    }
  }

  /**
   * Force show the onboarding modal (for testing UI)
   */
  forceShowOnboarding(): void {
    console.log('🧪 ONBOARDING DEBUG: Attempting to force show onboarding modal...');

    try {
      // Try to dispatch a custom event to trigger onboarding
      const event = new CustomEvent('force-show-onboarding');
      window.dispatchEvent(event);

      // Also try to directly manipulate React state if possible
      // Note: This might not work depending on React component structure
      console.log('📢 ONBOARDING DEBUG: Dispatched force-show-onboarding event');
      console.log('💡 ONBOARDING DEBUG: If modal doesn\'t appear, use resetOnboarding() first');

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Failed to force show onboarding:', error);
    }
  }

  /**
   * Reset onboarding for a user (useful for testing)
   */
  async resetOnboarding(userId?: string): Promise<void> {
    console.log('🧪 ONBOARDING DEBUG: Resetting onboarding status...');

    try {
      const user = this.getCurrentUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        console.error('❌ ONBOARDING DEBUG: No user ID available. Please log in first.');
        return;
      }

      console.log('🔄 ONBOARDING DEBUG: Resetting onboarding for user:', targetUserId);

      const success = await OnboardingService.resetOnboarding(targetUserId);

      if (success) {
        console.log('✅ ONBOARDING DEBUG: Onboarding reset successfully!');
        console.log('💡 ONBOARDING DEBUG: Refresh the page to see onboarding modal');
      } else {
        console.error('❌ ONBOARDING DEBUG: Failed to reset onboarding');
      }

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Reset failed:', error);
    }
  }

  /**
   * Test database connection to user_onboarding table
   */
  async checkDatabaseConnection(): Promise<void> {
    console.log('🧪 ONBOARDING DEBUG: Testing database connection...');

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ ONBOARDING DEBUG: Database connection failed:', {
          error: error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Check if table exists
        if (error.code === '42P01') {
          console.error('🚨 ONBOARDING DEBUG: user_onboarding table does NOT exist!');
          console.log('💡 ONBOARDING DEBUG: You need to run the database migration.');
        }
      } else {
        console.log('✅ ONBOARDING DEBUG: Database connection successful');
        console.log('✅ ONBOARDING DEBUG: user_onboarding table exists and is accessible');
      }

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Database test failed:', error);
    }
  }

  /**
   * Get onboarding status for a user
   */
  async getOnboardingStatus(userId?: string): Promise<OnboardingStatus | null> {
    console.log('🧪 ONBOARDING DEBUG: Getting onboarding status...');

    try {
      const user = this.getCurrentUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        console.error('❌ ONBOARDING DEBUG: No user ID available. Please log in first.');
        return null;
      }

      const status = await OnboardingService.checkOnboardingStatus(targetUserId);

      console.log('📊 ONBOARDING DEBUG: Current onboarding status:', status);

      return status;

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Failed to get status:', error);
      return null;
    }
  }

  /**
   * List all onboarding records (for debugging)
   */
  async listAllOnboardingRecords(): Promise<void> {
    console.log('🧪 ONBOARDING DEBUG: Listing all onboarding records...');

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ ONBOARDING DEBUG: Failed to list records:', error);
      } else {
        console.log('📊 ONBOARDING DEBUG: Recent onboarding records:', data);
        console.log(`✅ ONBOARDING DEBUG: Found ${data?.length || 0} records`);
      }

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Failed to list records:', error);
    }
  }

  /**
   * Create a test onboarding record
   */
  async createTestOnboardingRecord(userId?: string): Promise<void> {
    console.log('🧪 ONBOARDING DEBUG: Creating test onboarding record...');

    try {
      const user = this.getCurrentUser();
      const targetUserId = userId || user?.id;
      const userEmail = user?.email || 'test@example.com';

      if (!targetUserId) {
        console.error('❌ ONBOARDING DEBUG: No user ID available. Please log in first.');
        return;
      }

      const result = await OnboardingService.startOnboarding(targetUserId, userEmail);

      if (result) {
        console.log('✅ ONBOARDING DEBUG: Test record created successfully:', result);
      } else {
        console.error('❌ ONBOARDING DEBUG: Failed to create test record');
      }

    } catch (error) {
      console.error('❌ ONBOARDING DEBUG: Failed to create test record:', error);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): any {
    // Try to get user from various sources
    try {
      // Check if there's a global user object
      if ((window as any).currentUser) {
        return (window as any).currentUser;
      }

      // Check if we can get it from Supabase
      // Note: This might be async, so it's not perfect
      console.log('🔍 ONBOARDING DEBUG: Getting current user from context...');
      console.log('💡 ONBOARDING DEBUG: If user is null, please pass userId manually to functions');

      return null;
    } catch (error) {
      console.warn('⚠️ ONBOARDING DEBUG: Could not get current user:', error);
      return null;
    }
  }
}

// Create the debug utilities instance
const debugOnboarding = new OnboardingDebugUtils();

// Make it available globally for browser console usage
declare global {
  interface Window {
    debugOnboarding: DebugOnboardingUtils;
  }
}

// Only attach to window in browser environment
if (typeof window !== 'undefined') {
  window.debugOnboarding = debugOnboarding;

  console.log('🛠️ ONBOARDING DEBUG: Debug utilities loaded!');
  console.log('🔧 Available commands:');
  console.log('   - debugOnboarding.testOnboardingCheck() - Test full onboarding check');
  console.log('   - debugOnboarding.forceShowOnboarding() - Force show modal');
  console.log('   - debugOnboarding.resetOnboarding() - Reset user onboarding');
  console.log('   - debugOnboarding.checkDatabaseConnection() - Test DB connection');
  console.log('   - debugOnboarding.getOnboardingStatus() - Get current status');
  console.log('   - debugOnboarding.listAllOnboardingRecords() - List recent records');
  console.log('   - debugOnboarding.createTestOnboardingRecord() - Create test record');
}

export default debugOnboarding;