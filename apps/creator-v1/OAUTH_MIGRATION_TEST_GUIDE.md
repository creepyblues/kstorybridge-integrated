# OAuth Migration Testing Guide

**Date**: 2025-10-05
**Migration**: Remove browser-side service role, use edge functions for OAuth
**Status**: ✅ Build succeeded, ⚠️ Manual testing required

## 🎯 Testing Objective

Verify that removing `supabaseServiceRole` from browser does NOT break any authentication flows.

## ✅ Pre-Test Verification (COMPLETED)

### Build Test
```bash
npm run build
```
**Result**: ✅ **PASSED** (8.77s)

### Lint Test
```bash
npm run lint
```
**Result**: ⚠️ **PASSED WITH PRE-EXISTING WARNINGS**
- No NEW errors introduced by migration
- Pre-existing `any` type warnings in multiple files (not functional issues)

### Code Review
- ✅ Removed `supabaseServiceRole` export from `client.ts`
- ✅ Updated `atomicProfileCreator.ts` to use regular client only
- ✅ OAuth signup uses secure edge function (`createOAuthProfileViaEdgeFunction`)
- ✅ Email signup relies on RLS policies (which allow authenticated users)

### RLS Policy Verification
- ✅ `user_buyers` has INSERT policy for `authenticated` users (auth.uid() = id)
- ✅ `user_creators` has INSERT policy for `authenticated` users (auth.uid() = id)
- ✅ Email signups get authenticated session BEFORE email verification
- ✅ OAuth signups use edge functions with service role (server-side, secure)

---

## 📋 Manual Testing Checklist

### Phase 1: Email Authentication

#### Test 1.1: Buyer Email Signup
**Steps**:
1. Navigate to http://localhost:8081/signup/buyer
2. Fill form with test email: `test+buyer_$(date +%s)@example.com`
3. Fill required fields:
   - Full Name: "Test Buyer OAuth Migration"
   - Company: "Test Company"
   - Role: "Producer"
   - Password: "Test123!@#"
4. Submit form

