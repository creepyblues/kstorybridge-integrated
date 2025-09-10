-- Create missing creator profiles for existing users
-- This manually creates user_creators records for users who have account_type='creator' but no profile

-- First, let's see how many creators are missing profiles
SELECT 
    COUNT(*) as missing_creator_profiles
FROM auth.users u
LEFT JOIN public.user_creators uc ON u.id = uc.id
WHERE u.raw_user_meta_data->>'account_type' = 'creator'
  AND uc.id IS NULL;

-- Create the missing profiles
INSERT INTO public.user_creators (
    id, 
    email, 
    full_name, 
    pen_name,
    ip_owner_role,
    ip_owner_company,
    website_url,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    u.raw_user_meta_data->>'pen_name',
    CASE 
        WHEN u.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
            AND u.raw_user_meta_data->>'ip_owner_role' != ''
        THEN (u.raw_user_meta_data->>'ip_owner_role')::ip_owner_role
        ELSE NULL
    END,
    u.raw_user_meta_data->>'ip_owner_company',
    u.raw_user_meta_data->>'website_url',
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN public.user_creators uc ON u.id = uc.id
WHERE u.raw_user_meta_data->>'account_type' = 'creator'
  AND uc.id IS NULL;

-- Show the results
SELECT 
    COUNT(*) as total_creator_profiles_now
FROM public.user_creators;

-- Show recent creator profiles
SELECT 
    id,
    email,
    full_name,
    pen_name,
    created_at
FROM public.user_creators 
ORDER BY created_at DESC
LIMIT 10;