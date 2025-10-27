# 🚀 CI/CD Setup Guide (Phase 3)

**Created**: 2025-10-25
**Status**: Phase 3 Complete ✅

Complete guide for configuring GitHub Actions CI/CD pipeline.

---

## 📋 Overview

The CI/CD pipeline automatically runs tests on every PR and deployment:

- **Unit Tests**: Run existing Vitest tests
- **E2E Tests**: Run Playwright tests (3 suites, 24 tests)
- **Build Verification**: Ensure production build succeeds
- **Lint Check**: ESLint + TypeScript checks
- **Preview Testing**: Smoke tests on Vercel preview deployments
- **Auto Cleanup**: Remove test data after E2E tests

---

## 🔐 Required GitHub Secrets

### Step 1: Add Repository Secrets✅

Navigate to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://dlrnrgcoguxlkkcitlpd.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anon key (from `.env.local`) |

**Where to find values**:
```bash
# From your local .env.local file
cat apps/dashboard/.env.local | grep VITE_SUPABASE
```

---

## ⚙️ GitHub Repository Settings

### Step 2: Enable GitHub Actions✅

1. Go to `Settings` → `Actions` → `General`
2. Under "Actions permissions", select:
   - ✅ "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"
4. Click **Save**

### Step 3: Configure Branch Protection Rules

Navigate to: `Settings` → `Branches` → `Add branch protection rule`

**For `v2` branch** (development):

- **Branch name pattern**: `v2`
- **Protect matching branches**:
  - ✅ Require a pull request before merging
    - Required approvals: 0 (or 1 if you have team members)
  - ✅ Require status checks to pass before merging
    - ✅ Require branches to be up to date before merging
    - **Required status checks**:
      - `Unit Tests`
      - `E2E Tests`
      - `Build Verification`
  - ✅ Require conversation resolution before merging
  - ⬜ Do not allow bypassing the above settings (optional)

**For `main` branch** (production):

- **Branch name pattern**: `main`
- **Protect matching branches**:
  - ✅ Require a pull request before merging
    - Required approvals: 1
  - ✅ Require status checks to pass before merging
    - ✅ Require branches to be up to date before merging
    - **Required status checks**:
      - `Unit Tests`
      - `E2E Tests`
      - `Build Verification`
      - `Lint & Type Check`
  - ✅ Require conversation resolution before merging
  - ✅ Do not allow bypassing the above settings

Click **Create** for each branch.

---

## 🌐 Vercel Integration (Optional) -> "Pro" only

### Step 4: Configure Vercel Deployment Webhooks

To enable automatic preview deployment testing:

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Under "Deploy Hooks", create a new hook
3. Copy the webhook URL
4. Go to GitHub: `Settings` → `Webhooks` → `Add webhook`
   - **Payload URL**: (Vercel webhook URL)
   - **Content type**: `application/json`
   - **Events**: Select "Deployments"
   - Click **Add webhook**

The `preview-test.yml` workflow will automatically run smoke tests on every Vercel preview deployment.

---

## 📊 Workflows Overview

### 1. `dashboard-tests.yml` (Main CI Pipeline)

**Triggers**:
- Pull requests to `v2` or `main`
- Pushes to `v2` branch

**Jobs**:
1. **Unit Tests** - Run Vitest tests
2. **E2E Tests** - Run Playwright tests (depends on unit tests)
3. **Build Verification** - Production build (depends on tests)
4. **Lint Check** - ESLint + TypeScript
5. **Test Cleanup** - Remove test data
6. **Test Summary** - Overall pass/fail status

**Runtime**: ~10-15 minutes

### 2. `quick-check.yml` (Fast Feedback)

**Triggers**:
- Any push to any branch

**Jobs**:
1. **Quick Lint** - Fast ESLint check
2. **Quick Build** - Fast build verification

**Runtime**: ~3-5 minutes

### 3. `preview-test.yml` (Vercel Integration)

**Triggers**:
- Vercel deployment webhook

