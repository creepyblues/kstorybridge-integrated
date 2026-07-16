-- Migration: 20260716120000_schedule_weekly_activity_digest.sql
-- Created: 2026-07-16
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Schedule the Sunday "weekly activity digest" email (who signed up, who
-- returned, top pages) via pg_cron -> pg_net -> weekly-activity-digest edge
-- function. Uses the same Vault-backed cron secret as weekly-funnel-report so
-- no credential literal is stored in cron.job or migration history.
--
-- Fires at 13:00 UTC every Sunday = 06:00 America/Los_Angeles during PDT
-- (Mar-Nov) and 05:00 during PST (Nov-Mar). The report's DATA window is always
-- whole Pacific calendar days via reporting-window.ts, independent of DST.
--
-- Risk Level: LOW (adds one scheduled job; does not touch existing jobs/data)
-- Destructive: NO
--
-- Dependencies:
--   - pg_cron + pg_net extensions (already enabled)
--   - weekly-activity-digest edge function deployed
--   - Vault secret `analytics_funnel_cron_secret` present
--   - Edge secrets: GOOGLE_SERVICE_ACCOUNT_JSON, ANALYTICS_FUNNEL_CRON_SECRET
--
-- Rollback: SELECT cron.unschedule('weekly-activity-digest');

DO $$
DECLARE
  existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid FROM cron.job WHERE jobname = 'weekly-activity-digest'
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END
$$;

SELECT cron.schedule(
  'weekly-activity-digest',
  '0 13 * * 0',
  $cron_command$
  SELECT net.http_post(
    url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/weekly-activity-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Analytics-Cron-Secret', coalesce(
        (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'analytics_funnel_cron_secret'
          LIMIT 1
        ),
        ''
      )
    ),
    body := '{"days":7}'::jsonb
  ) AS request_id;
  $cron_command$
);

DO $$
DECLARE
  job_count integer;
  unsafe_command_count integer;
BEGIN
  SELECT count(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'weekly-activity-digest' AND active = true;

  SELECT count(*) INTO unsafe_command_count
  FROM cron.job
  WHERE jobname = 'weekly-activity-digest'
    AND command ~* '(authorization|bearer|eyJ[a-zA-Z0-9_-]+\.)';

  IF job_count <> 1 THEN
    RAISE EXCEPTION 'weekly_activity_digest_job_count_invalid: %', job_count;
  END IF;
  IF unsafe_command_count <> 0 THEN
    RAISE EXCEPTION 'weekly_activity_digest_job_contains_credential_material';
  END IF;
END
$$;
