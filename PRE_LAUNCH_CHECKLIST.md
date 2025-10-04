# KStoryBridge V2 - Pre-Launch Verification Checklist

**Date Created**: 2025-10-04
**Target Launch Date**: TBD
**Status**: 🟡 IN PROGRESS

---

## ✅ Completed Fixes (2025-10-04)

### Code Cleanup
- [x] **Removed debug routes** from App.tsx (`/test-signup`, `/debug-signup`, `/test-send-message`)
- [x] **Deleted 6 unused OAuth callback files** (kept only `AuthCallbackSimple.tsx`)
- [x] **Added global Error Boundary** to catch unhandled React errors
- [x] **Updated DATABASE_SCHEMA.md** with `stripe_customers` table documentation

### What Was Fixed
1. **Security**: Removed exposed test/debug routes from production
2. **Code Quality**: Cleaned up 6 redundant OAuth implementations (1,287 → 178 lines)
3. **Reliability**: Added Error Boundary to prevent white screen crashes
4. **Documentation**: stripe_customers table now documented for developers

---

## 🔴 CRITICAL - Must Complete Before Launch

### 1. Database & RLS Verification

**Supabase Dashboard Checks**:
- [ ] **Verify RLS enabled** on all tables
  ```sql
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('user_buyers', 'user_creators', 'titles', 'user_favorites', 'stripe_customers', 'chat_sessions', 'chat_messages');
  ```
  **Expected**: `rowsecurity = true` for all tables

- [ ] **Test RLS policies** with test users
  - Create buyer account → Cannot see other buyers' data
  - Create creator account → Cannot see other creators' titles
  - Try accessing `/buyers/saved` → Only see own favorites

- [ ] **Check for orphaned records**
  ```sql
  -- Should return 0
  SELECT COUNT(*) FROM user_buyers WHERE id NOT IN (SELECT id FROM auth.users);
  SELECT COUNT(*) FROM user_creators WHERE id NOT IN (SELECT id FROM auth.users);
  ```

- [ ] **Verify tier defaults**
  ```sql
  -- Check default tier is 'basic'
  SELECT tier, COUNT(*) FROM user_buyers GROUP BY tier;
  ```

### 2. Stripe Integration Testing

**CRITICAL**: Test complete payment flow end-to-end

- [ ] **Verify Stripe webhook endpoint is deployed**
  - URL: `https://[your-edge-function-url]/stripe-webhook`
  - Test with Stripe CLI: `stripe listen --forward-to [webhook-url]`

- [ ] **Test webhook scenarios** (use Stripe test mode):
  - [ ] **New subscription created**: User upgrades to Pro
    - Tier changes from `basic` → `pro` in `user_buyers`
    - Record created in `stripe_customers` with status `active`

  - [ ] **Subscription canceled**: User cancels Pro
    - Tier remains `pro` until `current_period_end`
    - `cancel_at_period_end` = true in `stripe_customers`

  - [ ] **Subscription expired**: Billing period ends after cancellation
    - Tier downgrades from `pro` → `basic`
    - User loses access to Pro features

  - [ ] **Payment failed**: Renewal payment fails
    - Subscription status changes to `past_due`
    - User behavior: TBD (keep Pro temporarily or downgrade?)

- [ ] **Test checkout flow**:
  - Click "Upgrade to Pro" button
  - Complete Stripe checkout (test card: 4242 4242 4242 4242)
  - Verify redirect back to dashboard
  - Verify tier = 'pro' immediately after

- [ ] **Test subscription management**:
  - Access Stripe customer portal
  - Cancel subscription
  - Verify `cancel_at_period_end` updates

### 3. Authentication Flow Testing

- [ ] **Email/Password Signup**:
  - [ ] Buyer with work email → Success
  - [ ] Buyer with personal email (gmail) → Error message shown
  - [ ] Creator with any email → Success
  - [ ] Creator without `ip_owner_role` → Error (field required)
  - [ ] Receive email verification within 1 minute
  - [ ] Click verification link → Email verified

- [ ] **Google OAuth Signup**:
  - [ ] Buyer OAuth → Profile completion page
  - [ ] Creator OAuth → Profile completion with required role
  - [ ] Work email validation enforced for buyers
  - [ ] Session established immediately (no hanging)

- [ ] **Google OAuth Signin**:
  - [ ] Existing buyer → Routes to `/buyers/chat`
  - [ ] Existing creator → Routes to `/creators/home`
  - [ ] New OAuth user (no account) → Routes to `/account-type-selection`

- [ ] **Password Reset**:
  - [ ] Request reset email
  - [ ] Receive email within 1 minute
  - [ ] Click link → Reset password form
  - [ ] Submit new password → Can sign in with new password

- [ ] **Session Management**:
  - [ ] Session persists across page refresh
  - [ ] Session auto-refreshes before expiry
  - [ ] Sign out clears session completely
  - [ ] Sign out redirects to `/signin`

