# KStoryBridge Interim Weekly Operating Report — 2026-07-13

**Current window:** 2026-07-06 through 2026-07-12

**Previous window:** 2026-06-29 through 2026-07-05

**Timezone:** America/Los_Angeles; complete calendar days only

**Status:** Read-only interim evidence; canonical client/server contracts are not production-live

**Delivery:** Sent to all three active admins and the analytics Slack channel on 2026-07-13

## Executive assessment

KStoryBridge did not have a traffic-volume problem this week; it had a traffic-quality and conversion problem. Of 206 production-host sessions, 170 came from the known Brevo scanner and generated no engaged session. After the current scanner/host exclusions, the provisional clean view contained 14 active users, 36 sessions, and 16 engaged sessions. Sessions rose 12.5% week over week, but engagement fell from 68.8% to 44.4% because website engagement collapsed.

The small existing buyer cohort showed materially stronger product behavior than website visitors: six dashboard users generated 19 sessions at 68.4% engagement, 20 legacy title-detail views from five users, and 12 legacy title searches from three users. Supabase recorded one new external buyer–title interest pair. However, there were no new buyer or creator profiles, no creator draft/submission/approval outcomes, and no creator subscription/payment outcomes in either comparison window.

This is evidence that a few buyers can find and evaluate titles, not evidence of broad acquisition, activation, or retention. Buyer and creator activation remain **Not reported** until the founder approves their contracts; retention remains **Not reported** until the cadence and meaningful-return definitions are approved and production instrumentation is live.

## Weekly operating scorecard

| Layer | Current window | Previous window | Honest interpretation |
|---|---|---|---|
| Acquisition | 16 provisional clean new site users; 0 buyer profiles; 0 creator profiles | 19 provisional clean new site users; 0 buyer profiles; 0 creator profiles | GA first-time visitors are not account acquisition. New-user traffic fell 15.8%, below the current 20% alert threshold, but neither marketplace side added an account. |
| Buyer activation | **Not reported** | **Not reported** | First-shortlist definition and immutable milestone are pending `AR-002`, `AR-203`, and `AR-305`. |
| Creator activation | **Not reported**; 0 submissions are shown only as supply throughput | **Not reported**; 0 submissions | Definition approval and cohort calculation are pending `AR-003`, `AR-204`, and `AR-305`. |
| Engagement | Buyer dashboard: 19 sessions / 68.4% engaged; creator: 1 / 100%; website: 17 / 17.6% | Buyer dashboard: 14 / 71.4%; creator: 2 / 50%; website: 25 / 68.0% | Dashboard activity is comparatively healthy but concentrated. Creator volume is too small for a rate conclusion. Website deterioration drove the overall decline. |
| Retention | **Not reported** | **Not reported** | Sessions/sign-ins are not meaningful retention. Buyer/creator cadence and cohort actions remain pending `AR-004` and `AR-306`. |
| Commercial outcomes | 1 authoritative buyer-interest pair; 0 creator subscriptions; 0 creator payments | 0 interest; 0 creator subscriptions; 0 creator payments | Interest is the only new authoritative demand outcome. Introductions and buyer-subscription reconciliation remain unavailable. |

## Data-quality guardrail

| Metric | Raw production hosts | Provisional clean | Excluded |
|---|---:|---:|---:|
| Sessions | 206 | 36 | 170 (82.5%) |
| Active users | 168 | 14 | 154 |
| New users | 240 | 16 | 224 |
| Engaged sessions | 16 | 16 | 0 |

The excluded source was `lu001.r.sp1-brevo.net / referral`: 170 sessions, 155 active users, and zero engaged sessions. User metrics are non-additive, so raw-minus-clean user differences are visibility estimates rather than deduplicated scanner-user counts.

The current production clean filter also exposed one engaged production-host session referred from `localhost:5174`. A source update now excludes localhost, loopback, staging, and Vercel-preview referrers from customer KPI queries; it is verified locally but not production-deployed. The prepared filter removed that session's page view, scroll, session-start, and engagement events from the detailed behavior rows.

One `/admin/titles` landing remains in the provisional clean data. Active admins have protected internal metadata, but the client release and GA filter validation are incomplete and other staff/test identities are unknown. These totals therefore remain a provisional external estimate, not a fully clean customer cohort.

## Week-over-week traffic

| Provisional clean metric | Current | Previous | Change |
|---|---:|---:|---:|
| Active users | 14 | 11 | +27.3% |
| New users | 16 | 19 | -15.8% |
| Sessions | 36 | 32 | +12.5% |
| Engaged sessions | 16 | 22 | -27.3% |
| Engagement rate | 44.4% | 68.8% | -24.3 percentage points |

More sessions did not produce more engagement. The overall rate now falls below the analytics skill's 50% target, but the app split shows this is principally a website issue rather than a dashboard-wide collapse.

## App behavior

| App | Active users | New users | Sessions | Engaged sessions | Engagement | Previous sessions / engagement |
|---|---:|---:|---:|---:|---:|---:|
| Website | 10 | 16 | 17 | 3 | 17.6% | 25 / 68.0% |
| Buyer dashboard | 6 | 0 | 19 | 13 | 68.4% | 14 / 71.4% |
| Creator app | 1 | 0 | 1 | 1 | 100% | 2 / 50.0% |

App active-user rows must not be summed: one person may use more than one app. The creator percentage is based on one session and is not decision-grade.

## Acquisition sources

