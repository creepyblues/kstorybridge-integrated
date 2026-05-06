import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { notifyCreatorReturn } from '@/utils/slack';

/**
 * useActivityBeacon
 *
 * Fires once per browser-tab session when an authenticated creator lands in
 * the app with a persisted Supabase session. Updates user_creators.last_active_at
 * unconditionally; if the gap since the previous visit was ≥12h, also fires a
 * "Creator Returned" Slack notification with idle_hours.
 *
 * Multi-tab dedup: a localStorage cooldown (1h) gates the entire effect so
 * sibling tabs and rapid page reloads don't double-notify.
 *
 * Excluded test/internal accounts are filtered downstream by the slack.ts
 * shouldExcludeEmail check, so we don't need to filter here.
 */

const RETURN_THRESHOLD_HOURS = 12;
const COOLDOWN_KEY = 'activity_beacon_fired_at';
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export function useActivityBeacon() {
  const { user, session, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || !session) return;

    const lastFiredRaw = localStorage.getItem(COOLDOWN_KEY);
    if (lastFiredRaw) {
      const lastFired = Number(lastFiredRaw);
      if (!Number.isNaN(lastFired) && Date.now() - lastFired < COOLDOWN_MS) {
        return;
      }
    }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));

    const email = user.email?.toLowerCase();
    if (!email) return;

    const run = async () => {
      const { data: profile, error: fetchError } = await supabase
        .from('user_creators')
        .select('last_active_at, full_name, pen_name')
        .eq('email', email)
        .maybeSingle();

      if (fetchError || !profile) {
        if (fetchError) console.warn('[ActivityBeacon] profile fetch failed:', fetchError);
        return;
      }

      const lastActiveAt = (profile as { last_active_at: string | null }).last_active_at;
      if (lastActiveAt) {
        const idleMs = Date.now() - new Date(lastActiveAt).getTime();
        const idleHours = idleMs / (60 * 60 * 1000);

        if (idleHours >= RETURN_THRESHOLD_HOURS) {
          notifyCreatorReturn({
            email,
            fullName: (profile as { full_name?: string | null }).full_name || undefined,
            penName: (profile as { pen_name?: string | null }).pen_name || undefined,
            idleHours,
            lastActiveAt,
          }).catch((err) => console.warn('[ActivityBeacon] Slack notify failed:', err));
        }
      }

      const { error: updateError } = await supabase
        .from('user_creators')
        .update({ last_active_at: new Date().toISOString() })
        .eq('email', email);

      if (updateError) {
        console.warn('[ActivityBeacon] last_active_at update failed:', updateError);
      }
    };

    run().catch((err) => console.warn('[ActivityBeacon] unexpected error:', err));
  }, [user, session, loading]);
}
