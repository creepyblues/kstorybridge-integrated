-- Create a view that joins user_buyers with auth.users to get email addresses
CREATE OR REPLACE VIEW public.user_buyers_with_email AS
SELECT 
  ub.id,
  ub.user_id,
  ub.tier,
  ub.requested,
  ub.created_at,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name
FROM 
  public.user_buyers ub
  LEFT JOIN auth.users au ON ub.user_id = au.id
ORDER BY 
  ub.created_at DESC;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_buyers_with_email TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.user_buyers_with_email SET (security_invoker = on);

-- Create a policy that allows admin users to view all records
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