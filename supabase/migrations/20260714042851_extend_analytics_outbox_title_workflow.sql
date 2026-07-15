-- Migration: 20260714042851_extend_analytics_outbox_title_workflow.sql
-- Created: 2026-07-13
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Add one controlled service-role RPC that atomically enqueues the authoritative
-- title_approved and title_published outcomes after an approved draft is durably
-- linked to its catalog title. Existing outbox rows and delivery functions are
-- unchanged.
--
-- Risk Level: LOW
-- Destructive: NO
--
-- Affected Tables:
-- - public.analytics_event_outbox (no rewrite; new rows only when RPC is called)
--
-- Backup Required: NO for local function creation. Production preflight must
-- still record outbox/title/draft counts and back up title_drafts/titles under
-- the existing publication-linkage rollout.
--
-- Rollback Procedure:
-- Revoke the new RPC and roll back approve-title before pausing the delivery
-- worker. Preserve queued/delivered rows as audit evidence. Never delete outbox
-- data during incident rollback.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Both outcomes enqueue atomically with exact allowlisted parameters
-- [x] Duplicate calls return the same two rows without extra events
-- [x] Conflicting dedupe identity fails closed
-- [x] Anon/authenticated execution remains denied

CREATE OR REPLACE FUNCTION public.enqueue_title_workflow_outcomes(
  p_draft_id uuid,
  p_title_id uuid,
  p_creator_id uuid,
  p_traffic_type text,
  p_occurred_at timestamptz
)
RETURNS TABLE (
  approved_outbox_id uuid,
  published_outbox_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  approved_key text := 'title_approved:' || p_draft_id::text;
  published_key text := 'title_published:' || p_title_id::text;
  approved_params jsonb;
  published_params jsonb;
  approved_row public.analytics_event_outbox%ROWTYPE;
  published_row public.analytics_event_outbox%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'analytics_outbox_service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_draft_id IS NULL OR p_title_id IS NULL OR p_creator_id IS NULL OR p_occurred_at IS NULL THEN
    RAISE EXCEPTION 'invalid_title_workflow_identity' USING ERRCODE = '22023';
  END IF;
  IF p_traffic_type NOT IN ('external', 'internal') THEN
    RAISE EXCEPTION 'invalid_traffic_type' USING ERRCODE = '22023';
  END IF;

  approved_params := jsonb_build_object(
    'app_section', 'creator',
    'traffic_type', p_traffic_type,
    'draft_id', p_draft_id::text
  );
  published_params := jsonb_build_object(
    'app_section', 'creator',
    'traffic_type', p_traffic_type,
    'draft_id', p_draft_id::text,
    'title_id', p_title_id::text
  );

  INSERT INTO public.analytics_event_outbox (
    dedupe_key,
    event_name,
    user_id,
    event_params,
    occurred_at
  ) VALUES (
    approved_key,
    'title_approved',
    p_creator_id,
    approved_params,
    p_occurred_at
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  SELECT * INTO approved_row
  FROM public.analytics_event_outbox
  WHERE dedupe_key = approved_key
  FOR UPDATE;

  IF approved_row.event_name <> 'title_approved'
    OR approved_row.user_id <> p_creator_id
    OR approved_row.event_params <> approved_params
    OR approved_row.occurred_at <> p_occurred_at THEN
    RAISE EXCEPTION 'title_approved_dedupe_conflict' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.analytics_event_outbox (
    dedupe_key,
    event_name,
    user_id,
    event_params,
    occurred_at
  ) VALUES (
    published_key,
    'title_published',
    p_creator_id,
    published_params,
    p_occurred_at
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  SELECT * INTO published_row
  FROM public.analytics_event_outbox
  WHERE dedupe_key = published_key
  FOR UPDATE;

  IF published_row.event_name <> 'title_published'
    OR published_row.user_id <> p_creator_id
    OR published_row.event_params <> published_params
    OR published_row.occurred_at <> p_occurred_at THEN
    RAISE EXCEPTION 'title_published_dedupe_conflict' USING ERRCODE = '23505';
  END IF;

  RETURN QUERY SELECT approved_row.id, published_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_title_workflow_outcomes(uuid, uuid, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_title_workflow_outcomes(uuid, uuid, uuid, text, timestamptz)
  TO service_role;

COMMENT ON FUNCTION public.enqueue_title_workflow_outcomes(uuid, uuid, uuid, text, timestamptz) IS
  'Atomically enqueues privacy-safe title approval/publication outcomes after durable draft-title linkage.';
