-- Comprehensive storage policy fix for pitch-pdfs bucket
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-pdfs',
  'pitch-pdfs', 
  false,  -- PRIVATE
  52428800,  -- 50MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- STEP 2: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL existing policies for clean slate
DO $$ 
DECLARE 
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND (qual LIKE '%pitch-pdfs%' OR with_check LIKE '%pitch-pdfs%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- STEP 4: Create new comprehensive policies

-- Policy 1: Allow authenticated users to read their accessible PDFs
CREATE POLICY "pitch_pdfs_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-pdfs'
);

-- Policy 2: Allow service role full access (for admin operations)
CREATE POLICY "pitch_pdfs_service_role_all"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'pitch-pdfs')
WITH CHECK (bucket_id = 'pitch-pdfs');

-- Policy 3: Allow authenticated users to create signed URLs
CREATE POLICY "pitch_pdfs_signed_url_access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'pitch-pdfs'
  AND (
    -- Allow if accessing via signed URL (this is handled by Supabase internally)
    auth.role() = 'authenticated'
    OR auth.role() = 'anon'  -- Signed URLs work with anon role
  )
);

-- STEP 5: Verify the setup
SELECT 
  'SUCCESS: Bucket Configuration' as result,
  json_build_object(
    'id', id,
    'name', name,
    'public', public,
    'file_size_limit', file_size_limit,
    'allowed_mime_types', allowed_mime_types
  ) as details
FROM storage.buckets 
WHERE id = 'pitch-pdfs'

UNION ALL

SELECT 
  'SUCCESS: Active Policies' as result,
  json_build_object(
    'policy_name', policyname,
    'command', cmd,
    'role', roles,
    'permissive', permissive
  ) as details
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (qual LIKE '%pitch-pdfs%' OR with_check LIKE '%pitch-pdfs%')
ORDER BY result, details;