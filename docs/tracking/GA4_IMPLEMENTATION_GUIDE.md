# GA4 Implementation Guide
## Complete Analytics Setup for KStoryBridge Dashboard

**Created**: 2025-12-03
**Status**: ✅ Fully Implemented
**GA4 Measurement ID**: `G-DWL6MV0MC2`

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Funnel Definitions](#funnel-definitions)
4. [Implementation Details](#implementation-details)
5. [Testing Guide](#testing-guide)
6. [GA4 Dashboard Setup](#ga4-dashboard-setup)
7. [Insights & Analysis](#insights--analysis)
8. [Maintenance](#maintenance)

---

## Overview

### What Was Implemented
A comprehensive GA4 (Google Analytics 4) tracking system covering 5 key user funnels:

1. **Authentication Funnel** - Signup/Signin flows
2. **Title Discovery Funnel** - Browse → Search → View → Save
3. **AI Chat Funnel** - Chat interactions with Jinu
4. **Comps Navigator Funnel** - Hollywood comp searches
5. **Checkout Funnel** - Subscription conversion

### Business Goals
- Track user acquisition and activation
- Measure feature adoption (Chat, Comps Navigator)
- Optimize conversion to paid tiers
- Identify drop-off points in user journeys

---

## Architecture

### Files Structure
```
apps/dashboard/
├── src/
│   ├── utils/
│   │   └── analytics.ts          # Core tracking utility (~720 lines)
│   ├── main.tsx                  # GA4 initialization
│   └── pages/
│       ├── auth/
│       │   ├── SignUp.tsx        # Signup tracking
│       │   └── SignIn.tsx        # Signin tracking
│       └── buyers/
│           ├── Titles.tsx        # Search tracking
│           ├── TitleDetail.tsx   # Detail + favorite tracking
│           ├── Chat.tsx          # Chat message tracking
│           ├── CompsNavigator.tsx # Comps search tracking
│           ├── Plan.tsx          # Checkout start tracking
│           ├── Checkout.tsx      # Checkout error tracking
│           └── CheckoutSuccess.tsx # Conversion tracking
├── .env.local                    # GA4 measurement ID
└── docs/tracking/
    ├── PHASE_1_ANALYTICS.md      # Status documentation
    └── GA4_IMPLEMENTATION_GUIDE.md # This file
```

### Data Flow
```
User Action → trackFunction() → gtag('event', ...) → GA4 → Reports
```

### Environment Configuration

**Development** (`.env.local`):
```bash
VITE_GA_MEASUREMENT_ID=G-DWL6MV0MC2
VITE_AUTH_DEBUG=true  # Enables console logging of events
```

**Production** (Vercel Environment Variables):
```bash
VITE_GA_MEASUREMENT_ID=G-DWL6MV0MC2
```

---

## Funnel Definitions

### Funnel 1: Authentication

**Goal**: Track signup/signin completion and identify drop-off points

| Step | Event | Parameters |
|------|-------|------------|
| 1 | `signup` | action: 'form_viewed', method: 'email'/'google' |
| 2 | `signup` | action: 'attempted', method, role |
| 3 | `signup` | action: 'completed', method, role |
| - | `signup` | action: 'error', method, error |

**Key Metrics**:
- Signup completion rate = completed / attempted
- OAuth vs Email preference
- Error rate by type

**Code Location**: `src/pages/auth/SignUp.tsx`, `src/pages/auth/SignIn.tsx`

---

### Funnel 2: Title Discovery

**Goal**: Understand how users find and engage with titles

| Step | Event | Parameters |
|------|-------|------------|
| 1 | `page_view` | page: '/buyers/titles', title: 'Discover Titles' |
| 2 | `feature_usage` | feature: 'titles_browse' |
| 3 | `title_search` | query, result_count, search_type (vector/pagination) |
| 4 | `title_detail_view` | title_id, title_name, source, genre, has_pitch |
| 5 | `favorite` | action: 'add'/'remove', title_id, title_name, source |

**Key Metrics**:
- Searches per session
- Search → Detail view rate
- Detail view → Favorite rate
- Popular search queries

**Code Locations**:
- `src/pages/buyers/Titles.tsx` - Search tracking
- `src/pages/buyers/TitleDetail.tsx` - Detail + favorite tracking

---

### Funnel 3: AI Chat (Jinu)

**Goal**: Measure chat engagement and title discovery via AI

| Step | Event | Parameters |
|------|-------|------------|
| 1 | `page_view` | page: '/buyers/chat', title: 'AI Chat - Jinu' |
| 2 | `feature_usage` | feature: 'ai_chat' |
| 3 | `chat_message` | action: 'sent', message_length |
| 4 | `chat_message` | action: 'received', message_length, titles_returned, response_time_ms |
| 5 | `chat_title_click` | title_id, title_name, position |

**Key Metrics**:
- Messages per session
- Average response time
- Titles clicked per chat
- Click position distribution

**Code Location**: `src/pages/buyers/Chat.tsx`

---

### Funnel 4: Comps Navigator

**Goal**: Track Hollywood comp search feature adoption

| Step | Event | Parameters |
|------|-------|------------|
| 1 | `page_view` | page: '/buyers/comps-navigator', title: 'Comps Navigator' |
| 2 | `feature_usage` | feature: 'comps_navigator' |
| 3 | `comps_search` | comp_titles[], result_count, processing_time_ms |
| 4 | `comps_result_click` | title_id, title_name, match_score, position |

**Key Metrics**:
- Feature adoption rate
- Searches per user
- Popular comp combinations
- Result click-through rate

**Code Location**: `src/pages/buyers/CompsNavigator.tsx`

---

### Funnel 5: Checkout/Conversion

**Goal**: Optimize subscription conversion

| Step | Event | Parameters |
|------|-------|------------|
| 1 | `page_view` | page: '/buyers/plan', title: 'Choose Your Plan' |
| 2 | `feature_usage` | feature: 'plan_page_view' |
| 3 | `checkout` | action: 'started', tier, value |
| 4a | `checkout` | action: 'completed', tier, value |
| 4b | `checkout` | action: 'cancelled', tier |
| 4c | `checkout` | action: 'error', tier, error |
| 5 | `subscription_purchased_[tier]` | value, currency |

**Key Metrics**:
- Plan page → Checkout started rate
- Checkout completion rate
- Revenue by tier
- Error rate and types

**Code Locations**:
- `src/pages/buyers/Plan.tsx` - Checkout start
- `src/pages/buyers/Checkout.tsx` - Error/cancel
- `src/pages/buyers/CheckoutSuccess.tsx` - Completion

---

## Implementation Details

### Tracking Function Signatures

```typescript
// Authentication
trackSignup(action: 'form_viewed' | 'attempted' | 'completed' | 'error',
            method: 'email' | 'google',
            metadata?: Record<string, unknown>)

trackSignin(action: 'form_viewed' | 'attempted' | 'completed' | 'error',
            method: 'email' | 'google',
            metadata?: Record<string, unknown>)

// Title Discovery
trackTitleSearch(query: string, resultCount: number,
                 searchType: 'vector' | 'pagination' | 'filter')

trackTitleDetailView(titleId: string, titleName: string,
                     source: 'search' | 'chat' | 'comps' | 'saved' | 'featured' | 'direct',
                     metadata?: Record<string, unknown>)

trackFavorite(action: 'add' | 'remove', titleId: string, titleName: string,
              source: 'detail' | 'search' | 'chat' | 'comps' | 'saved')

// AI Chat
trackChatMessage(action: 'sent' | 'received' | 'error',
                 messageLength?: number, titlesReturned?: number, responseTimeMs?: number)

trackChatTitleClick(titleId: string, titleName: string, position: number)

// Comps Navigator
trackCompsSearch(compTitles: string[], resultCount: number, processingTimeMs: number)

trackCompsResultClick(titleId: string, titleName: string, matchScore: number, position: number)

// Checkout
trackCheckout(action: 'started' | 'completed' | 'cancelled' | 'error',
              tier: string, value?: number, metadata?: Record<string, unknown>)

// General
trackPageView(page: string, title: string)
trackFeatureUsage(feature: string, metadata?: Record<string, unknown>)
trackConversion(eventName: string, value?: number, currency?: string)
```

### Source Tracking Pattern

The `TitleDetail` page tracks where users came from:

```typescript
// In TitleDetail.tsx
const getViewSource = (): 'search' | 'chat' | 'comps' | 'saved' | 'featured' | 'direct' => {
  const state = location.state as { from?: string } | null;
  if (state?.from === 'chat') return 'chat';
  if (state?.from === 'comps') return 'comps';
  // ... etc
  return 'direct';
};

// Navigation with source tracking
navigate(`/buyers/titles/${titleId}`, { state: { from: 'chat' } });
```

---

## Testing Guide

### Development Testing

1. **Enable debug mode** in `.env.local`:
   ```bash
   VITE_AUTH_DEBUG=true
   ```

2. **Open browser console** and look for `[Analytics]` logs:
   ```
   [Analytics] GA4 initialized (G-DWL6...)
   [Analytics] signup { action: 'form_viewed', method: 'email' }
   [Analytics] title_search { query: 'romance', result_count: 15 }
   ```

3. **Test each funnel**:
   - Sign up with new account
   - Search for titles
   - View title details and favorite
   - Send chat messages
   - Search with comps
   - Start checkout flow

### Production Testing

1. **GA4 Realtime Reports**:
   - Go to https://analytics.google.com/
   - Navigate to Reports → Realtime
   - Perform actions in production app
   - Verify events appear within 30 seconds

2. **Debug View** (requires GA4 DebugView extension):
   - Install GA Debugger Chrome extension
   - Enable debug mode
   - View detailed event parameters

### Verification Checklist

- [ ] GA4 loads on page (check `window.gtag` exists)
- [ ] Signup events fire correctly
- [ ] Signin events fire correctly
- [ ] Title search tracks query and results
- [ ] Title detail view includes source
- [ ] Favorites track add/remove
- [ ] Chat messages track send/receive
- [ ] Comps search tracks comp titles
- [ ] Checkout tracks started/completed/error

---

## GA4 Dashboard Setup

### Step 1: Create Custom Funnels

In GA4 Dashboard → Explore → Funnel Exploration:

**Authentication Funnel**:
```
Step 1: signup (action = form_viewed)
Step 2: signup (action = attempted)
Step 3: signup (action = completed)
```

**Discovery Funnel**:
```
Step 1: page_view (page contains '/titles')
Step 2: title_search
Step 3: title_detail_view
Step 4: favorite (action = add)
```

**Chat Funnel**:
```
Step 1: page_view (page contains '/chat')
Step 2: chat_message (action = sent)
Step 3: chat_message (action = received)
Step 4: chat_title_click
```

**Conversion Funnel**:
```
Step 1: page_view (page contains '/plan')
Step 2: checkout (action = started)
Step 3: checkout (action = completed)
```

### Step 2: Set Up Conversion Events

In GA4 → Admin → Events → Mark as conversion:
- `signup` (action = completed)
- `checkout` (action = completed)
- `subscription_purchased_pro`
- `subscription_purchased_suite`

### Step 3: Create Custom Dimensions

In GA4 → Admin → Custom definitions:

| Dimension | Parameter | Scope |
|-----------|-----------|-------|
| Search Query | query | Event |
| Search Type | search_type | Event |
| Title Source | source | Event |
| Tier | tier | Event |
| Feature | feature | Event |

### Step 4: Set Up Automated Reports

Create scheduled reports for:
- Weekly signup/signin metrics
- Weekly feature adoption (Chat, Comps)
- Weekly conversion metrics
- Monthly revenue by tier

---

## Insights & Analysis

### Key Questions to Answer

**User Acquisition**:
- What's our signup completion rate?
- Do OAuth users convert better than email users?
- Where do users drop off in signup?

**Engagement**:
- How many searches do users perform per session?
- What's the average time to first search?
- Which features have highest adoption?

**Discovery**:
- What are the most popular search queries?
- Do chat recommendations lead to more favorites?
- Which source drives most title detail views?

**Conversion**:
- What's the plan page → checkout rate?
- How many users abandon at checkout?
- What's our revenue per tier?

### Example GA4 Queries

**Signup Completion Rate**:
```
Events: signup
Filter: action = attempted vs action = completed
Metric: Event count
Calculate: completed / attempted * 100
```

**Feature Adoption**:
```
Events: feature_usage
Dimension: feature
Metric: Event count, Users
Time: Last 30 days
```

**Search to Detail Conversion**:
```
Funnel steps:
1. title_search
2. title_detail_view
Metric: Conversion rate
```

---

## Maintenance

### Adding New Events

1. Add tracking function to `src/utils/analytics.ts`:
   ```typescript
   export const trackNewEvent = (param1: string, param2: number): void => {
     safeGtag('event', 'new_event', {
       param1,
       param2,
       timestamp: new Date().toISOString(),
     });
   };
   ```

2. Import and call in component:
   ```typescript
   import { trackNewEvent } from '@/utils/analytics';

   // In event handler
   trackNewEvent('value1', 123);
   ```

3. Update documentation in this file

### Debugging Issues

**Events not appearing**:
1. Check `VITE_GA_MEASUREMENT_ID` is set
2. Verify `initializeAnalytics()` is called in `main.tsx`
3. Check browser console for errors
4. Verify ad blockers aren't blocking GA

**Wrong event parameters**:
1. Check parameter names match function signature
2. Verify data types (string vs number)
3. Test in development with console logging

### Monthly Review Checklist

- [ ] Check event volume is normal
- [ ] Review funnel conversion rates
- [ ] Identify any broken tracking
- [ ] Review new features needing tracking
- [ ] Update documentation if needed

---

## Related Documentation

- [PHASE_1_ANALYTICS.md](./PHASE_1_ANALYTICS.md) - Status overview
- [Dashboard CLAUDE.md](../../apps/dashboard/CLAUDE.md) - App documentation
- [GA4 Help Center](https://support.google.com/analytics/) - Official docs

---

*Last updated: 2025-12-03*
