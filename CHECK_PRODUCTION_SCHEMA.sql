-- Check production database schema
-- Run this FIRST to understand the table structure

-- 1. Check what columns exist in user_buyers table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_buyers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if admin table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check a sample of data from user_buyers
SELECT * FROM public.user_buyers LIMIT 3;