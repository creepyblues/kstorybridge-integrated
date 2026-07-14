-- Migration: 20250801120000_create_admin_table.sql
-- Created: 2025-08-01
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the canonical admin-table creation step that previously existed only
-- in the archived dashboard migration directory. Later root migrations and
-- Edge Functions depend on this table, so a clean root reset must create it.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.admin (created only when absent)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Do not drop a production table. If this migration creates an unexpected
-- table in a non-production environment, reset that disposable environment.
-- Any production rollback must be a separately reviewed deprecation migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Table, RLS, policy, index, and trigger verification

CREATE TABLE IF NOT EXISTS public.admin (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin'
      AND policyname = 'Admins can view admin records'
  ) THEN
    CREATE POLICY "Admins can view admin records"
      ON public.admin
      FOR SELECT
      TO authenticated
      USING (id = auth.uid() AND active = true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_admin_email
  ON public.admin(email);

CREATE INDEX IF NOT EXISTS idx_admin_active
  ON public.admin(active);

CREATE INDEX IF NOT EXISTS idx_admin_created_at
  ON public.admin(created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin'
      AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.admin'::regclass
      AND tgname = 'update_admin_updated_at'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER update_admin_updated_at
      BEFORE UPDATE ON public.admin
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

COMMENT ON TABLE public.admin IS
  'Administrative users linked to Supabase Auth; active rows receive administrative access.';
