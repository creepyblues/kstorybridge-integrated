
-- Drop the profiles table since we're using user_buyers and user_ipowners instead
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Also drop the old trigger and function that was using profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Make sure the correct trigger is in place for routing users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_routing();
