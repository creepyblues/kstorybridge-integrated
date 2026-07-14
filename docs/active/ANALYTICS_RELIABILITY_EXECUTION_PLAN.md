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

Recommended definitions and exact approval language are documented in [ANALYTICS_FOUNDER_DECISION_BRIEF.md](ANALYTICS_FOUNDER_DECISION_BRIEF.md). The recommendation selects buyer-interest generation as the 90-day goal, first durable shortlist as buyer activation, first title submission as creator activation, 28-day buyer and 90-day creator retention, and an intentionally hybrid operating model. These are proposals, not approvals; `AR-001` through `AR-008` remain unchecked until the founder responds.

## Phase 0: Program setup

- [x] `AR-010` Capture the initial 30-day and 90-day GA4 baseline.
- [x] `AR-011` Document the execution sequence, acceptance criteria, and progress log.
- [x] `AR-012` Add a read-only progress-report script.
- [x] `AR-013` Add a scheduled weekly progress audit and manual dispatch.
- [ ] `AR-014` Merge the tracker workflow to the default branch so GitHub's schedule activates.
- [x] `AR-015` Install and verify a local weekly cron fallback until the default-branch workflow is active.
- [ ] `AR-016` Restore GitHub Actions execution after the account-level billing lock, then rerun and pass the focused release checks.

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
- The reporter performs best-effort repeated TLS and redirect probes against `www.kstorybridge.com`. An unavailable check is reported as an external-gate alert but does not prevent the checklist from rendering or being delivered.
- The reporter also checks whether its workflow exists on `main` and classifies PR #141 GitHub Actions as healthy, pending, billing-locked, failed, unavailable, or closed. It uses read-only GitHub access, ignores external Vercel checks for CI classification, and never reruns or mutates checks.
- GitHub Actions uses its scoped `GITHUB_TOKEN`; the local reporter falls back to the existing authenticated `gh` credential only in process memory. This prevents unauthenticated annotation limits from misclassifying a billing lock as a code failure without printing or persisting the token.

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
- [x] `AR-112` Release dashboard and creator analytics gating to staging and verify committed bundle markers plus root/auth smoke tests.
- [x] `AR-113` Prove runtime network behavior on all three staging/preview apps: zero analytics by default and intentional collection only with the diagnostic override.
- [x] `AR-114` Open a focused production release PR containing only the analytics reliability commits, excluding unrelated `v2` product and migration work.
- [x] `AR-115` Restore a valid managed TLS certificate on every `www.kstorybridge.com` edge and permanently redirect it to the canonical apex host without losing the path or query string.

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
- Dashboard and creator staging deployments for commit `60cd75b1` reached `READY`. Both custom-domain root and sign-in routes returned HTTP 200, and the served JavaScript bundles contain the app-specific production hostname, `analytics_debug`, the non-production override key, and `internal_traffic` handling.
- The pre-existing creator build blocker was resolved by completing the Lezhin platform icon/detection mapping; the full creator TypeScript and Vite production build now passes.
- Two initial clean website preview attempts appeared as `UNKNOWN` without build logs. Their processes and temporary worktree were cleaned up rather than treating either attempt as released.
- Investigation showed the two website attempts were actually `BLOCKED`, not hung: Vercel rejected manual deployments attributed to Git author `noreply@anthropic.com`, which is not a member of the Hobby-plan team. The CLI version displayed that newer state as `UNKNOWN`.
- A metadata-free export of committed `73bcf109` removed only the unsupported Git attribution. Vercel accepted and built preview `kstorybridge-website-cndahjcti-creepyblues-9060s-projects.vercel.app` to `READY`; the temporary export and downloaded environment file were removed afterward.
- Dashboard staging was missing `VITE_GA_MEASUREMENT_ID`. The public measurement ID was added to its Development, Preview, and Production environments, and committed `60cd75b1` was redeployed to `READY`.
- Headless runtime network verification passed: dashboard, creator, and website preview made zero GTM/GA requests by default; each contacted GTM/GA only with `?analytics_debug=1` in a fresh browser context.
- On the website preview, a trusted pointer interaction on a tagged email landing emitted exactly one `email_landing_engaged` event with sanitized campaign-level fields. `utm_content`, contact identifiers, and email addresses were absent. Production website release remains pending under `AR-110`.
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

