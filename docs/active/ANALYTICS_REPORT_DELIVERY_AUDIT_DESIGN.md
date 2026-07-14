# Analytics Report Delivery Audit Design

**Status:** Required design; implementation pending

**Prepared:** 2026-07-13

**Plan tasks:** `AR-405`, `AR-406`

## Problem

KStoryBridge cannot currently prove two consecutive scheduled analytics deliveries.

- The production `weekly-funnel-report` cron is active as job 1 on `0 14 * * 1`.
- `funnel-report-cron` receives the result from `send-analytics-report`, but both functions retain delivery evidence only in transient logs and the HTTP response.
- `send-analytics-report` does not use the separate welcome-email `email_logs` system. The production REST schema does not expose `email_logs`, so that table cannot be used as delivery evidence.
- A manual funnel invocation produces the same report payload as the database cron. There is no durable, authenticated trigger identity.
- The public Supabase anon token can invoke the funnel endpoint. Securing only `send-analytics-report` would not close the boundary because the funnel endpoint could still proxy an email/Slack send using its own service credentials.

Manual HTTP 200 responses and three-email/Slack success results prove the delivery path works at that moment. They do not prove that the scheduler initiated the run, that retries are idempotent, or that two consecutive scheduled runs succeeded.

## Required target state

```text
Supabase pg_cron
  -> secret from Supabase Vault
  -> authenticated funnel-report-cron
  -> claim unique scheduled invocation
  -> generate report
  -> service-role-only send-analytics-report
  -> idempotent recipient + Slack deliveries
  -> durable aggregate status
  -> read-only safe health RPC
  -> weekly progress external gate
```

Manual and progress reports use service-role authentication and distinct trigger kinds. They never count toward the scheduled funnel-delivery streak.

## Authentication boundary

1. Create a random `ANALYTICS_FUNNEL_CRON_SECRET` outside version control.
2. Store it in Supabase Vault for `pg_cron` and as an Edge Function secret for `funnel-report-cron`.
3. Change the cron request to send the Vault value in a dedicated header. Never place the secret literal in a migration, cron command, log, client bundle, or report.
4. Require the exact cron secret for `trigger_kind=scheduled`.
5. Permit service-role authentication for explicit manual operations. A manual caller cannot label itself scheduled.
6. Require exact service-role authentication for `send-analytics-report`.
7. Add `SUPABASE_SERVICE_ROLE_KEY` to the GitHub progress workflow secret store and use the existing local root environment for the fallback cron.
8. Reject anon, authenticated-user, missing, malformed, and mismatched credentials before parsing or sending report content.

This must be one coordinated cutover. Locking the sender before updating every caller interrupts reports; locking only the sender leaves the public funnel proxy; updating only callers leaves the original public boundary open.

## Durable schema

### `analytics_report_runs`

One row per logical report invocation:

| Column | Purpose |
|---|---|
| `id uuid` | Internal run identifier. |
| `invocation_key text unique` | Stable dedupe key, such as `weekly-funnel:2026-07-06:2026-07-12:v1`. |
| `report_type text` | Controlled enum: `funnel`, `progress`, or an approved future type. |
| `trigger_kind text` | Controlled enum: `scheduled`, `manual`, `local_progress`, `github_progress`. |
| `window_start date`, `window_end date` | America/Los_Angeles reporting window; nullable only when a report has no data window. |
| `status text` | `claimed`, `generating`, `delivering`, `succeeded`, `partial`, or `failed`. |
| `expected_email_count integer` | Active-admin recipient count at claim time. |
| `emails_sent integer`, `emails_failed integer` | Aggregate results. |
| `slack_requested boolean`, `slack_sent boolean` | Slack delivery result. |
| `started_at`, `completed_at`, `updated_at` | Operational timestamps. |
| `error_codes text[]` | Controlled codes only; no raw provider response or exception. |

### `analytics_report_recipient_deliveries`

One service-only row per run/admin/channel:

