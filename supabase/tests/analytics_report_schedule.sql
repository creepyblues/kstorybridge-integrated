-- Run after applying 20260714041207_schedule_authenticated_analytics_report.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/analytics_report_schedule.sql

BEGIN;

DO $$
DECLARE
  scheduled_job cron.job%ROWTYPE;
BEGIN
  SELECT * INTO scheduled_job
  FROM cron.job
  WHERE jobname = 'weekly-funnel-report';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'weekly funnel report job is missing';
  END IF;
  IF (SELECT count(*) FROM cron.job WHERE jobname = 'weekly-funnel-report') <> 1 THEN
    RAISE EXCEPTION 'weekly funnel report job is duplicated';
  END IF;
  IF scheduled_job.schedule <> '0 14 * * 1' OR NOT scheduled_job.active THEN
    RAISE EXCEPTION 'weekly funnel report schedule or active state is incorrect';
  END IF;
  IF scheduled_job.command NOT LIKE '%X-Analytics-Cron-Secret%'
    OR scheduled_job.command NOT LIKE '%vault.decrypted_secrets%'
    OR scheduled_job.command NOT LIKE '%analytics_funnel_cron_secret%' THEN
    RAISE EXCEPTION 'weekly funnel report does not resolve the dedicated Vault secret';
  END IF;
  IF scheduled_job.command ~* '(authorization|bearer|eyJ[a-zA-Z0-9_-]+\.)' THEN
    RAISE EXCEPTION 'weekly funnel report command contains legacy credential material';
  END IF;
  IF has_function_privilege(
      'authenticated',
      'public.check_cron_job_status(text)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'authenticated users can inspect cron command text';
  END IF;
END;
$$;

ROLLBACK;
