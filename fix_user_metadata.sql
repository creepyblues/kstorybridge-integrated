-- =====================================================================
-- User Metadata Consistency Fix Script
-- =====================================================================
--
-- This script fixes common metadata discrepancies found in auth.users
-- based on analysis of the KStoryBridge codebase and signup flows.
--
-- IMPORTANT:
-- 1. Backup database before running
-- 2. Test in development environment first
-- 3. Run during maintenance window
-- 4. Review each section before executing
--
-- Last Updated: 2025-01-19
-- =====================================================================

-- Enable detailed output
\set VERBOSITY verbose

-- Create a backup table for safety
CREATE TABLE IF NOT EXISTS auth.users_metadata_backup AS
SELECT id, email, raw_user_meta_data, updated_at
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL;

COMMENT ON TABLE auth.users_metadata_backup IS 'Backup of user metadata before consistency fixes';

-- =====================================================================
-- SECTION 1: Fix camelCase to snake_case field naming
-- =====================================================================

-- Fix buyer field naming inconsistencies
UPDATE auth.users
SET raw_user_meta_data =
    -- Remove camelCase fields and add snake_case equivalents
    raw_user_meta_data
    - 'fullName'
    - 'buyerCompany'
    - 'buyerRole'
    - 'linkedinUrl'
    ||
    jsonb_build_object(
        'full_name', COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'fullName'),
        'buyer_company', COALESCE(raw_user_meta_data->>'buyer_company', raw_user_meta_data->>'buyerCompany'),
        'buyer_role', COALESCE(raw_user_meta_data->>'buyer_role', raw_user_meta_data->>'buyerRole'),
        'linkedin_url', COALESCE(raw_user_meta_data->>'linkedin_url', raw_user_meta_data->>'linkedinUrl')
    )
WHERE
    raw_user_meta_data->>'account_type' = 'buyer'
    AND (
        raw_user_meta_data ? 'fullName' OR
        raw_user_meta_data ? 'buyerCompany' OR
        raw_user_meta_data ? 'buyerRole' OR
        raw_user_meta_data ? 'linkedinUrl'
    );

-- Fix creator field naming inconsistencies
UPDATE auth.users
SET raw_user_meta_data =
    -- Remove incorrect field names and add correct snake_case equivalents
    raw_user_meta_data
    - 'fullName'
    - 'penName'
    - 'penNameOrStudio'
    - 'ipOwnerRole'
    - 'ipOwnerCompany'
    - 'websiteUrl'
    ||
    jsonb_build_object(
        'full_name', COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'fullName'),
        'pen_name', COALESCE(
            raw_user_meta_data->>'pen_name',
            raw_user_meta_data->>'penName',
            raw_user_meta_data->>'penNameOrStudio'
        ),
        'ip_owner_role', COALESCE(raw_user_meta_data->>'ip_owner_role', raw_user_meta_data->>'ipOwnerRole'),
        'ip_owner_company', COALESCE(raw_user_meta_data->>'ip_owner_company', raw_user_meta_data->>'ipOwnerCompany'),
        'website_url', COALESCE(raw_user_meta_data->>'website_url', raw_user_meta_data->>'websiteUrl')
    )
WHERE
    raw_user_meta_data->>'account_type' = 'creator'
    AND (
        raw_user_meta_data ? 'fullName' OR
        raw_user_meta_data ? 'penName' OR
        raw_user_meta_data ? 'penNameOrStudio' OR
        raw_user_meta_data ? 'ipOwnerRole' OR
        raw_user_meta_data ? 'ipOwnerCompany' OR
        raw_user_meta_data ? 'websiteUrl'
    );

-- =====================================================================
-- SECTION 2: Add missing required fields with defaults
-- =====================================================================

-- Add missing tier field for buyers (default to 'basic')
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tier', 'basic')
WHERE
    raw_user_meta_data->>'account_type' = 'buyer'
    AND NOT (raw_user_meta_data ? 'tier');

