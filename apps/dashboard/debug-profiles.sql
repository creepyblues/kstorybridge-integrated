-- Debug script to check profiles table status
-- Run this in your Supabase SQL Editor

-- 1. Check if profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. Check table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Count profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- 4. Show sample profiles (limit 5)
SELECT id, email, full_name, account_type, created_at 
FROM public.profiles 
LIMIT 5;

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Check user_buyers table (if exists)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_buyers'
) as user_buyers_exists;

-- 7. Check user_ipowners table (if exists)  
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_ipowners'
) as user_ipowners_exists;

-- 8. Count data in source tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_buyers') THEN
    RAISE NOTICE 'user_buyers count: %', (SELECT COUNT(*) FROM public.user_buyers);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_ipowners') THEN
    RAISE NOTICE 'user_ipowners count: %', (SELECT COUNT(*) FROM public.user_ipowners);
  END IF;
END $$;

-- 9. Check if current user has a profile (replace USER_ID with actual UUID)
-- SELECT * FROM public.profiles WHERE id = 'YOUR_USER_ID_HERE';

-- 10. List all tables to see what's available
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;