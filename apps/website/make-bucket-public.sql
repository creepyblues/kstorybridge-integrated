-- Temporary: Make the bucket public for testing
-- WARNING: This makes PDFs publicly accessible without authentication
UPDATE storage.buckets 
SET public = true
WHERE id = 'pitch-pdfs';

-- You can revert this later with:
-- UPDATE storage.buckets SET public = false WHERE id = 'pitch-pdfs';