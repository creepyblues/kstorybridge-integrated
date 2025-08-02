-- Test admin query to debug the authentication issue
-- Run this in Supabase SQL Editor to test the exact query the app is using

-- 1. Check if the admin record exists (basic query)
SELECT * FROM public.admin WHERE email = 'sungho@dadble.com';

-- 2. Test the exact query the app uses (with active = true filter)
SELECT * FROM public.admin WHERE email = 'sungho@dadble.com' AND active = true;

-- 3. Check RLS policies on admin table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'admin';

-- 4. Test the query as an authenticated user would see it
-- (Run this after authenticating in the app)
SELECT 
  a.*,
  auth.jwt() ->> 'email' as jwt_email,
  auth.uid() as auth_uid
FROM public.admin a 
WHERE a.email = 'sungho@dadble.com' 
  AND a.active = true;

-- 5. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin';

-- 6. Test policy evaluation
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.admin 
WHERE email = 'sungho@dadble.com' 
  AND active = true;

-- 7. Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'admin' 
  AND table_schema = 'public';

-- 8. Alternative query without single() constraint to see all matching records
SELECT 
  id,
  email,
  full_name,
  active,
  created_at,
  updated_at
FROM public.admin 
WHERE email = 'sungho@dadble.com';