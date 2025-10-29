# E2E Test Setup Guide

Quick guide to set up test environment before running tests.

## Step 1: Install Playwright Browser ✅ (In Progress)

The Chromium browser is being installed automatically. This step should complete in a few minutes.

## Step 2: Create Test User Accounts (15 minutes)

### 2.1 Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd)
2. Navigate to **Authentication** > **Users**

### 2.2 Create Buyer Test Account

**Create auth user:**
1. Click **"Add User"**
2. Email: `test-buyer@kstorybridge-test.com` (or use your test domain)
3. Password: Choose a secure password (save it!)
4. Email Confirm: Yes
5. Click **"Create User"**

**Add to user_buyers table:**
1. Go to **SQL Editor**
2. Run this query:

```sql
INSERT INTO user_buyers (
  email,
  full_name,
  buyer_company,
  buyer_role,
  tier,
  requested
)
VALUES (
  'test-buyer@kstorybridge-test.com',  -- Match the auth user email
  'Test Buyer Account',
  'Test Company Inc',
  'Content Acquisition',
  'basic',
  false
)
ON CONFLICT (email) DO NOTHING;
```

3. Verify:
```sql
SELECT email, full_name, tier FROM user_buyers
WHERE email = 'test-buyer@kstorybridge-test.com';
```

### 2.3 Create Creator Test Account

**Create auth user:**
1. Click **"Add User"** (in Authentication > Users)
2. Email: `test-creator@kstorybridge-test.com`
3. Password: Choose a secure password (save it!)
4. Email Confirm: Yes
5. Click **"Create User"**

**Add to user_creators table:**
1. Go to **SQL Editor**
2. Run this query:

```sql
INSERT INTO user_creators (
  email,
  full_name,
  pen_name,
  ip_owner_role,
  invitation_status
)
VALUES (
  'test-creator@kstorybridge-test.com',  -- Match the auth user email
  'Test Creator Account',
  'Test Author',
  'author',
  'active'
)
ON CONFLICT (email) DO NOTHING;
```

3. Verify:
```sql
SELECT email, full_name, pen_name, ip_owner_role FROM user_creators
WHERE email = 'test-creator@kstorybridge-test.com';
```

### 2.4 (Optional) Create Test Title

This is needed for title edit tests:

```sql
INSERT INTO titles (
  title_name_en,
  title_name_kr,
  title_url,
  title_image,
  story_author,
  genre,
  content_format,
  keywords,
  synopsis,
  creator_id
)
VALUES (
  'E2E Test Title',
  '테스트 제목',
  'https://example.com/test-title',
  'https://via.placeholder.com/300x400',
  'Test Author',
  ARRAY['fantasy'],
  'webtoon',
  ARRAY['test', 'automation', 'e2e'],
  'This is a test title for E2E testing purposes.',
  (SELECT id FROM auth.users WHERE email = 'test-creator@kstorybridge-test.com')
)
RETURNING title_id;
```

**Save the returned `title_id`** - you'll need it for `.env.test`

## Step 3: Configure .env.test (5 minutes)

1. Copy the example file:
```bash
cp .env.test.example .env.test
```

2. Edit `.env.test` with your test credentials:

```bash
# Test environment
TEST_ENV=staging

# Buyer test account
TEST_BUYER_EMAIL=test-buyer@kstorybridge-test.com
TEST_BUYER_PASSWORD=your-secure-password-here

# Creator test account
TEST_CREATOR_EMAIL=test-creator@kstorybridge-test.com
TEST_CREATOR_PASSWORD=your-secure-password-here

# Optional: Test title ID (from step 2.4)
TEST_TITLE_ID=abc123-uuid-from-query
```

3. **IMPORTANT**: Add `.env.test` to `.gitignore` (already done)

## Step 4: Verify Setup

Run a quick test to verify everything works:

```bash
# Test auth flows only (quickest)
npm run test:e2e:auth
```

Expected result: All auth tests should pass ✅

## Step 5: Run Full Test Suite

```bash
# Run all tests against staging
npm run test:e2e:staging

# Or run in UI mode (recommended for first time)
npm run test:e2e:ui
```

## Troubleshooting

### Browser not installed
```bash
npx playwright install chromium
```

### Test accounts not found
- Verify auth.users exists: `SELECT * FROM auth.users WHERE email = 'test-buyer@...'`
- Verify user_buyers/user_creators exists: Check queries in step 2

### OAuth tests failing
- Check OAuth redirect URLs configured in:
  - Google OAuth Console
  - Supabase Auth Settings
- Staging: `dashboard-v2.kstorybridge.com/auth/callback`
- Production: `dashboard.kstorybridge.com/auth/callback`

### Permission errors
- Check RLS policies allow test users to read/write
- Verify user_creators.invitation_status = 'active'

## Quick Reference

**Environment URLs:**
- Staging Dashboard: https://dashboard-v2.kstorybridge.com
- Staging Creator: https://creator-v2.kstorybridge.com
- Production Dashboard: https://dashboard.kstorybridge.com
- Production Creator: https://creator.kstorybridge.com

**Test Commands:**
```bash
npm run test:e2e:staging      # All tests (staging)
npm run test:e2e:production   # All tests (production)
npm run test:e2e:ui           # Interactive mode
npm run test:e2e:debug        # Debug mode
npm run test:e2e:report       # View results
```

**Critical Tests (must pass before production):**
- ✅ OAuth multi-environment redirects
- ✅ Email authentication for both account types
- ✅ Creator title edit (tags→keywords fix)
- ✅ Session persistence

## Next Steps

After tests pass on staging:
1. Review test report: `npm run test:e2e:report`
2. Fix any failures
3. Deploy to production (merge v2 → main)
4. Run production tests: `TEST_ENV=production npm run test:e2e`
5. Monitor for 24 hours

See `V2_TO_MAIN_TEST_PLAN.md` for complete deployment strategy.
