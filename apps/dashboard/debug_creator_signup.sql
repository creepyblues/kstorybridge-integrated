-- Debug script for creator signup 403 error
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if RLS is enabled on user_creators
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_creators';

-- 2. List all RLS policies on user_creators table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_creators';

-- 3. Check table structure for user_creators
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_creators'
ORDER BY ordinal_position;

-- 4. Test if the table allows inserts (with a rollback)
BEGIN;

-- Try to insert a test record (will rollback)
INSERT INTO user_creators (
    id, 
    email, 
    full_name, 
    pen_name, 
    invitation_status
) VALUES (
    gen_random_uuid()::text,
    'test@example.com',
    'Test User',
    'Test Studio',
    'invited'
);

SELECT 'Test insert successful' as result;

-- Rollback the test insert
ROLLBACK;

-- 5. Check if there are any triggers that might cause issues
SELECT trigger_name, event_manipulation, trigger_schema, trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'user_creators';

-- 6. Show current auth context (if any)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_user as pg_user;