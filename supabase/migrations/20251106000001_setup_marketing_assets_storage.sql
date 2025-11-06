-- Migration: Setup marketing assets storage bucket
-- Description: Create Supabase Storage bucket for generated marketing assets
-- Created: 2025-11-06
-- Feature: Creative Asset Generation System
-- Status: ACTIVE

-- ============================================================================
-- STORAGE BUCKET: marketing-assets
-- ============================================================================

-- Create storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-assets',
  'marketing-assets',
  false, -- Private bucket (requires signed URLs)
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Admin can view all files in marketing-assets bucket
CREATE POLICY "Admin can view marketing assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can upload files to marketing-assets bucket
CREATE POLICY "Admin can upload marketing assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can update files in marketing-assets bucket
CREATE POLICY "Admin can update marketing assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  )
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- Policy: Admin can delete files from marketing-assets bucket
CREATE POLICY "Admin can delete marketing assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND EXISTS (
      SELECT 1 FROM admin
      WHERE admin.email = (auth.jwt() ->> 'email')::text
      AND admin.active = true
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Bucket Structure:
-- marketing-assets/
--   {title_id}/
--     instagram_story-{timestamp}.png
--     poster-{timestamp}.png
--     concept_art-{timestamp}.png
--     etc.

-- Access Pattern:
-- - Admin frontend: Uses signed URLs for preview (24-hour expiry)
-- - Edge functions: Use service role key for direct access
-- - Public access: Disabled (private bucket)

-- File Naming Convention:
-- {title_id}/{asset_type}-{timestamp}.{extension}
-- Example: 123e4567-e89b-12d3-a456-426614174000/instagram_story-1699564800000.png
