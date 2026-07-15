# Introduction Outcome Source Audit

**Status:** Historical request evidence found; no current or completed-introduction source

**Property/database:** KStoryBridge production Supabase project

**Audited:** 2026-07-13

## Executive finding

The earlier statement “no production table or field found” was too absolute. Production contains `public.request` with eight historical rows: seven `pitch` and one `contact`, created from 2025-09-24 through 2025-10-09. Its production REST schema exposes only `id`, `user_id`, `title_id`, `type`, and `created_at`.

That table does **not** make introductions reportable:

- The current `ExpressInterestButton` writes a deduplicated `title_interests` row and promises team follow-up; it does not create an introduction record.
- The current title-detail “Contact for Licensing” button records a legacy click and contains a `TODO` instead of opening or persisting a request workflow.
- `PremiumFeaturePopup` is not referenced by the active dashboard component tree. Its Pro contact path sends an email but does not insert a `request` row.
- `request` has no status, requested-vs-accepted boundary, assignee, contacted timestamp, completion timestamp, or durable transition history.
- There is no evidence that the single historical `contact` row means the buyer asked for an introduction, KStoryBridge contacted the rights holder, or both parties were connected.

The honest conclusion is therefore: production has **historical contact-request evidence**, but no authoritative current `introduction_requested` boundary and no `introduction_completed` source.

## Reproducible privacy-safe audit

Run:

```bash
npm run analytics:audit-introductions
```

The audit reads only the production OpenAPI definition plus `type` and `created_at`. It outputs exact aggregate counts, known-type buckets, schema-presence flags, and time bounds. It never reads or prints buyer IDs, title IDs, emails, messages, unknown type values, or credentials. It requires PostgREST's exact count and fails closed rather than reporting a partial sample.

Three deterministic tests cover aggregate privacy, a missing table, and incomplete-row evidence.

## Required founder decision

Choose one requested boundary:

1. Buyer asks KStoryBridge to make contact.
2. KStoryBridge contacts the rights holder.
3. Rights holder accepts the request.

Recommended: `introduction_requested` begins at boundary 1 only after the request is durably stored. `introduction_completed` occurs only after KStoryBridge records that both parties were connected. Interest remains an upstream signal and must not be silently relabeled as an introduction.

## Acceptance criteria for introduction outcomes

1. Founder approves the requested and completed boundaries.
2. One source-controlled workflow owns an immutable request ID, buyer UUID, title UUID, controlled source, status, `requested_at`, and nullable `completed_at`.
3. Free-text messages, emails, names, and rights-holder contact data never enter GA or the analytics delivery ledger.
4. Request creation is idempotent at the approved business key; retries do not create another GA outcome.
5. `introduction_requested` emits only after the authoritative insert succeeds.
6. `introduction_completed` emits server-side only after the durable completion transition succeeds.
7. Active internal/test identities are excluded from KPI reconciliation without deleting their operational records.
8. Historical `request` rows are explicitly migrated, mapped as legacy-only, or excluded; the single contact row is never silently backfilled as a canonical outcome.
9. Success, failure, duplicate, retry, permission, PII, and reconciliation tests pass before production release.
10. A real live-at timestamp precedes a complete Pacific reporting window before missing events or conversion are interpreted.
