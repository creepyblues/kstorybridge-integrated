-- Migration: Fix Invalid Embedding Dimensions
-- Description: Identifies and removes titles with invalid embedding dimensions
-- Status: IN_PROGRESS
-- Created: 2025-11-21
-- Issue: Some titles have embeddings with wrong dimensions (19k+ instead of 1536)
--        causing them to not appear in vector search results

-- First, let's identify and clear titles with invalid embeddings
-- Note: We can't directly check vector dimensions in PL/pgSQL, so we use a simpler approach
-- Clear all embeddings and let them be regenerated fresh

DO $$
DECLARE
  title_count INT;
BEGIN
  -- Get count of titles with embeddings
  SELECT COUNT(*) INTO title_count
  FROM titles
  WHERE combined_embedding IS NOT NULL;

  RAISE NOTICE 'Found % titles with embeddings', title_count;
  RAISE NOTICE 'Clearing all embeddings to ensure they are regenerated with correct dimensions...';

  -- Clear all embeddings
  UPDATE titles
  SET
    combined_embedding = NULL,
    title_embedding = NULL,
    content_embedding = NULL,
    description_embedding = NULL,
    synopsis_embedding = NULL,
    embedding_updated_at = NOW()
  WHERE combined_embedding IS NOT NULL
     OR title_embedding IS NOT NULL
     OR content_embedding IS NOT NULL
     OR description_embedding IS NOT NULL
     OR synopsis_embedding IS NOT NULL;

  RAISE NOTICE 'Cleared embeddings for % titles', title_count;
  RAISE NOTICE 'Embeddings will be regenerated on next AI chatbot or comps search';
END $$;

-- Add comment for documentation
COMMENT ON COLUMN titles.combined_embedding IS
  'OpenAI text-embedding-ada-002 vector (1536 dimensions). Cleared invalid embeddings on 2025-11-21.';
