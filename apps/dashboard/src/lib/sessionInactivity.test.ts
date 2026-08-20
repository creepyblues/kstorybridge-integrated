import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  clearSessionActivity,
  EXPIRY_BROADCAST_KEY,
  initializeSessionActivity,
  isSessionActivityExpired,
  LAST_ACTIVITY_KEY,
  markSessionExpired,
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_REASON_KEY,
} from './sessionInactivity';

describe('dashboard session inactivity state', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/buyers/home');
  });

  it('gives a persisted session without activity history a fresh window', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

    expect(initializeSessionActivity()).toBe('active');
    expect(localStorage.getItem(LAST_ACTIVITY_KEY)).toBe('1000000');
  });

  it('expires at one hour but not before it', () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, '1000');

    expect(isSessionActivityExpired(1000 + AUTH_INACTIVITY_TIMEOUT_MS - 1)).toBe(false);
    expect(isSessionActivityExpired(1000 + AUTH_INACTIVITY_TIMEOUT_MS)).toBe(true);
  });

  it('preserves a protected route and broadcasts inactivity expiration', () => {
    const eventListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, eventListener);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - AUTH_INACTIVITY_TIMEOUT_MS));

    markSessionExpired('/buyers/titles/story-slug', '?tab=materials');

    expect(sessionStorage.getItem('redirect_after_login')).toBe('/buyers/titles/story-slug?tab=materials');
    expect(sessionStorage.getItem(SESSION_EXPIRED_REASON_KEY)).toBe('inactivity');
    expect(isSessionActivityExpired()).toBe(true);
    expect(localStorage.getItem(EXPIRY_BROADCAST_KEY)).not.toBeNull();
    expect(eventListener).toHaveBeenCalledOnce();
    window.removeEventListener(SESSION_EXPIRED_EVENT, eventListener);
  });

  it('does not restore public routes and clears activity state on manual logout', () => {
    markSessionExpired('/trial', '');
    expect(sessionStorage.getItem('redirect_after_login')).toBeNull();

    clearSessionActivity();
    expect(localStorage.getItem(LAST_ACTIVITY_KEY)).toBeNull();
    expect(localStorage.getItem(EXPIRY_BROADCAST_KEY)).toBeNull();
  });
});
