-- Run after applying 20260714042851_extend_analytics_outbox_title_workflow.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/analytics_title_workflow_outbox.sql

BEGIN;

TRUNCATE public.analytics_event_outbox;

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);

DO $$
DECLARE
  draft_id constant uuid := '82000000-0000-4000-8000-000000000001';
  title_id constant uuid := '82000000-0000-4000-8000-000000000002';
  creator_id constant uuid := '82000000-0000-4000-8000-000000000003';
  expected_occurred_at constant timestamptz := '2026-07-13T20:00:00Z';
  approved_id uuid;
  published_id uuid;
  duplicate_approved_id uuid;
  duplicate_published_id uuid;
  conflict_rejected boolean := false;
BEGIN
  SELECT approved_outbox_id, published_outbox_id
  INTO approved_id, published_id
  FROM public.enqueue_title_workflow_outcomes(
    draft_id, title_id, creator_id, 'external', expected_occurred_at
  );

  IF approved_id IS NULL OR published_id IS NULL OR approved_id = published_id THEN
    RAISE EXCEPTION 'title workflow outcomes did not create two distinct rows';
  END IF;
  IF (SELECT count(*) FROM public.analytics_event_outbox) <> 2 THEN
    RAISE EXCEPTION 'title workflow enqueue did not create exactly two rows';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.analytics_event_outbox AS outbox
    WHERE outbox.id = approved_id
      AND dedupe_key = 'title_approved:' || draft_id::text
      AND event_name = 'title_approved'
      AND user_id = creator_id
      AND outbox.occurred_at = expected_occurred_at
      AND event_params = jsonb_build_object(
        'app_section', 'creator',
        'traffic_type', 'external',
        'draft_id', draft_id::text
      )
  ) THEN
    RAISE EXCEPTION 'title_approved payload is not the exact allowlisted shape';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.analytics_event_outbox AS outbox
    WHERE outbox.id = published_id
      AND dedupe_key = 'title_published:' || title_id::text
      AND event_name = 'title_published'
      AND user_id = creator_id
      AND outbox.occurred_at = expected_occurred_at
      AND event_params = jsonb_build_object(
        'app_section', 'creator',
        'traffic_type', 'external',
        'draft_id', draft_id::text,
        'title_id', title_id::text
      )
  ) THEN
    RAISE EXCEPTION 'title_published payload is not the exact allowlisted shape';
  END IF;

  SELECT approved_outbox_id, published_outbox_id
  INTO duplicate_approved_id, duplicate_published_id
  FROM public.enqueue_title_workflow_outcomes(
    draft_id, title_id, creator_id, 'external', expected_occurred_at
  );
  IF duplicate_approved_id IS DISTINCT FROM approved_id
    OR duplicate_published_id IS DISTINCT FROM published_id
    OR (SELECT count(*) FROM public.analytics_event_outbox) <> 2 THEN
    RAISE EXCEPTION 'duplicate title workflow enqueue created different rows';
  END IF;

  BEGIN
    PERFORM public.enqueue_title_workflow_outcomes(
      draft_id,
      title_id,
      '82000000-0000-4000-8000-000000000099',
      'external',
      expected_occurred_at
    );
  EXCEPTION WHEN unique_violation THEN
    conflict_rejected := true;
  END;
  IF NOT conflict_rejected THEN
    RAISE EXCEPTION 'conflicting creator identity reused an outcome key';
  END IF;
END;
$$;

DO $$
DECLARE
  draft_id constant uuid := '83000000-0000-4000-8000-000000000001';
  title_id constant uuid := '83000000-0000-4000-8000-000000000002';
  creator_id constant uuid := '83000000-0000-4000-8000-000000000003';
  conflict_rejected boolean := false;
BEGIN
  INSERT INTO public.analytics_event_outbox (
    dedupe_key, event_name, user_id, event_params, occurred_at
  ) VALUES (
    'title_published:' || title_id::text,
    'title_published',
    creator_id,
    jsonb_build_object(
      'app_section', 'creator',
      'traffic_type', 'internal',
      'draft_id', draft_id::text,
      'title_id', title_id::text
    ),
    '2026-07-13T19:00:00Z'
  );

  BEGIN
    PERFORM public.enqueue_title_workflow_outcomes(
      draft_id, title_id, creator_id, 'external', '2026-07-13T20:00:00Z'
    );
  EXCEPTION WHEN unique_violation THEN
    conflict_rejected := true;
  END;
  IF NOT conflict_rejected THEN
    RAISE EXCEPTION 'conflicting publication row did not fail closed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.analytics_event_outbox
    WHERE dedupe_key = 'title_approved:' || draft_id::text
  ) THEN
    RAISE EXCEPTION 'approved row survived a failed atomic publication enqueue';
  END IF;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.role', '', true);

DO $$
BEGIN
  IF has_function_privilege(
      'anon',
      'public.enqueue_title_workflow_outcomes(uuid,uuid,uuid,text,timestamptz)',
      'EXECUTE'
    ) OR has_function_privilege(
      'authenticated',
      'public.enqueue_title_workflow_outcomes(uuid,uuid,uuid,text,timestamptz)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'client role can enqueue title workflow outcomes';
  END IF;
END;
$$;

ROLLBACK;