| Column | Purpose |
|---|---|
| `report_run_id uuid` | Parent run. |
| `admin_id` | Stable admin table key, not email. |
| `channel text` | `email` or `slack`. |
| `status text` | `pending`, `sent`, or `failed`. |
| `attempt_count integer` | Retry accounting. |
| `sent_at`, `updated_at` | Delivery timestamps. |
| `error_code text` | Controlled failure code only. |

Unique `(report_run_id, admin_id, channel)` prevents duplicate recipient sends during a retry. No recipient email, report body, alert text, provider response, token, webhook URL, or raw error belongs in either audit table.

Both tables use RLS with no anon/authenticated policies. Only service-role code may write or read detailed rows.

## Safe operating status

Expose a narrowly scoped security-definer RPC that returns only:

- scheduled invocation key and window dates;
- aggregate status and counts;
- Slack success;
- controlled error codes and timestamps.

It must not return admin IDs, recipient identity, report content, provider IDs, cron command text, secrets, or raw errors. The progress reporter can use this RPC to show:

- `PENDING`: fewer than two completed scheduled runs exist;
- `HEALTHY`: the latest two consecutive scheduled runs succeeded with all expected emails and Slack;
- `DEGRADED`: either of the latest two is partial/failed or has inconsistent counts;
- `UNAVAILABLE`: the safe status endpoint cannot be queried.

Manual and progress runs are displayed separately and never satisfy `AR-405`.

## Idempotency and failure behavior

1. Claim `invocation_key` before querying GA or sending anything.
2. A duplicate scheduled request returns the existing run and never starts a second delivery.
3. Mark each recipient/channel success immediately after provider acknowledgement.
4. A retry sends only unsent recipient/channel rows.
5. A run succeeds only when `emails_sent=expected_email_count`, `emails_failed=0`, and requested Slack delivery succeeded.
6. HTTP 200 with partial notification warnings is a `partial` run, not success.
7. A crash leaves a nonterminal run that can be safely reclaimed after a documented timeout.
8. Retain aggregate audit evidence long enough to cover operating and incident-review needs; approve the exact retention period before deployment.

## Acceptance criteria

- Anon and normal authenticated users receive 403 from both report endpoints and cannot cause email or Slack side effects.
- Missing/wrong cron secret receives 403; a valid Vault-backed scheduled call is accepted.
- Service-role manual calls are accepted but recorded as manual.
- Duplicate invocation keys produce one logical run and no duplicate recipient sends.
- Provider failure, partial email delivery, missing Slack, crash/reclaim, and retry paths have automated coverage.
- Audit rows contain no PII, report content, secrets, URLs, or raw errors.
- A safe status query distinguishes scheduled, manual, local-progress, and GitHub-progress runs.
- Two consecutive real Monday cron runs are `succeeded`, include every active admin, and have `slack_sent=true` before `AR-405` closes.
- Full local database reset and security tests pass before applying schema. Current historical migration blockers must be repaired or safely superseded first.

## Rollout order

1. Confirm the locally repaired migration history against staging/production and preserve a green full reset.
2. Create and test the additive audit schema, RLS, controlled functions, and safe status RPC locally.
3. Create the random secret operationally; store it in Supabase Vault and Edge Function secrets without logging it.
4. Add the GitHub service-role secret through GitHub's encrypted secret store.
5. Deploy caller support and ledger writes while legacy authorization remains temporarily accepted.
6. Update the production cron to use the Vault-backed secret and verify one scheduled-auth dry run without delivery.
7. Switch the funnel and sender to strict authorization in one maintenance window.
8. Run negative authorization tests, one explicit manual delivery, and one idempotent duplicate test.
9. Enable the safe external gate and observe two actual scheduled Mondays.
10. Close `AR-405` and `AR-406` only after the durable evidence passes.

## Current blocker

The historical migration chain now replays locally through all 76 migrations, and the focused outbox/linkage security suites pass. The read-only remote comparison found 67 recorded versions, populated foundational objects, and no prepared outbox/linkage objects. Because staging apps share the production Supabase project, implementation requires explicitly approved historical-ledger reconciliation, backups, and ordered production application—or a separate isolated clone if one becomes available. Vault configuration, strict endpoint cutover, and GitHub secret changes belong to one coordinated rollout after the operator authorizes those secret-bearing external changes.
