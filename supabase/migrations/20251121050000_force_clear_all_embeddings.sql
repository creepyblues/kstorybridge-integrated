-- Migration: Force Clear ALL Embeddings (Round 2)
-- Description: Aggressively clear all remaining corrupted embeddings
-- Status: IN_PROGRESS
-- Created: 2025-11-21
-- Reason: Previous migration missed some corrupted embeddings

-- Force clear ALL embeddings regardless of current state
UPDATE titles
SET
  combined_embedding = NULL,
  title_embedding = NULL,
  content_embedding = NULL,
  description_embedding = NULL,
  synopsis_embedding = NULL,
  embedding_updated_at = NOW()
WHERE title_id IS NOT NULL; -- Clear for all titles

-- Log the action
DO $$
DECLARE
  affected_count INT;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Force cleared embeddings for % titles', affected_count;
END $$;

COMMENT ON COLUMN titles.combined_embedding IS
  'OpenAI text-embedding-ada-002 vector (1536 dimensions). Force cleared on 2025-11-21 to remove all corrupted embeddings.';
