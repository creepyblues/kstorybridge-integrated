# GA4 Custom Definitions Plan

**Property:** `496541587`

**Status:** Registration blocked pending an Analytics-scoped credential and founder activation decisions

**Updated:** 2026-07-13

## Decision rule

Register a parameter only when it answers a recurring product or business question that cannot be answered with a predefined GA dimension, an event name, a production hostname, or the authoritative Supabase/Stripe record. All definitions below are event-scoped and low-cardinality. Do not register UUIDs, timestamps, URLs, names, free text, or other identifiers.

GA standard properties allow 50 event-scoped custom dimensions. A definition normally becomes reportable 24–48 hours after the parameter is sent and the definition exists. High-cardinality definitions can collapse reporting into the `(other)` row, while archiving is irreversible and can invalidate dependent audiences, explorations, segments, and reports. Sources: [Google custom-dimension guidance](https://support.google.com/analytics/answer/14240153), [event-scoped setup](https://support.google.com/analytics/answer/14239696), and [archive behavior](https://support.google.com/analytics/answer/12436143).

## Proposed minimal set

These definitions are candidates, not a claim that they already exist. First inventory the property and avoid duplicates.

| Priority | Display name | Event parameter | Why it earns a slot | Expected values |
|---|---|---|---|---|
| Now | Account Type | `account_type` | Compare buyer and creator auth/commercial funnels without relying on hostname in every query. | `buyer`, `creator` |
| Now | Authentication Method | `method` | Compare email and Google attempt-to-completion performance. | `email`, `google` |
| Now | Authentication Failure Reason | `failure_reason` | Diagnose controlled auth drop-off reasons without raw errors. | Contract allowlist only |
| Now | Creator Entry Method | `entry_method` | Compare full and Quick Add draft-to-submission performance. | `full`, `quick_add` |
| Now | Plan Type | `plan_type` | Compare server-confirmed Checkout starts by buyer/creator offering and support future webhook-confirmed subscriptions. | `pro`, `suite`, `packaging`, `premium` |
| Now | Billing Period | `billing_period` | Compare server-confirmed Checkout starts by billing commitment. | `monthly`, `yearly` |
| After `AR-001`–`AR-004` | Product Source | `source` | Segment canonical buyer engagement by controlled entry surface when that segmentation changes a product decision. | Contract-controlled values |
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
3. Record the property retention setting during the GA inventory before closing `AR-208`.
4. Do not promise historical custom-dimension analysis; allow a 24–48 hour processing window after registration and validate with post-registration events.

## Current access evidence and unblock

On 2026-07-13, Application Default Credentials were present but contained only `cloud-platform`, SQL login, identity, and email scopes. Both the GA Data API report probe and GA Admin API custom-dimension list returned HTTP 403 with `ACCESS_TOKEN_SCOPE_INSUFFICIENT`. No signed-in in-app browser session was available.

Before any write, obtain a credential with Analytics access and verify the user's property role. A property Editor or Administrator is required to create event-scoped definitions. The preferred least-risk sequence is:

1. Re-authenticate ADC with `analytics.readonly` first and list existing definitions plus property retention.
2. Review the proposed set against the founder decisions in `AR-001`–`AR-004` and remove anything without a named report or decision.
3. Add `analytics.edit` only for the approved creation step.
4. Create missing definitions idempotently, record their GA resource names, and run post-registration Data API probes after 24–48 hours.

If the Google Cloud SDK OAuth client is blocked again, use a Google Cloud OAuth **Desktop app** client owned by KStoryBridge and pass its downloaded client JSON with `gcloud auth application-default login --client-id-file=PATH`. Do not commit that JSON or print access tokens.

## Acceptance evidence required for `AR-208`

- Existing active and archived definitions inventoried from property `496541587`.
- Property retention setting recorded.
- Founder-approved minimal list reconciled with the existing inventory.
- Missing definitions created with event scope and documented GA resource names.
- Data API confirms each created dimension is queryable after processing.
- No high-cardinality or sensitive parameter is registered.
