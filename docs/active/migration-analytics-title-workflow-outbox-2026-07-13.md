# Analytics Title Workflow Outbox Extension - 2026-07-13

## Status: READY_FOR_PRODUCTION_APPROVAL
## Last Updated: 2026-07-13
## Safe to Follow: WITH_CAUTION

## Overview

Migration `20260714042851_extend_analytics_outbox_title_workflow.sql` adds one service-role-only RPC that atomically enqueues `title_approved` and `title_published` after an approved draft is durably linked to its catalog title. The RPC accepts UUIDs, a controlled traffic classification, and the authoritative occurrence time; it constructs the exact GA payload and never accepts title names, admin identity, URLs, or free text.

The updated `approve-title` boundary authenticates the bearer token, requires the same active administrator ID in the request and database, and routes fresh approval, linkage recovery, and already-complete retry through one analytics finalizer before returning success. A failed analytics enqueue returns a retryable 500 after the durable business outcome; the next approval call uses the same dedupe keys and timestamps.

## Local acceptance evidence

- A clean replay of all 79 root migrations passes.
- `analytics_title_workflow_outbox.sql` proves exact two-row payloads, atomic rollback, stable duplicate IDs, conflicting-identity rejection, and anon/authenticated denial.
- The full five-file SQL acceptance suite passes.
- Fifty-three focused analytics, authorization, reconciliation, and approval-boundary tests pass.
- `approve-title`, `deliver-analytics-outbox`, and `funnel-report-cron` pass Deno type checking with the Edge Function configuration.
- Publication reconciliation now counts approved drafts with a non-null `published_title_id` at `approved_at`; enforcement and linkage status remain gated by `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT`.

This is source and local-database evidence only. Production schema, functions, secrets, GA delivery, and live-at gates are unchanged.

## Production order — not executed

1. Obtain explicit approval and complete the historical-ledger reconciliation and backups in the root-history runbook.
2. Apply draft/publication linkage and the base analytics outbox before this extension.
3. Apply this migration and verify its function owner, grants, exact signature, and unchanged row counts.
4. Deploy the payload validator/delivery worker and secured `approve-title` together; do not deploy `approve-title` first.
5. Verify missing, malformed, mismatched, inactive, and non-admin calls cannot read or mutate a draft.
6. Perform one authenticated approval and retry, verify exactly two outbox rows, then validate both events through Google's Measurement Protocol debug endpoint.
7. Enable authenticated delivery, reconcile GA with linked approved drafts, and set `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT` only to the actual complete production cutover time.

## Rollback

Use `rollback-analytics-title-workflow-outbox-2026-07-13.sql` to revoke new enqueue execution, and roll back `approve-title` plus the worker payload extension. Preserve the additive columns, RPC, table, and all queued/delivered rows as audit evidence. Never delete outbox rows or unlink approved titles during incident rollback.
