-- Migration: Setup marketing assets storage bucket (ISOLATED DESIGN)
-- Description: Create Supabase Storage bucket with NO dependencies on existing tables
-- Created: 2025-11-06 (Refactored for complete isolation)
-- Feature: Creative Asset Generation System
-- Status: ACTIVE
--
-- DESIGN PHILOSOPHY:
-- Storage policies check JWT email directly (NO admin table queries)
-- Completely independent from existing database structures

-- ============================================================================
-- STORAGE BUCKET: marketing-assets (ISOLATED)
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
-- STORAGE POLICIES (ISOLATED - NO TABLE QUERIES)
-- ============================================================================

-- ISOLATED POLICY: Check JWT email directly, NO admin table lookup
-- Admin list is hardcoded for complete isolation

-- Policy: Admin can view all files
CREATE POLICY "Admins can view marketing assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy: Admin can upload files
CREATE POLICY "Admins can upload marketing assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy: Admin can update files
CREATE POLICY "Admins can update marketing assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  )
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- Policy: Admin can delete files
CREATE POLICY "Admins can delete marketing assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND (auth.jwt() ->> 'email') IN (
      'sungho@kstorybridge.com',
      'kevin@sandstoneartists.com'
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Bucket Structure:
-- marketing-assets/
--   {title_id}/                          -- Title ID as folder (text, not enforced FK)
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

-- ============================================================================
-- ISOLATION NOTES
-- ============================================================================

-- This migration creates FULLY ISOLATED storage:
-- ✅ NO queries to admin table (emails hardcoded in policies)
-- ✅ NO dependencies on existing database structures
-- ✅ Can work as standalone storage bucket
-- ✅ Performance: No table joins on every file operation
-- ✅ Changes to admin table won't affect file access

-- To add a new admin, create a new migration:
-- DROP POLICY "Admins can view marketing assets" ON storage.objects;
-- CREATE POLICY "Admins can view marketing assets" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'marketing-assets'
--     AND (auth.jwt() ->> 'email') IN (
--       'sungho@kstorybridge.com',
--       'kevin@sandstoneartists.com',
--       'new@admin.com'
--     )
--   );
-- (Repeat for INSERT, UPDATE, DELETE policies)
