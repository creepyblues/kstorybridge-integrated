# 🧪 Authentication Testing Suite

Complete automated and manual testing suite for KStoryBridge authentication flows.

**Created**: 2025-10-11
**Status**: Ready for execution
**Coverage**: Email signup, OAuth signup, Email signin, OAuth signin, Edge functions, Database verification

---

## 📋 Quick Start

```bash
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard

# Run all automated tests
npm run test:all

# Or run individual test suites
npm run test:auth          # Authentication flows
npm run test:db            # Database verification
npm run test:edge          # Edge function testing
```

---

## 🔧 Test Scripts Overview

### 1. **Automated Authentication Flow Tests** (`test-auth-flows.js`)

Tests email signup, profile creation, and field validation automatically.

**What it tests**:
- ✅ Email validation (work vs consumer domains)
- ✅ Required field validation
- ✅ Buyer email signup flow
- ✅ Creator email signup flow
- ✅ Edge function profile creation
- ✅ Database profile verification
- ✅ Field integrity checks

**Commands**:
```bash
# Basic test run
npm run test:auth

# Verbose output (see all logs)
npm run test:auth:verbose

# With automatic cleanup (deletes test users after)
npm run test:auth:cleanup
```

**Expected Output**:
```
🧪 Starting Authentication Flow Tests
Timestamp: 2025-10-11T...
Test Buyer Email: test-buyer-...@testcompany.com
Test Creator Email: test-creator-...@gmail.com

============================================================
TEST: Email Validation
============================================================
✅ Block consumer email: test@gmail.com: PASSED (correctly blocked)
✅ Allow work email: test@company.com: PASSED (correctly allowed)

============================================================
TEST SUMMARY
============================================================
Total Tests: 25
Passed: 25
Failed: 0
Success Rate: 100.0%
```

---

### 2. **Database Verification** (`test-database-verification.js`)

Verifies database state, profile existence, and table statistics.

**What it checks**:
- ✅ Profile existence by email
- ✅ Table statistics (buyer/creator counts)
- ✅ Tier distribution
- ✅ Recent signups (last 24 hours)
- ✅ Orphaned users detection
- ✅ Data integrity

**Commands**:
```bash
# Check overall database state
npm run test:db

# Check specific user by email
node test-database-verification.js --email=user@example.com
```

**Expected Output**:
```
🔍 Database Verification Tool
Timestamp: 2025-10-11T...

============================================================
Table Statistics
============================================================
👥 Total Buyers: 147
✍️  Total Creators: 89

📊 Buyer Tier Distribution:
  basic: 120 users
  pro: 15 users
  suite: 12 users

📊 Creator Status Distribution:
  invited: 65 users
  active: 24 users

============================================================
Recent Signups (Last 24 Hours)
============================================================
👥 Recent Buyers:
  test@company.com | Test User | Test Company | Tier: basic

✅ Verification complete!
```

---

### 3. **Edge Function Testing** (`test-edge-functions.js`)

Tests Supabase edge functions for profile creation.

**What it tests**:
- ✅ `create-buyer-profile` function
- ✅ `create-oauth-profile` function (buyer)
- ✅ `create-oauth-profile` function (creator)
- ✅ Error handling (missing fields, invalid types)
- ✅ Response times
- ✅ Function availability

**Commands**:
```bash
# Test all edge functions
npm run test:edge

# Test specific function
node test-edge-functions.js --function=create-buyer-profile
```

**Expected Output**:
```
🧪 Edge Function Testing Tool
Timestamp: 2025-10-11T...

============================================================
Edge Function Availability Check
============================================================
✅ create-buyer-profile is available
✅ create-creator-profile is available
✅ create-oauth-profile is available

============================================================
Testing: create-buyer-profile
============================================================
Creates buyer profile via edge function (email signup flow)

📤 Sending request to create-buyer-profile...
⏱️  Response time: 342ms
📊 Status: 200 OK
✅ Edge function succeeded

============================================================
Test Summary
============================================================
Total Tests: 3
Successful: 3
Failed: 0
Average Duration: 380ms

✅ All edge function tests passed!
```

---

### 4. **Manual OAuth Flow Testing** (`test-oauth-flow-manual.md`)

Step-by-step guide for manually testing OAuth flows in browser.

**What it covers**:
- Buyer OAuth signup (Google)
- Creator OAuth signup (Google)
- OAuth signin (existing profile)
- OAuth signin (no profile - error case)
- URL parameter verification
- Console log inspection
- Session storage verification

**How to use**:
1. Open `test-oauth-flow-manual.md` in your editor
2. Start dev server: `npm run dev`
3. Follow step-by-step instructions
4. Document results for each test

---

## 📊 Test Coverage Matrix

| Flow | Automated | Manual | Edge Function | Database |
|------|-----------|---------|---------------|----------|
| Buyer Email Signup | ✅ | ✅ | ✅ | ✅ |
| Creator Email Signup | ✅ | ✅ | ✅ | ✅ |
| Buyer OAuth Signup | ⚠️ Manual Only | ✅ | ✅ | ✅ |
| Creator OAuth Signup | ⚠️ Manual Only | ✅ | ✅ | ✅ |
| Email Signin | ⚠️ Partial | ✅ | N/A | ✅ |
| OAuth Signin | ⚠️ Manual Only | ✅ | N/A | ✅ |
| Email Validation | ✅ | ✅ | N/A | N/A |
| Required Fields | ✅ | ✅ | ✅ | N/A |
| Profile Creation | ✅ | ✅ | ✅ | ✅ |
| Database Verification | ✅ | ✅ | N/A | ✅ |

