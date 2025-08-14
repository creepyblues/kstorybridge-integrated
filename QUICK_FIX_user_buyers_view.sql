-- QUICK FIX: Create user_buyers_with_email view
-- Run this in your Supabase SQL Editor to fix the 404 error

-- Step 1: Create the view that joins user_buyers with auth.users
CREATE OR REPLACE VIEW public.user_buyers_with_email AS
SELECT 
  ub.id,
  ub.user_id,
  ub.tier,
  ub.requested,
  ub.created_at,
  COALESCE(au.email, ub.email) as email,
  COALESCE(au.raw_user_meta_data->>'full_name', ub.full_name, 'Unknown User') as full_name
FROM 
  public.user_buyers ub
  LEFT JOIN auth.users au ON ub.user_id = au.id OR ub.id = au.id
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
-- SELECT * FROM public.user_buyers_with_email LIMIT 5;