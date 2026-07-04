-- Migration: 20260703130000_anon_lockdown.sql
-- Phase B of P0-3 — anon read lockdown of raw titles / title_format_fit.
--
-- STATUS: ALREADY APPLIED to production on 2026-07-04 via the Supabase SQL Editor
-- (applied after the website + trial code was deployed to read the public views).
-- This file is the version-control record of that change. If running `supabase db
-- reset` locally, it recreates the same state; on prod it is a no-op (idempotent:
-- DROP POLICY IF EXISTS + REVOKE of an already-revoked grant).
--
-- Verified post-apply: anon reads of public.titles and public.title_format_fit
-- return HTTP 401; the public_titles / public_title_format_fit views still serve anon.
--
-- Risk Level: MEDIUM (access-control tightening; no data modified)
-- Rollback:
--   GRANT SELECT ON public.titles TO anon;
--   GRANT SELECT ON public.title_format_fit TO anon;
--   DROP POLICY IF EXISTS "Authenticated can read format fit data" ON public.title_format_fit;
--   CREATE POLICY "Anyone can read format fit data" ON public.title_format_fit FOR SELECT USING (true);

-- Tighten title_format_fit RLS: public read -> authenticated read
DROP POLICY IF EXISTS "Anyone can read format fit data" ON public.title_format_fit;

CREATE POLICY "Authenticated can read format fit data"
  ON public.title_format_fit
  FOR SELECT
  TO authenticated
  USING (true);

-- Revoke anon's direct table grants. The public_titles / public_title_format_fit
-- views remain readable by anon (owner-defined, not security_invoker).
REVOKE SELECT ON public.titles FROM anon;
REVOKE SELECT ON public.title_format_fit FROM anon;

-- Verification (NOTICEs during apply)
DO $$
DECLARE t integer; f integer;
BEGIN
  SELECT COUNT(*) INTO t FROM information_schema.role_table_grants
    WHERE grantee='anon' AND table_schema='public' AND table_name='titles' AND privilege_type='SELECT';
  SELECT COUNT(*) INTO f FROM information_schema.role_table_grants
    WHERE grantee='anon' AND table_schema='public' AND table_name='title_format_fit' AND privilege_type='SELECT';
  RAISE NOTICE 'anon SELECT grant on titles (expect 0): %', t;
  RAISE NOTICE 'anon SELECT grant on title_format_fit (expect 0): %', f;
END $$;
