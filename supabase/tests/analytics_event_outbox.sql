-- Run after applying 20260714011558_analytics_event_outbox.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/analytics_event_outbox.sql

BEGIN;

TRUNCATE public.analytics_event_outbox;

DO $$
DECLARE
  first_id uuid;
  duplicate_id uuid;
  claimed_id uuid;
  second_claim_count integer;
  completed boolean;
  params jsonb;
BEGIN
  first_id := public.enqueue_subscription_started(
    'subscription_started:buyer:sub_testbuyer',
    '11111111-1111-4111-8111-111111111111',
    'buyer', 'external', 'pro', 'monthly', 'usd', 250, now()
  );
  duplicate_id := public.enqueue_subscription_started(
    'subscription_started:buyer:sub_testbuyer',
    '11111111-1111-4111-8111-111111111111',
    'buyer', 'external', 'pro', 'monthly', 'usd', 250, now()
  );

  IF first_id IS DISTINCT FROM duplicate_id THEN
    RAISE EXCEPTION 'duplicate enqueue returned a different id';
  END IF;
  IF (SELECT count(*) FROM public.analytics_event_outbox) <> 1 THEN
    RAISE EXCEPTION 'duplicate enqueue created more than one row';
  END IF;

  SELECT event_params INTO params
  FROM public.analytics_event_outbox
  WHERE id = first_id;
  IF params <> '{"account_type":"buyer","app_section":"dashboard","traffic_type":"external","plan_type":"pro","billing_period":"monthly","currency":"USD","value":250}'::jsonb THEN
    RAISE EXCEPTION 'unexpected controlled event params: %', params;
  END IF;

  SELECT id INTO claimed_id FROM public.claim_analytics_event_outbox(1);
  IF claimed_id IS DISTINCT FROM first_id THEN
    RAISE EXCEPTION 'claim did not return the queued row';
  END IF;
  SELECT count(*) INTO second_claim_count
  FROM public.claim_analytics_event_outbox(1);
  IF second_claim_count <> 0 THEN
    RAISE EXCEPTION 'processing row was claimed twice';
  END IF;

  completed := public.complete_analytics_event_outbox(first_id);
  IF completed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'completion failed';
  END IF;
END $$;

DO $$
DECLARE
  queued_id uuid;
  claimed_id uuid;
  reclaimed_id uuid;
  retried boolean;
BEGIN
  queued_id := public.enqueue_subscription_started(
    'subscription_started:creator:sub_testcreator',
    '22222222-2222-4222-8222-222222222222',
    'creator', 'internal', 'premium', 'yearly', 'krw', 400000, now()
  );
  SELECT id INTO claimed_id FROM public.claim_analytics_event_outbox(1);
  IF claimed_id IS DISTINCT FROM queued_id THEN
    RAISE EXCEPTION 'creator claim failed';
  END IF;

  retried := public.retry_analytics_event_outbox(queued_id, 'ga_http_503', 60);
  IF retried IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'retry scheduling failed';
  END IF;

  UPDATE public.analytics_event_outbox
  SET status = 'processing', last_attempt_at = now() - interval '16 minutes'
  WHERE id = queued_id;
  SELECT id INTO reclaimed_id FROM public.claim_analytics_event_outbox(1);
  IF reclaimed_id IS DISTINCT FROM queued_id THEN
    RAISE EXCEPTION 'stale processing recovery failed';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM public.enqueue_subscription_started(
      'subscription_started:buyer:sub_invalid',
      '33333333-3333-4333-8333-333333333333',
      'buyer', 'external', 'premium', 'monthly', 'USD', 1, now()
    );
    RAISE EXCEPTION 'invalid buyer plan was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'invalid buyer plan was accepted' THEN
      RAISE;
    END IF;
  END;

  IF has_table_privilege('anon', 'public.analytics_event_outbox', 'SELECT')
     OR has_table_privilege('authenticated', 'public.analytics_event_outbox', 'SELECT') THEN
    RAISE EXCEPTION 'client role can read the analytics outbox';
  END IF;
  IF has_function_privilege(
       'authenticated',
       'public.claim_analytics_event_outbox(integer)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'authenticated role can claim analytics rows';
  END IF;
END $$;

ROLLBACK;
