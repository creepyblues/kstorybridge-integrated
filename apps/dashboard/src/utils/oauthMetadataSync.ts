import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'buyer' | 'creator';

/**
 * OAuth Metadata Sync Utility
 *
 * Fixes metadata inconsistencies for OAuth signups by ensuring auth.users metadata
 * matches the actual profile table where user data is stored.
 *
 * Only affects OAuth users - email signups are left untouched as they work correctly.
 */

/**
 * Detect if user signed up via OAuth (not email)
 */
export function isOAuthUser(user: User): boolean {
  const provider = user.app_metadata?.provider;
  return provider !== 'email' && provider !== undefined;
}

/**
 * Detect account type by checking which profile table contains user data
 */
export async function detectAccountTypeFromDatabase(userEmail: string): Promise<AccountType | null> {
  try {
    console.log(`🔍 OAuth Sync: Detecting account type for ${userEmail}`);

    // Check user_buyers table first (priority given to buyers if both exist)
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('user_buyers')
      .select('email')
      .eq('email', userEmail.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (buyerError && buyerError.code !== 'PGRST116') {
      console.warn('⚠️ OAuth Sync: Error checking buyer profile:', buyerError);
    }

    if (buyerProfile) {
      console.log('✅ OAuth Sync: Found buyer profile');
      return 'buyer';
    }

    // Check user_creators table
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('user_creators')
      .select('email')
      .eq('email', userEmail.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (creatorError && creatorError.code !== 'PGRST116') {
      console.warn('⚠️ OAuth Sync: Error checking creator profile:', creatorError);
    }

    if (creatorProfile) {
      console.log('✅ OAuth Sync: Found creator profile');
      return 'creator';
    }

    console.log('❌ OAuth Sync: No profile found in either table');
    return null;

  } catch (error) {
    console.error('❌ OAuth Sync: Database detection failed:', error);
    return null;
  }
}

/**
 * Update user metadata with correct account type
 */
export async function updateUserMetadata(userId: string, accountType: AccountType): Promise<boolean> {
  try {
    console.log(`🔄 OAuth Sync: Updating metadata for user ${userId} to ${accountType}`);

    const { error } = await supabase.auth.updateUser({
      data: { account_type: accountType }
    });

    if (error) {
      console.error('❌ OAuth Sync: Metadata update failed:', error);
      return false;
    }

    console.log('✅ OAuth Sync: Metadata updated successfully');
    return true;

  } catch (error) {
    console.error('❌ OAuth Sync: Metadata update exception:', error);
    return false;
  }
}

/**
 * Complete OAuth metadata sync process
 *
 * @param userEmail - User's email address
 * @param currentAccountType - Account type from metadata or parameter
 * @returns Corrected account type or original if no change needed
 */
export async function syncOAuthUserMetadata(
  userEmail: string,
  currentAccountType: AccountType,
  user?: User
): Promise<AccountType> {
  try {
    // Skip if user is not OAuth (email signups work correctly)
    if (user && !isOAuthUser(user)) {
      console.log('📧 OAuth Sync: Email user detected, skipping sync');
      return currentAccountType;
    }

    // Detect actual account type from database
    const actualAccountType = await detectAccountTypeFromDatabase(userEmail);

    if (!actualAccountType) {
      console.warn('⚠️ OAuth Sync: Could not determine account type from database, using original');
      return currentAccountType;
    }

    // Check if correction is needed
    if (actualAccountType === currentAccountType) {
      console.log('✅ OAuth Sync: Metadata already correct, no sync needed');
      return currentAccountType;
    }

    console.log(`🔧 OAuth Sync: Metadata mismatch detected - ${currentAccountType} → ${actualAccountType}`);

    // Update metadata if user is available
    if (user) {
      const updateSuccess = await updateUserMetadata(user.id, actualAccountType);
      if (!updateSuccess) {
        console.warn('⚠️ OAuth Sync: Metadata update failed, using original account type');
        return currentAccountType;
      }
    }

    return actualAccountType;

  } catch (error) {
    console.error('❌ OAuth Sync: Sync process failed:', error);
    return currentAccountType;
  }
}

/**
 * Get user from current session for metadata sync
 */
export async function getCurrentUserForSync(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('⚠️ OAuth Sync: Could not get current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ OAuth Sync: Exception getting current user:', error);
    return null;
  }
}

/**
 * Health check for OAuth metadata sync system
 */
export async function performOAuthSyncHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  oauthUsersCount?: number;
}> {
  const issues: string[] = [];

  try {
    // Test database connectivity
    await supabase.from('user_buyers').select('count').limit(1);
    await supabase.from('user_creators').select('count').limit(1);

    // Test auth connectivity
    await supabase.auth.getUser();

    console.log('🏥 OAuth Sync Health Check: All systems operational');

    return {
      healthy: true,
      issues: []
    };

  } catch (error) {
    issues.push('Database or auth connectivity issues detected');
    console.error('🏥 OAuth Sync Health Check: Issues detected:', error);

    return {
      healthy: false,
      issues
    };
  }
}