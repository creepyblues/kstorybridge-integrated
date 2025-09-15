-- IMMEDIATE FIX: Create missing creator profile for hyobinsungho@gmail.com
-- Run this first to fix the current user issue

-- Step 1: Create the missing creator profile
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

-- Step 2: Verify the fix worked
SELECT 
  'Verification' as step,
  uc.id,
  uc.email,
  uc.full_name,
  uc.pen_name,
  uc.created_at
FROM user_creators uc
WHERE uc.email = 'hyobinsungho@gmail.com';

-- Step 3: Make sure no buyer profile exists (cleanup if needed)
DELETE FROM user_buyers 
WHERE email = 'hyobinsungho@gmail.com' 
  AND EXISTS(SELECT 1 FROM user_creators WHERE email = 'hyobinsungho@gmail.com');

-- Step 4: Final verification
SELECT 
  'Final status' as step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_creators WHERE email = 'hyobinsungho@gmail.com') 
    THEN 'SUCCESS: Creator profile exists'
    ELSE 'FAIL: Creator profile still missing'
  END as creator_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_buyers WHERE email = 'hyobinsungho@gmail.com') 
    THEN 'WARNING: Buyer profile also exists'
    ELSE 'OK: No buyer profile'
  END as buyer_status;