**Jobs**:
1. **Test Preview** - Smoke tests on preview URL
2. **Comment on PR** - Post results to PR

**Runtime**: ~2-3 minutes

---

## ✅ Verification Steps

### Test the CI Pipeline

1. **Create a test PR**:
```bash
git checkout -b test-ci-pipeline
echo "# Test CI" >> README.md
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test-ci-pipeline
```

2. **Open PR on GitHub**
   - Go to GitHub and create PR from `test-ci-pipeline` to `v2`
   - Watch the "Checks" tab for workflow progress

3. **Verify all checks pass**:
   - ✅ Unit Tests
   - ✅ E2E Tests
   - ✅ Build Verification
   - ✅ Lint & Type Check
   - ✅ Quick Lint Check
   - ✅ Quick Build Check

4. **Check artifacts**:
   - Click on workflow run
   - Scroll to "Artifacts" section
   - Download and review:
     - `playwright-report` - HTML test report
     - `coverage-report` - Code coverage
     - `dashboard-build` - Production build

### Test Preview Deployment (if Vercel configured)

1. Push changes to trigger Vercel preview deployment
2. Wait for deployment to complete
3. Check for "Preview Deployment Test" comment on PR
4. Verify smoke tests passed

---

## 🐛 Troubleshooting

### Workflows not running

**Problem**: Workflows don't trigger on PR

**Solutions**:
1. Check Actions are enabled: `Settings` → `Actions` → `General`
2. Verify workflow file syntax: Use GitHub's workflow editor
3. Check branch filters in workflow files

### E2E tests failing in CI

**Problem**: E2E tests pass locally but fail in CI

**Solutions**:
1. **Missing secrets**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. **Timeout issues**: Increase timeouts in `playwright.config.ts`
3. **Network issues**: Add retry logic for flaky network calls
4. **Port conflicts**: Ensure dev server starts on correct port (8081)

**Debug steps**:
```bash
# Download test-results artifact from failed run
# Extract and view screenshots/videos
```

### Build failing in CI

**Problem**: Build succeeds locally but fails in CI

**Solutions**:
1. **Environment variables**: Ensure all required env vars are set
2. **Node version mismatch**: Verify Node 18 in both local and CI
3. **Dependency issues**: Check `package-lock.json` is committed
4. **Memory issues**: Increase Node memory if needed

### Secrets not working

**Problem**: Tests can't connect to Supabase

**Solutions**:
1. Verify secret names match exactly (case-sensitive)
2. Check secret values don't have extra spaces
3. Ensure secrets are set at repository level (not environment level)
4. Re-add secrets if they were recently changed

---

## 📈 CI/CD Metrics

### Expected Performance

| Job | Duration | Status |
|-----|----------|--------|
| Unit Tests | 1-2 min | ✅ |
| E2E Tests | 5-8 min | ✅ |
| Build Verification | 2-3 min | ✅ |
| Lint Check | 1 min | ✅ |
| **Total Pipeline** | **10-15 min** | ✅ |

### Failure Rates (Target)

- **Unit Tests**: <1% failure rate
- **E2E Tests**: <5% failure rate (some flakiness expected)
- **Build**: <1% failure rate
- **Lint**: <1% failure rate

### Artifact Retention

- **Test results**: 7 days
- **Build artifacts**: 3 days
- **Coverage reports**: 7 days

---

## 🚀 Next Steps

After setup is complete:

1. **Monitor first few PRs** - Watch for any issues
2. **Adjust timeouts if needed** - If tests are slow in CI
3. **Add more test coverage** - Expand E2E tests as needed
4. **Set up Sentry** (Phase 4) - Production error monitoring

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs for detailed error messages
2. Review workflow YAML files for syntax errors
3. Verify all secrets are correctly set
4. Test workflows locally using `act` (GitHub Actions local simulator)

---

**CI/CD Setup Complete!** 🎉

All PRs will now automatically run tests before merging.
