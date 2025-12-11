# Creator App Analytics Implementation Guide

**Last Updated**: 2025-12-03
**Status**: Implementation In Progress
**GTM Container**: `GTM-PZBC4XQT` (shared across all apps)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Status](#current-implementation-status)
3. [Architecture Overview](#architecture-overview)
4. [User Journey Funnels](#user-journey-funnels)
5. [Event Catalog](#event-catalog)
6. [Implementation Gaps](#implementation-gaps)
7. [Key Metrics & KPIs](#key-metrics--kpis)
8. [Implementation Priorities](#implementation-priorities)
9. [GTM Configuration](#gtm-configuration)
10. [Debug & Testing](#debug--testing)
11. [GA4 Reports & Dashboards](#ga4-reports--dashboards)
12. [Action Items Checklist](#action-items-checklist)

---

## Executive Summary

The Creator app uses Google Tag Manager (GTM) for analytics tracking with events pushed to `window.dataLayer`. While 40+ tracking functions are defined in `src/utils/analytics.ts`, only ~20% are actually implemented in the codebase.

### Critical Finding

The app's core value proposition—helping creators submit and manage titles—has **zero tracking**. We can see signups but have no visibility into:
- Whether users complete title submissions
- Where users drop off in the 5-step survey
- How often drafts are resumed vs abandoned
- What content creators engage with

### Quick Stats

| Metric | Value |
|--------|-------|
| Total tracking functions defined | 40+ |
| Functions actually implemented | ~8 |
| Implementation coverage | ~20% |
| Title funnel visibility | 0% |
| Auth tracking coverage | 83% |
| Billing tracking coverage | 80% |

---

## Current Implementation Status

### What IS Being Tracked

| Location | Event | Function Used |
|----------|-------|---------------|
| `SignUp.tsx:74` | Email signup | `trackSignup('email')` |
| `SignUp.tsx:90` | Signup error | `trackAuthError()` |
| `SignIn.tsx:73` | Email login | `trackLogin('email')` |
| `SignIn.tsx:90,94,112` | Login errors | `trackAuthError()` |
| `AuthCallback.tsx:192` | Google login | `trackLogin('google')` |
| `CompleteProfile.tsx:58` | Profile setup complete | `trackProfileComplete()` |
| `CompleteProfile.tsx:59` | Google signup | `trackSignup('google')` |
| `Plan.tsx:27` | Plan page view | `trackPlanView()` |
| `CheckoutModal.tsx:91` | Checkout started | `trackCheckoutStart()` |
| `PaymentSuccess.tsx:22` | Payment complete | `trackPaymentSuccess()` |
| `Billing.tsx:66` | Billing page view | `trackBillingView()` |

### What is NOT Being Tracked (Critical Gaps)

| Page/Feature | Missing Events | Impact |
|--------------|----------------|--------|
| **AddTitle.tsx** | Survey start, step progression, submission | Cannot measure activation rate |
| **Titles.tsx** | List views, draft interactions | No title lifecycle visibility |
| **TitleDetail.tsx** | Title views | Cannot measure engagement |
| **EditTitle.tsx** | Edit actions | No update tracking |
| **Home.tsx** | Content clicks, dashboard engagement | No engagement metrics |
| **Profile.tsx** | Profile updates | No settings tracking |
| **All Services** | API errors | No error visibility |

---

## Architecture Overview

### File Structure

```
apps/creator/src/
├── utils/
│   └── analytics.ts          # 250 lines - All tracking functions
├── hooks/
│   └── useAnalytics.ts       # 26 lines - Page view hook
├── components/
│   └── AnalyticsProvider.tsx # 29 lines - Initialization
└── [pages]                   # Where tracking should be called
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        GTM Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  index.html                                                      │
│  └── GTM Script (GTM-PZBC4XQT)                                  │
│      └── Initializes window.dataLayer                           │
│                                                                  │
│  App.tsx                                                         │
│  └── <AnalyticsProvider />                                      │
│      ├── initGA() → pushes initial config to dataLayer          │
│      └── useAnalytics() → tracks page views on route change     │
│                                                                  │
│  [Any Component]                                                 │
│  └── import { trackEvent } from '@/utils/analytics'             │
│      └── Pushes event object to window.dataLayer                │
│                                                                  │
│  GTM Container                                                   │
│  └── Triggers fire based on dataLayer events                    │
│      └── Tags send data to GA4 (G-XXXXXXXXXX)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GTM vs GA4 Note

The Creator app uses **GTM with dataLayer** (not direct GA4 gtag.js like Dashboard). This means:
- Events are pushed to `window.dataLayer`
- GTM triggers must be configured to capture these events
- GTM tags must be set up to send events to GA4

---

## User Journey Funnels

### Funnel A: Creator Onboarding → First Title Submission

This is the **most critical funnel** for measuring product success.

```
Stage                    Event                    Status      Priority
─────────────────────────────────────────────────────────────────────
1. Landing Page          page_view                ✅ Auto      -
2. Sign Up Page          page_view /signup        ✅ Auto      -
3. Complete Signup       sign_up                  ✅ Tracked   -
4. Profile Setup         profile_complete         ✅ Tracked   -
5. Dashboard View        page_view /home          ✅ Auto      -
6. Click "Add Title"     button_click             ❌ Missing   P1
7. Survey Step 1         survey_step_view         ❌ Missing   P0
8. Survey Step 2         survey_step_view         ❌ Missing   P0
9. Survey Step 3         survey_step_view         ❌ Missing   P0
10. Survey Step 4        survey_step_view         ❌ Missing   P0
11. Survey Step 5        survey_step_view         ❌ Missing   P0
12. Title Submitted      title_create             ❌ Missing   P0
```

**Key Question**: What % of signups successfully submit their first title?

**Current Answer**: Unknown (0% visibility)

### Funnel B: Title Lifecycle

```
Stage                    Event                    Status      Priority
─────────────────────────────────────────────────────────────────────
1. View Titles List      page_view /titles        ✅ Auto      -
2. Start New Draft       title_draft_start        ❌ Missing   P1
3. Auto-save Draft       title_save_draft         ❌ Missing   P2
4. Resume Draft          title_draft_resume       ❌ Missing   P1
5. Submit Draft          title_create             ❌ Missing   P0
6. View Title Detail     title_view               ❌ Missing   P1
7. Edit Title            title_edit               ❌ Missing   P1
8. Delete Draft          title_delete             ❌ Missing   P2
```

**Key Question**: How many drafts get abandoned vs completed?

### Funnel C: Subscription Conversion

```
Stage                    Event                    Status      Priority
─────────────────────────────────────────────────────────────────────
1. View Plan Page        plan_view                ✅ Tracked   -
2. Select Plan           plan_select              ❌ Missing   P2
3. Select Title          title_select_for_sub     ❌ Missing   P2
4. Begin Checkout        begin_checkout           ✅ Tracked   -
5. Complete Payment      purchase                 ✅ Tracked   -
6. View Billing          billing_view             ✅ Tracked   -
7. Cancel Subscription   subscription_cancel      ❌ Missing   P3
```

**Key Question**: What % of plan viewers convert to paid?

### Funnel D: Content Engagement

```
Stage                    Event                    Status      Priority
─────────────────────────────────────────────────────────────────────
1. View Dashboard        page_view /home          ✅ Auto      -
2. Click News Post       news_view                ❌ Missing   P2
3. Read News Article     page_view /news/*        ✅ Auto      -
4. Click Learning Post   learning_center_view     ❌ Missing   P2
5. Read Learning Article page_view /learning/*    ✅ Auto      -
```

---

## Event Catalog

### Complete List of Defined Events

All events include `app_section: 'creator'` automatically.

#### Authentication Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackSignup(method)` | `sign_up` | method, user_type | ✅ |
| `trackLogin(method)` | `login` | method, user_type | ✅ |
| `trackLogout()` | `custom_event` | action: logout | ❌ |
| `trackOAuthComplete(provider)` | `custom_event` | action: oauth_complete | ❌ |
| `trackProfileComplete()` | `custom_event` | action: profile_complete | ✅ |

#### Title Management Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackTitleCreate(titleId, format)` | `title_create` | title_id, content_format | ❌ |
| `trackTitleEdit(titleId)` | `custom_event` | action: title_edit | ❌ |
| `trackTitleDelete(titleId)` | `custom_event` | action: title_delete | ❌ |
| `trackTitleView(titleId)` | `custom_event` | action: title_view | ❌ |
| `trackTitleSaveDraft(step)` | `custom_event` | action: title_save_draft | ❌ |
| `trackSurveyStepComplete(step, name)` | `survey_step_complete` | step_number, step_name | ❌ |
| `trackDocumentUpload(type, titleId)` | `custom_event` | action: document_upload | ❌ |

#### Subscription & Billing Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackPlanView()` | `custom_event` | action: plan_view | ✅ |
| `trackCheckoutStart(plan, period, titleId)` | `begin_checkout` | plan_type, billing_period, title_id | ✅ |
| `trackPaymentSuccess(plan, period, amount)` | `purchase` | plan_type, billing_period, value, currency | ✅ |
| `trackBillingView()` | `custom_event` | action: billing_view | ✅ |
| `trackSubscriptionCancel(subId)` | `custom_event` | action: subscription_cancel | ❌ |

#### Profile & Settings Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackProfileUpdate(fields)` | `custom_event` | action: profile_update | ❌ |
| `trackProfileView()` | `custom_event` | action: profile_view | ❌ |

#### Content Engagement Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackNewsView(postId, title)` | `custom_event` | action: news_view | ❌ |
| `trackLearningCenterView(postId, title)` | `custom_event` | action: learning_center_view | ❌ |
| `trackNavigation(destination, source)` | `custom_event` | action: navigation | ❌ |
| `trackButtonClick(name, location)` | `custom_event` | action: button_click | ❌ |
| `trackExternalLink(url, text)` | `custom_event` | action: external_link_click | ❌ |

#### Error Tracking Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackError(message, location, code)` | `error` | error_message, error_location, error_code | ❌ |
| `trackAuthError(message, method)` | `error` | error_location: authentication | ✅ (partial) |
| `trackApiError(endpoint, message, status)` | `error` | error_location: api_* | ❌ |

#### Form Events

| Function | Event Name | Parameters | Implemented |
|----------|------------|------------|-------------|
| `trackFormSubmission(formName, success)` | `custom_event` | action: form_submit | ❌ |
| `trackFormError(form, field, message)` | `custom_event` | action: form_error | ❌ |

---

## Implementation Gaps

### Gap Analysis by Page

#### AddTitle.tsx (5-Step Survey) - **CRITICAL**

**Current state**: Zero tracking
**Impact**: Cannot measure activation, cannot identify drop-off points

**Events to add**:

```typescript
// 1. When survey loads (mount)
useEffect(() => {
  trackEvent('survey_start', 'title_management',
    currentDraftId ? 'resume' : 'new')
}, [])

// 2. When step changes
useEffect(() => {
  const stepNames = ['basic_info', 'story_details', 'narrative', 'materials', 'profile']
  trackSurveyStepComplete(currentStep, stepNames[currentStep - 1])
}, [currentStep])

// 3. When draft auto-saves
const { saveStatus } = useAutoSave({
  onSave: async (data) => {
    trackTitleSaveDraft(currentStep)
    // ... existing save logic
  }
})

// 4. When title is submitted
const onSubmit = async (data) => {
  // ... submission logic
  trackTitleCreate(newTitleId, data.content_format)
  trackFormSubmission('title_survey', true)
}
```

#### Titles.tsx - **HIGH PRIORITY**

**Current state**: Zero tracking
**Impact**: No visibility into title management behavior

**Events to add**:

```typescript
// 1. Track list view with counts
useEffect(() => {
  if (!loading) {
    trackEvent('titles_list_view', 'title_management',
      `titles:${titles.length},drafts:${drafts.length}`)
  }
}, [loading, titles.length, drafts.length])

// 2. Track draft resume
const handleDraftClick = (draftId: string) => {
  trackEvent('draft_resume', 'title_management', draftId)
  navigate(`/titles/add-title?draftId=${draftId}`)
}

// 3. Track draft deletion
const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
  // ... existing logic
  trackTitleDelete(draftId)
}
```

#### TitleDetail.tsx - **HIGH PRIORITY**

**Current state**: Zero tracking
**Impact**: No engagement visibility

**Events to add**:

```typescript
// Track title view
useEffect(() => {
  if (title?.title_id) {
    trackTitleView(title.title_id)
  }
}, [title?.title_id])

// Track edit button click
const handleEditClick = () => {
  trackButtonClick('edit_title', 'title_detail')
  navigate(`/titles/${title.title_id}/edit`)
}

// Track external link clicks
const handleViewOriginal = () => {
  trackExternalLink(title.title_url, 'view_original')
  window.open(title.title_url, '_blank')
}
```

#### Home.tsx - **MEDIUM PRIORITY**

**Events to add**:

```typescript
// Track content engagement
const handleNewsClick = (post: ContentPost) => {
  trackNewsView(post.id, post.title)
  navigate(`/news/${post.slug}`)
}

const handleLearningClick = (post: ContentPost) => {
  trackLearningCenterView(post.id, post.title)
  navigate(`/learning-center/${post.slug}`)
}

const handleAddTitleClick = () => {
  trackButtonClick('add_title', 'home_dashboard')
  navigate('/titles/add-title')
}
```

#### Profile.tsx - **MEDIUM PRIORITY**

**Events to add**:

```typescript
// Track profile view
useEffect(() => {
  trackProfileView()
}, [])

// Track profile update
const handleUpdateProfile = async () => {
  // ... existing logic
  const changedFields = Object.keys(formData).filter(
    key => formData[key] !== profile[key]
  )
  trackProfileUpdate(changedFields)
}

// Track logout
const handleSignOut = async () => {
  trackLogout()
  await signOut()
}
```

---

## Key Metrics & KPIs

### Business KPIs

| Metric | Definition | Events Required |
|--------|------------|-----------------|
| **Activation Rate** | % of signups that create first title | `sign_up` → `title_create` |
| **Survey Completion Rate** | % of started surveys that submit | `survey_start` → `title_create` |
| **Step Drop-off Rate** | % drop-off at each survey step | `survey_step_complete` by step |
| **Draft Abandonment Rate** | % of drafts never submitted | `title_save_draft` - `title_create` |
| **Time to First Title** | Duration from signup to first title | Timestamp comparison |
| **Subscription Conversion** | % of users that upgrade to paid | `sign_up` → `purchase` |
| **ARPU** | Average revenue per user | `purchase` value aggregation |

### User Experience Metrics

| Metric | Question Answered | Events Required |
|--------|-------------------|-----------------|
| Survey friction points | Which step loses most users? | `survey_step_complete` |
| Content engagement | What content do creators consume? | `news_view`, `learning_center_view` |
| Error frequency | Are errors causing churn? | `trackError()`, `trackApiError()` |
| Feature adoption | Which features are used? | Various feature-specific events |

### Funnel Calculations

**Activation Rate**:
```
Activation Rate = (Users with title_create) / (Users with sign_up) × 100
```

**Survey Completion Rate**:
```
Completion Rate = (survey_step_complete step=5) / (survey_step_complete step=1) × 100
```

**Step-by-Step Drop-off**:
```
Step N Drop-off = 1 - (step_N+1 users / step_N users)
```

---

## Implementation Priorities

### P0 - Critical (Implement Immediately)

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Add survey step tracking | `AddTitle.tsx` | 30 min | High - Enables funnel analysis |
| Add title creation event | `AddTitle.tsx` | 15 min | High - Measures activation |
| Add survey start event | `AddTitle.tsx` | 10 min | High - Funnel entry point |

### P1 - High Priority (This Week)

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Add title view tracking | `TitleDetail.tsx` | 15 min | Medium - Engagement visibility |
| Add draft resume tracking | `Titles.tsx` | 15 min | Medium - Draft lifecycle |
| Add title edit tracking | `EditTitle.tsx` | 15 min | Medium - Update behavior |
| Add "Add Title" button tracking | `Home.tsx`, `Titles.tsx` | 10 min | Medium - Intent measurement |

### P2 - Medium Priority (This Sprint)

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Add content engagement | `Home.tsx` | 20 min | Medium - Content ROI |
| Add profile tracking | `Profile.tsx` | 15 min | Low - Settings behavior |
| Add draft save tracking | `AddTitle.tsx` | 15 min | Medium - Draft patterns |
| Add plan selection tracking | `Plan.tsx` | 15 min | Medium - Conversion funnel |

### P3 - Lower Priority (Next Sprint)

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Add API error tracking | All services | 1 hour | Medium - Error visibility |
| Add form error tracking | All forms | 45 min | Low - UX friction |
| Add navigation tracking | Layout components | 30 min | Low - Navigation patterns |
| Add subscription cancel tracking | `Billing.tsx` | 15 min | Medium - Churn signals |

---

## GTM Configuration

### Required GTM Triggers

Create these triggers in the GTM console for container `GTM-PZBC4XQT`:

| Trigger Name | Trigger Type | Fire On |
|--------------|--------------|---------|
| `CE - Survey Step Complete` | Custom Event | Event equals `survey_step_complete` |
| `CE - Title Create` | Custom Event | Event equals `title_create` |
| `CE - Purchase` | Custom Event | Event equals `purchase` |
| `CE - Sign Up` | Custom Event | Event equals `sign_up` |
| `CE - Login` | Custom Event | Event equals `login` |
| `CE - Custom Event` | Custom Event | Event equals `custom_event` |
| `CE - Error` | Custom Event | Event equals `error` |

### Required GTM Variables

Create these Data Layer Variables:

| Variable Name | Data Layer Variable Name |
|---------------|-------------------------|
| `DLV - Event Action` | `event_action` |
| `DLV - Event Category` | `event_category` |
| `DLV - Event Label` | `event_label` |
| `DLV - Step Number` | `step_number` |
| `DLV - Step Name` | `step_name` |
| `DLV - Title ID` | `title_id` |
| `DLV - Content Format` | `content_format` |
| `DLV - Plan Type` | `plan_type` |
| `DLV - Billing Period` | `billing_period` |
| `DLV - Value` | `value` |
| `DLV - App Section` | `app_section` |
| `DLV - Error Message` | `error_message` |
| `DLV - Error Location` | `error_location` |

### Required GA4 Event Tags

| Tag Name | Event Name | Trigger | Parameters |
|----------|------------|---------|------------|
| `GA4 - Survey Step Complete` | `survey_step_complete` | CE - Survey Step Complete | step_number, step_name |
| `GA4 - Title Create` | `title_create` | CE - Title Create | title_id, content_format |
| `GA4 - Purchase` | `purchase` | CE - Purchase | plan_type, billing_period, value, currency |
| `GA4 - Sign Up` | `sign_up` | CE - Sign Up | method, user_type |
| `GA4 - Login` | `login` | CE - Login | method, user_type |
| `GA4 - Custom Event` | `{{DLV - Event Action}}` | CE - Custom Event | event_category, event_label |
| `GA4 - Error` | `error` | CE - Error | error_message, error_location, error_code |

### GA4 Measurement ID

Ensure your GA4 Configuration tag uses the correct Measurement ID:
- **Production**: `G-XXXXXXXXXX` (get from GA4 admin)
- **Staging**: Consider using a separate GA4 property or filter

---

## Debug & Testing

### Enable Debug Mode

Add this to `src/utils/analytics.ts`:

```typescript
// Add at top of file
const DEBUG_ANALYTICS = import.meta.env.DEV ||
  window.location.search.includes('debug_analytics=true')

// Modify the push helper
const pushToDataLayer = (eventData: Record<string, any>) => {
  if (DEBUG_ANALYTICS) {
    console.log('%c[Analytics]', 'color: #4CAF50; font-weight: bold;', eventData)
  }
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(eventData)
  }
}
```

### Testing Checklist

#### Local Testing

1. Open browser DevTools Console
2. Check for `[Analytics]` logs on each action
3. Verify `window.dataLayer` contains expected events:
   ```javascript
   // In console
   window.dataLayer.filter(e => e.event === 'survey_step_complete')
   ```

#### GTM Preview Mode

1. Go to GTM console → Preview
2. Enter your staging URL
3. Perform actions in the app
4. Verify triggers fire in GTM debugger

#### GA4 DebugView

1. Go to GA4 → Admin → DebugView
2. Enable debug mode in browser:
   ```javascript
   // Add to localStorage
   localStorage.setItem('gtm.debug', 'true')
   ```
3. Verify events appear in real-time

### Common Issues

| Issue | Solution |
|-------|----------|
| Events not appearing in dataLayer | Check if `window.dataLayer` exists before push |
| GTM triggers not firing | Verify event names match exactly (case-sensitive) |
| GA4 not receiving events | Check GA4 Configuration tag fires on all pages |
| Duplicate events | Ensure `useEffect` dependencies are correct |
| Events firing on mount only | Add proper dependency arrays to `useEffect` |

---

## GA4 Reports & Dashboards

### Recommended Explorations

#### 1. Onboarding Funnel Report

**Setup**:
- Technique: Funnel exploration
- Steps: sign_up → profile_complete → survey_step_complete (step 1) → title_create
- Breakdown: None
- Date range: Last 30 days

**Questions answered**:
- What % complete onboarding?
- Where is the biggest drop-off?

#### 2. Survey Step Analysis

**Setup**:
- Technique: Free-form exploration
- Dimensions: step_number, step_name
- Metrics: Event count, Total users
- Filter: Event name = survey_step_complete

**Questions answered**:
- Which step has highest drop-off?
- How long do users spend per step?

#### 3. Content Engagement Report

**Setup**:
- Technique: Free-form exploration
- Dimensions: page_path, event_name
- Metrics: Event count, Engagement time
- Filter: app_section = 'creator'

**Questions answered**:
- What content is most engaging?
- Are creators reading learning materials?

#### 4. Error Monitoring Report

**Setup**:
- Technique: Free-form exploration
- Dimensions: error_location, error_message
- Metrics: Event count
- Filter: Event name = error

**Questions answered**:
- What errors are users experiencing?
- Are errors increasing over time?

### Custom Dimensions to Create

In GA4 Admin → Custom Definitions:

| Dimension Name | Scope | Event Parameter |
|----------------|-------|-----------------|
| App Section | Event | app_section |
| Content Format | Event | content_format |
| Step Number | Event | step_number |
| Step Name | Event | step_name |
| Plan Type | Event | plan_type |
| Billing Period | Event | billing_period |
| Error Location | Event | error_location |

---

## Action Items Checklist

### Immediate (Today)

- [ ] Add debug logging to analytics.ts
- [ ] Implement survey step tracking in AddTitle.tsx
- [ ] Implement title creation event in AddTitle.tsx
- [ ] Test events appear in browser console

### This Week

- [ ] Implement title view tracking in TitleDetail.tsx
- [ ] Implement draft resume tracking in Titles.tsx
- [ ] Configure GTM triggers for new events
- [ ] Configure GA4 event tags in GTM
- [ ] Test full funnel in GTM Preview mode

### This Sprint

- [ ] Implement all P1 and P2 tracking
- [ ] Create GA4 custom dimensions
- [ ] Build onboarding funnel report
- [ ] Build survey step analysis report
- [ ] Document baseline metrics

### Next Sprint

- [ ] Implement P3 error tracking
- [ ] Create error monitoring dashboard
- [ ] Set up automated alerts for drop-offs
- [ ] Review and optimize based on data

---

## Appendix

### Environment Variables

Currently no analytics-specific environment variables. Consider adding:

```bash
# .env.example
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GTM_CONTAINER_ID=GTM-PZBC4XQT
VITE_ANALYTICS_DEBUG=false
```

### Related Documentation

- [Dashboard Analytics (GA4)](../../../docs/tracking/PHASE_1_ANALYTICS.md) - Dashboard app uses different approach
- [GTM Container Access](https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/XXXXXX) - GTM console
- [GA4 Property](https://analytics.google.com/analytics/web/#/pXXXXXXXX) - GA4 console

### Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-03 | Initial documentation created | Claude |
| - | - | - |

---

**Document Owner**: Engineering Team
**Review Cycle**: Monthly
**Next Review**: 2026-01-03
