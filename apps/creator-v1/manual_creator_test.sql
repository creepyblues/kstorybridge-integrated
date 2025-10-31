-- Manual Creator Profile Creation Test
-- This will help us identify if the issue is with the trigger or the function

-- Testing manual creator profile creation

-- First, let's see if we can find a recent creator user
WITH recent_creator_user AS (
  SELECT 
    id,
    email,
    raw_user_meta_data->>'account_type' as account_type,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'pen_name' as pen_name,
    raw_user_meta_data->>'ip_owner_role' as ip_owner_role,
    raw_user_meta_data->>'ip_owner_company' as ip_owner_company,
    raw_user_meta_data->>'website_url' as website_url,
    created_at
  FROM auth.users 
  WHERE raw_user_meta_data->>'account_type' = 'creator'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT * FROM recent_creator_user;

-- If we found a creator user, let's manually create their profile
-- (You'll need to run this with the actual user ID from above)

-- Example manual profile creation (replace with actual user data):
/*
INSERT INTO public.user_creators (
  id, 
  email, 
  full_name, 
  pen_name,
  ip_owner_role,
  ip_owner_company,
  website_url
)
VALUES (
  'REPLACE_WITH_ACTUAL_USER_ID',
  'REPLACE_WITH_ACTUAL_EMAIL',
  'REPLACE_WITH_ACTUAL_FULL_NAME',
  'REPLACE_WITH_ACTUAL_PEN_NAME',
  NULL, -- or cast to ip_owner_role if provided
  'REPLACE_WITH_ACTUAL_COMPANY',
  'REPLACE_WITH_ACTUAL_WEBSITE'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  pen_name = EXCLUDED.pen_name,
  ip_owner_role = EXCLUDED.ip_owner_role,
  ip_owner_company = EXCLUDED.ip_owner_company,
  website_url = EXCLUDED.website_url,
  updated_at = NOW();
*/

-- Manual test ready. Use the INSERT statement above with actual user data.