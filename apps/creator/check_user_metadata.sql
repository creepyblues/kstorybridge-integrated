-- Check the current user's metadata and profile status
-- Run this for the email: hyobinsungho@gmail.com

SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    u.raw_user_meta_data->>'account_type' as account_type,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'pen_name' as pen_name,
    -- Check buyer profile
    b.id as buyer_profile_id,
    b.tier as buyer_tier,
    -- Check creator profile  
    ip.id as creator_profile_id,
    ip.pen_name as creator_pen_name,
    ip.invitation_status as creator_status
FROM auth.users u
LEFT JOIN public.user_buyers b ON b.email = u.email
LEFT JOIN public.user_ipowners ip ON ip.email = u.email
WHERE u.email = 'hyobinsungho@gmail.com'
ORDER BY u.created_at DESC;

-- Update the user's account_type to creator if they should be a creator
-- (Only run this if the user should be a creator but has wrong account_type)
/*
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"account_type": "creator"}'::jsonb
WHERE email = 'hyobinsungho@gmail.com'
AND raw_user_meta_data->>'account_type' != 'creator';
*/