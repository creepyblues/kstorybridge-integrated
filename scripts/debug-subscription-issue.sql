-- Debug Script: Why is subscription missing but payment exists?
-- Run this in Supabase Dashboard → SQL Editor

-- Check payment record (should exist - you saw $100 transaction)
SELECT
  'Payment Records' as record_type,
  id,
  creator_email,
  amount / 100.0 as amount_dollars,
  currency,
  status,
  description,
  created_at
FROM creator_payments
WHERE creator_email = 'sleekr21@gmail.com'
ORDER BY created_at DESC
LIMIT 5;

-- Check subscription records (should be missing)
SELECT
  'Subscription Records' as record_type,
  id,
  creator_email,
  title_id,
  plan_type,
  billing_period,
  status,
  stripe_subscription_id,
  created_at
FROM creator_subscriptions
WHERE creator_email = 'sleekr21@gmail.com'
ORDER BY created_at DESC
LIMIT 5;

-- Check Stripe customer records
SELECT
  'Stripe Customer Records' as record_type,
  id,
  creator_email,
  stripe_customer_id,
  created_at
FROM creator_stripe_customers
WHERE creator_email = 'sleekr21@gmail.com';

-- Check what titles this creator has
SELECT
  'Creator Titles' as record_type,
  title_id,
  title_name_kr,
  title_name_en,
  creator_id,
  created_at
FROM titles
WHERE creator_id = (
  SELECT id FROM auth.users WHERE email = 'sleekr21@gmail.com'
)
ORDER BY created_at DESC;

-- Check auth.users to get the UUID
SELECT
  'Auth User' as record_type,
  id as user_uuid,
  email,
  created_at
FROM auth.users
WHERE email = 'sleekr21@gmail.com';