### 4. User Flow Testing

**Buyer Journey** (15 minutes):
- [ ] Signup → Receive welcome email
- [ ] First login → Routes to `/buyers/chat`
- [ ] Chat: Send query → Get AI response with title recommendations
- [ ] Click title link → Routes to title detail page
- [ ] Save title → Appears in `/buyers/saved`
- [ ] View profile → See correct tier (basic)
- [ ] View `/buyers/plan` → See upgrade options

**Creator Journey** (10 minutes):
- [ ] Signup with role → Receive welcome email
- [ ] First login → Routes to `/creators/home`
- [ ] Add new title → Form submission succeeds
- [ ] Edit title → Changes persist
- [ ] View title detail → Shows all fields correctly
- [ ] View profile → See pen_name and role

### 5. Chat System Testing

- [ ] **Vector Search**:
  - [ ] Query: "romance story" → Returns relevant titles
  - [ ] Query: "action thriller" → Returns relevant titles
  - [ ] Verify 10 results returned (not 5)

- [ ] **Fallback Keyword Search**:
  - [ ] Query with no vector matches → Falls back to keyword search
  - [ ] Verify results still appear (not empty)

- [ ] **Hallucination Detection**:
  - [ ] AI response contains only real title names
  - [ ] No fictional recommendations
  - [ ] Check edge function logs for validation warnings

- [ ] **Title Links**:
  - [ ] Click title name in chat → Routes to correct title detail page
  - [ ] Fuzzy matching works (handles slight name variations)

- [ ] **Session Persistence**:
  - [ ] Chat history persists across page refresh
  - [ ] Previous messages visible on return visit

### 6. Error Handling Testing

- [ ] **Network Errors**:
  - [ ] Disable network → User-friendly error shown
  - [ ] Re-enable network → App recovers gracefully

- [ ] **Database Errors**:
  - [ ] Simulate slow query → Loading state shown
  - [ ] Query failure → Error toast with clear message

- [ ] **React Errors**:
  - [ ] Component crash → Error Boundary shows friendly page
  - [ ] Click "Return to Home" → Routes to `/`
  - [ ] Error details visible in development mode

- [ ] **OAuth Errors**:
  - [ ] Cancel OAuth → Redirects to signin with error message
  - [ ] Invalid OAuth code → Error toast shown

### 7. Email System Testing

- [ ] **Welcome Emails**:
  - [ ] Buyer signup → Receives welcome email
  - [ ] Creator signup → Receives welcome email
  - [ ] Email content correct (no typos, correct branding)
  - [ ] Links work (dashboard URL, login URL)
  - [ ] No duplicate emails sent for same user

- [ ] **Email Deduplication**:
  - [ ] Check `email_logs` table after signup
  - [ ] Verify only 1 record per user
  - [ ] Re-trigger welcome email logic → No second email sent

### 8. Analytics Testing

- [ ] **GA4 Setup**:
  - [ ] Install GA4 DebugView Chrome extension
  - [ ] Perform signup → Event appears in GA4
  - [ ] Perform search → Event with query appears
  - [ ] View title → Event with title_id appears
  - [ ] Save favorite → Event appears

- [ ] **Event Parameters**:
  - [ ] User ID tracked correctly
  - [ ] Account type (buyer/creator) tracked
  - [ ] Tier tracked for buyers
  - [ ] Session ID tracked for chat events

### 9. Performance Testing

- [ ] **Page Load Times** (target < 2 seconds):
  - [ ] `/signin` page
  - [ ] `/buyers/chat` page
  - [ ] `/buyers/titles` page
  - [ ] `/buyers/titles/:id` detail page

- [ ] **Lighthouse Audit** (target scores):
  - [ ] Performance > 90
  - [ ] Accessibility > 95
  - [ ] Best Practices > 90
  - [ ] SEO > 90

- [ ] **Database Query Performance**:
  - [ ] Monitor Supabase dashboard for slow queries (> 1000ms)
  - [ ] Check database CPU usage (should be < 50% under normal load)

- [ ] **Load Testing** (optional but recommended):
  - [ ] Simulate 100 concurrent users
  - [ ] Monitor error rates (should be < 2%)
  - [ ] Monitor response times (P95 < 3 seconds)

### 10. Security Checks

- [ ] **Environment Variables**:
  - [ ] `.env` files NOT committed to git
  - [ ] All production env vars set in Vercel dashboard
  - [ ] Edge function secrets set in Supabase dashboard

- [ ] **API Keys**:
  - [ ] No API keys in client-side code
  - [ ] OpenAI API key only in edge function secrets
  - [ ] Stripe API keys (public & secret) properly separated

- [ ] **OAuth Configuration**:
  - [ ] Google OAuth app configured for production domain
  - [ ] Redirect URLs match production URLs
  - [ ] OAuth secrets secure (not exposed)

