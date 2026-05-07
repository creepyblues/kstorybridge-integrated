-- Add last_active_at to track when authenticated users return to the app.
-- Populated unconditionally on every app load by the client-side activity
-- beacon (apps/dashboard, apps/creator). When the gap between visits exceeds
-- 12 hours, the client fires a "Returned" Slack notification — this column is
-- the source of truth for that gap calculation.
--
-- DEFAULT NOW() backfills existing rows so the first post-deploy visit does
-- not trigger a spurious "returned" event for everyone.

ALTER TABLE public.user_buyers
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.user_creators
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.user_buyers.last_active_at IS
  'Timestamp of the user''s most recent app load. Updated by the client-side activity beacon. Used to detect returns after >12h idle.';

COMMENT ON COLUMN public.user_creators.last_active_at IS
  'Timestamp of the user''s most recent app load. Updated by the client-side activity beacon. Used to detect returns after >12h idle.';
