-- Run each line separately in Supabase SQL Editor

-- Line 1:
CREATE POLICY "simple_pitch_access" ON storage.objects FOR SELECT USING (bucket_id = 'pitch-pdfs');

-- Line 2:  
CREATE POLICY "admin_pitch_access" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'pitch-pdfs') WITH CHECK (bucket_id = 'pitch-pdfs');