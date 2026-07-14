-- Run after applying 20260714035054_analytics_report_delivery_audit.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/analytics_report_delivery_audit.sql

BEGIN;

TRUNCATE
  public.analytics_report_recipient_deliveries,
  public.analytics_report_runs;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '81000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'audit-one@example.invalid', '',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '81000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'audit-two@example.invalid', '',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  );

INSERT INTO public.admin (id, email, full_name, active)
VALUES
  ('81000000-0000-4000-8000-000000000001', 'audit-one@example.invalid', 'Audit One', true),
  ('81000000-0000-4000-8000-000000000002', 'audit-two@example.invalid', 'Audit Two', true);

-- Disable only the timestamp triggers so stale-reclaim timestamps can be
-- simulated without sleeping; the transaction rolls every test change back.
ALTER TABLE public.analytics_report_runs
  DISABLE TRIGGER update_analytics_report_runs_updated_at;
ALTER TABLE public.analytics_report_recipient_deliveries
  DISABLE TRIGGER update_analytics_report_deliveries_updated_at;

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);

DO $$
DECLARE
  run_id uuid;
  duplicate_id uuid;
  should_execute boolean;
  reclaimed boolean;
  expected_count integer;
  initialized boolean;
  should_send boolean;
  attempt integer;
  final_status text;
  sent_count integer;
  failed_count integer;
BEGIN
  SELECT report_run_id, claim.should_execute, claim.reclaimed
  INTO run_id, should_execute, reclaimed
  FROM public.claim_analytics_report_run(
    'weekly-funnel:2026-07-06:2026-07-12:v1',
    'funnel', 'scheduled', '2026-07-06', '2026-07-12'
  ) AS claim;
  IF NOT should_execute OR reclaimed THEN
    RAISE EXCEPTION 'first scheduled run was not a fresh executable claim';
  END IF;

  SELECT report_run_id, claim.should_execute
  INTO duplicate_id, should_execute
  FROM public.claim_analytics_report_run(
    'weekly-funnel:2026-07-06:2026-07-12:v1',
    'funnel', 'scheduled', '2026-07-06', '2026-07-12'
  ) AS claim;
  IF duplicate_id IS DISTINCT FROM run_id OR should_execute THEN
    RAISE EXCEPTION 'active duplicate scheduled run was executed';
  END IF;

  SELECT prepared.expected_email_count, prepared.already_initialized
  INTO expected_count, initialized
  FROM public.prepare_analytics_report_deliveries(
    run_id,
    ARRAY[
      '81000000-0000-4000-8000-000000000001'::uuid,
      '81000000-0000-4000-8000-000000000002'::uuid,
      '81000000-0000-4000-8000-000000000001'::uuid
    ],
    true
  ) AS prepared;
  IF expected_count <> 2 OR initialized THEN
    RAISE EXCEPTION 'recipient preparation did not dedupe the initial admin set';
  END IF;

  SELECT prepared.expected_email_count, prepared.already_initialized
  INTO expected_count, initialized
  FROM public.prepare_analytics_report_deliveries(
    run_id,
    ARRAY['81000000-0000-4000-8000-000000000001'::uuid],
    false
  ) AS prepared;
  IF expected_count <> 2 OR NOT initialized THEN
    RAISE EXCEPTION 'retry changed the original recipient snapshot';
  END IF;

  SELECT claim.should_send, claim.attempt_count
  INTO should_send, attempt
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000001', 'email'
  ) AS claim;
  IF NOT should_send OR attempt <> 1 THEN
    RAISE EXCEPTION 'first email delivery was not claimed once';
  END IF;
  PERFORM public.record_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000001', 'email', 'sent', NULL
  );

  SELECT claim.should_send INTO should_send
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000001', 'email'
  ) AS claim;
  IF should_send THEN
    RAISE EXCEPTION 'sent email was claimed twice';
  END IF;

  SELECT claim.should_send INTO should_send
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000002', 'email'
  ) AS claim;
  IF NOT should_send THEN
    RAISE EXCEPTION 'second email was not claimed';
  END IF;
  PERFORM public.record_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000002', 'email', 'failed',
    'resend_http_error'
  );

  SELECT claim.should_send INTO should_send
  FROM public.claim_analytics_report_delivery(run_id, NULL, 'slack') AS claim;
  IF NOT should_send THEN
    RAISE EXCEPTION 'Slack delivery was not claimed';
  END IF;
  PERFORM public.record_analytics_report_delivery(run_id, NULL, 'slack', 'sent', NULL);

  SELECT finalized.run_status, finalized.emails_sent, finalized.emails_failed
  INTO final_status, sent_count, failed_count
  FROM public.finalize_analytics_report_run(run_id) AS finalized;
  IF final_status <> 'partial' OR sent_count <> 1 OR failed_count <> 1 THEN
    RAISE EXCEPTION 'partial provider failure was recorded incorrectly';
  END IF;

  SELECT claim.should_execute INTO should_execute
  FROM public.claim_analytics_report_run(
    'weekly-funnel:2026-07-06:2026-07-12:v1',
    'funnel', 'scheduled', '2026-07-06', '2026-07-12'
  ) AS claim;
  IF NOT should_execute THEN
    RAISE EXCEPTION 'partial run was not retryable';
  END IF;
  PERFORM public.prepare_analytics_report_deliveries(
    run_id,
    ARRAY[
      '81000000-0000-4000-8000-000000000001'::uuid,
      '81000000-0000-4000-8000-000000000002'::uuid
    ],
    true
  );

  SELECT claim.should_send, claim.attempt_count
  INTO should_send, attempt
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000002', 'email'
  ) AS claim;
  IF NOT should_send OR attempt <> 2 THEN
    RAISE EXCEPTION 'failed email was not retried exactly once';
  END IF;
  PERFORM public.record_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000002', 'email', 'sent', NULL
  );

  SELECT finalized.run_status, finalized.emails_sent, finalized.emails_failed
  INTO final_status, sent_count, failed_count
  FROM public.finalize_analytics_report_run(run_id) AS finalized;
  IF final_status <> 'succeeded' OR sent_count <> 2 OR failed_count <> 0 THEN
    RAISE EXCEPTION 'successful retry did not finalize the run';
  END IF;

  SELECT claim.should_execute INTO should_execute
  FROM public.claim_analytics_report_run(
    'weekly-funnel:2026-07-06:2026-07-12:v1',
    'funnel', 'scheduled', '2026-07-06', '2026-07-12'
  ) AS claim;
  IF should_execute THEN
    RAISE EXCEPTION 'succeeded run was executed again';
  END IF;
