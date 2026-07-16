import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Records per-user route dwell time to `page_view_events` so the weekly
 * activity digest can report which pages a named signed-in user visited and
 * for how long. GA4 can't join page paths to a user identity, so we log it
 * ourselves. Insert-only, authenticated users only, fire-and-forget.
 *
 * A row is written for the page the user is LEAVING (with its dwell), on each
 * route change and when the tab is hidden/closed. Renders nothing.
 */
export function PageViewLogger(): null {
  const location = useLocation();
  const { user } = useAuth();

  const currentPath = useRef<string | null>(null);
  const enteredAt = useRef<number>(Date.now());
  const userId = useRef<string | null>(null);
  userId.current = user?.id ?? null;

  const flush = (nextPath: string | null) => {
    const path = currentPath.current;
    const uid = userId.current;
    if (uid && path) {
      const dwellMs = Math.min(Date.now() - enteredAt.current, 86_400_000);
      // Fire-and-forget; never block navigation or surface errors to the user.
      void supabase
        .from('page_view_events')
        .insert({
          user_id: uid,
          app: 'dashboard',
          path,
          referrer_path: null,
          dwell_ms: dwellMs,
        })
        .then(({ error }) => {
          if (error && import.meta.env.DEV) {
            console.debug('[PageViewLogger] insert skipped:', error.message);
          }
        });
    }
    currentPath.current = nextPath;
    enteredAt.current = Date.now();
  };

  // On route change, flush the page being left and start timing the new one.
  useEffect(() => {
    if (currentPath.current !== location.pathname) {
      flush(location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Flush the final page when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        flush(currentPath.current);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
