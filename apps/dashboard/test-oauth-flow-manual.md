# Manual OAuth Flow Testing Guide

**Purpose**: Step-by-step guide for manually testing OAuth flows after the critical fix

**Date**: 2025-10-11

---

## Prerequisites

1. Start the dashboard development server:
   ```bash
   cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard
   npm run dev
   ```

2. Open Chrome DevTools:
   - Press F12 or Cmd+Option+I
   - Go to **Console** tab (for logs)
   - Go to **Network** tab (for OAuth redirects)
   - Go to **Application** → **Session Storage** (to verify storage)

---

## Test 1: Buyer OAuth Signup (NEW URL PARAMETER APPROACH)

### Step-by-Step Instructions

1. **Navigate to signup page**
   ```
   http://localhost:8081/signup/buyer
   ```

2. **Open DevTools Network Tab**
   - Filter by "auth"
   - Click "Continue with Google" button

3. **Verify OAuth Initiation**
   - Look for network request to `signInWithOAuth`
   - Check the redirect URL in the request
   - **✅ EXPECTED**: URL should be:
     ```
     http://localhost:8081/auth/callback?account_type=buyer&flow=signup
     ```
   - **❌ WRONG**: If you see a `state` parameter or no URL parameters

4. **Check SessionStorage**
   - In DevTools → Application → Session Storage → http://localhost:8081
   - **✅ EXPECTED**: See these entries:
     ```
     oauth_account_type: "buyer"
     oauth_flow: "signup"
     ```

5. **Complete Google Authentication**
   - Select your Google account
   - Authorize the application
   - Watch the URL changes

6. **Verify OAuth Callback URL**
   - After Google redirects back, check the URL bar
   - **✅ EXPECTED**: URL should be:
     ```
     http://localhost:8081/auth/callback?account_type=buyer&flow=signup&code=...
     ```
   - Check console logs for:
     ```
     🚀 OAuth Callback: Starting ultra-simple processing
     📋 OAuth params: { code: true, accountType: 'buyer', flow: 'signup' }
     ✅ OAuth session established for: your-email@gmail.com
     🎯 Account type detection: { fromURLParam: 'buyer', ... }
     ```

7. **Verify Profile Completion Redirect**
   - Should redirect to:
     ```
     http://localhost:8081/signup/buyer?complete=true&user_id=...&email=...
     ```

8. **Fill Profile Completion Form**
   - Company: "Test Company Inc"
   - Role: Select "Producer"
   - Submit the form

9. **Verify Profile Creation**
   - Check console logs for:
     ```
     🔄 Completing OAuth profile for: your-email as buyer
     🚀 OAuth Profile: Using secure edge function approach
     ✅ OAuth Profile: Edge function succeeded
     🔄 Updating account_type metadata with existing session...
     ✅ Account type metadata updated successfully
     ```

10. **Verify Dashboard Redirect**
    - Should redirect to: `http://localhost:8081/buyers/home`
    - Total time should be < 12 seconds
    - Check for NO errors in console

---

## Test 2: Creator OAuth Signup

Follow same steps as Test 1, but:

1. **Navigate to**:
   ```
   http://localhost:8081/signup/creator
   ```

2. **Expected OAuth URL**:
   ```
   http://localhost:8081/auth/callback?account_type=creator&flow=signup
   ```

3. **Profile completion fields**:
   - Pen Name: "Test Creator Name"
   - Role: Select "Author" or "Agent" (REQUIRED)

4. **Expected dashboard**:
   ```
   http://localhost:8081/creators/home
   ```

---

## Test 3: Buyer OAuth Signin (Existing Profile)

### Prerequisites
- Must have an existing buyer profile from Test 1 or previous signup

### Steps

1. **Sign out** if currently signed in

2. **Navigate to**:
   ```
   http://localhost:8081/signin/buyer
   ```

3. **Click "Continue with Google"**

4. **Verify OAuth URL**:
   ```
   http://localhost:8081/auth/callback?account_type=buyer&flow=signin
   ```

5. **Complete Google Authentication**

