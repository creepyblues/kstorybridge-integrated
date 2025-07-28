-- Create the storage bucket (this is the core requirement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-pdfs',
  'pitch-pdfs', 
  true, -- Make it public temporarily to test
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING; -- Don't error if bucket already exists