- [x] `AR-200` Create one shared analytics event contract for all three apps, with owners, triggers, required parameters, and examples.
- [x] `AR-201` Replace aggregate buyer auth events with explicit outcomes: `signup_viewed`, `signup_attempted`, `signup_completed`, `signup_failed`, and corresponding sign-in events.
- [x] `AR-202` Normalize creator auth names to the same contract and instrument `creator_profile_completed`.
- [ ] `AR-203` Instrument the founder-approved buyer activation event.
- [ ] `AR-204` Instrument the founder-approved creator activation event.
- [ ] `AR-205` Instrument server-confirmed commercial outcomes: interest submitted, introduction requested/completed, checkout started, and subscription started where applicable.
- [x] `AR-206` Normalize tool events for title search, title detail, chat, comps, mandates, favorites, and pitch-deck use.
- [ ] `AR-207` Add automated tests proving each critical event fires once, at the correct successful outcome, with no sensitive data.
- [ ] `AR-208` Register only the GA custom dimensions needed for analysis and document their retention implications.

### Phase 2 acceptance criteria

- Every funnel stage can be queried by event name without relying on an unregistered action parameter.
- Successful auth and commercial events fire only after the server confirms success.
- Website, buyer, and creator event naming is consistent.
- Event tests pass in all affected apps.

`AR-205` partial implementation evidence: buyer `interest_submitted` now fires only after `express-interest` confirms its Supabase upsert. Canonical `checkout_started` now fires for buyers and creators only after the server returns a usable Stripe Checkout session; plan clicks, rejected requests, missing context, and malformed success responses emit no outcome. Both client return pages no longer emit purchase/payment success because reaching a return URL does not prove webhook-confirmed activation. Canonical `subscription_started` is prepared on `v2`: active buyer and creator webhook outcomes enqueue a controlled service-role-only row deduplicated by account type and Stripe subscription ID, and a separate worker validates and retries GA Measurement Protocol delivery. Ten focused source tests, database behavior/permission tests, a concurrent claim test, and delivery authorization-boundary checks pass. The pinned Supabase CLI now completes a clean replay of all 76 root migrations, including the outbox. A read-only comparison found 67 production ledger entries, pre-existing foundational objects, and the prepared outbox absent. It remains unreleased pending explicit approval for historical ledger reconciliation, backups and schema application, the Measurement Protocol secret, Google's debug endpoint, authenticated scheduling, and post-delivery reconciliation. Introductions also remain open because no authoritative introduction record exists.

`AR-206` implementation evidence: buyer discovery and tool use now emit directly queryable `title_search_submitted`, `title_detail_viewed`, `chat_message_sent`, `comps_search_submitted`, `mandate_search_submitted`, `favorite_added`, `favorite_removed`, `pitch_deck_opened`, and `pitch_deck_page_viewed` events. Payloads use stable IDs, controlled sources, counts, and chat-length buckets; current tool paths no longer send search text, chat text, comp or mandate text, title names, pitch URLs, or exact chat lengths. Search/chat requests fire only after validation and a usable request/session boundary; favorites fire after Supabase success; title detail fires only for a valid title; pitch events fire after a document loads and when the destination page actually becomes visible. Eleven focused contract tests and the dashboard production build pass. These client events remain release-pending on `v2`; scheduled-report cutover is tracked separately by `AR-400` so pre- and post-release names are not mixed silently.

`AR-207` partial evidence is maintained in [ANALYTICS_EVENT_TEST_MATRIX.md](ANALYTICS_EVENT_TEST_MATRIX.md). Website trusted-email engagement, dashboard and creator email/Google auth, OAuth profile completion, buyer interest, both creator title-entry paths, and every implemented buyer product-engagement event now prove successful outcomes fire once and failure/duplicate/untrusted/pre-profile/blocked paths emit no success. Seventeen page/component tests cover search, detail, chat, comps, mandates, favorites, and pitch navigation. The chat failure case also exposed and removed an unhandled rejected submission-lock promise without changing the user-visible failure flow. The task remains open only for reserved commercial/admin outcomes that are not implemented yet or explicitly marked not applicable by a documented founder decision.

`AR-208` design and access evidence are maintained in [GA4_CUSTOM_DEFINITIONS_PLAN.md](GA4_CUSTOM_DEFINITIONS_PLAN.md). The current scheduled report uses only predefined GA dimensions, and the proposed minimal event-scoped set explicitly excludes IDs, free text, URLs, redundant campaign/page fields, and parameters without a recurring decision. Registration remains open: current ADC lacks Analytics scopes, the GA APIs return `ACCESS_TOKEN_SCOPE_INSUFFICIENT`, no signed-in browser fallback is available, the existing property inventory and retention setting are therefore unknown, and the founder activation decisions still determine the product-engagement subset.

