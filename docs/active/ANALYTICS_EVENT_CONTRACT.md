# KStoryBridge Analytics Event Contract

**Status:** Active contract

**Technical owner:** Engineering

**Business owner:** Founder / product

**Reporting owner:** Analytics operations

**Canonical source:** `packages/analytics/src/index.ts`

This contract defines the event names and parameters used across the website, buyer dashboard, and creator app. GA reports must query the event name directly for funnel stages; an `action` parameter must never be required to distinguish viewed, attempted, completed, or failed outcomes.

## Global rules

Every client event receives these environment fields from the app analytics layer:

| Parameter | Required | Allowed values | Purpose |
|---|---|---|---|
| `app_section` | Yes | `website`, `dashboard`, `creator` | Separates the three product surfaces. |
| `traffic_type` | Yes | `external`, `internal` | Separates customer behavior from staff, staging, localhost, and QA traffic. |

The following data must never be sent to GA:

- Email addresses, names, phone numbers, freeform notes, chat text, or search text that may identify a person.
- OAuth tokens, Supabase session values, Stripe identifiers, document contents, or full URLs containing query strings.
- Raw exception messages. Failure reasons must come from an allowlisted enum.
- Recipient-level email campaign identifiers, including `utm_content` and contact IDs.

Events use lowercase snake case and past tense only for outcomes that have already occurred. A `*_completed`, `*_submitted`, or `*_started` event fires only after the authoritative server operation succeeds. UI clicks use explicit `*_clicked` names when the click itself is the measured outcome.

## Authentication contract

All auth events require `method` (`email` or `google`) and `account_type` (`buyer` or `creator`). Failed events may include only the allowlisted `failure_reason`. Buyer signup events may include the controlled `role` selection.

| Event | Owner | Exact trigger | Required parameters | Example |
|---|---|---|---|---|
| `signup_viewed` | Growth | Signup form first becomes available in the current page mount. | `method`, `account_type` | `{method: "email", account_type: "buyer"}` |
| `signup_attempted` | Growth | User submits the form or starts the Google OAuth redirect. | `method`, `account_type` | `{method: "google", account_type: "creator"}` |
| `signup_completed` | Product | Supabase auth and the required account profile are successfully created. | `method`, `account_type` | `{method: "email", account_type: "creator"}` |
| `signup_failed` | Engineering | Client validation or the auth/profile operation rejects the attempt. | `method`, `account_type`, `failure_reason` | `{method: "email", account_type: "buyer", failure_reason: "auth_rejected"}` |
| `signin_viewed` | Growth | Sign-in form first becomes available in the current page mount. | `method`, `account_type` | `{method: "email", account_type: "creator"}` |
| `signin_attempted` | Growth | User submits the form or starts the Google OAuth redirect. | `method`, `account_type` | `{method: "google", account_type: "buyer"}` |
| `signin_completed` | Product | Supabase returns a valid session and the expected account profile exists. | `method`, `account_type` | `{method: "email", account_type: "buyer"}` |
| `signin_failed` | Engineering | Validation, OAuth, session, or profile validation rejects the attempt. | `method`, `account_type`, `failure_reason` | `{method: "google", account_type: "creator", failure_reason: "oauth_session_failed"}` |
| `creator_profile_completed` | Creator success | `completeOAuthProfile` confirms the required creator profile was stored. | `account_type` | `{account_type: "creator"}` |

Allowed auth failure reasons are defined in the shared package. Unknown or arbitrary strings normalize to `other`; raw error text is never emitted.

## Acquisition and email engagement

| Event | Owner | Exact trigger | Required parameters | Example |
|---|---|---|---|---|
| `email_landing_engaged` | Growth | First trusted pointer, keyboard, or scroll interaction after an email-attributed website landing. | `campaign_source`, `campaign_medium`, `campaign_name`, `landing_path`, `engagement_method` | `{campaign_source: "brevo", campaign_medium: "email", campaign_name: "july_buyers", landing_path: "/", engagement_method: "pointerdown"}` |

