# Analytics Event Outbox Migration - 2026-07-13

## Status: IN_PROGRESS
## Last Updated: 2026-07-13
## Safe to Follow: WITH_CAUTION

## Overview

This additive migration creates a service-role-only outbox for durable, idempotent delivery of server-confirmed analytics events. The first supported outcome is `subscription_started`, deduplicated by account type and Stripe subscription ID. A controlled RPC constructs the payload so email, Stripe IDs, session IDs, title IDs, URLs, and free text cannot be sent to GA.

The outbox separates Stripe webhook correctness from GA network availability: after the webhook writes the authoritative subscription state, it idempotently enqueues the analytics outcome. A separate worker atomically claims and retries delivery. If enqueue fails, the webhook fails so Stripe can retry the idempotent path.

## Prerequisites

- Migration file: `supabase/migrations/20260714011558_analytics_event_outbox.sql`
- Docker running for local Supabase validation.
- No production application until local reset, concurrency, RLS, and retry tests pass.
- Measurement Protocol API secret created for GA stream `G-DWL6MV0MC2` and stored only as an Edge Function secret.
- Delivery function must be deployed only after the migration exists.

## Current validation result

Validated locally on 2026-07-13:

- Migration applies and can be reapplied safely to the local Supabase PostgreSQL database.
- `supabase/tests/analytics_event_outbox.sql` passes for dedupe, allowlisted payload construction, invalid-plan rejection, claim, completion, retry, stale recovery, RLS, and role grants.
- Two simultaneous database sessions proved `FOR UPDATE SKIP LOCKED` prevents the same row from being claimed twice.
- Anonymous table access and authenticated claim-RPC access both fail with permission denied.
- Nine focused TypeScript tests pass, new shared/worker modules pass Deno checking, and the worker returns 405 for non-POST, 401 for the wrong bearer token, and 503 when its GA secret is absent.

The required full `npx supabase db reset` is not yet green. It stops in the older `20251104120000_add_admin_policy_to_title_drafts.sql` migration because `public.title_drafts` does not exist at that point in the historical chain. Root-cause review found that the root migration directory never creates either `public.title_drafts` or its policy dependency `public.admin`; those definitions exist only in archived dashboard migrations and a one-off production SQL file. A normal current migration cannot repair an earlier failure in a clean replay, while backdating a migration or rewriting an applied migration would require an explicit migration-history decision. The outbox migration was therefore tested directly against the local database after that failure, but must not be applied to production until the complete reset path is repaired and rerun.

The production Supabase secret inventory was checked by name only. `GA4_MEASUREMENT_PROTOCOL_API_SECRET` and `GA4_MEASUREMENT_PROTOCOL_DEBUG` are not configured; no secret values were read or logged. The code's measurement-ID default is `G-DWL6MV0MC2`.

## Steps

1. Start Docker and run `npx supabase db reset` from the repository root.
2. Verify `analytics_event_outbox` exists with RLS enabled and no anon/authenticated policy.
3. Call `enqueue_subscription_started` twice with the same subscription key and verify one row and one returned ID.
4. Reject invalid account, plan, billing, currency, value, and dedupe inputs.
5. Reject invalid traffic classification and verify `app_section` is derived from account type.
6. Run concurrent `claim_analytics_event_outbox` calls and verify no row is claimed twice.
7. Verify completion, retry backoff, and stale-processing recovery.
8. Deploy webhook enqueue code after the schema is present.
9. Configure the Measurement Protocol secret, deploy the delivery worker, validate against Google's debug endpoint, then enable production delivery.
10. Schedule authenticated worker invocation and monitor pending, failed, stale-processing, and delivered counts.

## Verification

- Anonymous and authenticated clients cannot select from the table or execute its RPCs.
- Only the service role can enqueue, claim, complete, or retry rows.
- `event_params` contains only `account_type`, `app_section`, `traffic_type`, `plan_type`, `billing_period`, `currency`, and `value`.
- Measurement Protocol delivery derives a fixed production `page_location` from `account_type`; it never accepts a user-provided URL. This makes the server event visible to the report's production-host filter.
- Buyer and creator events use `subscription_started:{account_type}:{stripe_subscription_id}` as the unique key, while the Stripe identifier itself never enters `event_params`.
- An active subscription retry does not create a second outbox row.
- A crashed worker's `processing` row becomes claimable after 15 minutes.
- Failed delivery stores only a controlled error code, never a raw response or secret-bearing URL.
- Production Measurement Protocol can return 2xx for malformed payloads. Use the debug endpoint before production mode and reconcile GA Data API results afterward. Network ambiguity between GA acceptance and local acknowledgement means external delivery is at-least-once, not guaranteed exactly-once.

## Rollback

Stop or roll back the delivery worker and webhook enqueue calls first. Leave the additive table and functions in place during emergency rollback; they do not affect existing product reads or writes. Do not drop the table. If removal is eventually required, deprecate it, observe for at least 30 days, back it up, and use a separately reviewed migration.
