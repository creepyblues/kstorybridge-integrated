-- Migration: Clear Invalid Comp Cache Entries
-- Description: Removes cache entries with null embeddings that cause vector search errors
-- Status: IN_PROGRESS
-- Created: 2025-11-21
-- Issue: Cached embeddings contain null values causing "invalid input syntax for type vector" errors

-- Clear all comp_title_cache entries
-- The edge function will automatically regenerate valid embeddings on next search
TRUNCATE TABLE comp_title_cache;

-- Add comment for documentation
COMMENT ON TABLE comp_title_cache IS 'Caches OpenAI embeddings for comp titles to reduce API calls. Cleared on 2025-11-21 to remove invalid entries with null values.';
