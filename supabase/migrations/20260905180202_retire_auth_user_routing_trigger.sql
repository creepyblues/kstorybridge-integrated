-- Retire the legacy auth trigger that auto-created user_buyers rows from signup
-- metadata (Gate 2, 6a). Profile creation now happens at the first authenticated
-- moment via the JWT-bound create-*-profile edge functions, which read the
-- pending_*_profile metadata namespace. Trigger/function drops only; no table
-- changes. Backup taken with ./scripts/backup-critical-tables.sh before applying.
--
-- MUST ship together with the Gate 2 edge functions + clients (6b/6c): without
-- them, email signups would arrive at verification with no profile.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_routing();

-- Older trigger/function names from the 2025-07 iterations, in case any survived.
DROP TRIGGER IF EXISTS on_auth_user_profile_routing ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_profile_routing();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_buyer();
DROP FUNCTION IF EXISTS public.handle_new_ipowner();