-- Add missing invitation_status for creators (default to 'invited')
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('invitation_status', 'invited')
WHERE
    raw_user_meta_data->>'account_type' = 'creator'
    AND NOT (raw_user_meta_data ? 'invitation_status');

-- =====================================================================
-- SECTION 3: Fix invalid enum values
-- =====================================================================

-- Fix invalid buyer_role values
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buyer_role', 'other')
WHERE
    raw_user_meta_data->>'account_type' = 'buyer'
    AND raw_user_meta_data->>'buyer_role' NOT IN ('producer', 'executive', 'agent', 'content_scout', 'other')
    AND raw_user_meta_data ? 'buyer_role';

-- Fix invalid tier values (reset to basic)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tier', 'basic')
WHERE
    raw_user_meta_data->>'account_type' = 'buyer'
    AND raw_user_meta_data->>'tier' NOT IN ('basic', 'invited', 'pro', 'suite')
    AND raw_user_meta_data ? 'tier';

-- Fix invalid ip_owner_role values
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('ip_owner_role', 'author')
WHERE
    raw_user_meta_data->>'account_type' = 'creator'
    AND raw_user_meta_data->>'ip_owner_role' NOT IN ('author', 'agent')
    AND raw_user_meta_data ? 'ip_owner_role';

-- Fix invalid invitation_status values
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('invitation_status', 'invited')
WHERE
    raw_user_meta_data->>'account_type' = 'creator'
    AND raw_user_meta_data->>'invitation_status' NOT IN ('invited', 'accepted')
    AND raw_user_meta_data ? 'invitation_status';

-- =====================================================================
-- SECTION 4: Handle legacy account_type values
-- =====================================================================

-- Update legacy 'ip_owner' account_type to 'creator'
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('account_type', 'creator')
WHERE raw_user_meta_data->>'account_type' = 'ip_owner';

-- =====================================================================
-- SECTION 5: Add missing account_type based on profile tables
-- =====================================================================

-- Add account_type 'buyer' for users with buyer profiles but missing metadata
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('account_type', 'buyer')
WHERE
    id IN (SELECT id FROM user_buyers)
    AND (raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'account_type'));

-- Add account_type 'creator' for users with creator profiles but missing metadata
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('account_type', 'creator')
WHERE
    id IN (SELECT id FROM user_creators)
    AND (raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'account_type'));

-- =====================================================================
-- SECTION 6: Populate missing metadata from profile tables
-- =====================================================================

-- Populate buyer metadata from user_buyers table
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
        'account_type', 'buyer',
        'full_name', ub.full_name,
        'buyer_company', ub.buyer_company,
        'buyer_role', ub.buyer_role,
        'linkedin_url', ub.linkedin_url,
        'tier', ub.tier
    )
FROM user_buyers ub
WHERE
    auth.users.id = ub.id
    AND (
        raw_user_meta_data IS NULL
        OR NOT (raw_user_meta_data ? 'full_name')
        OR NOT (raw_user_meta_data ? 'buyer_company')
        OR NOT (raw_user_meta_data ? 'buyer_role')
        OR NOT (raw_user_meta_data ? 'tier')
    );

-- Populate creator metadata from user_creators table
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
        'account_type', 'creator',
        'full_name', uc.full_name,
        'pen_name', uc.pen_name,
        'ip_owner_role', uc.ip_owner_role,
        'ip_owner_company', uc.ip_owner_company,
        'website_url', uc.website_url,
        'invitation_status', uc.invitation_status
    )
FROM user_creators uc
WHERE
    auth.users.id = uc.id
    AND (
        raw_user_meta_data IS NULL
        OR NOT (raw_user_meta_data ? 'full_name')
        OR NOT (raw_user_meta_data ? 'pen_name')
        OR NOT (raw_user_meta_data ? 'invitation_status')
    );

-- =====================================================================
-- SECTION 7: Clean up null values and empty strings
-- =====================================================================

-- Remove null values from metadata (keeps empty strings if intentional)
UPDATE auth.users
SET raw_user_meta_data = (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(raw_user_meta_data)
    WHERE value != 'null'::jsonb
)
WHERE raw_user_meta_data IS NOT NULL;

