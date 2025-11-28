-- Create missing creator profiles (SAFE VERSION)
-- This version works without requiring direct auth.users table permissions
-- Uses a different approach that should work in managed Supabase

-- First, let's see how many creators are missing profiles using a safer query
-- Note: We may not be able to directly query auth.users, so this might fail too
-- But let's try a more limited approach

-- Just try to create profiles for known creator users if we have their IDs
-- This approach requires manual input of user IDs

-- Example approach: If you know the creator user ID from the auth callback logs,
-- you can manually create their profile:

/*
-- Replace 'ACTUAL_USER_ID_HERE' with the real user ID from OAuth signup
-- Replace other values with actual user data from the signup

INSERT INTO public.user_creators (
    id, 
    email, 
    full_name, 
    pen_name,
    created_at,
    updated_at
) VALUES (
    'ACTUAL_USER_ID_HERE',
    'user@example.com',
    'Full Name',
    'Pen Name',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    pen_name = EXCLUDED.pen_name,
    updated_at = NOW();
*/

-- Alternative: Check if we can at least see recent user_creators
SELECT COUNT(*) as current_creator_count FROM public.user_creators;

-- Show recent creators
SELECT 
    id,
    email,
    full_name,
    pen_name,
    created_at
FROM public.user_creators 
ORDER BY created_at DESC
LIMIT 5;

-- The real fix is to enable the triggers so future OAuth signups work automatically