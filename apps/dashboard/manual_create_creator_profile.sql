-- Manual Creator Profile Creation
-- Use this when you know the specific user details from OAuth signup logs

-- INSTRUCTIONS:
-- 1. Look at your OAuth callback logs to get the user ID and details
-- 2. Replace the placeholder values below with actual user data
-- 3. Run the INSERT statement

-- Template for manual profile creation:
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
) VALUES (
    -- Replace these values with actual user data from OAuth signup:
    '00000000-0000-0000-0000-000000000000',  -- REPLACE: User ID from logs
    'user@example.com',                       -- REPLACE: Actual email
    'Full Name',                             -- REPLACE: Actual full name
    'Pen Name or Studio',                    -- REPLACE: Actual pen name
    NULL,                                    -- or 'author'::ip_owner_role, 'agent'::ip_owner_role
    'Company Name',                          -- REPLACE: Actual company or NULL
    'https://website.com',                   -- REPLACE: Actual website or NULL
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    pen_name = EXCLUDED.pen_name,
    ip_owner_role = EXCLUDED.ip_owner_role,
    ip_owner_company = EXCLUDED.ip_owner_company,
    website_url = EXCLUDED.website_url,
    updated_at = NOW();

-- After creating the profile, verify it exists:
SELECT 
    id,
    email,
    full_name,
    pen_name,
    created_at
FROM public.user_creators 
WHERE email = 'user@example.com'  -- REPLACE with actual email
ORDER BY created_at DESC;