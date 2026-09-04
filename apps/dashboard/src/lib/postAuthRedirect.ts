/**
 * Where to send a user after they finish authenticating.
 *
 * The in-tab intent lives in sessionStorage.redirect_after_login. That is lost
 * when the email verification link opens in a new tab, so signup also stores
 * the intent in auth user metadata (`redirect_after_login`), which travels with
 * the session. Only same-origin dashboard paths are ever honoured.
 */
export const REDIRECT_KEY = 'redirect_after_login';
export const DEFAULT_POST_AUTH_PATH = '/buyers/home';

/** Accept only internal, non-protocol-relative paths under the buyer area. */
export function isSafeRedirectPath(value: unknown): value is string {
  return typeof value === 'string' && /^\/buyers\/[^\s]*$/.test(value) && !value.startsWith('//');
}

export function resolvePostAuthRedirect(
  sessionValue: string | null | undefined,
  metadataValue: unknown,
  fallback: string = DEFAULT_POST_AUTH_PATH,
): string {
  if (isSafeRedirectPath(sessionValue)) return sessionValue;
  if (isSafeRedirectPath(metadataValue)) return metadataValue;
  return fallback;
}

/** Read (session first, then metadata), then clear the session copy. */
export function consumePostAuthRedirect(metadataValue: unknown, fallback?: string): string {
  const fromSession = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return resolvePostAuthRedirect(fromSession, metadataValue, fallback);
}
