/**
 * OAuth Flow Detection Utilities
 *
 * These utilities help detect when OAuth callback processing is active
 * to prevent legacy systems from interfering with the OAuth PKCE flow.
 */

/**
 * Check if current URL is an OAuth callback
 */
export function isOAuthCallback(url?: string): boolean {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  return targetUrl === '/auth/callback';
}

/**
 * Check if current URL has OAuth code parameter
 */
export function hasOAuthCode(search?: string): boolean {
  const searchParams = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  return searchParams.has('code');
}

/**
 * Check if current URL is an OAuth completion page (signup with ?complete=true)
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
 */
export function isInOAuthFlow(url?: string, search?: string): boolean {
  return (isOAuthCallback(url) && hasOAuthCode(search)) || isOAuthCompletionPage(url, search);
}

/**
 * Get OAuth flow parameters from URL
 */
export function getOAuthFlowParams(search?: string): {
  code: string | null;
  accountType: string | null;
  flow: string | null;
} {
  const searchParams = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));

  return {
    code: searchParams.get('code'),
    accountType: searchParams.get('account_type'),
    flow: searchParams.get('flow')
  };
}

/**
 * Check if we should bypass legacy systems during OAuth
 */
export function shouldBypassLegacySystems(): boolean {
  if (typeof window === 'undefined') return false;

  return isInOAuthFlow() ||
         // Also bypass if we recently completed OAuth (within 30 seconds)
         (Date.now() - (parseInt(sessionStorage.getItem('oauth_completion_time') || '0'))) < 30000;
}

/**
 * Mark OAuth completion for temporary legacy system bypass
 */
export function markOAuthCompletion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_completion_time', Date.now().toString());
  }
}

/**
 * Clear OAuth completion marker
 */
export function clearOAuthCompletion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('oauth_completion_time');
  }
}