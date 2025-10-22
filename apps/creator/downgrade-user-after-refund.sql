-- =====================================================================
-- Manual User Downgrade Script After Refund
-- =====================================================================
-- Purpose: Safely downgrade a user from Pro tier to Basic after refund
-- Usage: Execute this script in Supabase SQL Editor
--
-- IMPORTANT:
-- 1. Replace 'user@example.com' with actual user email
-- 2. Review the verification output before committing
-- 3. Run in a transaction so you can rollback if needed
-- =====================================================================

-- Start transaction for safety (can rollback if needed)
BEGIN;

-- =====================================================================
-- STEP 1: Verify current user state
-- =====================================================================
-- Check current tier and subscription status BEFORE changes

SELECT
  'BEFORE STATE' as check_point,
  ub.id as user_id,
  ub.email,
  ub.full_name,
  ub.tier as current_tier,
  sc.subscription_status as current_subscription_status,
  sc.stripe_customer_id,
  sc.stripe_subscription_id,
  sc.current_period_end,
  sc.updated_at as stripe_last_updated
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON sc.user_id = ub.id
WHERE ub.email = 'user@example.com'; -- ⚠️ REPLACE WITH ACTUAL USER EMAIL

-- =====================================================================
-- STEP 2: Update user tier to basic
-- =====================================================================

UPDATE user_buyers
SET
  tier = 'basic',
  updated_at = now()
WHERE email = 'user@example.com' -- ⚠️ REPLACE WITH ACTUAL USER EMAIL
RETURNING
  id,
  email,
  full_name,
  tier as new_tier,
  updated_at;

-- =====================================================================
-- STEP 3: Update Stripe subscription status to canceled
-- =====================================================================

UPDATE stripe_customers
SET
  subscription_status = 'canceled',
  cancel_at_period_end = true,
  updated_at = now()
WHERE user_id = (
  SELECT id FROM user_buyers WHERE email = 'user@example.com' -- ⚠️ REPLACE WITH ACTUAL USER EMAIL
)
RETURNING
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status as new_status,
  updated_at;

-- =====================================================================
-- STEP 4: Verify final state
-- =====================================================================

SELECT
  'AFTER STATE' as check_point,
  ub.id as user_id,
  ub.email,
  ub.full_name,
  ub.tier as new_tier,
  sc.subscription_status as new_subscription_status,
  sc.stripe_customer_id,
  sc.stripe_subscription_id,
  sc.current_period_end,
  sc.updated_at as stripe_last_updated
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON sc.user_id = ub.id
WHERE ub.email = 'user@example.com'; -- ⚠️ REPLACE WITH ACTUAL USER EMAIL

-- =====================================================================
-- STEP 5: Commit or Rollback
-- =====================================================================

-- ✅ If everything looks correct, COMMIT the transaction:
COMMIT;

-- ❌ If something looks wrong, ROLLBACK instead:
-- ROLLBACK;

-- =====================================================================
-- NOTES:
-- =====================================================================
-- 1. This script is safe to run multiple times (idempotent)
-- 2. User will immediately lose Pro tier access after COMMIT
-- 3. Stripe subscription record is marked as 'canceled' for audit trail
-- 4. Original stripe_customer_id and stripe_subscription_id are preserved
-- 5. All changes are timestamped with updated_at
--
-- AUDIT TRAIL:
-- - user_buyers.updated_at shows when tier was changed
-- - stripe_customers.updated_at shows when status was updated
--
-- TO REVERSE (if needed):
-- UPDATE user_buyers SET tier = 'pro' WHERE email = 'user@example.com';
-- UPDATE stripe_customers SET subscription_status = 'active'
-- WHERE user_id = (SELECT id FROM user_buyers WHERE email = 'user@example.com');
-- =====================================================================
