-- Quick debug query for the current webhook processing issue
-- Focus on the test user that just made a payment

SELECT '=== POST-PAYMENT USER STATE ===' as section;

-- Check the specific test user state
SELECT
    'Test user current state' as query_type,
    ub.id,
    ub.email,
    ub.tier,
    ub.updated_at as user_last_updated,
    sc.subscription_status,
    sc.stripe_customer_id,
    sc.stripe_subscription_id,
    sc.current_period_end,
    sc.cancel_at_period_end,
    sc.updated_at as stripe_record_updated
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.email = 'sunghol@cultureflipper.com';

-- Check if there are any stripe_customers records for this user
SELECT
    'All stripe_customers for test user' as query_type,
    *
FROM stripe_customers
WHERE user_id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Check recent stripe_customers updates (last hour)
SELECT
    'Recent stripe_customers updates' as query_type,
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_status,
    updated_at
FROM stripe_customers
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Check recent user_buyers tier updates (last hour)
SELECT
    'Recent tier updates' as query_type,
    id,
    email,
    tier,
    updated_at
FROM user_buyers
WHERE updated_at > NOW() - INTERVAL '1 hour'
AND tier = 'pro'
ORDER BY updated_at DESC;