-- Fix Admin Access Issue
-- This script fixes the admin authentication stuck issue

-- 1. Check if admin table exists
SELECT 'Admin table status:' as info;
SELECT 
  schemaname, 
  tablename, 
  hasindexes, 
  hasrules, 
  hastriggers 
FROM pg_tables 
WHERE tablename = 'admin';

-- 2. Check current admin records
SELECT 'Current admin records:' as info;
SELECT id, email, full_name, active, created_at FROM public.admin;

-- 3. Check current policies on admin table
SELECT 'Current admin table policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'admin';

-- 4. Fix the RLS policy if needed
-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin;
DROP POLICY IF EXISTS "Authenticated users can view admin records" ON public.admin;

-- Create a permissive policy for authenticated users
CREATE POLICY "Authenticated users can view admin records" 
  ON public.admin 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 5. Insert the missing admin record for sungho@dadble.com
INSERT INTO public.admin (email, full_name, active) 
VALUES ('sungho@dadble.com', 'Sungho Lee', true)
ON CONFLICT (email) DO UPDATE SET 
  active = true,
  updated_at = now();

-- 6. Verify the admin record was created/updated
SELECT 'Admin record for sungho@dadble.com:' as info;
SELECT id, email, full_name, active, created_at, updated_at 
FROM public.admin 
WHERE email = 'sungho@dadble.com';

-- 7. Test query that the admin app would run
SELECT 'Testing admin query:' as info;
SELECT id, email, full_name, active 
FROM public.admin 
WHERE email = 'sungho@dadble.com' AND active = true;

-- 8. Final verification
SELECT 'Final verification - all admin records:' as info;
SELECT COUNT(*) as total_admins, COUNT(CASE WHEN active THEN 1 END) as active_admins 
FROM public.admin;