- [ ] **Database Security**:
  - [ ] RLS enabled on all tables ✅ (verified above)
  - [ ] Service role key never exposed to client
  - [ ] Anon key used for client operations only

---

## 🟡 IMPORTANT - Should Complete Before Launch

### Documentation Updates

- [ ] Update `STABILITY_AUDIT_REPORT.md` with actual Stripe webhook testing results
- [ ] Document Stripe webhook endpoint URL
- [ ] Document Pro tier feature list (what buyers get with Pro)
- [ ] Add migration verification notes

### Monitoring Setup

- [ ] **Error Tracking**:
  - [ ] Sign up for Sentry (or similar)
  - [ ] Install Sentry SDK in frontend
  - [ ] Configure error sampling (100% for first week)

- [ ] **Uptime Monitoring**:
  - [ ] Set up Pingdom or UptimeRobot
  - [ ] Monitor main dashboard URL
  - [ ] Monitor edge function endpoints
  - [ ] Alert if downtime > 1 minute

- [ ] **Email Monitoring**:
  - [ ] Track email send success rate
  - [ ] Alert if success rate < 95%
  - [ ] Monitor email delivery times

### Known Issues to Address

- [ ] **Chat page auto-reload** (Chat.tsx:478-484):
  - [ ] Investigate root cause
  - [ ] Remove reload if unnecessary
  - [ ] Document reason if necessary

- [ ] **OAuth callback complexity** (AuthCallbackSimple.tsx:65-105):
  - [ ] Monitor production logs for 2 weeks
  - [ ] Simplify if only first strategy ever succeeds
  - [ ] Current implementation works but may be over-defensive

---

## 🟢 NICE TO HAVE - Post-Launch Improvements

### Performance Optimizations

- [ ] Add React Query caching for title data
- [ ] Implement image CDN (Cloudflare Images or Cloudinary)
- [ ] Optimize bundle size with code splitting
- [ ] Increase health check interval from 30s to 60s

### Feature Enhancements

- [ ] Add rate limiting for chat (50/day basic, 200/day Pro)
- [ ] Add user-facing subscription management page
- [ ] Add email notifications for tier downgrades
- [ ] Add chat satisfaction feedback (thumbs up/down)

### Developer Experience

- [ ] Consolidate migration files (40+ files)
- [ ] Create migration manifest/index
- [ ] Add database backup verification
- [ ] Set up automated testing suite

---

## Launch Decision Matrix

### Ready to Launch If:
✅ All **CRITICAL** items completed (100%)
✅ Most **IMPORTANT** items completed (> 80%)
✅ Error Boundary tested and working
✅ Stripe webhook tested in production (or test mode verified)
✅ RLS policies verified manually
✅ No known security issues

### Delay Launch If:
🔴 Any **CRITICAL** security issues unresolved
🔴 Stripe integration not working
🔴 OAuth signup failing > 10% of the time
🔴 Database RLS policies not verified
🔴 User data exposure possible

---

## Launch Day Checklist

### Pre-Launch (Morning)
- [ ] Run final build: `npm run build:all`
- [ ] Verify all environment variables in Vercel
- [ ] Verify all edge function secrets in Supabase
- [ ] Test one complete buyer flow in production
- [ ] Test one complete creator flow in production
- [ ] Verify analytics are receiving events

### Launch (Deploy)
- [ ] Deploy to production
- [ ] Verify deployment successful (check Vercel dashboard)
- [ ] Test critical paths immediately after deploy:
  - [ ] Signin works
  - [ ] Signup works
  - [ ] Chat works
  - [ ] Title pages load

### Post-Launch (First Hour)
- [ ] Monitor error rates in Sentry
- [ ] Monitor Supabase dashboard (CPU, connections, slow queries)
- [ ] Monitor Vercel analytics (page views, errors)
- [ ] Test signup → welcome email → should arrive within 1 minute

### Post-Launch (First Day)
- [ ] Check email delivery rates (> 98%)
- [ ] Review GA4 events (signups, searches, title views)
- [ ] Monitor Stripe dashboard (if any signups)
- [ ] Review edge function logs for errors

### Post-Launch (First Week)
- [ ] Daily error rate review (target < 2%)
- [ ] Daily user signup review (buyer vs creator ratio)
- [ ] Monitor performance metrics (page load times)
- [ ] Review user feedback/support tickets
- [ ] Optimize based on actual usage patterns

---

## Success Metrics

### Week 1 Targets
- Error rate < 2%
- OAuth success rate > 95%
- Email delivery rate > 98%
- Page load times P95 < 3 seconds
- Chat response times P95 < 5 seconds
- Zero security incidents

### Month 1 Targets
- Weekly Active Users (WAU) growth
- Buyer signup rate
- Creator signup rate
- Pro tier conversion rate (if pricing launched)
- User retention (7-day, 30-day)

---

**Last Updated**: 2025-10-04
**Next Review**: After completing CRITICAL section
**Owner**: Development Team
