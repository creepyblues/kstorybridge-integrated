-- Migration: 20251024000004_add_questionnaire_fields_to_titles.sql
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the additive creator-questionnaire columns previously held only in
-- the archived dashboard migration tree, plus the localized/current fields
-- written by the production `approve-title` function. All fields are nullable
-- for backward compatibility with legacy and imported catalog rows.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.titles (nullable additive columns only)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Leave additive columns in place. Any removal requires a separate usage audit
-- and backup-first migration after an observation period.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Insert the complete `approve-title` title payload shape
-- [x] Verify existing rows remain valid with nullable fields

ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS is_official_english_title boolean,
  ADD COLUMN IF NOT EXISTS english_title_type text
    CHECK (english_title_type IS NULL OR english_title_type IN ('official', 'translation')),
  ADD COLUMN IF NOT EXISTS tagline_kr text,
  ADD COLUMN IF NOT EXISTS genre_kr text[],
  ADD COLUMN IF NOT EXISTS story_author_kr text,
  ADD COLUMN IF NOT EXISTS art_author_kr text,
  ADD COLUMN IF NOT EXISTS original_author text,
  ADD COLUMN IF NOT EXISTS original_author_kr text,
  ADD COLUMN IF NOT EXISTS script_title_kr text,
  ADD COLUMN IF NOT EXISTS script_title_en text,
  ADD COLUMN IF NOT EXISTS art_title_kr text,
  ADD COLUMN IF NOT EXISTS art_title_en text,
  ADD COLUMN IF NOT EXISTS underlying_novel_kr text,
  ADD COLUMN IF NOT EXISTS underlying_novel_en text,
  ADD COLUMN IF NOT EXISTS inspiration text,
  ADD COLUMN IF NOT EXISTS important_issues text,
  ADD COLUMN IF NOT EXISTS setting_description text,
  ADD COLUMN IF NOT EXISTS world_lore text,
  ADD COLUMN IF NOT EXISTS supernatural_concepts text,
  ADD COLUMN IF NOT EXISTS character_details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS story_structure text,
  ADD COLUMN IF NOT EXISTS planned_ending text,
  ADD COLUMN IF NOT EXISTS narrative_arc text,
  ADD COLUMN IF NOT EXISTS rights_holder_name text,
  ADD COLUMN IF NOT EXISTS rights_holder_company text,
  ADD COLUMN IF NOT EXISTS cp text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS awards text[],
  ADD COLUMN IF NOT EXISTS sales_records text,
  ADD COLUMN IF NOT EXISTS merchandise_deals text,
  ADD COLUMN IF NOT EXISTS print_editions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS print_edition_details text,
  ADD COLUMN IF NOT EXISTS media_coverage text,
  ADD COLUMN IF NOT EXISTS celebrity_endorsements text,
  ADD COLUMN IF NOT EXISTS creator_achievements jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS note_kr text;

COMMENT ON COLUMN public.titles.character_details IS
  'Structured questionnaire character details.';

COMMENT ON COLUMN public.titles.creator_achievements IS
  'Structured creator achievements supplied during title submission.';