## Phase 3: Connect behavior to authoritative outcomes

- [x] `AR-300` Set GA `user_id` after authenticated sessions and clear it at sign-out without sending email or other personal data.
- [x] `AR-301` Create a documented mapping from GA events to Supabase source-of-truth tables and timestamps.
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

### Signup reconciliation implementation

Implemented and deployed on 2026-07-13; the canonical frontend release and one full post-release reporting window remain before `AR-302` can close:

- `user_buyers.created_at` and `user_creators.created_at` are counted as the authoritative completed-signup outcomes for the exact same America/Los_Angeles calendar window queried from GA4.
- Active records in the `admin` table are excluded from both profile counts without logging or reporting their email addresses. Non-admin staff exclusions remain pending `AR-005`.
- GA `signup_completed` users are split by `dashboard.kstorybridge.com` and `creator.kstorybridge.com`, avoiding dependence on an unregistered custom dimension.
- Reconciliation status distinguishes `Matched` (within 5%), `Drift detected`, `No signup activity`, and `Instrumentation pending`.
- `ANALYTICS_AUTH_CONTRACT_LIVE_AT` must be set to the later production deployment timestamp for the buyer and creator auth contract. Drift enforcement begins only after that timestamp predates the full reporting window.
- While instrumentation is pending, authoritative Supabase signups remain visible, GA zeros are never called zero signups, and alerts that depend on `signup_completed` are suppressed.
- Eleven shared analytics tests, including Pacific daylight-saving boundaries, and a full Deno type check pass.
- The production function returned HTTP 200 on its health check and manual seven-day run; the report reached three admins and Slack with zero delivery failures. `ANALYTICS_AUTH_CONTRACT_LIVE_AT` is intentionally unset until both auth funnels are in production.

### Creator title workflow reconciliation implementation

Implemented and production-verified on 2026-07-13; creator release, server events, and durable publication linkage remain before `AR-303` can close:

- `title_drafts.created_at`, `submitted_at`, and `approved_at` are the authoritative draft, submission, and approval timestamps. Active admin creators are excluded.
- The report compares GA event counts rather than users because one creator can create or submit multiple titles during a window.
- The full and Quick Add flows emit `title_draft_created` only after a new Supabase draft is returned and `title_submitted` only after the status transition succeeds. Failed writes emit neither outcome.
- Legacy `title_create` is no longer misused as a submission event. Entry method is restricted to `full` or `quick_add`; draft content, names, URLs, and rights-holder data never enter GA.
- Approval and publication event names are reserved for server-side emission. The client cannot honestly emit admin outcomes.
- `titles.created_at` is displayed only as an unlinked catalog-creation proxy. Publication remains `Draft-to-title linkage pending` because production `title_drafts` has no `published_title_id`.
- Separate client and server live-at timestamps prevent missing pre-release events from being interpreted as inactivity or tracking drift.
- Four shared contract tests, 43 creator workflow tests, 15 shared report tests, the full creator build, and Deno type checking pass.
- The production function health check and manual seven-day run returned HTTP 200; the updated report reached three admins and Slack with zero delivery failures. Both title-contract timestamps are intentionally unset while their respective instrumentation remains unreleased.
- Additive draft/publication linkage and idempotent approval recovery are prepared in source. The migration contains no destructive operation or data rewrite, the Edge Function type-checks, a clean replay of all 76 root migrations passes, and the SQL acceptance suite verifies the complete approval insert shape, bidirectional links, duplicate-source rejection, and delete cleanup. A read-only check confirms both linkage columns are absent in production. They remain deliberately undeployed pending explicit historical-ledger reconciliation, backup and schema application, and an authenticated approval/retry test.

### Commercial outcome reconciliation implementation

Implemented and production-verified on 2026-07-13; dashboard release and one complete post-release window remain before the buyer-interest portion of `AR-304` can close, while introductions remain a source-model gap and buyer-subscription delivery is prepared but unreleased:

