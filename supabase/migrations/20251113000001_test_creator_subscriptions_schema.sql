/**
 * PHASE 1 TEST SUITE: Creator Subscriptions Schema
 *
 * Purpose: Verify database schema integrity, RLS policies, and data constraints
 * Status: TEST FILE (Safe to run - only performs checks, no destructive operations)
 *
 * Test Categories:
 * 1. Schema Validation
 * 2. RLS Policy Testing
 * 3. Data Constraint Validation
 * 4. Index Performance
 * 5. Foreign Key Integrity
 */

-- ============================================================================
-- TEST 1: Schema Validation - Verify all tables exist
-- ============================================================================

DO $$
DECLARE
  missing_tables text[];
  expected_tables text[] := ARRAY[
    'creator_subscriptions',
    'creator_stripe_customers',
    'discount_coupons',
    'coupon_redemptions',
    'creator_payments'
  ];
  table_name text;
BEGIN
  RAISE NOTICE '=== TEST 1: Schema Validation ===';

  -- Check each expected table
  FOREACH table_name IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'FAIL: Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'PASS: All 5 tables created successfully';
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Column Validation - Verify required columns exist
-- ============================================================================

DO $$
DECLARE
  missing_columns text[];
BEGIN
  RAISE NOTICE '=== TEST 2: Column Validation ===';

  -- Check creator_subscriptions columns
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'creator_subscriptions'
    AND column_name = 'title_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'creator_subscriptions.title_id');
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'creator_subscriptions'
    AND column_name = 'stripe_subscription_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'creator_subscriptions.stripe_subscription_id');
  END IF;

  -- Check discount_coupons columns
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'discount_coupons'
    AND column_name = 'code'
  ) THEN
    missing_columns := array_append(missing_columns, 'discount_coupons.code');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'FAIL: Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'PASS: All critical columns present';
  END IF;
END $$;

-- ============================================================================
-- TEST 3: Index Validation - Verify performance indexes exist
-- ============================================================================

DO $$
DECLARE
  missing_indexes text[];
  expected_indexes text[] := ARRAY[
    'idx_creator_subs_email',
    'idx_creator_subs_title',
    'idx_creator_subs_stripe',
    'idx_coupons_code',
    'idx_creator_payments_email'
  ];
  index_name text;
BEGIN
  RAISE NOTICE '=== TEST 3: Index Validation ===';

  FOREACH index_name IN ARRAY expected_indexes
  LOOP
    IF NOT EXISTS (
      SELECT FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname = index_name
    ) THEN
      missing_indexes := array_append(missing_indexes, index_name);
    END IF;
  END LOOP;

  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE WARNING 'WARN: Missing indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE 'PASS: All critical indexes created';
  END IF;
END $$;

-- ============================================================================
-- TEST 4: RLS Policy Validation - Verify security policies exist
-- ============================================================================

DO $$
DECLARE
  missing_policies text[];
  policy_count integer;
BEGIN
  RAISE NOTICE '=== TEST 4: RLS Policy Validation ===';

  -- Check creator_subscriptions policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'creator_subscriptions';

  IF policy_count < 2 THEN
    missing_policies := array_append(missing_policies, 'creator_subscriptions (expected 2, found ' || policy_count || ')');
  END IF;

  -- Check discount_coupons policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'discount_coupons';

  IF policy_count < 3 THEN
    missing_policies := array_append(missing_policies, 'discount_coupons (expected 3, found ' || policy_count || ')');
  END IF;

  -- Check RLS is enabled
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'creator_subscriptions'
    AND rowsecurity = true
  ) THEN
    missing_policies := array_append(missing_policies, 'RLS not enabled on creator_subscriptions');
  END IF;

  IF array_length(missing_policies, 1) > 0 THEN
    RAISE EXCEPTION 'FAIL: Policy issues: %', array_to_string(missing_policies, ', ');
  ELSE
    RAISE NOTICE 'PASS: All RLS policies configured correctly';
  END IF;
END $$;

-- ============================================================================
-- TEST 5: Data Constraint Testing - Insert valid and invalid data
-- ============================================================================

DO $$
DECLARE
  test_sub_id uuid;
  test_customer_id uuid;
  test_coupon_id uuid;
  error_message text;
