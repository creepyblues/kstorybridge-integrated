-- Emergency operational rollback for:
--   20260714035054_analytics_report_delivery_audit.sql
--   20260714041207_schedule_authenticated_analytics_report.sql
--
-- REVIEW BEFORE USE. This intentionally pauses scheduled reporting and hides
-- the public aggregate status surface. It preserves every audit row, table,
-- constraint, and service-role function so evidence is not destroyed.
-- Roll back both dependent Edge Functions/callers as a coordinated application
-- release after this database-side pause. Never restore the anon proxy.

BEGIN;

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

REVOKE EXECUTE ON FUNCTION public.get_analytics_report_delivery_status(integer)
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- Post-rollback verification (run separately):
-- SELECT count(*) FROM cron.job WHERE jobname = 'weekly-funnel-report'; -- 0
-- SELECT count(*) FROM public.analytics_report_runs; -- evidence preserved
-- SELECT count(*) FROM public.analytics_report_recipient_deliveries; -- preserved
