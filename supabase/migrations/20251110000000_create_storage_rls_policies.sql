-- =====================================================
-- Migration: Create Storage RLS Policies
-- Description: Add RLS policies for pitch-pdfs and title-documents buckets
-- Date: 2025-11-10
-- Status: IN_PROGRESS
--
-- Purpose: Allow authenticated creators to upload/manage files in their title folders
-- Impact: Enables pitch deck and document uploads for creators
-- Security: Folder-based access control - creators can only access files in {title_id} folders they own
-- =====================================================

-- 1. Ensure buckets exist (safe with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('pitch-pdfs', 'pitch-pdfs', false),
  ('title-documents', 'title-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. RLS Policies for pitch-pdfs bucket
-- =====================================================
-- Pattern: Files stored as {bucket_id}/{title_id}/pitch.pdf
-- Access: Creators can only access files in folders matching their title_id

CREATE POLICY "Creators upload pitch PDFs for their titles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators view pitch PDFs for their titles"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators update pitch PDFs for their titles"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pitch-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'pitch-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators delete pitch PDFs for their titles"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

-- =====================================================
-- 3. RLS Policies for title-documents bucket
-- =====================================================
-- Pattern: Files stored as {bucket_id}/{title_id}/{timestamp}_{filename}.pdf
-- Access: Creators can only access files in folders matching their title_id

CREATE POLICY "Creators upload docs for their titles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators view docs for their titles"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators update docs for their titles"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators delete docs for their titles"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

-- =====================================================
-- End of migration
--
-- Notes:
-- - Policies use folder-based access control
-- - (storage.foldername(name))[1] extracts first folder from path (the title_id)
-- - Subquery validates creator owns the title
-- - Applies to all CRUD operations (INSERT, SELECT, UPDATE, DELETE)
-- =====================================================
