-- Fix admin access for sungho@dadble.com
-- Run this in Supabase SQL editor or via CLI

-- First, ensure the admin table exists (should already exist from migrations)
-- CREATE TABLE IF NOT EXISTS public.admin (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   email TEXT NOT NULL UNIQUE,
--   full_name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   active BOOLEAN NOT NULL DEFAULT true
-- );

-- Insert admin record for sungho@dadble.com (if not exists)
INSERT INTO public.admin (email, full_name) VALUES 
('sungho@dadble.com', 'Sungho Lee')
ON CONFLICT (email) DO UPDATE SET 
  active = true,
  updated_at = now();

-- Verify the record was created
SELECT * FROM public.admin WHERE email = 'sungho@dadble.com';

-- Ensure RLS is enabled and policy exists
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin;

-- Create policy that allows authenticated users to view admin records
CREATE POLICY "Authenticated users can view admin records" 
  ON public.admin 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.admin TO authenticated;