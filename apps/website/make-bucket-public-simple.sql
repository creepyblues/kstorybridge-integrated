-- Make the bucket public (this should work with your permissions)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'pitch-pdfs';