
-- Fix Embedding Column Types
-- Run this in Supabase SQL Editor if the script doesn't work

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop columns with wrong types
ALTER TABLE public.titles 
  DROP COLUMN IF EXISTS description_embedding CASCADE,
  DROP COLUMN IF EXISTS combined_embedding CASCADE,
  DROP COLUMN IF EXISTS title_embedding CASCADE,
  DROP COLUMN IF EXISTS synopsis_embedding CASCADE,
  DROP COLUMN IF EXISTS content_embedding CASCADE;

-- Add columns with correct vector type
ALTER TABLE public.titles 
  ADD COLUMN description_embedding vector(1536),
  ADD COLUMN combined_embedding vector(1536),
  ADD COLUMN title_embedding vector(1536),
  ADD COLUMN synopsis_embedding vector(1536),
  ADD COLUMN content_embedding vector(1536);

-- Add indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_titles_description_embedding ON public.titles USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_titles_combined_embedding ON public.titles USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

-- Verify the changes
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'titles' 
  AND column_name LIKE '%embedding%';
    