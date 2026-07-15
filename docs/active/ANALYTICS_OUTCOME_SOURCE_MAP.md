# Analytics Outcome Source Map

**Status:** Active

**Verified:** 2026-07-13 against the production PostgREST schema, current migrations, and active edge-function source

This map defines the authoritative record used to reconcile GA events. A GA event is a behavioral signal; Supabase or Stripe remains the source of truth for completed business outcomes.

## Reconciliation keys

- Authenticated GA `user_id` equals the Supabase Auth UUID.
- Buyer profile records join by `user_buyers.id`; creator profile records join by `user_creators.id`.
- Titles join by `title_id`; drafts join by `title_drafts.id`.
- Interest records join by `title_interests.id` when the server response exposes it. Email is retained in Supabase but must never be copied to GA.
- Buyer Stripe records join by `stripe_customers.user_id`. Existing creator subscription records retain creator email and title ID, while the prepared webhook/outbox path resolves the Supabase creator UUID from Stripe metadata with a controlled profile fallback. Neither email nor Stripe identifiers may be sent to GA.

## Outcome mapping

| Outcome | Authoritative system and record | Authoritative timestamp | GA reconciliation event | Current confidence |
|---|---|---|---|---|
| Buyer signup completed | `public.user_buyers.id` | `user_buyers.created_at` | `signup_completed` where `account_type=buyer` | High. The signup helper returns only after Auth and buyer-profile creation succeed. |
| Buyer approved | No dedicated production column exists on `user_buyers`; `invitation_status`, `status`, and `approved_at` are absent. | None | Not instrumentable yet | Gap. Founder must define approval semantics and engineering must add an authoritative field or table before this becomes a KPI. |
| Creator signup/profile created | `public.user_creators.id` | `user_creators.created_at` | `signup_completed` where `account_type=creator` | High. Email signup returns after the creator profile is stored; OAuth completes after profile creation. |
| Creator OAuth profile completed | `public.user_creators.id` | `user_creators.created_at` or profile write response time | `creator_profile_completed` | High for occurrence; a dedicated completion timestamp does not exist. |
| Trial first visit | `public.trial_sessions.session_id` | `first_visit_at` (fallback `created_at`) | `trial_page_view` | High for Supabase; anonymous GA/session linkage must use non-PII session logic and is not yet reconciled. |
| Trial activity | `public.trial_sessions` counters and `tools_used` | `last_activity_at` | Canonical trial tool events | High for aggregate activity. Freeform last-query fields are prohibited from GA. |
| Trial converted to signup | `trial_sessions.converted=true`, joined through `trial_sessions.user_id`; buyer profile stores `trial_session_id` | `trial_sessions.converted_at` | `signup_completed` plus trial attribution | High when both link fields are populated. |
| Title draft created | `public.title_drafts.id` with `status=draft` | `title_drafts.created_at` | `title_draft_created` | High. Client emission is implemented and tested on `v2`, but not production-live. |
| Title submitted | `title_drafts.status=submitted` | `title_drafts.submitted_at` | `title_submitted` | High. Client emission is implemented and tested on `v2`, but not production-live. |
| Title approved | `title_drafts.status=approved` with `published_title_id` | `title_drafts.approved_at` | `title_approved` through the prepared service-only outbox | High locally. Fresh, recovered, and repeated approvals enqueue idempotently after durable linkage; production remains on the old schema/function. |
| Title published/available | `title_drafts.published_title_id` joined to `titles.source_draft_id` | The linked draft's `approved_at`, when availability becomes durable | `title_published` through the prepared service-only outbox | High locally. Bidirectional linkage and atomic paired enqueue pass acceptance tests, but neither is production-live. The production `titles` table still has no `status` or `published_at` column. |
| Buyer title shortlisted | `public.user_favorites` unique buyer/title row | `user_favorites.created_at` | `favorite_added` | Medium for repeatable product behavior, not yet durable enough for activation. Removing a favorite deletes the row and erases the historical first-shortlist fact; persist an immutable activation milestone before using this as the authoritative activation KPI. |
| Buyer interest submitted | `public.title_interests.id` and `title_id` | `title_interests.created_at` | `interest_submitted` | High for creation. The server uses the unique buyer/title constraint as the dedupe gate and returns `created=false` when it only refreshes an existing note; only `created=true` emits GA and team notifications. Canonical client emission is implemented but not yet released. The table has no `updated_at`, `contacted_at`, or `closed_at`. |
| Buyer interest advanced | `title_interests.status` (`new`, `contacted`, `in_discussion`, `closed`) | None beyond original `created_at` | No reliable transition event yet | Gap. Status-transition timestamps are absent. |
| Introduction requested | Historical `public.request` rows with `type=contact` exist, but the current active interest/contact surfaces do not durably write a request workflow | `request.created_at` is historical request time only | `introduction_requested` reserved only | Gap. Production has one historical contact row, but no approved semantics or current authoritative write boundary. It must not be backfilled or reported as a canonical introduction. |
| Introduction completed | No production status, transition, or completion timestamp exists; legacy `request` has no completion fields | None | `introduction_completed` reserved only | Gap. This must not be reported as a completed business outcome. |
| Buyer subscription active | Stripe subscription confirmed by the buyer webhook, joined to `public.stripe_customers.user_id`; `user_buyers.tier` is the entitlement projection | Stripe subscription start/event time is authoritative; the prepared outbox persists `occurred_at` once released | `subscription_started` after webhook confirmation | Medium-high. A durable deduplicated outbox path is prepared and tested on `v2`, but is not production-live. Plan/billing-period fields remain absent from `stripe_customers`, and the old `subscriptions` relation does not exist in production. |
| Buyer payment completed | Stripe invoice/payment object | Stripe event timestamp | Future server-side payment event | External only. The old `payments` relation does not exist in production. |
| Creator subscription active | `public.creator_subscriptions.id`, `status`, `plan_type`, `billing_period`, `title_id`; the prepared webhook/outbox path resolves the creator UUID for GA identity | `created_at` and `current_period_start`; the prepared outbox persists the Stripe occurrence time | `subscription_started` after creator webhook confirmation | High for the local outcome. Durable GA delivery is prepared and tested on `v2`, but is not production-live. |
| Creator payment completed | `public.creator_payments.id` and subscription reference | `creator_payments.created_at` | Future server-side payment event | High for locally recorded payments. |

