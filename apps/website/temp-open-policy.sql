-- TEMPORARY: Very permissive policy for testing
-- This should definitely work, then we can make it more secure

DROP POLICY IF EXISTS "pitch_pdfs_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "pitch_pdfs_service_role_all" ON storage.objects;

-- Allow anyone to read from pitch-pdfs bucket (for testing only)
CREATE POLICY "pitch_pdfs_temp_open_read" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'pitch-pdfs');

-- Allow service role to manage
CREATE POLICY "pitch_pdfs_service_manage" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'pitch-pdfs' AND auth.role() = 'service_role');