The event does not fire on page load, so security scanners cannot satisfy it without a trusted browser interaction.

## Commercial outcomes

These names are reserved now; implementation remains governed by `AR-205` and must use server-confirmed results.

| Event | Owner | Exact trigger | Required parameters | Example |
|---|---|---|---|---|
| `interest_submitted` | Buyer success | Supabase confirms a buyer-interest record was created. | `title_id`, `source` | `{title_id: "uuid", source: "title_detail"}` |
| `introduction_requested` | Buyer success | The authoritative introduction request is stored. | `title_id`, `source` | `{title_id: "uuid", source: "interest_followup"}` |
| `introduction_completed` | Partnerships | The authoritative introduction record is marked completed. Prefer server-side emission. | `title_id` | `{title_id: "uuid"}` |
| `checkout_started` | Revenue | A valid Stripe Checkout session URL is returned by the server. | `account_type`, `plan_type`, `billing_period` | `{account_type: "creator", plan_type: "pro", billing_period: "monthly"}` |
| `subscription_started` | Revenue | Stripe webhook confirms an active paid subscription. Server-side emission is required. | `account_type`, `plan_type`, `billing_period`, `currency`, `value` | `{account_type: "buyer", plan_type: "pro", billing_period: "monthly", currency: "USD", value: 250}` |

## Product engagement outcomes

These names replace overlapping legacy names under `AR-206`. Query text, chat text, title names, and document names are prohibited; use stable IDs and controlled enums.

| Event | Owner | Exact trigger | Required parameters | Example |
|---|---|---|---|---|
| `title_search_submitted` | Buyer product | A deliberate title search is submitted. | `search_type`, `filter_count` | `{search_type: "hybrid", filter_count: 2}` |
| `title_detail_viewed` | Buyer product | A title detail route is rendered for a valid title. | `title_id`, `source` | `{title_id: "uuid", source: "search"}` |
| `chat_message_sent` | Buyer product | A non-empty chat request is accepted for processing. | `input_type`, `message_length_bucket` | `{input_type: "typed", message_length_bucket: "51_100"}` |
| `comps_search_submitted` | Buyer product | A comps request is accepted for processing. | `input_count`, `source` | `{input_count: 2, source: "comps_navigator"}` |
| `mandate_search_submitted` | Buyer product | A mandate search is accepted for processing. | `filter_count`, `source` | `{filter_count: 3, source: "mandates"}` |
| `favorite_added` | Buyer product | Supabase confirms a title was saved. | `title_id`, `source` | `{title_id: "uuid", source: "title_detail"}` |
| `favorite_removed` | Buyer product | Supabase confirms a saved title was removed. | `title_id`, `source` | `{title_id: "uuid", source: "saved_titles"}` |
| `pitch_deck_opened` | Buyer product | The pitch-deck viewer successfully opens. | `title_id`, `access_type` | `{title_id: "uuid", access_type: "full"}` |
| `pitch_deck_page_viewed` | Buyer product | A distinct pitch-deck page becomes visible. | `title_id`, `page_number`, `access_type` | `{title_id: "uuid", page_number: 2, access_type: "preview"}` |

## Event ownership and change control

1. Product defines the user or business outcome and its expected funnel position.
2. Engineering owns the exact trigger, deduplication, privacy review, and automated test.
3. Analytics operations owns GA custom definitions, reporting queries, reconciliation, and alerts.
4. New event names or parameters must be added to the shared package and this document in the same change.
5. A renamed event requires a dated migration note and a reporting cutover; silently reusing a name with new semantics is prohibited.

## Current migration state

- Environment and internal-traffic fields are implemented across all three apps.
- `email_landing_engaged` is implemented and verified in preview; production release remains tracked by `AR-110`.
- Canonical buyer and creator auth names are implemented in source under `AR-201` and `AR-202`.
- Commercial and product-engagement names are reserved but remain unimplemented until their individual plan tasks pass acceptance tests.
