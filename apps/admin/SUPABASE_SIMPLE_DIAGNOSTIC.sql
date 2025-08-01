-- ============================================
-- SIMPLE DIAGNOSTIC FOR ADMIN APP 401 ERRORS
-- ============================================
-- Run these queries one by one to diagnose the issue

-- 1. Check if tables exist
SELECT 'Table existence check:' as test;
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin', 'titles');

-- 2. Check RLS status
SELECT 'RLS Status:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('admin', 'titles');

-- 3. Check current policies
SELECT 'Current Policies:' as test;
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('admin', 'titles')
ORDER BY tablename, policyname;

-- 4. Check permissions for anon role
SELECT 'Anonymous role permissions:' as test;
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('admin', 'titles')
AND grantee = 'anon';

-- 5. Test actual queries that are failing
SELECT 'Testing direct queries:' as test;

-- These are the exact queries the admin app is trying to execute:
SELECT COUNT(*) as admin_count FROM public.admin;
SELECT COUNT(*) as titles_count FROM public.titles;

-- 6. Test specific column access
SELECT 'Testing column access:' as test;
SELECT email FROM public.admin LIMIT 1;
SELECT title_id FROM public.titles LIMIT 1;