-- Retire the legacy auth trigger that auto-created user_buyers rows from signup
-- metadata (Gate 2, 6a). Profile creation now happens at the first authenticated
-- moment via the JWT-bound create-*-profile edge functions, which read the
-- pending_*_profile metadata namespace. Trigger/function drops only; no table
-- changes. Backup taken with ./scripts/backup-critical-tables.sh before applying.
--
-- MUST ship together with the Gate 2 edge functions + clients (6b/6c): without
-- them, email signups would arrive at verification with no profile.

-- What is actually LIVE (verified via pg_trigger on 2026-09-05, applied out-of-band and
-- never recorded in migrations): the "consolidated" pair on auth.users —
--   on_auth_user_profile_routing         AFTER INSERT
--   on_auth_user_profile_routing_update  AFTER UPDATE OF raw_user_meta_data (account_type set/changed)
-- both executing public.handle_user_profile_routing(), which inserts into
-- user_buyers OR user_creators from account_type metadata.
DROP TRIGGER IF EXISTS on_auth_user_profile_routing ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_profile_routing_update ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_profile_routing();

-- The migration-file lineage (never live under this name on the hosted project, kept for safety).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_routing();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_buyer();
DROP FUNCTION IF EXISTS public.handle_new_ipowner();
