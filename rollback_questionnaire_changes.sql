-- ============================================================================
-- EMERGENCY ROLLBACK SCRIPT
-- Title Questionnaire Feature
-- ============================================================================
-- Date: 2025-10-24
-- Purpose: Roll back all questionnaire-related database changes
-- Estimated Execution Time: < 2 minutes
--
-- ⚠️ WARNING: This script will DELETE all data in:
-- - title_platforms table
-- - title_documents table
-- - title_drafts table
-- - New columns in titles table
--
-- Use this script ONLY if dashboard breaks after migration deployment.
--
-- Verification before rollback:
-- 1. Check dashboard error logs
-- 2. Verify AI chatbot is actually broken (not just slow)
-- 3. Get approval from team lead
--
-- How to execute:
-- psql $DATABASE_URL -f /Users/sungholee/code/kstorybridge/rollback_questionnaire_changes.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop new tables (safe - no dashboard dependencies)
-- ============================================================================

DROP TABLE IF EXISTS public.title_drafts CASCADE;
DROP TABLE IF EXISTS public.title_documents CASCADE;
DROP TABLE IF EXISTS public.title_platforms CASCADE;

-- Drop associated functions
DROP FUNCTION IF EXISTS update_title_platforms_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_title_documents_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_title_drafts_updated_at() CASCADE;

RAISE NOTICE 'Dropped tables: title_platforms, title_documents, title_drafts';

-- ============================================================================
-- STEP 2: Remove Supabase Storage bucket
-- ============================================================================

DELETE FROM storage.buckets WHERE id = 'title-documents';

RAISE NOTICE 'Deleted storage bucket: title-documents';

-- ============================================================================
-- STEP 3: Remove new columns from titles table
-- ============================================================================

-- Step 1 fields
ALTER TABLE public.titles DROP COLUMN IF EXISTS is_official_english_title CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS english_title_type CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS script_title_kr CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS script_title_en CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS art_title_kr CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS art_title_en CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS underlying_novel_kr CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS underlying_novel_en CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS rights_holder_name CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS rights_holder_company CASCADE;

-- Step 2 fields
ALTER TABLE public.titles DROP COLUMN IF EXISTS inspiration CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS comparables CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS important_issues CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS setting_description CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS world_lore CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS supernatural_concepts CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS character_details CASCADE;

-- Step 3 fields
ALTER TABLE public.titles DROP COLUMN IF EXISTS story_structure CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS planned_ending CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS narrative_arc CASCADE;

-- Step 5 fields
ALTER TABLE public.titles DROP COLUMN IF EXISTS awards CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS sales_records CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS merchandise_deals CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS print_editions CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS print_edition_details CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS media_coverage CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS celebrity_endorsements CASCADE;
ALTER TABLE public.titles DROP COLUMN IF EXISTS creator_achievements CASCADE;

RAISE NOTICE 'Removed questionnaire columns from titles table';

-- ============================================================================
-- COMMIT AND VERIFY
-- ============================================================================

COMMIT;

-- ============================================================================
-- POST-ROLLBACK VERIFICATION
-- ============================================================================
-- After running this script:
-- 1. Check dashboard: https://dashboard.kstorybridge.com/buyers/home
-- 2. Test AI chatbot: Query "Find me romance fantasy titles"
-- 3. Test titles list: /buyers/titles
-- 4. Test favorites: Add/remove favorite
-- 5. Monitor error logs for 30 minutes
--
-- If dashboard still broken:
-- 1. Check Supabase logs
-- 2. Review recent deployments (Vercel)
-- 3. Consider restoring from database backup
-- ============================================================================

-- Final verification query
SELECT
  COUNT(*) as total_titles,
  COUNT(combined_embedding) as titles_with_embeddings,
  COUNT(pitch) as titles_with_pitch
FROM public.titles;
