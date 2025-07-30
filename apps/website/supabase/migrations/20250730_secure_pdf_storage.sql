-- Secure PDF Storage Migration
-- Make pitch-pdfs bucket private and set up authenticated access policies
-- This prevents direct URL access and requires authentication through the app

-- Step 1: Make the bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';

-- Step 2: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies for pitch-pdfs bucket to start fresh
DROP POLICY IF EXISTS "Authenticated users can view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "pitch_pdfs_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "pitch_pdfs_service_role_all" ON storage.objects;

-- Step 4: Create policy for authenticated users to read from pitch-pdfs bucket
CREATE POLICY "pitch_pdfs_authenticated_read" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'pitch-pdfs' AND auth.role() = 'authenticated');

-- Step 5: Create policy for service role to manage all operations on pitch-pdfs bucket  
CREATE POLICY "pitch_pdfs_service_role_all" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role');