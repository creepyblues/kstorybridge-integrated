-- Migration: 20250806000001_restore_titles_metadata_foundation.sql
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore non-sensitive title metadata that existed in the production schema
-- before the app-specific migration trees were consolidated. Later root
-- migrations and the public_titles view reference these columns.
--
-- Risk Level: MEDIUM
-- Destructive: NO
-- Affected Tables:
-- - public.titles (additive columns; legacy enum genre is preserved on upgrade)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Keep additive columns. If the genre compatibility path runs, `genre_legacy`
-- retains the original value and supports a separately reviewed reverse rename.
-- Never remove either column without a backup-first migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Verify canonical `genre` is text[] and `genre_legacy` preserves old data
-- [x] Verify public_titles can be created by the later migration

DO $$
DECLARE
  genre_udt text;
  title_count bigint;
BEGIN
  SELECT c.udt_name
  INTO genre_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'titles'
    AND c.column_name = 'genre';

  IF genre_udt IS NOT NULL AND genre_udt <> '_text' THEN
    SELECT count(*) INTO title_count FROM public.titles;

    IF title_count > 0 THEN
      RAISE EXCEPTION
        'legacy_genre_requires_backup_first_migration: % title rows use %',
        title_count,
        genre_udt;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'titles'
        AND column_name = 'genre_legacy'
    ) THEN
      ALTER TABLE public.titles RENAME COLUMN genre TO genre_legacy;
    END IF;

    ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS genre text[];
  ELSIF genre_udt IS NULL THEN
    ALTER TABLE public.titles ADD COLUMN genre text[];
  END IF;
END
$$;

ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS comps text[],
  ADD COLUMN IF NOT EXISTS chapters integer,
  ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS story_author text,
  ADD COLUMN IF NOT EXISTS art_author text,
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS age_rating text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS description_kr text,
  ADD COLUMN IF NOT EXISTS perfect_for text,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_titles_genre_array
  ON public.titles USING gin(genre);

COMMENT ON COLUMN public.titles.genre IS
  'Canonical genre tags stored as a text array.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'titles'
      AND column_name = 'genre_legacy'
  ) THEN
    COMMENT ON COLUMN public.titles.genre_legacy IS
      'Preserved pre-consolidation genre enum value; do not use for current writes.';
  END IF;
END
$$;
