import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export type AccountType = 'buyer' | 'creator';
export type ExtendedAccountType = AccountType | null;

export interface AccountTypeResult {
  accountType: ExtendedAccountType;
  source: 'metadata' | 'database_buyer' | 'database_creator' | 'url_params' | 'default' | 'error';
  confidence: 'high' | 'medium' | 'low';
  profileExists: boolean;
}

export interface AccountTypeOptions {
  urlParams?: URLSearchParams;
  includeDatabaseLookup?: boolean;
  defaultAccountType?: AccountType;
  debug?: boolean;
  user?: User | null;
  bypassCache?: boolean;
}

/**
 * Simplified account type determination - no complex circuits or timeouts
 */
export async function determineAccountType(
  user: User | null,
  options: AccountTypeOptions = {}
): Promise<AccountTypeResult> {
  const { urlParams, includeDatabaseLookup = false, defaultAccountType = 'buyer', debug = false } = options;

  if (debug) {
    console.log('[SimpleAccountType] Starting detection for user:', user?.email, {
      includeDatabaseLookup,
      defaultAccountType,
      hasMetadata: !!user?.user_metadata,
      urlAccountType: urlParams?.get('account_type')
    });
  }

  // No user = no account type
  if (!user) {
    return {
      accountType: null,
      source: 'error',
      confidence: 'low',
      profileExists: false
    };
  }

  // 1. Check URL params first (most reliable for OAuth)
  if (urlParams) {
    const urlAccountType = urlParams.get('account_type');
    if (urlAccountType === 'buyer' || urlAccountType === 'creator') {
      if (debug) {
        console.log('[SimpleAccountType] Using account type from URL params:', urlAccountType);
      }
      return {
        accountType: urlAccountType,
        source: 'url_params',
        confidence: 'high',
        profileExists: true // Assume true for URL params
      };
    }
  }

  // 2. Check metadata (fast, no database call)
  const metadataType = user.user_metadata?.account_type;
  if (metadataType === 'buyer' || metadataType === 'creator') {
    if (debug) {
      console.log('[SimpleAccountType] Using account type from metadata:', metadataType);
    }
    return {
      accountType: metadataType,
      source: 'metadata',
      confidence: 'high',
      profileExists: true // Assume true for metadata
    };
  }

  // 3. Database lookup if requested (only when necessary)
  if (includeDatabaseLookup) {
    try {
      // Quick check for buyer profile
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('user_buyers')
        .select('email')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      if (debug) {
        console.log('[SimpleAccountType] Buyer profile lookup:', {
          found: !!buyerProfile,
          error: buyerError?.message
        });
      }

      if (buyerProfile) {
        return {
          accountType: 'buyer',
          source: 'database_buyer',
          confidence: 'high',
          profileExists: true
        };
      }

      // Quick check for creator profile
      const { data: creatorProfile, error: creatorError } = await supabase
        .from('user_creators')
        .select('email')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      if (debug) {
        console.log('[SimpleAccountType] Creator profile lookup:', {
          found: !!creatorProfile,
          error: creatorError?.message
        });
      }

      if (creatorProfile) {
        return {
          accountType: 'creator',
          source: 'database_creator',
          confidence: 'high',
          profileExists: true
        };
      }
    } catch (error) {
      if (debug) {
        console.warn('[SimpleAccountType] Database lookup failed:', error);
      }
    }
  }

  // 4. Default fallback
  if (debug) {
    console.log('[SimpleAccountType] Falling back to default account type:', defaultAccountType);
  }
  return {
    accountType: defaultAccountType,
    source: 'default',
    confidence: 'low',
    profileExists: false
  };
}

/**
 * Get account type from metadata only (fastest)
 */
export function getAccountTypeFromMetadata(user: User | null): ExtendedAccountType {
  if (!user?.user_metadata?.account_type) return null;

  const type = user.user_metadata.account_type;
  return (type === 'buyer' || type === 'creator') ? type : null;
}

/**
 * Check if profile exists (simplified)
 */
export async function checkProfileExists(
  user: User | null,
  accountType: AccountType
): Promise<boolean> {
  if (!user) return false;

  try {
    const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
    const { data } = await supabase
      .from(table)
      .select('email')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.warn('[SimpleAccountType] Profile check failed:', error);
    return false;
  }
}

/**
 * Get display information for account type
 */
export function getAccountTypeDisplayInfo(accountType: ExtendedAccountType) {
  switch (accountType) {
    case 'buyer':
      return {
        label: 'Buyer',
        description: 'Content buyer and media professional',
        dashboardPath: '/buyers/home',
        color: 'blue'
      };
    case 'creator':
      return {
        label: 'Creator',
        description: 'Content creator and IP owner',
        dashboardPath: '/creators/home',
        color: 'green'
      };
    default:
      return {
        label: 'Unknown',
        description: 'Account type not determined',
        dashboardPath: '/signin',
        color: 'gray'
      };
  }
}

/**
 * React hook for account type - simplified
 */
export function useAccountType(options: AccountTypeOptions = {}) {
  const [accountType, setAccountType] = useState<ExtendedAccountType>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<AccountTypeResult | null>(null);

  useEffect(() => {
    const detectAccountType = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedUser = options.user ?? null;

        if (resolvedUser) {
          if (options.debug) {
            console.log('[SimpleAccountType] Using provided user for detection:', resolvedUser.email);
          }
        } else {
          if (options.debug) {
            console.log('[SimpleAccountType] No user provided, fetching via supabase.auth.getUser');
          }
          const { data: { user } } = await supabase.auth.getUser();
          resolvedUser = user;
        }

        if (options.debug) {
          console.log('[SimpleAccountType] Auth getUser result:', {
            hasUser: !!resolvedUser,
            userEmail: resolvedUser?.email
          });
        }

        if (!resolvedUser) {
          setAccountType(null);
          setDetails({
            accountType: null,
            source: 'error',
            confidence: 'low',
          profileExists: false
        });
        if (options.debug) {
          console.warn('[SimpleAccountType] No user available during detection');
        }
        return;
      }

      // Use simple detection (metadata only by default)
        const result = await determineAccountType(resolvedUser, {
          ...options,
          includeDatabaseLookup: options.includeDatabaseLookup ?? false
        });

        setAccountType(result.accountType);
      setDetails(result);

      if (options.debug) {
        console.log('[SimpleAccountType] Detection result:', result);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAccountType(null);
      setDetails({
        accountType: null,
        source: 'error',
        confidence: 'low',
        profileExists: false
      });

      if (options.debug) {
        console.error('[SimpleAccountType] Detection error:', err);
      }
    } finally {
      setLoading(false);

      if (options.debug) {
        console.log('[SimpleAccountType] Detection complete. Loading set to false.');
      }
    }
  };

  detectAccountType();
  }, [options.debug, options.defaultAccountType, options.includeDatabaseLookup, options.user?.id]);

  return {
    accountType,
    loading,
    error,
    displayInfo: getAccountTypeDisplayInfo(accountType),
    source: details?.source,
    confidence: details?.confidence,
    profileExists: details?.profileExists,
    result: details
  };
}

/**
 * Clear cache - no-op in simple version
 */
export function clearAccountTypeCache(userId?: string): void {
  // Simple version doesn't use complex caching
  console.log('[SimpleAccountType] Cache clear requested (no-op in simple version)');
}

/**
 * Get cache stats - no-op in simple version
 */
export function getAccountTypeCacheStats() {
  return {
    size: 0,
    hits: 0,
    misses: 0,
    lastAccess: null
  };
}
