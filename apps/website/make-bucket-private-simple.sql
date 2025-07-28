-- Make the bucket private again
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pitch-pdfs';