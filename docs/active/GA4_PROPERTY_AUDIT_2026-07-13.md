# GA4 Property and Campaign-Contamination Audit — 2026-07-13

**Property:** `496541587` (`KStoryBridge`)

**Window for definition usage:** 2026-04-14 through 2026-07-12

**Access:** Read-only service account with an explicitly requested `analytics.readonly` scope

**Delivery:** Sent to all three active admins and the analytics Slack channel on 2026-07-13

## Executive finding

GA read access is working. The property is not yet configured for the canonical measurement contract: it retains event/user data for only two months, has 15 legacy custom dimensions and four legacy custom metrics, and marks 11 mostly obsolete events as key events. None of the six immediately required canonical funnel dimensions is registered.

The audit also confirmed active high-cardinality collection. Registered `title_name` received 328 events across 60 distinct values in 90 days and 32 events in the last seven days. A shared fail-closed client boundary is now prepared on `v2` to prevent all three apps from emitting title names, searches, raw errors, arbitrary URLs, timestamps, session/subscription identifiers, structured values, or unknown parameters. This protection is not production-live.

## Property and streams

| Setting | Current value |
|---|---|
| Property timezone | `America/Los_Angeles` |
| Currency | `USD` |
| Event/user retention | `TWO_MONTHS` |
| Reset retention on new activity | `true` |
| Website stream | `G-LTR32L1HTF` — `https://kstorybridge.com` |
| Dashboard/creator stream | `G-DWL6MV0MC2` — `https://dashboard.kstorybridge.com` |

Two-month granular retention cannot support the proposed 90-day creator retention analysis in GA explorations. Supabase must remain authoritative; changing GA to 14 months is a separate prospective configuration decision and does not restore expired history.

## Current custom dimensions and observed use

`Distinct values` excludes `(not set)`. Counts are event totals carrying the registered parameter.

| Parameter | Distinct values | Events | Assessment |
|---|---:|---:|---|
| `app_section` | 3 | 3,357 | Active but redundant with production hostname for current reports. |
| `user_tier` | 2 | 641 | Active legacy segmentation; review against account/plan contract. |
| `feature_name` | 9 | 629 | Active controlled field; retain only if a named operating report uses it. |
| `title_name` | 60 | 328 | Prohibited high-cardinality content; stop collection, inventory dependencies, then consider archive. |
| `trial_tool` | 4 | 35 | Low-cardinality public-trial segmentation. |
| `remaining_trials` | 3 | 24 | Numeric value registered as a dimension; review whether it is still needed. |
| `user_type` | 1 | 7 | Legacy equivalent of canonical `account_type`; do not maintain both indefinitely. |
| `search_context` | 0 | 0 | Unused in the window. |
| `search_results` | 0 | 0 | Unused in the window. |
| `search_id` | 0 | 0 | Prohibited high-cardinality identifier; archive candidate after dependency review. |
| `page_context` | 0 | 0 | Unused in the window. |
| `contact_source` | 0 | 0 | Unused in the window. |
| `funnel_step` | 0 | 0 | Obsolete when stages have direct event names. |
| `save_source` | 0 | 0 | Unused legacy parameter. |
| `chat_mode` | 0 | 0 | Unused in the window. |

Current custom metrics are `potential_value`, `recommendation_score`, `chat_search_results`, and `view_duration`. None belongs to the canonical immediate set; each needs a report/dependency review before retention or archive decisions.

## Canonical definition gap

The current property does not register these immediately required event-scoped parameters:

- `account_type`
- `method`
- `failure_reason`
- `entry_method`
- `plan_type`
- `billing_period`

Creation remains pending an approved minimal set and an Editor/Administrator credential. The read-only service account can inventory the property but cannot list access bindings, so edit authority is not assumed.

## Key-event audit

The property currently marks these legacy names as key events: `purchase`, `close_convert_lead`, `qualify_lead`, `contact_creator_click`, `upgrade_button_click`, `title_view_from_chat`, `onboarding_step`, `chat_search`, `chat_mode_changed`, `pitch_view`, and `save_title`.

Across the 90-day audit window, only `onboarding_step` and `upgrade_button_click` appeared, once each. Canonical outcomes such as `signup_completed`, `interest_submitted`, `subscription_started`, `title_approved`, and `title_published` are not configured as key events. Key-event changes must wait for production-live canonical events and the founder-approved north star; historical legacy and canonical names must not be combined.

## Brevo campaign-date evidence

The three requested campaign dates line up almost exactly with the contamination:

| Date | Scanner sessions | Engaged sessions | Active users |
|---|---:|---:|---:|
| 2026-06-17 | 180 | 3 | 165 |
| 2026-06-24 | 180 | 0 | 156 |
| 2026-07-08 | 169 | 0 | 154 |

These dates account for 529 scanner-attributed sessions and only three engaged sessions. GA recorded no sessions tagged with `email` or `newsletter` medium on those dates and no `email_landing_engaged` event, which is expected because the trusted-interaction event is not production-live.

No Brevo API credential exists in the repository, local analytics configuration, or Supabase secret-name inventory. Delivered, unique-click, and known-human-click totals therefore still require a Brevo export or read-only Brevo access; GA cannot infer them honestly from the scanner redirects.

## Required next actions

1. Release the shared privacy boundary and canonical clients, then verify `title_name` stops receiving new events.
2. Keep the legacy definitions unchanged until audiences, explorations, dashboards, and GTM dependencies are inventoried; archiving is irreversible.
3. Approve the six-definition immediate set and provide an Editor/Administrator execution path before creating anything.
4. Decide whether to increase retention to 14 months for future creator-cohort exploration; continue using Supabase for authoritative historical retention.
5. Supply campaign-level Brevo delivered, unique-click, and human-click totals for June 17, June 24, and July 8.
6. Reclassify key events only after canonical outcomes are production-live and the north star is approved.
