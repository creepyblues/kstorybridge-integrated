# 📊 Monitoring & Observability Setup Guide (Phase 4)

**Created**: 2025-10-25
**Status**: Phase 4 Complete ✅

Complete guide for production monitoring and test metrics.

---

## 📋 Overview

Phase 4 adds two key monitoring capabilities:

1. **Sentry Error Tracking** - Production error monitoring and debugging
2. **Test Metrics Dashboard** - Visual dashboard for test performance

---

## 🚨 Sentry Error Tracking

### Step 1: Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new project:
   - **Platform**: React
   - **Project Name**: kstorybridge-dashboard
   - **Alert frequency**: On every new issue

### Step 2: Get DSN

1. After creating project, copy the **DSN** (Data Source Name)
2. It looks like: `https://abc123@o123456.ingest.sentry.io/123456`

### Step 3: Add DSN to Environment

**Local development** (`.env.local`):
```bash
VITE_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
```

**Production** (Vercel dashboard):
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `VITE_SENTRY_DSN` with your DSN value
3. Scope: Production

### Step 4: Initialize Sentry in App

Update `src/main.tsx`:

```typescript
import { initSentry } from './lib/sentry';

// Initialize Sentry BEFORE React renders
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 5: Set User Context (Optional)

In your auth provider, after login:

```typescript
import { setUser } from '@/lib/sentry';

// After successful login
setUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
});

// On logout
setUser(null);
```

### Features

**Automatic Capture**:
- ✅ Unhandled JavaScript errors
- ✅ Unhandled promise rejections
- ✅ API/fetch errors
- ✅ React component errors

**Performance Monitoring**:
- ✅ Page load times
- ✅ API response times
- ✅ React component render times

**Session Replay**:
- ✅ Video replay of user sessions with errors
- ✅ User actions leading to error
- ✅ Console logs and network requests

**Filtered Out**:
- ❌ Test users (email contains "test-")
- ❌ Favicon errors
- ❌ Browser extension errors
- ❌ Analytics/tracking errors

### Manual Error Capture

Use in catch blocks for important operations:

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

try {
  // Critical operation
  await importantFunction();
} catch (error) {
  captureException(error, {
    operation: 'importantFunction',
    userId: user.id,
  });

  // Show error to user
  toast.error('Operation failed');
}

// Log important events
addBreadcrumb('User started checkout', {
  tier: 'pro',
  amount: 99,
});

// Capture warning messages
captureMessage('API rate limit approaching', 'warning');
```

---

## 📊 Test Metrics Dashboard

### What It Does

Generates visual dashboard showing:
- Total tests and pass rate
- Failed test count
- Test duration
- Code coverage (statements, branches, functions, lines)
- Test breakdown (passed/failed/skipped)

### Usage

```bash
# Generate metrics after running tests
npm run test:e2e
npm run test:metrics

# View HTML dashboard
open test-metrics/index.html

# View markdown summary
cat test-metrics/METRICS.md
```

### Output Files

All generated in `test-metrics/` directory:

| File | Description |
|------|-------------|
| `index.html` | Interactive HTML dashboard with charts |
| `metrics.json` | Raw metrics data (for automation) |
| `METRICS.md` | Markdown summary (for README/PR comments) |

### Metrics Collected

**Test Summary**:
- Total tests run
- Pass/fail/skip counts
- Pass rate percentage
- Total test duration

**Code Coverage**:
- Statement coverage %
- Branch coverage %
- Function coverage %
- Line coverage %

### Integration with CI

Add to `.github/workflows/dashboard-tests.yml`:

```yaml
- name: Generate test metrics
  if: always()
  run: npm run test:metrics
  working-directory: apps/dashboard

- name: Upload metrics dashboard
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-metrics
    path: apps/dashboard/test-metrics/
    retention-days: 30
```

---

## 🔔 Recommended Sentry Alerts

### Critical Alerts (Immediate Action)

1. **Chatbot Error Rate > 5%**
   - **Condition**: Error rate > 5% in 5 minutes
   - **Action**: Page on-call engineer
   - **Setup**: Sentry → Alerts → New Alert Rule
   - **Metric**: `error.handled:chatbot`

2. **Stripe Webhook Failures**
   - **Condition**: > 3 webhook errors in 15 minutes
   - **Action**: Send Slack/email notification
   - **Metric**: `error.type:StripeWebhookError`

3. **OAuth Timeout Errors**
   - **Condition**: > 5 timeouts in 10 minutes
   - **Action**: Send Slack notification
   - **Metric**: `error.type:OAuthTimeout`

### Warning Alerts (Monitor)

4. **Vector Search Quality < 80%**
   - **Condition**: Average similarity < 0.8 for 1 hour
   - **Action**: Send daily summary
   - **Metric**: Custom metric `chatbot.search.quality`

5. **API Response Time > 5s**
   - **Condition**: P95 response time > 5000ms
   - **Action**: Send Slack notification
   - **Metric**: `transaction.duration`

6. **New Error Types**
   - **Condition**: New unique error appears
   - **Action**: Send email notification
   - **Setup**: Enable "Alert on new issues"

### Setting Up Alerts

1. Go to Sentry → **Alerts** → **Create Alert**
2. Choose alert type:
   - **Issues**: For new errors
   - **Metric**: For performance/custom metrics
