-- Add JSONB column to store full AI-generated comps analysis
-- Structure: SuggestedComp[] with match scores, dimension scores, and explanations
-- See: apps/dashboard/docs/COMPS_ANALYSIS_STORAGE.md

ALTER TABLE titles
ADD COLUMN IF NOT EXISTS comps_analysis JSONB;

COMMENT ON COLUMN titles.comps_analysis IS 'AI-generated comparable titles with full match analysis. Array of SuggestedComp objects containing match_score, dimension_scores, explanation, and match_reasons.';
