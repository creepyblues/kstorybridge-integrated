# Creator App Authentication Testing Plan

**Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Ready for Testing

---

## Table of Contents

1. [Testing Environment Setup](#testing-environment-setup)
2. [Email Signup Flow](#1-email-signup-flow)
3. [Email Signin Flow](#2-email-signin-flow)
4. [OAuth Signup Flow](#3-oauth-signup-flow)
5. [OAuth Signin Flow](#4-oauth-signin-flow)
6. [Session Management](#5-session-management)
7. [Error Scenarios](#6-error-scenarios)
8. [Security Tests](#7-security-tests)
9. [Multi-Environment Tests](#8-multi-environment-tests)
10. [Edge Function Tests](#9-edge-function-tests)
11. [Email Delivery Tests](#10-email-delivery-tests)

---

## Testing Environment Setup

### Prerequisites

**Test Accounts Needed**:
- [ ] Fresh email address for signup tests (e.g., Gmail with +alias)
- [ ] Existing creator account for signin tests
- [ ] Google account for OAuth tests
- [ ] Access to email inbox for verification

**Environment URLs**:
- **Localhost**: http://localhost:8083
- **Staging**: https://creator-staging.kstorybridge.com
- **Production**: https://creator.kstorybridge.com

**Test Data**:
```javascript
// Email Signup Test Data
{
  email: "testuser+{timestamp}@example.com",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
  full_name: "Test Creator",
  pen_name: "TestPen",
  ip_owner_role: "author",
  ip_owner_company: "Test Studio",
  website_url: "https://example.com"
}
```

**Browser DevTools Setup**:
- [ ] Open DevTools Console (for logs)
- [ ] Open Network Tab (for API calls)
- [ ] Open Application > Local Storage (for session data)
- [ ] Clear localStorage/sessionStorage before each test

**Database Access**:
- [ ] Supabase Dashboard access
- [ ] Ability to query `user_creators` table
- [ ] Ability to query `email_logs` table

---

## 1. Email Signup Flow

### Test Case ES-001: Successful New User Email Signup

**Priority**: P0 (Critical)

**Prerequisites**:
- Fresh email address (never registered before)
- All required fields ready
- Email inbox accessible

**Steps**:
1. Navigate to `/signup`
2. Fill in all required fields:
   - Email: `testuser+{timestamp}@gmail.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Full Name: `Test Creator`
   - Pen Name: `TestPen`
   - Role: `Author`
3. Fill in optional fields:
   - Company: `Test Studio`
   - Website: `https://example.com`
4. Click "Sign Up"
5. Observe loading state
6. Check browser console for logs

**Expected Result**:
- ✅ Success toast: "Account Created! Please check your email to confirm your account."
- ✅ User signed out automatically
- ✅ Redirected to `/signin?from=signup&email={email}`
- ✅ Email verification alert shown on signin page
- ✅ Verification email received in inbox
- ✅ Console logs show:
  ```
  🔐 Starting email signup for: {email}
  ✅ Auth signup successful, user ID: {uuid}
  🚀 Email Signup: Creating creator profile via edge function
  ✅ Email Signup: Creator profile created successfully via edge function
  ✅ Signup successful, showing confirmation message
  ```
- ✅ Database check: New row in `user_creators` with:
  - `id` = user UUID
  - `email` = lowercase normalized email
  - `full_name` = "Test Creator"
  - `pen_name` = "TestPen"
  - `ip_owner_role` = "author"
  - `ip_owner_company` = "Test Studio"
  - `website_url` = "https://example.com"

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-002: Email Verification Link Handling

**Priority**: P0 (Critical)

**Prerequisites**:
- ES-001 completed
- Verification email received

**Steps**:
1. Open email inbox
2. Find "Confirm your email" email from Supabase
3. Click verification link
4. Observe redirect and loading state
5. Check browser console for logs

**Expected Result**:
- ✅ Redirected to `/auth/callback?type=signup&token_hash={hash}...`
- ✅ Loading spinner shown with message "Processing authentication..."
- ✅ Console logs show:
  ```
  🔐 Auth callback: Processing... { isEmailVerification: true, isOAuthFlow: false }
  📧 Email verification flow: Waiting for automatic session...
  ✅ Email verification session found after retry: {email}
  🔍 Profile exists: true | Original flow: null
  📧 Email verification detected, sending welcome email
  ✅ Welcome email sent after email verification
  ✅ Existing user, redirecting to home
  ```
- ✅ Welcome email received in inbox
- ✅ Redirected to `/home`
- ✅ User session active (check localStorage)
- ✅ Database check: `email_logs` table has welcome email record

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-003: Duplicate Email Signup

**Priority**: P1 (High)

**Prerequisites**:
- Existing creator account

**Steps**:
1. Navigate to `/signup`
2. Fill in form with existing email
3. Click "Sign Up"

**Expected Result**:
- ❌ Error message: "User already registered"
- ❌ No database changes
- ❌ No verification email sent
- ✅ Form remains editable
- ✅ User can correct email and retry

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-004: Password Validation

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Fill in email and other fields
3. Enter password: `12345` (too short)
4. Enter confirm password: `12345`
5. Click "Sign Up"

**Expected Result**:
- ❌ Client-side error: "Password must be at least 6 characters"
- ❌ Form not submitted
- ❌ No API calls made

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-005: Password Mismatch

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Fill in email and other fields
3. Enter password: `SecurePass123!`
4. Enter confirm password: `DifferentPass456!`
5. Click "Sign Up"

**Expected Result**:
- ❌ Client-side error: "Passwords do not match"
- ❌ Form not submitted

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-006: Missing Required Fields

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Fill in only email and password
3. Leave full_name, pen_name empty
4. Click "Sign Up"

**Expected Result**:
- ❌ Client-side error: "Please fill in all required fields"
- ❌ Form not submitted

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-007: Invalid Email Format

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Fill in email: `notanemail`
3. Fill in other required fields
4. Click "Sign Up"

**Expected Result**:
- ❌ Browser validation error (HTML5 email input type)
- ❌ OR client-side error: "Invalid email format"
- ❌ Form not submitted

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-008: Invalid Role Selection

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Open browser DevTools Console
3. Run: `document.getElementById('ip_owner_role').value = 'hacker'`
4. Fill in other fields
5. Click "Sign Up"

**Expected Result**:
- ❌ Server error: "Invalid role" (caught by edge function validation)
- ❌ No database changes

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ES-009: Edge Function Failure Handling

**Priority**: P1 (High)

**Prerequisites**:
- Ability to temporarily disable edge function (ask admin)

**Steps**:
1. Navigate to `/signup`
2. Fill in all fields correctly
3. Click "Sign Up" (while edge function is down)

**Expected Result**:
- ❌ Error message displayed to user
- ⚠️ Console warning: "⚠️ Orphaned auth user may exist. User should retry signup with same email."
- ✅ User can retry with same email (Supabase will return "User already exists")

**Actual Result**:
_[To be filled during testing]_

---

## 2. Email Signin Flow

### Test Case ESI-001: Successful Email Signin (Verified Account)

**Priority**: P0 (Critical)

**Prerequisites**:
- Email account created and verified (ES-001, ES-002 completed)

**Steps**:
1. Navigate to `/signin`
2. Enter email
3. Enter password
4. Click "Sign In"

**Expected Result**:
- ✅ Console logs:
  ```
  🔐 Starting email signin for: {email}
  ✅ Signin successful
  ✅ Signin successful, redirecting to home
  ```
- ✅ Redirected to `/home`
- ✅ User session active
- ✅ CMSSidebar shows user name
- ✅ localStorage has session token

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ESI-002: Signin with Wrong Password

**Priority**: P0 (Critical)

**Prerequisites**:
- Valid email account

**Steps**:
1. Navigate to `/signin`
2. Enter correct email
3. Enter wrong password: `WrongPass123!`
4. Click "Sign In"

**Expected Result**:
- ❌ Error message: "Invalid email or password"
- ❌ No session created
- ❌ User remains on `/signin`
- ✅ Form remains editable

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ESI-003: Signin with Unverified Email

**Priority**: P0 (Critical)

**Prerequisites**:
- Email account created but NOT verified (ES-001 only, skip ES-002)

**Steps**:
1. Navigate to `/signin`
2. Enter email (unverified account)
3. Enter password
4. Click "Sign In"

**Expected Result**:
- ❌ Error message: "Please check your email and click the verification link before signing in."
- ✅ Email verification alert shown with:
  - Email address displayed
  - "Resend verification email" button
  - "Dismiss" button
- ❌ No session created

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ESI-004: Resend Verification Email

**Priority**: P1 (High)

**Prerequisites**:
- ESI-003 completed (unverified account signin attempted)

**Steps**:
1. Ensure email verification alert is shown
2. Click "Resend verification email" button
3. Check email inbox

**Expected Result**:
- ✅ Success toast: "Verification email sent. Please check your email for the verification link."
- ✅ Alert dismissed automatically
- ✅ New verification email received
- ✅ Button shows "Sending..." during request

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ESI-005: Signin with Non-Existent Account

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signin`
2. Enter email: `nonexistent@example.com`
3. Enter password: `AnyPassword123!`
4. Click "Sign In"

**Expected Result**:
- ❌ Error message: "Invalid email or password"
- ❌ No session created

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ESI-006: Signin from Signup Redirect

**Priority**: P1 (High)

**Prerequisites**:
- ES-001 completed (just signed up, redirected to signin)

**Steps**:
1. Observe `/signin?from=signup&email={email}` page
2. Verify email pre-filled
3. Verify verification alert shown

**Expected Result**:
- ✅ Email field pre-filled with signup email
- ✅ Amber alert box shown:
  - Title: "Verify Your Email"
  - Message: "We've sent a verification link to {email}."
  - "Resend verification email" button
  - "Dismiss" button

**Actual Result**:
_[To be filled during testing]_

---

## 3. OAuth Signup Flow

### Test Case OS-001: Successful OAuth Signup (New User)

**Priority**: P0 (Critical)

**Prerequisites**:
- Google account NOT previously registered
- Clear browser cache/localStorage

**Steps**:
1. Navigate to `/signup`
2. Click "Sign up with Google" button
3. Observe redirect to Google OAuth
4. Select Google account
5. Grant permissions
6. Observe redirect back to creator app
7. Fill in profile completion form:
   - Full Name: Pre-filled from Google
   - Pen Name: `GoogleTestPen`
   - Role: `Author`
8. Click "Complete Profile"

**Expected Result**:
- ✅ Button shows "Redirecting to Google..."
- ✅ sessionStorage has `oauth_flow: "signup"`
- ✅ Google OAuth consent screen appears
- ✅ Redirected to `/auth/callback?code={code}...`
- ✅ Console logs:
  ```
  🔐 Auth callback: Processing... { isOAuthFlow: true }
  ✅ OAuth session found (automatic exchange): {email}
  🔍 Profile exists: false | Original flow: signup
  📝 New user, redirecting to profile completion
  ```
- ✅ Redirected to `/auth/complete-profile`
- ✅ Full name pre-filled from Google account
- ✅ After form submission:
  ```
  🔐 Completing OAuth profile
  👤 User found: {uuid}
  🚀 Email Signup: Creating creator profile via edge function
  ✅ Email Signup: Creator profile created successfully via edge function
  ✅ Metadata updated successfully
  ✅ Welcome email sent after OAuth profile completion
  ✅ Profile completion successful
  📍 Redirecting to home
  ```
- ✅ Welcome email received
- ✅ Redirected to `/home`
- ✅ Session active
- ✅ Database check: `user_creators` row created with:
  - account_type in metadata = 'creator'

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OS-002: OAuth Signup - Profile Completion Validation

**Priority**: P1 (High)

**Prerequisites**:
- OS-001 steps 1-6 completed (at profile completion form)

**Steps**:
1. At `/auth/complete-profile`
2. Leave pen_name empty
3. Click "Complete Profile"

**Expected Result**:
- ❌ Client-side error: "Please fill in all required fields"
- ❌ Form not submitted

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OS-003: OAuth Signup - Duplicate Google Account

**Priority**: P1 (High)

**Prerequisites**:
- Google account already registered as creator

**Steps**:
1. Navigate to `/signup`
2. Click "Sign up with Google"
3. Select same Google account

**Expected Result**:
- ✅ Google OAuth completes
- ✅ Redirected to `/auth/callback`
- ✅ Console: "🔍 Profile exists: true | Original flow: signup"
- ✅ Redirected to `/home` (treated as signin)
- ✅ No profile completion form shown

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OS-004: OAuth Multi-Environment Redirect URLs

**Priority**: P0 (Critical)

**Prerequisites**:
- Access to all 3 environments

**Steps**:
1. **Localhost Test**:
   - Navigate to `http://localhost:8083/signup`
   - Click "Sign up with Google"
   - Observe redirect URL in Network tab
2. **Staging Test**:
   - Navigate to `https://creator-staging.kstorybridge.com/signup`
   - Click "Sign up with Google"
   - Observe redirect URL
3. **Production Test**:
   - Navigate to `https://creator.kstorybridge.com/signup`
   - Click "Sign up with Google"
   - Observe redirect URL

**Expected Result**:
- ✅ Localhost: `redirectTo: http://localhost:8083/auth/callback`
- ✅ Staging: `redirectTo: https://creator-staging.kstorybridge.com/auth/callback`
- ✅ Production: `redirectTo: https://creator.kstorybridge.com/auth/callback`
- ✅ Console logs show: "🔗 OAuth redirect URL: {correct_url}"
- ✅ No cross-domain redirects (e.g., staging → production)

**Actual Result**:
_[To be filled during testing]_

---

## 4. OAuth Signin Flow

### Test Case OSI-001: Successful OAuth Signin (Existing User)

**Priority**: P0 (Critical)

**Prerequisites**:
- Google account already registered as creator (OS-001 completed)

**Steps**:
1. Navigate to `/signin`
2. Click "Sign in with Google"
3. Select Google account
4. Observe redirect

**Expected Result**:
- ✅ sessionStorage has `oauth_flow: "signin"`
- ✅ Google OAuth screen appears
- ✅ Redirected to `/auth/callback?code={code}...`
- ✅ Console logs:
  ```
  🔐 Auth callback: Processing... { isOAuthFlow: true }
  ✅ OAuth session found (automatic exchange): {email}
  🔍 Profile exists: true | Original flow: signin
  ✅ Existing user, redirecting to home
  ```
- ✅ Redirected to `/home`
- ✅ Session active
- ✅ NO profile completion form
- ✅ NO welcome email sent (existing user)

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OSI-002: OAuth PKCE Code Exchange (Automatic)

**Priority**: P0 (Critical)

**Prerequisites**:
- Fresh browser session (clear localStorage)

**Steps**:
1. Navigate to `/signin`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. In `/auth/callback`, check localStorage immediately
5. Check console logs

**Expected Result**:
- ✅ localStorage has `sb-dlrnrgcoguxlkkcitlpd-auth-token-creator` with:
  - `code_verifier` (PKCE challenge)
  - Session token after exchange
- ✅ Console logs:
  ```
  🔐 OAuth Callback Debug Info: { storageKey: 'sb-dlrnrgcoguxlkkcitlpd-auth-token-creator', storageContents: 'Present' }
  ✅ OAuth session found (automatic exchange): {email}
  ```
- ✅ NO "🔄 OAuth flow: No automatic session, attempting explicit PKCE exchange..." log (automatic worked)

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OSI-003: OAuth PKCE Code Exchange (Fallback)

**Priority**: P1 (High)

**Prerequisites**:
- Simulated scenario where automatic exchange fails

**Steps**:
1. In browser DevTools, set breakpoint in `AuthCallback.tsx` after line 46
2. Start OAuth signin flow
3. When breakpoint hits, modify localStorage to remove session
4. Resume execution

**Expected Result**:
- ✅ Console logs:
  ```
  🔄 OAuth flow: No automatic session, attempting explicit PKCE exchange...
  ✅ OAuth session established (explicit PKCE exchange): {email}
  ```
- ✅ Session successfully created via fallback
- ✅ User redirected to `/home`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case OSI-004: OAuth Code Exchange Error Handling

**Priority**: P1 (High)

**Prerequisites**:
- Ability to simulate invalid OAuth code

**Steps**:
1. Navigate to `/auth/callback?code=INVALID_CODE&oauth_flow=signin` manually
2. Observe error handling

**Expected Result**:
- ❌ Console error: "❌ OAuth PKCE exchange error: {error}"
- ❌ Error message shown: "Authentication failed: {error message}"
- ✅ Auto-redirect to `/signin` after 3 seconds

**Actual Result**:
_[To be filled during testing]_

---

## 5. Session Management

### Test Case SM-001: Session Persistence Across Page Reloads

**Priority**: P0 (Critical)

**Prerequisites**:
- Signed in user session

**Steps**:
1. Navigate to `/home` (authenticated)
2. Refresh page (F5)
3. Observe loading state
4. Check console logs

**Expected Result**:
- ✅ Console: "🎯 AuthProvider: Initializing"
- ✅ Console: "🎯 Initial session: Found"
- ✅ User remains authenticated
- ✅ No redirect to `/signin`
- ✅ CMSSidebar shows user info

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SM-002: Session Persistence Across Tab Close/Reopen

**Priority**: P1 (High)

**Prerequisites**:
- Signed in user session

**Steps**:
1. Sign in successfully
2. Close browser tab
3. Reopen browser
4. Navigate to `http://localhost:8083/home`

**Expected Result**:
- ✅ User remains authenticated
- ✅ No signin required
- ✅ Session restored from localStorage

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SM-003: Session Expiration Handling

**Priority**: P1 (High)

**Prerequisites**:
- Signed in user session
- Wait for session to expire (or manually expire token)

**Steps**:
1. Sign in successfully
2. Wait for token expiration (default: 1 hour)
3. OR manually modify localStorage token to expired value
4. Navigate to protected route

**Expected Result**:
- ✅ Auto-refresh token if refresh token valid
- ❌ OR redirect to `/signin` if refresh token expired
- ✅ Clear session state

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SM-004: Manual Sign Out

**Priority**: P0 (Critical)

**Prerequisites**:
- Signed in user session

**Steps**:
1. Click user profile/settings in CMSSidebar
2. Click "Sign Out"
3. Check console logs
4. Check localStorage

**Expected Result**:
- ✅ Console: "🔐 Signing out..."
- ✅ Console: "✅ Signed out successfully"
- ✅ localStorage session cleared
- ✅ Redirected to `/signin`
- ✅ Cannot access `/home` without signin

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SM-005: Protected Route Access (Unauthenticated)

**Priority**: P0 (Critical)

**Prerequisites**:
- No active session (signed out)

**Steps**:
1. Clear localStorage
2. Navigate directly to `/home`

**Expected Result**:
- ✅ Redirected to `/signin`
- ❌ No access to protected content

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SM-006: Session State Consistency

**Priority**: P1 (High)

**Prerequisites**:
- Signed in user session

**Steps**:
1. Open browser DevTools > Application > Local Storage
2. Find `sb-dlrnrgcoguxlkkcitlpd-auth-token-creator`
3. Verify session data structure
4. Check user metadata

**Expected Result**:
- ✅ localStorage has valid JSON with:
  - `access_token`
  - `refresh_token`
  - `expires_at`
  - `user` object with:
    - `id`, `email`
    - `user_metadata.account_type = 'creator'`
    - `user_metadata.full_name`

**Actual Result**:
_[To be filled during testing]_

---

## 6. Error Scenarios

### Test Case ER-001: Network Failure During Signup

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Open DevTools > Network
3. Enable "Offline" mode
4. Fill in signup form
5. Click "Sign Up"

**Expected Result**:
- ❌ Error message: "Failed to sign up. Please try again."
- ✅ User can retry when back online
- ✅ Form data preserved

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ER-002: Database Connection Error

**Priority**: P1 (High)

**Prerequisites**:
- Ability to simulate DB error (mock edge function response)

**Steps**:
1. Modify edge function to return database error
2. Attempt signup

**Expected Result**:
- ❌ Error message shown to user
- ❌ Console error logged
- ✅ Graceful failure (no crash)

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ER-003: Edge Function Timeout

**Priority**: P2 (Medium)

**Prerequisites**:
- Ability to delay edge function response

**Steps**:
1. Modify edge function to delay response by 30 seconds
2. Attempt signup
3. Observe timeout handling

**Expected Result**:
- ❌ Timeout error after reasonable wait (10-15s)
- ❌ Error message: "Request timed out. Please try again."
- ✅ User can retry

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ER-004: Invalid OAuth Token

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Navigate to `/auth/callback?token_hash=INVALID_TOKEN`
2. Observe error handling

**Expected Result**:
- ❌ Error shown
- ✅ Redirect to `/signin` after delay

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ER-005: Missing OAuth Code

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Set sessionStorage: `oauth_flow = "signup"`
2. Navigate to `/auth/callback` (no code parameter)
3. Observe error handling

**Expected Result**:
- ❌ Console error: "❌ OAuth flow: No code found in URL and no existing session"
- ❌ Status message: "Invalid authentication request"
- ✅ Redirect to `/signin` after 2 seconds

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ER-006: Session Storage Corruption

**Priority**: P2 (Medium)

**Prerequisites**:
- Signed in session

**Steps**:
1. Open DevTools > Application > Local Storage
2. Corrupt session data: Set `sb-dlrnrgcoguxlkkcitlpd-auth-token-creator` to `"invalid json"`
3. Refresh page

**Expected Result**:
- ✅ Session cleared automatically
- ✅ Redirected to `/signin`
- ✅ No app crash

**Actual Result**:
_[To be filled during testing]_

---

## 7. Security Tests

### Test Case SEC-001: SQL Injection Attempt (Email Field)

**Priority**: P0 (Critical)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Enter email: `test'; DROP TABLE user_creators; --@example.com`
3. Fill in other fields
4. Click "Sign Up"

**Expected Result**:
- ❌ Either validation error OR safe handling
- ❌ NO SQL execution
- ✅ Database tables intact
- ✅ Parameterized queries prevent injection

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-002: XSS Attempt (Name Fields)

**Priority**: P0 (Critical)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Enter full_name: `<script>alert('XSS')</script>`
3. Enter pen_name: `"><img src=x onerror=alert('XSS')>`
4. Complete signup
5. Navigate to `/home` or `/profile`

**Expected Result**:
- ✅ Script tags rendered as text (not executed)
- ✅ Data sanitized on display
- ❌ No alert popup
- ✅ Console shows no XSS errors

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-003: CSRF Protection (OAuth Callback)

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Start OAuth flow from `/signup`
2. During OAuth redirect, check for CSRF token
3. Attempt to replay OAuth callback with same code

**Expected Result**:
- ✅ PKCE code_verifier prevents replay attacks
- ❌ Second attempt fails: "Code already used"

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-004: Redirect URL Validation

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Attempt to initiate OAuth with malicious redirect:
   ```javascript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: 'https://evil.com/steal' }
   })
   ```

**Expected Result**:
- ❌ Supabase rejects redirect URL (not in allowed list)
- ❌ OR forced to use configured redirect URLs only

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-005: Account Enumeration Prevention

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Attempt signin with existing email but wrong password
2. Attempt signin with non-existent email
3. Compare error messages

**Expected Result**:
- ✅ Both return same generic error: "Invalid email or password"
- ❌ NO indication which field is wrong
- ✅ Prevents account enumeration

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-006: Rate Limiting

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Attempt rapid multiple signups with same email (20+ times in 1 minute)
2. Observe rate limiting

**Expected Result**:
- ✅ Supabase/edge function rate limiting kicks in
- ❌ Error: "Too many requests"
- ✅ Temporary block (e.g., 1 minute)

**Actual Result**:
_[To be filled during testing]_

---

### Test Case SEC-007: Password Strength Enforcement

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Navigate to `/signup`
2. Test various weak passwords:
   - `12345` (too short)
   - `password` (common)
   - `123456` (sequential)

**Expected Result**:
- ❌ Client validation: "Password must be at least 6 characters"
- ✅ Future enhancement: Reject common passwords

**Actual Result**:
_[To be filled during testing]_

---

## 8. Multi-Environment Tests

### Test Case ME-001: Localhost Email Signup

**Priority**: P0 (Critical)

**Environment**: http://localhost:8083

**Steps**:
1. Complete email signup flow (ES-001)
2. Verify email contains correct callback URL

**Expected Result**:
- ✅ Verification email callback: `http://localhost:8083/auth/callback?type=signup&...`
- ✅ Welcome email dashboard link: `http://localhost:8083/home`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ME-002: Staging Email Signup

**Priority**: P0 (Critical)

**Environment**: https://creator-staging.kstorybridge.com

**Steps**:
1. Complete email signup flow (ES-001)
2. Verify email contains correct callback URL

**Expected Result**:
- ✅ Verification email callback: `https://creator-staging.kstorybridge.com/auth/callback?type=signup&...`
- ✅ Welcome email dashboard link: `https://creator-staging.kstorybridge.com/home`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ME-003: Production Email Signup

**Priority**: P0 (Critical)

**Environment**: https://creator.kstorybridge.com

**Steps**:
1. Complete email signup flow (ES-001)
2. Verify email contains correct callback URL

**Expected Result**:
- ✅ Verification email callback: `https://creator.kstorybridge.com/auth/callback?type=signup&...`
- ✅ Welcome email dashboard link: `https://creator.kstorybridge.com/home`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ME-004: OAuth Localhost Flow

**Priority**: P0 (Critical)

**Environment**: http://localhost:8083

**Steps**:
1. Complete OAuth signup flow (OS-001)
2. Verify redirect URLs

**Expected Result**:
- ✅ OAuth redirect: `http://localhost:8083/auth/callback?code=...`
- ✅ Console log: "🔗 OAuth redirect URL: http://localhost:8083/auth/callback"

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ME-005: OAuth Staging Flow

**Priority**: P0 (Critical)

**Environment**: https://creator-staging.kstorybridge.com

**Steps**:
1. Complete OAuth signup flow (OS-001)
2. Verify redirect URLs

**Expected Result**:
- ✅ OAuth redirect: `https://creator-staging.kstorybridge.com/auth/callback?code=...`
- ✅ Console log: "🔗 OAuth redirect URL: https://creator-staging.kstorybridge.com/auth/callback"
- ❌ NO cross-domain redirect (e.g., to production)

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ME-006: OAuth Production Flow

**Priority**: P0 (Critical)

**Environment**: https://creator.kstorybridge.com

**Steps**:
1. Complete OAuth signup flow (OS-001)
2. Verify redirect URLs

**Expected Result**:
- ✅ OAuth redirect: `https://creator.kstorybridge.com/auth/callback?code=...`
- ✅ Console log: "🔗 OAuth redirect URL: https://creator.kstorybridge.com/auth/callback"

**Actual Result**:
_[To be filled during testing]_

---

## 9. Edge Function Tests

### Test Case EF-001: Create Creator Profile Success

**Priority**: P0 (Critical)

**Prerequisites**:
- Supabase Function Logs access

**Steps**:
1. Complete email signup (ES-001)
2. Check Supabase Dashboard > Edge Functions > Logs
3. Find `create-creator-profile` invocation

**Expected Result**:
- ✅ Function logs show:
  ```
  ✅ Creator profile created successfully
  User ID: {uuid}
  Email: {email}
  ```
- ✅ HTTP 200 response
- ✅ Response body: `{ success: true, profile: {...} }`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case EF-002: Create Creator Profile Validation Error

**Priority**: P1 (High)

**Prerequisites**:
- Ability to call edge function directly

**Steps**:
1. Call edge function with missing required field:
   ```bash
   curl -X POST https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/create-creator-profile \
     -H "Authorization: Bearer {anon_key}" \
     -H "Content-Type: application/json" \
     -d '{"userId": "test", "email": "test@example.com"}'
   ```

**Expected Result**:
- ❌ HTTP 400 Bad Request
- ❌ Response: `{ error: "Missing required fields" }`

**Actual Result**:
_[To be filled during testing]_

---

### Test Case EF-003: Send Welcome Email Success

**Priority**: P0 (Critical)

**Prerequisites**:
- Email verification completed (ES-002)

**Steps**:
1. Complete email verification
2. Check Supabase Function Logs for `send-email` invocation
3. Check email inbox

**Expected Result**:
- ✅ Function logs show:
  ```
  ✅ Email sent successfully via Resend
  Message ID: {message_id}
  ```
- ✅ Welcome email received within 1 minute
- ✅ Email contains:
  - Subject: "Welcome to KStoryBridge, {full_name}! 🎉"
  - Dashboard link: Correct environment URL
  - Login link: Correct environment URL

**Actual Result**:
_[To be filled during testing]_

---

### Test Case EF-004: Email Deduplication

**Priority**: P1 (High)

**Prerequisites**:
- User already received welcome email

**Steps**:
1. Manually trigger `sendWelcomeEmail()` again for same user
2. Check database `email_logs` table

**Expected Result**:
- ✅ Edge function checks `email_logs` table
- ✅ Duplicate email NOT sent
- ✅ Function returns success but skips sending
- ✅ Console log: "Email already sent to this user"

**Actual Result**:
_[To be filled during testing]_

---

## 10. Email Delivery Tests

### Test Case ED-001: Email Verification Template

**Priority**: P0 (Critical)

**Prerequisites**:
- Email signup completed (ES-001)

**Steps**:
1. Check email inbox
2. Verify "Confirm your email" email content

**Expected Result**:
- ✅ From: Supabase (or configured sender)
- ✅ Subject: "Confirm your email"
- ✅ Body contains:
  - Verification link with correct callback URL
  - Clear call-to-action button
  - No broken images
  - Correct branding

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ED-002: Welcome Email Template

**Priority**: P0 (Critical)

**Prerequisites**:
- Email verification completed (ES-002)

**Steps**:
1. Check email inbox
2. Verify "Welcome to KStoryBridge" email content

**Expected Result**:
- ✅ From: KStoryBridge Team <welcome@kstorybridge.com>
- ✅ Subject: "Welcome to KStoryBridge, {full_name}! 🎉"
- ✅ Body contains:
  - Personalized greeting with full_name
  - Dashboard link (correct environment)
  - Login link (correct environment)
  - Account type: "creator"
  - Professional HTML template
  - No broken images

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ED-003: Email Delivery Timing

**Priority**: P1 (High)

**Prerequisites**: None

**Steps**:
1. Complete email signup (ES-001)
2. Note timestamp
3. Check when verification email arrives
4. Complete verification (ES-002)
5. Note timestamp
6. Check when welcome email arrives

**Expected Result**:
- ✅ Verification email: Arrives within 1-2 minutes
- ✅ Welcome email: Arrives within 1-2 minutes after verification

**Actual Result**:
_[To be filled during testing]_

---

### Test Case ED-004: Email Spam Filter Check

**Priority**: P2 (Medium)

**Prerequisites**: None

**Steps**:
1. Complete signup flow
2. Check email inbox
3. Check Spam/Junk folder

**Expected Result**:
- ✅ Emails arrive in inbox (not spam)
- ✅ SPF/DKIM/DMARC properly configured
- ✅ Sender reputation good

**Actual Result**:
_[To be filled during testing]_

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] All test environments accessible
- [ ] Fresh test email accounts ready
- [ ] Google account for OAuth ready
- [ ] Browser DevTools configured
- [ ] Supabase Dashboard access verified
- [ ] Edge function logs accessible
- [ ] Email inbox monitoring ready

### Testing Sequence

**Phase 1: Email Authentication (P0)**
- [ ] ES-001: Email Signup
- [ ] ES-002: Email Verification
- [ ] ESI-001: Email Signin
- [ ] ESI-003: Unverified Account Signin

**Phase 2: OAuth Authentication (P0)**
- [ ] OS-001: OAuth Signup
- [ ] OSI-001: OAuth Signin
- [ ] OSI-002: OAuth PKCE Automatic
- [ ] OS-004: Multi-Environment Redirects

**Phase 3: Session Management (P0)**
- [ ] SM-001: Page Reload Persistence
- [ ] SM-004: Manual Sign Out
- [ ] SM-005: Protected Route Access

**Phase 4: Error Handling (P1)**
- [ ] ES-003: Duplicate Email
- [ ] ESI-002: Wrong Password
- [ ] ER-001: Network Failure
- [ ] OSI-004: OAuth Code Error

**Phase 5: Security (P0)**
- [ ] SEC-001: SQL Injection
- [ ] SEC-002: XSS Attempt
- [ ] SEC-003: CSRF Protection
- [ ] SEC-007: Password Strength

**Phase 6: Multi-Environment (P0)**
- [ ] ME-001: Localhost Email
- [ ] ME-002: Staging Email
- [ ] ME-003: Production Email
- [ ] ME-004-006: All OAuth Environments

**Phase 7: Edge Functions (P0)**
- [ ] EF-001: Profile Creation
- [ ] EF-003: Welcome Email
- [ ] EF-004: Email Deduplication

**Phase 8: Email Delivery (P0)**
- [ ] ED-001: Verification Template
- [ ] ED-002: Welcome Template
- [ ] ED-003: Delivery Timing

### Post-Testing
- [ ] All P0 tests passed
- [ ] All P1 tests reviewed
- [ ] Critical issues logged
- [ ] Database cleanup (test accounts)
- [ ] Test results documented
- [ ] Next steps identified

---

## Test Results Summary

**Test Execution Date**: _________________
**Tested By**: _________________
**Environment**: _________________

### Results by Priority

| Priority | Total Tests | Passed | Failed | Skipped |
|----------|-------------|--------|--------|---------|
| P0       |             |        |        |         |
| P1       |             |        |        |         |
| P2       |             |        |        |         |
| **Total** |            |        |        |         |

### Critical Issues Found

1. _[Issue description]_
2. _[Issue description]_

### Recommendations

1. _[Recommendation]_
2. _[Recommendation]_

---

## Notes

- All tests assume fresh test data (not previously used emails)
- Database queries require Supabase Dashboard access
- Some tests require admin access to edge function configuration
- Rate limiting tests may temporarily block test accounts
- Production tests should use caution (real user data)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Ready for Testing
