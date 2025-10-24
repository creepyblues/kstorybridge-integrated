/**
 * Authentication Cleanup Utilities
 *
 * Provides cleanup functions for failed OAuth signups to prevent orphaned profiles.
 *
 * WHEN TO USE:
 * - OAuth signup metadata update fails
 * - OAuth signup times out
 * - Any step after profile creation fails
 *
 * WHAT IT DOES:
 * - Deletes profile from user_buyers or user_creators table
 * - Logs cleanup actions for debugging
 * - Returns success/failure status
 */

import { supabase } from '@/integrations/supabase/client';

export interface CleanupResult {
  success: boolean;
  error?: string;
  profileDeleted?: boolean;
}

/**
 * Clean up failed OAuth signup by deleting the created profile
 *
 * @param userId - The auth user ID
 * @param email - User's email for logging
 * @param accountType - 'buyer' or 'creator'
 * @returns Cleanup result
 */
export async function cleanupFailedOAuthSignup(
  userId: string,
  email: string,
  accountType: 'buyer' | 'creator'
): Promise<CleanupResult> {
  try {
    console.log(`🧹 CLEANUP: Starting cleanup for failed ${accountType} OAuth signup`, {
      userId: userId.substring(0, 8),
      email
    });

    const tableName = accountType === 'buyer' ? 'user_buyers' : 'user_creators';

    // Delete profile from appropriate table
    const deleteResult = await supabase
      .from(tableName)
      .delete()
      .eq('email', email.toLowerCase());

    if (deleteResult && deleteResult.error) {
      console.error(`❌ CLEANUP: Failed to delete ${accountType} profile:`, deleteResult.error);
      return {
        success: false,
        error: `Failed to delete profile: ${deleteResult.error.message}`,
        profileDeleted: false
      };
    }

    console.log(`✅ CLEANUP: Successfully deleted ${accountType} profile for ${email}`);

    return {
      success: true,
      profileDeleted: true
    };

  } catch (error) {
    console.error('❌ CLEANUP: Unexpected error during cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cleanup error',
      profileDeleted: false
    };
  }
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 *
 * @param ms - Timeout in milliseconds
 * @param operation - Description of the operation for error message
 * @returns Promise that rejects after timeout
 */
export function createTimeout(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms}ms`));
    }, ms);
  });
}
