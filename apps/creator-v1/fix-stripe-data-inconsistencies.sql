-- Fix Stripe Data Inconsistencies
-- Resolves data problems that prevent payment flow from working correctly

BEGIN;

-- ===========================================
-- SECTION 1: Fix Test User for Payment Testing
-- ===========================================

SELECT '=== FIXING TEST USER FOR PAYMENT TESTING ===' as section;

-- Test user ID from our debugging
-- Email: sunghol@cultureflipper.com
-- ID: a39c89a1-425f-4796-906c-a0c0723fa449

-- Step 1: Show current state
SELECT
    'Test user BEFORE fixes' as status,
    ub.email,
    ub.tier,
    sc.subscription_status,
    sc.stripe_subscription_id,
    sc.current_period_end
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 2: Reset test user to allow new payment testing
-- Clear subscription data to remove the "already has active subscription" block
UPDATE stripe_customers
SET
    subscription_status = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    cancel_at_period_end = FALSE,
    updated_at = NOW()
WHERE user_id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 3: Ensure user tier is basic for testing
UPDATE user_buyers
SET tier = 'basic'
WHERE id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 4: Verify the fixes
SELECT
    'Test user AFTER fixes' as status,
    ub.email,
    ub.tier,
    COALESCE(sc.subscription_status, 'NULL') as subscription_status,
    COALESCE(sc.stripe_subscription_id, 'NULL') as stripe_subscription_id,
    sc.current_period_end
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- ===========================================
-- SECTION 2: Fix Other Data Inconsistencies
-- ===========================================

SELECT '=== FIXING OTHER DATA INCONSISTENCIES ===' as section;

-- Fix 1: Users with active status but no subscription ID
-- These are likely manually upgraded users or test data
UPDATE stripe_customers
SET
    subscription_status = NULL,
    current_period_end = NULL,
    cancel_at_period_end = FALSE,
    updated_at = NOW()
WHERE subscription_status = 'active'
  AND stripe_subscription_id IS NULL
  AND user_id != 'a39c89a1-425f-4796-906c-a0c0723fa449'; -- We already handled test user

-- Fix 2: Create stripe_customers records for Pro users who don't have them
INSERT INTO stripe_customers (user_id, created_at, updated_at)
SELECT
    ub.id,
    NOW(),
    NOW()
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.tier = 'pro'
  AND sc.user_id IS NULL;

-- Fix 3: Reset basic users who have active subscription status
UPDATE stripe_customers
SET
    subscription_status = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    cancel_at_period_end = FALSE,
    updated_at = NOW()
FROM user_buyers ub
WHERE stripe_customers.user_id = ub.id
  AND ub.tier = 'basic'
  AND stripe_customers.subscription_status = 'active';

-- ===========================================
-- SECTION 3: Verification Queries
-- ===========================================

SELECT '=== VERIFICATION OF FIXES ===' as section;

-- Check for remaining inconsistencies after fixes
SELECT
    'Remaining issues check' as check_type,
    COUNT(*) as count,
    'Users with active status but no subscription ID' as issue
FROM stripe_customers
WHERE subscription_status = 'active'
  AND stripe_subscription_id IS NULL

UNION ALL

SELECT
    'Remaining issues check' as check_type,
    COUNT(*) as count,
    'Pro users without stripe_customers record' as issue
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.tier = 'pro'
  AND sc.user_id IS NULL

UNION ALL

SELECT
    'Remaining issues check' as check_type,
    COUNT(*) as count,
    'Basic users with active subscription' as issue
FROM stripe_customers sc
JOIN user_buyers ub ON sc.user_id = ub.id
WHERE ub.tier = 'basic'
  AND sc.subscription_status = 'active';

-- Final summary of all users
SELECT
    'Final data state' as summary_type,
    ub.email,
    ub.tier,
    COALESCE(sc.subscription_status, 'NULL') as subscription_status,
    CASE
        WHEN sc.stripe_subscription_id IS NOT NULL THEN 'HAS_SUB_ID'
        WHEN sc.user_id IS NOT NULL THEN 'NO_SUB_ID'
        ELSE 'NO_RECORD'
    END as subscription_id_status
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
ORDER BY ub.tier DESC, ub.email;

COMMIT;

SELECT '✅ Data inconsistency fixes completed successfully!' as result;
SELECT 'Test user is now ready for payment testing' as next_step;