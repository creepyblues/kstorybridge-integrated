-- Migration: Drop the one_draft_per_creator constraint
-- Created: 2025-11-04
-- Purpose: The actual constraint name in the database is 'one_draft_per_creator', not 'title_drafts_creator_id_key'

-- Remove the UNIQUE constraint that prevents multiple drafts per creator
ALTER TABLE title_drafts
DROP CONSTRAINT IF EXISTS one_draft_per_creator;

-- Verify: After this, creators can have multiple drafts simultaneously
