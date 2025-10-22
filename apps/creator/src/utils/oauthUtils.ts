/**
 * OAuth Utilities - Centralized OAuth Flow Management
 *
 * This module consolidates all OAuth-related utility functions:
 * - Account type detection for OAuth flows
 * - OAuth flow state detection
 * - OAuth callback and completion detection
 * - Path helpers for routing
 *
 * Replaces:
 * - oauthFlowDetection.ts (flow detection utilities)
 * - simpleAccountTypeDetection.ts (account type detection)
 *
 * @module OAuthUtils
 */

import { User } from '@supabase/supabase-js';

// ============================================================================
// Type Definitions
// ============================================================================

export type AccountType = 'buyer' | 'creator';

export interface SimpleAccountTypeResult {
  accountType: AccountType | null;
  source: 'url_params' | 'metadata' | 'storage' | 'unknown';
}

export interface OAuthFlowParams {
  code: string | null;
  accountType: string | null;
  flow: string | null;
}

// ============================================================================
// Account Type Detection
// ============================================================================

/**
 * Get account type for OAuth flows - fast and simple
 *
 * Priority order:
 * 1. URL parameters (most reliable for OAuth)
 * 2. User metadata
 * 3. SessionStorage (fallback)
 *
 * @param user - Supabase user object
 * @param urlParams - URL search parameters
 * @returns Account type result with source indication
 */
export function getOAuthAccountType(
  user: User | null,
  urlParams?: URLSearchParams
): SimpleAccountTypeResult {
  console.log('[OAuthUtils] Starting account type detection', {
    hasUser: !!user,
    urlParams: urlParams?.toString()
  });

  // 1. Check URL parameters first (most reliable for OAuth)
  if (urlParams) {
    const urlAccountType = urlParams.get('account_type');
    if (urlAccountType === 'buyer' || urlAccountType === 'creator') {
      console.log('[OAuthUtils] Account type from URL params:', urlAccountType);
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
      console.log('[OAuthUtils] Account type from user metadata:', metadataType);
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
      console.log('[OAuthUtils] Account type from sessionStorage fallback:', storedType);
      return {
        accountType: storedType,
        source: 'storage'
      };
    }
  }

  // No account type found
  console.log('[OAuthUtils] Account type unresolved');
  return {
    accountType: null,
    source: 'unknown'
  };
}

/**
 * Validate account type string
 *
 * @param value - Value to check
 * @returns True if value is a valid AccountType
 */
export function isValidAccountType(value: any): value is AccountType {
  return value === 'buyer' || value === 'creator';
}

// ============================================================================
// OAuth Flow Detection
// ============================================================================

/**
 * Check if current URL is an OAuth callback
 *
 * @param url - URL pathname (defaults to window.location.pathname)
 * @returns True if URL is /auth/callback
 */
export function isOAuthCallback(url?: string): boolean {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  return targetUrl === '/auth/callback';
}

/**
 * Check if current URL has OAuth code parameter
 *
 * @param search - URL search string (defaults to window.location.search)
 * @returns True if URL contains 'code' parameter
 */
export function hasOAuthCode(search?: string): boolean {
  const searchParams = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  return searchParams.has('code');
}

/**
 * Check if current URL is an OAuth completion page (signup with ?complete=true)
 *
 * @param url - URL pathname
 * @param search - URL search string
 * @returns True if on signup page with complete=true parameter
 */
export function isOAuthCompletionPage(url?: string, search?: string): boolean {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  const searchParams = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));

  // Check if we're on a signup page with completion parameter from OAuth
  const isSignupPage = targetUrl.startsWith('/signup/');
  const hasCompleteParam = searchParams.get('complete') === 'true';

  return isSignupPage && hasCompleteParam;
}

/**
 * Check if we're currently in an OAuth flow (callback with code OR completion page)
 *
 * @param url - URL pathname
 * @param search - URL search string
 * @returns True if in OAuth callback or completion flow
 */
export function isInOAuthFlow(url?: string, search?: string): boolean {
  return (isOAuthCallback(url) && hasOAuthCode(search)) || isOAuthCompletionPage(url, search);
}

/**
 * Get OAuth flow parameters from URL
 *
 * @param search - URL search string (defaults to window.location.search)
 * @returns Object with code, accountType, and flow parameters
 */
export function getOAuthFlowParams(search?: string): OAuthFlowParams {
  const searchParams = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));

  return {
    code: searchParams.get('code'),
    accountType: searchParams.get('account_type'),
    flow: searchParams.get('flow')
  };
}

// ============================================================================
// OAuth State Management
// ============================================================================

/**
 * Check if we should bypass legacy systems during OAuth
 *
 * Returns true if:
 * - Currently in OAuth flow, OR
 * - Recently completed OAuth (within 30 seconds)
 *
 * @returns True if legacy systems should be bypassed
 */
export function shouldBypassLegacySystems(): boolean {
  if (typeof window === 'undefined') return false;

  return isInOAuthFlow() ||
         // Also bypass if we recently completed OAuth (within 30 seconds)
         (Date.now() - (parseInt(sessionStorage.getItem('oauth_completion_time') || '0'))) < 30000;
}

/**
 * Mark OAuth completion for temporary legacy system bypass
 *
 * Stores completion timestamp in sessionStorage for 30-second bypass window
 */
export function markOAuthCompletion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_completion_time', Date.now().toString());
  }
}

/**
 * Clear OAuth completion marker
 *
 * Removes completion timestamp from sessionStorage
 */
export function clearOAuthCompletion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('oauth_completion_time');
  }
}

// ============================================================================
// Path Helpers
// ============================================================================

/**
 * Get dashboard path for account type
 *
 * @param accountType - User account type
 * @returns Dashboard route path
 */
export function getDashboardPath(accountType: AccountType): string {
  // Creator app uses clean URLs without /creators prefix
  return accountType === 'creator' ? '/home' : '/buyers/home';
}

/**
 * Get signup path for account type
 *
 * @param accountType - User account type
 * @returns Signup route path
 */
export function getSignupPath(accountType: AccountType): string {
  // Creator app uses clean URLs without account type suffix
  return accountType === 'creator' ? '/signup' : `/signup/${accountType}`;
}
