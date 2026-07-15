# GA4 Custom Definitions Plan

**Property:** `496541587`

**Status:** Live inventory complete; cleanup/registration pending approval and edit authority

**Updated:** 2026-07-13

## Decision rule

Register a parameter only when it answers a recurring product or business question that cannot be answered with a predefined GA dimension, an event name, a production hostname, or the authoritative Supabase/Stripe record. All definitions below are event-scoped and low-cardinality. Do not register UUIDs, timestamps, URLs, names, free text, or other identifiers.

GA standard properties allow 50 event-scoped custom dimensions. A definition normally becomes reportable 24–48 hours after the parameter is sent and the definition exists. High-cardinality definitions can collapse reporting into the `(other)` row, while archiving is irreversible and can invalidate dependent audiences, explorations, segments, and reports. Sources: [Google custom-dimension guidance](https://support.google.com/analytics/answer/14240153), [event-scoped setup](https://support.google.com/analytics/answer/14239696), and [archive behavior](https://support.google.com/analytics/answer/12436143).

## Proposed minimal set

The 2026-07-13 live inventory confirms none of the six `Now` parameters below is registered. Existing legacy `user_type` overlaps semantically with `account_type`, but the production contract uses `account_type`; do not silently alias or combine them.

| Priority | Display name | Event parameter | Why it earns a slot | Expected values |
|---|---|---|---|---|
| Now | Account Type | `account_type` | Compare buyer and creator auth/commercial funnels without relying on hostname in every query. | `buyer`, `creator` |
| Now | Authentication Method | `method` | Compare email and Google attempt-to-completion performance. | `email`, `google` |
| Now | Authentication Failure Reason | `failure_reason` | Diagnose controlled auth drop-off reasons without raw errors. | Contract allowlist only |
| Now | Creator Entry Method | `entry_method` | Compare full and Quick Add draft-to-submission performance. | `full`, `quick_add` |
| Now | Plan Type | `plan_type` | Compare server-confirmed Checkout starts by buyer/creator offering and support future webhook-confirmed subscriptions. | `pro`, `suite`, `packaging`, `premium` |
| Now | Billing Period | `billing_period` | Compare server-confirmed Checkout starts by billing commitment. | `monthly`, `yearly` |
| After Wave 2 / `AR-210` | CTA Position | `cta_position` | Compare hero, final, header, mobile-menu, feature-card, and inquiry-form handoffs after the website contract has a complete production window. | Contract-controlled values |
| After Wave 2 / `AR-210` | Feature Name | `feature_name` | Compare which promoted buyer capability produces a trial or signup handoff. | `chat`, `comps`, `mandates` |
| After Wave 2 / `AR-210` | Product Source | `source` | Distinguish controlled website and product entry surfaces; this event parameter is not GA's predefined acquisition source and may later support approved buyer-engagement analysis. | Contract-controlled values |
| After `AR-001`–`AR-004` | Chat Input Type | `input_type` | Determine whether typed, suggested, or linked chat entry correlates with activation/return use. | Controlled enum |
| After `AR-001`–`AR-004` | Message Length Bucket | `message_length_bucket` | Analyze engagement depth without collecting chat text or exact lengths. | Fixed buckets |
| After `AR-001`–`AR-004` | Pitch Access Type | `access_type` | Compare preview and full pitch-deck engagement. | `preview`, `full` |

Numerical `filter_count`, `input_count`, and `page_number` should be evaluated as custom metrics, not categorical dimensions, only if a named operating report requires them.

## Explicitly do not register

- `title_id`, `draft_id`, `user_id`, session IDs, timestamps, or recipient IDs: high-cardinality identifiers do not belong in custom dimensions.
- `campaign_source`, `campaign_medium`, `campaign_name`, or `landing_path`: use GA's predefined traffic-source and page dimensions.
- `app_section`: clean production reporting already uses the predefined `hostName`; register only if a future cross-environment report proves hostname insufficient.
- `traffic_type`: it exists to support GA internal-traffic filtering, not product segmentation.
- `engagement_method`: it validates trusted email interaction but does not currently drive a recurring business decision.
- Any free text, title name, search query, chat content, URL, email address, company, creator name, or raw error.

## Retention implications

Registering a definition does not create a separate durable source of truth. KStoryBridge should continue using Supabase and Stripe for authoritative outcomes and GA for behavioral segmentation. For a standard GA4 property, granular user/event retention can be configured up to 14 months; the retention setting affects explorations and funnels, while standard aggregated reporting is treated differently. Source: [Google Analytics data-retention guidance](https://support.google.com/analytics/answer/7667196).

The operational policy is therefore:

1. Use only controlled, low-cardinality values.
2. Keep stable business outcomes in Supabase/Stripe reconciliation.
3. The current property setting is two months with reset-on-activity enabled. Decide whether to increase it to 14 months prospectively; Supabase remains the authoritative retention source either way.
4. Do not promise historical custom-dimension analysis; allow a 24–48 hour processing window after registration and validate with post-registration events.

## Current live inventory and access evidence

On 2026-07-13, the default unscoped ADC token still returned `ACCESS_TOKEN_SCOPE_INSUFFICIENT`. The existing read-only service-account file succeeds when `analytics.readonly` is explicitly requested. GA Admin and Data API calls then verified the property, streams, 15 custom dimensions, four custom metrics, 11 key events, two-month retention, and 90-day definition usage. The service account cannot list property access bindings, so Editor/Administrator authority is not inferred. Full results are in [GA4_PROPERTY_AUDIT_2026-07-13.md](GA4_PROPERTY_AUDIT_2026-07-13.md).

The most urgent finding is registered `title_name`: 328 events across 60 values in 90 days and 32 events in the latest seven days. `search_id` is also registered despite being a prohibited high-cardinality identifier, although it had no events in the window. The prepared shared client sanitizer stops both fields and other unreviewed parameters at the sink, but remains unreleased.

Before any write, obtain a credential with Analytics access and verify the user's property role. A property Editor or Administrator is required to create event-scoped definitions. The preferred least-risk sequence is:

1. Use the service account with an explicitly scoped `analytics.readonly` token for repeatable inventory; never print or persist the token.
2. Review the proposed set and the legacy-definition dependency inventory against the founder decisions in `AR-001`–`AR-004`.
3. Add `analytics.edit` only for the approved creation step.
4. Create missing definitions idempotently, record their GA resource names, and run post-registration Data API probes after 24–48 hours.

If the Google Cloud SDK OAuth client is blocked again, use a Google Cloud OAuth **Desktop app** client owned by KStoryBridge and pass its downloaded client JSON with `gcloud auth application-default login --client-id-file=PATH`. Do not commit that JSON or print access tokens.

## Acceptance evidence required for `AR-208`

- Existing current definitions are inventoried from property `496541587`; any UI-only archived-definition history still requires manual confirmation.
- Property retention is recorded as two months with reset-on-activity enabled.
- Founder-approved minimal list reconciled with the existing inventory.
- Missing definitions created with event scope and documented GA resource names.
- Data API confirms each created dimension is queryable after processing.
- No high-cardinality or sensitive parameter is registered.
