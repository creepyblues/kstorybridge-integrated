# Analytics Critical-Event Test Matrix

**Updated:** 2026-07-13

**Plan task:** `AR-207`

**Purpose:** Record whether each critical event is proven to fire once, at its successful outcome boundary, and without sensitive data.

`AR-207` remains open until every implemented critical event has both payload/privacy coverage and an integration-level success/failure boundary test. Reserved events cannot pass until their authoritative implementation exists.

| Outcome | Implementation | Payload/privacy test | Success/failure + once test | Status / missing evidence |
|---|---|---|---|---|
| `email_landing_engaged` | Website client | Yes | Yes | Complete: page load and untrusted activity emit nothing; first trusted interaction emits once. |
| Buyer email signup/signin | Dashboard client | Yes | Yes | Complete: completion follows successful auth/profile checks once; failures emit no completion. |
| Buyer Google signup/signin | Dashboard callback/profile client | Yes | Yes | Complete: callback signin waits for session/profile checks; signup completion waits for successful profile persistence. |
| Creator email signup/signin | Creator client | Yes | Yes | Complete: success emits completion once; rejected auth emits one failure and no completion. |
| Creator Google signup/signin and `creator_profile_completed` | Creator callback/profile client | Yes | Yes | Complete: callback signin waits for session/profile checks; both signup/profile outcomes wait for profile persistence and fire once. |
| `interest_submitted` | Dashboard + `express-interest` | Yes | Yes | Complete: new row emits once; duplicate refresh and request failure emit nothing. |
| `introduction_requested` / `introduction_completed` | Reserved | No | No | Authoritative introduction record and emission do not exist yet (`AR-205`). |
| `checkout_started` | Dashboard + creator clients after Edge Function success | Yes | Yes | Complete: valid session responses emit once; rejected, missing-context, and missing-URL paths emit no outcome. Buyer Strict Mode coverage also proves one server request and one event. |
| `subscription_started` | Reserved | No | No | Webhook-side delivery and idempotency evidence remain pending (`AR-205`). Client return pages deliberately emit no payment/subscription success. |
| Buyer product engagement events | Dashboard client | Yes | Yes | Complete: page/component tests cover search, valid detail, accepted chat, comps, mandates, successful favorite writes, loaded pitch decks, visible page changes, blocked preview pages, and each corresponding rejection/failure boundary. |
| `title_draft_created` / `title_submitted` | Creator full + Quick Add clients | Yes | Yes | Complete: each entry path emits once after successful writes and emits neither outcome on failure. |
| `title_approved` / `title_published` | Reserved | No | No | Server delivery and durable publication linkage remain pending (`AR-303`). |

## Required gate to close AR-207

1. Every non-reserved row above must be complete.
2. Every reserved row must either be implemented and tested or explicitly marked not applicable by a documented founder decision.
3. Focused suites must pass in website, dashboard, and creator.
4. All affected app production builds must pass.
5. A source audit must find no sensitive field in any critical event payload.
