-- CRITICAL: Make pitch-pdfs bucket private immediately to prevent unauthorized access
-- This must be executed in the Supabase SQL editor or via CLI

-- Step 1: Make the bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';

-- Step 2: Remove any existing permissive policies
DROP POLICY IF EXISTS "Public read access for pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read pitch-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to pitch-pdfs" ON storage.objects;

-- Step 3: Create secure policy for authenticated users only
CREATE POLICY "Authenticated users can read pitch-pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pitch-pdfs' 
  AND auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
);

-- Step 4: Create policy for service role (for admin operations)
CREATE POLICY "Service role can manage pitch-pdfs"
ON storage.objects FOR ALL
USING (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role');

-- Step 5: Verify the changes
SELECT id, name, public FROM storage.buckets WHERE id = 'pitch-pdfs';

-- Expected result: public should be FALSE