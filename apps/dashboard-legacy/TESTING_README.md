# 🧪 Dashboard Testing Guide

**Last Updated**: 2025-10-25
**Status**: Phase 1, 2, 3 & 4 Complete ✅ - **ALL PHASES COMPLETE!**

Quick reference for testing infrastructure and utilities.

---

## 🚀 Quick Start

**IMPORTANT**: All test commands must be run from the **dashboard** directory:

```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard
```

The test infrastructure is centralized in the dashboard app because:
- Both dashboard and creator apps share the same Supabase database
- Test users work across all apps
- Reduces duplication

### Create Test Users

```bash
# Create basic tier buyer
npm run test:create-buyer

# Create pro tier buyer
npm run test:create-buyer -- --tier=pro

# Create suite tier buyer
npm run test:create-buyer -- --tier=suite

# Create creator (author)
npm run test:create-creator

# Create creator (agent)
npm run test:create-creator -- --role=agent
```

**Default Password**: `Test-Password-123`

### Clean Up Test Data

```bash
# Remove all test users and their data
npm run test:cleanup

# With auto-confirmation (no prompt)
npm run test:cleanup -- --confirm
```

### Verify Setup

```bash
# Check that all test infrastructure is configured
npm run test:verify
```

### Start in Test Mode

```bash
# Start dev server with .env.test configuration
npm run test:local
```

---

## 🎭 E2E Tests (Phase 2)

### Run E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible (headed mode)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:auth       # Authentication tests
npm run test:e2e:chatbot    # AI chatbot tests
npm run test:e2e:creator    # Creator CRUD tests

# View HTML report
npm run test:e2e:report
```

### E2E Test Coverage

**Authentication Flow** (`auth.spec.ts`):
- ✅ Buyer signup → dashboard redirect
- ✅ Creator signup → dashboard redirect
- ✅ Email signin (buyer & creator)
- ✅ Protected route authentication
- ✅ Password validation

**AI Chatbot Flow** (`chatbot.spec.ts`):
- ✅ Discovery queries with title recommendations
- ✅ Comparison queries with structured responses
- ✅ Information queries with detailed data
- ✅ Follow-up queries with contextual responses
- ✅ Title link navigation
- ✅ Conversation history
- ✅ Error handling

**Creator CRUD Flow** (`creator-titles.spec.ts`):
- ✅ Create title
- ✅ Edit title
- ✅ View title details
- ✅ Delete title
- ✅ Search/filter titles
- ✅ Minimal field validation

---

## 🚀 CI/CD Integration (Phase 3)

### GitHub Actions Workflows

**Automatic test runs on**:
- Every pull request to `v2` or `main`
- Every push to `v2` branch
- Vercel preview deployments (optional)

**What runs automatically**:
```bash
# On every PR:
- Unit Tests (Vitest)
- E2E Tests (Playwright)
- Build Verification
- Lint & Type Check
- Test Cleanup

# On every push:
- Quick Lint Check
- Quick Build Check

# On Vercel preview deployment:
- Smoke Tests on preview URL
```

### Workflows

| Workflow | Triggers | Duration | Purpose |
|----------|----------|----------|---------|
| `dashboard-tests.yml` | PR to v2/main | 10-15 min | Full test suite |
| `quick-check.yml` | Any push | 3-5 min | Fast feedback |
| `preview-test.yml` | Vercel deployment | 2-3 min | Preview smoke tests |

### CI Test Commands

```bash
# Tests run automatically in CI, but you can run locally:

# Full CI test suite (what runs in CI)
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run build          # Build verification
npm run lint           # Lint check

# Preview deployment smoke tests
npm run test:preview -- https://preview-url.vercel.app
```

### Setup CI/CD

See **[CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)** for complete setup instructions:
1. Add GitHub Secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. Enable GitHub Actions
3. Configure branch protection rules
4. (Optional) Configure Vercel webhooks

### PR Workflow

1. **Create PR** → GitHub Actions automatically runs tests
2. **View test results** → Check "Checks" tab on PR
3. **Fix any failures** → Push fixes to branch
4. **Tests pass** → PR can be merged
5. **Merge** → Triggers deployment

### Test Artifacts

After CI runs, download artifacts from workflow page:
- **playwright-report** - HTML test report with screenshots/videos
- **test-results** - Raw test results
- **coverage-report** - Code coverage data
- **dashboard-build** - Production build output

---

## 📚 Test Utilities

All utilities are in `src/test-utils/` and can be imported:

```typescript
import {
  createTestBuyer,
  createTestCreator,
  loginAs,
  TEST_USER_PRESETS,
  mockStripeWebhook,
  STANDARD_TEST_QUERIES,
  cleanupAllTestData,
} from '@/test-utils';
```

### User Setup

```typescript
// Create test buyer
const { user, email } = await createTestBuyer('pro');

// Create test creator
const { user, email } = await createTestCreator('author');

// Login as test user
await loginAs('test-buyer-pro@testcompany.com');