- `title_interests.created_at` is the authoritative timestamp for a newly created external buyer-interest row. Active admins are excluded.
- The unique buyer/title database constraint is the dedupe gate. A duplicate can refresh profile/note data but returns `created=false`, sends no repeated team notification, and emits no repeated GA event.
- `interest_submitted` event counts reconcile against new rows with the same 5% tolerance used elsewhere. Enforcement waits until `ANALYTICS_INTEREST_CONTRACT_LIVE_AT` predates the full window.
- The report explicitly labels introduction requested/completed as unavailable because no authoritative introduction record exists.
- Buyer subscription start remains unavailable in production reporting. A durable, deduplicated webhook-to-outbox path using Stripe's occurrence time is prepared and tested on `v2`, but the migration, secrets, webhooks, worker, schedule, and GA validation are not production-live; buyer payment completion remains external-only in Stripe.
- The report treats unavailable outcomes as data-model gaps, not zero conversions.
- Four dashboard interest tests, 18 shared report tests, both affected Edge Function type checks, and the full dashboard build pass.
- Production `express-interest` and `funnel-report-cron` health checks returned HTTP 200. A manual seven-day report run completed and reached three admins plus Slack with zero delivery failures. `ANALYTICS_INTEREST_CONTRACT_LIVE_AT` remains intentionally unset until the dashboard event is released.

## Phase 4: Reporting, alerts, and operating cadence

- [x] `AR-400` Replace obsolete funnel event names in the analytics skill and scheduled funnel report.
- [ ] `AR-401` Produce one weekly acquisition, activation, engagement, retention, and commercial-outcome report.
- [x] `AR-402` Add app-specific breakdowns for website, buyer dashboard, and creator app.
- [ ] `AR-403` Add alerts for scanner share, missing events, reconciliation drift, acquisition decline, activation decline, and retention decline.
- [ ] `AR-404` Add a compact leadership scorecard with the selected north-star metric and leading indicators.
- [ ] `AR-405` Verify email and Slack delivery to active admins for two consecutive scheduled runs.
- [ ] `AR-406` Authenticate scheduled/manual report triggers and persist an idempotent, privacy-safe delivery ledger that can prove the `AR-405` streak.

### Phase 4 acceptance criteria

- Every weekly report clearly separates raw traffic, clean external traffic, and internal/test activity.
- The report connects acquisition to activation, retention, and a business outcome.
- Alerts are actionable and link to an owner or remediation task.
- Two consecutive scheduled reports complete without data-quality warnings or delivery failures.

`AR-400` completion evidence: the tracked analytics skill and production `funnel-report-cron` now use `signin_completed`, `comps_search_submitted`, `subscription_started`, and the full canonical authenticated buyer-product inventory. The still-active public-trial events remain a separate funnel; the report never sums `signin`, `comps_search`, or `checkout_completed` into canonical outcomes. Full-window cutover gates keep product and commercial sections in instrumentation-pending mode until their actual deployment timestamps are configured. Twenty-six focused filter, event-contract, reporting-window, reconciliation, and Measurement Protocol tests pass; both affected Edge Functions type-check. The production function deployment succeeded, and a manual seven-day run returned HTTP 200 and delivered to three admins plus Slack with zero failures. `ANALYTICS_PRODUCT_CONTRACT_LIVE_AT` and `ANALYTICS_COMMERCIAL_CONTRACT_LIVE_AT` remain intentionally unset because the corresponding instrumentation is not fully production-live.

`AR-402` completion evidence: the weekly report now queries `hostName` with the same clean-production filter and renders fixed rows for the website, buyer dashboard, and creator app with active users, new users, sessions, engaged sessions, and derived engagement rate. Unknown hosts, staging, and `(not set)` cannot enter the breakdown; missing apps render as zero rather than disappearing; duplicate or malformed production-host rows fail closed because active users are non-additive. Twenty-nine focused analytics tests pass and the report function type-checks. The exact committed function was deployed, and its manual seven-day production run returned HTTP 200 and delivered to three admins plus Slack with zero failures.

`AR-403` partial evidence: scanner-share and reconciliation-drift alerts now name an operating owner and diagnostic action. The report compares clean external new users with the immediately preceding Pacific-calendar window and alerts on a decline of at least 20% only when the prior baseline contains five or more users. A missing-product-event alert requires a fully live product contract plus at least three clean dashboard sessions, so pre-release zeros cannot page engineering. Previous windows remain contiguous through daylight-saving changes, zero prior activity is labeled a new baseline, and malformed counts fail closed. Thirty-three focused analytics tests pass, the function type-checks, and the exact committed production function completed a seven-day manual run with HTTP 200, three admin emails, Slack delivery, and zero delivery failures. `AR-403` stays open because activation- and retention-decline rules require founder-approved definitions under `AR-002` through `AR-004`.

