# Analytics Reliability and User Behavior Program

<!-- analytics-program:status=ACTIVE -->

**Status:** ACTIVE
**Started:** 2026-07-13
**Owner:** KStoryBridge leadership and product engineering
**Review cadence:** Weekly, Monday at 08:00 America/Los_Angeles
**Source of truth:** This document

## Objective

Build a trustworthy measurement system that shows whether KStoryBridge attracts the right buyers and creators, activates them around real product value, retains them at the expected business cadence, and converts activity into buyer interest and revenue.

The program is complete only when the exit criteria at the end of this document pass and the status marker above is changed from `ACTIVE` to `DONE`.

## Baseline

The initial GA4 audit covered June 13 through July 12, 2026, compared with May 14 through June 12, 2026.

- 533 of 692 raw sessions in the latest period, or 77%, came from a Brevo security-scanner referral.
- After excluding observed Brevo scanner domains and non-production hosts, the estimate was 45 active users, 143 sessions, 72 engaged sessions, and a 50.3% engagement rate.
- The bot-excluded audience decreased from 75 to 45 active users, while engaged sessions increased from 53 to 72.
- The buyer dashboard had 10 active users; 9 returning users generated 55 sessions with 65% engagement.
- Meaningful buyer activity was concentrated among 2 to 7 users: 49 title-detail views from 7 users, 19 searches from 4 users, 6 chat messages from 3 users, and one title-interest submission.
- The creator app had 4 active users and 7 sessions in the latest 30 days. Across 90 days, one user generated four draft-save events and no completed title-submission outcome was recorded.
- Dashboard `signup` and `signin` events combine views, attempts, completions, and errors. The `action` parameter is not registered as a GA custom dimension, so completed auth conversion cannot be reported.
- No reliable GA event currently connects product use to completed signup, title approval, subscription, or other server-confirmed business outcomes.

## Working principles

1. Server-confirmed business records are authoritative; GA explains behavior around them.
2. Production, staging, localhost, staff, automated QA, and security scanners must be separable.
3. An event name represents one outcome. Funnel stages are not hidden only in an unregistered parameter.
4. Buyer and creator activation are defined before implementation.
5. Retention is measured at the natural business cadence, not assumed to be daily SaaS usage.
6. A phase advances only when its acceptance criteria pass.

## Decisions required from the founder

- [ ] `AR-001` Select the primary 90-day business goal: buyer acquisition, buyer activation, recurring buyer usage, buyer-interest generation, creator/title supply, or paid conversion.
- [ ] `AR-002` Define buyer activation as one explicit, measurable outcome.
- [ ] `AR-003` Define creator activation as one explicit, measurable outcome.
- [ ] `AR-004` Define the expected buyer and creator return cadence used for retention.
- [ ] `AR-005` Provide the staff, admin, contractor, investor, and automated-test accounts or email domains that must be excluded.
- [ ] `AR-006` Confirm where each authoritative outcome lives: signup, approved buyer, creator profile, title submission, title approval, buyer interest, introduction, trial, and subscription.
- [ ] `AR-007` Confirm whether the product is currently self-serve, high-touch, or intentionally hybrid.
- [ ] `AR-008` Reconcile the June 17, June 24, and July 8 Brevo sends with delivered, unique-click, and human-click totals.

## Phase 0: Program setup

- [x] `AR-010` Capture the initial 30-day and 90-day GA4 baseline.
- [x] `AR-011` Document the execution sequence, acceptance criteria, and progress log.
- [x] `AR-012` Add a read-only progress-report script.
- [x] `AR-013` Add a scheduled weekly progress audit and manual dispatch.
- [ ] `AR-014` Merge the tracker workflow to the default branch so GitHub's schedule activates.
- [x] `AR-015` Install and verify a local weekly cron fallback until the default-branch workflow is active.

### Phase 0 acceptance criteria

