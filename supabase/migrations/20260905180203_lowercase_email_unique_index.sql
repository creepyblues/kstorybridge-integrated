-- Case-insensitive email uniqueness for profile tables (Gate 2, step 8).
-- Audit 2026-09-05 (scripts/audit-auth-profiles.mjs): 0 non-lowercase emails and
-- 0 lower(email) collisions in either table, so no merges are needed first.
-- Writers keep lowercasing, so .eq('email', normalized) business queries stay valid.

UPDATE public.user_buyers   SET email = lower(email) WHERE email <> lower(email);
UPDATE public.user_creators SET email = lower(email) WHERE email <> lower(email);

CREATE UNIQUE INDEX IF NOT EXISTS user_buyers_email_lower_key   ON public.user_buyers   (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS user_creators_email_lower_key ON public.user_creators (lower(email));
