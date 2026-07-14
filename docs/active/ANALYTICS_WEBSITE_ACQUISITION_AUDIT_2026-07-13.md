# KStoryBridge Website Acquisition Measurement Audit

**Date:** 2026-07-13

**Scope:** Production GA evidence from the 2026-07-06 through 2026-07-12 interim report plus source-level inspection of the live website routes on `v2`

**Production mutation:** None

**Browser status:** Desktop/mobile visual inspection remains pending one-time browser setup approval; this document does not claim rendered-page or interaction evidence.

## Decision summary

The website data is not strong enough to conclude that the homepage itself is failing. The clean sample is only 14 active users, and the homepage had 14 sessions with 14.3% engagement. Mobile had three sessions and no engaged session. Those are warning signals, not causal proof.

The source audit does prove a separate problem: the primary acquisition journey was not observable. Homepage creator/buyer selection, most global-navigation choices, feature-card choices, route-aware sign-in, and every creator-inquiry boundary had no direct GA event. Producer CTAs used `custom_event`, but the privacy sanitizer intentionally discarded their label and location, making the surviving event indistinguishable from other generic website interactions. GA could show that a page was viewed, but not reliably show which audience path or conversion handoff a visitor chose.

`AR-209` closes that source blind spot with direct event names and controlled parameters. It does not make the journey production-observable until Wave 2 is released and validated.

## Live evidence and limits

| Signal | Current clean window | What it supports | What it does not support |
|---|---:|---|---|
| Homepage sessions | 14 | The homepage is the main acquisition entry point in this small sample. | It does not identify which CTA was considered or selected. |
| Homepage engagement | 14.3% | Most homepage sessions did not satisfy GA's engaged-session definition. | It does not prove copy, layout, performance, audience mismatch, or bot traffic caused the result. |
| Website engagement | 3 engaged / 17 sessions | Website behavior weakened versus the prior window. | It does not reveal creator-versus-buyer intent before this contract is live. |
| Mobile engagement | 0 engaged / 3 sessions | Mobile deserves explicit inspection. | Three sessions are too few for a product conclusion. |
| New profiles | 0 buyer / 0 creator | Traffic did not produce authoritative account acquisition in the window. | It does not expose the exact handoff drop-off without CTA and cross-domain funnel events. |
| Creator inquiries | Not queryable in GA | Nothing reliable can be inferred from GA. | A GA zero must not be reported before the new event is live. |

## Primary journey contract

| Journey boundary | Direct event | Controlled fields | Downstream truth |
|---|---|---|---|
| Homepage/header chooses creator or buyer | `audience_path_selected` | `account_type`, `cta_position` | Destination page view |
| Producer chooses a discovery tool | `feature_promo_selected` | `account_type`, `feature_name`, `cta_position` | Feature promo page view |
| Producer or feature page hands off to trial | `trial_cta_clicked` | `account_type`, `source`, `cta_position` | Dashboard `trial_page_view` and trial events |
| Producer or feature page hands off to signup | `signup_cta_clicked` | `account_type`, `source`, `cta_position` | Dashboard auth events and Supabase buyer profile |
| Creator/buyer chooses route-aware sign-in | `signin_cta_clicked` | `account_type`, `cta_position` | Creator/dashboard auth events |
| Creator opens inquiry form | `creator_inquiry_started` | `account_type`, `source`, `cta_position` | Form delivery outcome |
| Inquiry email and Slack delivery succeed | `creator_inquiry_submitted` | `account_type`, `source` | Client-observed delivery only; no durable inquiry table exists |
| Inquiry delivery rejects | `creator_inquiry_failed` | `account_type`, `source` | Operational failure signal; no raw error or form value |

The event boundary deliberately records the click separately from the destination outcome. A CTA click is intent, not a completed trial, signup, or activation. Creator-inquiry delivery is a lead signal, not creator activation or title supply.

## Remaining blind spots

1. The Beehiiv signup form is a cross-origin iframe. Website code cannot reliably observe a completed subscription; use Beehiiv campaign/subscriber reporting or add a server-side integration before calling it a conversion.
2. Cross-domain continuity from `kstorybridge.com` to dashboard and creator must be verified in GA Admin and with a production journey. A source CTA event and destination page view may otherwise appear as unrelated sessions.
3. The homepage header intentionally hides sign-in outside `/creators` and `/producers`. Whether this harms returning-user discovery is a UX question for the pending desktop/mobile browser audit, not an analytics conclusion.
4. Creator inquiry truth is email/Slack delivery, not a database record. Durable lead reconciliation would require an inquiry table or provider delivery ledger.
5. Primary component-level click and creator-inquiry success/failure boundary tests are complete in source. Production DebugView/network sampling remains part of the Wave 2 acceptance gate.
6. No production event exists until Wave 2 is deployed. Pre-cutover absence must render as **Instrumentation pending**, never zero.
7. Secondary conversion links on the how-to, producer-onboarding, format-spotlight, sample-title/PDF, and older shared-header surfaces were not folded into `AR-209`. Some already use title-specific events; others still use generic or no telemetry. Inventory and either map or explicitly exclude them before claiming complete website CTA coverage under `AR-207`.

## Production acceptance gate

1. Wave 1 passes its production acceptance criteria before the migration-free Wave 2 client release.
2. Production DebugView or network inspection observes each direct event with only the documented controlled fields.
3. One creator and one buyer homepage path reach the expected destination page; desktop and mobile navigation are sampled separately.
4. Producer hero/final and feature-promo hero/final CTAs distinguish trial from signup and preserve their controlled source/position.
5. A creator inquiry open plus one successful or failed delivery outcome is sampled without names, email, title data, URL, notes, or raw errors in GA.
6. GA cross-domain configuration and session continuity are verified for website-to-dashboard and website-to-creator handoffs.
7. Set `ANALYTICS_WEBSITE_ACQUISITION_CONTRACT_LIVE_AT` only after all production website paths are live and validated. Wait for a complete Pacific-calendar window before calculating the funnel.
8. Add the funnel to the weekly operating report under `AR-210`, segmented by audience, CTA position, feature, device, and acquisition source where sample size permits.

## Honest interpretation rule

Until the acceptance gate passes, report website engagement and authoritative profiles separately. Do not infer that a page-view drop-off equals CTA rejection, do not combine click intent with downstream completion, and do not call missing new events zero behavior.