3. Set conditions (threshold, time window)
4. Configure actions:
   - Email notification
   - Slack webhook
   - PagerDuty (for critical)
5. Save and test

---

## 📈 Monitoring Best Practices

### Error Tracking

**Do**:
- ✅ Set user context after login
- ✅ Add breadcrumbs for important actions
- ✅ Capture exceptions with context
- ✅ Use performance transactions for critical flows
- ✅ Review errors weekly

**Don't**:
- ❌ Capture errors in development (auto-disabled)
- ❌ Log sensitive data (passwords, tokens)
- ❌ Ignore repeated errors
- ❌ Over-alert (alert fatigue)

### Test Metrics

**Do**:
- ✅ Generate metrics after every test run
- ✅ Track trends over time
- ✅ Set coverage goals (>80% recommended)
- ✅ Review failed tests immediately
- ✅ Upload metrics in CI

**Don't**:
- ❌ Ignore flaky tests
- ❌ Accept declining coverage
- ❌ Skip metrics generation
- ❌ Commit test-metrics/ folder (git ignored)

---

## 🎯 Success Metrics

### Sentry (Production Health)

**Target metrics**:
- **Error rate**: < 1% of sessions
- **Response time (P95)**: < 3 seconds
- **Crash-free sessions**: > 99.5%
- **Time to resolution**: < 24 hours

**Monitor**:
- Total errors per day
- Unique users affected
- Top error types
- Performance trends

### Test Metrics (CI/CD Health)

**Target metrics**:
- **Pass rate**: > 95%
- **Code coverage**: > 80%
- **Test duration**: < 15 minutes
- **Flaky test rate**: < 5%

**Monitor**:
- Pass rate trends
- Coverage trends
- Failed test patterns
- Performance regressions

---

## 🔧 Troubleshooting

### Sentry Not Capturing Errors

**Problem**: No errors showing in Sentry dashboard

**Solutions**:
1. Verify DSN is correct in `.env.local`
2. Check `import.meta.env.PROD` is true (only captures in production)
3. Check browser console for Sentry initialization logs
4. Verify Sentry SDK is imported in `main.tsx`
5. Test with manual `captureException()` call

### Test Metrics Not Generating

**Problem**: `npm run test:metrics` fails

**Solutions**:
1. Run tests first (`npm run test:e2e`)
2. Verify `test-results/` directory exists
3. Check Playwright output JSON files exist
4. Ensure Node.js has file system permissions
5. Check console for specific error messages

### High Error Rate in Sentry

**Problem**: Sentry shows high error rate

**Actions**:
1. Check "Issues" tab for error types
2. Group errors by fingerprint
3. Review error stack traces
4. Check affected user count
5. Review session replays for context
6. Fix high-frequency errors first
7. Deploy fix and monitor

### Flaky Tests

**Problem**: Tests pass/fail inconsistently

**Solutions**:
1. Download test artifacts (screenshots/videos)
2. Increase timeouts if network-related
3. Add explicit waits for elements
4. Check for race conditions
5. Run tests locally multiple times
6. Use `test.only()` to isolate flaky test

---

## 📊 Dashboard Examples

### Sentry Dashboard Widgets

Recommended widgets for custom dashboard:

1. **Error Frequency** - Line chart of errors over time
2. **Affected Users** - Count of users experiencing errors
3. **Top Issues** - Most frequent error types
4. **Performance** - P95 response times
5. **Release Health** - Error rate by deployment

### Test Metrics Trends

Track these over time (manual or via CI artifacts):

| Metric | Current | Target | Trend |
|--------|---------|--------|-------|
| Pass Rate | 96% | >95% | ✅ Stable |
| Coverage | 82% | >80% | ✅ Increasing |
| Duration | 12 min | <15 min | ✅ Stable |
| Flaky Rate | 3% | <5% | ✅ Decreasing |

---

## 💡 Tips

1. **Review Sentry daily** - Catch errors early
2. **Set up Slack integration** - Get notified immediately
3. **Use release tracking** - Correlate errors with deployments
4. **Generate metrics weekly** - Track test health trends
5. **Don't ignore warnings** - Small issues become big problems
6. **Test Sentry in staging** - Verify before production

---

## 📞 Support

### Sentry Issues

- **Docs**: [https://docs.sentry.io](https://docs.sentry.io)
- **Status**: [https://status.sentry.io](https://status.sentry.io)
- **Support**: [https://sentry.io/support](https://sentry.io/support)

### Test Metrics

- Check script output for errors
- Verify test results exist before generating
- Review `generate-test-metrics.js` for customization

---

## 🚀 Next Actions

After completing Phase 4 setup:

1. **Create Sentry project** - Get DSN and configure
2. **Add DSN to Vercel** - Production error tracking
3. **Set up alerts** - Critical errors notify immediately
4. **Generate first metrics** - Baseline test performance
5. **Monitor trends** - Weekly review of errors and tests
6. **Iterate and improve** - Adjust thresholds and alerts

---

**Phase 4 Complete! 🎉**

You now have comprehensive monitoring for both production errors and test health.

See:
- **[TESTING_README.md](TESTING_README.md)** - Testing guide
- **[TESTING_AUTOMATION_PLAN.md](../../docs/TESTING_AUTOMATION_PLAN.md)** - Complete plan
