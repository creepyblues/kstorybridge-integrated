# Pre-Launch Testing Plan - KStoryBridge v4.0

**Created**: 2025-10-06
**Version**: 4.0 (AUTH WORKING)
**Git Tag**: auth-working-v4.0
**Status**: Ready for Execution

---

## 📋 Overview

This comprehensive testing plan validates production readiness for the KStoryBridge platform following industry-standard SRE practices (Google SRE Book) combined with application-specific requirements.

### Testing Methodology
- **Priority-Based**: P0 (Blocker) → P1 (High) → P2 (Medium)
- **Phase-Based**: Critical Path → Functional → Production Readiness → Final Checks
- **Mixed Approach**: Automated tests + Manual validation
- **GO/NO-GO Gates**: Decision points after each phase

### Success Metrics
- **Authentication**: 100% success rate, <3s profile creation
- **Performance**: Lighthouse score >80, API response <200ms
- **Security**: No exposed secrets, HTTPS enforced, RLS validated
- **Monitoring**: Four Golden Signals (Latency, Traffic, Errors, Saturation)

---

## PHASE 1: CRITICAL PATH TESTING (P0) ⚠️

**Estimated Time**: 4-6 hours
**Blocker Status**: All tests must pass before proceeding

### 1.1 Authentication System (AUTH WORKING v4.0 Validation)

#### ✅ Test Suite 1A: OAuth Signup (Google) - Buyer

