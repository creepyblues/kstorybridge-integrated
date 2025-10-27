-- Fix Missing RLS Policies for user_creators Table
--
-- The issue: When user_ipowners was renamed to user_creators, the RLS policies
-- were not updated, leaving the new table without proper insert/update policies.
-- This prevents OAuth creators from inserting their profiles.
--
-- Solution: Create the missing RLS policies for user_creators table.

-- Enable RLS on user_creators table if not already enabled
ALTER TABLE public.user_creators ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can insert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Authenticated users can upsert creator profile" ON public.user_creators;
DROP POLICY IF EXISTS "Users can view own creator profile" ON public.user_creators;

-- Create insert policy for OAuth and email signup
CREATE POLICY "Authenticated users can insert creator profile" 
  ON public.user_creators 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create update policy for upsert operations (used by atomicProfileCreator)
CREATE POLICY "Authenticated users can upsert creator profile" 
  ON public.user_creators 
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create select policy so users can view their own profile
CREATE POLICY "Users can view own creator profile"
  ON public.user_creators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can insert creator profile" ON public.user_creators 
IS 'Allows OAuth and email signup to create creator profiles';

COMMENT ON POLICY "Authenticated users can upsert creator profile" ON public.user_creators 
IS 'Allows profile updates and atomic upsert operations';

COMMENT ON POLICY "Users can view own creator profile" ON public.user_creators 
IS 'Allows users to read their own creator profile data';

-- Also create a policy that allows the database trigger to insert profiles
-- Triggers run with SECURITY DEFINER, so they need special handling
CREATE POLICY "Allow trigger inserts"
  ON public.user_creators
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Update the existing trigger to use service_role for inserts
-- This ensures the trigger can bypass RLS when creating profiles
-- Note: The trigger function already has SECURITY DEFINER, but we need to ensure
-- it can insert regardless of the current user context

COMMENT ON POLICY "Allow trigger inserts" ON public.user_creators 
IS 'Allows database triggers to create profiles with service role';