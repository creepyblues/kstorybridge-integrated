/**
 * Provenance Columns for Titles Table
 *
 * Purpose: Track who last modified each title and from which source.
 * Part of Data Governance Phase 3 implementation.
 *
 * Created: 2026-01-08
 * Status: PENDING
 *
 * Related:
 *   - Phase 1: intelligence_ingestion_log (already exists)
 *   - Phase 2: title_edit_history (created 2026-01-08)
 */

-- ============================================================================
-- 1. Add Provenance Columns to Titles Table
-- ============================================================================

-- Add last_modified_by column (stores email of last modifier)
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_modified_by text;

-- Add last_modified_source column (stores source type)
-- Values: 'creator' | 'admin' | 'intelligence' | 'ai' | 'system'
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_modified_source text DEFAULT 'system';

-- ============================================================================
-- 2. Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN titles.last_modified_by IS 'Email of the user who last modified this title';
COMMENT ON COLUMN titles.last_modified_source IS 'Source of last modification: creator, admin, intelligence, ai, or system';

-- ============================================================================
-- 3. Create Index for Querying by Source
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_titles_last_modified_source
ON titles(last_modified_source);

CREATE INDEX IF NOT EXISTS idx_titles_last_modified_by
ON titles(last_modified_by);

-- ============================================================================
-- End of Migration
-- ============================================================================
