-- Fix the admin table RLS policy to allow authenticated users to check their admin status
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;

-- Create a more permissive policy that allows authenticated users to query admin records
-- This is needed so users can check if they have admin access after authentication
CREATE POLICY "Authenticated users can view admin records" 
  ON public.admin 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Alternative: If you want to be more restrictive, only allow users to see their own admin record
-- CREATE POLICY "Users can view their own admin record" 
--   ON public.admin 
--   FOR SELECT 
--   TO authenticated
--   USING (email = auth.jwt() ->> 'email');