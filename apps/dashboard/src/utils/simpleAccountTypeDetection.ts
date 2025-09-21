import { User } from '@supabase/supabase-js';

export type AccountType = 'buyer' | 'creator';

/**
 * Simplified Account Type Detection for OAuth Flows
 *
 * This replaces the over-engineered accountTypeDetection.ts for OAuth callbacks.
 * Uses simple, fast metadata and URL parameter checking without database queries
 * or complex circuit breakers that cause timeouts.
 */

export interface SimpleAccountTypeResult {
  accountType: AccountType | null;
  source: 'url_params' | 'metadata' | 'storage' | 'unknown';
}

/**
 * Get account type for OAuth flows - fast and simple
 */
export function getOAuthAccountType(
  user: User | null,
  urlParams?: URLSearchParams
): SimpleAccountTypeResult {
  console.log('[OAuthDetection] Starting account type detection', {
    hasUser: !!user,
    urlParams: urlParams?.toString()
  });

  // 1. Check URL parameters first (most reliable for OAuth)
  if (urlParams) {
    const urlAccountType = urlParams.get('account_type');
    if (urlAccountType === 'buyer' || urlAccountType === 'creator') {
      console.log('[OAuthDetection] Account type from URL params:', urlAccountType);
      return {
        accountType: urlAccountType,
        source: 'url_params'
      };
    }
  }

  // 2. Check user metadata
  if (user?.user_metadata?.account_type) {
    const metadataType = user.user_metadata.account_type;
    if (metadataType === 'buyer' || metadataType === 'creator') {
      console.log('[OAuthDetection] Account type from user metadata:', metadataType);
      return {
        accountType: metadataType,
        source: 'metadata'
      };
    }
  }

  // 3. Check sessionStorage as final fallback
  if (typeof window !== 'undefined') {
    const storedType = sessionStorage.getItem('oauth_account_type');
    if (storedType === 'buyer' || storedType === 'creator') {
      // Clear it once used
      sessionStorage.removeItem('oauth_account_type');
      console.log('[OAuthDetection] Account type from sessionStorage fallback:', storedType);
      return {
        accountType: storedType,
        source: 'storage'
      };
    }
  }

  // No account type found
  console.log('[OAuthDetection] Account type unresolved');
  return {
    accountType: null,
    source: 'unknown'
  };
}

/**
 * Get dashboard path for account type
 */
export function getDashboardPath(accountType: AccountType): string {
  return accountType === 'creator' ? '/creators/home' : '/buyers/home';
}

/**
 * Get signup path for account type
 */
export function getSignupPath(accountType: AccountType): string {
  return `/signup/${accountType}`;
}

/**
 * Validate account type string
 */
export function isValidAccountType(value: any): value is AccountType {
  return value === 'buyer' || value === 'creator';
}
