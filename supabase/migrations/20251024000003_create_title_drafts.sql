-- Migration: 20251024000003_create_title_drafts.sql
-- Created: 2025-10-24
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the title-draft creation step that previously existed only in the
-- archived dashboard migration directory. Root migrations beginning on
-- 2025-11-04 alter this table and therefore require it during a clean reset.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.title_drafts (created only when absent)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Do not drop a production table. If this migration creates an unexpected
-- table in a non-production environment, reset that disposable environment.
-- Any production rollback must be a separately reviewed deprecation migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Table, RLS, policy, indexes, and trigger verification

CREATE TABLE IF NOT EXISTS public.title_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_draft_per_creator UNIQUE (creator_id)
);

ALTER TABLE public.title_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'title_drafts'
      AND policyname = 'Creators manage their own drafts'
  ) THEN
    CREATE POLICY "Creators manage their own drafts"
      ON public.title_drafts
      FOR ALL
      TO authenticated
      USING (auth.uid() = creator_id)
      WITH CHECK (auth.uid() = creator_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_title_drafts_creator_id
  ON public.title_drafts(creator_id);

CREATE INDEX IF NOT EXISTS idx_title_drafts_last_saved
  ON public.title_drafts(last_saved_at DESC);

CREATE OR REPLACE FUNCTION public.update_title_drafts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.title_drafts'::regclass
      AND tgname = 'update_title_drafts_updated_at'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER update_title_drafts_updated_at
      BEFORE UPDATE ON public.title_drafts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_title_drafts_updated_at();
  END IF;
END
$$;

COMMENT ON TABLE public.title_drafts IS
  'Auto-saved drafts for incomplete creator title submissions.';

COMMENT ON COLUMN public.title_drafts.draft_data IS
  'JSONB containing questionnaire data from all title-submission steps.';

COMMENT ON COLUMN public.title_drafts.current_step IS
  'Current questionnaire step, from 1 through 5.';

COMMENT ON COLUMN public.title_drafts.last_saved_at IS
  'Timestamp of the most recent draft save.';
