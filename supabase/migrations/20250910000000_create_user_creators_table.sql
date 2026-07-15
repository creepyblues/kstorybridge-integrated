-- Migration: 20250910000000_create_user_creators_table.sql
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the canonical creator profile table used by all current apps. The
-- original root history creates the retired `user_ipowners` table, while the
-- later app-specific histories and production schema moved to `user_creators`.
-- The retired table is preserved; no data is renamed, copied, or removed.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.user_creators (created only when absent)
-- - public.user_buyers (additive tier column only when absent)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Keep additive objects. Any retirement of `user_ipowners` or `user_creators`
-- requires a separately reviewed, backup-first data migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Verify creator self-select/update and later OAuth-compatible insert policy
-- [x] Verify later newsletter-consent migration applies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'user_tier'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');
  END IF;
END
$$;

ALTER TYPE public.ip_owner_role ADD VALUE IF NOT EXISTS 'agent';

ALTER TABLE public.user_buyers
  ADD COLUMN IF NOT EXISTS tier public.user_tier NOT NULL DEFAULT 'basic';

CREATE TABLE IF NOT EXISTS public.user_creators (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  pen_name text,
  ip_owner_role public.ip_owner_role NOT NULL,
  ip_owner_company text,
  website_url text,
  invitation_status text NOT NULL DEFAULT 'invited'
    CHECK (invitation_status IN ('invited', 'active', 'pending')),
  tier public.user_tier NOT NULL DEFAULT 'basic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_creators ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_creators'
      AND policyname = 'Creators can view their own profile'
  ) THEN
    CREATE POLICY "Creators can view their own profile"
      ON public.user_creators
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_creators'
      AND policyname = 'Creators can update their own profile'
  ) THEN
    CREATE POLICY "Creators can update their own profile"
      ON public.user_creators
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

END
$$;

CREATE INDEX IF NOT EXISTS idx_user_creators_email
  ON public.user_creators(email);

CREATE INDEX IF NOT EXISTS idx_user_creators_invitation_status
  ON public.user_creators(invitation_status);

CREATE INDEX IF NOT EXISTS idx_user_creators_tier
  ON public.user_creators(tier);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.user_creators'::regclass
      AND tgname = 'update_user_creators_updated_at'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER update_user_creators_updated_at
      BEFORE UPDATE ON public.user_creators
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