// Quick login to preset users
await loginAsPreset('BUYER_PRO');
```

### Mock Stripe

```typescript
// Simulate complete checkout flow
const result = await simulateStripeCheckout(
  'test@testcompany.com',
  'pro'
);

// Generate webhook event
const webhook = mockStripeWebhook('checkout.session.completed', {
  customer_email: 'test@testcompany.com',
  subscription_tier: 'pro',
});

// Use scenario helpers
await MOCK_STRIPE_SCENARIOS.UPGRADE_TO_PRO('test@testcompany.com');
```

### Chatbot Test Queries

```typescript
// Get all standard queries
const queries = STANDARD_TEST_QUERIES;

// Get queries by intent
const discoveryQueries = getQueriesByIntent('discovery');

// Get queries by tag
const romanceQueries = getQueriesByTag('romance');

// Get random query
const query = getRandomTestQuery();

// Smoke test queries (quick validation)
const smokeTests = SMOKE_TEST_QUERIES;
```

### Cleanup

```typescript
// Clean up all test data
const result = await cleanupAllTestData();

// Clean up specific types
await cleanupTestBuyers();
await cleanupTestCreators();
await cleanupTestChatSessions();

// Verify cleanup
const verification = await verifyTestDataCleanup();
```

### Supabase Test Client

```typescript
// Get service role client (bypasses RLS)
const testClient = getTestClient();

// Execute with service role
await withServiceRole(async (client) => {
  // Perform admin operations
  return await client.from('user_buyers').select('*');
});

// Helper functions
await insertTestData('user_buyers', { email: '...', ... });
await deleteTestData('user_buyers', { column: 'email', value: '...' });
await queryTestData('titles');
```

---

## 🚩 Feature Flags

Configured in `src/lib/feature-flags.ts`:

```typescript
import { DEV_FLAGS, shouldSkipEmail } from '@/lib/feature-flags';

// Check flags
if (shouldSkipEmail()) {
  console.log('Skipping email in test mode');
  return;
}

// Available flags
DEV_FLAGS.SKIP_EMAIL_SEND        // Skip actual email sending
DEV_FLAGS.USE_TEST_STRIPE        // Use Stripe test mode
DEV_FLAGS.MOCK_OPENAI            // Mock OpenAI responses
DEV_FLAGS.AUTO_LOGIN_EMAIL       // Auto-login as specific user
DEV_FLAGS.VERBOSE_LOGS           // Show all debug logs
```

### Set Flags in .env.test

```bash
VITE_TEST_MODE=true
VITE_SKIP_EMAIL_SEND=true
VITE_USE_TEST_STRIPE=true
VITE_AUTO_LOGIN_EMAIL=test-buyer-pro@testcompany.com
VITE_DEBUG_MODE=true
```

---

## 📦 Test Data

### Seed Data

Location: `supabase/seed.sql`

Includes:
- 50 sample titles (10 per genre)
- 10 test users (5 buyers, 5 creators)
- Sample chat sessions and messages

### Test User Presets

```typescript
TEST_USER_PRESETS = {
  BUYER_BASIC: 'test-buyer-basic@testcompany.com',
  BUYER_PRO: 'test-buyer-pro@testcompany.com',
  BUYER_SUITE: 'test-buyer-suite@testcompany.com',
  CREATOR_AUTHOR: 'test-creator-author@gmail.com',
  CREATOR_AGENT: 'test-creator-agent@agency.com',
}
```

### Test Query Categories

- **Discovery** (5 queries): Genre exploration, popularity searches
- **Comparison** (3 queries): Direct title comparisons
- **Information** (5 queries): Specific title details
- **Recommendation** (4 queries): Similar title suggestions
- **Follow-up** (4 queries): Contextual queries

Total: 21 standard queries + edge cases + performance tests

---

## 🔍 Verification

Run verification to check setup:

```bash
npm run test:verify
```

Checks:
- ✅ Environment variables configured
- ✅ All required files present
- ✅ Database connection working
- ✅ Test data status
- ✅ NPM scripts configured

---

## 🐛 Troubleshooting

### "Missing script" or "workspace" errors

**Problem**: Running test commands from the wrong directory:
```
npm error Missing script: "test:create-buyer"
npm error location /Users/.../apps/creator
```

**Solution**: Test scripts only exist in the dashboard app. Always run from:
```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard
npm run test:create-buyer
```

**Why**: Test infrastructure is centralized in dashboard because both apps share the same Supabase database.

---

### "Edge Function returned a non-2xx status code"

**Problem**: Warning appears when creating test users:
```
⚠️  Profile creation warning: Edge Function returned a non-2xx status code
```

**Status**: Known issue - safe to ignore

**Explanation**:
- The auth user is created successfully ✅
- The profile edge function has a separate issue ⚠️
- Test users can still sign in and work correctly
- This doesn't affect test functionality

**Verification**: User appears in Supabase Auth dashboard with correct email and metadata.

---

### "VITE_SUPABASE_ANON_KEY not found in environment"

**Problem**: CLI scripts fail with environment variable error when running:
- `npm run test:create-buyer`
- `npm run test:cleanup`
- `npm run test:verify`

**Solution**: ✅ **Fixed as of 2025-10-25**

All CLI scripts now automatically load `.env.local`. If you still see this error:

```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Check it contains VITE_SUPABASE_ANON_KEY
cat .env.local | grep VITE_SUPABASE_ANON_KEY

