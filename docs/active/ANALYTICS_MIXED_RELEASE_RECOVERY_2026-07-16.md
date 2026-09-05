# Analytics Mixed-Release Recovery

<!-- analytics-release-recovery:status=RECOVERY_REQUIRED -->

**Status:** Recovery required before further production mutation

**Detected:** 2026-07-16

**Actual main merge:** PR [#142](https://github.com/creepyblues/kstorybridge-integrated/pull/142), merge commit `43e49ea7`

**Focused recovery:** Draft PR [#144](https://github.com/creepyblues/kstorybridge-integrated/pull/144), nine changed files

## What changed

PR #142 merged the complete `v2` branch into `main` on 2026-07-15 at 23:31:31 UTC. This bypassed the documented four-wave boundary:

- 60 commits;
- 217 changed files;
- 194 paths outside the fixed migration-free Wave 1 allowlist;
- 15 migration files; and
- 39 Edge Function files.

The PR had no review. Five GitHub Actions checks failed in about two seconds, while build and E2E jobs were skipped. Read-only annotation inspection directly confirmed the account billing lock for four failures; the fifth annotation request was unavailable and is not classified by inference. No executable GitHub test evidence exists for the merge.

## Actual deployment state

| Surface | Evidence | State |
|---|---|---|
| Website production | Vercel deployment `dpl_BuwgYPP8E58TnPdYNZhKsXGyPqXg`, created 2026-07-15 16:31:36 PDT; live bundle contains `email_landing_engaged` and the canonical website event inventory | New website client source is live; runtime event acceptance is still pending |
| Dashboard production | Current alias still points to the July 7 deployment; attempted July 15 build failed resolving `@kstorybridge/analytics` | Old client remains live |
| Creator production | Current alias still points to the July 7 deployment; attempted July 15 build failed resolving `@kstorybridge/analytics` | Old client remains live |
| Dashboard/creator staging | Both July 15 attempts failed at the same package-resolution boundary | Previous staging deployments remain authoritative |
| Database | Linked migration inventory shows the new analytics migrations absent remotely | Source merged only; schema was not applied by the merge |
| Edge Functions | Production function inventory does not contain `deliver-analytics-outbox`; `funnel-report-cron` remains version 27 from the earlier partial-filter deployment | Later function source was not deployed by the merge |

The PR description says the GA Internal Traffic filter is already **Active**. That statement conflicts with the tracked `UNVERIFIED` record and is not signed-in GA Admin evidence. Because Active exclusion permanently drops matching future data, treat this as an unsafe possibility until visually verified. Do not change the filter based only on PR text.

## Confirmed Vercel root cause

Dashboard and creator import the private workspace package `@kstorybridge/analytics`, whose package exports point to `packages/analytics/dist/*`. A clean Vercel checkout does not contain that ignored build output.

Both app projects overrode Vercel's Turbo-aware build with direct `npm run build`. That bypassed `turbo.json`'s `^build` dependency, so TypeScript reached the app before the shared package existed. A clean-clone reproduction failed with the same `TS2307` error. The root filtered Turbo builds first compiled the shared package and then built both apps successfully.

The recovery branch changes only the two app build commands to call the existing root `build:dashboard` and `build:creator` scripts. A regression test locks that dependency contract.

Draft PR #144 is mergeable and contains exactly the nine documented recovery files. Its seven Actions checks are failed or skipped without executable test evidence while the account billing lock persists. It must remain draft and unmerged until real steps run and pass.

The remote Ignored Build Step is also stale: it invokes `vercel-ignore-turbo.sh` from the repository root without an app argument, so the script detects `path0`, exits `1`, and always proceeds. This did not cause the TypeScript failure, but selective deployment will remain ineffective until each Vercel project passes its explicit app name.

## Recovery sequence

1. Keep database migrations, Edge Functions, GA configuration, and dashboard/creator production aliases unchanged during source recovery.
2. Land the root-Turbo Vercel build fix through a focused recovery PR.
3. Restore GitHub Actions billing and require real unit, lint/type, build, and E2E execution. Zero-step failures are not evidence.
4. Correct each Vercel Ignored Build Step with an explicit app argument and verify preview/staging builds before production promotion.
5. Attach a signed-in browser and inspect property `496541587`. If the filter is Active, record `ACTIVE`, pause internal-event acceptance, and decide whether to return it to Testing with an authorized GA operator.
6. Re-audit the production migration ledger and function versions immediately before any backend maintenance. Source presence on `main` grants no deployment approval.
7. Promote dashboard and creator only after their exact recovery commit is green, then run the Wave 1 client acceptance checks across all three production apps.
8. Record separate live-at timestamps. The website's partial cutover must not backdate dashboard, creator, server, commercial, or clean-report contracts.
9. Keep the local Monday cron active until a default-branch scheduled run executes successfully after billing recovery.

## Recovery acceptance

- The recovery PR contains no migration, Edge Function, product, or GA configuration change.
- Clean-clone root Turbo builds pass for dashboard and creator.
- GitHub jobs execute real steps and pass.
- Dashboard and creator preview/staging deployments are `READY` from the exact recovery commit.
- Production promotion is explicitly approved and produces current bundles on all three aliases.
- Internal/external classification, production-only collection, and `email_landing_engaged` runtime checks pass without personal data.
- The execution plan records the mixed cutovers honestly and the scheduled tracker no longer watches obsolete PR #141.

## 2026-09-05 — backend recovery executed

Draft PR #144 (this runbook) was never merged; its Vercel build-command change was superseded by
commit `9462450c` (app `build` scripts build `@kstorybridge/analytics` first), so only the docs and
gate scripts were salvaged. The Wave 3 backend maintenance operation was then performed against the
shared project using targeted migrations (`supabase db query --linked -f`, catalog verification,
`migration repair`) rather than `db push`:

- Ledger reconciled: all previously unrecorded migrations verified in `pg_catalog` and recorded.
  `20260714041207` had been mis-recorded (job existed with the old anon-Bearer command) and was
  reverted and re-applied properly.
- Applied in order: `20250806000001` (genre GIN index), `20260714001452` (draft↔title linkage, FKs
  validated), `20260714011558` (event outbox), `20260714035054` (report-delivery ledger),
  `20260714042851` (title-workflow outbox), `20260716120500` (`page_view_events`, RLS verified:
  own-row insert allowed, cross-user insert and reads rejected), then `20260714041207` and
  `20260716120000` (both cron jobs now send `X-Analytics-Cron-Secret` from
  `vault.analytics_funnel_cron_secret`; no `Bearer` token in `cron.job`).
- Secrets: `ANALYTICS_FUNNEL_CRON_SECRET` (functions) and `analytics_funnel_cron_secret` (vault)
  created with one shared value. `GA4_MEASUREMENT_ID` / `GA4_MEASUREMENT_PROTOCOL_API_SECRET` are
  still unset by decision, so `deliver-analytics-outbox` is **not** deployed; the outbox accumulates.
- Functions deployed: `send-analytics-report` v28, `funnel-report-cron` v34, `weekly-activity-digest` v1.
  `stripe-webhook`, `creator-stripe-webhook`, `approve-title` were intentionally **not** redeployed
  (their RPC targets now exist; wrap `enqueueSubscriptionStarted` in try/catch in `stripe-webhook`
  before the next deploy so telemetry can never fail a payment webhook).
- Finding: production `funnel-report-cron` v32 (2026-07-14) required the cron secret that did not
  exist, while the cron still sent the anon Bearer header, so scheduled Monday reports have most
  likely returned 403 since mid-July (`cron.job_run_details` only records that the HTTP request was
  queued). Verify the first scheduled runs after this date in `analytics_report_runs`.