**Expected Results**:
- [  ] Auth user created in Supabase Auth
- [  ] Buyer profile exists in `user_buyers` table
- [  ] No console errors about RLS violations
- [  ] No "supabaseServiceRole is not defined" errors
- [  ] Verification email sent notification appears
- [  ] Slack notification sent (check #user-signups channel)

**Database Verification**:
```sql
-- Check buyer profile created
SELECT * FROM user_buyers WHERE email = 'your_test_email@example.com';

-- Verify no orphaned auth users
SELECT auth.users.email
FROM auth.users
LEFT JOIN user_buyers ON auth.users.id = user_buyers.id
LEFT JOIN user_creators ON auth.users.id = user_creators.id
WHERE auth.users.email = 'your_test_email@example.com'
  AND user_buyers.id IS NULL
  AND user_creators.id IS NULL;
-- Should return NO ROWS
```

---

#### Test 1.2: Creator Email Signup
**Steps**:
1. Navigate to http://localhost:8081/signup/creator
2. Fill form with test email: `test+creator_$(date +%s)@example.com`
3. Fill required fields:
   - Full Name: "Test Creator OAuth Migration"
   - Pen Name: "Test Pen Name"
   - Role: "Author"
   - Password: "Test123!@#"
4. Submit form

**Expected Results**:
- [  ] Auth user created
- [  ] Creator profile exists in `user_creators` table
- [  ] No console errors
- [  ] Verification email sent
- [  ] Slack notification sent

**Database Verification**:
```sql
SELECT * FROM user_creators WHERE email = 'your_test_email@example.com';
```

---

#### Test 1.3: Email Signin (Existing User)
**Prerequisites**: Use buyer account from Test 1.1 (must verify email first)

**Steps**:
1. Open Supabase Dashboard → Authentication → Users
2. Find test buyer user, click "Confirm Email"
3. Navigate to http://localhost:8081/signin/buyer
4. Enter email and password from Test 1.1
5. Click "Sign In"

**Expected Results**:
- [  ] Session created successfully
- [  ] Redirects to `/buyers/chat`
- [  ] NO `getSession()` timeout errors
- [  ] NO "Multiple GoTrueClient instances detected" warning
- [  ] User profile loads correctly

**Browser Console Checks**:
- [  ] NO errors containing "supabaseServiceRole"
- [  ] NO errors containing "Multiple GoTrueClient"
- [  ] NO timeouts exceeding 5 seconds

---

#### Test 1.4: Email Signin (Auto-Profile Creation)
**Setup**:
1. Open Supabase Dashboard → Authentication → Users
2. Manually create test user:
   - Email: `test+autoprofile@example.com`
   - Password: `Test123!@#`
   - Confirm email immediately
3. Open SQL Editor, run:
   ```sql
   DELETE FROM user_buyers WHERE email = 'test+autoprofile@example.com';
   ```

**Steps**:
1. Navigate to http://localhost:8081/signin/buyer
2. Sign in with `test+autoprofile@example.com` / `Test123!@#`

**Expected Results**:
- [  ] Buyer profile auto-created during signin
- [  ] NO RLS violation errors
- [  ] Redirects to `/buyers/chat` successfully
- [  ] Profile visible in database

**Database Verification**:
```sql
-- Profile should exist after signin
SELECT * FROM user_buyers WHERE email = 'test+autoprofile@example.com';
```

---

### Phase 2: OAuth Authentication

#### Test 2.1: Google Buyer Signup
**Steps**:
1. Navigate to http://localhost:8081/signup/buyer
2. Click "Continue with Google" button
3. Complete Google OAuth flow (use test Google account)
4. Fill profile completion form:
   - Company: "OAuth Test Company"
   - Role: "Producer"
5. Submit form

**Expected Results**:
- [  ] OAuth session created successfully
- [  ] Profile completion form appears
- [  ] Edge function creates buyer profile (check Supabase Logs)
- [  ] NO timeout errors in console
- [  ] Redirects to `/buyers/chat`
- [  ] Welcome email sent (check email)
- [  ] Slack notification sent

**Supabase Edge Function Logs**:
1. Open Supabase Dashboard → Edge Functions → `create-oauth-profile`
2. Check logs for:
   - [  ] "OAuth Profile: Using secure edge function approach"
   - [  ] "OAuth Profile: Edge function succeeded"
   - [  ] NO timeout errors

**Database Verification**:
```sql
SELECT * FROM user_buyers WHERE email = 'your_google_email@gmail.com';
```

---

#### Test 2.2: Google Creator Signup
**Steps**:
1. Navigate to http://localhost:8081/signup/creator
2. Click "Continue with Google" (use DIFFERENT Google account than Test 2.1)
3. Complete Google OAuth flow
4. Fill profile completion form:
   - Pen Name: "OAuth Creator Test"
   - Role: "Author"
5. Submit form

**Expected Results**:
- [  ] OAuth session created
- [  ] Edge function creates creator profile
- [  ] Redirects to `/creators/home`
- [  ] No timeout errors

**Supabase Edge Function Logs**:
- [  ] Check logs show successful creator profile creation

---

#### Test 2.3: Google Buyer Signin (Existing User)
**Prerequisites**: Use Google account from Test 2.1

**Steps**:
1. Sign out (if signed in)
2. Navigate to http://localhost:8081/signin/buyer
3. Click "Continue with Google"
4. Complete Google OAuth flow

**Expected Results**:
- [  ] Instant signin (NO profile completion form)
- [  ] Redirects to `/buyers/chat`
- [  ] NO session timeouts
- [  ] NO "Multiple GoTrueClient instances detected" warning
- [  ] Chat page loads normally

---

### Phase 3: Edge Cases

#### Test 3.1: OAuth Fallback (Edge Function Failure Simulation)
**This test simulates edge function unavailability**

**Setup**:
1. Open `src/components/auth/signupService.ts`
2. Find `completeOAuthProfile()` function (~line 48)
3. Temporarily add at line 60:
   ```typescript
   // TESTING ONLY: Force edge function to fail
   profileResult = { success: false, error: 'Simulated edge function failure' };
   ```

**Steps**:
1. Start fresh Google OAuth buyer signup (use new Google account)
2. Complete profile form
3. Submit

**Expected Results**:
- [  ] Console shows "⚠️ Simple OAuth profile creation failed, falling back to atomic creator"
- [  ] Fallback to `createBuyerProfileAtomic()` succeeds
- [  ] Profile created via regular client + RLS policy
- [  ] User completes signup successfully
- [  ] Redirects to dashboard

**Cleanup**:
```typescript
// Remove the test line from signupService.ts
```

---

#### Test 3.2: Session Corruption Recovery
**Steps**:
1. Sign in as buyer (any account)
2. Open Browser DevTools → Application → Local Storage
3. Find key starting with `sb-dlrnrgcoguxlkkcitlpd-auth-token`
4. Edit the value, change last 10 characters to random gibberish
5. Reload page

**Expected Results**:
- [  ] `sessionManager` detects corrupted session
- [  ] Auto-recovery initiated
- [  ] User remains signed in OR is prompted to sign in again
- [  ] NO infinite loading states
- [  ] Console shows recovery logs

---

#### Test 3.3: Chat Page (Original Issue Fix Verification)
**Prerequisites**: Signed in as buyer

**Steps**:
1. Navigate to http://localhost:8081/buyers/chat
2. Wait for page to fully load

**Expected Results**:
- [  ] Page loads within 5 seconds
- [  ] NO "Loading conversation history..." timeout
- [  ] NO "Multiple GoTrueClient instances detected" warning in console
- [  ] NO repeated `getSession()` calls (check Network tab)
- [  ] Chat history loads correctly
- [  ] Chat interface is fully functional

**Browser Console Checks**:
```javascript
// Open DevTools Console
// Check for these SHOULD NOT EXIST:
❌ "Multiple GoTrueClient instances detected"
❌ "getSession timeout after 60000ms"
❌ "supabaseServiceRole is not defined"
```

---

## 🚨 Failure Handling

**If ANY test fails:**

### Immediate Actions:
1. **Document the failure**:
   - Which test failed?
   - What was the exact error message?
   - Screenshot of browser console
   - Screenshot of Supabase logs (if applicable)

2. **DO NOT PROCEED** with remaining tests until issue is resolved

### Rollback Procedure:
```bash
# 1. Revert client.ts changes
git checkout HEAD -- src/integrations/supabase/client.ts

# 2. Revert atomicProfileCreator.ts changes
git checkout HEAD -- src/utils/atomicProfileCreator.ts

# 3. Revert signupService.ts OAuth changes
git checkout HEAD -- src/components/auth/signupService.ts

# 4. Delete new edge function service
rm src/services/oauthProfileEdgeFunction.ts

# 5. Restore .env.local service role key
# Add this line to .env.local:
# VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 6. Rebuild and verify
npm run build
```

### Verification After Rollback:
1. Re-run the failed test
2. If test now passes, rollback was successful
3. Investigate root cause before re-attempting migration

---

## ✅ Success Criteria

**ALL of the following MUST be checked:**

### Build & Code
- [  ] Build succeeds without errors
- [  ] Lint passes (or only has pre-existing warnings)
- [  ] No new TypeScript errors

### Email Authentication (4 tests)
- [  ] Test 1.1: Buyer email signup ✅
- [  ] Test 1.2: Creator email signup ✅
- [  ] Test 1.3: Email signin (existing) ✅
- [  ] Test 1.4: Email signin (auto-profile) ✅

### OAuth Authentication (3 tests)
- [  ] Test 2.1: Google buyer signup ✅
- [  ] Test 2.2: Google creator signup ✅
- [  ] Test 2.3: Google buyer signin ✅

### Edge Cases (3 tests)
- [  ] Test 3.1: OAuth fallback ✅
- [  ] Test 3.2: Session recovery ✅
- [  ] Test 3.3: Chat page loads ✅

### No Console Errors (CRITICAL)
- [  ] Zero "supabaseServiceRole is not defined" errors
- [  ] Zero "Multiple GoTrueClient" warnings
- [  ] Zero `getSession()` timeout errors
- [  ] Zero RLS policy violation errors

---

## 📊 Test Results Summary

**Tester Name**: ________________
**Date Tested**: ________________
**Environment**: Local Development

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1.1 | Buyer Email Signup | ⏳ Pending |  |
| 1.2 | Creator Email Signup | ⏳ Pending |  |
| 1.3 | Email Signin (Existing) | ⏳ Pending |  |
| 1.4 | Email Signin (Auto-Profile) | ⏳ Pending |  |
| 2.1 | Google Buyer Signup | ⏳ Pending |  |
| 2.2 | Google Creator Signup | ⏳ Pending |  |
| 2.3 | Google Buyer Signin | ⏳ Pending |  |
| 3.1 | OAuth Fallback | ⏳ Pending |  |
| 3.2 | Session Recovery | ⏳ Pending |  |
| 3.3 | Chat Page Fix | ⏳ Pending |  |

**Overall Result**: ⏳ Testing In Progress

---

## 🎓 Testing Tips

### Quick Test Account Generation
```bash
# Generate unique test email
echo "test+buyer_$(date +%s)@example.com"
```

### Database Quick Checks
```sql
-- Check all recent signups (last hour)
SELECT email, created_at, tier
FROM user_buyers
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check orphaned auth users
SELECT u.email, u.created_at
FROM auth.users u
LEFT JOIN user_buyers b ON u.id = b.id
LEFT JOIN user_creators c ON u.id = c.id
WHERE b.id IS NULL AND c.id IS NULL;
```

### Browser Console Filtering
```javascript
// Filter console to show only errors
console.clear();
// Then enable "Errors" only in DevTools console filter
```

### Supabase Logs Access
1. Open: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd
2. Navigate to: Functions → `create-oauth-profile` → Logs
3. Filter by time range (last 1 hour)

---

## 📝 Next Steps After Testing

**If ALL tests pass:**
1. ✅ Mark this migration as VERIFIED
2. ✅ Create a summary report
3. ✅ Deploy to staging environment
4. ✅ Run same tests on staging
5. ✅ Monitor production for 24 hours after deployment

**If ANY test fails:**
1. ❌ DO NOT deploy to staging
2. ❌ Execute rollback procedure (see above)
3. 🔧 Investigate root cause
4. 🔧 Fix issue
5. 🔁 Re-run ALL tests from the beginning

---

**Testing Started**: _________________
**Testing Completed**: _________________
**Final Status**: ⏳ Awaiting Manual Tests
