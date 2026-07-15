# Funnel Report Cron Setup Guide

This guide explains how to set up the automated weekly funnel report that runs every Monday at 6am PST.

## Overview

The funnel report cron system consists of:

1. **Edge Function**: `funnel-report-cron` - Fetches GA4 data and generates the report
2. **pg_cron Job**: Uses a dedicated Vault-backed secret to trigger the edge function
3. **Delivery ledger**: Claims one logical run and each admin/Slack delivery idempotently
4. **Email Delivery**: Uses service-role-only `send-analytics-report` to email admins

Anon and normal authenticated-user tokens are rejected by both report endpoints. Do not deploy either strict function independently from the audit schema, secure cron command, and caller-secret updates.

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

Buyer-interest reconciliation starts enforcement only after the canonical dashboard event has covered a full reporting window:

```bash
npx supabase secrets set ANALYTICS_INTEREST_CONTRACT_LIVE_AT='ACTUAL_DASHBOARD_DEPLOYMENT_TIMESTAMP'
```

Leave the secret unset until the updated dashboard is in production. The authoritative count comes from newly created `title_interests` rows; duplicate requests that merely refresh a note are not additional outcomes.

Authenticated buyer-product reporting and canonical commercial signals use independent cutovers. Set each value only after every event represented by that report section is live in production:

```bash
npx supabase secrets set ANALYTICS_PRODUCT_CONTRACT_LIVE_AT='ACTUAL_DASHBOARD_DEPLOYMENT_TIMESTAMP'
npx supabase secrets set ANALYTICS_COMMERCIAL_CONTRACT_LIVE_AT='ACTUAL_LATER_WEBHOOK_OR_CLIENT_DEPLOYMENT_TIMESTAMP'
```

If a reporting window starts before a cutover, the section remains labeled instrumentation pending. The report never fills canonical counts by adding obsolete aliases such as `comps_search` or `checkout_completed`. Public-trial events remain separate because they describe the unauthenticated trial flow rather than the authenticated product contract.

**Important**: The JSON must be on a single line. You can use:
```bash
# Convert multi-line JSON to single line
cat /Users/sungholee/Downloads/kstorybridge-605470d9e4d4.json | jq -c . | pbcopy
```

### 2. Prepare report authentication

Generate one random value outside version control and store the same value in Supabase Vault and the `funnel-report-cron` Edge Function environment. Do not paste it into a migration, cron command, report, log, or client environment.

```bash
CRON_SECRET="$(openssl rand -hex 32)"
npx supabase secrets set ANALYTICS_FUNNEL_CRON_SECRET="$CRON_SECRET"

# DATABASE_URL must be the explicitly approved target database.
printf '%s\n' "SELECT vault.create_secret(:'cron_secret', 'analytics_funnel_cron_secret', 'Authenticates the weekly analytics cron');" \
  | psql "$DATABASE_URL" --set=cron_secret="$CRON_SECRET"
unset CRON_SECRET
```

Add `SUPABASE_SERVICE_ROLE_KEY` to the GitHub Actions encrypted secret store before activating `.github/workflows/analytics-progress.yml`. Provide the same variable to the local fallback cron through a user-only secure environment source. Never add it to a tracked `.env` file. Once the audit RPC is live, the progress script fails closed if that key is absent.

### 3. Coordinated deployment

```bash
cd /Users/sungholee/code/kstorybridge

# Follow the approved migration-history reconciliation and backup runbook first.
npx supabase db push

# Deploy both strict boundaries in the same maintenance window.
npx supabase functions deploy send-analytics-report
npx supabase functions deploy funnel-report-cron

# Verify deployment
npx supabase functions list
```

The production database is shared by the staging app domains. A staging-domain deployment is not an isolated database rehearsal.

### 4. Enable pg_cron Extension

pg_cron should already be enabled in your Supabase project. If not, run the migration:

```sql
-- Enable pg_cron extension (run in SQL editor)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
```

### 5. Create the Cron Job

Apply the migration to create the cron job:

```bash
npx supabase db push
```

The prepared migration replaces the old job with this no-secret-in-source command:

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
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days":7,"invocationKey":"manual-funnel:YYYY-MM-DD:operator-check-v1"}'
```

Reuse the same invocation key for an operator retry. The ledger returns the existing run and never resends completed recipients.

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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Analytics-Cron-Secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'analytics_funnel_cron_secret'
        LIMIT 1
      )
    ),
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

### Check durable delivery status

Use the privacy-safe RPC; it exposes aggregate counts and controlled error codes but no admin identity, report content, provider response, URL, or secret:

```sql
SELECT * FROM public.get_analytics_report_delivery_status(2);
```

Only two consecutive `scheduled` rows with `status='succeeded'`, every expected email sent, zero email failures, and `slack_sent=true` satisfy `AR-405`. Manual, local-progress, and GitHub-progress rows never count toward that streak.

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
3. Query `get_analytics_report_delivery_status(2)` for controlled delivery errors
4. Check Resend only when the ledger reports a provider failure

### HTTP 403 from report functions

1. Confirm manual calls use the exact service-role key, never the anon key or a user JWT.
2. Confirm the cron uses `X-Analytics-Cron-Secret` from `vault.decrypted_secrets`.
3. Confirm Vault and `ANALYTICS_FUNNEL_CRON_SECRET` contain the same value without printing either value.
4. Do not relax function authorization or restore the anon proxy.

### Cron not running

1. Verify pg_cron extension is enabled
2. Check job exists: `SELECT * FROM cron.job;`
3. Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

## Related Documentation

- [Analytics Skill](.claude/skills/analytics/SKILL.md)
- [Funnel Report Skill](.claude/skills/funnel-report/SKILL.md)
- [Send Analytics Report Function](supabase/functions/send-analytics-report/index.ts)
