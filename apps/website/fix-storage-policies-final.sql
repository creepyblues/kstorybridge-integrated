-- Final storage policies setup for secure PDF access
-- Run this in Supabase SQL Editor

-- Step 1: Remove any existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can read pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "pitch-pdfs-read" ON storage.objects;
DROP POLICY IF EXISTS "pitch-pdfs-manage" ON storage.objects;

-- Step 2: Create policy for authenticated users to read PDFs
CREATE POLICY "authenticated_read_pitch_pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pitch-pdfs' 
  AND auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
);

-- Step 3: Create policy for service role (admin operations)
CREATE POLICY "service_role_manage_pitch_pdfs"
ON storage.objects FOR ALL
USING (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role');

-- Step 4: Verify the bucket is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';

-- Step 5: Verify current status
SELECT 
  'Bucket Status' as check_type,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'pitch-pdfs'

UNION ALL

SELECT 
  'Storage Policies' as check_type,
  policyname as id,
  cmd as name,
  permissive::text as public,
  NULL as created_at
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (qual LIKE '%pitch-pdfs%' OR with_check LIKE '%pitch-pdfs%')
ORDER BY check_type, id;