| Source / medium | New users | Sessions | Engagement | Bounce |
|---|---:|---:|---:|---:|
| `direct / (not set)` | 0 | 16 | 68.8% | 31.3% |
| `(direct) / (none)` | 12 | 10 | 10.0% | 90.0% |
| `gmail / email` | 2 | 4 | 25.0% | 75.0% |
| `search / (not set)` | 0 | 3 | 66.7% | 33.3% |
| `linkedin.com / referral` | 2 | 2 | 0% | 100% |
| `direct_email / email` | 0 | 1 | 100% | 0% |
| `google / organic` | 0 | 1 | 0% | 100% |

Counts are too small to rank channels confidently. Still, the twelve `(direct) / (none)` new users generated only one engaged session, Gmail produced one engaged session from four, and LinkedIn produced none from two. Campaign/channel decisions need tagged traffic and the missing Brevo delivered/unique-human-click totals.

## Landing-page behavior

| Landing page | New users | Sessions | Engagement | Bounce |
|---|---:|---:|---:|---:|
| `/` | 16 | 14 | 14.3% | 85.7% |
| `/buyers/titles/love-kitsch-crunch` | 0 | 9 | 55.6% | 44.4% |
| `(not set)` | 0 | 3 | 0% | 100% |
| `/signin` | 0 | 3 | 100% | 0% |
| `/buyers/home` | 0 | 2 | 100% | 0% |
| `/creators` | 0 | 2 | 50.0% | 50.0% |
| `/titles/the-definition-of-villains` | 0 | 2 | 100% | 0% |
| `/admin/titles` | 0 | 1 | 100% | 0% |

The homepage is the clearest acquisition weakness: it received essentially all new-user volume but engaged only two of fourteen sessions. The title-detail, sign-in, and buyer-home landings performed better, but their samples are small and largely reflect existing intent.

## Product behavior and instrumentation readiness

| Observed legacy event | Users | Events | Interpretation |
|---|---:|---:|---|
| `feature_usage` | 5 | 31 | Broad legacy feature wrapper; not a stable outcome. |
| `title_detail_view` | 5 | 20 | Five users evaluated titles. Canonical replacement is `title_detail_viewed`. |
| `title_search` | 3 | 12 | Three users searched repeatedly. Canonical replacement is `title_search_submitted`. |
| `signin` | 2 | 7 | Aggregate legacy auth stages; cannot prove two successful sign-ins. |
| `title_card_clicked` | 2 | 3 | Directional browse behavior. |

No canonical `signup_completed`, `signin_completed`, `title_search_submitted`, `title_detail_viewed`, `chat_message_sent`, `comps_search_submitted`, `mandate_search_submitted`, `favorite_added`, `interest_submitted`, `title_submitted`, `checkout_started`, or `subscription_started` event appeared. This is expected because the canonical clients/server paths are not production-live. These zeros are instrumentation-pending and must not be interpreted as zero product or commercial activity; Supabase proves one buyer-interest outcome occurred.

## Device signal

| Device | Active users | Sessions | Engagement |
|---|---:|---:|---:|
| Desktop | 12 | 33 | 48.5% |
| Mobile | 2 | 3 | 0% |

The mobile result is concerning but based on only three sessions. It warrants a targeted homepage/mobile journey check, not a broad redesign conclusion.

## Authoritative weekly outcomes

| Supabase outcome | Current | Previous |
|---|---:|---:|
| New external buyer profiles | 0 | 0 |
| New external creator profiles | 0 | 0 |
| External creator drafts created | 0 | 0 |
| External titles submitted | 0 | 0 |
| External titles approved | 0 | 0 |
| New external buyer–title interest pairs | 1 | 0 |
| External creator subscriptions created | 0 | 0 |
| External creator payments recorded | 0 | 0 |

Active admins were excluded from these database counts. Additional staff/test exclusions remain incomplete under `AR-005`, so “external” is still provisional outside the known-admin subset.

## Alerts and actions

1. **Scanner contamination:** 82.5% of production-host sessions were scanner-generated. Keep raw-versus-clean reporting and obtain Brevo campaign aggregates before evaluating email performance.
2. **Website engagement:** overall engagement fell 24.3 points, driven by the homepage's 85.7% bounce rate. Growth/product should inspect campaign-message alignment, homepage comprehension, and the three-session mobile journey before buying more traffic.
3. **No marketplace-side acquisition:** GA recorded 16 new site users but Supabase recorded zero new buyer or creator profiles. Release the reliable auth contract before diagnosing the exact funnel break; do not equate `first_visit` with signup.
4. **Concentrated buyer value:** five users viewed titles, three searched, and one submitted interest. Preserve high-touch follow-up around the authoritative interest while improving the top-of-funnel path.
5. **Creator supply:** one creator-app session and zero draft/submission outcomes provide no evidence of weekly supply growth. Founder-approved creator activation and a 90-day cadence are needed for a fair assessment.
6. **Instrumentation:** restore GitHub Actions billing, visually confirm the GA internal filter is in Testing mode, and release Wave 1 before promoting any canonical zero to a KPI.

## Method and limitations

- GA property `496541587`; read-only `analytics.readonly` access.
- Exact production host allowlist plus known Brevo scanner exclusions; the prepared query additionally excludes non-production referrers.
- Supabase service-role reads were aggregate-only and excluded active-admin identities; no personal data was written to this report.
- GA active/new-user metrics are non-additive across apps and sources. Supabase records are authoritative for business outcomes.
- Samples are small, canonical contracts are unreleased, staff/test exclusions are incomplete, and Brevo provider totals are unavailable. No causal or retention claim is made.
