-- Migration: 20260716120500_create_page_view_events.sql
-- Created: 2026-07-16
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Per-user page-view log so the weekly activity digest can, over time, report
-- which pages a NAMED signed-in user visited and for how long. GA4 cannot join
-- page paths to a user identity (no user_id dimension in the Data API, no
-- BigQuery export), so we record dwell time in our own table on route change.
--
-- Rows are written only for authenticated users (user_id = auth.uid()); the
-- table is otherwise service-role-only. No PII beyond the Supabase UUID.
--
-- Risk Level: LOW (additive; new table, 0 rows before migration)
-- Destructive: NO
--
-- Rollback: DROP TABLE public.page_view_events;  (safe — write-only telemetry)

CREATE TABLE IF NOT EXISTS public.page_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  app text NOT NULL,
  path text NOT NULL,
  referrer_path text,
  dwell_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_view_events_app_controlled
    CHECK (app IN ('dashboard', 'creator', 'website')),
  CONSTRAINT page_view_events_path_length
    CHECK (char_length(path) BETWEEN 1 AND 512),
  CONSTRAINT page_view_events_dwell_nonneg
    CHECK (dwell_ms IS NULL OR (dwell_ms >= 0 AND dwell_ms <= 86400000))
);

-- Digest queries by recency and by user; keep the index lean.
CREATE INDEX IF NOT EXISTS page_view_events_created_at_idx
  ON public.page_view_events (created_at DESC);
CREATE INDEX IF NOT EXISTS page_view_events_user_created_idx
  ON public.page_view_events (user_id, created_at DESC);

ALTER TABLE public.page_view_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users may insert only their own rows. No SELECT/UPDATE/DELETE
-- for anon or authenticated — the digest reads via the service role.
DROP POLICY IF EXISTS page_view_events_insert_own ON public.page_view_events;
CREATE POLICY page_view_events_insert_own
  ON public.page_view_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.page_view_events IS
  'Per-user route dwell telemetry for the weekly activity digest. Insert-only for authenticated users; read via service role.';
