# Root Migration History Reconstruction - 2026-07-13

## Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
## Last Updated: 2026-07-13
## Safe to Follow: WITH_CAUTION

## Overview

The root Supabase migration history could not rebuild the schema used by the current website, buyer dashboard, creator app, and analytics functions. Foundational objects had been created through archived app-specific migrations or manual production operations but were absent from `supabase/migrations/`. A clean replay first failed on `title_drafts`, then exposed independent missing dependencies one at a time.

This reconstruction adds idempotent historical baselines at the points where the objects originally became dependencies. No existing migration was edited, renamed, deleted, or skipped. No production database or migration-history record was changed.

## Reconstructed prerequisites

| Migration | Restored prerequisite |
|---|---|
| `20250801120000_create_admin_table.sql` | Canonical admin table, RLS, indexes, and timestamp trigger |
| `20250806000001_restore_titles_metadata_foundation.sql` | Current title metadata and text-array genre foundation |
| `20250829100000_restore_vector_titles_foundation.sql` | pgvector and title embedding columns |
| `20250910000000_create_user_creators_table.sql` | Current creator profile table and buyer/creator tier type |
| `20250918000000_create_featured_table.sql` | Featured-title table required by featured sections |
| `20251024000003_create_title_drafts.sql` | Creator draft table, RLS, indexes, and timestamp trigger |
| `20251024000004_add_questionnaire_fields_to_titles.sql` | Complete nullable title-approval payload schema |
| `20251111900000_restore_legacy_titles_rights.sql` | Source column expected by the existing rights conversion |
| `20260114130000_enable_pg_cron.sql` | pg_cron installation before the existing schedule migration |

Supabase CLI `2.109.1` is pinned as a root development dependency. The previously unpinned `2.62.10` binary applied the SQL but failed its post-reset Storage health check against the current local container schema.

## Safety invariants

- The reconstruction contains no `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `DELETE` operation.
- Existing migrations remain byte-for-byte unchanged except the two previously prepared analytics migrations, whose comments now record successful local validation.
- Every baseline uses `IF NOT EXISTS` or catalog guards where an object may already exist remotely. The admin timestamp trigger additionally requires the existing table to have `updated_at`.
- No placeholder admin, creator, title, featured, or seed data is inserted.
- Existing `user_ipowners` data is untouched; `user_creators` is created only when absent.
- A nonempty database that still uses the legacy non-array `titles.genre` representation fails closed with `legacy_genre_requires_backup_first_migration`. It must receive a separately reviewed backup-first data migration instead of an implicit rewrite.
- Production deployment requires explicit approval, a backup/row-count record, and remote migration-history reconciliation. Local success does not authorize `supabase db push` or migration repair.

## Local acceptance evidence

Completed on 2026-07-13:

- `npx supabase db reset` completed on branch `v2` and replayed all 76 migrations through `20260714011558`.
- The rebuilt database contains one active `weekly-funnel-report` job on `0 14 * * 1`.
- RLS is enabled on `admin`, `user_creators`, `title_drafts`, and `analytics_event_outbox`.
- Canonical `titles.genre` is `text[]`; vector, localized approval fields, and draft/publication IDs exist.
- `supabase/tests/analytics_event_outbox.sql` passes dedupe, controlled payload, claim, completion, retry, stale recovery, RLS, and privilege checks.
- `supabase/tests/title_publication_linkage.sql` inserts the complete approval payload, persists both link directions, rejects a duplicate source draft, and verifies delete cleanup.
- Ten focused analytics outbox/Measurement Protocol tests pass.
- `approve-title`, `deliver-analytics-outbox`, and both Stripe webhook functions pass Deno type checking with the Edge Function configuration.

## Read-only production comparison

Completed on 2026-07-13 against the single shared Supabase project:

- The remote migration ledger contains 67 versions through `20260707120000`; it lacks the nine reconstructed historical versions and both prepared current migrations.
- Production already contains the foundational objects and live data: 4 admins, 47 buyer profiles, 13 creator profiles, 256 titles, 6 drafts, and 50 featured rows.
- Production has pg_cron 1.6, pg_net 0.14, and vector 0.8 installed.
- Production `titles.genre` is already the canonical `text[]` type.
- Some production definitions differ from the clean reconstruction, including `admin` without `updated_at`, nullable creator role/tier fields, and legacy title column types. Replaying all nine baseline SQL files would therefore be unnecessary and could add redundant policy/index/trigger definitions.
- The prepared `analytics_event_outbox` table, `enqueue_subscription_started` RPC, `title_drafts.published_title_id`, and `titles.source_draft_id` are all absent remotely.

The staging Vercel apps use this same Supabase project; they are not a separate database rehearsal environment.

## Proposed production procedure — not executed

1. Obtain explicit approval for production migration-history and schema changes.
2. Record fresh aggregate row counts and run the required critical-table backups for the tables touched by the two current migrations.
3. Mark only the nine reconstructed historical versions as applied in the remote migration ledger. Do not execute their SQL against the already-populated production schema.
4. Confirm the local and remote migration ledgers then differ only by the two prepared current migrations.
5. Apply `20260714001452_link_title_drafts_to_publications.sql` and `20260714011558_analytics_event_outbox.sql` in order.
6. Verify columns, constraints, RLS, RPC privileges, outbox permissions, and unchanged aggregate row counts.
7. Deploy and authenticate the dependent functions in their documented order, then perform approval/retry and Measurement Protocol debug tests.
8. If an isolated clone becomes available, repeat the entire procedure there before production. The staging app domains alone do not provide this isolation.

## Rollback

Do not remove reconstructed tables, columns, extensions, or migration records during an incident. Roll back dependent application/function releases first and leave additive schema in place. Any later deprecation requires a new migration, dependency audit, observation period, and backup where data could be affected.
