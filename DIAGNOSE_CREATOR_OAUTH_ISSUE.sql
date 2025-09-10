-- DIAGNOSE CREATOR OAUTH ISSUE
-- Run this first to understand the current state before applying the fix

-- 1. Check all users with creator account_type metadata
SELECT 
  'Users with creator metadata' as category,
  COUNT(*) as count
FROM auth.users 
WHERE raw_user_meta_data->>'account_type' = 'creator'

UNION ALL

-- 2. Check all users with ip_owner account_type metadata (old format)
SELECT 
  'Users with ip_owner metadata' as category,
  COUNT(*) as count
FROM auth.users 
WHERE raw_user_meta_data->>'account_type' = 'ip_owner'

UNION ALL

-- 3. Check all creator profiles in user_creators table
SELECT 
  'Creator profiles in user_creators table' as category,
  COUNT(*) as count
FROM public.user_creators;

-- 4. Detailed view of users with creator metadata and their profile status
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'account_type' as account_type,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'pen_name' as pen_name,
  CASE 
    WHEN uc.id IS NOT NULL THEN 'Profile exists in user_creators'
    ELSE 'Missing profile in user_creators'
  END as profile_status,
  uc.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.user_creators uc ON uc.id = u.id
WHERE u.raw_user_meta_data->>'account_type' = 'creator'
ORDER BY u.created_at DESC;

-- 5. Check the current trigger function
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user_routing';

-- 6. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
