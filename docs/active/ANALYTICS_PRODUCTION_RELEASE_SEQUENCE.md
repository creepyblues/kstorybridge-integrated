# KStoryBridge Analytics Production Release Sequence

**Status:** Active release control

**Prepared:** 2026-07-13

**Current source:** `v2` at or after `78665140`

**Foundation release:** Draft PR [#141](https://github.com/creepyblues/kstorybridge-integrated/pull/141)

## Purpose

The analytics program now contains four different risk classes: client collection controls, canonical client outcomes, authoritative database/server outcomes, and reporting/GA configuration. They must not be released as one undifferentiated merge.

PR #141 intentionally remains the migration-free foundation. Later `v2` commits are not safe leaf cherry-picks: the shared privacy sink depends on the canonical analytics package and app adapters, while the weekly scorecard depends on later report filters, reconciliation modules, live-at gates, and authenticated-delivery work. Database and Edge Function changes additionally require backups, secrets, ordered deployment, and explicit production approval.

No wave is considered live because its source exists, its tests pass, or a preview is healthy. Each wave closes only after the production acceptance evidence below is recorded in the analytics execution plan.

## Release map

| Wave | Scope | Production mutation | Primary tasks unlocked |
|---|---|---|---|
| 1. Collection foundation | PR #141: production-host gating, internal classification, trusted email engagement, scanner filtering, progress workflow | Main merge and three Vercel app releases; no database migration | `AR-014`, `AR-106`, `AR-108`, `AR-110` |
| 2. Canonical client contract | Shared analytics package, website acquisition, auth/title/buyer-product/checkout outcomes, cross-app privacy sink and boundary tests | Three Vercel app releases; no database migration or server live-at gate | `AR-201`–`AR-207`, `AR-209`, client portions of `AR-302`–`AR-304` |
| 3. Authoritative server outcomes and delivery security | Reconciled migration ledger, title linkage, event outbox, report-delivery ledger/schedule, strict functions, webhook/approval producers, worker and secrets | Database migrations, Vault/secrets, Edge Functions, schedules | Server portions of `AR-205`, `AR-303`, `AR-304`, `AR-405`, `AR-406` |
| 4. Operating report and GA configuration | Weekly scorecard/app comparison, cutover timestamps, approved custom definitions/key events/retention | Report function, live-at secrets, approved GA Admin writes | `AR-208`, `AR-401`, `AR-403`, `AR-404` |

## Wave 1 — collection foundation

### Included

- Exact production-host allowlists and non-production suppression.
- Protected authenticated internal-traffic classification plus active-admin metadata tooling.
- Conservative `email_landing_engaged` trusted-interaction signal.
- Central production/scanner filters in the scheduled report.
- Default-branch progress workflow and local fallback compatibility.

### Excluded

- The later shared canonical event package and fail-closed parameter sink.
- Activation, retention, title workflow, buyer-product, and commercial contract changes.
- Every database migration, Measurement Protocol producer, delivery ledger, and GA configuration write.

### Entry gates

1. GitHub Actions billing is restored and PR #141's actual jobs pass; zero-step billing failures are not accepted as test results.
2. The GA internal-traffic data filter is visually verified in **Testing** mode. Do not activate it during this wave.
3. The focused PR diff still contains no database migration and no unrelated `v2` product work.
4. A production release window and rollback owner are confirmed.

### Acceptance evidence

1. Website, dashboard, and creator production bundles load successfully.
2. Fresh default sessions on all three production apps collect intentionally; localhost, staging, and previews remain suppressed without the diagnostic override.
3. An authenticated internal admin emits `traffic_type=internal`; an external test identity emits `traffic_type=external`; neither sends email or other personal data.
4. A tagged production email landing emits exactly one `email_landing_engaged` after a trusted interaction, with campaign-level fields only.
5. The progress workflow is visible on `main`, its manual run succeeds, and the local cron remains enabled until the first scheduled repository run is proven.
6. The production release timestamp and evidence are added to the execution plan. Begin the seven-complete-day `AR-106` window; do not close it on release day.

The scheduled progress audit fetches the complete PR file list and compares it with the fixed Wave 1 allowlist. An unknown path fails the release gate as `SCOPE_DRIFT`; an incomplete file inventory fails as `UNAVAILABLE`. The alert reports counts only and does not expose repository path details in email or Slack.

### Rollback

Revert PR #141 and redeploy the three apps. Do not modify GA filters to compensate for a broken client release.

## Wave 2 — canonical client contract and privacy boundary

### Included

- Current `@kstorybridge/analytics` event names and controlled parameters.
- Successful-outcome boundaries for auth, creator draft/submission, buyer discovery/engagement, interest, and checkout start.
- Direct website audience, feature-promo, trial, signup, sign-in, and creator-inquiry handoff events.
- The shared fail-closed sanitizer across website, dashboard, and creator.
- Page-level negative/duplicate/privacy tests.

### Entry gates

1. Wave 1 production acceptance passes.
2. A dedicated migration-free client PR is cut from the accepted foundation—not directly from the full `v2` diff.
3. The PR contains no outbox, linkage, delivery-ledger, schedule, webhook, approval, or worker migration/function change.
4. All app analytics suites and all three app builds pass from the exact release commit.

### Acceptance evidence

1. Production DebugView/network inspection confirms exact canonical names and controlled fields for representative website, buyer, and creator journeys.
   Website sampling must include homepage creator/buyer selection, producer trial/signup handoffs, one feature-promo path, route-aware sign-in, and creator-inquiry start plus one delivery outcome.
2. `title_name`, searches, raw errors, query strings, session/subscription identifiers, structures, and unknown parameters stop appearing in new client events.
3. One successful and one failed path are sampled for auth, creator submission, buyer interest, checkout start, and a buyer product action; only durable successes emit their outcome.
4. Record actual `ANALYTICS_WEBSITE_ACQUISITION_CONTRACT_LIVE_AT`, `ANALYTICS_AUTH_CONTRACT_LIVE_AT`, `ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT`, `ANALYTICS_INTEREST_CONTRACT_LIVE_AT`, and `ANALYTICS_PRODUCT_CONTRACT_LIVE_AT` values only after all corresponding production clients are live. Do not set server/commercial gates.
5. Wait for a complete post-cutover reporting window before enforcing reconciliation.

### Rollback

Revert the client PR and redeploy the affected apps. Clear any premature client live-at values rather than allowing a mixed window to page as drift.

## Wave 3 — authoritative server outcomes and delivery security

This is one approved maintenance operation, not a casual application merge. Staging app domains share the production database.

### Entry gates

1. Explicit production approval names the maintenance window and operator.
2. Critical tables are backed up using the repository safety procedure.
3. The nine reconstructed historical versions are reconciled in the production ledger without replaying their SQL.
4. The five current migrations are reviewed against the production schema and applied in documented order: title linkage, base event outbox, delivery audit, authenticated schedule, title-workflow outbox extension.
5. Vault/service-role, cron, and GA Measurement Protocol secrets are available without printing or persisting them.

### Acceptance evidence

1. Migration ledger, schema, indexes, RLS, grants, Vault schedule, and rollback checks pass in production.
2. Anon/user/wrong credentials receive the expected 403 boundaries; service/cron identities work only on their intended paths.
3. Stripe and title-approval retries create one durable controlled outcome per dedupe key.
4. Google's debug endpoint accepts the exact privacy-safe payload before production delivery is enabled.
5. The worker claims, retries, completes, and reconciles accepted events without duplicate delivery.
6. Only after the complete producer/worker path is live, record `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT` and `ANALYTICS_COMMERCIAL_CONTRACT_LIVE_AT`.
7. Two actual Monday scheduled deliveries must fully reach every expected admin email and Slack before `AR-405` or `AR-406` closes.

### Rollback

Use the documented evidence-preserving pause scripts. Disable schedules/workers and revert functions before considering additive-schema removal; never drop outcome or delivery evidence during incident response.

## Wave 4 — operating report and GA configuration

### Entry gates

1. The founder approves the north star, both activation definitions, both retention cadences, the external-user exclusions, and operating model.
2. Waves 1–3 have real live-at timestamps and at least one complete reconciled reporting window.
3. GA Editor/Administrator authority is confirmed for the approved configuration changes.

### Acceptance evidence

1. The weekly report shows acquisition, activation, engagement, retention, and commercial outcomes using approved contracts; unavailable values never render as zero.
2. Activation and retention decline alerts use approved cohorts, sufficient sample gates, named owners, and actionable diagnostics.
3. Only the approved minimal custom dimensions are created and become queryable after processing.
4. Legacy dimensions/key events are archived or reclassified only after dashboard, audience, exploration, and GTM dependency review.
5. GA retention changes, if approved, are recorded as prospective and are not represented as restoring expired history.
6. The leadership scorecard receives founder sign-off before Phase 5 validation begins.
7. After Wave 2 has a complete website-contract window, the weekly report renders all eight canonical website handoffs at event level; before that boundary it renders **Instrumentation pending**, never behavioral zeroes. Audience, CTA-position, feature, and controlled-source segmentation is enabled only after the corresponding approved custom definitions finish processing; device and acquisition-source analysis use GA's predefined dimensions.

### Rollback

Revert report code/live-at values first. GA custom-definition archival is irreversible, so dependency review is the rollback control; do not archive speculatively.

## Release operator checklist

Before every wave:

1. Re-read the current execution-plan status and this document.
2. Confirm the release branch contains only that wave's allowed paths.
3. Run the exact wave tests/builds from the release commit.
4. Capture entry-gate evidence before mutation.
5. Record production timestamps only after runtime verification.
6. Add acceptance evidence and the next observation gate to the execution plan.
7. Send the updated progress report to active admins and Slack.
