# KStoryBridge Analytics Operating Architecture

**Status:** Active; closeout details pending

**Last verified:** 2026-07-13

**GA4 property:** `496541587`

**GA4 measurement ID:** `G-DWL6MV0MC2`

This is the operating map for KStoryBridge measurement across the marketing website, buyer dashboard, and creator app. It records how behavioral events, authoritative outcomes, scheduled reporting, alerts, and program governance fit together. The detailed event definitions and source-of-truth mappings remain in their linked canonical documents.

## Operating principles

1. Supabase and Stripe determine whether a business outcome occurred; GA4 explains the behavior around it.
2. Production customer KPIs include only the exact production hosts and exclude known scanners and protected internal/test identities.
3. A completed, submitted, or started event fires only after its authoritative operation succeeds.
4. GA receives Supabase Auth UUIDs and controlled metadata only—never email, names, freeform content, Stripe identifiers, tokens, or query strings.
5. A source implementation is not treated as production coverage until its real deployment timestamp is recorded and a complete reporting window has elapsed.

## System and data flow

```text
website / buyer dashboard / creator app
  -> shared event contract and environment gate
  -> GA4 property 496541587
                    |
Supabase records ---+-> funnel-report-cron
Stripe records -----+   -> GA4 Data API + authoritative reconciliation
                        -> send-analytics-report
                        -> active-admin email + Slack

Stripe webhooks
  -> analytics_event_outbox (prepared; not production-live)
  -> deliver-analytics-outbox worker (prepared; not scheduled)
  -> GA4 Measurement Protocol

ANALYTICS_RELIABILITY_EXECUTION_PLAN.md
  -> analytics-progress-report.mjs
  -> GitHub schedule or active local cron fallback
  -> active-admin email + Slack until status becomes DONE
```

## Responsibility model

| Responsibility | Role | Current state |
|---|---|---|
| Select the business goal; approve buyer/creator activation and retention definitions | Founder / product | Decisions `AR-001` through `AR-004` remain open. |
| Define outcome semantics and funnel position | Product | Shared with the founder until the definitions are approved. |
| Own event boundaries, privacy, deduplication, identity, and reconciliation code | Engineering | Defined in the event contract and automated tests. |
| Own GA configuration, reporting queries, custom definitions, data quality, and alerts | Analytics operations | Functional role defined; named long-term operator remains a closeout decision. |
| Maintain report recipients and respond to delivery failures | Admin operations | Current delivery resolves active admins from Supabase. |

The final named operating owner is intentionally not invented here. Assigning that person, recording dashboard links, and confirming the completed operating model are remaining parts of `AR-504` and `AR-505`.

## Environment, identity, and filtering invariants

- Client code recognizes `kstorybridge.com`, `www.kstorybridge.com`, `dashboard.kstorybridge.com`, and `creator.kstorybridge.com`. The intended boundary is a Vercel permanent redirect from `www` to the apex before the app loads, so automated clean reports use the canonical apex website host plus the dashboard and creator hosts. The remaining DNS/TLS defect below must be closed before relying on every `www` visit reaching that redirect.
- Localhost, staging, previews, unknown hosts, and `(not set)` are excluded from production KPIs. Non-production collection requires the explicit diagnostic override.
- Known Brevo/Sendinblue security-scanner sources are centrally excluded from clean reporting. Raw-versus-clean variance remains visible.
- Authenticated GA `user_id` is the Supabase Auth UUID. It is cleared on sign-out.
- Internal classification comes only from service-role-controlled `app_metadata.internal_traffic=true`; client email/domain matching is prohibited.
- Server Measurement Protocol events set an exact production `page_location` so they pass the same hostname boundary.

## Canonical specifications

- [Analytics event contract](ANALYTICS_EVENT_CONTRACT.md): event names, triggers, parameters, ownership, privacy, and change control.
- [Analytics outcome source map](ANALYTICS_OUTCOME_SOURCE_MAP.md): authoritative records, timestamps, reconciliation keys, confidence, and source gaps.
- [Analytics event test matrix](ANALYTICS_EVENT_TEST_MATRIX.md): positive and negative event-boundary coverage.
- [Analytics reliability execution plan](ANALYTICS_RELIABILITY_EXECUTION_PLAN.md): acceptance criteria, live progress, blockers, and closeout requirements.

## Reporting and schedules

| Process | Schedule | Purpose | Delivery/state |
|---|---|---|---|
| `funnel-report-cron` | Monday 14:00 UTC (06:00 PST / 07:00 PDT) via Supabase `pg_cron` | Clean traffic, app breakdown, canonical behavior, reconciliation, and actionable alerts over full America/Los_Angeles calendar windows | Production function is active; reports go to active-admin email and Slack. |
| Repository progress audit | Monday 15:00 UTC via `.github/workflows/analytics-progress.yml` | Parse this program's `AR-*` checklist; best-effort probes verify `www`, default-branch workflow, and release-PR CI health | Workflow exists on `v2`; default-branch activation is pending `AR-014`, and GitHub Actions is account-billing locked under `AR-016`. The checks are read-only and never rerun, merge, or mutate CI. |
| Local progress fallback | Monday 08:05 America/Los_Angeles via user crontab | Maintain delivery and external-gate monitoring until the repository schedule is active | Installed and verified; automatically stops sending when the plan marker becomes `DONE`. |

