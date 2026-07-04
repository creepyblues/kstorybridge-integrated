-- Migration: 20260703120000_public_format_fit_view.sql
-- Created: 2026-07-03
-- Author: audit remediation (P0-3, phase A)
-- Status: IN_PROGRESS
--
-- Description:
--   Phase A of closing the anonymous-read exposure of raw `titles` / `title_format_fit`.
--   Adds a public-safe view `public_title_format_fit` (format scores + analysis only)
--   so the public Format Spotlight page has a safe source, and grants anon/authenticated
--   SELECT on it.
--
--   This phase is PURELY ADDITIVE — it does NOT revoke anything. Anonymous access to the
--   raw tables is unchanged, so nothing breaks whether or not the website code is deployed.
--   The revoke happens in phase B (20260703130000_anon_lockdown.sql) AFTER the website is
--   confirmed reading the views.
--
-- Risk Level: LOW (additive; no data modified, no grants removed)
-- Destructive: NO
-- Backup Required: NO
--
-- Rollback:
--   DROP VIEW IF EXISTS public.public_title_format_fit;
--
-- Testing:
--   [ ] Applied to production
--   [ ] anon can SELECT public_title_format_fit
--   [ ] Format Spotlight page still works (old code on raw table OR new code on view)

CREATE OR REPLACE VIEW public.public_title_format_fit AS
SELECT
  title_id,
  film_score,
  tv_series_score,
  animation_score,
  microdrama_score,
  audio_drama_score,
  film_analysis,
  tv_series_analysis,
  animation_analysis,
  microdrama_analysis,
  audio_drama_analysis
FROM public.title_format_fit;

COMMENT ON VIEW public.public_title_format_fit IS
  'Public-safe projection of title_format_fit for anonymous marketing surfaces (Format Spotlight). Excludes any internal/cost columns.';

GRANT SELECT ON public.public_title_format_fit TO anon;
GRANT SELECT ON public.public_title_format_fit TO authenticated;
