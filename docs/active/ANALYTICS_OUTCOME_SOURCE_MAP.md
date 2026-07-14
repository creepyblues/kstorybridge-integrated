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
| Title approved | `title_drafts.status=approved` | `title_drafts.approved_at` | Reserved `title_approved` | High for the record; server emission is not implemented. |
| Title published/available | New row in `public.titles` inserted by `approve-title` | `titles.created_at` | Reserved `title_published` | Medium. The prepared additive linkage makes this reconcilable, but it is not production-live and the production `titles` table has no `status` or `published_at` column. |
| Buyer interest submitted | `public.title_interests.id` and `title_id` | `title_interests.created_at` | `interest_submitted` | High for creation. The server uses the unique buyer/title constraint as the dedupe gate and returns `created=false` when it only refreshes an existing note; only `created=true` emits GA and team notifications. Canonical client emission is implemented but not yet released. The table has no `updated_at`, `contacted_at`, or `closed_at`. |
| Buyer interest advanced | `title_interests.status` (`new`, `contacted`, `in_discussion`, `closed`) | None beyond original `created_at` | No reliable transition event yet | Gap. Status-transition timestamps are absent. |
| Introduction requested | No production table or field found | None | `introduction_requested` reserved only | Gap. This must not be reported as a completed business outcome yet. |
| Introduction completed | No production table or field found | None | `introduction_completed` reserved only | Gap. This must not be reported as a completed business outcome yet. |
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
- `trial_sessions` includes `converted`, `converted_at`, `user_id`, activity counters, `first_visit_at`, and `last_activity_at`.
- `stripe_customers`, `creator_subscriptions`, and `creator_payments` exist.
- Legacy buyer `subscriptions` and `payments` relations referenced by some older code do not exist in the production REST schema.

## Required remediation before full reconciliation

1. Define buyer approval, then persist an approval status and timestamp.
2. Persist `published_title_id` on the approved draft or a dedicated draft-to-title mapping.
3. Add timestamps for interest status transitions if contacted/in-discussion/closed durations matter.
4. Create an authoritative introduction workflow table before instrumenting introduction outcomes.
5. Choose whether Stripe remains the sole buyer-payment ledger or add a webhook-written buyer payment table.
6. Retire or repair older code paths that still query the nonexistent buyer `subscriptions` relation.
7. Repair or safely supersede the historical migration-reset blocker, apply the prepared analytics outbox, configure the GA Measurement Protocol API secret, deploy the webhook/worker chain in order, schedule delivery, and validate debug plus reconciliation results.

These gaps do not block clean traffic reporting, auth funnels, or creator subscription reconciliation. They do block honest claims about buyer approval, introductions, draft-to-publication latency, and locally reconciled buyer payments.

## Signup reconciliation operating rule

The scheduled funnel report counts buyer and creator profiles in the same America/Los_Angeles calendar window as GA4 and excludes active administrators. GA users are assigned to account type by production hostname, so the comparison works before `account_type` is registered as a GA custom dimension.

The report enforces the 5% acceptance tolerance only after `ANALYTICS_AUTH_CONTRACT_LIVE_AT` predates the complete reporting window. Before that point, the canonical events have incomplete production coverage: Supabase remains authoritative, the report labels the comparison `Instrumentation pending`, and it suppresses signup-completion alerts rather than interpreting missing GA events as missing customers.

## Creator title workflow reconciliation rule

The scheduled report uses event counts rather than users because one creator can create and submit multiple titles. The authoritative timestamp for each stage is:

- draft created: `title_drafts.created_at`
- submitted: `title_drafts.submitted_at`
- approved: `title_drafts.approved_at`
- catalog created proxy: `titles.created_at`

Active admin creators are excluded. Client drift enforcement begins only after `ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT` predates the full window; approval/publication enforcement separately requires `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT`.

The publication row is intentionally marked `Draft-to-title linkage pending`. The current production schema cannot prove that a particular approved draft created a particular catalog title, so the proxy is operational context—not a reconciled publication conversion—even when aggregate counts happen to match.

An additive migration is prepared at `supabase/migrations/20260714001452_link_title_drafts_to_publications.sql`. It adds `title_drafts.published_title_id` and `titles.source_draft_id`, and the accompanying `approve-title` source recovers a prior catalog insert instead of creating a duplicate. Isolated validation passes, but this is not production evidence: the migration and function must remain undeployed until the older root migration-history blocker is repaired or safely superseded and a complete local reset passes.