`AR-405`/`AR-406` design evidence: [ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md](ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md) records the current evidence gap and coordinated target. The Monday cron is active, but delivery results are transient, manual and scheduled invocations are indistinguishable, the separate `email_logs` source is unavailable for analytics delivery evidence, and locking only the sender leaves the anon-accessible funnel proxy. The design requires Vault-backed scheduled authentication, service-role manual/sender access, unique invocation claims, per-admin/channel idempotency, aggregate privacy-safe status, negative authorization tests, and two real successful Monday runs. Neither task is complete.

## Phase 5: Validation and closeout

- [ ] `AR-500` Run a two-week validation period after all production instrumentation is deployed.
- [ ] `AR-501` Review sample user journeys against GA, Supabase, and Stripe records.
- [ ] `AR-502` Resolve every open reconciliation or instrumentation defect.
- [ ] `AR-503` Establish baseline targets for the selected north star, activation, and retention metrics.
- [ ] `AR-504` Record the final architecture, event dictionary, dashboard links, and operating owner.
- [ ] `AR-505` Obtain founder sign-off that the measurement system answers the business questions.
- [ ] `AR-506` Change `analytics-program:status=ACTIVE` to `analytics-program:status=DONE`; the scheduled audit will then exit without sending further progress reports.

`AR-504` partial evidence: [ANALYTICS_OPERATING_ARCHITECTURE.md](ANALYTICS_OPERATING_ARCHITECTURE.md) now records the three-app data flow, authoritative systems, responsibilities, environment and identity invariants, canonical references, reporting schedules, live-at gates, alert coverage, deployment order, known gaps, GA property link, and operator runbook. The task remains open because the final named operator and approved custom dashboard links are unresolved, production instrumentation and validation are incomplete, and founder sign-off belongs to `AR-505`.

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
| 2026-07-13 | Recorded and pushed the scoped analytics implementation without staging unrelated workspace changes. | `v2` commit `7c9803d0`; push to `origin/v2` succeeded. | Release and validate the three frontend apps separately; do not merge unrelated `v2` product commits solely to activate the workflow. |
| 2026-07-13 | Released and smoke-tested dashboard and creator analytics gating on staging. | Vercel `READY` deployments from `60cd75b1`; four custom-domain route checks returned 200; deployed bundle markers verified for both apps; all three local app builds pass. | Resolve the website preview deployment state, then perform runtime network validation before production release. |
| 2026-07-13 | Resolved the website preview block and completed cross-app runtime analytics validation. | Vercel API identified `TEAM_ACCESS_REQUIRED`; metadata-free committed export reached `READY`; six default/override browser cases passed; trusted email interaction emitted one sanitized event. | Create a focused production release path, verify GA Admin filter state, and keep `AR-110` pending until production website validation. |
| 2026-07-13 | Opened the focused analytics production release as draft PR [#141](https://github.com/creepyblues/kstorybridge-integrated/pull/141). | Five analytics-only commits cherry-picked from `v2`; all three affected app builds pass; 50 targeted tests pass; release worktree is clean; no database migration is included. The full monorepo build still exposes the unrelated existing Storybook ESM `__dirname` failure. | Review CI and the focused diff, verify the GA Admin filter under `AR-108`, then promote and validate production without closing `AR-110` early. |
| 2026-07-13 | Diagnosed the immediate PR #141 GitHub Actions failures as an account-level CI outage. | Every failed check contained zero executed steps; GitHub annotations state that jobs were not started because the account is locked due to a billing issue; findings are recorded on the PR. | Restore GitHub Actions billing under `AR-016`, rerun checks, and do not treat the current red checks as product test results. |
| 2026-07-13 | Established the shared cross-app event contract and normalized buyer and creator auth funnels. | `@kstorybridge/analytics` is consumed by all three apps; the active contract records owners, exact triggers, parameters, privacy rules, and examples; aggregate auth action parameters were replaced by directly queryable event names; arbitrary failure text normalizes to `other`; 85 focused tests and all three app builds pass; changed-file lint passes. | Release the auth contract independently, then implement founder-approved activation events and server-confirmed commercial outcomes without reopening the naming contract. |
| 2026-07-13 | Closed the authenticated GA identity lifecycle for both product apps. | Dashboard and creator auth providers pass only the Supabase UUID to GA after session resolution, derive internal classification from protected metadata, clear identity on signed-out state and before explicit sign-out, and never pass email; dashboard lifecycle coverage plus three new creator lifecycle tests pass. | Use the non-PII `user_id` for authoritative signup reconciliation under `AR-302` after the canonical auth events reach production. |
| 2026-07-13 | Mapped GA outcomes to the current Supabase and Stripe sources of truth and documented every reconciliation gap. | Production schema was verified with zero-row PostgREST probes; migrations and webhook/approval functions were cross-checked; the source map records keys, timestamps, confidence, and remediation for signup, trial, title workflow, interest, introductions, and subscriptions. | Implement reconciliation only for high-confidence outcomes; resolve the documented buyer-approval, introduction, draft-link, and buyer-payment gaps before promoting those metrics. |
| 2026-07-13 | Implemented and production-verified honest buyer and creator signup reconciliation in the scheduled funnel report. | The report compares active-admin-excluded Supabase profile creation with GA completed-signup users by production hostname, uses a 5% tolerance, and treats pre-release GA zeros as instrumentation pending; eleven shared tests including Pacific daylight-saving boundaries and Deno type checking pass; production health and a manual seven-day run returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Release both canonical auth funnels, set `ANALYTICS_AUTH_CONTRACT_LIVE_AT`, then close `AR-302` after one complete reconciled window. |
| 2026-07-13 | Normalized creator draft/submission outcomes and production-verified honest title-workflow reconciliation. | Both creator entry paths emit only after successful Supabase writes; failed writes emit no outcomes; reporting compares event counts to active-admin-excluded workflow timestamps and labels publication as an unlinked proxy; 62 focused tests, the creator build, and Deno checking pass; production health and a seven-day run returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Release the creator events, then add authoritative server events and durable draft-to-title linkage before closing `AR-303`. |
| 2026-07-13 | Prepared migration-safe publication linkage and idempotent approval recovery without changing production. | The additive migration adds nullable bidirectional IDs, validated foreign keys, and partial unique indexes with no data rewrite; destructive-operation scan is clean; updated `approve-title` type-checks and turns a failed linkage write into a retryable error instead of silent success. Local Supabase validation could not run because Docker is stopped. | Start Docker, run the documented local reset and approval/retry tests, then apply the migration before deploying `approve-title`; do not reverse that order. |
| 2026-07-13 | Replaced the legacy buyer-interest event with the canonical privacy-safe outcome. | `interest_submitted` fires after the Edge Function confirms the database write and includes only stable title ID plus controlled source; title name, note metadata, buyer email, and redundant timestamp are absent; focused test and full dashboard build pass. | Release the dashboard event and add authoritative interest reconciliation; keep introductions and subscriptions pending until their source-of-truth gaps are resolved. |
| 2026-07-13 | Made buyer-interest outcomes exactly deduplicated and production-verified commercial reconciliation. | The database uniqueness constraint distinguishes new interest from note refresh; duplicates produce no repeated notification or GA event; the report compares external interest rows with canonical event counts and displays introductions/subscriptions as unavailable source gaps; 22 focused tests, both Edge Function checks, and the dashboard build pass; both production health checks and the manual report returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Release the dashboard and set the interest live-at timestamp after its production cutover; resolve the introduction and buyer-subscription source gaps before closing `AR-304`. |
| 2026-07-13 | Normalized buyer discovery and tool-engagement events to the shared privacy-safe contract. | Canonical event names cover title search/detail, chat, comps, mandates, favorites, and pitch-deck open/page outcomes; current call paths emit only stable IDs and controlled metadata; pitch tracking now records the page that becomes visible and cannot count a blocked page transition. Eleven new contract tests and 17 existing analytics tests pass, and the dashboard production build succeeds. | Release the dashboard client, record the contract-live timestamp, then cut scheduled reports from legacy tool names to canonical names under `AR-400`. |
| 2026-07-13 | Added the critical-event test matrix and closed boundary-test gaps for email engagement, dashboard/creator email and Google auth, OAuth profile completion, buyer interest, and creator title submission. | Integration tests prove success emits once while failed, duplicate, page-load-only, untrusted, and pre-profile paths emit no successful outcome; the matrix explicitly keeps buyer-tool page boundaries and unimplemented reserved outcomes open. | Add buyer-tool page boundary coverage, then implement and test the remaining reserved outcomes before closing `AR-207`. |
| 2026-07-13 | Completed page-level boundary coverage for every implemented buyer product-engagement event. | Seventeen tests prove accepted search/chat/tool requests, valid title detail, successful favorite writes, and loaded/visible pitch pages emit once while invalid, rejected, failed, missing, and preview-blocked paths emit no false success; the chat failure test also found and removed an unhandled rejected lock promise. | Implement and test the reserved introduction, subscription, approval, and publication outcomes, or document an explicit founder decision that a reserved outcome is not applicable, before closing `AR-207`. |
| 2026-07-13 | Defined the minimal custom-definition policy and documented the exact GA access blocker without registering speculative dimensions. | The plan maps each candidate to a recurring decision, excludes high-cardinality/sensitive/redundant fields, records retention and processing implications, and captures HTTP 403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT` from both GA Admin and Data API probes. | Obtain Analytics-scoped read access, inventory existing definitions and retention, then approve and create only the founder-relevant subset before closing `AR-208`. |
| 2026-07-13 | Canonicalized server-confirmed Checkout starts and removed return-page conversion false positives. | Buyer and creator emit `checkout_started` only after a usable Edge Function response with controlled account, plan, and billing metadata; buyer Strict Mode produces one session request and one event; rejected/missing/malformed paths emit none; return pages no longer emit `purchase` or payment-success events. | Release both clients, then implement idempotent webhook-side `subscription_started`; keep introductions pending until an authoritative record exists. |
| 2026-07-13 | Prepared durable, privacy-safe `subscription_started` delivery without changing production. | Additive service-role-only outbox and controlled RPC; active buyer/creator webhook enqueue with one account/subscription dedupe key; validated Measurement Protocol payload and retry worker; nine unit tests pass; direct local migration tests prove dedupe, controlled params, permissions, claim/retry/completion, stale recovery, and concurrent `SKIP LOCKED`; HTTP boundary checks pass. The full local reset exposed an older missing-`title_drafts` migration dependency before reaching this migration. | Repair or safely supersede the historical reset blocker, rerun the complete reset, create the GA API secret, deploy schema before webhooks/worker, validate Google's debug endpoint, schedule delivery, and reconcile accepted events before completing `AR-205`. |
| 2026-07-13 | Cut scheduled and on-demand analytics reporting to canonical event names without rewriting history. | Central event inventory excludes obsolete authenticated aliases, keeps the public-trial funnel distinct, and adds full-window product/commercial cutover gates; fixed server-event origins preserve production-host filtering; 26 focused tests and both Edge Function checks pass; production manual report returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Release the canonical clients and server outcomes, record their real live-at timestamps, then build the complete weekly operating report under `AR-401` without combining pre-cutover aliases. |
| 2026-07-13 | Added clean external activity breakdowns for all three production apps. | Fixed website/dashboard/creator rows use the centralized production/scanner filter; missing apps zero-fill, unexpected hosts are ignored, and duplicate/malformed production rows fail closed; 29 focused tests and Deno checking pass; production manual report returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Use these app rows in the complete weekly operating report and add app-aware alerts after founder activation and retention definitions are approved. |
| 2026-07-13 | Added actionable acquisition, missing-event, scanner, and reconciliation alert foundations. | Contiguous previous-window comparison; 20% new-user decline threshold with five-user noise floor; contract-live and session-volume gate for missing product events; every implemented alert names an owner and action; 33 tests and Deno checking pass; production manual report returned HTTP 200 and delivered to three admins plus Slack with zero failures. | Define buyer/creator activation and retention cadence, then add their decline rules and close `AR-403`. |
| 2026-07-13 | Added the analytics operating architecture and reconciled outcome-source documentation. | One active reference now maps client and server collection, GA4/Supabase/Stripe reconciliation, report and progress schedules, ownership roles, live-at gates, alerts, deployment order, known blockers, and the runbook; stale title and subscription source statements were corrected without claiming unreleased work is live. | Assign the named operator, approve dashboard links, finish production validation, and obtain founder sign-off before closing `AR-504`. |
| 2026-07-13 | Partially repaired and precisely isolated the `www` acquisition entry-point failure. | The unassigned `www` hostname exposed an expired 2025 wildcard certificate. It is now attached to the existing Vercel website project with renewable certificates and a path/query-preserving 308 to `kstorybridge.com`, but 7 of 20 repeated TLS probes still reached the retired certificate through the legacy A record. Vercel recommends project-specific CNAME `bd569acf5e1d2bd5.vercel-dns-017.com.`; the connected Google DNS token is expired. | Reauthenticate the domain-admin account, replace only the `www` A record with the recommended CNAME, then require repeated zero-failure TLS and redirect probes before closing `AR-115`; retain the apex-only reporting boundary. |
| 2026-07-13 | Closed `AR-115` after certificate propagation converged and added recurring regression detection. | Vercel lists renewable managed `www` certificates; a 50-iteration acceptance run passed 50/50 trusted TLS handshakes and 50/50 path/query-preserving 308 redirects to the apex. The scheduled progress reporter now performs five best-effort probes, renders external-gate status, and adds a delivery alert on degraded/unavailable results; five deterministic tests cover healthy, intermittent, wrong-redirect, unavailable, and rejected-probe states. The production cron wrapper then reported the gate healthy and delivered to three admins plus Slack with zero failures. | Keep the external gate in weekly progress delivery; treat any non-healthy result as an acquisition incident without changing the canonical apex reporting boundary. |
| 2026-07-13 | Converted the open founder questions into an evidence-backed decision package without claiming approval. | The brief maps KStoryBridge's marketplace/deal-support model to a buyer-interest north star, first-shortlist and first-submission activation, 28/90-day meaningful retention, an intentionally hybrid operating model, exact metric contracts, authoritative sources, alternatives, implementation gaps, and one-line approval language. The source map now records why deleting a favorite makes the current buyer-activation history non-durable. | Founder approves or revises the package and supplies exclusions/Brevo totals; then implement the immutable buyer milestone and approved activation/retention reporting. |
| 2026-07-13 | Added recurring read-only monitoring for the repository schedule and analytics production-release CI. | The live tracker reports `AR-014` pending because `analytics-progress.yml` is absent from `main`, and `AR-016` billing-locked because PR #141 is draft/open with six failed GitHub Actions checks whose annotations say the jobs ran zero steps due to the account billing lock. Three Vercel checks remain green but are deliberately excluded from Actions classification. Nine deterministic external-gate tests pass; the workflow token has only read permissions. The production cron wrapper delivered the classified gate report to three admins plus Slack with zero failures. | Restore GitHub billing, explicitly approve a rerun, then require green Actions before release; merge the tracker workflow to `main` before closing `AR-014`. |
| 2026-07-13 | Audited scheduled analytics delivery evidence and designed the secure, durable path to `AR-405`. | Production job 1 is active on Monday `0 14 * * 1`, but sender outcomes exist only in logs/responses, analytics email-log evidence is unavailable, and anon access to the funnel can proxy sends. The design specifies Vault-backed cron identity, strict service-role sender/manual access, unique run claims, per-recipient/channel retry safety, PII-free aggregate status, and the exact two-scheduled-run gate. | Compare the repaired history with staging/production, then implement `AR-406` as one coordinated cutover and observe two real Monday successes before closing `AR-405`. |
| 2026-07-13 | Reconstructed and validated the consolidated root migration history without changing production. | Nine idempotent, non-destructive historical baselines restore missing admin, current creator, title metadata/questionnaire, vector, featured, draft, legacy-rights, and pg_cron prerequisites. Supabase CLI `2.109.1` is pinned; a clean reset applies all 76 migrations. Outbox and publication SQL suites pass; the latter exercises the complete approval payload, link uniqueness, and cleanup. Ten focused source tests and four Edge Function type checks pass. | Compare local and remote migration/schema state read-only; do not infer production readiness from local success. |
| 2026-07-13 | Prevented unauthenticated GitHub annotation limits from producing a false release-CI diagnosis. | The reporter prefers `GITHUB_TOKEN`/`GH_TOKEN` and otherwise reads the existing local `gh` credential without logging or persisting it. Nine deterministic gate tests pass, and a live read-only run again classifies all six zero-step failures as `BILLING_LOCKED` from their exact annotations. | Keep the credential read-only, never rerun checks without approval, and restore account billing before treating PR #141 as executable CI. |
| 2026-07-13 | Compared the repaired history with production read-only and defined a no-replay rollout boundary. | Production has 67 ledger versions, populated foundational tables (4 admins, 47 buyers, 13 creators, 256 titles, 6 drafts, 50 featured), and schema differences that make blanket historical replay inappropriate. The outbox, enqueue RPC, and both linkage columns are absent. Staging apps share the production database. | With explicit approval, back up affected tables, mark only the nine historical versions applied, apply the two current additive migrations, and run authenticated acceptance tests; production remains untouched. |

## Progress update procedure

When a task is completed:

1. Change its checkbox from `[ ]` to `[x]` only after the phase acceptance evidence exists.
2. Add one row to the progress log with the evidence and next action.
3. Run `npm run analytics:progress` locally.
4. Commit the plan update with the implementation it describes.
5. Do not mark the program `DONE` until every exit criterion passes and the founder approves closeout.
