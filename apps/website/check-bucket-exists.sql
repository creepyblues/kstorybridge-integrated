-- Check if the pitch-pdfs bucket exists
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'pitch-pdfs';

-- Also check all buckets to see what exists
SELECT id, name, public, created_at 
FROM storage.buckets;