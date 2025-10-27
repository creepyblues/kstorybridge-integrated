-- Manual Tier Fix SQL Script
-- Updates the specific user who had successful payment to Pro tier

-- User ID from debug logs: a39c89a1-425f-4796-906c-a0c0723fa449
-- Email: sunghol@cultureflipper.com

BEGIN;

-- Step 1: Check current user status
SELECT
    'BEFORE UPDATE' as status,
    id,
    email,
    tier,
    created_at
FROM user_buyers
WHERE id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 2: Update user tier to Pro
UPDATE user_buyers
SET tier = 'pro'
WHERE id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 3: Update stripe_customers record
UPDATE stripe_customers
SET
    subscription_status = 'active',
    current_period_end = (NOW() + INTERVAL '30 days'),
    cancel_at_period_end = false,
    updated_at = NOW()
WHERE user_id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

-- Step 4: Verify the updates
SELECT
    'AFTER UPDATE' as status,
    ub.id,
    ub.email,
    ub.tier,
    sc.subscription_status,
    sc.current_period_end,
    sc.cancel_at_period_end
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.id = 'a39c89a1-425f-4796-906c-a0c0723fa449';

COMMIT;

-- Summary message
SELECT 'Manual tier fix completed successfully! User should now have Pro tier access.' as result;