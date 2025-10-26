-- Migration: Add questionnaire fields to titles table
-- Date: 2025-10-24
-- Status: IN_PROGRESS
-- Description: Add new fields to titles table for 5-step questionnaire data
--
-- ⚠️ CRITICAL: All fields are NULLABLE to ensure backward compatibility
-- Dashboard queries using SELECT * will ignore these new fields
-- Existing titles will have NULL values for these fields
--
-- Risk Assessment: ✅ LOW
-- - No data type changes to existing fields
-- - No DROP operations
-- - All new fields are optional (NULL allowed)

BEGIN;

-- ==============================================================================
-- STEP 1 FIELDS: Basic Information
-- ==============================================================================

-- Title type classification
ALTER TABLE public.titles
ADD COLUMN IF NOT EXISTS is_official_english_title BOOLEAN DEFAULT NULL;

ALTER TABLE public.titles
ADD COLUMN IF NOT EXISTS english_title_type TEXT
CHECK (english_title_type IN ('official', 'translation', NULL));

-- Hangul titles (separate from existing title_name_kr for granular control)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_en TEXT;

-- Rights holder (separate from existing 'rights' field which is freeform text)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_name TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_company TEXT;

-- ==============================================================================
-- STEP 2 FIELDS: Story Details
-- ==============================================================================

ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS inspiration TEXT;

-- Comparables (distinct from existing 'comps' field)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS comparables TEXT[];

ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS important_issues TEXT;

-- Setting description (REQUIRED in UI, but NULL in DB for flexibility)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS setting_description TEXT;

ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS world_lore TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS supernatural_concepts TEXT;

-- Character details (REQUIRED in UI) - JSONB array of character objects
-- Structure: [{name, age, gender, sexuality, ethnicity, background, traits, arc}, ...]
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS character_details JSONB DEFAULT '[]'::jsonb;

-- ==============================================================================
-- STEP 3 FIELDS: Narrative Structure
-- ==============================================================================

-- Beginning/middle/end summary (REQUIRED in UI)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS story_structure TEXT;

-- Planned ending for ongoing titles (REQUIRED in UI if completed=false)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS planned_ending TEXT;

ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS narrative_arc TEXT;

-- ==============================================================================
-- STEP 4 FIELDS: Existing Materials (stored in title_documents table)
-- ==============================================================================
-- No additional fields needed - documents stored in separate table

-- ==============================================================================
-- STEP 5 FIELDS: Content & Creator Profile
-- ==============================================================================

ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS awards TEXT[];
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS sales_records TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS merchandise_deals TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_editions BOOLEAN DEFAULT FALSE;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_edition_details TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS media_coverage TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS celebrity_endorsements TEXT;

-- Creator achievements (JSONB for flexibility)
-- Structure: {awards: [], sales_records: [], other_titles: [], etc.}
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS creator_achievements JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- ADD COLUMN COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON COLUMN public.titles.is_official_english_title IS
  'Whether English title is official (true) or direct translation (false)';

COMMENT ON COLUMN public.titles.english_title_type IS
  'Type of English title: official | translation';

COMMENT ON COLUMN public.titles.script_title_kr IS
  'Hangul script/webtoon title (questionnaire Step 1)';

COMMENT ON COLUMN public.titles.art_title_kr IS
  'Hangul art title if different from script (questionnaire Step 1)';

COMMENT ON COLUMN public.titles.underlying_novel_kr IS
  'Hangul underlying novel title if adapted (questionnaire Step 1)';

COMMENT ON COLUMN public.titles.rights_holder_name IS
  'Name of rights holder (individual or company)';

COMMENT ON COLUMN public.titles.comparables IS
  'Array of comparable titles (distinct from comps field)';

COMMENT ON COLUMN public.titles.setting_description IS
  'Setting description: time, place, key locations (REQUIRED in UI - Step 2)';

COMMENT ON COLUMN public.titles.world_lore IS
  'World lore and rules: magic systems, supernatural forces, sci-fi concepts';

COMMENT ON COLUMN public.titles.character_details IS
  'JSONB array of character objects: [{name, age, gender, sexuality, ethnicity, background, traits, arc}, ...] (REQUIRED in UI - Step 2)';

COMMENT ON COLUMN public.titles.story_structure IS
  'Beginning/middle/end narrative summary (REQUIRED in UI - Step 3)';

COMMENT ON COLUMN public.titles.planned_ending IS
  'Planned ending for ongoing titles (REQUIRED in UI if completed=false - Step 3)';

COMMENT ON COLUMN public.titles.awards IS
  'Array of awards received (Step 5)';

COMMENT ON COLUMN public.titles.print_editions IS
  'Whether title has print editions (Step 5)';

COMMENT ON COLUMN public.titles.creator_achievements IS
  'JSONB object for creator achievements across all their works (Step 5)';

COMMIT;

-- ==============================================================================
-- VERIFICATION NOTES
-- ==============================================================================
-- After applying this migration:
-- 1. Existing dashboard queries (SELECT *) will return NULL for new fields
-- 2. Vector search (combined_embedding) is NOT affected
-- 3. Existing fields (title_name_en, genre, keywords, etc.) are UNCHANGED
-- 4. TypeScript types will auto-regenerate to include new nullable fields
-- 5. No breaking changes to dashboard app expected
