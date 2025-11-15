# Dashboard Authentication Testing Guide

**Last Updated**: 2025-11-15
**Status**: Active Testing
**Environment**: Local Development (http://localhost:8082)

---

## Code Review Summary

### Issues Found: 17 Total

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Need immediate fix |
| 🟠 High | 4 | Fix soon |
| 🟡 Medium | 7 | Plan for next sprint |
| ⚪ Low | 3 | Technical debt |

### Critical Issues

**1. OAuth Callback URL Parameters (CRITICAL)**
- **File**: `SigninForm.tsx:117`
- **Issue**: Using URL parameters in OAuth callback violates CLAUDE.md documentation
- **Current Code**:
  ```typescript
  const callbackUrl = `${baseUrl}/auth/callback?account_type=${accountType}&flow=signin`;
  ```
- **Fix Required**: Remove URL parameters, use sessionStorage only
- **Risk**: Security vulnerabilities, OAuth state conflicts

**2. Potential XSS in Error Display**
- **File**: `SignupFormContainer.tsx:599-602`
- **Issue**: Unsanitized error messages rendered directly
- **Risk**: Cross-site scripting attacks

**3. Password Regex Escaping Issue**
- **File**: `BuyerSignupForm.tsx:47`
- **Issue**: Special character validation may not work correctly
- **Risk**: Weak password acceptance

---

## Manual Testing Checklist

### Test Environment Setup

**Prerequisites**:
- [ ] Dashboard dev server running: `npm run dev:dashboard`
- [ ] Supabase local instance OR production instance accessible
- [ ] Test email accounts prepared:
  - Valid test email (e.g., `test+buyer1@gmail.com`)
  - Blocked domain email (e.g., `test@dadble.com`)
  - Already registered email
- [ ] OAuth providers configured (Google, LinkedIn)
- [ ] Browser DevTools open (Console + Network tabs)

**URLs**:
- Local: http://localhost:8082
- Staging: https://dashboard-v2.kstorybridge.com
- Production: https://dashboard.kstorybridge.com

---

## Test Suite 1: Email/Password Signup

### Test 1.1: Successful Buyer Signup ✅

**Steps**:
1. Navigate to http://localhost:8082/signup/buyer
2. Fill in form:
   - Email: `test+buyer[timestamp]@gmail.com`
   - Password: `TestPass123!@#`
   - Full Name: `Test Buyer`
   - Company: `Test Company Inc.`
   - Role: `Producer`
   - LinkedIn: (optional)
3. Click "Create Account"

**Expected Result**:
- ✅ Loading state shows "Creating account..."
- ✅ Success toast: "Account created successfully"
- ✅ Email verification prompt appears
- ✅ Database check: `user_buyers` record created with tier='basic'
- ✅ Welcome email sent to inbox
- ✅ Slack notification sent (if configured)

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

**Console Logs to Check**:
```
🔄 Creating buyer profile...
✅ Buyer profile created successfully
✅ Welcome email sent
✅ Slack notification sent
```

---

### Test 1.2: Duplicate Email Registration 🔄

**Steps**:
1. Navigate to /signup/buyer
2. Use email from Test 1.1 (already registered)
3. Fill in valid form data
4. Click "Create Account"

**Expected Result**:
- ✅ Error toast: "Email already registered" or "User already registered"
- ✅ Form remains on signup page
- ✅ No duplicate database record created

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.3: Weak Password Validation ⚠️

**Test Cases**:

| Test Case | Password | Expected Error |
|-----------|----------|----------------|
| Too short | `Test1!` | "Password must be at least 8 characters" |
| No uppercase | `testpass123!` | "Password must contain at least one uppercase letter" |
| No lowercase | `TESTPASS123!` | "Password must contain at least one lowercase letter" |
| No number | `TestPassword!` | "Password must contain at least one number" |
| No special char | `TestPassword123` | "Password must contain at least one special character" |

**Steps for each**:
1. Enter password in password field
2. Click outside field (blur event)

**Actual Results**:
- [ ] All validations pass correctly
- [ ] Some validations fail - Details: _______________

---

### Test 1.4: Blocked Email Domain 🚫

**Steps**:
1. Navigate to /signup/buyer
2. Use email: `test@dadble.com` (blocked admin domain)
3. Fill valid form data
4. Click "Create Account"

**Expected Result**:
- ✅ Error message: "This email domain is not allowed for buyer accounts"
- ✅ Red alert box appears
- ✅ No signup allowed

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 1.5: Email Format Validation 📧

**Test Cases**:

| Email | Expected |
|-------|----------|
| `plaintext` | Invalid |
| `@domain.com` | Invalid |
| `test@` | Invalid |
| `test@domain` | Invalid |
| `test@domain.com` | Valid ✅ |
| `test+tag@domain.com` | Valid ✅ |

**Actual Results**:
- [ ] All validations work correctly
- [ ] Some fail - Details: _______________

---

## Test Suite 2: OAuth Signup (First-Time Users)

### Test 2.1: Google OAuth Signup - First Time ✅

**Steps**:
1. Clear browser cookies/session
2. Navigate to /signup/buyer
3. Click "Continue with Google"
4. Authorize with Google account (NOT previously registered)
5. Wait for redirect to /signup/buyer
6. Complete profile form:
   - Email: (pre-filled from Google, read-only)
   - Full Name: (pre-filled from Google)
   - Company: `Test Google Company`
   - Role: `Executive`
   - LinkedIn: (optional)
7. Click "Complete Profile"

**Expected Result**:
- ✅ Google authorization popup appears
- ✅ After auth, redirected to /signup/buyer
- ✅ Email field pre-filled and read-only
- ✅ Password field NOT shown (OAuth user)
- ✅ Profile creation succeeds
- ✅ `user_buyers` record created with tier='basic'
- ✅ Redirect to /buyers/chat
- ✅ SessionStorage cleared: `oauth_signup_complete`, `oauth_user_id`

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

**Console Logs to Check**:
```
📝 OAuth signup initiated
✅ OAuth code exchange successful
🔄 Completing OAuth buyer profile
✅ Profile created successfully
🧹 Cleared OAuth completion sessionStorage
```

---

### Test 2.2: LinkedIn OAuth Signup - First Time ✅

**Steps**: (Same as Test 2.1 but with LinkedIn)

**Expected Result**: Same as Test 2.1

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.3: OAuth Profile Completion Timeout ⏱️

**Steps**:
1. Start OAuth signup flow
2. Get to profile completion page
3. **Simulate slow network**:
   - Open DevTools → Network tab
   - Set throttling to "Slow 3G"
4. Submit profile form
5. Wait for 30-second timeout

**Expected Result**:
- ✅ Loading spinner shows for 30 seconds
- ✅ Timeout error toast appears
- ✅ Error message suggests retry or signin
- ✅ Check database: profile might exist despite error

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 2.4: OAuth Interrupted Flow (Edge Case) 🔄

**Steps**:
1. Start OAuth signup
2. Click Google authorization
3. **Close authorization popup** before completing
4. Return to /signup/buyer
5. Try OAuth signup again

**Expected Result**:
- ✅ No errors from previous attempt
- ✅ Fresh OAuth flow starts
- ✅ SessionStorage cleaned properly

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Test Suite 3: Email/Password Signin

### Test 3.1: Successful Signin with Verified Email ✅

**Steps**:
1. Navigate to /signin
2. Enter credentials from Test 1.1
3. Verify email first (check inbox, click link)
4. Return to /signin
5. Enter email + password
6. Click "Sign In"

**Expected Result**:
- ✅ Loading state shows "Signing in..."
- ✅ Redirect to /buyers/chat
- ✅ User data available in useAuth hook
- ✅ Session persists (refresh page stays logged in)

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.2: Signin with Unverified Email ⚠️

**Steps**:
1. Create new account (Test 1.1 flow)
2. **DO NOT verify email**
3. Navigate to /signin
4. Enter email + password
5. Click "Sign In"

**Expected Result**:
- ✅ Error message: "Please verify your email address"
- ✅ Option to resend verification email
- ✅ No access to dashboard

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.3: Invalid Password 🔒

**Steps**:
1. Navigate to /signin
2. Enter valid email
3. Enter wrong password: `WrongPassword123!`
4. Click "Sign In"

**Expected Result**:
- ✅ Error toast: "Invalid email or password"
- ✅ Form remains on signin page
- ✅ Password field cleared

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 3.4: Non-Existent Email 📭

**Steps**:
1. Navigate to /signin
2. Enter email: `nonexistent@test.com`
3. Enter any password
4. Click "Sign In"

**Expected Result**:
- ✅ Error toast: "Invalid email or password"
- ✅ Same error as wrong password (security best practice - don't reveal if email exists)

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Test Suite 4: OAuth Signin (Existing Users)

### Test 4.1: Google OAuth - Existing Profile ✅

**Steps**:
1. Use Google account that completed signup in Test 2.1
2. Navigate to /signin
3. Click "Continue with Google"
4. Authorize (already authorized, should be instant)

**Expected Result**:
- ✅ No profile completion page
- ✅ **Direct redirect to /buyers/chat**
- ✅ User authenticated immediately
- ✅ Profile data loaded correctly

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

**Console Logs to Check**:
```
✅ OAuth signin successful
✅ Profile exists - redirecting to dashboard
```

---

### Test 4.2: Google OAuth - No Profile (Edge Case) 🔄

**Steps**:
1. Use Google account NOT previously registered
2. Navigate to **/signin** (not /signup)
3. Click "Continue with Google"

**Expected Result**:
- ✅ OAuth callback detects no profile
- ✅ Redirect to /signup/buyer for profile completion
- ✅ SessionStorage set: `oauth_flow='signin'`

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

**Note**: This tests the auto-redirect behavior mentioned in code review findings.

---

## Test Suite 5: Password Reset Flow

### Test 5.1: Request Password Reset ✅

**Steps**:
1. Navigate to /signin
2. Click "Forgot Password?"
3. Enter registered email
4. Click "Send Reset Link"

**Expected Result**:
- ✅ Success message: "Password reset email sent"
- ✅ Email arrives with reset link
- ✅ No error if email doesn't exist (security)

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 5.2: Complete Password Reset 🔄

**Steps**:
1. Complete Test 5.1
2. Open email, click reset link
3. Enter new password: `NewPass123!@#`
4. Confirm password
5. Submit

**Expected Result**:
- ✅ Success message: "Password updated"
- ✅ Redirect to /signin
- ✅ Can signin with new password
- ✅ Old password no longer works

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Test Suite 6: Edge Cases & Security

### Test 6.1: Rapid Form Submission (Race Condition) ⚡

**Steps**:
1. Navigate to /signup/buyer
2. Fill valid form
3. **Rapidly click "Create Account" 5 times**

**Expected Result**:
- ✅ Button disabled after first click
- ✅ Only ONE signup request sent
- ✅ No duplicate database records
- ✅ Loading state prevents multiple submissions

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.2: XSS in Error Messages 🔒

**Steps**:
1. Navigate to /signup/buyer
2. Enter email: `<script>alert('XSS')</script>@test.com`
3. Submit form

**Expected Result**:
- ✅ Script NOT executed
- ✅ Error message sanitized
- ✅ No alert popup appears

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.3: SQL Injection in Email Field 🔒

**Steps**:
1. Navigate to /signup/buyer
2. Enter email: `admin' OR '1'='1@test.com`
3. Submit form

**Expected Result**:
- ✅ Treated as invalid email format
- ✅ No database error
- ✅ Proper validation error shown

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.4: Session Persistence After Page Refresh 🔄

**Steps**:
1. Sign in successfully (Test 3.1)
2. Verify at /buyers/chat
3. **Refresh page (F5)**
4. Wait 2 seconds

**Expected Result**:
- ✅ User remains logged in
- ✅ No redirect to /signin
- ✅ User data still available

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 6.5: SessionStorage Cleared Mid-OAuth 🧹

**Steps**:
1. Start OAuth signup
2. After Google redirect, pause at profile completion page
3. Open DevTools → Application → Session Storage
4. **Delete all oauth_* keys**
5. Submit profile form

**Expected Result**:
- ✅ Graceful error handling
- ✅ User redirected to signup or signin
- ✅ Clear error message

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Test Suite 7: Multi-Environment Testing

### Test 7.1: Localhost OAuth Callback ✅

**Environment**: http://localhost:8082
**Expected Callback**: `http://localhost:8082/auth/callback`

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.2: Staging OAuth Callback ✅

**Environment**: https://dashboard-v2.kstorybridge.com
**Expected Callback**: `https://dashboard-v2.kstorybridge.com/auth/callback`

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

### Test 7.3: Production OAuth Callback ✅

**Environment**: https://dashboard.kstorybridge.com
**Expected Callback**: `https://dashboard.kstorybridge.com/auth/callback`

**Actual Result**:
- [ ] Pass
- [ ] Fail - Details: _______________

---

## Database Verification Checklist

After each successful signup, verify in Supabase:

**`auth.users` table**:
- [ ] Record created with correct email
- [ ] `email_confirmed_at` is NULL (before verification)
- [ ] `email_confirmed_at` populated (after verification)
- [ ] `user_metadata` contains `account_type: 'buyer'`

**`user_buyers` table**:
- [ ] Record created with matching `id` from `auth.users`
- [ ] Email lowercased
- [ ] `tier` = 'basic' (default)
- [ ] `requested` = false
- [ ] `created_at` timestamp correct
- [ ] All required fields populated

**`email_logs` table** (if exists):
- [ ] Welcome email logged
- [ ] No duplicate email logs

---

## Console Log Checklist

Expected logs for successful signup:

```
✅ EXPECTED CONSOLE LOGS

[Signup Form]
🔄 Creating buyer profile...
📧 Email: test@example.com
👤 Name: Test Buyer

[Signup Service]
🔄 Starting buyer signup process
✅ Signup successful
🔄 Sending welcome email...
✅ Welcome email sent
🔄 Sending Slack notification...
✅ Slack notification sent

[Auth Service]
✅ Session established
✅ User metadata updated: account_type=buyer
```

---

## Error Log Checklist

Common errors to watch for:

```
❌ ERRORS TO INVESTIGATE

1. "Foreign key constraint violation"
   → OAuth race condition, profile created before auth.users

2. "Email already exists"
   → Expected for duplicate signup (normal)

3. "Profile creation timeout"
   → Network issue or edge function slow

4. "Session not found"
   → OAuth callback failed

5. "Metadata update failed"
   → Non-blocking, should proceed anyway
```

---

## Performance Benchmarks

| Operation | Expected Time | Acceptable Max |
|-----------|---------------|----------------|
| Email signup | 1-2 seconds | 5 seconds |
| OAuth signup | 2-4 seconds | 10 seconds |
| Profile completion | 1-2 seconds | 30 seconds |
| Email signin | 0.5-1 second | 3 seconds |
| OAuth signin (existing) | 1-2 seconds | 5 seconds |

---

## Test Results Summary

**Date**: _______________
**Tester**: _______________
**Environment**: _______________

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| Suite 1: Email/Password Signup | 5 | | | |
| Suite 2: OAuth Signup | 4 | | | |
| Suite 3: Email/Password Signin | 4 | | | |
| Suite 4: OAuth Signin | 2 | | | |
| Suite 5: Password Reset | 2 | | | |
| Suite 6: Edge Cases & Security | 5 | | | |
| Suite 7: Multi-Environment | 3 | | | |
| **TOTAL** | **25** | | | |

**Overall Pass Rate**: _____ %

---

## Critical Bugs Found

| Bug ID | Severity | Description | File | Status |
|--------|----------|-------------|------|--------|
| BUG-001 | Critical | OAuth URL parameters violate docs | SigninForm.tsx:117 | Open |
| BUG-002 | High | XSS in error messages | SignupFormContainer.tsx:599 | Open |
| BUG-003 | Medium | Password regex issue | BuyerSignupForm.tsx:47 | Open |

---

## Recommendations

1. **Fix critical security issues** before deploying to production
2. **Implement rate limiting** for auth endpoints
3. **Add automated tests** for regression prevention
4. **Improve error messages** for better UX
5. **Add monitoring/alerting** for auth failures

---

## Next Steps

- [ ] Complete all manual tests
- [ ] Document bugs in GitHub Issues
- [ ] Create fixes for critical issues
- [ ] Re-test after fixes
- [ ] Deploy to staging for QA
- [ ] Production deployment approval

---

**Generated by**: Claude Code
**Review Status**: Pending Testing
