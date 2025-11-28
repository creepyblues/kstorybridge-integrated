-- Migration: Add title_url_en field to titles table
-- Created: 2025-11-27
-- Description: Adds English URL field for titles. The existing title_url field
--              contains URLs to the Korean version of the title, while title_url_en
--              will contain URLs to the English version.

-- Add title_url_en column
ALTER TABLE titles
ADD COLUMN IF NOT EXISTS title_url_en TEXT;

-- Add comment to clarify the difference between title_url and title_url_en
COMMENT ON COLUMN titles.title_url IS 'URL to the original Korean version of the title';
COMMENT ON COLUMN titles.title_url_en IS 'URL to the English version of the title';