END;
$$;

DO $$
DECLARE
  run_id uuid;
  should_execute boolean;
  reclaimed boolean;
  should_send boolean;
  attempt integer;
BEGIN
  SELECT report_run_id INTO run_id
  FROM public.claim_analytics_report_run(
    'manual-funnel:2026-07-13:stale-test',
    'funnel', 'manual', '2026-07-07', '2026-07-13'
  );
  UPDATE public.analytics_report_runs
  SET updated_at = now() - interval '31 minutes'
  WHERE id = run_id;

  SELECT claim.should_execute, claim.reclaimed
  INTO should_execute, reclaimed
  FROM public.claim_analytics_report_run(
    'manual-funnel:2026-07-13:stale-test',
    'funnel', 'manual', '2026-07-07', '2026-07-13'
  ) AS claim;
  IF NOT should_execute OR NOT reclaimed THEN
    RAISE EXCEPTION 'stale report generation was not reclaimed';
  END IF;

  PERFORM public.prepare_analytics_report_deliveries(
    run_id,
    ARRAY['81000000-0000-4000-8000-000000000001'::uuid],
    false
  );
  SELECT claim.should_send, claim.attempt_count
  INTO should_send, attempt
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000001', 'email'
  ) AS claim;
  UPDATE public.analytics_report_recipient_deliveries
  SET updated_at = now() - interval '16 minutes'
  WHERE report_run_id = run_id AND channel = 'email';

  SELECT claim.should_send, claim.attempt_count
  INTO should_send, attempt
  FROM public.claim_analytics_report_delivery(
    run_id, '81000000-0000-4000-8000-000000000001', 'email'
  ) AS claim;
  IF NOT should_send OR attempt <> 2 THEN
    RAISE EXCEPTION 'stale pending delivery was not reclaimed';
  END IF;

  PERFORM public.fail_analytics_report_run(run_id, 'report_delivery_request_failed');
END;
$$;

DO $$
DECLARE
  conflict_rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.claim_analytics_report_run(
      'weekly-funnel:2026-07-06:2026-07-12:v1',
      'funnel', 'manual', '2026-07-06', '2026-07-12'
    );
  EXCEPTION WHEN unique_violation THEN
    conflict_rejected := true;
  END;
  IF NOT conflict_rejected THEN
    RAISE EXCEPTION 'invocation key reuse with different identity was accepted';
  END IF;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.role', '', true);

ALTER TABLE public.analytics_report_runs
  ENABLE TRIGGER update_analytics_report_runs_updated_at;
ALTER TABLE public.analytics_report_recipient_deliveries
  ENABLE TRIGGER update_analytics_report_deliveries_updated_at;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.analytics_report_runs', 'SELECT')
    OR has_table_privilege('authenticated', 'public.analytics_report_runs', 'SELECT')
    OR has_table_privilege('anon', 'public.analytics_report_recipient_deliveries', 'SELECT')
    OR has_table_privilege('authenticated', 'public.analytics_report_recipient_deliveries', 'SELECT') THEN
    RAISE EXCEPTION 'client role can read detailed analytics delivery audit rows';
  END IF;

  IF has_function_privilege(
      'anon',
      'public.claim_analytics_report_run(text,text,text,date,date,interval)',
      'EXECUTE'
    ) OR has_function_privilege(
      'authenticated',
      'public.finalize_analytics_report_run(uuid)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'client role can mutate analytics delivery audit state';
  END IF;

  IF NOT has_function_privilege(
      'anon',
      'public.get_analytics_report_delivery_status(integer)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'safe aggregate status RPC is not readable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('analytics_report_runs', 'analytics_report_recipient_deliveries')
      AND column_name IN (
        'email', 'report_markdown', 'report_body', 'alert_text', 'provider_response',
        'provider_id', 'token', 'secret', 'webhook_url', 'raw_error'
      )
  ) THEN
    RAISE EXCEPTION 'audit schema contains a forbidden sensitive column';
  END IF;
END;
$$;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.role', 'anon', true);

DO $$
DECLARE
  scheduled_count integer;
  manual_count integer;
BEGIN
  SELECT
    count(*) FILTER (WHERE trigger_kind = 'scheduled'),
    count(*) FILTER (WHERE trigger_kind = 'manual')
  INTO scheduled_count, manual_count
  FROM public.get_analytics_report_delivery_status(2);

  IF scheduled_count <> 1 OR manual_count <> 1 THEN
    RAISE EXCEPTION 'safe status RPC did not distinguish scheduled and manual runs';
  END IF;
END;
$$;

RESET ROLE;
ROLLBACK;
