-- Ensure buyers can read their own profile while keeping RLS protections intact
ALTER TABLE public.user_buyers ENABLE ROW LEVEL SECURITY;

-- Drop legacy policy name if it exists to avoid duplicates
DROP POLICY IF EXISTS "Users can view own buyer profile" ON public.user_buyers;

CREATE POLICY "Users can view own buyer profile"
  ON public.user_buyers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

COMMENT ON POLICY "Users can view own buyer profile" ON public.user_buyers
IS 'Allows authenticated buyers to read their own profile rows while preserving RLS.';
