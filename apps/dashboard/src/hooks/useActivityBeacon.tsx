import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { notifyBuyerReturn } from '@/utils/slack';

/**
 * useActivityBeacon
 *
 * Fires once per browser-tab session when an authenticated user lands in the
 * app with a persisted Supabase session. Updates user_buyers.last_active_at
 * unconditionally; if the gap since the previous visit was ≥12h, also fires a
 * "Buyer Returned" Slack notification with idle_hours.
 *
 * Multi-tab dedup: a localStorage cooldown (1h) gates the entire effect so
 * sibling tabs and rapid page reloads don't double-notify. The cooldown is
 * looser than the threshold on purpose — we still want freshness in the DB
 * timestamp, but Slack volume should be kept sane.
 *
 * Excluded test/internal accounts are filtered downstream by sendSlackNotification's
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
        .from('user_buyers')
        .select('last_active_at, full_name, buyer_company, tier')
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
          notifyBuyerReturn({
            email,
            fullName: (profile as { full_name?: string | null }).full_name || undefined,
            company: (profile as { buyer_company?: string | null }).buyer_company || undefined,
            tier: (profile as { tier?: string | null }).tier || undefined,
            idleHours,
            lastActiveAt,
          }).catch((err) => console.warn('[ActivityBeacon] Slack notify failed:', err));
        }
      }

      const { error: updateError } = await supabase
        .from('user_buyers')
        .update({ last_active_at: new Date().toISOString() })
        .eq('email', email);

      if (updateError) {
        console.warn('[ActivityBeacon] last_active_at update failed:', updateError);
      }
    };

    run().catch((err) => console.warn('[ActivityBeacon] unexpected error:', err));
  }, [user, session, loading]);
}
