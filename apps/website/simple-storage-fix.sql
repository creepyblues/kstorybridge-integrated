-- Simple storage policy fix - try this first
-- Run in Supabase SQL Editor

-- Step 1: Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';

-- Step 2: Remove conflicting policies
DROP POLICY IF EXISTS "pitch_pdfs_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "pitch_pdfs_service_role_all" ON storage.objects;
DROP POLICY IF EXISTS "pitch_pdfs_signed_url_access" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_pitch_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "service_role_manage_pitch_pdfs" ON storage.objects;

-- Step 3: Create simple policy for signed URLs to work
CREATE POLICY "Allow signed URL access to pitch-pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pitch-pdfs');

-- Step 4: Create service role policy
CREATE POLICY "Service role full access to pitch-pdfs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'pitch-pdfs')
WITH CHECK (bucket_id = 'pitch-pdfs');

-- Step 5: Check results
SELECT 'Bucket Status' as check_type, id, public::text as status
FROM storage.buckets WHERE id = 'pitch-pdfs'
UNION ALL
SELECT 'Policy Count' as check_type, 'pitch-pdfs-policies' as id, count(*)::text as status
FROM pg_policies 
WHERE tablename = 'objects' AND (qual LIKE '%pitch-pdfs%' OR with_check LIKE '%pitch-pdfs%');