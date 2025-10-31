# V2 → Main Promotion Test Plan

**Status**: Phase 2 Complete (Test Suite Created)
**Date**: 2025-10-29
**Branch**: v2 (2 commits ahead of origin/v2)

---

## Progress Summary

### ✅ Phase 1: Fix Known Bug (COMPLETED)

**Fixed**: Creator V2 title edit bug (tags→keywords field mismatch)

- **Problem**: TypeScript interfaces included non-existent `tags` field alongside `keywords`
- **Impact**: Potential errors when updating titles (field doesn't exist in database)
- **Solution**: Removed all references to `tags` field from:
  - `apps/creator/src/services/titlesService.ts` (TypeScript interfaces)
  - `apps/creator/src/pages/TitleDetail.tsx` (display fallback logic)
- **Verification**: Build succeeded with no TypeScript errors
- **Commit**: `7eb5c09a` - "fix: remove non-existent 'tags' field from Creator V2 app"

### ✅ Phase 2: Create Automated Test Suite (COMPLETED)

**Created**: Comprehensive Playwright E2E test suite

**Test Coverage**:

1. **Authentication Tests** (`tests/auth.spec.ts`):
   - Email signup/signin for buyers and creators
   - OAuth authentication flows (Google)
   - **CRITICAL**: Multi-environment redirect handling (staging/production)
   - Session persistence verification
   - Error handling and validation
   - Total: 12 test cases

2. **AI Chatbot Tests** (`tests/chatbot.spec.ts`):
   - Basic query/response functionality
   - Phase 4: Contextual responses (follow-up detection)
   - Phase 3: Pitch analytics integration
   - Anti-hallucination validation (Phase 1)
   - Response time performance benchmarks
   - Edge function health checks
   - Feature flag verification
   - Total: 11 test cases

3. **Creator V2 Tests** (`tests/creator.spec.ts`):
   - Title CRUD operations (create, read, update, delete)
   - Multi-step survey form validation
   - Profile management
   - **CRITICAL**: Title edit bug fix verification (tags→keywords)
   - OAuth authentication for creators
   - Permission/RLS policy checks
   - Total: 13 test cases

**Infrastructure Created**:
- Playwright configuration (`playwright.config.ts`)
- Helper utilities (`tests/helpers/`)
  - `test-config.ts`: Environment configuration (staging/production/localhost)
  - `auth-helpers.ts`: Authentication utilities
- Test documentation (`tests/README.md`)
- Environment example (`.env.test.example`)
- NPM scripts for test execution

**NPM Scripts Added**:
```bash
npm run test:e2e                # Run all tests (staging by default)
npm run test:e2e:staging        # Run against staging
npm run test:e2e:production     # Run against production
npm run test:e2e:ui             # Interactive UI mode
npm run test:e2e:debug          # Debug mode with headed browser
npm run test:e2e:auth           # Auth tests only
npm run test:e2e:chatbot        # Chatbot tests only
npm run test:e2e:creator        # Creator tests only
npm run test:e2e:report         # View test report
```

**Commit**: `fad1d35f` - "feat: add comprehensive Playwright E2E test suite"

---

## Phase 3: Staging Testing (READY TO START)

### Prerequisites

Before running tests, complete these setup steps:

#### 1. Install Playwright Browsers

```bash
npx playwright install chromium
```

**Note**: Full browser installation (`npx playwright install`) failed due to network issues.
Only Chromium is needed for tests (configured in `playwright.config.ts`).

#### 2. Create Test User Accounts

Create dedicated test accounts in Supabase (DO NOT use real user accounts):

**Buyer Test Account**:
```sql
-- Create in user_buyers table
INSERT INTO user_buyers (email, full_name, buyer_company, buyer_role, tier, requested)
VALUES (
  'test-buyer@kstorybridge-test.com',
  'Test Buyer Account',
  'Test Company',
  'Test Role',
  'basic',
  false
);

-- Create auth user
-- Use Supabase Auth UI or supabase.auth.signUp() with password
```

**Creator Test Account**:
```sql
-- Create in user_creators table
INSERT INTO user_creators (email, full_name, pen_name, ip_owner_role, invitation_status)
VALUES (
  'test-creator@kstorybridge-test.com',
  'Test Creator Account',
  'Test Pen Name',
  'author',
  'active'
);

-- Create auth user
-- Use Supabase Auth UI or supabase.auth.signUp() with password
```

#### 3. Configure Test Environment

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with actual test credentials:

```bash
TEST_ENV=staging

TEST_BUYER_EMAIL=test-buyer@kstorybridge-test.com
TEST_BUYER_PASSWORD=[secure-test-password]

TEST_CREATOR_EMAIL=test-creator@kstorybridge-test.com
TEST_CREATOR_PASSWORD=[secure-test-password]

# Optional: For title edit tests
TEST_TITLE_ID=[uuid-of-test-title]
```

### Running Staging Tests

#### Full Test Suite

```bash
npm run test:e2e:staging
```

#### Individual Test Suites

```bash
# Authentication tests (CRITICAL)
npm run test:e2e:auth

# Chatbot tests
npm run test:e2e:chatbot

# Creator V2 tests (includes bug fix verification)
npm run test:e2e:creator
```

#### Interactive Mode (Recommended)

```bash
# Run in UI mode for easier debugging
npm run test:e2e:ui
```

### Expected Results

**Critical Tests (MUST PASS)**:
- ✅ OAuth multi-environment redirects (auth.spec.ts)
- ✅ Email authentication for buyers and creators
- ✅ Creator V2 title edit without errors (tags→keywords fix)
- ✅ Session persistence

**High Priority (SHOULD PASS)**:
- ✅ Chatbot basic functionality
- ✅ Chatbot contextual responses (Phase 4)
- ✅ Title CRUD operations

**Medium Priority (NICE TO HAVE)**:
- ✅ Chatbot performance benchmarks
- ✅ Creator permission checks

### Test Report

After running tests:

```bash
# View HTML report
npm run test:e2e:report

# Or check JSON results
cat test-results/results.json
```

---

## Phase 4: Production Deployment (PENDING)

### Merge v2 → main

After staging tests pass:

```bash
# Option 1: Direct merge (fast-forward)
git checkout main
git merge v2 --ff-only

# Option 2: Create PR (recommended for review)
gh pr create --base main --head v2 --title "Promote v2 to production"
```

### Vercel Deployment

Vercel will auto-deploy when main branch is updated:

1. **Dashboard**: https://dashboard.kstorybridge.com
2. **Creator**: https://creator.kstorybridge.com
3. **Website**: https://kstorybridge.com

Wait 5-10 minutes for deployment and DNS propagation.

---

## Phase 5: Production Testing (PENDING)

### Run Production Test Suite

```bash
TEST_ENV=production npm run test:e2e
```

**Or individual suites**:
```bash
TEST_ENV=production npm run test:e2e:auth
TEST_ENV=production npm run test:e2e:chatbot
TEST_ENV=production npm run test:e2e:creator
```

### Manual Verification Checklist

After automated tests pass, manually verify:

**Dashboard App** (dashboard.kstorybridge.com):
- [ ] Buyer signin with email works
- [ ] OAuth signin redirects correctly
- [ ] AI chatbot responds (5-18s response time)
- [ ] Contextual follow-up queries work (Phase 4)
- [ ] No console errors

**Creator App** (creator.kstorybridge.com):
- [ ] Creator signin with email works
- [ ] OAuth signin redirects correctly
- [ ] Title list loads
- [ ] Title detail page displays keywords correctly (not "tags")
- [ ] Profile page loads
- [ ] No console errors

**Feature Flags** (Edge Function Logs):
- [ ] `ENABLE_CONTEXTUAL_RESPONSES=true` (Phase 4)
- [ ] `ENABLE_PITCH_CONTEXT=true` (Phase 3)

### Performance Benchmarks

Monitor these metrics in production:

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| OAuth flow time | 7-20s | ___ | ⏸️ |
| Chatbot response time | 5-18s | ___ | ⏸️ |
| Page load time | <3s | ___ | ⏸️ |
| Title edit save | <2s | ___ | ⏸️ |

---

## Phase 6: Documentation & Monitoring (PENDING)

### Update Documentation

- [ ] Update `CLAUDE.md` with test suite info
- [ ] Document any issues found during testing
- [ ] Update deployment history

### Create Rollback Plan

**If critical issues found in production**:

```bash
# Revert to previous main commit
git checkout main
git revert HEAD --no-commit
git commit -m "revert: rollback v2 promotion due to [issue]"
git push origin main
```

Vercel will auto-deploy the rollback.

**Alternative**: Use Vercel dashboard to rollback to previous deployment.

### Monitoring (First 24 Hours)

Monitor these systems:

1. **Vercel Logs**:
   - Dashboard app errors
   - Creator app errors
   - Edge function failures

2. **Supabase Logs**:
   - Auth errors (OAuth, email)
   - Database query errors
   - RLS policy violations

3. **User Reports**:
   - Monitor for bug reports
   - Check email for user complaints
   - Review feature usage

---

## Summary

### Completed (2/6 Phases)
- ✅ Phase 1: Bug Fix (tags→keywords)
- ✅ Phase 2: Test Suite Creation

### Pending (4/6 Phases)
- ⏸️ Phase 3: Staging Testing (requires test accounts + browser install)
- ⏸️ Phase 4: Production Deployment
- ⏸️ Phase 5: Production Testing
- ⏸️ Phase 6: Documentation & Monitoring

### Next Immediate Steps

1. Install Playwright browser:
   ```bash
   npx playwright install chromium
   ```

2. Create test user accounts in Supabase (see "Phase 3: Prerequisites")

3. Configure `.env.test` with test credentials

4. Run staging tests:
   ```bash
   npm run test:e2e:staging
   ```

5. Review test results and fix any failures

6. Proceed to production deployment when staging is stable

---

## Commits in V2 Branch

```
fad1d35f feat: add comprehensive Playwright E2E test suite
7eb5c09a fix: remove non-existent 'tags' field from Creator V2 app
82ec917a docs: update documentation for multi-environment OAuth setup
71653337 fix: OAuth redirects for multi-environment setup + prevent duplicate code exchange
9277680f refactor: improve survey form UX with clearer labels and simplified fields
```

**Current state**: v2 branch is 2 commits ahead of origin/v2
**Ready for**: Staging testing (after setup)

---

## Critical Changes to Verify in Production

1. **Multi-Environment OAuth** (Oct 2025 fixes):
   - Staging redirects work (dashboard-v2.kstorybridge.com)
   - Production redirects work (dashboard.kstorybridge.com)
   - Creator redirects work (creator.kstorybridge.com)
   - No "bad_oauth_state" errors

2. **Creator V2 Bug Fix** (Oct 2025):
   - Title edit saves without errors
   - Keywords field works correctly
   - No references to "tags" field

3. **AI Chatbot Phase 4** (Active):
   - Contextual responses on follow-ups
   - Token efficiency (50% reduction)
   - Zero repetition rate

---

**Questions? Issues?**
- Review `tests/README.md` for detailed test documentation
- Check `docs/active/AUTH_DOCUMENTATION.md` for auth troubleshooting
- See `docs/guides/DEPLOYMENT_STRATEGY.md` for deployment info
