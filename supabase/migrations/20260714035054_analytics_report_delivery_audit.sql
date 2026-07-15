-- Migration: 20260714035054_analytics_report_delivery_audit.sql
-- Created: 2026-07-13
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Add a privacy-safe, service-role-only audit ledger for analytics report runs
-- and per-channel delivery attempts. Controlled RPCs provide atomic run claims,
-- crash-safe delivery claims, aggregate finalization, and a narrow read-only
-- status surface for the weekly progress monitor.
--
-- Risk Level: LOW
-- Destructive: NO
--
-- Affected Tables:
-- - public.analytics_report_runs (new; 0 rows before migration)
-- - public.analytics_report_recipient_deliveries (new; 0 rows before migration)
--
-- Backup Required: NO for local creation. Production preflight must still
-- record row counts and preserve the migration-ledger repair evidence.
--
-- Rollback Procedure:
-- Do not drop audit evidence during an incident. Roll back dependent Edge
-- Functions and the cron command first, revoke safe-status access if required,
-- and leave the additive tables/functions in place. Any later removal requires
-- a separate dependency audit and reviewed deprecation migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Service-role claim, duplicate, retry, and stale-reclaim behavior
-- [x] Anon/authenticated direct-table and mutation-RPC denial
-- [x] Privacy-safe status RPC output and scheduled-streak classification

CREATE TABLE public.analytics_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invocation_key text NOT NULL UNIQUE,
  report_type text NOT NULL,
  trigger_kind text NOT NULL,
  window_start date,
  window_end date,
  status text NOT NULL DEFAULT 'claimed',
  deliveries_initialized boolean NOT NULL DEFAULT false,
  expected_email_count integer NOT NULL DEFAULT 0,
  emails_sent integer NOT NULL DEFAULT 0,
  emails_failed integer NOT NULL DEFAULT 0,
  slack_requested boolean NOT NULL DEFAULT true,
  slack_sent boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  error_codes text[] NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT analytics_report_runs_invocation_key_length
    CHECK (char_length(invocation_key) BETWEEN 8 AND 160),
  CONSTRAINT analytics_report_runs_report_type_controlled
    CHECK (report_type IN ('daily', 'weekly', 'funnel', 'sources', 'realtime', 'progress')),
  CONSTRAINT analytics_report_runs_trigger_kind_controlled
    CHECK (trigger_kind IN ('scheduled', 'manual', 'local_progress', 'github_progress')),
  CONSTRAINT analytics_report_runs_status_controlled
    CHECK (status IN ('claimed', 'generating', 'delivering', 'succeeded', 'partial', 'failed')),
  CONSTRAINT analytics_report_runs_window_order
    CHECK (
      (window_start IS NULL AND window_end IS NULL)
      OR (window_start IS NOT NULL AND window_end IS NOT NULL AND window_start <= window_end)
    ),
  CONSTRAINT analytics_report_runs_trigger_report_pair
    CHECK (
      (report_type = 'funnel' AND trigger_kind IN ('scheduled', 'manual'))
      OR (report_type = 'progress' AND trigger_kind IN ('manual', 'local_progress', 'github_progress'))
      OR (report_type IN ('daily', 'weekly', 'sources', 'realtime') AND trigger_kind = 'manual')
    ),
  CONSTRAINT analytics_report_runs_counts_nonnegative
    CHECK (expected_email_count >= 0 AND emails_sent >= 0 AND emails_failed >= 0),
  CONSTRAINT analytics_report_runs_counts_bounded
    CHECK (emails_sent <= expected_email_count AND emails_failed <= expected_email_count),
  CONSTRAINT analytics_report_runs_error_codes_controlled
    CHECK (
      error_codes <@ ARRAY[
        'report_generation_failed',
        'report_delivery_request_failed',
        'no_active_admins',
        'delivery_pending',
        'resend_http_error',
        'resend_network_error',
        'resend_not_configured',
        'admin_recipient_missing',
        'slack_http_error',
        'slack_network_error',
        'slack_not_configured',
        'slack_not_sent'
      ]::text[]
    )
);