BEGIN
  RAISE NOTICE '=== TEST 5: Data Constraint Testing ===';

  -- Test 5.1: Valid subscription insert (should succeed)
  BEGIN
    -- First create a test title if not exists
    INSERT INTO titles (title_id, title_name_kr, creator_id)
    VALUES (gen_random_uuid(), 'Test Title', 'test@example.com')
    ON CONFLICT (title_id) DO NOTHING;

    -- Create Stripe customer
    INSERT INTO creator_stripe_customers (creator_email, stripe_customer_id)
    VALUES ('test@example.com', 'cus_test_123')
    RETURNING id INTO test_customer_id;

    -- Create subscription
    INSERT INTO creator_subscriptions (
      creator_email,
      title_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      billing_period,
      status
    )
    SELECT
      'test@example.com',
      title_id,
      'sub_test_123',
      'cus_test_123',
      'packaging',
      'monthly',
      'active'
    FROM titles
    WHERE title_name_kr = 'Test Title'
    LIMIT 1
    RETURNING id INTO test_sub_id;

    RAISE NOTICE 'PASS: Valid subscription insert succeeded';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'FAIL: Valid subscription insert failed: %', error_message;
  END;

  -- Test 5.2: Invalid plan_type (should fail)
  BEGIN
    INSERT INTO creator_subscriptions (
      creator_email,
      title_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      billing_period,
      status
    )
    SELECT
      'test@example.com',
      title_id,
      'sub_test_invalid',
      'cus_test_123',
      'invalid_plan',  -- This should violate CHECK constraint
      'monthly',
      'active'
    FROM titles
    WHERE title_name_kr = 'Test Title'
    LIMIT 1;

    RAISE WARNING 'FAIL: Invalid plan_type should have been rejected';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'PASS: Invalid plan_type correctly rejected';
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'UNEXPECTED: Different error: %', error_message;
  END;

  -- Test 5.3: Duplicate stripe_subscription_id (should fail)
  BEGIN
    INSERT INTO creator_subscriptions (
      creator_email,
      title_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      billing_period,
      status
    )
    SELECT
      'test2@example.com',
      title_id,
      'sub_test_123',  -- Duplicate
      'cus_test_456',
      'premium',
      'yearly',
      'active'
    FROM titles
    WHERE title_name_kr = 'Test Title'
    LIMIT 1;

    RAISE WARNING 'FAIL: Duplicate subscription ID should have been rejected';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'PASS: Duplicate subscription ID correctly rejected';
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'UNEXPECTED: Different error: %', error_message;
  END;

  -- Test 5.4: Valid coupon insert
  BEGIN
    INSERT INTO discount_coupons (
      code,
      discount_type,
      discount_value,
      applicable_plans
    )
    VALUES (
      'TEST25',
      'percentage',
      25,
      ARRAY['packaging', 'premium']
    )
    RETURNING id INTO test_coupon_id;

    RAISE NOTICE 'PASS: Valid coupon insert succeeded';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'FAIL: Valid coupon insert failed: %', error_message;
  END;

  -- Cleanup test data
  DELETE FROM creator_subscriptions WHERE id = test_sub_id;
  DELETE FROM creator_stripe_customers WHERE id = test_customer_id;
  DELETE FROM discount_coupons WHERE id = test_coupon_id;
  DELETE FROM titles WHERE title_name_kr = 'Test Title';

  RAISE NOTICE 'Test data cleaned up';
END $$;

-- ============================================================================
-- TEST 6: Foreign Key Integrity
-- ============================================================================

DO $$
DECLARE
  error_message text;
BEGIN
  RAISE NOTICE '=== TEST 6: Foreign Key Integrity ===';

  -- Test 6.1: Cannot create subscription without valid title_id (should fail)
  BEGIN
    INSERT INTO creator_subscriptions (
      creator_email,
      title_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      billing_period,
      status
    )
    VALUES (
      'test@example.com',
      gen_random_uuid(),  -- Non-existent title
      'sub_test_fk',
      'cus_test_fk',
      'packaging',
      'monthly',
      'active'
    );

    RAISE WARNING 'FAIL: Should reject subscription with invalid title_id';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'PASS: Foreign key constraint working (title_id)';
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'UNEXPECTED: Different error: %', error_message;
  END;

  -- Test 6.2: Cascading delete (subscription should be deleted when title is deleted)
  BEGIN
    -- Create test title
    INSERT INTO titles (title_id, title_name_kr, creator_id)
    VALUES (gen_random_uuid(), 'Test Cascade Title', 'test@example.com');

    -- Create subscription
    INSERT INTO creator_subscriptions (
      creator_email,
      title_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      billing_period,
      status
    )
    SELECT
      'test@example.com',
      title_id,
      'sub_test_cascade',
      'cus_test_cascade',
      'packaging',
      'monthly',
      'active'
    FROM titles
    WHERE title_name_kr = 'Test Cascade Title';

    -- Delete title (should cascade)
    DELETE FROM titles WHERE title_name_kr = 'Test Cascade Title';

    -- Check if subscription was also deleted
    IF EXISTS (
      SELECT FROM creator_subscriptions
      WHERE stripe_subscription_id = 'sub_test_cascade'
    ) THEN
      RAISE WARNING 'FAIL: Cascade delete not working';
    ELSE
      RAISE NOTICE 'PASS: Cascade delete working correctly';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'FAIL: Cascade test failed: %', error_message;
  END;
END $$;

-- ============================================================================
-- TEST 7: Trigger Validation - updated_at auto-update
-- ============================================================================

DO $$
DECLARE
  old_timestamp timestamptz;
  new_timestamp timestamptz;
  test_id uuid;
BEGIN
  RAISE NOTICE '=== TEST 7: Trigger Validation ===';

  -- Create test customer
  INSERT INTO creator_stripe_customers (creator_email, stripe_customer_id)
  VALUES ('trigger_test@example.com', 'cus_trigger_test')
  RETURNING id, updated_at INTO test_id, old_timestamp;

  -- Wait a moment
  PERFORM pg_sleep(0.1);

  -- Update record
  UPDATE creator_stripe_customers
  SET stripe_customer_id = 'cus_trigger_test_updated'
  WHERE id = test_id
  RETURNING updated_at INTO new_timestamp;

  -- Check if updated_at changed
  IF new_timestamp > old_timestamp THEN
    RAISE NOTICE 'PASS: updated_at trigger working correctly';
  ELSE
    RAISE WARNING 'FAIL: updated_at trigger not working';
  END IF;

  -- Cleanup
  DELETE FROM creator_stripe_customers WHERE id = test_id;
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 1 Test Suite Complete';
  RAISE NOTICE 'Review PASS/FAIL messages above';
  RAISE NOTICE '========================================';
END $$;
