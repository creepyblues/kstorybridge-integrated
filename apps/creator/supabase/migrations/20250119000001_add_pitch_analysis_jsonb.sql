-- Migration: Add pitch_analysis JSONB column for full GPT extraction storage
-- Date: 2025-01-19
-- Purpose: Store complete pitch deck analysis from GPT-4o (preserves 100% of extracted data)
-- Status: PRODUCTION READY
-- Backward Compatible: YES
-- Depends On: 20250119000000_add_pitch_extraction_v2_fields.sql

-- Add JSONB column for full pitch analysis
ALTER TABLE title_content_analysis
  ADD COLUMN IF NOT EXISTS pitch_analysis JSONB DEFAULT '{}';

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_title_content_analysis_pitch_analysis
  ON title_content_analysis USING GIN(pitch_analysis);

-- Add column comment for documentation
COMMENT ON COLUMN title_content_analysis.pitch_analysis IS 'Complete GPT-4 pitch deck analysis JSON (v2.0 comprehensive extraction) - stores all 14 categories: story_world, characters, themes_and_tone, story_elements, market_positioning, production_details, source_material, korean_cultural_elements, ip_value, creative_team, rights_availability, content_classification, additional_highlights';

-- Migration Notes:
-- - All existing rows will have pitch_analysis = '{}' (empty JSON object)
-- - No data loss - all existing columns (mood_analysis, semantic_tags, etc.) remain unchanged
-- - Edge function extract-pitch-test will populate this field going forward
-- - 100% backward compatible with v1.0 extractions (they keep empty '{}')
-- - GIN index enables efficient JSONB queries like: pitch_analysis->'characters', pitch_analysis @> '{"ip_value": {"franchise_potential": "high"}}'
-- - Existing services (vectorSearchService, embeddingService, metadataExtractionService) continue working unchanged
-- - Data duplication acceptable: mapped fields (mood_analysis) + full JSON (pitch_analysis) for flexibility