CREATE TABLE public.analytics_report_recipient_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_run_id uuid NOT NULL
    REFERENCES public.analytics_report_runs(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admin(id) ON DELETE RESTRICT,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  error_code text,
  CONSTRAINT analytics_report_deliveries_channel_controlled
    CHECK (channel IN ('email', 'slack')),
  CONSTRAINT analytics_report_deliveries_status_controlled
    CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT analytics_report_deliveries_attempt_count_nonnegative
    CHECK (attempt_count >= 0),
  CONSTRAINT analytics_report_deliveries_identity_shape
    CHECK (
      (channel = 'email' AND admin_id IS NOT NULL)
      OR (channel = 'slack' AND admin_id IS NULL)
    ),
  CONSTRAINT analytics_report_deliveries_error_code_controlled
    CHECK (
      error_code IS NULL OR error_code IN (
        'resend_http_error',
        'resend_network_error',
        'resend_not_configured',
        'admin_recipient_missing',
        'slack_http_error',
        'slack_network_error',
        'slack_not_configured'
      )
    )
);

CREATE UNIQUE INDEX analytics_report_deliveries_email_once
  ON public.analytics_report_recipient_deliveries(report_run_id, admin_id)
  WHERE channel = 'email';

CREATE UNIQUE INDEX analytics_report_deliveries_slack_once
  ON public.analytics_report_recipient_deliveries(report_run_id)
  WHERE channel = 'slack';

CREATE INDEX analytics_report_runs_scheduled_status
  ON public.analytics_report_runs(trigger_kind, started_at DESC)
  WHERE trigger_kind = 'scheduled';

CREATE INDEX analytics_report_deliveries_pending
  ON public.analytics_report_recipient_deliveries(report_run_id, status, updated_at);

ALTER TABLE public.analytics_report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_report_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_report_recipient_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_report_recipient_deliveries FORCE ROW LEVEL SECURITY;

