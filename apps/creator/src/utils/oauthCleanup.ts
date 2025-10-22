/**
 * OAuth State Cleanup Utilities
 *
 * Utilities to clean up residual OAuth state from failed or interrupted OAuth flows.
 * Helps resolve "bad_oauth_state" errors caused by cached browser state.
 */

/**
 * Clear all OAuth-related data from browser storage
 */
export function clearOAuthStorage(): void {
  console.log('🧹 Cleaning OAuth storage...');

  let clearedCount = 0;

  // Clear sessionStorage OAuth data
  const sessionKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('oauth_')) {
      sessionKeys.push(key);
    }
  }

  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
    clearedCount++;
  });

  // Clear specific OAuth-related keys
  const oauthKeys = [
    'oauth_account_type',
    'oauth_flow',
    'oauth_provider',
    'oauth_state',
    'oauth_callback_data'
  ];

  oauthKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      clearedCount++;
    }
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`✅ Cleared ${clearedCount} OAuth storage entries`);
}

/**
 * Clear OAuth error parameters from current URL
 */
export function clearOAuthErrorFromURL(): void {
  console.log('🧹 Cleaning OAuth errors from URL...');

  if (typeof window === 'undefined') {
    console.log('⚠️ Not in browser environment');
    return;
  }

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // OAuth error parameters to remove
  const errorParams = [
    'error',
    'error_code',
    'error_description',
    'state' // Remove state parameter if it caused errors
  ];

  let hasChanges = false;
  errorParams.forEach(param => {
    if (params.has(param)) {
      params.delete(param);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    // Update URL without causing page reload
    const cleanUrl = url.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', cleanUrl);
    console.log('✅ Cleaned URL parameters:', cleanUrl);
  } else {
    console.log('ℹ️ No OAuth error parameters found in URL');
  }
}

/**
 * Comprehensive OAuth cleanup
 * Call this to clear all residual OAuth state
 */
export function cleanupOAuthState(): void {
  console.log('🚀 Starting comprehensive OAuth cleanup...');

  clearOAuthStorage();
  clearOAuthErrorFromURL();

  console.log('✅ OAuth cleanup complete');
  console.log('💡 Tip: Refresh the page or restart OAuth flow to test with clean state');
}

/**
 * Check for OAuth error state in current URL
 */
export function hasOAuthError(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.has('error') && params.get('error_code') === 'bad_oauth_state';
}

/**
 * Get OAuth error details from URL
 */
export function getOAuthErrorDetails(): { error?: string; errorCode?: string; description?: string } | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);

  if (!params.has('error')) return null;

  return {
    error: params.get('error') || undefined,
    errorCode: params.get('error_code') || undefined,
    description: params.get('error_description') || undefined
  };
}

/**
 * Development helper - log OAuth state for debugging
 */
export function debugOAuthState(): void {
  console.log('🔍 OAuth State Debug Info:');

  // Check URL parameters
  const errorDetails = getOAuthErrorDetails();
  if (errorDetails) {
    console.log('❌ OAuth Error in URL:', errorDetails);
  } else {
    console.log('✅ No OAuth errors in URL');
  }

  // Check storage
  const sessionKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('oauth_')) {
      sessionKeys.push(key);
    }
  }

  if (sessionKeys.length > 0) {
    console.log('📦 OAuth data in sessionStorage:', sessionKeys);
  } else {
    console.log('✅ No OAuth data in sessionStorage');
  }

  // Check Supabase auth state
  console.log('🔐 Current URL:', window.location.href);
  console.log('🔐 URL search params:', new URLSearchParams(window.location.search).toString());
}

// Auto-cleanup on module load if OAuth error detected
if (typeof window !== 'undefined' && hasOAuthError()) {
  console.log('⚠️ OAuth error detected in URL - auto-cleaning...');
  cleanupOAuthState();
}