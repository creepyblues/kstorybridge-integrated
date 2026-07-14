# Title Publication Linkage Migration - 2026-07-13

## Status: READY_FOR_PRODUCTION_APPROVAL
## Last Updated: 2026-07-13
## Safe to Follow: WITH_CAUTION

## Overview

This additive migration gives each newly approved creator draft a durable link to the catalog title it creates. It supports idempotent approval retries and makes publication reconciliation provable instead of inferred from aggregate counts.

## Prerequisites

- Migration file: `supabase/migrations/20260714001452_link_title_drafts_to_publications.sql`
- Docker running for local Supabase validation.
- Current `title_drafts` and `titles` row counts recorded before production application.
- Updated `approve-title` deployed only after the migration is present.

## Steps

1. Start Docker and run `npx supabase db reset` from the repository root.
2. Verify both new columns, foreign keys, and partial unique indexes exist locally.
3. Exercise approval creation and retry recovery against the local database.
4. Record pre-production row counts and migration status.
5. Apply the additive migration before deploying the updated `approve-title` function.
6. Verify a controlled approval persists matching IDs in both directions.

## Verification

Local validation completed on 2026-07-13:

- The pinned Supabase CLI completed a clean replay of all 78 root migrations.
- `supabase/tests/title_publication_linkage.sql` inserted the complete `approve-title` catalog payload, persisted matching IDs in both directions, rejected a second catalog row for the same source draft, and verified `ON DELETE SET NULL` cleanup.
- `approve-title` and the related webhook/outbox functions pass Deno type checking with the Edge Function compiler configuration.
- Production application, an actual authenticated Edge Function approval/retry, and production row-count verification remain pending.

- `title_drafts.published_title_id` equals the created `titles.title_id`.
- `titles.source_draft_id` equals the source `title_drafts.id`.
- Repeating the approval request returns the same title and does not create another row.
- The migration changes no existing row count and leaves legacy link fields null.

## Rollback

Roll back the function first and leave the nullable schema additions in place. Do not drop the columns during an emergency rollback. If eventual removal is required, deprecate their use, observe for at least 30 days, back up both tables, and use a separately reviewed migration.
