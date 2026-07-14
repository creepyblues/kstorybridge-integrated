-- Migration: 20250918000000_create_featured_table.sql
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the featured-title table that previously existed only in archived
-- app migration histories. The root featured-sections migration extends it.
-- No sample or placeholder title rows are inserted.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.featured (created only when absent)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Keep the table. Any deprecation requires a separate backup-first migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Verify foreign key, RLS, policies, indexes, and timestamp trigger

CREATE TABLE IF NOT EXISTS public.featured (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'featured'
      AND policyname = 'All users can view featured titles'
  ) THEN
    CREATE POLICY "All users can view featured titles"
      ON public.featured
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'featured'
      AND policyname = 'Active admins can manage featured titles'
  ) THEN
    CREATE POLICY "Active admins can manage featured titles"
      ON public.featured
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin
          WHERE admin.id = auth.uid()
            AND admin.active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin
          WHERE admin.id = auth.uid()
            AND admin.active = true
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_featured_created_at
  ON public.featured(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_featured_title_id
  ON public.featured(title_id);

CREATE OR REPLACE FUNCTION public.update_featured_updated_at()
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
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.featured'::regclass
      AND tgname = 'trigger_update_featured_updated_at'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER trigger_update_featured_updated_at
      BEFORE UPDATE ON public.featured
      FOR EACH ROW
      EXECUTE FUNCTION public.update_featured_updated_at();
  END IF;
END
$$;
