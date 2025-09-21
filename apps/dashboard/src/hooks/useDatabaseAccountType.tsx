/**
 * Database-First Account Type Detection Hook
 *
 * This hook eliminates dependency on user.user_metadata.account_type by
 * querying the profile tables directly. It serves as the replacement for
 * metadata-based account type detection to fix OAuth hanging issues.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AccountType = 'buyer' | 'creator';

export interface DatabaseAccountTypeResult {
  accountType: AccountType | null;
  loading: boolean;
  error: string | null;
  source: 'database_buyer' | 'database_creator' | 'metadata_fallback' | 'not_found';
  profileExists: boolean;
  profileData?: any;
}

export interface UseDatabaseAccountTypeOptions {
  user?: User | null;
  enableMetadataFallback?: boolean;
  debug?: boolean;
}

/**
 * Hook for database-first account type detection
 *
 * This approach:
 * 1. Queries user_buyers table by user.id
 * 2. If not found, queries user_creators table by user.id
 * 3. Returns account type based on which table contains the user
 * 4. Optionally falls back to metadata if database lookup fails
 */
export function useDatabaseAccountType(options: UseDatabaseAccountTypeOptions = {}): DatabaseAccountTypeResult {
  const { user, enableMetadataFallback = true, debug = false } = options;

  const [result, setResult] = useState<DatabaseAccountTypeResult>({
    accountType: null,
    loading: true,
    error: null,
    source: 'not_found',
    profileExists: false
  });

  useEffect(() => {
    const detectAccountType = async () => {
      if (debug) {
        console.log('[DatabaseAccountType] Starting detection for user:', user?.email);
      }

      setResult(prev => ({ ...prev, loading: true, error: null }));

      // No user = no account type
      if (!user?.id) {
        if (debug) {
          console.log('[DatabaseAccountType] No user provided');
        }
        setResult({
          accountType: null,
          loading: false,
          error: null,
          source: 'not_found',
          profileExists: false
        });
        return;
      }

      try {
        // Step 1: Check user_buyers table
        if (debug) {
          console.log('[DatabaseAccountType] Checking user_buyers table for:', user.id);
        }

        const { data: buyerProfile, error: buyerError } = await supabase
          .from('user_buyers')
          .select('id, email, full_name, account_type, tier')
          .eq('id', user.id)
          .maybeSingle();

        if (debug) {
          console.log('[DatabaseAccountType] Buyer lookup result:', {
            found: !!buyerProfile,
            error: buyerError?.message
          });
        }

        if (buyerProfile) {
          setResult({
            accountType: 'buyer',
            loading: false,
            error: null,
            source: 'database_buyer',
            profileExists: true,
            profileData: buyerProfile
          });
          return;
        }

        // Step 2: Check user_creators table
        if (debug) {
          console.log('[DatabaseAccountType] Checking user_creators table for:', user.id);
        }

        const { data: creatorProfile, error: creatorError } = await supabase
          .from('user_creators')
          .select('id, email, full_name, account_type, pen_name, invitation_status')
          .eq('id', user.id)
          .maybeSingle();

        if (debug) {
          console.log('[DatabaseAccountType] Creator lookup result:', {
            found: !!creatorProfile,
            error: creatorError?.message
          });
        }

        if (creatorProfile) {
          setResult({
            accountType: 'creator',
            loading: false,
            error: null,
            source: 'database_creator',
            profileExists: true,
            profileData: creatorProfile
          });
          return;
        }

        // Step 3: Metadata fallback (if enabled)
        if (enableMetadataFallback && user.user_metadata?.account_type) {
          const metadataType = user.user_metadata.account_type;

          if (debug) {
            console.log('[DatabaseAccountType] Using metadata fallback:', metadataType);
          }

          if (metadataType === 'buyer' || metadataType === 'creator') {
            setResult({
              accountType: metadataType,
              loading: false,
              error: null,
              source: 'metadata_fallback',
              profileExists: false // No profile in database
            });
            return;
          }
        }

        // Step 4: No account type found
        if (debug) {
          console.log('[DatabaseAccountType] No account type found in database or metadata');
        }

        setResult({
          accountType: null,
          loading: false,
          error: null,
          source: 'not_found',
          profileExists: false
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Database query failed';

        if (debug) {
          console.error('[DatabaseAccountType] Detection error:', error);
        }

        // In case of error, try metadata fallback if enabled
        if (enableMetadataFallback && user.user_metadata?.account_type) {
          const metadataType = user.user_metadata.account_type;

          if (metadataType === 'buyer' || metadataType === 'creator') {
            setResult({
              accountType: metadataType,
              loading: false,
              error: `Database error, using metadata fallback: ${errorMessage}`,
              source: 'metadata_fallback',
              profileExists: false
            });
            return;
          }
        }

        setResult({
          accountType: null,
          loading: false,
          error: errorMessage,
          source: 'not_found',
          profileExists: false
        });
      }
    };

    detectAccountType();
  }, [user?.id, enableMetadataFallback, debug]);

  return result;
}

/**
 * Simple utility function for one-time account type detection
 */
export async function detectAccountTypeFromDatabase(
  userId: string,
  options: { debug?: boolean } = {}
): Promise<{
  accountType: AccountType | null;
  profileExists: boolean;
  source: 'database_buyer' | 'database_creator' | 'not_found';
  profileData?: any;
}> {
  const { debug = false } = options;

  try {
    if (debug) {
      console.log('[detectAccountTypeFromDatabase] Checking for user:', userId);
    }

    // Check buyer table first
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('user_buyers')
      .select('id, email, full_name, account_type, tier')
      .eq('id', userId)
      .maybeSingle();

    if (buyerProfile) {
      return {
        accountType: 'buyer',
        profileExists: true,
        source: 'database_buyer',
        profileData: buyerProfile
      };
    }

    // Check creator table
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('user_creators')
      .select('id, email, full_name, account_type, pen_name, invitation_status')
      .eq('id', userId)
      .maybeSingle();

    if (creatorProfile) {
      return {
        accountType: 'creator',
        profileExists: true,
        source: 'database_creator',
        profileData: creatorProfile
      };
    }

    return {
      accountType: null,
      profileExists: false,
      source: 'not_found'
    };

  } catch (error) {
    if (debug) {
      console.error('[detectAccountTypeFromDatabase] Error:', error);
    }

    return {
      accountType: null,
      profileExists: false,
      source: 'not_found'
    };
  }
}

/**
 * Get dashboard path for account type
 */
export function getDashboardPath(accountType: AccountType | null): string {
  switch (accountType) {
    case 'buyer':
      return '/buyers/home';
    case 'creator':
      return '/creators/home';
    default:
      return '/signin';
  }
}

/**
 * Get signup completion path for account type
 */
export function getSignupCompletionPath(accountType: AccountType | null): string {
  switch (accountType) {
    case 'buyer':
      return '/signup/buyer?complete=true';
    case 'creator':
      return '/signup/creator?complete=true';
    default:
      return '/signin';
  }
}