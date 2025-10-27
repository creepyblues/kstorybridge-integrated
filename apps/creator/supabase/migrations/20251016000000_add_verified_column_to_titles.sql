-- Add verified column to titles table
-- Status: IN_PROGRESS
-- Date: 2025-10-16
-- Description: Add boolean field to mark verified/official titles
--
-- This migration adds a 'verified' column to track whether a title has been
-- verified as official/authentic content. This is useful for distinguishing
-- between verified publisher content and user-submitted titles.

-- Add the verified column with default false
ALTER TABLE public.titles
ADD COLUMN verified boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.titles.verified IS
  'Indicates whether the title has been verified as official/authentic content. Defaults to false for all new titles.';

-- Note: No index created initially. Add later if filtering by verified becomes common:
-- CREATE INDEX idx_titles_verified ON titles(verified) WHERE verified = true;