- The plan is in version control and has one unambiguous status marker.
- `npm run analytics:progress` reports completed and pending tasks without changing product data.
- The scheduled workflow runs on Mondays and can also be run manually.
- Weekly delivery uses existing Supabase secrets and the `send-analytics-report` function.

### Progress scheduling state

- Durable repository schedule: `.github/workflows/analytics-progress.yml`, Monday at 15:00 UTC, pending `AR-014` because GitHub only schedules workflows from the default branch.
- Active fallback: the macOS user crontab runs `scripts/run-analytics-progress-cron.zsh --send` Mondays at 08:05 local time.
- Fallback log: `~/Library/Logs/KStoryBridge/analytics-progress-cron.log`.
- The wrapper uses Node's `--env-file` parser rather than shell-sourcing `.env.local`, so secrets containing shell-sensitive characters are preserved exactly.
- The crontab entry contains no credentials. Delivery uses the existing dashboard environment file and stops automatically when the plan status marker becomes `DONE`.
- The host cron daemon (`com.vix.cron`) was verified running after installation, and the wrapper is executable.
- Manual end-to-end verification succeeded on 2026-07-13: the wrapper parsed the plan and delivered to three admins plus Slack with zero failures.

## Phase 1: Clean measurement inputs

- [x] `AR-100` Inventory every GA/GTM initialization path across website, dashboard, and creator.
- [x] `AR-101` Prevent analytics collection on localhost and staging unless an explicit development override is enabled.
- [ ] `AR-102` Define and implement internal/test traffic identification for staff, admins, and automated QA.
- [x] `AR-103` Centralize the observed Brevo/Sendinblue scanner-source filter in all automated GA reports.
- [ ] `AR-104` Add a human email-engagement measure and reconcile it with Brevo campaign reporting so legitimate clicks are not lost with scanner filtering.
- [x] `AR-105` Update the existing funnel-report cron to exclude non-production and scanner traffic.
- [ ] `AR-106` Verify seven consecutive days of production reporting contain no localhost or staging sessions and no scanner-driven alert.
- [x] `AR-107` Deploy the filtered funnel-report function and verify one manual production run before beginning `AR-106`.
- [ ] `AR-108` Verify the GA Admin internal-traffic data filter exists and is in Testing mode before any decision to activate it.
- [ ] `AR-109` After founder approval of `AR-005`, mark approved authenticated accounts with service-role-controlled `app_metadata.internal_traffic=true` and validate a test event.
- [ ] `AR-110` Release and validate the conservative `email_landing_engaged` website event; implementation and automated tests are complete, but production website deployment is pending.
- [x] `AR-111` Classify every active database administrator as internal traffic through protected auth metadata and verify the resulting state.

### Phase 1 acceptance criteria

- Automated reports default to production hosts and documented scanner exclusions.
- Staff/test activity is independently reportable and excluded from customer KPIs.
- Email campaign reports distinguish scanner opens/clicks from meaningful human engagement.
- Raw-versus-clean traffic variance is visible in the weekly report.

### Analytics initialization inventory

Completed 2026-07-13:

- Website SPA: `apps/website/index.html` owns GTM container `GTM-PZBC4XQT`; `AnalyticsProvider` and the route hook use its data layer.
- Website static teaser pages: the English and Korean teaser HTML files each own a gated copy of `GTM-PZBC4XQT` and push lead-submission events.
- Buyer dashboard: `apps/dashboard/src/main.tsx` calls the direct-gTag `initializeAnalytics()` implementation, now restricted to `dashboard.kstorybridge.com` unless an explicit development override is enabled.
- Creator app: `apps/creator/src/main.tsx` uses the same direct-gTag pattern, restricted to `creator.kstorybridge.com` unless explicitly overridden.
- Dashboard legacy: the archived app still contains unconditional GTM initialization. It is excluded from implementation scope unless it is discovered to be deployed or receiving production traffic.
- Scheduled reporting: `funnel-report-cron` queries the shared GA property without production-host, internal-user, or Brevo-scanner exclusions and expects several event names that production is not emitting.
- Production-host allowlists are implemented in all current apps and static teaser pages. `?analytics_debug=1` is the explicit session-scoped non-production override used for intentional diagnostics.

