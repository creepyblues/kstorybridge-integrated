-- Comprehensive fix for admin table RLS policies
-- Run this in Supabase SQL Editor

-- 1. Ensure admin record exists for sungho@dadble.com
INSERT INTO public.admin (email, full_name, active) 
VALUES ('sungho@dadble.com', 'Sungho Lee', true)
ON CONFLICT (email) 
DO UPDATE SET 
  active = true,
  updated_at = now(),
  full_name = EXCLUDED.full_name;

-- 2. Drop all existing policies on admin table
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Authenticated users can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin;

-- 3. Disable RLS temporarily to test
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;

-- 4. Re-enable RLS with a simple policy
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- 5. Create a permissive policy for authenticated users
CREATE POLICY "Allow authenticated users to read admin table" 
  ON public.admin 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 6. Grant explicit permissions
GRANT SELECT ON public.admin TO authenticated;
GRANT SELECT ON public.admin TO anon;

-- 7. Verify the setup
SELECT 
  'Admin record exists' as check_type,
  EXISTS (
    SELECT 1 FROM public.admin 
    WHERE email = 'sungho@dadble.com' AND active = true
  ) as result;

SELECT 
  'RLS enabled' as check_type,
  pg_tables.rowsecurity as result
FROM pg_tables 
WHERE tablename = 'admin' AND schemaname = 'public';

SELECT 
  'Policies exist' as check_type,
  COUNT(*) as result
FROM pg_policies 
WHERE tablename = 'admin' AND schemaname = 'public';

-- 8. Test query (this should work after running the above)
SELECT * FROM public.admin WHERE email = 'sungho@dadble.com' AND active = true;