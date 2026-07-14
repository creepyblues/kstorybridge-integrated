# Analytics Critical-Event Test Matrix

**Updated:** 2026-07-13

**Plan task:** `AR-207`

**Purpose:** Record whether each critical event is proven to fire once, at its successful outcome boundary, and without sensitive data.

`AR-207` remains open until every implemented critical event has both payload/privacy coverage and an integration-level success/failure boundary test. Reserved events cannot pass until their authoritative implementation exists.

Cross-app sink coverage now additionally proves that legacy helpers cannot emit title names, search/chat text, raw errors, arbitrary URLs, page query strings, timestamps, user/session/subscription IDs, arrays, objects, or unknown future fields. The shared allowlist has eight focused tests, and dashboard, creator, and website integration tests exercise the real app sinks. This source protection is prepared on `v2`; the live GA audit still sees legacy `title_name` collection because the client release is pending.

| Outcome | Implementation | Payload/privacy test | Success/failure + once test | Status / missing evidence |
|---|---|---|---|---|
| `email_landing_engaged` | Website client | Yes | Yes | Complete: page load and untrusted activity emit nothing; first trusted interaction emits once. |
| Website acquisition handoffs | Website client | Yes | Yes | Complete in source: component tests cover creator/buyer homepage choice, desktop/mobile creator/buyer navigation, route-aware creator/buyer sign-in, producer and feature-promo trial/signup CTAs, feature selection, creator-inquiry starts, blocked validation, email failure, team-notification failure, and one fully delivered outcome. Each deliberate interaction emits once. Production DebugView sampling remains a Wave 2 release gate, not source evidence. |
| Buyer email signup/signin | Dashboard client | Yes | Yes | Complete: completion follows successful auth/profile checks once; failures emit no completion. |
| Buyer Google signup/signin | Dashboard callback/profile client | Yes | Yes | Complete: callback signin waits for session/profile checks; signup completion waits for successful profile persistence. |
| Creator email signup/signin | Creator client | Yes | Yes | Complete: success emits completion once; rejected auth emits one failure and no completion. |
| Creator Google signup/signin and `creator_profile_completed` | Creator callback/profile client | Yes | Yes | Complete: callback signin waits for session/profile checks; both signup/profile outcomes wait for profile persistence and fire once. |
| `interest_submitted` | Dashboard + `express-interest` | Yes | Yes | Complete: new row emits once; duplicate refresh and request failure emit nothing. |
| `introduction_requested` / `introduction_completed` | Reserved | No | No | Authoritative introduction record and emission do not exist yet (`AR-205`). |
| `checkout_started` | Dashboard + creator clients after Edge Function success | Yes | Yes | Complete: valid session responses emit once; rejected, missing-context, and missing-URL paths emit no outcome. Buyer Strict Mode coverage also proves one server request and one event. |
| `subscription_started` | Buyer/creator Stripe webhooks + service-role outbox prepared on `v2` | Yes | Partial | Nine payload/helper tests pass; database tests prove controlled params, unique subscription dedupe, claim/retry/completion, stale recovery, and client-role denial. Delivery authorization boundaries return 405/401/503 as designed. Full Stripe-to-GA debug validation, deployment-order verification, and post-delivery reconciliation remain pending (`AR-205`). Client return pages deliberately emit no success. |
| Buyer product engagement events | Dashboard client | Yes | Yes | Complete: page/component tests cover search, valid detail, accepted chat, comps, mandates, successful favorite writes, loaded pitch decks, visible page changes, blocked preview pages, and each corresponding rejection/failure boundary. |
| `title_draft_created` / `title_submitted` | Creator full + Quick Add clients | Yes | Yes | Complete: each entry path emits once after successful writes and emits neither outcome on failure. |
| `title_approved` / `title_published` | Implemented on `v2`; not production-live | Yes | Yes | One service-only RPC atomically writes exact allowlisted payloads; duplicate/recovery calls reuse rows, conflicts roll back, client roles are denied, spoofed/inactive admins are rejected before draft access, and all three approval success paths share the finalizer. Production approval/retry, GA debug, and full-window reconciliation remain pending (`AR-303`). |

## Required gate to close AR-207

1. Every non-reserved row above must be complete.
2. Every reserved row must either be implemented and tested or explicitly marked not applicable by a documented founder decision.
3. Focused suites must pass in website, dashboard, and creator.
4. All affected app production builds must pass.
5. A source audit must find no sensitive field in any critical event payload.