### Environment and internal-traffic implementation

Implemented 2026-07-13:

- Production collection is allowlisted to `kstorybridge.com`, `www.kstorybridge.com`, `dashboard.kstorybridge.com`, and `creator.kstorybridge.com`; localhost and staging do not collect by default.
- Dashboard and creator resolve authentication before sending queued events, preventing anonymous page views from being emitted before the account can be classified.
- Authenticated internal classification reads only the boolean `app_metadata.internal_traffic` claim. No email address, email pattern, or domain list is shipped in the frontend bundle or sent to GA.
- Website and static teaser pages support `?analytics_internal=1` for intentional staff QA, persisting the internal classification locally for that browser.
- Every emitted dashboard and creator event includes `traffic_type=internal|external`; GA `user_id` continues to use the Supabase UUID and is cleared at sign-out.
- Twenty-seven dashboard tests, seven creator analytics-environment tests, and seven website analytics-environment tests pass. Dashboard and website production builds pass; the creator Vite bundle passes. The creator full TypeScript build remains blocked by the unrelated pre-existing `CollectButton.tsx` platform-map error.
- `AR-102` remains open until the founder supplies the approved accounts under `AR-005`, those accounts are marked server-side under `AR-109`, and the GA filter is verified under `AR-108`.
- `scripts/internal-traffic-admins.mjs` derives candidates from active `admin` records, masks output, refuses partial auth matches, preserves existing app metadata, and requires a confirmation token before writing.
- The 2026-07-13 production run found three active admins, matched all three to auth users, set `app_metadata.internal_traffic=true`, and verified all three updates. No email addresses are stored in the script or plan.
- Active administrators must refresh their session or sign in again before the new claim is present in frontend analytics events. `AR-005` and `AR-109` remain open for any non-admin staff, contractor, investor, and automated-test accounts.
- The Analytics Admin API does not expose GA4 data-filter administration. The filter must therefore be inspected manually in GA Admin; no filter was activated because activation permanently affects future collected data. Reference: [GA4 data filters](https://support.google.com/analytics/answer/13296761?hl=en) and [internal traffic setup](https://support.google.com/analytics/answer/10104470?hl=en-419).

### Scheduled-report filter implementation

Completed 2026-07-13:

- `supabase/functions/_shared/analytics-filters.ts` is the source of truth for the three production hosts and all observed Brevo/Sendinblue scanner referral domains.
- Funnel, page, landing-page, and traffic-source queries in `funnel-report-cron` use the clean production filter.
- Separate raw-production and clean-production summaries preserve visibility into excluded traffic instead of hiding the data-quality problem.
- The generated report alerts when more than 10% of production-host sessions are excluded and displays raw versus clean sessions, users, and engaged sessions.
- `node --test supabase/functions/_shared/analytics-filters.test.mjs` passes all three filter-shape and composition tests.
- Before the 2026-07-13 deployment, these source changes did not affect the production function.
- Production deployment completed on 2026-07-13. The endpoint passed an HTTP 200 health check, and a manual seven-day run completed with five alerts and successful delivery to three admins plus Slack.
- The existing Supabase `weekly-funnel-report` pg_cron job is active as job 1 on schedule `0 14 * * 1` (Monday 14:00 UTC), verified through the production `check_cron_job_status` RPC.
- The `AR-106` observation window begins with the first full production day after deployment (2026-07-14) and can be closed no earlier than 2026-07-21 after reviewing seven complete days.

### Human email-engagement implementation

Implemented in source on 2026-07-13; production release pending under `AR-110`:

- Email-attributed website landings are recognized only from campaign-level `utm_source`, `utm_medium`, and `utm_campaign` values.
- `email_landing_engaged` fires only after a browser marks a pointer, keyboard, or scroll interaction as trusted. A redirect or scanner page load alone cannot emit the event.
- Recipient identifiers, email addresses, `utm_content`, and arbitrary query parameters are neither retained nor sent to GA.
- The scheduled funnel report now displays event and user totals for this conservative on-site signal so they can be compared with Brevo delivered and unique human-click totals.
- Ten website analytics tests and the website production build pass. Reconciliation remains open under `AR-104` until the campaign totals requested in `AR-008` are available.

## Phase 2: Define and normalize the event contract

- [ ] `AR-200` Create one shared analytics event contract for all three apps, with owners, triggers, required parameters, and examples.
- [ ] `AR-201` Replace aggregate buyer auth events with explicit outcomes: `signup_viewed`, `signup_attempted`, `signup_completed`, `signup_failed`, and corresponding sign-in events.
- [ ] `AR-202` Normalize creator auth names to the same contract and instrument `creator_profile_completed`.
- [ ] `AR-203` Instrument the founder-approved buyer activation event.
- [ ] `AR-204` Instrument the founder-approved creator activation event.
- [ ] `AR-205` Instrument server-confirmed commercial outcomes: interest submitted, introduction requested/completed, checkout started, and subscription started where applicable.
- [ ] `AR-206` Normalize tool events for title search, title detail, chat, comps, mandates, favorites, and pitch-deck use.
- [ ] `AR-207` Add automated tests proving each critical event fires once, at the correct successful outcome, with no sensitive data.
- [ ] `AR-208` Register only the GA custom dimensions needed for analysis and document their retention implications.

### Phase 2 acceptance criteria

- Every funnel stage can be queried by event name without relying on an unregistered action parameter.
- Successful auth and commercial events fire only after the server confirms success.
- Website, buyer, and creator event naming is consistent.
- Event tests pass in all affected apps.

## Phase 3: Connect behavior to authoritative outcomes

- [ ] `AR-300` Set GA `user_id` after authenticated sessions and clear it at sign-out without sending email or other personal data.
- [ ] `AR-301` Create a documented mapping from GA events to Supabase source-of-truth tables and timestamps.
- [ ] `AR-302` Build a reconciliation report for successful buyer and creator signups.
- [ ] `AR-303` Build a reconciliation report for creator title draft, submission, approval, and publication.
- [ ] `AR-304` Build a reconciliation report for buyer interest, introductions, and Stripe subscription outcomes.
- [ ] `AR-305` Define cohorts that exclude staff/test users and calculate buyer and creator activation rates.
- [ ] `AR-306` Calculate retention at the cadence selected in `AR-004` using authenticated external users and meaningful return actions.

### Phase 3 acceptance criteria

- GA completed conversions reconcile with authoritative records within 5%, with every difference explainable.
- Retention cohorts contain authenticated external users only.
- No personally identifiable information is sent to GA.
- Buyer and creator activation can be segmented by source and cohort.

## Phase 4: Reporting, alerts, and operating cadence

- [ ] `AR-400` Replace obsolete funnel event names in the analytics skill and scheduled funnel report.
- [ ] `AR-401` Produce one weekly acquisition, activation, engagement, retention, and commercial-outcome report.
- [ ] `AR-402` Add app-specific breakdowns for website, buyer dashboard, and creator app.
- [ ] `AR-403` Add alerts for scanner share, missing events, reconciliation drift, acquisition decline, activation decline, and retention decline.
- [ ] `AR-404` Add a compact leadership scorecard with the selected north-star metric and leading indicators.
- [ ] `AR-405` Verify email and Slack delivery to active admins for two consecutive scheduled runs.

### Phase 4 acceptance criteria

- Every weekly report clearly separates raw traffic, clean external traffic, and internal/test activity.
- The report connects acquisition to activation, retention, and a business outcome.
- Alerts are actionable and link to an owner or remediation task.
- Two consecutive scheduled reports complete without data-quality warnings or delivery failures.

## Phase 5: Validation and closeout

- [ ] `AR-500` Run a two-week validation period after all production instrumentation is deployed.
- [ ] `AR-501` Review sample user journeys against GA, Supabase, and Stripe records.
- [ ] `AR-502` Resolve every open reconciliation or instrumentation defect.
- [ ] `AR-503` Establish baseline targets for the selected north star, activation, and retention metrics.
- [ ] `AR-504` Record the final architecture, event dictionary, dashboard links, and operating owner.
- [ ] `AR-505` Obtain founder sign-off that the measurement system answers the business questions.
- [ ] `AR-506` Change `analytics-program:status=ACTIVE` to `analytics-program:status=DONE`; the scheduled audit will then exit without sending further progress reports.

## Program exit criteria

All of the following must be true:

- All `AR-*` tasks are checked, except tasks explicitly marked not applicable with a documented founder decision.
- Production customer KPIs exclude scanner, staging, localhost, staff, admin, and automated-test traffic.
- Buyer and creator activation definitions are documented and measurable.
- Completed signups and commercial events reconcile with authoritative records within 5%.
- Retention is reported for authenticated external cohorts at the approved cadence.
- Two consecutive weekly reports run successfully and reach email and Slack.
- The founder confirms the scorecard reflects the current business model.

## Progress log

| Date | Change | Evidence | Next action |
|---|---|---|---|
| 2026-07-13 | Established baseline and diagnosed Brevo scanner contamination, weak acquisition, concentrated buyer engagement, and missing conversion instrumentation. | GA4 property `496541587`; internal analytics report sent to three admins and Slack. | Answer `AR-001` through `AR-008`, then begin Phase 1. |
| 2026-07-13 | Added the living plan, progress script, and weekly scheduled audit. | `npm run analytics:progress`; `.github/workflows/analytics-progress.yml`. | Review the plan and merge the workflow to `main`. |
| 2026-07-13 | Completed the analytics initialization inventory across all three apps, static teaser pages, legacy code, and scheduled reporting. | Initialization inventory under Phase 1; source references listed there. | Review the pre-existing internal-traffic changes, then implement `AR-101`. |
| 2026-07-13 | Centralized the clean-production GA4 filters and applied them to every scheduled funnel-report query, with a raw-versus-clean guardrail. | Three shared-filter tests pass; function and helper syntax checks pass. | Deploy and manually verify under `AR-107`. |
| 2026-07-13 | Completed production-host collection gating and implemented privacy-safe, auth-aware internal-traffic tagging. | 41 targeted tests pass; dashboard and website builds plus creator Vite bundle pass. | Approve internal accounts (`AR-005`), inspect the GA filter (`AR-108`), then flag and validate accounts (`AR-109`). |
| 2026-07-13 | Deployed the clean-production `funnel-report-cron` and completed its manual production acceptance run. | Deployment uploaded the function and shared filter; endpoint health returned HTTP 200; seven-day run delivered to three admins and Slack with zero delivery failures. | Observe seven complete production days through 2026-07-20 and evaluate `AR-106` on or after 2026-07-21. |
| 2026-07-13 | Activated a local weekly progress cron fallback without releasing unrelated `v2` commits. | Idempotent crontab entry at Monday 08:05; wrapper dry run and live delivery both succeeded; three admin emails and Slack delivered. | Keep the fallback active until `AR-014` is merged and its scheduled run is verified. |
| 2026-07-13 | Classified the authoritative active-admin subset as internal traffic without maintaining a frontend email list. | Three script tests pass; dry run matched 3/3 active admins; protected auth metadata update and verification reported 3/3 internal. | Refresh admin sessions, verify a tagged event after the frontend release, and identify any additional accounts under `AR-005`. |

## Progress update procedure

When a task is completed:

1. Change its checkbox from `[ ]` to `[x]` only after the phase acceptance evidence exists.
2. Add one row to the progress log with the evidence and next action.
3. Run `npm run analytics:progress` locally.
4. Commit the plan update with the implementation it describes.
5. Do not mark the program `DONE` until every exit criterion passes and the founder approves closeout.
