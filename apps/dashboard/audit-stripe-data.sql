-- Comprehensive Stripe Data Audit
-- Identifies data inconsistencies between user_buyers and stripe_customers tables

-- ===========================================
-- SECTION 1: Data Inconsistency Analysis
-- ===========================================

SELECT '=== DATA INCONSISTENCY AUDIT ===' as section;

-- 1. Users with active subscription status but no subscription ID (PROBLEMATIC)
SELECT
    '1. Active status but no subscription ID (BLOCKS NEW PAYMENTS)' as issue_type,
    sc.user_id,
    ub.email,
    ub.tier,
    sc.subscription_status,
    sc.stripe_subscription_id,
    sc.current_period_end
FROM stripe_customers sc
JOIN user_buyers ub ON sc.user_id = ub.id
WHERE sc.subscription_status = 'active'
  AND sc.stripe_subscription_id IS NULL;

-- 2. Pro users without any stripe_customers record
SELECT
    '2. Pro users missing stripe_customers record' as issue_type,
    ub.id as user_id,
    ub.email,
    ub.tier,
    'MISSING' as subscription_status,
    'MISSING' as stripe_subscription_id
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.tier = 'pro'
  AND sc.user_id IS NULL;

-- 3. Basic users with active subscription status (INCONSISTENT)
SELECT
    '3. Basic users with active subscription (INCONSISTENT)' as issue_type,
    sc.user_id,
    ub.email,
    ub.tier,
    sc.subscription_status,
    sc.stripe_subscription_id,
    sc.current_period_end
FROM stripe_customers sc
JOIN user_buyers ub ON sc.user_id = ub.id
WHERE ub.tier = 'basic'
  AND sc.subscription_status = 'active';

-- 4. stripe_customers records without corresponding user_buyers (ORPHANED)
SELECT
    '4. Orphaned stripe_customers records' as issue_type,
    sc.user_id,
    'NO_USER_RECORD' as email,
    'MISSING' as tier,
    sc.subscription_status,
    sc.stripe_subscription_id
FROM stripe_customers sc
LEFT JOIN user_buyers ub ON sc.user_id = ub.id
WHERE ub.id IS NULL;

-- ===========================================
-- SECTION 2: Current Data State Summary
-- ===========================================

SELECT '=== CURRENT DATA STATE SUMMARY ===' as section;

-- Total counts by tier
SELECT
    'User counts by tier' as summary_type,
    tier,
    COUNT(*) as count
FROM user_buyers
GROUP BY tier
ORDER BY tier;

-- Stripe customers by status
SELECT
    'Stripe customers by status' as summary_type,
    COALESCE(subscription_status, 'NULL') as status,
    COUNT(*) as count
FROM stripe_customers
GROUP BY subscription_status
ORDER BY subscription_status;

-- Combined view of all data
SELECT
    'Complete user data view' as summary_type,
    ub.id,
    ub.email,
    ub.tier,
    COALESCE(sc.subscription_status, 'NO_RECORD') as subscription_status,
    COALESCE(sc.stripe_customer_id, 'NO_RECORD') as stripe_customer_id,
    CASE
        WHEN sc.stripe_subscription_id IS NOT NULL THEN 'HAS_SUBSCRIPTION'
        WHEN sc.user_id IS NOT NULL THEN 'NO_SUBSCRIPTION'
        ELSE 'NO_RECORD'
    END as subscription_id_status,
    sc.current_period_end
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
ORDER BY ub.tier DESC, ub.email;

-- ===========================================
-- SECTION 3: Test User Specific Analysis
-- ===========================================

SELECT '=== TEST USER ANALYSIS ===' as section;

-- Detailed view of the test user we've been working with
SELECT
    'Test user detailed state' as analysis_type,
    ub.id,
    ub.email,
    ub.tier,
    ub.created_at as user_created,
    sc.subscription_status,
    sc.stripe_customer_id,
    sc.stripe_subscription_id,
    sc.current_period_end,
    sc.cancel_at_period_end,
    sc.created_at as stripe_record_created,
    sc.updated_at as stripe_record_updated
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.id = 'a39c89a1-425f-4796-906c-a0c0723fa449'
   OR ub.email = 'sunghol@cultureflipper.com';

SELECT 'Audit completed successfully' as result;