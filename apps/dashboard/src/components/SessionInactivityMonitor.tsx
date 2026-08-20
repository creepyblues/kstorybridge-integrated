import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  EXPIRY_BROADCAST_KEY,
  getLastSessionActivity,
  initializeSessionActivity,
  isSessionActivityExpired,
  markSessionExpired,
  LAST_ACTIVITY_KEY,
  recordSessionActivity,
} from '@/lib/sessionInactivity';

const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;

export function SessionInactivityMonitor() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const expiringRef = useRef(false);

  const expireSession = useCallback(async () => {
    if (expiringRef.current) return;
    expiringRef.current = true;
    markSessionExpired(location.pathname, location.search);

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) console.error('[SessionInactivity] Local sign-out failed:', error);
    } catch (error) {
      console.error('[SessionInactivity] Local sign-out failed:', error);
    } finally {
      navigate('/signin', { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!session) {
      expiringRef.current = false;
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastWriteAt = 0;

    const scheduleExpiry = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const lastActivity = getLastSessionActivity() ?? Date.now();
      const remaining = Math.max(0, AUTH_INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity));
      timeoutId = setTimeout(() => {
        if (isSessionActivityExpired()) void expireSession();
        else scheduleExpiry();
      }, remaining);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (isSessionActivityExpired(now)) {
        void expireSession();
        return;
      }
      if (now - lastWriteAt >= ACTIVITY_WRITE_THROTTLE_MS) {
        recordSessionActivity(now);
        lastWriteAt = now;
      }
      scheduleExpiry();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleActivity();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === EXPIRY_BROADCAST_KEY && event.newValue) {
        void expireSession();
      } else if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        scheduleExpiry();
      }
    };

    if (initializeSessionActivity() === 'expired') {
      void expireSession();
      return;
    }

    scheduleExpiry();
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('focus', handleActivity);
    window.addEventListener('pageshow', handleActivity);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('pageshow', handleActivity);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [expireSession, session]);

  useEffect(() => {
    if (!session) return;
    if (isSessionActivityExpired()) void expireSession();
    else recordSessionActivity();
  }, [expireSession, location.pathname, location.search, session]);

  return null;
}