6. **Verify Console Logs**:
   ```
   📋 OAuth params: { accountType: 'buyer', flow: 'signin' }
   🎯 Flow type detection: { fromURLParam: 'signin', ... }
   🔍 OAuth signin - checking profile existence
   ✅ Profile found - redirecting to dashboard
   ```

7. **Verify Direct Dashboard Redirect**:
   - Should go directly to `/buyers/home`
   - NO profile completion page
   - Total time should be < 8 seconds

---

## Test 4: OAuth Signin WITHOUT Profile (Error Case)

### Prerequisites
- Use a Google account that has NEVER signed up

### Steps

1. **Navigate to**:
   ```
   http://localhost:8081/signin/buyer
   ```

2. **Click "Continue with Google"**

3. **Select Google account that has NO profile**

4. **Verify OAuth Callback**:
   ```
   📋 OAuth params: { accountType: 'buyer', flow: 'signin' }
   🔍 OAuth signin - checking profile existence
   ❌ Profile not found
   ```

5. **Verify Error Toast**:
   - Should see toast notification:
   - Title: "Account Not Found"
   - Description: "Your account doesn't exist. Please sign up first."

6. **Verify Redirect**:
   - After 2 seconds, should redirect to: `/signup/buyer`

---

## Test 5: Verify NO OAuth State Parameter Errors

### What to Check Throughout All Tests

1. **Console Logs**:
   - ❌ Should NOT see: `bad_oauth_state`
   - ❌ Should NOT see: `OAuth state parameter conflict`
   - ❌ Should NOT see: `PKCE verification failed`

2. **Network Tab**:
   - Look for OAuth redirect requests
   - Verify redirect URLs contain `?account_type=...&flow=...`
   - NOT: `state=...` as a separate parameter

3. **Callback Processing**:
   - Verify logs show: `fromURLParam: 'buyer'` (or 'creator')
   - NOT: `fromOAuthState` or `fromState`

---

## Common Issues & Solutions

### Issue: `bad_oauth_state` Error
**Cause**: Code still using old state parameter approach
**Solution**: Verify the fix was applied correctly:
- Check `SigninForm.tsx` line 104
- Check `signupService.ts` line 419
- Should use: `redirectTo: callbackUrl` with URL params

### Issue: Account Type Not Detected
**Cause**: URL parameters not being passed
**Solution**:
- Check browser URL bar during OAuth callback
- Should see: `?account_type=buyer&flow=signup`
- Check console: `fromURLParam` should have value

### Issue: Profile Not Created
**Cause**: Edge function not called or failed
**Solution**:
- Check console for edge function logs
- Check Supabase dashboard edge function logs
- Verify edge function deployed correctly

### Issue: Infinite Loop or Hanging
**Cause**: Session not established properly
**Solution**:
- Check for `getSession()` timeout errors
- Verify session is passed through call stack
- Check edge function completes < 5 seconds

---

## Success Criteria Checklist

After completing all tests, verify:

- [ ] OAuth redirect URLs contain `account_type` and `flow` parameters
- [ ] NO `bad_oauth_state` errors appear
- [ ] Buyer OAuth signup completes in < 12 seconds
- [ ] Creator OAuth signup completes in < 12 seconds
- [ ] OAuth signin completes in < 8 seconds
- [ ] Profile completion works for both account types
- [ ] Error handling works for users without profiles
- [ ] Console logs are clean (no red errors)
- [ ] SessionStorage shows correct OAuth data
- [ ] Edge functions create profiles successfully

---

## Reporting Results

For each test, document:

1. **Test Name**: (e.g., "Buyer OAuth Signup")
2. **Result**: PASS / FAIL
3. **Duration**: (e.g., "10.2 seconds")
4. **Errors**: (copy any error messages)
5. **Console Logs**: (copy relevant logs)
6. **Screenshots**: (if any errors)

**Format**:
```
TEST: Buyer OAuth Signup
RESULT: ✅ PASS
DURATION: 10.2 seconds
NOTES: Profile created successfully, redirected to dashboard
ERRORS: None
```

---

## Next Steps After Testing

1. If all tests pass: Ready for production deployment
2. If some tests fail: Report failures and I'll help fix
3. Run automated tests: `node test-auth-flows.js`
4. Verify database: `node test-database-verification.js`
5. Check edge functions: `node test-edge-functions.js`