**Legend**:
- ✅ Fully Automated / Covered
- ⚠️ Partially Automated (requires manual OAuth)
- N/A Not Applicable

---

## 🚀 Testing Workflow

### Complete Testing Sequence

```bash
# 1. Start with automated tests
npm run test:all

# 2. Check database state
npm run test:db

# 3. Verify specific user
node test-database-verification.js --email=test@example.com

# 4. Manual OAuth testing (follow guide)
# Open: test-oauth-flow-manual.md

# 5. Check Supabase logs
# Visit: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
```

### Quick Smoke Test (5 minutes)

```bash
# 1. Run automated tests
npm run test:auth:verbose

# 2. Check one manual OAuth flow
# Follow Test 1 in test-oauth-flow-manual.md

# 3. Verify in database
npm run test:db
```

### Full Regression Test (30 minutes)

1. **Automated Tests** (5 min)
   ```bash
   npm run test:all
   ```

2. **Manual OAuth Tests** (15 min)
   - Follow all 5 tests in `test-oauth-flow-manual.md`
   - Test both buyer and creator flows
   - Test error cases

3. **Database Verification** (5 min)
   ```bash
   npm run test:db
   node test-database-verification.js --email=your-test-email@example.com
   ```

4. **Edge Function Logs** (5 min)
   - Visit Supabase dashboard
   - Check function execution logs
   - Verify no errors

---

## 🐛 Troubleshooting

### Automated Tests Failing

**Error**: `Cannot find module '@supabase/supabase-js'`

**Solution**:
```bash
npm install @supabase/supabase-js
```

**Error**: `VITE_SUPABASE_URL is not defined`

**Solution**:
```bash
# Make sure .env.local exists with:
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Manual Tests Failing

**Issue**: OAuth redirect shows "bad_oauth_state" error

**Solution**: Verify the fix was applied correctly:
```bash
# Check SigninForm.tsx line 104
grep -A 5 "callbackUrl" src/components/SigninForm.tsx

# Should show: redirectTo: callbackUrl
```

**Issue**: Profile not created after OAuth

**Solution**: Check edge function logs:
1. Visit: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
2. Check `create-oauth-profile` logs
3. Look for errors

### Database Verification Issues

**Issue**: "No profiles found"

**Solution**:
```bash
# Check if test users exist
node test-database-verification.js --email=test-buyer-...@testcompany.com
```

**Issue**: RLS errors in console

**Solution**: Edge functions should bypass RLS with service role key. Check edge function deployment.

---

## 📝 Test Result Documentation

### Test Report Template

```markdown
## Authentication Test Results

**Date**: 2025-10-11
**Tester**: [Your Name]
**Environment**: Localhost / Staging / Production
**Branch**: v2

### Automated Tests

**test:auth**:
- ✅ PASS - All 25 tests passed
- Duration: 8.2 seconds
- Notes: Email validation and profile creation working correctly

**test:db**:
- ✅ PASS - Database verification successful
- Total Buyers: 147
- Total Creators: 89
- Notes: All profiles have correct fields

**test:edge**:
- ✅ PASS - All edge functions operational
- Average response time: 380ms
- Notes: No errors in function execution

### Manual OAuth Tests

**Buyer OAuth Signup**:
- ✅ PASS
- Duration: 10.2 seconds
- URL Parameters: ✅ Correct (account_type=buyer&flow=signup)
- Profile Created: ✅ Yes
- Dashboard Redirect: ✅ Correct (/buyers/home)
- Notes: Smooth flow, no errors

**Creator OAuth Signup**:
- ✅ PASS
- Duration: 11.8 seconds
- Notes: Pen name and role required fields working

**OAuth Signin**:
- ✅ PASS
- Duration: 7.4 seconds
- Profile Check: ✅ Working
- Notes: Fast redirect to dashboard

**OAuth Signin (No Profile)**:
- ✅ PASS
- Error Message: ✅ Correct
- Redirect: ✅ To /signup/buyer
- Notes: Error handling working as expected

### Issues Found

None

### Recommendations

Ready for production deployment
```

---

## 🎯 Success Criteria

### Must Pass (Blockers)

- [ ] All automated tests pass (test:all)
- [ ] All manual OAuth flows work (4/4 tests)
- [ ] No `bad_oauth_state` errors
- [ ] Profile creation 100% success rate
- [ ] Database verification shows correct data
- [ ] Edge functions respond in < 5 seconds
- [ ] OAuth completion < 15 seconds

### Should Pass (Important)

- [ ] Email validation working correctly
- [ ] Required field validation working
- [ ] Proper error messages shown
- [ ] Slack notifications sent
- [ ] Welcome emails sent
- [ ] Console logs clean (no errors)

### Nice to Have

- [ ] OAuth completion < 10 seconds
- [ ] Edge functions < 3 seconds
- [ ] No unnecessary database queries
- [ ] Clean browser console

---

## 📚 Additional Resources

- **AUTH_DOCUMENTATION.md** - Complete auth system reference
- **USER_JOURNEY_MAP.md** - Detailed user flow diagrams
- **DATABASE_SCHEMA.md** - Database structure reference
- **Supabase Dashboard**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd

---

## 🔄 Next Steps After Testing

1. **All tests pass** → Ready for production
2. **Some tests fail** → Report issues, fix, re-test
3. **Edge function errors** → Check Supabase logs
4. **Database issues** → Run verification queries
5. **OAuth errors** → Verify URL parameter fix applied

---

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review relevant documentation (AUTH_DOCUMENTATION.md)
3. Check Supabase edge function logs
4. Verify fix was applied correctly (grep for callbackUrl)

---

**Version**: 1.0
**Last Updated**: 2025-10-11
**Maintainer**: Development Team
