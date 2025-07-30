-- Check current bucket status and policies
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check bucket public status
SELECT id, name, public, created_at, updated_at 
FROM storage.buckets 
WHERE id = 'pitch-pdfs';

-- 2. Check all storage policies for pitch-pdfs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (qual LIKE '%pitch-pdfs%' OR with_check LIKE '%pitch-pdfs%')
ORDER BY policyname;

-- 3. Check if there are any overly permissive policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (
    qual IS NULL 
    OR qual = 'true' 
    OR qual LIKE '%public%'
    OR qual NOT LIKE '%auth.%'
  )
ORDER BY policyname;

-- 4. Check storage configuration
SELECT 
  name,
  value
FROM pg_settings 
WHERE name LIKE '%storage%' OR name LIKE '%rls%';

-- Expected results:
-- 1. pitch-pdfs should have public = false
-- 2. No overly permissive policies should exist
-- 3. Only authenticated access should be allowed