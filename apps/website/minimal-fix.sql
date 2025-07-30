-- Minimal fix for pitch-pdfs access
-- Run this in Supabase SQL Editor (copy and paste each section separately)

-- Section 1: Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';

-- Section 2: Remove old policies (run each DROP separately if needed)
DROP POLICY IF EXISTS "pitch_pdfs_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_pitch_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "service_role_manage_pitch_pdfs" ON storage.objects;

-- Section 3: Create simple access policy
CREATE POLICY "pitch_pdfs_access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pitch-pdfs');

-- Section 4: Create service role policy  
CREATE POLICY "pitch_pdfs_admin"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'pitch-pdfs')
WITH CHECK (bucket_id = 'pitch-pdfs');