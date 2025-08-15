CREATE OR REPLACE VIEW public.user_buyers_with_email AS
SELECT 
  ub.id,
  ub.id as user_id,
  ub.tier,
  ub.requested,
  ub.created_at,
  COALESCE(ub.email, 'user_' || SUBSTRING(ub.id::text, 1, 8) || '@kstorybridge.com') as email,
  COALESCE(ub.full_name, 'User ' || SUBSTRING(ub.id::text, 1, 8)) as full_name
FROM 
  public.user_buyers ub
ORDER BY 
  ub.created_at DESC;

GRANT SELECT ON public.user_buyers_with_email TO authenticated;
GRANT SELECT ON public.user_buyers_with_email TO anon;

ALTER VIEW public.user_buyers_with_email SET (security_invoker = on);

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

SELECT * FROM public.user_buyers_with_email LIMIT 5;