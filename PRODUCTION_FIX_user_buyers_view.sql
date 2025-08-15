-- PRODUCTION FIX: Create user_buyers_with_email view
-- Fixed version that works with actual production schema

-- First, let's check what columns exist in user_buyers table
-- Run this first to see the structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_buyers';

-- Step 1: Create the view with proper column references
CREATE OR REPLACE VIEW public.user_buyers_with_email AS
SELECT 
  ub.id,
  ub.id as user_id,  -- Use id as user_id since user_id column doesn't exist
  ub.tier,
  ub.requested,
  ub.created_at,
  ub.updated_at,
  COALESCE(ub.email, au.email, 'user_' || SUBSTRING(ub.id::text, 1, 8) || '@kstorybridge.com') as email,
  COALESCE(ub.full_name, au.raw_user_meta_data->>'full_name', 'User ' || SUBSTRING(ub.id::text, 1, 8)) as full_name
FROM 
  public.user_buyers ub
  LEFT JOIN auth.users au ON ub.id = au.id
ORDER BY 
  ub.created_at DESC;

-- Step 2: Grant access to the view
GRANT SELECT ON public.user_buyers_with_email TO authenticated;
GRANT SELECT ON public.user_buyers_with_email TO anon;

-- Step 3: Enable RLS on the view
ALTER VIEW public.user_buyers_with_email SET (security_invoker = on);

-- Step 4: Create RLS policy for admin access
DROP POLICY IF EXISTS "Admin users can view all user buyers with email" ON public.user_buyers_with_email;
CREATE POLICY "Admin users can view all user buyers with email"
  ON public.user_buyers_with_email
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE admin.email = auth.jwt()->>'email'
      AND admin.active = true
    )
  );

-- Step 5: Verify the view works
SELECT * FROM public.user_buyers_with_email LIMIT 5;