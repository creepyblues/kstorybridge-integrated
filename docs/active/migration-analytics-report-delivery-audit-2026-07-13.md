# Analytics Report Delivery Audit Migration - 2026-07-13

## Status: READY_FOR_PRODUCTION_APPROVAL
## Last Updated: 2026-07-13
## Safe to Apply: ONLY_AS_COORDINATED_CUTOVER

## Purpose

The existing Monday funnel report can deliver email and Slack, but it cannot prove that the scheduler initiated a run, distinguish manual delivery, suppress duplicate recipient sends, or retain two-run evidence. The public anon token can also invoke the funnel endpoint and proxy a send.

Two additive migrations and coordinated function/caller changes prepare `AR-406` without changing production:

- `20260714035054_analytics_report_delivery_audit.sql` creates the PII-free run and recipient-delivery ledger plus controlled RPCs.
- `20260714041207_schedule_authenticated_analytics_report.sql` replaces the legacy anon cron command with a Vault-backed dedicated header and removes client access to cron command text.
- `funnel-report-cron` derives `scheduled` only from the exact cron secret and derives `manual` only from the exact service-role key.
- `send-analytics-report` requires the exact service-role key, snapshots active admin IDs, claims each delivery, retries only unsent/failed channels, and persists controlled aggregate results.
- Local/GitHub progress callers feature-detect the ledger, fail closed without the service-role key after cutover, and use trigger kinds that never count toward `AR-405`.

## Data and privacy invariants

- No email, report body, alert text, provider response/ID, URL, token, webhook, secret, or raw exception is stored in either audit table.
- Detailed tables and mutation RPCs are service-role-only with forced RLS and no client policies.
- The public safe-status RPC exposes only invocation key, controlled type/trigger/status, window dates, aggregate counts, controlled error codes, and timestamps.
- Recipient rows store only stable admin UUIDs. Slack uses one null-admin row per run.
- `scheduled`, `manual`, `local_progress`, and `github_progress` are distinct database constraints, not caller-supplied labels accepted by an endpoint.
- A run succeeds only with at least one expected admin, all expected emails sent, zero email failures, no pending delivery, and requested Slack sent.

## Idempotency and recovery

- Unique `invocation_key` claims one logical report run.
- An active or succeeded duplicate returns the existing run without executing.
- Partial/failed runs can retry; sent recipient/channel rows are never claimed again.
- A pending provider attempt is reclaimable only after 15 minutes; generation/delivery runs are reclaimable only after 30 minutes.
- Provider failures persist controlled codes. Raw provider bodies and exception strings are discarded.
- The progress gate considers only the latest two `scheduled` rows. Manual and progress deliveries cannot satisfy `AR-405`.

## Local acceptance evidence

Completed on 2026-07-13:

- The pinned Supabase CLI replays all 79 root migrations through `20260714042851`.
- Database tests cover new/duplicate run claims, recipient snapshot dedupe, one-send behavior, partial email failure, retry-only-failed behavior, successful finalization, stale generation/delivery reclaim, conflicting invocation rejection, forced RLS, grants, forbidden-column absence, and safe status separation.
- Schedule tests require exactly one active Monday job, a runtime Vault lookup, no Authorization/Bearer/JWT material in `cron.job`, and no client access to cron command text.
- HTTP boundary checks return 403 for missing, anon, and wrong credentials. Exact service-role sender requests reach payload validation; exact service-role and dedicated-secret funnel requests reach the authenticated path.
- Twenty focused authorization, caller, external-gate, provider-state, and credential-classification tests pass.
- Both modified Edge Functions pass Deno type checking.

## Production preflight — not executed

1. Obtain explicit approval for production migration-history, schema, cron, function, Vault, and GitHub-secret changes.
2. Reconcile the nine historical migration ledger versions as documented; do not replay their SQL against populated production.
3. Back up `title_drafts` and `titles`, record aggregate counts for all touched business tables, and export the current `weekly-funnel-report` cron metadata without exposing credential material.
4. Generate one random cron secret outside version control. Store the same value in Vault as `analytics_funnel_cron_secret` and in Edge Function secrets as `ANALYTICS_FUNNEL_CRON_SECRET` without printing it.
5. Add `SUPABASE_SERVICE_ROLE_KEY` to GitHub Actions encrypted secrets and configure the local fallback cron through a user-only secure environment source.
6. Apply the five current additive/operational migrations through `20260714042851` during a non-cron maintenance window, preserving chronological order.
7. Deploy `send-analytics-report` and `funnel-report-cron` together. Do not leave only one strict boundary live.
8. Require 403 from anon/user/missing/wrong credentials; run one service-role manual report and repeat its invocation key to prove no duplicate recipient sends.
9. Verify the secure cron command, safe status RPC, unchanged business row counts, email/Slack results, and absence of PII/raw errors in audit rows.
10. Observe two real Monday `scheduled` successes before closing `AR-405`. Local, GitHub, and manual runs never substitute for this observation.

## Rollback

If the cutover fails, use [rollback-analytics-report-delivery-audit-2026-07-13.sql](rollback-analytics-report-delivery-audit-2026-07-13.sql) to pause the cron and revoke the public aggregate status surface, then roll back both Edge Functions/callers as a unit. The rollback preserves all audit schema and evidence. Do not restore the anon proxy. Resume scheduling only with a reviewed server-side credential path. Any later schema removal requires a separate dependency audit and deprecation migration.
