-- Debug current storage configuration
-- Run this in Supabase SQL Editor to see what's currently set up

-- 1. Check bucket status
SELECT 
  'BUCKET STATUS' as type,
  id,
  name,
  public::text as status,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'pitch-pdfs';

-- 2. Check current storage policies
SELECT 
  'STORAGE POLICIES' as type,
  policyname as id,
  cmd as name,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as status,
  roles::text as file_size_limit,
  qual as allowed_mime_types
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;

-- 3. Check RLS status on storage.objects
SELECT 
  'RLS STATUS' as type,
  schemaname as id,
  tablename as name,
  rowsecurity::text as status,
  '' as file_size_limit,
  '' as allowed_mime_types
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Show storage schema info
SELECT 
  'STORAGE SCHEMA' as type,
  column_name as id,
  data_type as name,
  is_nullable as status,
  column_default as file_size_limit,
  '' as allowed_mime_types
FROM information_schema.columns 
WHERE table_schema = 'storage' 
  AND table_name = 'objects' 
  AND column_name IN ('bucket_id', 'name', 'owner')
ORDER BY ordinal_position;