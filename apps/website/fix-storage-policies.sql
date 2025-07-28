-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete PDFs" ON storage.objects;

-- Create updated policy for authenticated users to read PDFs
CREATE POLICY "Authenticated users can view PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'authenticated'
  );

-- Alternative policy that's more permissive - if the above doesn't work
-- CREATE POLICY "Allow authenticated read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'pitch-pdfs');

-- Create policy for service role to manage PDFs (for admin uploads)
CREATE POLICY "Service role can manage PDFs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'service_role'
  );

-- Ensure the bucket exists and is configured correctly
UPDATE storage.buckets 
SET public = false, 
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']::text[]
WHERE id = 'pitch-pdfs';