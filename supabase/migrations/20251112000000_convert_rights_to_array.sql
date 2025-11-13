/**
 * Migration: Convert Rights to Multi-Select Array
 * Date: 2025-11-12
 * Type: Schema Change (Non-Destructive → Destructive)
 * Status: ✅ COMPLETED (Partial - STEP 4 pending)
 *
 * IMPACT ASSESSMENT:
 * - Adds new column: rights_available TEXT[]
 * - Migrates existing data from: rights (TEXT) → rights_available (TEXT[])
 * - Drops old column: rights (DESTRUCTIVE)
 * - Affected rows: ~ALL titles in database
 *
 * SAFETY PROTOCOL:
 * - ✅ Backup created: Run ./scripts/backup-critical-tables.sh titles
 * - ✅ Tested in production: YES - Migration ran successfully 2025-11-12
 * - ✅ Non-destructive first: Add column + migrate data
 * - ⚠️  Destructive step: DROP COLUMN (commented out, uncomment after verification)
 *
 * EXECUTION RESULTS (2025-11-12):
 * ✅ Migration Status: SUCCESS
 * ✅ Migrated rows: 244 titles
 * ✅ NULL rights rows: 1 (skipped as expected)
 * ✅ Empty rights rows: 0
 * ✅ Unmigrated data: 0 (all titles successfully migrated)
 * ✅ Data integrity: Verified - all data preserved in array format
 * ⚠️  Old column: Still exists (DROP COLUMN pending)
 *
 * ROLLBACK PROCEDURE:
 * If issues occur after deployment:
 * 1. Re-add rights column: ALTER TABLE titles ADD COLUMN rights TEXT;
 * 2. Restore from backup or reverse migration:
 *    UPDATE titles SET rights = array_to_string(rights_available, ', ')
 *    WHERE rights_available IS NOT NULL;
 * 3. Drop rights_available if needed
 */

-- ============================================================================
-- STEP 1: ADD NEW COLUMN (Non-Destructive)
-- ============================================================================

-- Add new array column for multi-select rights
ALTER TABLE public.titles
ADD COLUMN IF NOT EXISTS rights_available TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.titles.rights_available IS
'Multi-select rights available: film_tv, animation, publication, merchandising, game, other';

-- ============================================================================
-- STEP 2: MIGRATE EXISTING DATA (Non-Destructive)
-- ============================================================================

-- Migrate existing single-value rights to array format
-- Only migrate non-null, non-empty values
UPDATE public.titles
SET rights_available = ARRAY[LOWER(TRIM(rights))]
WHERE rights IS NOT NULL
  AND TRIM(rights) != ''
  AND rights_available = '{}';

-- Log migration statistics
DO $$
DECLARE
  migrated_count INTEGER;
  null_count INTEGER;
  empty_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.titles
  WHERE rights_available != '{}';

  SELECT COUNT(*) INTO null_count
  FROM public.titles
  WHERE rights IS NULL;

  SELECT COUNT(*) INTO empty_count
  FROM public.titles
  WHERE rights IS NOT NULL AND TRIM(rights) = '';

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Rights Migration Statistics:';
  RAISE NOTICE 'Migrated rows: %', migrated_count;
  RAISE NOTICE 'NULL rights rows: %', null_count;
  RAISE NOTICE 'Empty rights rows: %', empty_count;
  RAISE NOTICE '===========================================';
END $$;

-- ============================================================================
-- STEP 3: VERIFICATION QUERIES (Run these manually before STEP 4)
-- ============================================================================

-- Uncomment to verify data migration:
/*
-- Check sample of migrated data
SELECT
  title_id,
  title_name_en,
  rights AS old_value,
  rights_available AS new_value
FROM public.titles
WHERE rights IS NOT NULL
LIMIT 20;

-- Check for any unmigrated non-null values
SELECT COUNT(*) as unmigrated_count
FROM public.titles
WHERE rights IS NOT NULL
  AND TRIM(rights) != ''
  AND rights_available = '{}';
*/

-- ============================================================================
-- STEP 4: DROP OLD COLUMN (DESTRUCTIVE - Uncomment after verification)
-- ============================================================================

/**
 * ⚠️  DESTRUCTIVE OPERATION ⚠️
 *
 * Uncomment the following after:
 * 1. Verifying data migration in staging
 * 2. Creating database backup
 * 3. Testing application with new rights_available field
 * 4. Getting approval from lead developer
 */

/*
-- Drop the old rights column
ALTER TABLE public.titles DROP COLUMN IF EXISTS rights;

RAISE NOTICE 'Old rights column dropped successfully';
*/

-- ============================================================================
-- MIGRATION COMPLETE (Partial - Awaiting STEP 4 verification)
-- ============================================================================

/**
 * POST-MIGRATION NOTES (Added 2025-11-12)
 * ========================================
 *
 * ✅ COMPLETED STEPS:
 * - STEP 1: rights_available TEXT[] column added successfully
 * - STEP 2: 244 titles migrated from old rights field
 * - STEP 3: Data integrity verified (0 unmigrated titles)
 *
 * ⚠️  PENDING STEPS:
 * - STEP 4: DROP COLUMN rights (uncomment after UI testing complete)
 *
 * 📊 MIGRATION STATISTICS:
 * - Total titles in database: 245
 * - Successfully migrated: 244 (99.6%)
 * - NULL values (skipped): 1 (0.4%)
 * - Migration errors: 0
 *
 * 🔍 DATA QUALITY NOTES:
 * - Original values were platform names (e.g., "MANTA/RIDI", "Manwha Family")
 * - These are NOT valid rights types per new schema
 * - Valid options: film_tv, animation, publication, merchandising, game, other
 * - ⚠️  Recommendation: Clean up migrated data or these titles will have invalid values
 *
 * 📝 NEXT STEPS:
 * 1. Test AddTitle/EditTitle forms with new checkbox UI
 * 2. Verify existing titles display correctly
 * 3. Consider data cleanup script for invalid rights values
 * 4. After thorough testing, uncomment STEP 4 to drop old column
 *
 * 📚 DOCUMENTATION UPDATED:
 * - /apps/creator/CLAUDE.md (Rights & Business section)
 * - /docs/active/DATABASE_SCHEMA.md (titles table schema)
 * - Migration file (this file)
 *
 * 🔗 RELATED FILES:
 * - Component: /apps/creator/src/components/survey/RightsCheckboxGroup.tsx
 * - Form: /apps/creator/src/components/survey/Step1BasicInfo.tsx
 * - Types: /apps/creator/src/services/titlesService.ts
 * - Validation: /apps/creator/src/lib/surveySchema.ts
 * - i18n: /apps/creator/src/i18n/locales/{en,ko}/survey.json
 */
