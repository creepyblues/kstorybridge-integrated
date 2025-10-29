# Quick Guide: Fix Staging SSL Certificates

**Issue**: SSL certificate error blocking all E2E tests
**Domains Affected**:
- `dashboard-v2.kstorybridge.com`
- `creator-v2.kstorybridge.com`

---

## Step-by-Step Fix

### 1. Access Vercel Dashboard (2 minutes)

**Go to**: https://vercel.com

**Navigate to your projects**:
- Look for "dashboard" or "kstorybridge-dashboard" project
- Look for "creator-v2" or "kstorybridge-creator" project

### 2. Check SSL Status (3 minutes)

**For Dashboard Staging**:
1. Open dashboard project
2. Click **Settings** tab
3. Click **Domains** in left sidebar
4. Find `dashboard-v2.kstorybridge.com`
5. Check SSL certificate status

**For Creator Staging**:
1. Open creator project
2. Click **Settings** tab
3. Click **Domains** in left sidebar
4. Find `creator-v2.kstorybridge.com`
5. Check SSL certificate status

**Look for**:
- ❌ "Certificate Expired" → **Need to regenerate**
- ❌ "Certificate Invalid" → **Need to fix DNS**
- ⚠️ "Certificate Provisioning" → **Wait 5-10 minutes**
- ✅ "Certificate Valid" → **Check date, may need refresh**

### 3. Fix Certificates (10 minutes)

**Option A: Regenerate Certificate** (Most common fix)
1. Click on the affected domain
2. Look for **"Refresh Certificate"** or **"Renew"** button
3. Click it
4. Wait for "Certificate Provisioning..." → "Certificate Valid"
5. Takes 5-10 minutes usually

**Option B: Remove and Re-add Domain** (If regenerate doesn't work)
1. Click **"Remove"** next to the domain
2. Wait 30 seconds
3. Click **"Add Domain"**
4. Enter the domain name (e.g., `dashboard-v2.kstorybridge.com`)
5. Vercel will auto-configure DNS and SSL
6. Wait 5-10 minutes for provisioning

**Option C: Check DNS Settings** (If certificate won't provision)
1. Go to your domain registrar (where you bought kstorybridge.com)
2. Check DNS records for subdomain
3. Should have CNAME record pointing to Vercel:
   ```
   dashboard-v2  CNAME  cname.vercel-dns.com
   creator-v2    CNAME  cname.vercel-dns.com
   ```
4. Update if incorrect
5. Wait 5-10 minutes (up to 48 hours for DNS propagation)

### 4. Verify Fix (2 minutes)

**Test in Browser**:
```bash
# Open staging URLs
open https://dashboard-v2.kstorybridge.com
open https://creator-v2.kstorybridge.com
```

**Expected**: Pages load without SSL warning

**If Still SSL Error**:
- Clear browser cache and retry
- Try incognito/private window
- Wait another 5 minutes for SSL propagation

### 5. Re-run Tests (5 minutes)

Once SSL is working in browser:

```bash
# Run all E2E tests on staging
npm run test:e2e:staging

# Or run in UI mode to watch
npm run test:e2e:ui

# View results
npm run test:e2e:report
```

**Expected**: Tests should pass (or reveal actual code issues to fix)

---

## Common Issues

### Issue: "Certificate Provisioning" stuck for >15 minutes

**Solution**:
1. Remove the domain from Vercel
2. Wait 1 minute
3. Re-add the domain
4. If still stuck, check DNS records

### Issue: DNS records correct but certificate won't provision

**Solution**:
1. Check if you're on Vercel Pro plan (may have custom SSL requirements)
2. Contact Vercel support via dashboard
3. Or use Vercel CLI: `vercel certs issue dashboard-v2.kstorybridge.com`

### Issue: Certificate shows "Valid" but browser still shows error

**Solution**:
1. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Try different browser
3. Check if you have browser extensions blocking SSL
4. Verify date/time on your computer is correct

---

## Alternative: Test on Localhost

If you can't fix SSL quickly and need to test code:

**Start Local Servers**:
```bash
# Terminal 1
npm run dev:dashboard

# Terminal 2
npm run dev:creator
```

**Run Tests Locally**:
```bash
TEST_ENV=localhost npm run test:e2e
```

**Note**: This won't test OAuth or SSL, but validates core functionality.

---

## After SSL is Fixed

### Re-test Everything:
```bash
# Full test suite
npm run test:e2e:staging

# Individual suites if needed
npm run test:e2e:auth
npm run test:e2e:chatbot
npm run test:e2e:creator
```

### Expected Pass Rate:
- **Target**: 28/31 tests passing (90%+)
- **Acceptable**: 25/31 tests passing (80%+)
- **Needs work**: <25 tests passing

### Common Test Failures After SSL Fix:

1. **Auth tests fail** → Check test account passwords in `.env.test`
2. **Chatbot tests fail** → Check if staging has data (titles) to query
3. **Creator tests fail** → Check if test creator has any titles
4. **OAuth tests fail** → Check OAuth redirect URLs in Google Console + Supabase

---

## Quick Checklist

- [ ] Accessed Vercel dashboard
- [ ] Found dashboard-v2 domain settings
- [ ] Found creator-v2 domain settings
- [ ] Checked SSL certificate status
- [ ] Regenerated/renewed certificates
- [ ] Waited 5-10 minutes for provisioning
- [ ] Verified SSL works in browser
- [ ] Re-ran E2E test suite
- [ ] Reviewed test results
- [ ] Documented any new failures

---

## Need Help?

**Vercel SSL Docs**: https://vercel.com/docs/concepts/projects/custom-domains#ssl

**Vercel Support**: Help button in Vercel dashboard

**Quick Test**: `curl -v https://dashboard-v2.kstorybridge.com 2>&1 | grep "SSL certificate"`

---

**Estimated Time**: 15-20 minutes total
**Success Criteria**: All E2E tests pass on staging
