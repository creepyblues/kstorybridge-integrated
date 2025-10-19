-- Migration: Add Pitch Deck Extraction v2.0 Fields
-- Date: 2025-01-19
-- Purpose: Add 5 missing columns to support enhanced pitch deck extraction
-- Status: PRODUCTION READY
-- Backward Compatible: YES

-- Add missing fields for pitch deck extraction v2.0
-- These fields support enhanced extraction quality tracking and metadata

ALTER TABLE title_content_analysis
  ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analysis_version TEXT,
  ADD COLUMN IF NOT EXISTS processed_by TEXT,
  ADD COLUMN IF NOT EXISTS processing_confidence DECIMAL(3,2) CHECK (processing_confidence >= 0.0 AND processing_confidence <= 1.0),
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_processing_confidence
  ON title_content_analysis(processing_confidence);

CREATE INDEX IF NOT EXISTS idx_title_content_analysis_analysis_version
  ON title_content_analysis(analysis_version);

-- Add comments for documentation
COMMENT ON COLUMN title_content_analysis.accessibility_features IS 'Accessibility features mentioned in content (captions, audio description, etc.)';
COMMENT ON COLUMN title_content_analysis.analysis_version IS 'Version of extraction system used (1.0, 2.0, etc.)';
COMMENT ON COLUMN title_content_analysis.processed_by IS 'AI model or system that processed the content (e.g., openai-gpt-4o)';
COMMENT ON COLUMN title_content_analysis.processing_confidence IS 'Quality confidence score from 0-1 based on extraction completeness';
COMMENT ON COLUMN title_content_analysis.reading_time_minutes IS 'Estimated reading time in minutes (null for pitch decks)';

-- Migration Notes:
-- - All columns are nullable or have default values (backward compatible)
-- - Existing rows will have NULL or '{}' values for new columns
-- - Edge function extract-pitch-test now works without errors
-- - No changes required to RLS policies or triggers
