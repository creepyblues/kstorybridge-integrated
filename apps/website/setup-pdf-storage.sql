-- Create storage bucket for PDF pitches
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-pdfs',
  'pitch-pdfs', 
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
);

-- Create policy for authenticated users to read PDFs
CREATE POLICY "Authenticated users can view PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'authenticated'
  );

-- Create policy for service role to upload PDFs (for admin)
CREATE POLICY "Service role can upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'service_role'
  );

-- Create policy for service role to update PDFs (for admin)
CREATE POLICY "Service role can update PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'service_role'
  );

-- Create policy for service role to delete PDFs (for admin)
CREATE POLICY "Service role can delete PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pitch-pdfs' AND 
    auth.role() = 'service_role'
  );