# 3. Ensure you're in the dashboard directory
pwd  # Should show: /Users/.../apps/dashboard

# 4. Test the fix
npm run test:verify
```

**Expected output**:
```
✅ Passed: 25
❌ Failed: 0
✅ Test setup is properly configured!
```

---

### "Cannot find module" errors

```bash
# Install dependencies
npm install
```

### "Supabase connection failed"

```bash
# Check .env.local has credentials
cat .env.local | grep VITE_SUPABASE

# Test connection manually
npm run test:verify
```

### "Email still sending in test mode"

```bash
# Ensure TEST_MODE is enabled in .env.test
echo "VITE_TEST_MODE=true" >> .env.test
echo "VITE_SKIP_EMAIL_SEND=true" >> .env.test

# Start with test env
npm run test:local
```

### "Test users not being cleaned up"

```bash
# Run cleanup with confirmation
npm run test:cleanup -- --confirm

# Verify cleanup
npm run test:verify
```

---

## 📖 Documentation

- **[Full Testing Plan](../../docs/TESTING_AUTOMATION_PLAN.md)** - Complete 6-week plan
- **[Phase 1 Summary](../../docs/TESTING_AUTOMATION_PLAN.md#-phase-1-completion-summary)** - What was built
- **[Chatbot Testing](../../docs/features/chatbot/TESTING_GUIDE.md)** - Chatbot-specific tests
- **[Auth Testing](TESTING_README.md)** - Authentication flow tests

---

## 🎯 Common Workflows

### Quick Smoke Test (5 min)

```bash
# 1. Create test buyer
npm run test:create-buyer -- --tier=pro

# 2. Start app in test mode
npm run test:local

# 3. Login with created user
# Email: (shown in terminal)
# Password: Test-Password-123

# 4. Test key features manually

# 5. Clean up
npm run test:cleanup -- --confirm
```

### E2E Test Preparation

```bash
# 1. Create all preset users
npm run test:create-buyer -- --tier=basic
npm run test:create-buyer -- --tier=pro
npm run test:create-buyer -- --tier=suite
npm run test:create-creator

# 2. Verify setup
npm run test:verify

# 3. Run E2E tests (Phase 2)
# npm run test:e2e (coming in Phase 2)
```

### Daily Development

```bash
# Start with test environment
npm run test:local

# Use auto-login (set in .env.test)
VITE_AUTO_LOGIN_EMAIL=test-buyer-pro@testcompany.com

# No need to manually login or wait for emails!
```

---

## 💡 Tips

1. **Use test emails**: All test user emails start with `test-` for easy identification
2. **Feature flags**: Leverage flags to bypass slow operations during development
3. **Preset users**: Keep preset users around for quick testing (don't cleanup)
4. **Verification**: Run `npm run test:verify` after pulling changes
5. **Cleanup regularly**: Run cleanup before important tests to ensure clean state

---

## 🆘 Getting Help

1. Check verification output: `npm run test:verify`
2. Review main documentation: `docs/TESTING_AUTOMATION_PLAN.md`
3. Check existing tests for examples
4. Ask in team chat with `npm run test:verify` output

---

**ALL PHASES COMPLETE!** 🎉🎉🎉

**Testing automation is now fully implemented!**

- ✅ Phase 1: Foundation (Test Utils & CLI)
- ✅ Phase 2: E2E Tests (Playwright)
- ✅ Phase 3: CI/CD Integration (GitHub Actions)
- ✅ Phase 4: Monitoring & Observability (Sentry + Metrics)

See [Testing Automation Plan](../../docs/TESTING_AUTOMATION_PLAN.md) for complete overview.

---

## 📊 Monitoring & Metrics (Phase 4)

### Sentry Error Tracking

**Production error monitoring with**:
- Automatic error capture
- Session replay for debugging
- Performance monitoring
- User context tracking

```bash
# Setup (one-time):
# 1. Create Sentry project at sentry.io
# 2. Add VITE_SENTRY_DSN to .env.local and Vercel
# 3. Import initSentry() in src/main.tsx
```

**See**: [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md) for complete setup.

### Test Metrics Dashboard

**Visual dashboard showing**:
- Test pass rate
- Failed test count
- Test duration
- Code coverage

```bash
# Generate metrics dashboard
npm run test:e2e
npm run test:metrics

# View dashboard
open test-metrics/index.html
```

**Output**:
- `test-metrics/index.html` - Interactive dashboard
- `test-metrics/metrics.json` - Raw data
- `test-metrics/METRICS.md` - Markdown summary

---
