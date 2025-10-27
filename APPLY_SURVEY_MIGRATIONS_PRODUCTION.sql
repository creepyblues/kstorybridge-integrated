-- =========================================================================
-- PRODUCTION MIGRATION: Creator V2 Survey Feature
-- Date: 2025-10-25
-- Purpose: Add survey tables and questionnaire fields for title submissions
-- =========================================================================
--
-- IMPORTANT: Run this script in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql/new
--
-- This script creates:
-- 1. title_platforms table (multi-platform support)
-- 2. title_documents table (file uploads)
-- 3. title_drafts table (auto-save functionality)
-- 4. 30+ new columns in titles table (all NULLABLE for backward compatibility)
--
-- =========================================================================

-- -------------------------------------------------------------------------
-- MIGRATION 1: Create title_platforms table
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.title_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL CHECK (platform_name IN (
    'naver', 'kakao', 'lezhin', 'ridibooks', 'toomics', 'bomtoon',
    'ktoon', 'kakaopage', 'munpia', 'joara', 'novelpia', 'other'
  )),
  platform_url TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  subscribers BIGINT DEFAULT 0,
  other_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT title_platforms_title_id_platform_name_unique UNIQUE(title_id, platform_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_title_platforms_title_id ON public.title_platforms(title_id);
CREATE INDEX IF NOT EXISTS idx_title_platforms_platform_name ON public.title_platforms(platform_name);

-- Enable Row Level Security
ALTER TABLE public.title_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can manage platforms for their titles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'title_platforms'
    AND policyname = 'Creators manage platforms for their titles'
  ) THEN
    CREATE POLICY "Creators manage platforms for their titles"
    ON public.title_platforms FOR ALL
    TO authenticated
    USING (
      title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
    )
    WITH CHECK (
      title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
    );
  END IF;
END $$;

-- RLS Policy: All authenticated users can view platforms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'title_platforms'
    AND policyname = 'All users can view platforms'
  ) THEN
    CREATE POLICY "All users can view platforms"
    ON public.title_platforms FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_title_platforms_updated_at ON public.title_platforms;
CREATE TRIGGER update_title_platforms_updated_at
    BEFORE UPDATE ON public.title_platforms
    FOR EACH ROW
    EXECUTE FUNCTION update_title_platforms_updated_at();

-- Add table comments
COMMENT ON TABLE public.title_platforms IS 'Multiple platform URLs and metrics per title for questionnaire data';
COMMENT ON COLUMN public.title_platforms.platform_name IS 'Platform identifier (naver, kakao, etc.)';
COMMENT ON COLUMN public.title_platforms.other_metrics IS 'JSONB for additional platform-specific metrics';

-- -------------------------------------------------------------------------
-- MIGRATION 2: Create title_documents table
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.title_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'source_pdf', 'story_bible', 'outline', 'script',
    'press_release', 'interview', 'review', 'wiki', 'other'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  shareable_with_nda BOOLEAN DEFAULT FALSE,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_title_documents_title_id ON public.title_documents(title_id);
CREATE INDEX IF NOT EXISTS idx_title_documents_document_type ON public.title_documents(document_type);

-- Enable RLS
ALTER TABLE public.title_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators manage documents for their titles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'title_documents'
    AND policyname = 'Creators manage documents for their titles'
  ) THEN
    CREATE POLICY "Creators manage documents for their titles"
    ON public.title_documents FOR ALL
    TO authenticated
    USING (
      title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
    )
    WITH CHECK (
      title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
    );
  END IF;
END $$;

-- RLS Policy: All users can view documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'title_documents'
    AND policyname = 'All users can view documents'
  ) THEN
    CREATE POLICY "All users can view documents"
    ON public.title_documents FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_title_documents_updated_at ON public.title_documents;
CREATE TRIGGER update_title_documents_updated_at
    BEFORE UPDATE ON public.title_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_title_documents_updated_at();

