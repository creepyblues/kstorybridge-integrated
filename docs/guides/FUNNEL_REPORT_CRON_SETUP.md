# Funnel Report Cron Setup Guide

This guide explains how to set up the automated weekly funnel report that runs every Monday at 6am PST.

## Overview

The funnel report cron system consists of:

1. **Edge Function**: `funnel-report-cron` - Fetches GA4 data and generates the report
2. **pg_cron Job**: Triggers the edge function on schedule
3. **Email Delivery**: Uses existing `send-analytics-report` to email admins

## Prerequisites

### 1. Google Analytics Service Account

The cron job needs a Google Service Account with access to the GA4 Data API.

#### Step 1: Create Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name it: `kstorybridge-analytics-reader`
6. Description: `Service account for reading KStoryBridge GA4 analytics data`
7. Click **Create and Continue**
8. Skip the optional permissions step (click **Continue**)
9. Click **Done**

#### Step 2: Create Service Account Key

1. Click on the newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** (downloads the key file)

#### Step 3: Enable Google Analytics Data API

1. Go to **APIs & Services** > **Library**
2. Search for "Google Analytics Data API"
3. Click **Enable**

#### Step 4: Grant GA4 Property Access

1. Go to [Google Analytics Admin](https://analytics.google.com/analytics/web/#/a0p496541587/admin)
2. Navigate to **Property** > **Property Access Management**
3. Click **+ Add users**
4. Add the service account email (e.g., `kstorybridge-analytics-reader@your-project.iam.gserviceaccount.com`)
5. Grant **Viewer** role

#### Step 5: Store Credentials in Supabase

```bash
# Set the service account JSON as a secret
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='<paste entire JSON content here>'
```

The signup reconciliation remains in `Instrumentation pending` mode until the canonical auth contract has been live for a complete reporting window. After both the buyer dashboard and creator app are released to production, set this secret to the later of the two deployment timestamps:

```bash
npx supabase secrets set ANALYTICS_AUTH_CONTRACT_LIVE_AT='2026-07-13T00:00:00Z'
```

Use the actual production timestamp, not the example above. The report starts enforcing the 5% GA-to-Supabase reconciliation tolerance only when that timestamp predates the full report window. Until then, GA zeros are labeled as incomplete instrumentation and do not trigger false zero-signup alerts.

Creator title workflow reconciliation uses separate client and server cutovers. Set the client timestamp after the creator app containing `title_draft_created` and `title_submitted` reaches production. Do not set the server timestamp until `title_approved` and `title_published` are emitted by the authoritative admin workflow:

```bash
npx supabase secrets set ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT='ACTUAL_CREATOR_DEPLOYMENT_TIMESTAMP'
npx supabase secrets set ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT='ACTUAL_SERVER_EVENT_DEPLOYMENT_TIMESTAMP'
```

Publication remains a labeled catalog-creation proxy until `title_drafts` durably stores its published title ID. A coincidental equality between approval and catalog counts must not be called a reconciliation.

**Important**: The JSON must be on a single line. You can use:
```bash
# Convert multi-line JSON to single line
cat /Users/sungholee/Downloads/kstorybridge-605470d9e4d4.json | jq -c . | pbcopy
```

### 2. Deploy the Edge Function

```bash
cd /Users/sungholee/code/kstorybridge

# Deploy the funnel report cron function
npx supabase functions deploy funnel-report-cron

# Verify deployment
npx supabase functions list
```

### 3. Enable pg_cron Extension

pg_cron should already be enabled in your Supabase project. If not, run the migration:

```sql
-- Enable pg_cron extension (run in SQL editor)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
```

### 4. Create the Cron Job

Apply the migration to create the cron job:

```bash
npx supabase db push
```

Or run manually in the SQL editor:

```sql
-- Schedule funnel report for Monday 6am PST (14:00 UTC)
SELECT cron.schedule(
  'weekly-funnel-report',  -- Job name
  '0 14 * * 1',            -- Every Monday at 14:00 UTC (6am PST)
  $$
  SELECT net.http_post(
    url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/funnel-report-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
    ),
    body := '{"days": 7}'::jsonb
  ) AS request_id;
  $$
);
```

## Timezone Notes

- **6am PST** (Pacific Standard Time) = **14:00 UTC**
- **6am PDT** (Pacific Daylight Time) = **13:00 UTC**

The cron is set to 14:00 UTC, which means:
- **Winter (Nov-Mar)**: Report arrives at 6:00am PST
- **Summer (Mar-Nov)**: Report arrives at 7:00am PDT

To always get 6am Pacific regardless of DST, you would need to update the cron twice yearly, or accept the 1-hour variation.

## Testing

### Test Edge Function Directly

```bash
curl -X POST "https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/funnel-report-cron" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA4NTM3NzMsImV4cCI6MjAzNjQyOTc3M30.y0KTfJlcWRLLKsJMqSjDLMsohDX7KLByQK2xwzwMHaE" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

### Check Cron Job Status

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check recent job runs
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Manually Trigger Cron Job

```sql
-- Run the job immediately for testing
SELECT cron.schedule('test-funnel-now', 'NOW', $$
  SELECT net.http_post(
    url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/funnel-report-cron',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{"days": 7}'::jsonb
  );
$$);

-- Clean up test job after
SELECT cron.unschedule('test-funnel-now');
```

## Monitoring

### View Function Logs

```bash
# View recent logs
npx supabase functions logs funnel-report-cron --limit 50
```

### Check Email Delivery

The function calls `send-analytics-report` which logs:
- Emails sent count
- Slack notification status
- Any errors

## Customization

### Change Report Frequency

To change when the report runs, update the cron schedule:

```sql
-- Unschedule existing job
SELECT cron.unschedule('weekly-funnel-report');

-- Schedule with new timing
-- Examples:
-- Daily at 6am PST: '0 14 * * *'
-- Every Monday and Thursday: '0 14 * * 1,4'
-- First Monday of month: '0 14 1-7 * 1'

SELECT cron.schedule(
  'weekly-funnel-report',
  '0 14 * * 1',  -- Your new schedule
  $$ ... $$
);
```

### Change Report Duration

Modify the `days` parameter in the cron job body:

```sql
body := '{"days": 14}'::jsonb  -- 14-day report instead of 7
```

## Troubleshooting

### "GOOGLE_SERVICE_ACCOUNT_JSON secret not configured"

1. Verify the secret is set: `npx supabase secrets list`
2. Re-set the secret with valid JSON
3. Redeploy the function

### "Failed to get access token"

1. Check service account has correct permissions in GA4
2. Verify the JSON key is valid and not expired
3. Ensure Google Analytics Data API is enabled

### "No emails sent"

1. Check `admin` table has active admins with email addresses
2. Verify `RESEND_API_KEY` is configured
3. Check Resend dashboard for delivery status

### Cron not running

1. Verify pg_cron extension is enabled
2. Check job exists: `SELECT * FROM cron.job;`
3. Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

## Related Documentation

- [Analytics Skill](.claude/skills/analytics/SKILL.md)
- [Funnel Report Skill](.claude/skills/funnel-report/SKILL.md)
- [Send Analytics Report Function](supabase/functions/send-analytics-report/index.ts)
