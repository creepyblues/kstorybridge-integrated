# KStoryBridge Authentication Process - Complete Guide

## Overview
This document provides a comprehensive reference for KStoryBridge's complete authentication system, including all signup and login flows, potential issues, and user experience considerations.

**Last Updated:** August 23, 2025  
**Status:** ✅ Current and Complete  

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Account Types](#user-account-types)
3. [Signup Flows](#signup-flows)
4. [Login Flows](#login-flows)
5. [Password Reset Process](#password-reset-process)
6. [Database Schema](#database-schema)
7. [Routing & Redirections](#routing--redirections)
8. [Error Handling](#error-handling)
9. [UX Issues & Inconsistencies](#ux-issues--inconsistencies)
10. [Testing Scenarios](#testing-scenarios)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Architecture

### Core Components

**Frontend Pages:**
- `/signup` → Auto-redirects to `/signup/buyer`
- `/signup/buyer` → Buyer signup with work email validation
- `/signup/creator` → Creator signup (any email allowed)
- `/signin` → Universal login page
- `/forgot-password` → Password reset request
- `/reset-password` → Password reset completion
- `/auth/callback` → OAuth callback handler
- `/invited` → Buyer pending approval page
- `/creator/invited` → Creator pending approval page

**Backend (Supabase):**
- **Authentication:** Email/password + Google OAuth
- **Database Tables:** `user_buyers`, `user_ipowners`  
- **Triggers:** Auto-profile creation on signup
- **Storage:** User sessions and metadata

**Cross-Domain Setup:**
- **Website:** `kstorybridge.com` (production), `localhost:5173` (dev)
- **Dashboard:** `dashboard.kstorybridge.com` (production), `localhost:8081` (dev)
- **Session Transfer:** URL parameters with tokens

---

## User Account Types

### 1. Buyer Accounts
**Purpose:** Media buyers, producers, executives looking for Korean IP content

**Email Restrictions:** ✅ Work emails only (personal domains blocked)
- **Blocked Domains:** gmail.com, yahoo.com, hotmail.com, outlook.com, aol.com, icloud.com, etc.
- **Validation:** Applied in both email signup and OAuth flows

**Default Tier:** `basic` (changed from `invited` on 2025-08-16)
- `invited` → Requires admin approval
- `basic` → Standard access (default for new signups)
- `pro` → Premium features
- `suite` → Full access

**Required Fields:**
- Full Name ✅
- Work Email ✅  
- Password ✅ (email signup only)
- Company ✅
- Role (optional)
- LinkedIn URL (optional)

### 2. Creator/IP Owner Accounts
**Purpose:** Korean content creators, authors, agents showcasing IP

**Email Restrictions:** ❌ None (any email allowed including personal)

**Default Status:** `invited` (requires admin approval)

**Required Fields:**
- Full Name ✅
- Email ✅
- Password ✅ (email signup only)
- Pen Name (optional)
- Role (optional: author, agent)
- Company/Agency (optional)
- Website URL (optional)

---

## Signup Flows

### Email/Password Signup Flow

#### 1. Buyer Email Signup
```
1. User visits /signup/buyer
2. Fills form with work email + company details
3. Email domain validation (blocks personal emails)
4. Supabase.auth.signUp() with metadata
5. Database trigger creates user_buyers record (tier: 'basic')
6. Email verification sent
7. Redirect to /signin with verification reminder
8. User verifies email → can sign in
```

**Key Files:**
- `SignupForm.tsx` - Main signup form component
- `BuyerSignupPage.tsx` - Buyer signup page wrapper
- Database trigger: `handle_new_user_routing()` in migrations

#### 2. Creator Email Signup  
```
1. User visits /signup/creator
2. Fills form (any email allowed)
3. Supabase.auth.signUp() with metadata
4. Database trigger creates user_ipowners record (invitation_status: 'invited')
5. Email verification sent
6. Redirect to /signin with verification reminder
7. User verifies email → signs in → redirected to /creator/invited
```

### Google OAuth Signup Flow

#### 1. OAuth Initiation
```
1. User clicks "Continue with Google"
2. Redirects to Google OAuth with account_type parameter
3. Google authentication
4. Redirect to /auth/callback?account_type=buyer|creator
```

#### 2. OAuth Callback Processing (`AuthCallbackPage.tsx`)
```
1. Parse URL parameters for account_type
2. Check for existing profiles in database
3. If profile exists → redirect based on tier/status
4. If no profile → validate email domain (buyers only)
5. Store OAuth data in sessionStorage
6. Redirect to /signup/{type}?complete=true
```

#### 3. OAuth Profile Completion
```
1. SignupForm detects OAuth completion mode
2. Pre-fills email/name from OAuth data
3. User completes additional required fields
4. Direct database insertion (no Supabase auth call)
5. Success → redirect to /signin
```

**Email Validation for OAuth:**
- Buyer OAuth signups validate work email in AuthCallbackPage
- Personal email rejection stored in sessionStorage
- Rejection message shown on signup form

---

## Login Flows

### Email/Password Login (`SigninPage.tsx`)

```
1. User enters email/password
2. Supabase.auth.signInWithPassword()
3. Success → checkInvitationStatusAndRedirect(user)
4. Check user_metadata.account_type or query database
5. Redirect logic:
   - Buyer (tier !== 'invited') → dashboard
   - Buyer (tier === 'invited') → /invited
   - Creator (invitation_status === 'accepted') → dashboard  
   - Creator (invitation_status !== 'accepted') → /creator/invited
   - No profile → create basic buyer profile → dashboard
```

### Google OAuth Login
```
1. User clicks "Continue with Google"
2. Same OAuth flow as signup
3. AuthCallbackPage detects existing profile
4. Redirects based on tier/status without profile completion
```

### Cross-Domain Dashboard Redirection
```javascript
const redirectToDashboard = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const dashboardUrl = getDashboardUrl(); // Configurable URL
  const sessionParams = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at?.toString(),
    token_type: session.token_type
  });
  window.location.href = `${dashboardUrl}?${sessionParams.toString()}`;
};
```

**URL Configuration (`config/urls.ts`):**
- Development: `http://localhost:8081`
- Production: `https://dashboard.kstorybridge.com`
- Environment override: `VITE_DASHBOARD_URL`

---

## Password Reset Process

### Complete Flow
```
1. User visits /forgot-password
2. Enters email → Supabase.auth.resetPasswordForEmail()
3. Email sent with reset link containing hash parameters
4. User clicks link → /reset-password#access_token=...&refresh_token=...
5. ResetPasswordPage parses hash parameters
6. Establishes session with tokens
7. User enters new password → Supabase.auth.updateUser()
8. Success → sign out user → redirect to /signin with success message
```

**Key Implementation Details:**
- **Hash Parameters:** Supabase uses URL hash for reset tokens
- **Session Validation:** Must establish session before password update
- **Security:** Clear hash from URL after session establishment
- **UX:** Success message displayed on signin page

**Files:**
- `ForgotPasswordPage.tsx` - Reset request form
- `ResetPasswordPage.tsx` - Password update form with hash handling
- `SigninPage.tsx` - Success message display

---

## Database Schema

### Tables

#### user_buyers
```sql
CREATE TABLE user_buyers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  buyer_company TEXT NOT NULL,
  buyer_role buyer_role, -- enum: producer, executive, agent, etc.
  linkedin_url TEXT,
  tier user_tier DEFAULT 'basic', -- invited, basic, pro, suite
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_ipowners  
```sql
CREATE TABLE user_ipowners (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  pen_name TEXT,
  ip_owner_role ip_owner_role, -- enum: author, agent
  ip_owner_company TEXT,
  website_url TEXT,
  invitation_status TEXT DEFAULT 'invited', -- invited, accepted
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Triggers
**`handle_new_user_routing()`** - Automatically creates profile records when users sign up via email/password based on metadata.

### Enums
```sql
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');
CREATE TYPE buyer_role AS ENUM ('producer', 'executive', 'agent', 'content_scout', 'other');
CREATE TYPE ip_owner_role AS ENUM ('author', 'agent');
```

---

## Routing & Redirections

### Route Map
```
/ → HomePage
/signup → /signup/buyer (auto-redirect)
/signup/buyer → BuyerSignupPage  
/signup/creator → CreatorSignupPage
/signin → SigninPage
/forgot-password → ForgotPasswordPage
/reset-password → ResetPasswordPage  
/auth/callback → AuthCallbackPage
/invited → DashboardInvited (buyer pending)
/creator/invited → CreatorInvited (creator pending)
```

### Redirection Logic

**Post-Login Redirections:**
```javascript
// Buyer Logic
if (accountType === 'buyer' || !accountType) {
  if (tier && tier !== 'invited') {
    redirectToDashboard(); // basic, pro, suite
  } else {
    navigate('/invited'); // invited tier
  }
}

// Creator Logic  
if (accountType === 'ip_owner') {
  if (invitation_status === 'accepted') {
    redirectToDashboard();
  } else {
    navigate('/creator/invited'); // pending approval
  }
}
```

**Cross-Domain Session Transfer:**
- Dashboard URL constructed with session parameters
- Tokens passed via URL query string
- Dashboard app processes tokens to establish session

---

## Error Handling

### Signup Errors

**Email Validation Errors:**
- Personal email for buyer → Clear error message + domain restrictions shown
- Invalid email format → "Please enter a valid email address"
- Email already exists → "User with this email already exists"

**OAuth Specific Errors:**
- Personal email rejection stored in sessionStorage
- Rejection alert shown on signup form with dismiss option
- Slack notifications sent for signup failures

**Database Errors:**
- Profile creation failures logged and reported
- Fallback error messages for unexpected issues
- Slack notifications for debugging

### Login Errors

**Visual Error Display:**
- Error alert box above login form
- Dismissible error messages
- Toast notifications for success/error feedback

**Common Error Messages:**
- "Invalid login credentials" → User-friendly "email or password incorrect"
- "Email not confirmed" → Email verification reminder with resend option
- "User not found" → "No account found with this email"

**Session Errors:**
- Dashboard redirect failures → Error toast + retry option
- Missing session data → "Please try signing in again"

### Password Reset Errors

**Reset Request Errors:**
- Invalid email → "Please enter a valid email address"
- Network errors → "Failed to send reset email"

**Reset Completion Errors:**
- Expired token → "Reset link has expired" + new request button
- Invalid session → Redirect to forgot password page
- Password validation → Detailed requirements shown

---

## UX Issues & Inconsistencies

### ⚠️ Identified Issues

#### 1. Inconsistent Work Email Messaging
**Issue:** Different messaging about work email requirements
- Signup form: "Personal email providers are not allowed"
- OAuth rejection: "Personal email addresses are not allowed for buyer accounts"
- Error messages: Inconsistent wording

**Impact:** User confusion about requirements
**Recommendation:** Standardize all messaging to "Please use a work email address. Personal email providers are not allowed for buyer accounts."

#### 2. OAuth Email Validation Timing
**Issue:** Email validation happens after OAuth completion
- User completes Google OAuth
- Gets redirected to signup form  
- Then discovers email is rejected

**Impact:** Poor user experience - rejection after partial success
**Current Status:** ✅ Fixed - validation now happens in AuthCallbackPage before profile completion

#### 3. Default Tier Confusion  
**Issue:** Recent change from 'invited' to 'basic' default tier
- New signups get 'basic' tier (immediate dashboard access)
- Old documentation may reference 'invited' as default
- Mixed expectations about approval process

**Impact:** User confusion about account status
**Recommendation:** Update all documentation and messaging

#### 4. Cross-Domain Session Complexity
**Issue:** Complex URL parameter passing for dashboard access
- Session tokens passed via URL query string
- Long URLs with sensitive information
- Potential for URL manipulation

**Impact:** Security concerns and debugging complexity
**Status:** Functional but could be improved with secure session transfer

#### 5. Password Reset Link Format
**Issue:** Supabase uses hash-based parameters for reset links
- Complex URL parsing required
- Hash parameters not immediately visible to users
- Implementation complexity

**Impact:** Development complexity but user-transparent
**Status:** ✅ Fixed - proper hash parameter handling implemented

### ✅ Resolved Issues

#### 1. Basic Tier Redirection (Fixed 2025-08-22)
**Was:** Users with 'basic' tier redirected to /invited page
**Now:** Basic tier users go directly to dashboard

#### 2. Missing Profile Handling (Fixed 2025-08-22)  
**Was:** Users without profiles caused login failures
**Now:** Creates basic buyer profile for users without account_type

#### 3. Visual Login Error Feedback (Fixed 2025-08-22)
**Was:** Login errors only in console
**Now:** Visual error alerts with dismiss option

---

## Testing Scenarios

### Critical Test Cases

#### Buyer Account Testing
1. **Email Signup - Work Email**
   - Valid work email → Profile created → Email verification → Login → Dashboard
   
2. **Email Signup - Personal Email**  
   - Personal email → Validation error → Clear error message
   
3. **OAuth Signup - Work Email**
   - Google OAuth → Profile completion → Dashboard access
   
4. **OAuth Signup - Personal Email**
   - Google OAuth → Email rejection → Signup form with rejection notice

5. **Login with Different Tiers**
   - Invited tier → /invited page
   - Basic tier → Dashboard  
   - Pro/Suite tier → Dashboard

#### Creator Account Testing
1. **Email Signup - Any Email**
   - Any email allowed → Profile created → Email verification → Login → /creator/invited

2. **OAuth Signup**  
   - Google OAuth → Profile completion → Login → /creator/invited

3. **Approval Status Testing**
   - Invited status → /creator/invited
   - Accepted status → Dashboard

#### Cross-Domain Testing
1. **Session Transfer**
   - Website login → Dashboard access with session
   - Token parameter validation
   - Session establishment in dashboard

2. **URL Configuration**
   - Development environment (localhost ports)
   - Production environment (subdomains)
   - Environment variable overrides

#### Error Scenario Testing
1. **Network Failures**
   - Signup with network error → Proper error handling
   - Login with network error → Error display + retry

2. **Invalid Data**
   - Malformed emails → Validation errors
   - Missing required fields → Clear error messages
   - Database constraint violations → Graceful handling

3. **OAuth Errors**
   - OAuth cancellation → Proper redirect
   - OAuth provider errors → Error display
   - OAuth email mismatches → Clear messaging

### Edge Cases
1. **Existing Users Changing Account Types**
   - User exists as buyer, tries creator signup
   - Account type metadata conflicts

2. **Email Case Sensitivity**
   - Same email with different casing
   - Database lookups with case variations

3. **Session Expiration**
   - Expired sessions during signup process
   - Token refresh during dashboard redirect

4. **Browser Compatibility**
   - Different browsers handling OAuth differently
   - SessionStorage availability and persistence

---

## Troubleshooting Guide

### Common Issues & Solutions

#### "User redirected to /invited instead of dashboard"
**Symptoms:** User with basic/pro/suite tier goes to invited page
**Causes:**
1. Tier checking logic error
2. Missing tier in database  
3. Incorrect account_type metadata

**Debug Steps:**
```javascript
// Check user profile in browser console
const user = await supabase.auth.getUser();
console.log('User metadata:', user.data.user?.user_metadata);

// Check database profile
const { data: profile } = await supabase
  .from('user_buyers')
  .select('*')
  .eq('email', user.data.user?.email);
console.log('Database profile:', profile);
```

**Solutions:**
1. Update tier in database: `UPDATE user_buyers SET tier = 'basic' WHERE email = 'user@example.com'`
2. Check tier validation logic in `checkInvitationStatusAndRedirect`
3. Verify database trigger is working for new signups

#### "OAuth signup fails with personal email"
**Symptoms:** Google signup completes but user sees rejection message
**Causes:**
1. Personal email domain in blocked list
2. User doesn't realize work email requirement

**Debug Steps:**
1. Check `consumerEmailProviders` array in `SignupForm.tsx`
2. Verify email domain validation in `AuthCallbackPage.tsx`  
3. Check sessionStorage for rejection data

**Solutions:**
1. Use work email for buyer accounts
2. Update domain validation logic if needed
3. Clear rejection from sessionStorage: `sessionStorage.removeItem('signupRejection')`

#### "Password reset link doesn't work"  
**Symptoms:** Reset link goes to invalid page or doesn't establish session
**Causes:**
1. Hash parameter parsing issue
2. Expired reset token
3. Session establishment failure

**Debug Steps:**
```javascript
// Check URL hash parameters
console.log('Hash params:', window.location.hash);
const hashParams = new URLSearchParams(window.location.hash.substring(1));
console.log('Access token:', hashParams.get('access_token'));

// Check session establishment  
const { data: session } = await supabase.auth.getSession();
console.log('Current session:', session);
```

**Solutions:**
1. Request new password reset if token expired
2. Check ResetPasswordPage.tsx hash parsing logic
3. Verify email delivery (check spam folder)

#### "Dashboard redirect fails"
**Symptoms:** Login successful but dashboard doesn't load
**Causes:**
1. Incorrect dashboard URL configuration
2. Session parameter issues  
3. Dashboard app not running (development)

**Debug Steps:**
1. Check dashboard URL: `console.log('Dashboard URL:', getDashboardUrl())`
2. Verify session parameters in redirect URL
3. Check dashboard app status (development: http://localhost:8081)

**Solutions:**
1. Set correct `VITE_DASHBOARD_URL` environment variable
2. Start dashboard app: `npm run dev:dashboard`
3. Check session parameter format in redirect URL

### Debugging Tools

#### Browser Console Commands
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log(user);

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log(session);

// Check buyer profile
const { data } = await supabase.from('user_buyers').select('*').eq('email', 'user@example.com');
console.log(data);

// Check creator profile
const { data } = await supabase.from('user_ipowners').select('*').eq('email', 'user@example.com');
console.log(data);
```

#### SessionStorage Inspection
```javascript
// Check OAuth user data
console.log('OAuth user:', sessionStorage.getItem('oauthUser'));

// Check signup rejection data
console.log('Signup rejection:', sessionStorage.getItem('signupRejection'));
```

#### Network Tab Debugging
1. Monitor Supabase API calls (auth, database queries)
2. Check for failed requests and error responses
3. Verify session token format and validity
4. Check redirect URLs and parameters

---

## Maintenance & Updates

### Regular Maintenance Tasks

1. **Monitor Signup Success Rates**
   - Track email validation rejections
   - Monitor OAuth completion rates
   - Review Slack notifications for failures

2. **Database Health Checks**
   - Verify trigger function is working
   - Check for orphaned auth users without profiles
   - Monitor tier distribution

3. **Security Updates**
   - Review blocked email domains list
   - Update session token handling
   - Audit OAuth configuration

### Documentation Updates

**When to Update This Document:**
- New authentication methods added
- Database schema changes
- Routing logic modifications  
- Error handling improvements
- UX/UI changes to auth flows

**Versioning:** Include date and change summary at top of document

---

## Summary

The KStoryBridge authentication system is comprehensive and handles multiple user types with different requirements. The main complexity areas are:

1. **Dual Account Types** with different validation rules
2. **Cross-Domain Session Management** between website and dashboard
3. **OAuth Integration** with email validation
4. **Tier-Based Access Control** with multiple redirection paths

**System Status:** ✅ Functional with recent fixes applied
**Key Strengths:** Robust error handling, flexible URL configuration, comprehensive validation
**Areas for Improvement:** UX consistency, session security, documentation updates

This guide serves as the definitive reference for understanding, debugging, and maintaining the authentication system.