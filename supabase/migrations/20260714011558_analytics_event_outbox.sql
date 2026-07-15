-- Migration: 20260714011558_analytics_event_outbox.sql
-- Created: 2026-07-13
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Adds a service-role-only outbox for durable, idempotent server-side analytics
-- delivery. Subscription events are enqueued through a controlled RPC so Stripe,
-- user, title, email, URL, and free-text fields cannot enter the GA payload.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables: analytics_event_outbox (new table; zero existing rows)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Stop the delivery function and leave this additive table/functions in place.
-- Do not drop them during an emergency rollback. Deprecate first and remove only
-- through a separately reviewed migration after the observation window.
--
-- Testing:
-- [x] Tested locally with `npx supabase db reset`
-- [x] Duplicate subscription enqueue returns the same row
-- [x] Concurrent claims cannot return the same row
-- [x] Anonymous/authenticated roles cannot read or invoke outbox RPCs
-- [x] Delivery retry and stale-processing recovery verified

CREATE TABLE IF NOT EXISTS public.analytics_event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  event_name text NOT NULL,
  user_id uuid NOT NULL,
  event_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_event_outbox_event_name_check
    CHECK (event_name ~ '^[a-z][a-z0-9_]{0,39}$'),
  CONSTRAINT analytics_event_outbox_params_object_check
    CHECK (jsonb_typeof(event_params) = 'object'),
  CONSTRAINT analytics_event_outbox_status_check
    CHECK (status IN ('pending', 'processing', 'failed', 'delivered')),
  CONSTRAINT analytics_event_outbox_attempt_count_check
    CHECK (attempt_count >= 0),
  CONSTRAINT analytics_event_outbox_error_code_check
    CHECK (last_error_code IS NULL OR last_error_code ~ '^[a-z0-9_]{1,64}$')
);

ALTER TABLE public.analytics_event_outbox ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS analytics_event_outbox_delivery_idx
  ON public.analytics_event_outbox (status, next_attempt_at, occurred_at)
  WHERE status IN ('pending', 'failed', 'processing');

COMMENT ON TABLE public.analytics_event_outbox IS
  'Service-role-only durable queue for privacy-safe server analytics delivery.';
COMMENT ON COLUMN public.analytics_event_outbox.dedupe_key IS
  'Stable business-outcome key; subscription_started is unique by account type and Stripe subscription ID.';
COMMENT ON COLUMN public.analytics_event_outbox.user_id IS
  'Supabase auth UUID used only as GA user_id/client_id; never an email or Stripe identifier.';
COMMENT ON COLUMN public.analytics_event_outbox.event_params IS
  'Allowlisted low-cardinality GA event parameters created by controlled enqueue RPCs.';

CREATE OR REPLACE FUNCTION public.enqueue_subscription_started(
  p_dedupe_key text,
  p_user_id uuid,
  p_account_type text,
  p_traffic_type text,
  p_plan_type text,
  p_billing_period text,
  p_currency text,
  p_value numeric,
  p_occurred_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queued_id uuid;
  normalized_currency text := upper(p_currency);
BEGIN
  IF p_dedupe_key !~ '^subscription_started:(buyer|creator):[A-Za-z0-9_]+$' THEN
    RAISE EXCEPTION 'invalid_dedupe_key';
  END IF;

  IF p_account_type NOT IN ('buyer', 'creator') THEN
    RAISE EXCEPTION 'invalid_account_type';
  END IF;

  IF p_traffic_type NOT IN ('external', 'internal') THEN
    RAISE EXCEPTION 'invalid_traffic_type';
  END IF;

  IF (p_account_type = 'buyer' AND p_plan_type NOT IN ('pro', 'suite'))
     OR (p_account_type = 'creator' AND p_plan_type NOT IN ('packaging', 'premium')) THEN
    RAISE EXCEPTION 'invalid_plan_type';
  END IF;

  IF p_billing_period NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'invalid_billing_period';
  END IF;

  IF normalized_currency !~ '^[A-Z]{3}$' OR p_value IS NULL OR p_value < 0 THEN
    RAISE EXCEPTION 'invalid_value_or_currency';
  END IF;

  INSERT INTO public.analytics_event_outbox (
    dedupe_key,
    event_name,
    user_id,
    event_params,
    occurred_at
  ) VALUES (
    p_dedupe_key,
    'subscription_started',
    p_user_id,
    jsonb_build_object(
      'account_type', p_account_type,
      'app_section', CASE WHEN p_account_type = 'buyer' THEN 'dashboard' ELSE 'creator' END,
      'traffic_type', p_traffic_type,
      'plan_type', p_plan_type,
      'billing_period', p_billing_period,
      'currency', normalized_currency,
      'value', p_value
    ),
    p_occurred_at
  )
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO queued_id;

  IF queued_id IS NULL THEN
    SELECT id INTO queued_id
    FROM public.analytics_event_outbox
    WHERE dedupe_key = p_dedupe_key;
  END IF;

  RETURN queued_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_analytics_event_outbox(p_batch_size integer DEFAULT 25)
RETURNS SETOF public.analytics_event_outbox
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claimable AS (
    SELECT id
    FROM public.analytics_event_outbox
    WHERE (
      status IN ('pending', 'failed')
      AND next_attempt_at <= now()
    ) OR (
      status = 'processing'
      AND last_attempt_at < now() - interval '15 minutes'
    )
    ORDER BY occurred_at, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_batch_size, 25), 100))
  )
  UPDATE public.analytics_event_outbox AS outbox
  SET status = 'processing',
      attempt_count = outbox.attempt_count + 1,
      last_attempt_at = now(),
      updated_at = now(),
      last_error_code = NULL
  FROM claimable
  WHERE outbox.id = claimable.id
  RETURNING outbox.*;
$$;

CREATE OR REPLACE FUNCTION public.complete_analytics_event_outbox(p_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH completed AS (
    UPDATE public.analytics_event_outbox
    SET status = 'delivered',
        delivered_at = now(),
        updated_at = now(),
        last_error_code = NULL
    WHERE id = p_id AND status = 'processing'
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM completed);
$$;

CREATE OR REPLACE FUNCTION public.retry_analytics_event_outbox(
  p_id uuid,
  p_error_code text,
  p_retry_after_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_id uuid;
BEGIN
  IF p_error_code !~ '^[a-z0-9_]{1,64}$' THEN
    RAISE EXCEPTION 'invalid_error_code';
  END IF;

  UPDATE public.analytics_event_outbox
  SET status = 'failed',
      next_attempt_at = now() + make_interval(secs => greatest(60, least(coalesce(p_retry_after_seconds, 60), 86400))),
      updated_at = now(),
      last_error_code = p_error_code
  WHERE id = p_id AND status = 'processing'
  RETURNING id INTO updated_id;

  RETURN updated_id IS NOT NULL;
END;
$$;

REVOKE ALL ON TABLE public.analytics_event_outbox FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_subscription_started(text, uuid, text, text, text, text, text, numeric, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_analytics_event_outbox(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_analytics_event_outbox(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.retry_analytics_event_outbox(uuid, text, integer) FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.analytics_event_outbox TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_subscription_started(text, uuid, text, text, text, text, text, numeric, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_analytics_event_outbox(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_analytics_event_outbox(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.retry_analytics_event_outbox(uuid, text, integer) TO service_role;
