-- Setup Test User Accounts for E2E Testing
-- Run these SQL statements in Supabase SQL Editor

-- ============================================================================
-- IMPORTANT: These are TEST accounts only
-- Use dedicated test emails (e.g., test-buyer@yourdomain.com)
-- DO NOT use real user credentials
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE BUYER TEST ACCOUNT
-- ----------------------------------------------------------------------------

-- First, create the auth user via Supabase Dashboard or API:
-- Go to: Authentication > Users > Add User
-- Email: test-buyer@kstorybridge-test.com (or your test domain)
-- Password: [choose a secure test password]
-- OR use this query to get the auth.users ID after manual creation

-- Then insert into user_buyers table:
INSERT INTO user_buyers (
  email,
  full_name,
  buyer_company,
  buyer_role,
  tier,
  requested,
  created_at
)
VALUES (
  'test-buyer@kstorybridge-test.com',  -- Replace with your test email
  'Test Buyer Account',
  'Test Company Inc',
  'Content Acquisition',
  'basic',
  false,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify buyer account created:
SELECT email, full_name, tier, created_at
FROM user_buyers
WHERE email = 'test-buyer@kstorybridge-test.com';

-- ----------------------------------------------------------------------------
-- 2. CREATE CREATOR TEST ACCOUNT
-- ----------------------------------------------------------------------------

-- First, create the auth user via Supabase Dashboard or API:
-- Go to: Authentication > Users > Add User
-- Email: test-creator@kstorybridge-test.com (or your test domain)
-- Password: [choose a secure test password]

-- Then insert into user_creators table:
INSERT INTO user_creators (
  email,
  full_name,
  pen_name,
  ip_owner_role,
  invitation_status,
  created_at
)
VALUES (
  'test-creator@kstorybridge-test.com',  -- Replace with your test email
  'Test Creator Account',
  'Test Author',
  'author',
  'active',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify creator account created:
SELECT email, full_name, pen_name, ip_owner_role, invitation_status, created_at
FROM user_creators
WHERE email = 'test-creator@kstorybridge-test.com';

-- ----------------------------------------------------------------------------
-- 3. OPTIONAL: CREATE TEST TITLE (for title edit tests)
-- ----------------------------------------------------------------------------

-- Get the creator's UUID from auth.users:
-- SELECT id FROM auth.users WHERE email = 'test-creator@kstorybridge-test.com';

-- Insert test title (replace creator_id with actual UUID):
INSERT INTO titles (
  title_id,
  title_name_en,
  title_name_kr,
  title_url,
  title_image,
  story_author,
  genre,
  content_format,
  keywords,
  synopsis,
  description,
  creator_id,
  created_at
)
VALUES (
  gen_random_uuid(),
  'E2E Test Title',
  '테스트 제목',
  'https://example.com/test-title',
  'https://via.placeholder.com/300x400',
  'Test Author',
  ARRAY['fantasy'],
  'webtoon',
  ARRAY['test', 'automation', 'e2e'],
  'This is a test title for E2E testing purposes.',
  'A longer description for the test title used in automated testing.',
  (SELECT id FROM auth.users WHERE email = 'test-creator@kstorybridge-test.com'),
  NOW()
)
RETURNING title_id;

-- Save the returned title_id for your .env.test file (TEST_TITLE_ID)

-- ----------------------------------------------------------------------------
-- 4. VERIFY ACCOUNTS CAN AUTHENTICATE
-- ----------------------------------------------------------------------------

-- Check auth.users table:
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data->>'account_type' as account_type
FROM auth.users
WHERE email IN (
  'test-buyer@kstorybridge-test.com',
  'test-creator@kstorybridge-test.com'
);

-- Check user_buyers:
SELECT email, full_name, tier, created_at
FROM user_buyers
WHERE email = 'test-buyer@kstorybridge-test.com';

-- Check user_creators:
SELECT email, full_name, pen_name, ip_owner_role, invitation_status, created_at
FROM user_creators
WHERE email = 'test-creator@kstorybridge-test.com';

-- ----------------------------------------------------------------------------
-- 5. CLEANUP (run after testing is complete)
-- ----------------------------------------------------------------------------

-- WARNING: This will DELETE test accounts. Only run after testing is done.

-- Delete test title(s):
-- DELETE FROM titles
-- WHERE creator_id = (SELECT id FROM auth.users WHERE email = 'test-creator@kstorybridge-test.com');

-- Delete from user tables:
-- DELETE FROM user_buyers WHERE email = 'test-buyer@kstorybridge-test.com';
-- DELETE FROM user_creators WHERE email = 'test-creator@kstorybridge-test.com';

-- Delete from auth.users (via Supabase Dashboard > Authentication > Users)
-- Or use Supabase Management API

-- ============================================================================
-- NOTES:
-- 1. Always create auth.users FIRST via Supabase Dashboard
-- 2. Then insert into user_buyers or user_creators tables
-- 3. Passwords should be secure but memorable for testing
-- 4. Use a test email domain (not real user emails)
-- 5. Clean up test data after testing is complete
-- ============================================================================
