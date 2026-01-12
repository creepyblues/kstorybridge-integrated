-- =============================================================================
-- EMAIL SWAP: sungho@dadble.com -> sungho@kstorybridge.com
-- Date: 2026-01-11
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Run Section 1 (Pre-flight checks) first to verify state
-- 2. Review results before proceeding
-- 3. Run Section 2 (Backup) to create backup
-- 4. Run Section 3 (Core updates) in a single execution
-- 5. Run Section 4 (Historical updates)
-- 6. Run Section 5 (Verification)
-- =============================================================================

-- =============================================================================
-- SECTION 1: PRE-FLIGHT CHECKS (Run this first)
-- =============================================================================

-- 1.1 Check if account exists in auth.users
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'sungho@dadble.com';

-- 1.2 Check if account exists in admin table
SELECT id, email, full_name, active
FROM admin
WHERE email = 'sungho@dadble.com';

-- 1.3 Check if account exists in user_buyers
SELECT id, email, full_name, tier, buyer_company
FROM user_buyers
WHERE email = 'sungho@dadble.com';

-- 1.4 Verify new email doesn't already exist
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users WHERE email = 'sungho@kstorybridge.com'
UNION ALL
SELECT 'admin', COUNT(*) FROM admin WHERE email = 'sungho@kstorybridge.com'
UNION ALL
SELECT 'user_buyers', COUNT(*) FROM user_buyers WHERE email = 'sungho@kstorybridge.com';

-- 1.5 Count historical records to be updated
SELECT 'chat_sessions' as table_name, COUNT(*) as count FROM chat_sessions WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'mandate_searches', COUNT(*) FROM mandate_searches WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'comp_searches', COUNT(*) FROM comp_searches WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'content_posts', COUNT(*) FROM content_posts WHERE author_email = 'sungho@dadble.com'
UNION ALL
SELECT 'title_marketing_assets', COUNT(*) FROM title_marketing_assets WHERE approved_by_email = 'sungho@dadble.com'
UNION ALL
SELECT 'discount_coupons', COUNT(*) FROM discount_coupons WHERE created_by = 'sungho@dadble.com'
UNION ALL
SELECT 'user_onboarding', COUNT(*) FROM user_onboarding WHERE user_email = 'sungho@dadble.com';


-- =============================================================================
-- SECTION 2: CREATE BACKUP (Run after pre-flight checks pass)
-- =============================================================================

-- Create backup table with timestamp
CREATE TABLE IF NOT EXISTS _backup_email_swap_20260111 (
    table_name TEXT,
    record_id TEXT,
    email TEXT,
    extra_data TEXT,
    backed_up_at TIMESTAMPTZ DEFAULT now()
);

-- Backup auth.users
INSERT INTO _backup_email_swap_20260111 (table_name, record_id, email, extra_data)
SELECT 'auth.users', id::text, email, raw_user_meta_data::text
FROM auth.users
WHERE email = 'sungho@dadble.com';

-- Backup admin
INSERT INTO _backup_email_swap_20260111 (table_name, record_id, email, extra_data)
SELECT 'admin', id::text, email, full_name
FROM admin
WHERE email = 'sungho@dadble.com';

-- Backup user_buyers
INSERT INTO _backup_email_swap_20260111 (table_name, record_id, email, extra_data)
SELECT 'user_buyers', id::text, email, full_name
FROM user_buyers
WHERE email = 'sungho@dadble.com';

-- Verify backup created
SELECT * FROM _backup_email_swap_20260111;


-- =============================================================================
-- SECTION 3: UPDATE CORE IDENTITY TABLES (Run in single transaction)
-- =============================================================================

BEGIN;

-- Update auth.users (primary identity)
UPDATE auth.users
SET email = 'sungho@kstorybridge.com',
    updated_at = now()
WHERE email = 'sungho@dadble.com';

-- Update admin table (admin access)
UPDATE admin
SET email = 'sungho@kstorybridge.com'
WHERE email = 'sungho@dadble.com';

-- Update user_buyers (profile)
UPDATE user_buyers
SET email = 'sungho@kstorybridge.com',
    updated_at = now()
WHERE email = 'sungho@dadble.com';

COMMIT;


-- =============================================================================
-- SECTION 4: UPDATE HISTORICAL DATA (Run after core updates)
-- =============================================================================