-- =====================================================================
-- SECTION 8: Validation and reporting
-- =====================================================================

-- Report on changes made
DO $$
DECLARE
    buyer_count INTEGER;
    creator_count INTEGER;
    missing_account_type INTEGER;
    users_fixed INTEGER;
BEGIN
    -- Count users by type
    SELECT COUNT(*) INTO buyer_count
    FROM auth.users
    WHERE raw_user_meta_data->>'account_type' = 'buyer';

    SELECT COUNT(*) INTO creator_count
    FROM auth.users
    WHERE raw_user_meta_data->>'account_type' = 'creator';

    SELECT COUNT(*) INTO missing_account_type
    FROM auth.users
    WHERE raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'account_type');

    SELECT COUNT(*) INTO users_fixed
    FROM auth.users_metadata_backup b
    JOIN auth.users u ON b.id = u.id
    WHERE b.raw_user_meta_data != u.raw_user_meta_data;

    RAISE NOTICE '=== METADATA FIX REPORT ===';
    RAISE NOTICE 'Buyer users: %', buyer_count;
    RAISE NOTICE 'Creator users: %', creator_count;
    RAISE NOTICE 'Users without account_type: %', missing_account_type;
    RAISE NOTICE 'Users with metadata fixes: %', users_fixed;
    RAISE NOTICE '============================';
END $$;

-- =====================================================================
-- SECTION 9: Final validation queries
-- =====================================================================

-- Check for remaining issues
SELECT
    'Missing account_type' as issue,
    COUNT(*) as count
FROM auth.users
WHERE raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'account_type')

UNION ALL

SELECT
    'Buyers missing tier' as issue,
    COUNT(*) as count
FROM auth.users
WHERE raw_user_meta_data->>'account_type' = 'buyer'
AND NOT (raw_user_meta_data ? 'tier')

UNION ALL

SELECT
    'Creators missing invitation_status' as issue,
    COUNT(*) as count
FROM auth.users
WHERE raw_user_meta_data->>'account_type' = 'creator'
AND NOT (raw_user_meta_data ? 'invitation_status')

UNION ALL

SELECT
    'Users with camelCase fields' as issue,
    COUNT(*) as count
FROM auth.users
WHERE raw_user_meta_data ? 'fullName'
   OR raw_user_meta_data ? 'buyerCompany'
   OR raw_user_meta_data ? 'buyerRole'
   OR raw_user_meta_data ? 'linkedinUrl'
   OR raw_user_meta_data ? 'penName'
   OR raw_user_meta_data ? 'penNameOrStudio'
   OR raw_user_meta_data ? 'ipOwnerRole'
   OR raw_user_meta_data ? 'ipOwnerCompany'
   OR raw_user_meta_data ? 'websiteUrl';

-- =====================================================================
-- SECTION 10: Cleanup
-- =====================================================================

-- Update the updated_at timestamp for modified users
UPDATE auth.users
SET updated_at = NOW()
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    JOIN auth.users_metadata_backup b ON u.id = b.id
    WHERE u.raw_user_meta_data != b.raw_user_meta_data
);

-- Clean up: Drop backup table after successful execution (optional)
-- Uncomment the line below only after verifying all changes are correct
-- DROP TABLE auth.users_metadata_backup;

COMMIT;

-- =====================================================================
-- NOTES FOR FUTURE MAINTENANCE
-- =====================================================================

-- 1. This script addresses known issues as of 2025-01-19
-- 2. New signup flows should prevent these issues going forward
-- 3. Regular metadata audits should be performed
-- 4. Consider adding database constraints to prevent future inconsistencies
-- 5. The backup table can be kept for rollback if needed

-- For rollback (if needed):
-- UPDATE auth.users
-- SET raw_user_meta_data = b.raw_user_meta_data, updated_at = b.updated_at
-- FROM auth.users_metadata_backup b
-- WHERE auth.users.id = b.id;