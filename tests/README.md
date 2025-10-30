# KStoryBridge E2E Test Suite

Automated end-to-end tests using Playwright for KStoryBridge applications.

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Email signup/signin for buyers and creators
- OAuth authentication flows (Google)
- Multi-environment redirect handling (staging/production)
- Session persistence
- Error handling

**Critical**: Tests verify the multi-environment OAuth fixes from Oct 2025 (commits 71653337, d8e726db, 82ec917a)

### AI Chatbot Tests (`chatbot.spec.ts`)
- Basic query/response functionality
- Phase 4: Contextual responses (follow-up detection)
- Phase 3: Pitch analytics integration
- Anti-hallucination validation
- Response time performance
- Edge function health checks

### Creator V2 Tests (`creator.spec.ts`)
- Title CRUD operations
- Multi-step survey form
- Profile management
- OAuth authentication
- Permission/RLS checks
- **Bug fix verification**: tags→keywords field (Oct 2025)

## Setup

### Install Dependencies

```bash
npm install
```

This installs Playwright and required browsers.

### Configure Test Environment

Create a `.env.test` file in the root directory (or set environment variables):

```bash
# Test environment (staging | production | localhost)
TEST_ENV=staging

# Test user credentials (use dedicated test accounts)
TEST_BUYER_EMAIL=test-buyer@example.com
TEST_BUYER_PASSWORD=test-password-123
TEST_CREATOR_EMAIL=test-creator@example.com
TEST_CREATOR_PASSWORD=test-password-123

# Optional: For specific tests
TEST_TITLE_ID=uuid-of-test-title
OTHER_CREATOR_TITLE_ID=uuid-of-other-creators-title
```

**IMPORTANT**: Use dedicated test accounts, never production user credentials!

## Running Tests

### All Tests

```bash
# Run all tests against staging
npm run test

# Run all tests against production
TEST_ENV=production npm run test
```

### Specific Test Suites

```bash
# Authentication tests only
npm run test:auth

# Chatbot tests only
npm run test:chatbot

# Creator V2 tests only
npm run test:creator
```

### Staging vs Production

```bash
# Staging environment (default)
npm run test:staging

# Production environment
npm run test:production
```

### UI Mode (Interactive)

```bash
# Run tests in Playwright UI mode (great for debugging)
npm run test:ui
```

### Debug Mode

```bash
# Run with headed browser (see what's happening)
npm run test:debug

# Or run specific test with debug
npx playwright test auth.spec.ts --headed --debug
```

## Test Environments

### Staging
- **Dashboard**: https://dashboard-v2.kstorybridge.com
- **Creator**: https://creator-staging.kstorybridge.com
- **Website**: https://kstorybridge.com
- **Environment**: `TEST_ENV=staging`

### Production
- **Dashboard**: https://dashboard.kstorybridge.com
- **Creator**: https://creator.kstorybridge.com
- **Website**: https://kstorybridge.com
- **Environment**: `TEST_ENV=production`

### Localhost (Development)
- **Dashboard**: http://localhost:8081
- **Creator**: http://localhost:8083
- **Website**: http://localhost:5173
- **Environment**: `TEST_ENV=localhost`

## Test Reports

After running tests, Playwright generates reports:

```bash
# View HTML report
npx playwright show-report

# JSON results
cat test-results/results.json
```

## Writing New Tests

### File Structure

```
tests/
├── helpers/
│   ├── test-config.ts      # Environment configuration
│   └── auth-helpers.ts      # Authentication utilities
├── fixtures/                # Test data and fixtures
├── auth.spec.ts            # Authentication tests
├── chatbot.spec.ts         # Chatbot tests
├── creator.spec.ts         # Creator V2 tests
└── README.md               # This file
```

### Example Test

```typescript
import { test, expect } from '@playwright/test'
import { getEnvironmentConfig, TIMEOUTS } from './helpers/test-config'

test('my test', async ({ page }) => {
  const config = getEnvironmentConfig()

  await page.goto(`${config.dashboard}/some-page`)

  // Your test assertions
  await expect(page.locator('h1')).toHaveText('Expected Title')
})
```

### Best Practices

1. **Use helpers**: Import helpers for common operations (auth, navigation)
2. **Use config**: Get URLs from `getEnvironmentConfig()`, never hardcode
3. **Use timeouts**: Use `TIMEOUTS` constants for consistency
4. **Use data-testid**: Prefer `[data-testid="..."]` selectors for stability
5. **Skip manual tests**: Mark tests requiring manual steps with `.skip`
6. **Clean up data**: Tests creating real data should clean up after themselves

## Common Issues

### Browser Installation

If browsers aren't installed:

```bash
npx playwright install
```

### Network Timeouts

Increase timeouts in `playwright.config.ts` if tests fail due to slow connections:

```typescript
use: {
  actionTimeout: 30000, // 30s
  navigationTimeout: 30000, // 30s
}
```

### OAuth Tests

OAuth tests may fail without proper redirect URLs configured in:
- Google OAuth Console
- Supabase Auth Settings

See `docs/guides/GIT_DEPLOYMENT_STRUCTURE.md` for OAuth configuration.

### Test User Accounts

Test users must be created manually in Supabase:
1. Create test buyer account in `user_buyers` table
2. Create test creator account in `user_creators` table
3. Set credentials in `.env.test`

## Continuous Integration

For CI/CD pipelines (GitHub Actions, etc.):

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm run test
  env:
    TEST_ENV: staging
    TEST_BUYER_EMAIL: ${{ secrets.TEST_BUYER_EMAIL }}
    TEST_BUYER_PASSWORD: ${{ secrets.TEST_BUYER_PASSWORD }}
```

## Critical Tests for Production Deployment

Before promoting v2 → main, these tests **MUST pass**:

### High Priority (Blockers)
- ✅ `auth.spec.ts` - All authentication flows
- ✅ `auth.spec.ts` - OAuth multi-environment redirects
- ✅ `creator.spec.ts` - Title edit (tags→keywords bug fix)

### Medium Priority (Recommended)
- ✅ `chatbot.spec.ts` - Basic chatbot functionality
- ✅ `chatbot.spec.ts` - Phase 4 contextual responses
- ✅ `creator.spec.ts` - Title CRUD operations

### Low Priority (Nice to Have)
- ✅ `chatbot.spec.ts` - Performance benchmarks
- ✅ `creator.spec.ts` - Permission checks

## Support

For issues or questions:
1. Check Playwright docs: https://playwright.dev
2. Review test logs: `npx playwright show-report`
3. Run in debug mode: `npm run test:debug`
4. Check environment config in `helpers/test-config.ts`