-- Add comments
COMMENT ON TABLE public.title_documents IS 'Document metadata for title materials (PDFs, links, etc.)';
COMMENT ON COLUMN public.title_documents.shareable_with_nda IS 'Whether buyers can view this document (after NDA)';

-- Storage bucket creation (NOTE: This must be done via Supabase Dashboard)
-- Bucket name: title-documents
-- Max file size: 10MB
-- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain

-- -------------------------------------------------------------------------
-- MIGRATION 3: Create title_drafts table
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.title_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_draft_per_creator UNIQUE(creator_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_title_drafts_creator_id ON public.title_drafts(creator_id);

-- Enable RLS
ALTER TABLE public.title_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators manage their own drafts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'title_drafts'
    AND policyname = 'Creators manage their own drafts'
  ) THEN
    CREATE POLICY "Creators manage their own drafts"
    ON public.title_drafts FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_title_drafts_updated_at ON public.title_drafts;
CREATE TRIGGER update_title_drafts_updated_at
    BEFORE UPDATE ON public.title_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_title_drafts_updated_at();

-- Add comments
COMMENT ON TABLE public.title_drafts IS 'Auto-saved drafts for incomplete title submissions';
COMMENT ON COLUMN public.title_drafts.current_step IS 'Current step in 5-step survey (1-5)';
COMMENT ON COLUMN public.title_drafts.draft_data IS 'JSONB containing all form data from survey';

-- -------------------------------------------------------------------------
-- MIGRATION 4: Add questionnaire fields to titles table
-- -------------------------------------------------------------------------

-- Step 1: English title classification
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS is_official_english_title BOOLEAN DEFAULT NULL;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS english_title_type TEXT CHECK (english_title_type IN ('official', 'translation'));

-- Step 1: Hangul titles (Korean script + English)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_en TEXT;

-- Step 1: Rights holder information
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_name TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_company TEXT;

-- Step 2: Story details
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS inspiration TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS important_issues TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS setting_description TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS world_lore TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS supernatural_concepts TEXT;

-- Step 2: Character details (JSONB for structured data)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS character_details JSONB DEFAULT '[]'::jsonb;

-- Step 3: Narrative structure
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS story_structure TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS planned_ending TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS narrative_arc TEXT;

-- Step 5: Title achievements
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS awards TEXT[];
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS sales_records TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS merchandise_deals TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_editions BOOLEAN DEFAULT FALSE;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_edition_details TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS media_coverage TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS celebrity_endorsements TEXT;

-- Step 5: Creator achievements (JSONB for structured data)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS creator_achievements JSONB DEFAULT '{}'::jsonb;

-- Add column comments
COMMENT ON COLUMN public.titles.is_official_english_title IS 'Whether the English title is official or a translation';
COMMENT ON COLUMN public.titles.character_details IS 'JSONB array of character objects with demographics and backgrounds';
COMMENT ON COLUMN public.titles.story_structure IS 'Beginning/Middle/End narrative structure (REQUIRED in survey)';
COMMENT ON COLUMN public.titles.creator_achievements IS 'JSONB object containing total_titles, total_views, notable_works, etc.';

-- =========================================================================
-- MIGRATION COMPLETE
-- =========================================================================

-- Verify new tables created
SELECT
  'title_platforms' AS table_name,
  COUNT(*) AS row_count
FROM public.title_platforms
UNION ALL
SELECT
  'title_documents' AS table_name,
  COUNT(*) AS row_count
FROM public.title_documents
UNION ALL
SELECT
  'title_drafts' AS table_name,
  COUNT(*) AS row_count
FROM public.title_drafts;

-- Verify new columns added to titles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'titles'
AND column_name IN (
  'is_official_english_title',
  'character_details',
  'story_structure',
  'creator_achievements'
)
ORDER BY column_name;

-- Success message
SELECT 'SUCCESS: Survey feature migrations applied to production!' AS status;
