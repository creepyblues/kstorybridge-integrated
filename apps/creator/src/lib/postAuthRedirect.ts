/**
 * Where to send a creator after they finish authenticating.
 *
 * The in-tab intent lives in sessionStorage.redirect_after_login (written by
 * ProtectedRoute / sessionInactivity). Only internal, non-auth paths are honoured.
 * Mirrors apps/dashboard/src/lib/postAuthRedirect.ts.
 */
export const REDIRECT_KEY = 'redirect_after_login'
export const DEFAULT_POST_AUTH_PATH = '/home'

const AUTH_PREFIXES = ['/signin', '/signup', '/auth/', '/forgot-password', '/reset-password']

/** Accept only same-origin app paths that are not auth pages. */
export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!/^\/[^\s]*$/.test(value) || value.startsWith('//')) return false
  return !AUTH_PREFIXES.some(p => value === p.replace(/\/$/, '') || value.startsWith(p))
}

export function resolvePostAuthRedirect(
  sessionValue: string | null | undefined,
  metadataValue: unknown,
  fallback: string = DEFAULT_POST_AUTH_PATH,
): string {
  if (isSafeRedirectPath(sessionValue)) return sessionValue
  if (isSafeRedirectPath(metadataValue)) return metadataValue
  return fallback
}

/** Read (session first, then metadata), then clear the session copy. */
export function consumePostAuthRedirect(metadataValue?: unknown, fallback?: string): string {
  const fromSession = sessionStorage.getItem(REDIRECT_KEY)
  sessionStorage.removeItem(REDIRECT_KEY)
  return resolvePostAuthRedirect(fromSession, metadataValue, fallback)
}
