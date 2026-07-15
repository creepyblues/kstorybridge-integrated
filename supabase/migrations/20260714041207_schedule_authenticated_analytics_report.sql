-- Migration: 20260714041207_schedule_authenticated_analytics_report.sql
-- Created: 2026-07-13
-- Status: READY_FOR_PRODUCTION_APPROVAL
--
-- Description:
-- Replace the legacy anon-authenticated weekly funnel cron command with a
-- Vault-backed dedicated credential header. The secret value is resolved only
-- at execution time and never appears in migration history or cron.job.
--
-- Risk Level: MEDIUM (scheduled-operation cutover)
-- Destructive: NO database data operation
--
-- Affected Objects:
-- - cron.job entry `weekly-funnel-report` (replaced in place)
-- - public.check_cron_job_status(text) authenticated grant (revoked)
--
-- Backup Required: NO table-data backup. Production requires a pre-cutover
-- export of the existing cron job metadata and confirmation that the Vault and
-- Edge Function secrets contain the same generated value.
--
-- Rollback Procedure:
-- Pause/unschedule the job and roll back the dependent Edge Functions first.
-- Never restore the anon proxy. Reschedule only with a reviewed server-side
-- credential after the incident cause is understood.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Exactly one active `weekly-funnel-report` job remains
-- [x] cron.job command contains the Vault lookup and no credential literal
-- [x] authenticated users cannot inspect cron command text

DO $$
DECLARE
  existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'weekly-funnel-report'
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END
$$;

SELECT cron.schedule(
  'weekly-funnel-report',
  '0 14 * * 1',
  $cron_command$
  SELECT net.http_post(
    url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/funnel-report-cron',
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

REVOKE EXECUTE ON FUNCTION public.check_cron_job_status(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_cron_job_status(text) TO service_role;

DO $$
DECLARE
  job_count integer;
  unsafe_command_count integer;
BEGIN
  SELECT count(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'weekly-funnel-report'
    AND active = true;

  SELECT count(*) INTO unsafe_command_count
  FROM cron.job
  WHERE jobname = 'weekly-funnel-report'
    AND command ~* '(authorization|bearer|eyJ[a-zA-Z0-9_-]+\.)';

  IF job_count <> 1 THEN
    RAISE EXCEPTION 'authenticated_weekly_funnel_job_count_invalid: %', job_count;
  END IF;
  IF unsafe_command_count <> 0 THEN
    RAISE EXCEPTION 'authenticated_weekly_funnel_job_contains_credential_material';
  END IF;
END
$$;
