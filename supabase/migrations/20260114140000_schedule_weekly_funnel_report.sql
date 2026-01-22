-- Migration: Schedule Weekly Funnel Report Cron Job
-- Created: 2026-01-14
-- Purpose: Set up pg_cron job to run funnel report every Monday at 6am PST
--
-- Dependencies:
--   - pg_cron extension (should be enabled by default in Supabase)
--   - pg_net extension for HTTP calls
--   - funnel-report-cron edge function must be deployed
--   - GOOGLE_SERVICE_ACCOUNT_JSON secret must be configured

-- Enable pg_net extension if not already enabled (required for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Check if pg_cron is available (it's enabled by default in Supabase Pro/Enterprise)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron extension is not available. Please enable it in the Supabase dashboard or contact Supabase support.';
  END IF;
END
$$;

-- Schedule the weekly funnel report
-- Runs every Monday at 14:00 UTC (6:00 AM PST / 7:00 AM PDT)
--
-- Cron format: minute hour day_of_month month day_of_week
-- '0 14 * * 1' = At 14:00 on Monday
--
-- Note: This uses the Supabase anon key for authentication.
-- The edge function validates the request internally.

SELECT cron.schedule(
  'weekly-funnel-report',
  '0 14 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/funnel-report-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA4NTM3NzMsImV4cCI6MjAzNjQyOTc3M30.y0KTfJlcWRLLKsJMqSjDLMsohDX7KLByQK2xwzwMHaE'
    ),
    body := '{"days": 7}'::jsonb
  ) AS request_id;
  $$
);

-- Verify the job was created
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'weekly-funnel-report';

  IF job_count > 0 THEN
    RAISE NOTICE 'Successfully scheduled weekly-funnel-report cron job';
  ELSE
    RAISE WARNING 'Failed to create weekly-funnel-report cron job';
  END IF;
END
$$;

-- Add comment explaining the job
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for weekly funnel reports';

-- Create a helper function to check cron job status
CREATE OR REPLACE FUNCTION public.check_cron_job_status(job_name TEXT)
RETURNS TABLE(
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
  FROM cron.job
  WHERE jobname = job_name;
$$;

-- Grant access to check cron status
GRANT EXECUTE ON FUNCTION public.check_cron_job_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cron_job_status(TEXT) TO service_role;
