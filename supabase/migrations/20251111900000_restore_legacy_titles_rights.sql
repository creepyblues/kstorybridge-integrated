-- Migration: 20251111900000_restore_legacy_titles_rights.sql
-- Created as root-history repair: 2026-07-13
-- Status: READY_FOR_REMOTE_HISTORY_RECONCILIATION
--
-- Description:
-- Reconstruct the nullable legacy `titles.rights` source column expected by
-- the following rights-array conversion migration. Production had this column
-- before the repositories were consolidated, but the root title-creation
-- migration did not. The conversion remains responsible for adding and
-- populating `rights_available`.
--
-- Risk Level: LOW
-- Destructive: NO
-- Affected Tables:
-- - public.titles (one nullable compatibility column, only when absent)
-- Backup Required: NO
--
-- Rollback Procedure:
-- Keep the compatibility column; removing columns is intentionally outside
-- this repair. A future removal requires a separate backup-first migration.
--
-- Testing:
-- [x] Full local `npx supabase db reset`
-- [x] Verify the following conversion produces `rights_available`

ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS rights text;

COMMENT ON COLUMN public.titles.rights IS
  'Legacy single-value rights field retained for compatibility; use rights_available for current writes.';