## Verified production schema facts

The production schema was probed with zero-row PostgREST selects, so no customer records or PII were read.

- `user_buyers` currently includes `id`, `email`, `tier`, `created_at`, `updated_at`, `last_active_at`, `trial_session_id`, and `newsletter_consent`; it does not include `invitation_status`, `status`, or `approved_at`.
- `user_creators` includes `id`, `email`, `invitation_status`, `created_at`, `updated_at`, and `last_active_at`.
- `title_drafts` includes workflow status plus `submitted_at`, `approved_at`, and `rejected_at`, but no `title_id` or `published_title_id` linking an approved draft to the created title.
- `titles` includes `title_id`, `creator_id`, `created_at`, and `updated_at`; it does not include `status` or `published_at`.
- `title_interests` includes `status` and `created_at`, but no transition timestamps.
- Legacy `request` exists with `id`, `user_id`, `title_id`, `type`, and `created_at`. A privacy-safe exact-count audit found eight historical rows (seven pitch, one contact) from 2025-09-24 through 2025-10-09, but no status or completion fields. See [ANALYTICS_INTRODUCTION_SOURCE_AUDIT_2026-07-13.md](ANALYTICS_INTRODUCTION_SOURCE_AUDIT_2026-07-13.md).
- `trial_sessions` includes `converted`, `converted_at`, `user_id`, activity counters, `first_visit_at`, and `last_activity_at`.
- `stripe_customers`, `creator_subscriptions`, and `creator_payments` exist.
- Legacy buyer `subscriptions` and `payments` relations referenced by some older code do not exist in the production REST schema.

## Required remediation before full reconciliation

1. Define buyer approval, then persist an approval status and timestamp.
2. Release and production-verify the prepared `published_title_id` / `source_draft_id` linkage and authenticated approval boundary.
3. Add timestamps for interest status transitions if contacted/in-discussion/closed durations matter.
4. Replace or explicitly reconcile the legacy `request` table with one authoritative current introduction workflow before instrumenting introduction outcomes; do not reinterpret its historical contact row.
5. Choose whether Stripe remains the sole buyer-payment ledger or add a webhook-written buyer payment table.
6. Retire or repair older code paths that still query the nonexistent buyer `subscriptions` relation.
7. With explicit approval, reconcile the nine missing historical ledger versions without replaying their SQL against populated production, back up affected tables, prepare server-only report credentials, and apply the five current migrations through the authenticated report schedule and title-workflow extension. Then configure the GA Measurement Protocol API secret, deploy both report boundaries and the webhook/worker/approval chain in their coordinated order, schedule delivery, and validate debug plus reconciliation results.
8. Persist an immutable first-shortlist milestone before adopting saved-title behavior as the buyer activation source of truth; deleting `user_favorites` must not erase activation history.

These gaps do not block clean traffic reporting, auth funnels, or creator subscription reconciliation. They do block honest claims about buyer approval, introductions, draft-to-publication latency, and locally reconciled buyer payments.

## Signup reconciliation operating rule

The scheduled funnel report counts buyer and creator profiles in the same America/Los_Angeles calendar window as GA4 and excludes active administrators. GA users are assigned to account type by production hostname, so the comparison works before `account_type` is registered as a GA custom dimension.

The report enforces the 5% acceptance tolerance only after `ANALYTICS_AUTH_CONTRACT_LIVE_AT` predates the complete reporting window. Before that point, the canonical events have incomplete production coverage: Supabase remains authoritative, the report labels the comparison `Instrumentation pending`, and it suppresses signup-completion alerts rather than interpreting missing GA events as missing customers.

## Creator title workflow reconciliation rule

The scheduled report uses event counts rather than users because one creator can create and submit multiple titles. The authoritative timestamp for each stage is:

- draft created: `title_drafts.created_at`
- submitted: `title_drafts.submitted_at`
- approved: `title_drafts.approved_at`
- published/available: linked `title_drafts.approved_at` where `published_title_id` is non-null

Active admin creators are excluded. Client drift enforcement begins only after `ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT` predates the full window; approval/publication enforcement separately requires `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT`.

The publication row remains `Draft-to-title linkage pending` until the server live-at gate covers the complete reporting window. After the coordinated linkage/function release, the same gate enables comparison against linked approved drafts; aggregate `titles.created_at` is no longer used as a publication proxy.

Additive migrations are prepared at `20260714001452_link_title_drafts_to_publications.sql` and `20260714042851_extend_analytics_outbox_title_workflow.sql`. They add bidirectional linkage and atomic, deduplicated approval/publication enqueue; `approve-title` also recovers a prior catalog insert, authenticates the active admin, and refuses success until enqueue is durable. A complete 79-migration reset, five SQL suites, 53 focused analytics tests, and three Edge Function checks pass. This is not production evidence: schema must precede the coordinated function release, authenticated approval/retry and GA debug checks, and the real server live-at timestamp.
