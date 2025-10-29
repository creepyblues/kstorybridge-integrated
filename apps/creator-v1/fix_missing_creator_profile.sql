-- Fix Missing Creator Profile for hyobinsungho@gmail.com
-- This user completed OAuth signup but profile creation failed

-- First, let's check if the user exists in auth.users and get their ID
-- Note: This query requires admin access to auth schema

-- Check current state
SELECT 
  'Current state check' as step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_buyers WHERE email = 'hyobinsungho@gmail.com') THEN 'Has buyer profile'
    WHEN EXISTS(SELECT 1 FROM user_creators WHERE email = 'hyobinsungho@gmail.com') THEN 'Has creator profile'  
    ELSE 'No profile found'
  END as profile_status;

-- If we can access auth.users (admin only), get the user ID
-- Otherwise, we'll need to use the Edge Function approach

-- Method 1: Direct profile creation (if you have the user ID)
-- You'll need to get the user ID from the Supabase Auth admin panel
-- Replace 'USER_ID_HERE' with actual UUID from auth.users

-- INSERT INTO user_creators (
--   id,
--   email,
--   full_name,
--   pen_name,
--   invitation_status,
--   created_at
-- ) VALUES (
--   'USER_ID_HERE'::uuid,  -- Replace with actual user ID
--   'hyobinsungho@gmail.com',
--   'Hyobin Lim',
--   'Hyobin',
--   'invited',
--   now()
-- ) ON CONFLICT (id) DO NOTHING;

-- Method 2: Create profile using subquery (safer)
INSERT INTO user_creators (
  id,
  email,
  full_name,
  pen_name,
  invitation_status,
  created_at
)
SELECT 
  au.id,
  'hyobinsungho@gmail.com',
  COALESCE(au.raw_user_meta_data->>'full_name', 'Hyobin Lim'),
  COALESCE(au.raw_user_meta_data->>'pen_name', 'Hyobin'),
  'invited',
  now()
FROM auth.users au
WHERE au.email = 'hyobinsungho@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_creators uc WHERE uc.id = au.id
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
  'Verification' as step,
  uc.id,
  uc.email,
  uc.full_name,
  uc.pen_name,
  uc.created_at
FROM user_creators uc
WHERE uc.email = 'hyobinsungho@gmail.com';

-- Also check we didn't accidentally create a buyer profile
SELECT 
  'Buyer profile check' as step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_buyers WHERE email = 'hyobinsungho@gmail.com') 
    THEN 'WARNING: Buyer profile exists - should be removed'
    ELSE 'OK: No buyer profile'
  END as buyer_status;

-- If buyer profile exists (shouldn't), remove it
DELETE FROM user_buyers 
WHERE email = 'hyobinsungho@gmail.com' 
  AND EXISTS(SELECT 1 FROM user_creators WHERE email = 'hyobinsungho@gmail.com');

-- Final verification
SELECT 
  'Final check' as step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_creators WHERE email = 'hyobinsungho@gmail.com') 
    THEN 'SUCCESS: Creator profile exists'
    ELSE 'FAIL: Creator profile missing'
  END as final_status;