**Environment**: Production (https://dashboard.kstorybridge.com)
**Priority**: P0 - BLOCKER
**Regression Check**: v4.0 fire-and-forget metadata fix

**Manual Test Steps**:
1. Open incognito browser → https://dashboard.kstorybridge.com/signup/buyer
2. Click "Continue with Google"
3. Complete Google OAuth flow (select existing Google account)
4. Verify redirect to profile completion page with pre-filled email
5. Fill out additional fields:
   - Company: [Test Company Name]
   - Role: Select from dropdown (e.g., Producer)
   - LinkedIn: (optional, can leave blank)
6. Click "Complete Profile" button
7. Monitor browser console for log messages

**Success Criteria**:
- ✅ Profile creation completes in <3 seconds (was indefinite hang before v4.0)
- ✅ Console shows: `"✅ OAuth Profile: Edge function succeeded"`
- ✅ Console shows: `"🔄 Updating account_type metadata with existing session..."`
- ✅ Console shows: `"✅ Account type metadata updated successfully"` (may appear after navigation)
- ✅ Redirects to `/buyers/home` immediately after profile creation
- ✅ Dashboard loads successfully with user name displayed
- ✅ NO console errors about "getSession timeout"
- ✅ NO infinite spinner or hanging

**Database Verification** (Supabase Dashboard):
```sql
-- Check user_buyers entry created
SELECT id, email, full_name, buyer_company, tier, created_at
FROM user_buyers
WHERE email = '[test email]';

-- Expected: One row with tier='basic'

-- Check auth.users metadata
SELECT id, email, raw_user_meta_data->>'account_type' as account_type
FROM auth.users
WHERE email = '[test email]';

-- Expected: account_type='buyer'
```

**Edge Function Logs Verification** (Supabase → Functions → create-oauth-profile):
- Look for log pattern:
  ```
  🚀 OAuth Profile: Using secure edge function approach
  ✅ OAuth Profile: Edge function succeeded
  ```

**Rollback Test**: If this fails, entire auth system is broken. Check commit hash matches `e2804417`.

---

#### ✅ Test Suite 1B: OAuth Signup (Google) - Creator

**Environment**: Production
**Priority**: P0 - BLOCKER

**Manual Test Steps**:
1. Open incognito browser → https://dashboard.kstorybridge.com/signup/creator
2. Click "Continue with Google"
3. Complete Google OAuth flow (use DIFFERENT Google account than Test 1A)
4. Verify redirect to profile completion page
5. Fill out creator-specific fields:
   - Pen Name: [Test Pen Name] (REQUIRED)
   - IP Owner Role: Select "Author" or "Agent" (REQUIRED - added 2025-09-21)
   - Company: [Optional]
   - Website: [Optional]
6. Click "Complete Profile"

**Success Criteria**:
- ✅ Same performance as 1A (<3 seconds)
- ✅ Redirects to `/creators/home`
- ✅ Creator dashboard displays correctly
- ✅ Console shows same success pattern

**Database Verification**:
```sql
-- Check user_creators entry created
SELECT id, email, full_name, pen_name, ip_owner_role, invitation_status
FROM user_creators
WHERE email = '[test email]';

-- Expected: One row with invitation_status='invited', ip_owner_role NOT NULL

-- Check auth.users metadata
SELECT raw_user_meta_data->>'account_type' as account_type
FROM auth.users
WHERE email = '[test email]';

-- Expected: account_type='creator'
```

**Critical**: `ip_owner_role` is REQUIRED (breaking change from 2025-09-21). Signup should fail if not provided.

---

#### ✅ Test Suite 1C: Email Signup - Buyer

**Environment**: Production
**Priority**: P0 - BLOCKER

**Manual Test Steps**:
1. Navigate to https://dashboard.kstorybridge.com/signup/buyer
2. Fill form with NEW test email (use format: `test+buyer[timestamp]@yourcompany.com`)
3. **IMPORTANT**: Use WORK email domain (NOT @gmail.com, @yahoo.com, @outlook.com)
   - Consumer email domains are BLOCKED for buyers
   - Use: @company.com, @studio.com, or similar business domain
4. Complete all required fields:
   - Full Name: [Test Buyer Name]
   - Email: [work email]
   - Password: [strong password]
   - Company: [Test Company]
   - Role: Select from dropdown
   - LinkedIn: [optional]
5. Click "Sign Up" button

**Success Criteria**:
- ✅ Form submits successfully
- ✅ Toast notification: "Please check your email to verify your account"
- ✅ Redirects to signin page with verification message
- ✅ Email verification sent to inbox (check within 2 minutes)
- ✅ NO "personal email not allowed" error

**Database Verification**:
```sql
-- Check user_buyers entry created
SELECT id, email, tier, requested, created_at
FROM user_buyers
WHERE email = '[test email]';

-- Expected: tier='basic' (NOT 'invited'), requested=false

-- Check email verification status
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = '[test email]';

-- Expected: email_confirmed_at IS NULL (until user clicks verify link)
```

**Email Verification Test**:
1. Check email inbox (noreply@kstorybridge.com)
2. Click "Verify Email" link
3. Should redirect to `/signin/buyer?verified=true`
4. Complete signin with email/password
5. Should redirect to `/buyers/home`

**Edge Case**: Try signup with @gmail.com - should show error: "Please use your work email address"

---

#### ✅ Test Suite 1D: Email Signup - Creator

**Environment**: Production
**Priority**: P0 - BLOCKER

**Manual Test Steps**:
1. Navigate to https://dashboard.kstorybridge.com/signup/creator
2. Fill form with NEW test email (ANY domain allowed for creators, can use @gmail.com)
3. Complete all required fields:
   - Full Name: [Test Creator Name]
   - Email: [any email]
   - Password: [strong password]
   - Pen Name: [Test Pen Name] (REQUIRED)
   - IP Owner Role: Select "Author" or "Agent" (REQUIRED)
   - Company: [optional]
   - Website: [optional]
4. Click "Sign Up"

**Success Criteria**:
- ✅ Form submits successfully
- ✅ Email verification sent
- ✅ Consumer emails (@gmail.com) ARE allowed for creators
- ✅ Form validation requires Pen Name and IP Owner Role

**Database Verification**:
```sql
SELECT id, email, pen_name, ip_owner_role, invitation_status
FROM user_creators
WHERE email = '[test email]';

-- Expected: invitation_status='invited', ip_owner_role NOT NULL
```

**Note**: `ip_owner_role` became REQUIRED on 2025-09-21. Older signups may have NULL values but new signups must have it.

---

#### ✅ Test Suite 1E: OAuth Signin - Existing User

**Environment**: Production
**Priority**: P0 - BLOCKER
**Regression Check**: Ensure no duplicate profile creation during signin

**Manual Test Steps**:
1. Use Google account that ALREADY completed signup in Test 1A (buyer account)
2. Navigate to https://dashboard.kstorybridge.com/signin
3. Click "Continue with Google"
4. Select the Google account used in Test 1A
5. Monitor console and browser behavior

**Success Criteria**:
- ✅ Immediate redirect to `/buyers/home` (NO profile completion page)
- ✅ No duplicate profiles created in database
- ✅ Session established immediately
- ✅ Console shows NO "getSession timeout" errors
- ✅ User dashboard shows correct data from existing profile
- ✅ Total flow completes in <3 seconds

**Database Verification**:
```sql
-- Verify ONLY ONE profile exists
SELECT COUNT(*) FROM user_buyers WHERE email = '[test email]';
-- Expected: 1 (not 2)

-- Verify ONLY ONE auth.users entry
SELECT COUNT(*) FROM auth.users WHERE email = '[test email]';
-- Expected: 1
```

**Critical Check**: This test validates AUTH_DOCUMENTATION.md RULE 1: NEVER auto-create profiles during signin.

---

#### ✅ Test Suite 1F: Email Signin - Existing User

**Environment**: Production
**Priority**: P0 - BLOCKER

**Manual Test Steps**:
1. Use email/password from verified account (Test 1C after email verification)
2. Navigate to https://dashboard.kstorybridge.com/signin
3. Enter email and password
4. Click "Sign In"

**Success Criteria**:
- ✅ Redirect to correct dashboard based on account_type:
  - Buyers → `/buyers/home`
  - Creators → `/creators/home`
- ✅ Session cookie set (check DevTools → Application → Cookies)
- ✅ No console errors
- ✅ Profile data loads correctly on dashboard

**Edge Case Tests**:
- Wrong password → Shows error: "Invalid credentials"
- Unverified email → Shows: "Please verify your email address"
- Non-existent email → Shows: "Invalid credentials" (don't reveal user existence)

---

### 1.2 Session Management & Persistence

#### ✅ Test Suite 2A: Session Timeout Validation

**Environment**: Production
**Priority**: P0 - BLOCKER
**Regression Check**: v3.6 session passing fix

**Automated Test**:
```bash
# From project root
node apps/dashboard/test-session-management.js
```

**Success Criteria**:
- ✅ NO `getSession timeout after 90 seconds` errors
- ✅ Session resolves in <5 seconds
- ✅ Token refresh works automatically (check console for refresh messages)
- ✅ Session persists across page reloads
- ✅ Test script exits with code 0 (success)

**Manual Verification**:
1. Login to dashboard
2. Wait 5 minutes idle
3. Navigate to different page (e.g., /buyers/titles)
4. Should load instantly without re-authentication

**Console Monitoring**: Watch for these patterns (should NOT appear):
```
❌ getSession failed on attempt 1: {message: 'getSession timeout after 90 seconds'}
❌ Multiple GoTrueClient instances detected
```

---

#### ✅ Test Suite 2B: Cross-Tab Session Sync

**Environment**: Production
**Priority**: P1 - HIGH

**Manual Test**:
1. Login in Tab A → navigate to `/buyers/home`
2. Open new Tab B → navigate to `/buyers/titles` (should auto-authenticate)
3. In Tab A: Click logout button
4. In Tab B: Refresh the page

**Success Criteria**:
- ✅ Tab B redirects to `/signin` after Tab A logout
- ✅ No stale session errors
- ✅ Both tabs sync session state
- ✅ Re-login in one tab authenticates both tabs

**Edge Case**: Open 5+ tabs, logout in one, all should sync logout.

---

#### ✅ Test Suite 2C: Session Expiration Handling

**Environment**: Production
**Priority**: P1 - HIGH

**Manual Test**:
1. Login to dashboard
2. Open browser DevTools → Application → Cookies
3. Delete `sb-access-token` and `sb-refresh-token` cookies (simulates expiration)
4. Try to navigate to a protected page or perform an action

**Success Criteria**:
- ✅ Graceful redirect to `/signin`
- ✅ Toast message: "Session expired, please sign in again"
- ✅ No console errors or blank pages
- ✅ After re-login, returns to intended page (if possible)

**Alternative Method** (if cookies can't be deleted):
1. Login and note session
2. Wait 1 hour (Supabase sessions typically last 1 hour)
3. Try navigation after 1+ hours idle

---

### 1.3 User Flow Validation

#### ✅ Test Suite 3A: Buyer Complete Journey

**Environment**: Production
**Priority**: P0 - BLOCKER
**Duration**: ~10 minutes
**Objective**: Validate end-to-end buyer experience

**Step-by-Step Test**:

1. **Signup** (OAuth or Email - choose one)
   - Complete signup flow from Test 1A or 1C
   - ✅ Verify successful signup

2. **View Profile**
   - Navigate to `/buyers/profile`
   - ✅ Verify all profile data displayed correctly:
     - Full Name
     - Email
     - Company
     - Role
     - LinkedIn URL (if provided)
     - Tier badge showing "Basic"

3. **Browse Titles**
   - Navigate to `/buyers/titles`
   - ✅ Titles load (grid of content cards)
   - ✅ Images display correctly
   - ✅ Genre/format badges visible
   - ✅ Pagination works

4. **View Title Detail**
   - Click any title card
   - ✅ Detail page loads with full information
   - ✅ Synopsis, author, genre, etc. displayed
   - ✅ "Save Title" (heart icon) button visible

5. **Save a Title**
   - Click heart icon on title detail page
   - ✅ Toast notification: "Added to saved titles"
   - ✅ Heart icon changes to filled state

6. **View Saved Titles**
   - Navigate to `/buyers/saved`
   - ✅ Saved title appears in list
   - ✅ Can remove title (click heart again)
   - ✅ Toast: "Removed from saved titles"

7. **Use Chatbot**
   - Navigate to `/buyers/chat`
   - ✅ Chat interface loads
   - Ask: "Show me romantic comedy webtoons"
   - ✅ Response appears in <4 seconds
   - ✅ Response includes title recommendations
   - ✅ Titles are clickable (links to detail pages)
   - ✅ NO hallucinated titles (verify titles exist in database)

8. **Sidebar Navigation**
   - Test all sidebar links:
     - ✅ Home → `/buyers/home`
     - ✅ Title Library → `/buyers/titles`
     - ✅ Saved Titles → `/buyers/saved`
     - ✅ AI Chat → `/buyers/chat`
     - ✅ Profile → `/buyers/profile`
   - All pages load without errors

9. **Logout**
   - Click logout button (top right or sidebar)
   - ✅ Redirects to signin page
   - ✅ Session cleared

10. **Signin Again**
    - Re-login with same credentials
    - ✅ Dashboard loads
    - ✅ Saved titles still present (data persisted)
    - ✅ Profile data unchanged

**Overall Success Criteria**:
- ✅ Zero console errors throughout journey
- ✅ All pages load in <3 seconds
- ✅ Data persists across sessions
- ✅ No broken images or links

---

#### ✅ Test Suite 3B: Creator Complete Journey

**Environment**: Production
**Priority**: P0 - BLOCKER
**Duration**: ~5 minutes

**Step-by-Step Test**:

1. **Signup** (OAuth or Email)
   - Complete creator signup from Test 1B or 1D
   - ✅ Verify successful signup

2. **View Dashboard**
   - Navigate to `/creators/home`
   - ✅ Creator dashboard displays
   - ✅ Welcome message or overview content

3. **Browse Creator Titles**
   - Navigate to `/creators/titles`
   - ✅ Titles page loads
   - ✅ May be empty for new creator (expected)

4. **View Profile**
   - Navigate to `/creators/profile`
   - ✅ Profile data displayed:
     - Full Name
     - Email
     - Pen Name
     - IP Owner Role
     - Company (if provided)
     - Website (if provided)
     - Invitation Status

5. **Update Profile**
   - Edit Pen Name (change to "Updated Pen Name")
   - Click "Save" button
   - ✅ Toast: "Profile updated successfully"
   - ✅ Changes persist (refresh page, verify pen name updated)

6. **Logout and Re-login**
   - Logout
   - Re-login with same credentials
   - ✅ Navigate to profile
   - ✅ Updated pen name still present

**Overall Success Criteria**:
- ✅ All creator pages accessible
- ✅ Profile updates persist
- ✅ Invitation status visible in profile
- ✅ No access to buyer-only features

---

## PHASE 2: FUNCTIONAL TESTING (P1) 🔧

**Estimated Time**: 4-6 hours
**Status**: All P1 tests should pass

### 2.1 Chatbot System (AI Chat Orchestrator)

#### ✅ Test Suite 4A: Chatbot Phase 1 & 2 Improvements

**Environment**: Production Edge Functions
**Priority**: P1 - HIGH
**Reference**: apps/dashboard/CHATBOT_TEST_RESULTS.md

**Automated Test**:
```bash
# Step 1: Get authentication token
cd apps/dashboard
node get-auth-token.js
# Follow prompts to get token

# Step 2: Run chatbot test suite
SUPABASE_AUTH_TOKEN="<paste token here>" node test-chatbot-improvements.js
```

**Success Criteria (6/6 tests must pass)**:
- ✅ **Test 1: Vector Search Increase** - Returns 10 results (not 5)
- ✅ **Test 2: Anti-Hallucination Validation** - Catches fake title names
- ✅ **Test 3: Fuzzy Title Matching** - 80% similarity threshold works
- ✅ **Test 4: Intent Classification** - Correctly identifies 5 intent types
- ✅ **Test 5: Context Weighting** - Prioritizes recent messages
- ✅ **Test 6: Fallback Keyword Search** - Triggers when vector search fails

**Expected Output**:
```
✅ Test 1 PASSED: Vector search returns 10 results
✅ Test 2 PASSED: Anti-hallucination detected fake titles
✅ Test 3 PASSED: Fuzzy matching found similar title
✅ Test 4 PASSED: Intent classification accurate
✅ Test 5 PASSED: Context weighting working
✅ Test 6 PASSED: Fallback search triggered

FINAL RESULT: 6/6 Tests PASSED ✅
```

**Performance Targets**:
- Response time: <4 seconds
- Search results: 10 titles per query
- Hallucination rate: <5%
- Link success rate: >80%

---

#### ✅ Test Suite 4B: Chatbot Edge Cases

**Environment**: Production (browser at /buyers/chat)
**Priority**: P1 - HIGH

**Manual Browser Tests**:

**Test 1: Normal Query**
```
Input: "Show me titles about love"
Expected:
- 10 romantic titles returned
- NO hallucinated titles (all titles exist in database)
- Response time <4 seconds
- Clickable title links
```

**Test 2: Fuzzy Match Query**
```
Input: "Find action webtoons like Solo Leveling"
Expected:
- Action/fantasy titles recommended
- Fuzzy matching on "Solo Leveling" (if title exists with slight variation)
- Console logs show similarity scores
```

**Test 3: Empty Query**
```
Input: "" (submit empty chat)
Expected:
- Error message displayed: "Please enter a message"
- No crash or edge function call
```

**Test 4: Very Long Query**
```
Input: [500+ character query with detailed requirements]
Expected:
- Query processed (may be truncated)
- Response returned without crash
- NO edge function timeout
```

**Test 5: Special Characters**
```
Input: "Find titles with 'love' & hope! @#$%"
Expected:
- Query sanitized
- Results returned (special chars ignored)
- No SQL injection or errors
```

**Test 6: No Results Query**
```
Input: "Show me titles about quantum physics in space"
Expected:
- Fallback keyword search triggers
- Polite response: "I couldn't find exact matches, but here are related titles..."
- OR: "No titles found matching that description"
```

**Edge Function Logs Verification**:
- Navigate to: Supabase Dashboard → Functions → chat-orchestrator → Logs
- Check for recent invocations (should see your test queries)
- Verify no ERROR level logs
- Look for patterns:
  ```
  ✅ Vector Search Results: { resultCount: 10, ... }
  ⚠️ Title hallucinations detected: { count: 0 }
  ```

---

### 2.2 Database & Edge Functions

#### ✅ Test Suite 5A: Edge Function Health Check

**Environment**: Supabase Dashboard
**Priority**: P0 - BLOCKER

**Manual Verification Steps**:

1. Navigate to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

2. Verify ALL functions are deployed and healthy:
   - ✅ **chat-orchestrator** - AI chatbot queries
   - ✅ **create-oauth-profile** - OAuth profile creation (NEW v4.0)
   - ✅ **create-buyer-profile** - Fallback buyer profile creation
   - ✅ **create-creator-profile** - Fallback creator profile creation
   - ✅ **send-email** - Welcome emails
   - ✅ **stripe-webhook** - Payment webhooks
   - ✅ **create-checkout-session** - Stripe checkout
   - ✅ **create-billing-portal** - Stripe billing portal
   - ✅ **cancel-subscription** - Stripe cancellation

3. For each function, click to view details:
   - ✅ Status shows "Healthy" or "Active"
   - ✅ No deployment errors in logs
   - ✅ Recent invocations visible (within last 24 hours)

4. Check recent logs (click any function → Logs tab):
   - ✅ Successful executions (200 status codes)
   - ✅ No recurring 500 errors
   - ✅ Execution times reasonable (<5 seconds for most)

**Red Flags** (immediate investigation needed):
- ❌ Any function showing "Error" or "Failed" status
- ❌ 500 errors in last 24 hours
- ❌ No recent invocations (could indicate function not being called)

---

#### ✅ Test Suite 5B: RLS Policy Validation

**Environment**: Local or Production
**Priority**: P0 - BLOCKER (Security Critical)

**Automated Test**:
```bash
node apps/dashboard/test-rls-policies.js
```

**Success Criteria**:
- ✅ Users can ONLY access their own profiles (not other users')
- ✅ Buyer users can't read `user_creators` data
- ✅ Creator users can't read `user_buyers` data
- ✅ Unauthenticated users can't access user tables at all
- ✅ `titles` table is publicly readable (RLS allows anonymous reads)
- ✅ `user_favorites` are scoped to authenticated user only

**Manual SQL Test** (Supabase SQL Editor):
```sql
-- Test 1: Verify RLS enabled on user tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_buyers', 'user_creators', 'user_favorites');
-- All should have rowsecurity = true

-- Test 2: Check RLS policies exist
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_buyers', 'user_creators', 'user_favorites');
-- Should return multiple policies per table

-- Test 3: Attempt cross-user access (should fail)
-- As User A, try to SELECT User B's profile
-- (This requires service role or manual testing via app)
```

**Critical**: If RLS is disabled or policies missing, user data is exposed! This is a LAUNCH BLOCKER.

---

#### ✅ Test Suite 5C: Database Connection Pooling

**Environment**: Production under load
**Priority**: P1 - HIGH

**Load Test Setup**:
```bash
# Install artillery if not already installed
npm install -g artillery

# Create test config: load-test.yml
config:
  target: https://dashboard.kstorybridge.com
  phases:
    - duration: 60
      arrivalRate: 10  # 10 concurrent users per second

scenarios:
  - name: Signup load test
    flow:
      - get:
          url: /signup/buyer
```

**Execute Load Test**:
```bash
artillery run load-test.yml
```

**Monitoring** (during load test):
1. Open Supabase Dashboard → Database → Connections
2. Watch real-time connection count
3. Monitor for:
   - ✅ Connection count stays below pool limit (typically 100)
   - ✅ No "too many connections" errors in logs
   - ✅ Queries still complete in <2 seconds under load

**Success Criteria**:
- ✅ Connection pool doesn't exceed 80% capacity
- ✅ No connection errors during 50+ concurrent requests
- ✅ Query performance degradation <50% under load

**Rollback If**: Connection pool maxes out or queries fail under moderate load.

---

### 2.3 Email & Notification System

#### ✅ Test Suite 6A: Welcome Email Delivery

**Environment**: Production
**Priority**: P1 - HIGH
**Reference**: EMAIL_POLICY_DOCUMENTATION.md

**Manual Test Steps**:

1. Complete OAuth buyer signup (Test 1A)
2. Check email inbox within 2 minutes
3. Verify welcome email received

**Success Criteria**:
- ✅ Email arrives from: `noreply@kstorybridge.com`
- ✅ Subject line clear (e.g., "Welcome to KStoryBridge")
- ✅ Email contains:
  - User's name (personalized)
  - Dashboard link: https://dashboard.kstorybridge.com
  - Signin link
  - Support/contact information
- ✅ HTML rendering correct (check images, styling)
- ✅ Plain text fallback exists (view source)
- ✅ NO duplicate emails sent (only ONE welcome email)
- ✅ Links clickable and redirect correctly

**Database Verification** (check deduplication):
```sql
-- Check email_logs table for duplicates
SELECT email, email_type, COUNT(*)
FROM email_logs
WHERE email = '[test email]' AND email_type = 'welcome'
GROUP BY email, email_type;

-- Expected: COUNT = 1 (not 2 or more)
```

**Edge Case**: Re-signup with same email should NOT send duplicate welcome email.

---

#### ✅ Test Suite 6B: Slack Notifications

**Environment**: Production
**Priority**: P2 - MEDIUM
**Reference**: SLACK_BLACKLIST_DOCUMENTATION.md

**Manual Test Steps**:

1. Complete buyer signup (new email)
2. Check designated Slack channel (within 1 minute)
3. Verify notification appears

**Success Criteria**:
- ✅ Notification posted in correct Slack channel
- ✅ Contains:
  - Full Name
  - Email address
  - Company name
  - Role
  - Account type (Buyer or Creator)
- ✅ NO notifications for blacklisted test emails (e.g., test@example.com)
- ✅ Notification format consistent
- ✅ No PII violations (email should be acceptable to share internally)

**Blacklist Test**:
- Signup with email in blacklist (check SLACK_BLACKLIST_DOCUMENTATION.md)
- ✅ NO Slack notification sent
- ✅ User still created successfully (notification is non-blocking)

**Failure Handling**:
- If Slack notification fails, signup should still succeed
- Check edge function logs for errors (send-email function)

---

## PHASE 3: PRODUCTION READINESS (SRE Best Practices) 📊

**Estimated Time**: 3-4 hours
**Focus**: Performance, Security, Monitoring, Deployment

### 3.1 Performance & Optimization

#### ✅ Test Suite 7A: Page Load Performance

**Environment**: Production
**Priority**: P1 - HIGH
**Tool**: Chrome DevTools Lighthouse

**Test Steps**:

1. Open Chrome Incognito window (disable extensions)
2. Navigate to production URL
3. Open DevTools (F12) → Lighthouse tab
4. Select:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - Device: Desktop
5. Click "Analyze page load"

**Pages to Test**:
- `/signin`
- `/buyers/home`
- `/buyers/titles`
- `/buyers/chat`

**Success Criteria (Target Scores)**:
- ✅ Performance: >80 (Good)
- ✅ Accessibility: >90 (Excellent)
- ✅ Best Practices: >90
- ✅ SEO: >80

**Performance Metrics**:
- ✅ First Contentful Paint (FCP): <2 seconds
- ✅ Largest Contentful Paint (LCP): <2.5 seconds
- ✅ Time to Interactive (TTI): <3.5 seconds
- ✅ Cumulative Layout Shift (CLS): <0.1
- ✅ Total Blocking Time (TBT): <300ms

**Common Issues to Fix**:
- Images not optimized → Use WebP format, lazy loading
- Large JavaScript bundles → Code splitting needed
- Render-blocking resources → Defer non-critical scripts
- Unused CSS → Tree shaking or purge CSS

**Record Results**:
```
Page: /buyers/titles
Performance: 85 ✅
Accessibility: 92 ✅
Best Practices: 88 ❌ (investigate)
SEO: 83 ✅
```

---

#### ✅ Test Suite 7B: API Response Times

**Environment**: Production
**Priority**: P1 - HIGH
**Tool**: Supabase Dashboard

**Monitoring Steps**:

1. Navigate to: Supabase Dashboard → API → Performance
2. Set time range: Last 24 hours
3. Review average response times for:
   - User profile queries (user_buyers, user_creators)
   - Title list queries (titles table)
   - Vector search (chatbot queries)
   - Edge function executions

**Success Criteria (95th percentile)**:
- ✅ User profile queries: <100ms
- ✅ Title list queries: <200ms
- ✅ Vector search (chatbot): <2 seconds
- ✅ Edge function execution: <500ms
- ✅ No queries exceeding 5 seconds

**Red Flags**:
- ❌ Queries consistently >1 second → Database optimization needed
- ❌ Spike in latency during specific times → Check for N+1 queries
- ❌ Timeout errors (>30 seconds) → Investigate slow queries

**Query Optimization Check**:
```sql
-- Check for missing indexes (Supabase SQL Editor)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected indexes on:
-- user_buyers(email), user_creators(email), titles(title_id), user_favorites(user_id, title_id)
```

---

#### ✅ Test Suite 7C: Bundle Size Check

**Environment**: Local build
**Priority**: P2 - MEDIUM

**Test Steps**:

1. Build production dashboard:
   ```bash
   cd apps/dashboard
   npm run build
   ```

2. Check output in terminal:
   ```
   dist/index.html                   0.XX kB
   dist/assets/index-XXXXXX.css      XXX.XX kB
   dist/assets/index-XXXXXX.js       XXX.XX kB (gzip: XX.XX kB)
   ```

3. Check total dist/ folder size:
   ```bash
   du -sh dist/
   ```

**Success Criteria**:
- ✅ Total bundle size <2MB (gzipped)
- ✅ Main JS bundle <500kB (gzipped)
- ✅ CSS bundle <100kB (gzipped)
- ✅ Code splitting implemented (multiple JS chunks)
- ✅ Vendor chunks separated from app code

**Check for Issues**:
```bash
# Analyze bundle composition
npx vite-bundle-visualizer
# Opens browser showing bundle breakdown

# Look for:
# - Duplicate dependencies (e.g., two versions of same library)
# - Large unused libraries
# - Opportunities for dynamic imports
```

**Optimization Targets**:
- Move large libraries to async imports (e.g., PDF viewer)
- Tree-shake unused code
- Use production builds of React/libraries

---

### 3.2 Security & Compliance

#### ✅ Test Suite 8A: HTTPS & SSL Validation

**Environment**: Production
**Priority**: P0 - BLOCKER (Security Critical)

**Manual Test Steps**:

1. Visit: https://dashboard.kstorybridge.com
2. Click padlock icon in address bar (left of URL)
3. Click "Certificate" or "Connection is secure"
4. Review certificate details

**Success Criteria**:
- ✅ Valid SSL certificate (not expired)
- ✅ Certificate issued by trusted CA (Let's Encrypt, DigiCert, etc.)
- ✅ Certificate expires >30 days from now
- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ No mixed content warnings (all resources loaded via HTTPS)
- ✅ TLS version: 1.2 or higher (preferably 1.3)

**SSL Labs Test** (comprehensive):
1. Visit: https://www.ssllabs.com/ssltest/
2. Enter: dashboard.kstorybridge.com
3. Click "Submit"
4. Wait for scan (2-3 minutes)

**Target Grade**: A or A+ (minimum B)

**Certificate Renewal**:
- Check Vercel dashboard for auto-renewal status
- Certificates should auto-renew 30 days before expiration

---

#### ✅ Test Suite 8B: Environment Variable Security

**Environment**: Vercel Dashboard + Git History
**Priority**: P0 - BLOCKER (Security Critical)
**Reference**: SECURITY_BEST_PRACTICES.md

**Part 1: Vercel Environment Variables Audit**

1. Navigate to: Vercel Dashboard → [Project] → Settings → Environment Variables

2. Verify variable visibility:
   - ✅ **VITE_SUPABASE_URL** - PUBLIC (visible) - SAFE
   - ✅ **VITE_SUPABASE_ANON_KEY** - PUBLIC (visible) - SAFE (RLS-protected)
   - ✅ **VITE_DASHBOARD_URL** - PUBLIC (visible) - SAFE
   - ❌ **SUPABASE_SERVICE_ROLE_KEY** - HIDDEN (encrypted) - CRITICAL
   - ❌ **OPENAI_API_KEY** - HIDDEN (encrypted) - CRITICAL
   - ❌ **STRIPE_SECRET_KEY** - HIDDEN (encrypted) - CRITICAL
   - ❌ **RESEND_API_KEY** - HIDDEN (encrypted) - CRITICAL

3. Verify environment scope:
   - Production: All sensitive keys present
   - Preview: Can use same or separate keys
   - Development: Local .env.local only (NOT in Vercel)

**Part 2: Git History Security Scan**

```bash
# Check for any .env files committed to git history
git log --all --full-history --source -- **/*.env

# Check for exposed service role keys
git log --all --full-history -S "eyJ.*service.*role" --source

# Check for exposed OpenAI keys
git log --all --full-history -S "sk-proj-" --source

# Check .gitignore is working
git status --porcelain | grep -E "\.env"
# Should return empty (no .env files tracked)
```

**Success Criteria**:
- ✅ NO service role keys in git history
- ✅ NO API keys in any committed files
- ✅ All `.env` files properly gitignored
- ✅ `.env.example` files contain placeholders only (no real values)

**If Keys Exposed** (CRITICAL - Immediate Action Required):
1. Rotate ALL exposed keys immediately (Supabase, OpenAI, Stripe)
2. Use GitHub secret scanning to verify
3. Update Vercel environment variables with new keys
4. Consider using git-filter-repo to remove from history (advanced)

---

#### ✅ Test Suite 8C: CORS & Security Headers

**Environment**: Production
**Priority**: P1 - HIGH

**HTTP Headers Check**:

```bash
# Fetch headers from production
curl -I https://dashboard.kstorybridge.com

# Look for security headers in output
```

**Success Criteria (required headers)**:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` or `SAMEORIGIN`
- ✅ `Content-Security-Policy:` (CSP header present)
- ✅ `Strict-Transport-Security: max-age=31536000` (HSTS)
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

**Vercel Configuration** (if headers missing):
Create `vercel.json` in project root:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000"
        }
      ]
    }
  ]
}
```

**CORS Validation**:
- Check that API endpoints only accept requests from allowed origins
- Supabase should enforce CORS via RLS policies
- Edge functions should validate origin headers

---

### 3.3 Monitoring & Observability (The Four Golden Signals)

#### ✅ Test Suite 9A: Error Tracking Setup

**Environment**: Production
**Priority**: P1 - HIGH
**Current Status**: ⚠️ NOT IMPLEMENTED - RECOMMENDED BEFORE LAUNCH

**Recommended Implementation**:

**Option 1: Sentry** (Recommended)
```bash
# Install Sentry
npm install @sentry/react

# Configure in App.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://[YOUR-DSN]@sentry.io/[PROJECT-ID]",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

**Option 2: LogRocket**
- Session replay for debugging user issues
- Better for understanding user behavior

**Verification Checklist** (if implementing):
- □ Error tracking service configured?
- □ Source maps uploaded for production builds?
- □ User session replay enabled?
- □ Error notifications to team Slack/email?
- □ Error rate baseline established?
- □ Can track errors back to source code line?

**Success Criteria**:
- ✅ Can reproduce user errors via session replay
- ✅ Alert triggers for >5 errors/minute
- ✅ Stack traces show actual source code (not minified)
- ✅ Team notified within 5 minutes of critical errors

**NOTE**: Currently production runs WITHOUT error tracking. This is acceptable for initial launch but STRONGLY RECOMMENDED for long-term operation.

---

#### ✅ Test Suite 9B: Application Metrics (Golden Signals)

**Priority**: P1 - HIGH
**Reference**: Google SRE Book - Four Golden Signals

**The Four Golden Signals**:

**1. Latency** - How long do requests take?
- **Dashboard**: Vercel Analytics → Performance
- **Supabase**: Dashboard → API → Performance
- **Targets**:
  - Page load: <3 seconds (95th percentile)
  - API response: <200ms (median)
  - Edge functions: <2 seconds (chatbot)

**2. Traffic** - How many requests are we serving?
- **Dashboard**: Vercel Analytics → Traffic
- **Metrics to track**:
  - Daily active users (DAU)
  - Requests per minute
  - Edge function invocations
  - Database queries per second
- **Baseline**: Establish normal traffic patterns

**3. Errors** - What's our error rate?
- **Dashboard**: Vercel Analytics → Errors (if available)
- **Supabase**: Edge Function logs, Database logs
- **Targets**:
  - HTTP 5xx errors: <1%
  - JavaScript errors: <5%
  - Edge function failures: <2%
  - Authentication failures: <3% (some failures expected from bots)

**4. Saturation** - How full are our resources?
- **Dashboard**: Supabase Dashboard → Database
- **Metrics**:
  - Database connection pool usage (<80%)
  - Edge function memory consumption (<90%)
  - Storage usage (GB remaining)
  - Rate limit proximity (API calls vs. limit)

**Setup Actions**:
1. Enable Vercel Analytics (if not already enabled)
2. Set up Supabase monitoring alerts
3. Create baseline metrics spreadsheet
4. Configure alerts for threshold violations

**Example Monitoring Dashboard** (manual tracking):
```
Metric                | Baseline | Threshold | Current | Status
------------------------------------------------------------------
Page Load (p95)       | 2.1s     | 3s        | 2.3s    | ✅ OK
API Response (median) | 120ms    | 200ms     | 135ms   | ✅ OK
Error Rate            | 0.5%     | 2%        | 0.8%    | ✅ OK
DB Connections        | 25       | 80        | 28      | ✅ OK
```

---

#### ✅ Test Suite 9C: Logging & Debugging

**Environment**: Production
**Priority**: P1 - HIGH

**Part 1: Supabase Edge Function Logs Review**

1. Navigate to: Supabase → Functions → [function name] → Logs
2. Set time range: Last 24 hours
3. Review for each function:
   - chat-orchestrator
   - create-oauth-profile
   - send-email
   - stripe-webhook

**Success Criteria**:
- ✅ NO `ERROR` level logs (recent)
- ✅ `WARN` logs reviewed and acceptable (document known warnings)
- ✅ Successful executions visible (200 status codes)
- ✅ NO PII in logs (no passwords, full emails, credit cards)
- ✅ Log format consistent and parseable

**Red Flags**:
- ❌ Repeated errors in last hour → Investigate immediately
- ❌ Email addresses or sensitive data in logs → Security issue
- ❌ Timeout errors → Performance problem

**Part 2: Vercel Deployment Logs**

1. Navigate to: Vercel → Deployments → [latest deployment] → Build Logs
2. Check for:
   - ✅ Build completed successfully
   - ✅ NO warnings about deprecated packages
   - ✅ Build time <5 minutes

**Part 3: Browser Console (Production)**

1. Open production site in incognito mode
2. Open DevTools → Console
3. Navigate through app (signup, titles, chat)

**Success Criteria**:
- ✅ NO red errors in console
- ✅ Debug logs disabled (`console.log` statements removed or gated)
- ✅ Only intentional console messages (if any)
- ✅ NO warnings about deprecated React features

**Logging Best Practices** (for future):
- Use structured logging (JSON format)
- Include request IDs for tracing
- Log levels: DEBUG, INFO, WARN, ERROR
- Centralize logs (e.g., Datadog, CloudWatch)

---

### 3.4 Deployment & Rollback

#### ✅ Test Suite 10A: Deployment Process Validation

**Environment**: GitHub + Vercel
**Priority**: P0 - BLOCKER
**Reference**: DEPLOYMENT_STRATEGY.md

**Test Deployment Flow**:

1. **Create Test Branch**:
   ```bash
   git checkout -b test/deployment-validation
   ```

2. **Make Trivial Change**:
   - Open `apps/dashboard/README.md`
   - Add comment: `<!-- Deployment test 2025-10-06 -->`
   - Commit: `git add . && git commit -m "test: Validate deployment process"`

3. **Push to v2 Branch** (staging):
   ```bash
   git push origin test/deployment-validation:v2 --force
   ```

4. **Monitor Vercel Dashboard**:
   - Check https://vercel.com/[your-team]/dashboard-staging
   - ✅ Deployment starts automatically (triggered by v2 push)
   - ✅ Build completes in <5 minutes
   - ✅ Preview URL generated

5. **Verify Other Apps DON'T Deploy**:
   - Check kstorybridge-dashboard (production) → NO new deployment
   - Check kstorybridge-website → NO new deployment
   - Check kstorybridge-integrated-admin → NO new deployment

**Success Criteria**:
- ✅ dashboard-staging deploys automatically from v2 branch
- ✅ Production apps ignore v2 branch (only build from main)
- ✅ Zero downtime deployment (old version serves until new ready)
- ✅ Preview URL works (test staging site)
- ✅ Build logs show no errors

**Part 2: Production Deployment** (from main branch):

1. **Merge to Main** (after all tests pass):
   ```bash
   git checkout main
   git merge v2
   git push origin main
   ```

2. **Monitor Production Deployment**:
   - kstorybridge-dashboard triggers build
   - ✅ Deploys to https://dashboard.kstorybridge.com
   - ✅ No downtime during deployment

**Rollback Test** (don't actually execute, just verify procedure):
```bash
# IF deployment fails, rollback via Vercel:
# 1. Go to Vercel Dashboard → Deployments
# 2. Find previous successful deployment
# 3. Click "..." → "Promote to Production"
# OR via git:
git revert [bad-commit-hash]
git push origin main
```

---

#### ✅ Test Suite 10B: Rollback Procedure

**Environment**: Git + Vercel
**Priority**: P0 - BLOCKER

**Disaster Recovery Test** (DOCUMENT ONLY - Don't Execute Unless Necessary):

**Scenario**: Critical bug deployed to production, need immediate rollback

**Option 1: Git Tag Rollback** (Recommended):
```bash
# 1. Identify rollback target
git log --oneline --decorate
# Find: auth-working-v4.0 (our stable baseline)

# 2. Checkout stable version
git checkout auth-working-v4.0

# 3. Force push to main (⚠️ DESTRUCTIVE)
git push origin HEAD:main --force

# 4. Vercel auto-deploys previous version
# 5. Verify production site reverted
```

**Option 2: Vercel Dashboard Rollback** (Faster):
1. Vercel Dashboard → Deployments
2. Find deployment tagged `auth-working-v4.0`
3. Click "..." → "Promote to Production"
4. Deployment rolls back instantly (no git changes)

**Option 3: Redeploy Previous Commit**:
```bash
git revert HEAD  # Creates new commit undoing latest changes
git push origin main
```

**Success Criteria for Rollback**:
- ✅ Rollback plan documented (this section)
- ✅ Team knows how to execute rollback (send this doc to team)
- ✅ Rollback can be executed in <5 minutes
- ✅ Database migrations are reversible (check migration files)
- ✅ Edge functions can be reverted (re-deploy previous version)

**Rollback Communication Plan**:
1. Notify team in Slack: "🚨 ROLLING BACK PRODUCTION - Critical bug detected"
2. Execute rollback (2-3 minutes)
3. Verify production site working
4. Post-mortem: Document what went wrong and how to prevent

**Database Rollback** (if schema changed):
```bash
# Supabase migrations are timestamped
cd apps/dashboard/supabase/migrations
# Find latest migration file
# Create down migration if needed

# OR: Restore database snapshot (Supabase Dashboard → Database → Backups)
```

---

#### ✅ Test Suite 10C: Health Check Endpoint

**Environment**: Production
**Priority**: P2 - MEDIUM
**Current Status**: ⚠️ NOT IMPLEMENTED - RECOMMENDED

**Recommended Implementation**:

Create `/api/health` endpoint:

```typescript
// apps/dashboard/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    version: "4.0",
    commit: "e2804417",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
```

**Usage**:
- Uptime monitoring (Pingdom, UptimeRobot) hits this endpoint every 1 min
- If endpoint returns 500 or times out → Alert team
- If status !== "ok" → Alert team

**Success Criteria** (if implemented):
- ✅ Endpoint responds in <500ms
- ✅ Returns 200 OK when healthy
- ✅ Returns 500 if critical services down (database, edge functions)
- ✅ Version and commit hash included for debugging

**Current Workaround** (without health endpoint):
- Use Vercel's built-in uptime monitoring
- Monitor Supabase dashboard for database health
- Manually check site loads correctly

**NOTE**: Not critical for launch but RECOMMENDED for production monitoring.

---

## PHASE 4: USER ACCEPTANCE & FINAL CHECKS (P2) ✅

**Estimated Time**: 2-3 hours

### 4.1 Cross-Browser Testing

#### ✅ Test Suite 11A: Browser Compatibility Matrix

**Environment**: Production
**Priority**: P1 - HIGH

**Test Matrix**:

| Browser | Version | Device | Tester | Status |
|---------|---------|--------|--------|--------|
| Chrome | Latest | Desktop (Mac) | [Name] | ☐ |
| Chrome | Latest | Desktop (Windows) | [Name] | ☐ |
| Safari | Latest | Desktop (Mac) | [Name] | ☐ |
| Firefox | Latest | Desktop (Windows) | [Name] | ☐ |
| Edge | Latest | Desktop (Windows) | [Name] | ☐ |
| Chrome | Latest | iOS (iPhone) | [Name] | ☐ |
| Safari | Latest | iOS (iPhone) | [Name] | ☐ |
| Chrome | Latest | Android | [Name] | ☐ |

**Pages to Test** (in each browser):
1. `/signin` - Signin page
2. `/signup/buyer` - Buyer signup
3. `/buyers/home` - Buyer dashboard
4. `/buyers/titles` - Title library (scrolling, images)
5. `/buyers/chat` - Chatbot interface

**Test Criteria for Each Page**:
- ✅ Page renders correctly (no broken layout)
- ✅ All interactive elements work (buttons, forms, links)
- ✅ OAuth flows complete successfully
- ✅ Images load correctly
- ✅ NO console errors (check DevTools)
- ✅ Typography readable (correct fonts)

**Known Compatibility Issues**:
- Safari sometimes has issues with WebP images → Check image fallbacks
- Older browsers may not support ES2020+ features → Verify Vite build targets

**Testing Tool** (alternative to manual):
- BrowserStack or LambdaTest for automated cross-browser testing

---

#### ✅ Test Suite 11B: Responsive Design Validation

**Environment**: Production
**Priority**: P1 - HIGH

**Device Breakpoints to Test**:

1. **Mobile (390x844) - iPhone 13 Pro**:
   ```
   Chrome DevTools → Toggle Device Toolbar → iPhone 13 Pro
   ```
   - ✅ Signup form usable (all fields visible)
   - ✅ Sidebar menu accessible (hamburger icon)
   - ✅ Title cards stack vertically
   - ✅ Chatbot interface fits screen
   - ✅ Text readable without zoom

2. **Tablet (810x1080) - iPad**:
   ```
   Chrome DevTools → iPad Air
   ```
   - ✅ Two-column layout (sidebar + content)
   - ✅ Title cards in 2-3 columns
   - ✅ Forms centered and readable

3. **Desktop (1920x1080) - Standard Monitor**:
   - ✅ Full layout with sidebar
   - ✅ Content centered, max-width applied
   - ✅ Title cards in 3-4 columns

4. **Large Desktop (2560x1440) - 4K**:
   - ✅ Content doesn't stretch to full width
   - ✅ Readable line lengths (<80 chars)
   - ✅ Images don't pixelate

**Responsive Test Checklist**:
- ✅ No horizontal scrolling on any page
- ✅ All text readable without zoom (min 14px font size)
- ✅ Buttons/links tappable on mobile (min 44x44px touch target)
- ✅ Forms usable on mobile (no overlapping fields)
- ✅ Images scale correctly (responsive images)
- ✅ Navigation accessible on all screen sizes

**Touch Target Test** (mobile):
- All interactive elements must be at least 44x44px
- Adequate spacing between buttons (min 8px gap)

---

### 4.2 Data Integrity & Migration

#### ✅ Test Suite 12A: Production Data Verification

**Environment**: Supabase Production Database
**Priority**: P0 - BLOCKER

**SQL Queries to Run** (Supabase SQL Editor):

**Query 1: User Count Verification**
```sql
-- Check total users
SELECT
  (SELECT COUNT(*) FROM user_buyers) as buyer_count,
  (SELECT COUNT(*) FROM user_creators) as creator_count,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users;

-- Compare counts: total_auth_users should equal (buyer_count + creator_count + admin_count)
```

**Query 2: Orphaned Auth Users** (Critical)
```sql
-- Find users in auth.users without profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'account_type' as account_type
FROM auth.users au
LEFT JOIN user_buyers ub ON au.id = ub.id
LEFT JOIN user_creators uc ON au.id = uc.id
LEFT JOIN admin ad ON au.id = ad.id
WHERE ub.id IS NULL AND uc.id IS NULL AND ad.id IS NULL
  AND au.email NOT LIKE '%test%';  -- Exclude test accounts

-- Expected: 0 rows (no orphaned users)
-- If found: Investigate why profiles weren't created
```

**Query 3: Account Type Metadata Consistency**
```sql
-- Find users missing account_type in metadata
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'account_type' as metadata_account_type,
  CASE
    WHEN ub.id IS NOT NULL THEN 'buyer'
    WHEN uc.id IS NOT NULL THEN 'creator'
    ELSE 'unknown'
  END as actual_account_type
FROM auth.users au
LEFT JOIN user_buyers ub ON au.id = ub.id
LEFT JOIN user_creators uc ON au.id = uc.id
WHERE au.raw_user_meta_data->>'account_type' IS NULL
  AND au.email NOT LIKE '%admin%'
  AND au.email NOT LIKE '%test%';

-- Expected: 0 rows (all users have account_type in metadata)
```

**Query 4: Email Uniqueness Across Tables**
```sql
-- Check for duplicate emails (should be impossible but verify)
SELECT email, COUNT(*)
FROM (
  SELECT email FROM user_buyers
  UNION ALL
  SELECT email FROM user_creators
) as all_emails
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicate emails)
```

**Query 5: Required Fields Populated**
```sql
-- Check buyers have required fields
SELECT COUNT(*) as missing_tier
FROM user_buyers
WHERE tier IS NULL;
-- Expected: 0

SELECT COUNT(*) as missing_requested_field
FROM user_buyers
WHERE requested IS NULL;
-- Expected: 0

-- Check creators have required fields (ip_owner_role required since 2025-09-21)
SELECT COUNT(*) as missing_role
FROM user_creators
WHERE ip_owner_role IS NULL
  AND created_at > '2025-09-21';  -- Only check new users after requirement added
-- Expected: 0
```

**Success Criteria**:
- ✅ Zero orphaned auth.users (all have profiles)
- ✅ All users have account_type metadata
- ✅ No duplicate emails across tables
- ✅ All required fields populated
- ✅ User counts match expectations (document baseline)

**Red Flags** (immediate investigation):
- ❌ Orphaned users found → Profile creation failed during signup
- ❌ Missing metadata → Metadata update failed during signup
- ❌ Duplicate emails → Constraint violation or race condition

---

#### ✅ Test Suite 12B: Tier System Validation

**Environment**: Supabase Production Database
**Priority**: P1 - HIGH

**SQL Query**:
```sql
-- Check tier distribution for buyers
SELECT
  tier,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_buyers), 2) as percentage
FROM user_buyers
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'suite' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'basic' THEN 3
    WHEN 'invited' THEN 4
  END;

-- Expected distribution (approximate):
-- basic: 80-90% (default for new signups)
-- pro: 5-15% (paid tier)
-- suite: 1-5% (premium tier)
-- invited: 0-10% (legacy, being phased out)
```

**Verification Steps**:

1. **Check Default Tier Assignment**:
   ```sql
   -- Recent signups should have tier='basic'
   SELECT email, tier, created_at
   FROM user_buyers
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC
   LIMIT 20;

   -- All should have tier='basic' (unless manually upgraded)
   ```

2. **Identify Tier Anomalies**:
   ```sql
   -- Find users with tier='invited' (legacy, should be rare)
   SELECT COUNT(*) as legacy_invited_users
   FROM user_buyers
   WHERE tier = 'invited';

   -- Document count (acceptable if <10% of total)
   ```

3. **Paid Tier Verification**:
   ```sql
   -- Check if pro/suite users have Stripe subscriptions
   SELECT
     ub.email,
     ub.tier,
     ub.created_at
   FROM user_buyers ub
   WHERE tier IN ('pro', 'suite')
   ORDER BY created_at DESC;

   -- Manually verify in Stripe dashboard that these users have active subscriptions
   ```

**Success Criteria**:
- ✅ Most users (>70%) have tier='basic'
- ✅ All recent signups (<7 days) have tier='basic' by default
- ✅ Pro/suite tier users have valid Stripe subscriptions
- ✅ Legacy tier='invited' users documented and acceptable count

**Tier Migration** (if needed):
```sql
-- If legacy 'invited' users should become 'basic':
UPDATE user_buyers
SET tier = 'basic', updated_at = NOW()
WHERE tier = 'invited' AND created_at < '2025-08-21';
-- (2025-08-21 is when tier default changed)
```

---

## PHASE 5: DOCUMENTATION & RUNBOOKS 📚

### 5.1 Documentation Completeness

#### ✅ Test Suite 13A: Documentation Review

**Priority**: P2 - MEDIUM

**Documentation Checklist**:

| Document | Last Updated | Version | Status |
|----------|--------------|---------|--------|
| AUTH_DOCUMENTATION.md | 2025-10-06 | 4.0 | ☐ Reviewed |
| USER_JOURNEY_MAP.md | 2025-01-19 | 1.0 | ☐ Reviewed |
| DEPLOYMENT_STRATEGY.md | 2025-10-03 | Current | ☐ Reviewed |
| SECURITY_BEST_PRACTICES.md | 2025-01-17 | Current | ☐ Reviewed |
| DATABASE_SCHEMA.md | Current | - | ☐ Reviewed |
| CHATBOT_TEST_RESULTS.md | 2025-10-04 | Phase 1&2 | ☐ Reviewed |
| PRE_LAUNCH_TESTING_PLAN.md | 2025-10-06 | 4.0 | ☐ This Document |

**Review Criteria for Each Doc**:
- ✅ Last updated date is recent (<30 days)
- ✅ Information accurate (no references to deprecated features)
- ✅ File name references correct (e.g., no AuthCallbackPageFixed → AuthCallbackSimple)
- ✅ Code examples work (test snippets in documentation)
- ✅ Links functional (internal doc links not broken)

**Critical Updates Needed** (if any discrepancies found):
- Update version numbers to match current state
- Fix file path references
- Add new features to documentation
- Mark deprecated features clearly

---

#### ✅ Test Suite 13B: Operational Runbooks

**Priority**: P1 - HIGH
**Current Status**: ⚠️ PARTIALLY DOCUMENTED - CREATE MISSING RUNBOOKS

**Required Runbooks** (create if missing):

**1. Rollback Deployment Runbook**
- ✅ Documented in Test Suite 10B above
- Location: PRE_LAUNCH_TESTING_PLAN.md → Section 3.4

**2. User Password Reset Runbook** (Manual Override)
```
Title: Manually Reset User Password
When: User can't access account, email not working

Steps:
1. Verify user identity (email confirmation)
2. Navigate to Supabase Dashboard → Authentication → Users
3. Find user by email
4. Click "..." → Send Password Reset Email
5. OR: Update password directly (use with caution)
6. Notify user via support channel
```

**3. Database Query Troubleshooting Runbook**
```
Title: Investigate Slow Queries
When: API response times spike, user reports delays

Steps:
1. Supabase Dashboard → Database → Performance
2. Identify slow queries (>1 second)
3. Click query to view full SQL
4. Check for missing indexes:
   - EXPLAIN ANALYZE [slow query]
5. Add index if needed:
   - CREATE INDEX idx_[table]_[column] ON [table]([column]);
6. Monitor performance improvement
```

**4. Feature Flag Disable Runbook** (Future)
```
Title: Emergency Feature Disable
When: New feature causing errors, need to disable quickly

Steps:
1. Identify feature flag in code (e.g., VITE_FEATURE_CHATBOT)
2. Vercel Dashboard → Settings → Environment Variables
3. Set flag to 'false'
4. Trigger redeployment (redeploy current version)
5. Verify feature disabled in production
```

**5. Scale Database Resources Runbook**
```
Title: Increase Database Capacity
When: Connection pool saturated, queries timing out

Steps:
1. Supabase Dashboard → Settings → Database
2. Click "Change plan" or "Upgrade"
3. Select higher tier (more connections, CPU)
4. Confirm upgrade (billing impact)
5. Monitor connection pool usage decrease
```

**6. API Key Rotation Runbook**
```
Title: Rotate Exposed API Key
When: API key accidentally committed to git, suspected compromise

Steps:
1. Generate new key:
   - OpenAI: Dashboard → API Keys → Create new
   - Stripe: Dashboard → Developers → API Keys → Create
   - Supabase: Dashboard → Settings → API → Reset service role key
2. Update Vercel environment variables with new key
3. Trigger redeployment
4. Verify new key works in production
5. Revoke old key
6. Document incident in security log
```

**Runbook Template** (for future runbooks):
```markdown
# Runbook: [Title]

**When to Use**: [Trigger conditions]
**Severity**: P0/P1/P2
**Estimated Time**: [X minutes]

## Steps
1. [Action 1]
2. [Action 2]
3. [Verification step]

## Rollback
If something goes wrong: [Rollback procedure]

## Contacts
- Primary: [Name, Slack handle]
- Secondary: [Name, Slack handle]
```

**Success Criteria**:
- ✅ All critical runbooks documented
- ✅ Team members trained on runbook usage
- ✅ Runbooks tested (dry-run of procedures)
- ✅ Runbooks accessible (shared in team drive)

---

## EXECUTION PLAN 🎯

### 📅 Day 1: Critical Path (4-6 hours)

**Morning (2-3 hours)**:
- [ ] Test Suite 1A: OAuth Signup - Buyer
- [ ] Test Suite 1B: OAuth Signup - Creator
- [ ] Test Suite 1C: Email Signup - Buyer
- [ ] Test Suite 1D: Email Signup - Creator

**Afternoon (2-3 hours)**:
- [ ] Test Suite 1E: OAuth Signin - Existing User
- [ ] Test Suite 1F: Email Signin - Existing User
- [ ] Test Suite 2A: Session Timeout Validation
- [ ] Test Suite 2B: Cross-Tab Session Sync
- [ ] Test Suite 2C: Session Expiration Handling
- [ ] Test Suite 3A: Buyer Complete Journey (10 min)
- [ ] Test Suite 3B: Creator Complete Journey (5 min)
- [ ] Test Suite 5A: Edge Function Health Check

**✅ GO/NO-GO Decision Point 1**:
- All P0 tests must pass
- Zero critical blockers found
- Authentication system stable
- **Decision**: ☐ GO to Day 2 | ☐ NO-GO (fix issues first)

---

### 📅 Day 2: Functional & Performance (4-6 hours)

**Morning (2-3 hours)**:
- [ ] Test Suite 4A: Chatbot Phase 1 & 2 Improvements (automated)
- [ ] Test Suite 4B: Chatbot Edge Cases (manual)
- [ ] Test Suite 5B: RLS Policy Validation
- [ ] Test Suite 5C: Database Connection Pooling (load test)

**Afternoon (2-3 hours)**:
- [ ] Test Suite 6A: Welcome Email Delivery
- [ ] Test Suite 6B: Slack Notifications
- [ ] Test Suite 7A: Page Load Performance (Lighthouse)
- [ ] Test Suite 7B: API Response Times
- [ ] Test Suite 7C: Bundle Size Check

**✅ GO/NO-GO Decision Point 2**:
- All P1 tests should pass
- Performance within targets
- Chatbot 6/6 tests passing
- **Decision**: ☐ GO to Day 3 | ☐ NO-GO (optimize first)

---

### 📅 Day 3: Security & Monitoring (3-4 hours)

**Morning (1.5-2 hours)**:
- [ ] Test Suite 8A: HTTPS & SSL Validation
- [ ] Test Suite 8B: Environment Variable Security
- [ ] Test Suite 8C: CORS & Security Headers
- [ ] Test Suite 9A: Error Tracking Setup (assess, document if not implementing)
- [ ] Test Suite 9B: Application Metrics (Golden Signals baseline)

**Afternoon (1.5-2 hours)**:
- [ ] Test Suite 9C: Logging & Debugging
- [ ] Test Suite 10A: Deployment Process Validation
- [ ] Test Suite 10B: Rollback Procedure (document, don't execute)
- [ ] Test Suite 10C: Health Check Endpoint (assess, document if not implementing)

**✅ GO/NO-GO Decision Point 3**:
- All security tests must pass
- No exposed secrets
- Monitoring baseline established
- **Decision**: ☐ GO to Day 4 | ☐ NO-GO (critical security fix needed)

---

### 📅 Day 4: Final Checks (2-3 hours)

**Morning (1-1.5 hours)**:
- [ ] Test Suite 11A: Cross-Browser Testing (Chrome, Safari, Firefox, Edge)
- [ ] Test Suite 11B: Responsive Design (Mobile, Tablet, Desktop)

**Afternoon (1-1.5 hours)**:
- [ ] Test Suite 12A: Production Data Verification (SQL queries)
- [ ] Test Suite 12B: Tier System Validation
- [ ] Test Suite 13A: Documentation Review
- [ ] Test Suite 13B: Operational Runbooks (verify existence)

**✅ FINAL GO/NO-GO DECISION**:
- [ ] All P0 tests passed
- [ ] All P1 tests passed or documented exceptions
- [ ] Security validated
- [ ] Rollback plan ready
- [ ] Team briefed on launch
- **FINAL DECISION**: ☐ READY FOR LAUNCH | ☐ DELAY LAUNCH (specify reason)

---

## SUCCESS CRITERIA FOR LAUNCH ✅

### Must-Have (P0 - BLOCKER)

- ✅ **Authentication**: All OAuth and email flows work (Test Suites 1A-1F)
- ✅ **Session Management**: No getSession timeouts, stable sessions (Test Suites 2A-2C)
- ✅ **User Flows**: Buyer and creator journeys complete successfully (Test Suites 3A-3B)
- ✅ **Edge Functions**: All functions healthy and operational (Test Suite 5A)
- ✅ **Database Security**: RLS policies enforced (Test Suite 5B)
- ✅ **HTTPS**: Valid SSL certificate, enforced HTTPS (Test Suite 8A)
- ✅ **Secrets**: No credentials in git history (Test Suite 8B)
- ✅ **Deployment**: Process validated, rollback plan tested (Test Suites 10A-10B)
- ✅ **Data Integrity**: No orphaned users, consistent data (Test Suite 12A)

### Should-Have (P1 - HIGH)

- ✅ **Chatbot**: 6/6 tests passing, <4s response time (Test Suites 4A-4B)
- ✅ **Performance**: Lighthouse >80, API <200ms (Test Suites 7A-7B)
- ✅ **Cross-Browser**: Works in Chrome, Safari, Firefox, Edge (Test Suite 11A)
- ✅ **Email Delivery**: Welcome emails sending correctly (Test Suite 6A)
- ✅ **Monitoring**: Baseline metrics established (Test Suite 9B)
- ✅ **Responsive**: Mobile, tablet, desktop all functional (Test Suite 11B)

### Nice-to-Have (P2 - MEDIUM)

- ✅ **Error Tracking**: Sentry or LogRocket configured (Test Suite 9A)
- ✅ **Health Endpoint**: /api/health implemented (Test Suite 10C)
- ✅ **Runbooks**: Complete operational runbooks (Test Suite 13B)
- ✅ **Bundle Size**: Optimized <2MB (Test Suite 7C)
- ✅ **Slack Notifications**: Signup notifications working (Test Suite 6B)

---

## RECOMMENDED TOOLS 🛠️

### Testing Tools
- **Manual Testing**: Chrome DevTools, Incognito mode, BrowserStack
- **Automated Testing**: Existing test suite (apps/dashboard/test-*.js files)
- **Load Testing**: Artillery, k6
- **Security Scanning**: OWASP ZAP, SSL Labs (https://www.ssllabs.com/ssltest/)
- **Performance**: Lighthouse, Vercel Analytics
- **Cross-Browser**: BrowserStack, LambdaTest

### Monitoring & Observability
- **Application Monitoring**: Vercel Analytics (built-in, free)
- **Error Tracking**: Sentry (recommended), LogRocket (session replay)
- **Uptime Monitoring**: UptimeRobot (free tier), Pingdom
- **Database Monitoring**: Supabase Dashboard (built-in)
- **Logging**: Supabase Edge Function logs, Vercel deployment logs

### Deployment & CI/CD
- **Version Control**: GitHub (current)
- **CI/CD**: GitHub Actions + Vercel (already configured)
- **Secrets Management**: Vercel Environment Variables
- **Rollback**: Git tags (auth-working-v4.0), Vercel deployment history

---

## POST-LAUNCH MONITORING (First 48 Hours) 📈

### Hour 0-1 (Immediate Monitoring)

**What to Watch**:
- Error rates (should be <1%)
- Server response times (API <200ms)
- Authentication success rate (>95%)
- Edge function performance (no timeouts)

**Where to Monitor**:
- Vercel Analytics → Errors
- Supabase Dashboard → API Performance
- Edge Function Logs (chat-orchestrator, create-oauth-profile)

**Alert Thresholds**:
- 🚨 Error rate >5% → Investigate immediately
- 🚨 Authentication failure >10% → Check auth system
- 🚨 Response time >5s → Performance issue

---

### Hour 1-24 (First Day Monitoring)

**Metrics to Track**:
- **New Signups**: Count and account type distribution
- **Chatbot Usage**: Query count, success rate, response time
- **Email Delivery**: Welcome emails sent/failed
- **Edge Function Invocations**: Calls per hour per function
- **Page Views**: Most visited pages

**Daily Summary Checklist**:
- [ ] Total signups today: ___ (buyers: ___, creators: ___)
- [ ] OAuth success rate: ___%
- [ ] Email success rate: ___%
- [ ] Chatbot queries: ___ (avg response time: __s)
- [ ] Top error (if any): ___
- [ ] User feedback/support tickets: ___

---

### Hour 24-48 (Second Day Monitoring)

**Analysis Tasks**:
- Review all support tickets/user feedback
- Analyze performance trends (improving or degrading?)
- Check for unexpected usage patterns
- Identify any recurring errors

**Optimization Opportunities**:
- Slow pages → Add caching or optimize queries
- High chatbot usage → Review rate limits
- Frequent errors → Plan hotfix

**Success Indicators**:
- ✅ Error rate stable and low (<2%)
- ✅ No critical bugs reported
- ✅ User signups consistent
- ✅ Performance metrics within targets

---

### Week 1 Review (Day 7)

**KPIs to Calculate**:
- Total users acquired (buyers + creators)
- Authentication success rate (7-day average)
- Chatbot engagement (queries per user)
- Support ticket volume
- Performance scores (Lighthouse, API response times)

**Post-Launch Report Template**:
```markdown
# Week 1 Launch Report - v4.0

**Launch Date**: 2025-10-XX
**Report Date**: 2025-10-XX

## Metrics
- Total Signups: ___ (Buyers: ___, Creators: ___)
- OAuth Success Rate: ___%
- Email Signup Success Rate: ___%
- Avg Response Time: ___ms
- Error Rate: ___%

## Issues Found
1. [Issue 1] - Severity: P1 - Status: Fixed
2. [Issue 2] - Severity: P2 - Status: In Progress

## User Feedback
- Positive: ___
- Negative: ___
- Feature Requests: ___

## Next Steps
- [ ] Implement error tracking (Sentry)
- [ ] Optimize slow pages
- [ ] Address top user feedback items
```

---

## ROLLBACK TRIGGERS 🚨

**Immediately rollback if**:

1. **Authentication Failure** (P0 - Critical):
   - Authentication success rate <95%
   - OAuth completely broken (0% success)
   - Massive session timeout errors

2. **High Error Rate** (P0 - Critical):
   - Error rate >5% for >10 minutes
   - Edge functions failing >10%
   - Database connection errors

3. **Performance Degradation** (P1 - High):
   - Page load times >10 seconds
   - API response times >5 seconds consistently
   - Chatbot timeout rate >20%

4. **Security Vulnerability** (P0 - Critical):
   - Exposed credentials discovered
   - RLS bypass found
   - SQL injection vulnerability

5. **Data Integrity Issue** (P0 - Critical):
   - Profile creation failures >10%
   - User data corruption detected
   - Database constraint violations

**Rollback Procedure**:
```bash
# EMERGENCY ROLLBACK
git checkout auth-working-v4.0
git push origin HEAD:main --force

# OR via Vercel Dashboard:
# Deployments → Find auth-working-v4.0 → Promote to Production
```

**Post-Rollback**:
1. Notify team immediately
2. Investigate root cause
3. Fix in development
4. Re-test before re-deploying
5. Document incident

---

## NOTES & RECOMMENDATIONS

### Current Version Status
- **Version**: 4.0 (auth-working-v4.0)
- **Commit**: e2804417
- **Tested In**: Production (manual user testing confirmed working)
- **Known Issues**: None critical for launch

### Risk Assessment
- **Overall Risk Level**: **LOW** ✅
  - Auth system stable (v4.0 fixes applied)
  - Chatbot verified (6/6 tests passed)
  - Edge functions healthy
  - Security practices followed

### Launch Recommendation
**STATUS**: ✅ **READY FOR LAUNCH** pending test execution

**Conditions**:
- All Phase 1 (P0) tests must pass
- All Phase 2 (P1) tests should pass or have documented exceptions
- Security audit clean (no exposed secrets)
- Rollback plan validated

### Post-Launch Priorities
1. **Week 1**: Implement error tracking (Sentry recommended)
2. **Week 2**: Set up comprehensive monitoring dashboards
3. **Week 3**: Create remaining operational runbooks
4. **Month 1**: Conduct security audit, review metrics

### Support Readiness
- [ ] Support team briefed on new features
- [ ] Support runbooks shared
- [ ] Escalation path defined
- [ ] Support Slack channel active

---

## DOCUMENT CHANGE LOG

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-06 | 1.0 | Initial creation based on SRE best practices + app-specific testing | Claude |

---

**End of Pre-Launch Testing Plan**

For questions or issues during testing, refer to:
- AUTH_DOCUMENTATION.md (authentication issues)
- DEPLOYMENT_STRATEGY.md (deployment problems)
- SECURITY_BEST_PRACTICES.md (security concerns)
- Database team / Supabase support (database issues)