The GA4 link currently distributed in reports is [GA4 Analytics Intelligence](https://analytics.google.com/analytics/web/#/p496541587/reports/intelligenthome). Links to any approved custom leadership or operational dashboards must be added here during `AR-504`; none is claimed to exist today.

## Release boundaries and live-at gates

The report reads these Edge Function secrets as cutover gates:

| Gate | Coverage it enables |
|---|---|
| `ANALYTICS_AUTH_CONTRACT_LIVE_AT` | Canonical buyer/creator authentication reconciliation |
| `ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT` | Creator draft and submission client events |
| `ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT` | Creator approval and publication server events |
| `ANALYTICS_INTEREST_CONTRACT_LIVE_AT` | Buyer-interest reconciliation |
| `ANALYTICS_PRODUCT_CONTRACT_LIVE_AT` | Canonical authenticated buyer-product engagement |
| `ANALYTICS_COMMERCIAL_CONTRACT_LIVE_AT` | Canonical commercial outcomes |

A gate is set only to the actual full production release time. Enforcement starts only when the gate predates the complete report window. Before then, the report labels the section as instrumentation pending and suppresses false missing-event or drift alerts.

The historical root reset blocker is repaired locally and a complete 76-migration replay passes with the pinned Supabase CLI. A read-only production comparison found 67 recorded versions, the foundational objects already populated, and both prepared analytics schemas absent. Because staging apps share the production Supabase project, the remaining subscription delivery path must be released in this order: explicitly approve and reconcile the nine historical ledger versions without replaying their SQL; back up and apply the two additive current migrations; deploy buyer and creator webhooks; configure `GA4_MEASUREMENT_PROTOCOL_API_SECRET`; deploy the delivery worker; validate Google's debug endpoint; schedule the worker; reconcile accepted events; then set the commercial live-at gate. `GA4_MEASUREMENT_PROTOCOL_DEBUG` is a validation control, not a production default.

## Alert coverage

| Condition | Current behavior | Operating response |
|---|---|---|
| Scanner contamination | Reports raw-versus-clean variance and scanner-share warning | Analytics operations checks source filters and campaign reconciliation. |
| Reconciliation drift | Alerts only after the corresponding full-window live-at gate | Engineering checks event boundary, identity, dedupe, and authoritative records. |
| Acquisition decline | Alerts at a 20% or greater clean-new-user decline with a prior baseline of at least five | Growth/product checks channel and app breakdowns before acting. |
| Missing product events | Requires a fully live product contract and at least three clean dashboard sessions | Engineering checks release marker and product-event delivery. |
| Activation decline | Not yet valid | Blocked on founder-approved activation definitions. |
| Retention decline | Not yet valid | Blocked on founder-approved cadence and cohort definitions. |

## Known gates and gaps

- Founder decisions `AR-001` through `AR-008` are unanswered, including the north star, activation, retention cadence, operating model, exclusions, and Brevo reconciliation.
- Direct GA Admin/Data API access from the development environment lacks the necessary OAuth scopes. Internal filter and custom-definition verification remain pending.
- GitHub Actions cannot run while the account is billing locked; the local progress cron is the active fallback.
- The root migration history now replays locally through the prepared outbox and draft-publication linkage. Production has 67 recorded versions and existing foundational schema drift; the nine reconstructed versions should be ledger-reconciled, not blindly executed. Neither prepared schema nor its dependent functions is production-live. Explicit approval, backups, migration repair, ordered application, and authenticated validation remain release gates; staging app domains do not provide a separate database.
- The GA Measurement Protocol API secret is not configured, and the prepared outbox worker is not scheduled.
- Scheduled analytics report delivery has no durable run/recipient ledger, and the anon-accessible funnel endpoint can proxy report sends. The coordinated Vault-backed authentication and idempotent audit design is documented in [ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md](ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md); partial endpoint locking is prohibited because it either breaks the schedule or leaves the proxy open.
- There is no authoritative introduction workflow record, buyer-approval timestamp, or interest-transition timestamp.
- A two-week fully live observation period, journey sampling, final targets, named operator, dashboard links, and founder sign-off remain Phase 5 work.

## Operator runbook

```bash
# Read-only program status; does not send a report
npm run analytics:progress

# Generate and deliver the program progress report using existing local secrets
scripts/run-analytics-progress-cron.zsh --send

# Focused analytics verification
npx vitest run supabase/functions/_shared/*.test.ts
deno check supabase/functions/funnel-report-cron/index.ts
```

When changing measurement behavior, update the event contract, source map, test matrix, implementation, and execution-plan evidence together. When releasing a contract, record the actual live timestamp only after the full path is deployed and validated. Do not mark `AR-504` complete until the architecture is final, dashboard links and the named operator are recorded, and the founder has confirmed the model.
