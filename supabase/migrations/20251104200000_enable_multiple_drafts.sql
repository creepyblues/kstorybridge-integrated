-- Migration: Enable multiple drafts per creator
-- Created: 2025-11-04
-- Purpose: Remove UNIQUE constraint on creator_id to allow creators to have multiple drafts

-- Remove UNIQUE constraint on creator_id
-- This allows creators to have multiple in-progress drafts simultaneously
ALTER TABLE title_drafts
DROP CONSTRAINT IF EXISTS title_drafts_creator_id_key;

ALTER TABLE title_drafts
DROP CONSTRAINT IF EXISTS one_draft_per_creator;

-- Add composite index for better query performance
-- This index helps with queries like "get all drafts for creator with status='draft'"
CREATE INDEX IF NOT EXISTS idx_title_drafts_creator_status
ON title_drafts(creator_id, status);

-- Update column comment to reflect change
COMMENT ON COLUMN title_drafts.creator_id IS
'Creator user ID. Multiple drafts per creator are allowed (UNIQUE constraint removed 2025-11-04). Use status field to filter draft/submitted/approved/rejected.';

-- Verify no data loss (existing drafts preserved)
-- All existing draft IDs remain valid and functional
