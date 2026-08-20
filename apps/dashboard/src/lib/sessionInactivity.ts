export const AUTH_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
export const SESSION_EXPIRED_REASON_KEY = 'kstorybridge_session_expired_reason';
export const SESSION_EXPIRED_EVENT = 'kstorybridge:session-expired';
export const LAST_ACTIVITY_KEY = 'kstorybridge-dashboard-auth-last-activity';
export const EXPIRY_BROADCAST_KEY = 'kstorybridge-dashboard-auth-expired-at';

const readLastActivity = (): number | null => {
  const value = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!value) return null;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const isSessionActivityExpired = (now = Date.now()): boolean => {
  const lastActivity = readLastActivity();
  return lastActivity !== null && now - lastActivity >= AUTH_INACTIVITY_TIMEOUT_MS;
};

export const getLastSessionActivity = (): number | null => readLastActivity();

export const recordSessionActivity = (now = Date.now()): void => {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  localStorage.removeItem(EXPIRY_BROADCAST_KEY);
};

export const initializeSessionActivity = (): 'active' | 'expired' => {
  if (isSessionActivityExpired()) return 'expired';
  if (readLastActivity() === null) recordSessionActivity();
  return 'active';
};

export const clearSessionActivity = (): void => {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(EXPIRY_BROADCAST_KEY);
};

const isProtectedPath = (pathname: string): boolean =>
  pathname.startsWith('/buyers/') || pathname.startsWith('/admin/');

export const markSessionExpired = (pathname = window.location.pathname, search = window.location.search): void => {
  if (isProtectedPath(pathname)) {
    sessionStorage.setItem('redirect_after_login', `${pathname}${search}`);
  }
  sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, 'inactivity');
  localStorage.setItem(EXPIRY_BROADCAST_KEY, String(Date.now()));
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