-- Chat sessions
UPDATE chat_sessions
SET user_email = 'sungho@kstorybridge.com'
WHERE user_email = 'sungho@dadble.com';

-- Mandate searches
UPDATE mandate_searches
SET user_email = 'sungho@kstorybridge.com'
WHERE user_email = 'sungho@dadble.com';

-- Comp searches
UPDATE comp_searches
SET user_email = 'sungho@kstorybridge.com'
WHERE user_email = 'sungho@dadble.com';

-- Content posts (CMS)
UPDATE content_posts
SET author_email = 'sungho@kstorybridge.com'
WHERE author_email = 'sungho@dadble.com';

-- Marketing assets
UPDATE title_marketing_assets
SET approved_by_email = 'sungho@kstorybridge.com'
WHERE approved_by_email = 'sungho@dadble.com';

-- Discount coupons
UPDATE discount_coupons
SET created_by = 'sungho@kstorybridge.com'
WHERE created_by = 'sungho@dadble.com';

-- Onboarding
UPDATE user_onboarding
SET user_email = 'sungho@kstorybridge.com'
WHERE user_email = 'sungho@dadble.com';


-- =============================================================================
-- SECTION 5: VERIFICATION (Run after all updates)
-- =============================================================================

-- Verify core tables updated
SELECT 'auth.users' as table_name, email FROM auth.users WHERE email = 'sungho@kstorybridge.com'
UNION ALL
SELECT 'admin', email FROM admin WHERE email = 'sungho@kstorybridge.com'
UNION ALL
SELECT 'user_buyers', email FROM user_buyers WHERE email = 'sungho@kstorybridge.com';

-- Verify old email no longer exists anywhere
SELECT 'auth.users' as table_name, COUNT(*) as remaining FROM auth.users WHERE email = 'sungho@dadble.com'
UNION ALL
SELECT 'admin', COUNT(*) FROM admin WHERE email = 'sungho@dadble.com'
UNION ALL
SELECT 'user_buyers', COUNT(*) FROM user_buyers WHERE email = 'sungho@dadble.com'
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'mandate_searches', COUNT(*) FROM mandate_searches WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'comp_searches', COUNT(*) FROM comp_searches WHERE user_email = 'sungho@dadble.com'
UNION ALL
SELECT 'content_posts', COUNT(*) FROM content_posts WHERE author_email = 'sungho@dadble.com'
UNION ALL
SELECT 'title_marketing_assets', COUNT(*) FROM title_marketing_assets WHERE approved_by_email = 'sungho@dadble.com'
UNION ALL
SELECT 'discount_coupons', COUNT(*) FROM discount_coupons WHERE created_by = 'sungho@dadble.com'
UNION ALL
SELECT 'user_onboarding', COUNT(*) FROM user_onboarding WHERE user_email = 'sungho@dadble.com';
-- All counts should be 0


-- =============================================================================
-- ROLLBACK (Only if needed - DO NOT RUN unless there's an issue)
-- =============================================================================

-- UNCOMMENT AND RUN IF ROLLBACK NEEDED:
/*
UPDATE auth.users SET email = 'sungho@dadble.com' WHERE email = 'sungho@kstorybridge.com';
UPDATE admin SET email = 'sungho@dadble.com' WHERE email = 'sungho@kstorybridge.com';
UPDATE user_buyers SET email = 'sungho@dadble.com' WHERE email = 'sungho@kstorybridge.com';
UPDATE chat_sessions SET user_email = 'sungho@dadble.com' WHERE user_email = 'sungho@kstorybridge.com';
UPDATE mandate_searches SET user_email = 'sungho@dadble.com' WHERE user_email = 'sungho@kstorybridge.com';
UPDATE comp_searches SET user_email = 'sungho@dadble.com' WHERE user_email = 'sungho@kstorybridge.com';
UPDATE content_posts SET author_email = 'sungho@dadble.com' WHERE author_email = 'sungho@kstorybridge.com';
UPDATE title_marketing_assets SET approved_by_email = 'sungho@dadble.com' WHERE approved_by_email = 'sungho@kstorybridge.com';
UPDATE discount_coupons SET created_by = 'sungho@dadble.com' WHERE created_by = 'sungho@kstorybridge.com';
UPDATE user_onboarding SET user_email = 'sungho@dadble.com' WHERE user_email = 'sungho@kstorybridge.com';
*/