CREATE TRIGGER update_analytics_report_runs_updated_at
  BEFORE UPDATE ON public.analytics_report_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_report_deliveries_updated_at
  BEFORE UPDATE ON public.analytics_report_recipient_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.claim_analytics_report_run(
  p_invocation_key text,
  p_report_type text,
  p_trigger_kind text,
  p_window_start date DEFAULT NULL,
  p_window_end date DEFAULT NULL,
  p_reclaim_after interval DEFAULT interval '30 minutes'
)
RETURNS TABLE (
  report_run_id uuid,
  should_execute boolean,
  run_status text,
  reclaimed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  claimed public.analytics_report_runs%ROWTYPE;
  inserted_count integer;
  is_stale boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_reclaim_after < interval '1 minute' OR p_reclaim_after > interval '24 hours' THEN
    RAISE EXCEPTION 'analytics_report_invalid_reclaim_interval' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.analytics_report_runs (
    invocation_key,
    report_type,
    trigger_kind,
    window_start,
    window_end,
    status
  ) VALUES (
    p_invocation_key,
    p_report_type,
    p_trigger_kind,
    p_window_start,
    p_window_end,
    'claimed'
  )
  ON CONFLICT (invocation_key) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  SELECT *
  INTO claimed
  FROM public.analytics_report_runs
  WHERE invocation_key = p_invocation_key
  FOR UPDATE;

  IF claimed.report_type <> p_report_type
    OR claimed.trigger_kind <> p_trigger_kind
    OR claimed.window_start IS DISTINCT FROM p_window_start
    OR claimed.window_end IS DISTINCT FROM p_window_end THEN
    RAISE EXCEPTION 'analytics_report_invocation_key_conflict' USING ERRCODE = '23505';
  END IF;

  is_stale := claimed.status IN ('claimed', 'generating', 'delivering')
    AND claimed.updated_at <= now() - p_reclaim_after;

  IF inserted_count = 1 OR is_stale OR claimed.status IN ('partial', 'failed') THEN
    UPDATE public.analytics_report_runs
    SET status = 'generating',
        completed_at = NULL,
        error_codes = '{}'::text[]
    WHERE id = claimed.id;

    RETURN QUERY SELECT claimed.id, true, 'generating'::text, is_stale;
    RETURN;
  END IF;

  RETURN QUERY SELECT claimed.id, false, claimed.status, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_analytics_report_deliveries(
  p_report_run_id uuid,
  p_admin_ids uuid[],
  p_send_slack boolean DEFAULT true
)
RETURNS TABLE (
  expected_email_count integer,
  slack_requested boolean,
  already_initialized boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  report_run public.analytics_report_runs%ROWTYPE;
  normalized_admin_ids uuid[];
  was_initialized boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO report_run
  FROM public.analytics_report_runs
  WHERE id = p_report_run_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'analytics_report_run_not_found' USING ERRCODE = 'P0002';
  END IF;

  was_initialized := report_run.deliveries_initialized;
  IF NOT was_initialized THEN
    SELECT coalesce(array_agg(DISTINCT admin_id ORDER BY admin_id), '{}'::uuid[])
    INTO normalized_admin_ids
    FROM unnest(coalesce(p_admin_ids, '{}'::uuid[])) AS admin_id;

    INSERT INTO public.analytics_report_recipient_deliveries (
      report_run_id,
      admin_id,
      channel
    )
    SELECT p_report_run_id, admin_id, 'email'
    FROM unnest(normalized_admin_ids) AS admin_id;

    IF p_send_slack THEN
      INSERT INTO public.analytics_report_recipient_deliveries (
        report_run_id,
        admin_id,
        channel
      ) VALUES (p_report_run_id, NULL, 'slack');
    END IF;

    UPDATE public.analytics_report_runs
    SET deliveries_initialized = true,
        expected_email_count = cardinality(normalized_admin_ids),
        slack_requested = p_send_slack,
        status = 'delivering'
    WHERE id = p_report_run_id
    RETURNING * INTO report_run;
  ELSE
    UPDATE public.analytics_report_runs
    SET status = 'delivering'
    WHERE id = p_report_run_id
    RETURNING * INTO report_run;
  END IF;

  RETURN QUERY
  SELECT report_run.expected_email_count, report_run.slack_requested, was_initialized;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_analytics_report_delivery(
  p_report_run_id uuid,
  p_admin_id uuid,
  p_channel text,
  p_reclaim_after interval DEFAULT interval '15 minutes'
)
RETURNS TABLE (
  should_send boolean,
  attempt_count integer,
  delivery_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  delivery public.analytics_report_recipient_deliveries%ROWTYPE;
  is_stale boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_channel NOT IN ('email', 'slack')
    OR (p_channel = 'email' AND p_admin_id IS NULL)
    OR (p_channel = 'slack' AND p_admin_id IS NOT NULL) THEN
    RAISE EXCEPTION 'analytics_report_invalid_delivery_identity' USING ERRCODE = '22023';
  END IF;
  IF p_reclaim_after < interval '1 minute' OR p_reclaim_after > interval '24 hours' THEN
    RAISE EXCEPTION 'analytics_report_invalid_reclaim_interval' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO delivery
  FROM public.analytics_report_recipient_deliveries
  WHERE report_run_id = p_report_run_id
    AND channel = p_channel
    AND admin_id IS NOT DISTINCT FROM p_admin_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'analytics_report_delivery_not_prepared' USING ERRCODE = 'P0002';
  END IF;

  is_stale := delivery.status = 'pending'
    AND delivery.attempt_count > 0
    AND delivery.updated_at <= now() - p_reclaim_after;

  IF delivery.status = 'failed' OR delivery.attempt_count = 0 OR is_stale THEN
    UPDATE public.analytics_report_recipient_deliveries
    SET status = 'pending',
        attempt_count = analytics_report_recipient_deliveries.attempt_count + 1,
        sent_at = NULL,
        error_code = NULL
    WHERE id = delivery.id
    RETURNING analytics_report_recipient_deliveries.attempt_count
    INTO delivery.attempt_count;

    RETURN QUERY SELECT true, delivery.attempt_count, 'pending'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, delivery.attempt_count, delivery.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_analytics_report_delivery(
  p_report_run_id uuid,
  p_admin_id uuid,
  p_channel text,
  p_status text,
  p_error_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'analytics_report_invalid_delivery_status' USING ERRCODE = '22023';
  END IF;
  IF (p_status = 'sent' AND p_error_code IS NOT NULL)
    OR (p_status = 'failed' AND p_error_code IS NULL) THEN
    RAISE EXCEPTION 'analytics_report_invalid_delivery_result' USING ERRCODE = '22023';
  END IF;

  UPDATE public.analytics_report_recipient_deliveries
  SET status = p_status,
      sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE NULL END,
      error_code = p_error_code
  WHERE report_run_id = p_report_run_id
    AND channel = p_channel
    AND admin_id IS NOT DISTINCT FROM p_admin_id
    AND status = 'pending'
    AND attempt_count > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'analytics_report_delivery_not_claimed' USING ERRCODE = '55000';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_analytics_report_run(
  p_report_run_id uuid
)
RETURNS TABLE (
  run_status text,
  expected_email_count integer,
  emails_sent integer,
  emails_failed integer,
  slack_requested boolean,
  slack_sent boolean,
  error_codes text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  report_run public.analytics_report_runs%ROWTYPE;
  sent_count integer;
  failed_count integer;
  pending_count integer;
  slack_is_sent boolean;
  delivery_errors text[];
  final_errors text[];
  final_status text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO report_run
  FROM public.analytics_report_runs
  WHERE id = p_report_run_id
  FOR UPDATE;
  IF NOT FOUND OR NOT report_run.deliveries_initialized THEN
    RAISE EXCEPTION 'analytics_report_deliveries_not_initialized' USING ERRCODE = '55000';
  END IF;

  SELECT
    count(*) FILTER (WHERE channel = 'email' AND status = 'sent'),
    count(*) FILTER (WHERE channel = 'email' AND status = 'failed'),
    count(*) FILTER (WHERE status = 'pending'),
    coalesce(bool_or(channel = 'slack' AND status = 'sent'), false),
    coalesce(array_agg(DISTINCT error_code) FILTER (WHERE error_code IS NOT NULL), '{}'::text[])
  INTO sent_count, failed_count, pending_count, slack_is_sent, delivery_errors
  FROM public.analytics_report_recipient_deliveries
  WHERE report_run_id = p_report_run_id;

  final_errors := delivery_errors;
  IF report_run.expected_email_count = 0 THEN
    final_errors := array_append(final_errors, 'no_active_admins');
  END IF;
  IF pending_count > 0 THEN
    final_errors := array_append(final_errors, 'delivery_pending');
  END IF;
  IF report_run.slack_requested AND NOT slack_is_sent THEN
    final_errors := array_append(final_errors, 'slack_not_sent');
  END IF;
  SELECT coalesce(array_agg(DISTINCT code ORDER BY code), '{}'::text[])
  INTO final_errors
  FROM unnest(final_errors) AS code;

  final_status := CASE
    WHEN report_run.expected_email_count > 0
      AND sent_count = report_run.expected_email_count
      AND failed_count = 0
      AND pending_count = 0
      AND (NOT report_run.slack_requested OR slack_is_sent)
    THEN 'succeeded'
    ELSE 'partial'
  END;

  UPDATE public.analytics_report_runs
  SET status = final_status,
      emails_sent = sent_count,
      emails_failed = failed_count,
      slack_sent = slack_is_sent,
      completed_at = now(),
      error_codes = final_errors
  WHERE id = p_report_run_id
  RETURNING * INTO report_run;

  RETURN QUERY SELECT
    report_run.status,
    report_run.expected_email_count,
    report_run.emails_sent,
    report_run.emails_failed,
    report_run.slack_requested,
    report_run.slack_sent,
    report_run.error_codes;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_analytics_report_run(
  p_report_run_id uuid,
  p_error_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_report_service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_error_code NOT IN ('report_generation_failed', 'report_delivery_request_failed') THEN
    RAISE EXCEPTION 'analytics_report_invalid_run_error_code' USING ERRCODE = '22023';
  END IF;

  UPDATE public.analytics_report_runs
  SET status = 'failed',
      completed_at = now(),
      error_codes = ARRAY[p_error_code]
  WHERE id = p_report_run_id
    AND status <> 'succeeded';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'analytics_report_run_not_failurable' USING ERRCODE = '55000';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_report_delivery_status(
  p_per_trigger_limit integer DEFAULT 2
)
RETURNS TABLE (
  invocation_key text,
  report_type text,
  trigger_kind text,
  window_start date,
  window_end date,
  status text,
  expected_email_count integer,
  emails_sent integer,
  emails_failed integer,
  slack_requested boolean,
  slack_sent boolean,
  error_codes text[],
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_per_trigger_limit < 1 OR p_per_trigger_limit > 10 THEN
    RAISE EXCEPTION 'analytics_report_invalid_status_limit' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      runs.*,
      row_number() OVER (
        PARTITION BY runs.trigger_kind
        ORDER BY runs.started_at DESC, runs.invocation_key DESC
      ) AS trigger_rank
    FROM public.analytics_report_runs AS runs
  )
  SELECT
    ranked.invocation_key,
    ranked.report_type,
    ranked.trigger_kind,
    ranked.window_start,
    ranked.window_end,
    ranked.status,
    ranked.expected_email_count,
    ranked.emails_sent,
    ranked.emails_failed,
    ranked.slack_requested,
    ranked.slack_sent,
    ranked.error_codes,
    ranked.started_at,
    ranked.completed_at,
    ranked.updated_at
  FROM ranked
  WHERE ranked.trigger_rank <= p_per_trigger_limit
  ORDER BY ranked.trigger_kind, ranked.started_at DESC, ranked.invocation_key DESC;
END;
$$;

REVOKE ALL ON TABLE public.analytics_report_runs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.analytics_report_recipient_deliveries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_analytics_report_run(text, text, text, date, date, interval)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_analytics_report_deliveries(uuid, uuid[], boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_analytics_report_delivery(uuid, uuid, text, interval)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_analytics_report_delivery(uuid, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_analytics_report_run(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_analytics_report_run(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_analytics_report_delivery_status(integer) FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON TABLE public.analytics_report_runs TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.analytics_report_recipient_deliveries TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_analytics_report_run(text, text, text, date, date, interval)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.prepare_analytics_report_deliveries(uuid, uuid[], boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_analytics_report_delivery(uuid, uuid, text, interval)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.record_analytics_report_delivery(uuid, uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_analytics_report_run(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_analytics_report_run(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_analytics_report_delivery_status(integer)
  TO anon, authenticated, service_role;

COMMENT ON TABLE public.analytics_report_runs IS
  'PII-free aggregate audit ledger for authenticated analytics report invocations.';
COMMENT ON TABLE public.analytics_report_recipient_deliveries IS
  'Service-only per-admin/channel delivery state; stores stable admin IDs but no recipient address or report content.';
COMMENT ON FUNCTION public.get_analytics_report_delivery_status(integer) IS
  'Read-only aggregate analytics delivery status; exposes no admin identity, content, provider response, URL, or secret.';
