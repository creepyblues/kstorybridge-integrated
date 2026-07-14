-- Migration: 20260714001452_link_title_drafts_to_publications.sql
-- Created: 2026-07-13
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Add durable, bidirectional identifiers between an approved title draft and the
-- catalog title created from it. This enables idempotent approval recovery and
-- authoritative publication reconciliation.
--
-- Risk Level: LOW
-- Destructive: NO
--
-- Affected Tables:
-- - public.title_drafts (add nullable column, foreign key, partial unique index)
-- - public.titles (add nullable column, foreign key, partial unique index)
--
-- Backup Required: NO (additive schema only; no data rewrite)
-- Backup Created: N/A
--
-- Rollback Procedure:
-- Roll back application usage first and leave the nullable columns/indexes in
-- place. Do not drop columns in an emergency rollback. A later deprecation
-- migration may remove constraints only after a backup and observation period.
--
-- Testing:
-- [x] Applied by local `supabase db reset`
-- [ ] Approval happy path creates both links
-- [ ] Retry after title insert recovers the same catalog title
-- [x] Duplicate source draft cannot create a second catalog title
-- [ ] Production row counts verified before and after application

DO $$
DECLARE
  draft_count bigint;
  title_count bigint;
BEGIN
  SELECT count(*) INTO draft_count FROM public.title_drafts;
  SELECT count(*) INTO title_count FROM public.titles;
  RAISE NOTICE 'Pre-migration rows: title_drafts=%, titles=%', draft_count, title_count;
END $$;

ALTER TABLE public.title_drafts
  ADD COLUMN IF NOT EXISTS published_title_id uuid;

ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS source_draft_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'title_drafts_published_title_id_fkey'
      AND conrelid = 'public.title_drafts'::regclass
  ) THEN
    ALTER TABLE public.title_drafts
      ADD CONSTRAINT title_drafts_published_title_id_fkey
      FOREIGN KEY (published_title_id)
      REFERENCES public.titles(title_id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'titles_source_draft_id_fkey'
      AND conrelid = 'public.titles'::regclass
  ) THEN
    ALTER TABLE public.titles
      ADD CONSTRAINT titles_source_draft_id_fkey
      FOREIGN KEY (source_draft_id)
      REFERENCES public.title_drafts(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.title_drafts
  VALIDATE CONSTRAINT title_drafts_published_title_id_fkey;

ALTER TABLE public.titles
  VALIDATE CONSTRAINT titles_source_draft_id_fkey;

CREATE UNIQUE INDEX IF NOT EXISTS idx_title_drafts_published_title_id_unique
  ON public.title_drafts(published_title_id)
  WHERE published_title_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_titles_source_draft_id_unique
  ON public.titles(source_draft_id)
  WHERE source_draft_id IS NOT NULL;

COMMENT ON COLUMN public.title_drafts.published_title_id IS
  'Catalog title created by approval of this draft. Null for unpublished and legacy unlinked rows.';

COMMENT ON COLUMN public.titles.source_draft_id IS
  'Creator title draft that produced this catalog row. Null for legacy, imported, or manually created titles.';

DO $$
DECLARE
  draft_count bigint;
  title_count bigint;
BEGIN
  SELECT count(*) INTO draft_count FROM public.title_drafts;
  SELECT count(*) INTO title_count FROM public.titles;
  RAISE NOTICE 'Post-migration rows: title_drafts=%, titles=%', draft_count, title_count;
END $$;
