-- Make bucket private and set up proper policies
UPDATE storage.buckets 
SET public = false
WHERE id = 'pitch-pdfs';

-- Clear existing policies
DROP POLICY IF EXISTS "Authenticated users can view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage PDFs" ON storage.objects;

-- Create policy for authenticated users to read PDFs
CREATE POLICY "Authenticated users can view PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'authenticated'
  );

-- Create policy for service role to manage PDFs
CREATE POLICY "Service role can manage PDFs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'service_role'
  );