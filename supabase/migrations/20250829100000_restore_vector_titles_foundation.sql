-- Migration: 20250829100000_restore_vector_titles_foundation.sql
-- Consolidated into root migration history: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Restore the pgvector extension and title embedding columns that previously
-- existed only in the archived dashboard migration history. Later root
-- migrations create vector caches, search functions, and indexes.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.titles (additive nullable embedding metadata)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Leave the extension and nullable columns installed. Removing an extension or
-- embedding column requires a separate dependency audit and backup-first plan.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Verify vector type and all five 1536-dimensional columns

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS content_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS title_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS description_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS synopsis_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS combined_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model text DEFAULT 'text-embedding-ada-002',
  ADD COLUMN IF NOT EXISTS embedding_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
