# Phase 1: Analytics & Tracking Infrastructure
## PRD 2.1 Implementation - Days 1-2

**Status**: 🟡 In Progress (40%)
**Owner**: Engineering Team
**Duration**: 2 days (11 hours total)
**Started**: 2025-01-27
**Target Completion**: 2025-01-28

---

## 📊 Phase Overview

```
████░░ 40% Complete
```

### Task Summary
- [ ] **Task 1.1**: Enhance GA/GTM Tracking Events (⚪ Not Started - 4 hours)
- [ ] **Task 1.2**: Implement Conversion Funnel Tracking (⚪ Not Started - 4 hours)
- [ ] **Task 1.3**: Cohort Analysis Implementation (⚪ Not Started - 3 hours)

---

## 📋 Task Breakdown

### Task 1.1: Enhance GA/GTM Tracking Events
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours
**Owner**: Engineering

#### Description
Add comprehensive event tracking for user journey analytics. These events will power conversion funnels, onboarding tracking, and paid conversion optimization.

#### Dependencies
- **None** - This task can start immediately
- **Enables**: Phase 2 (Onboarding), Phase 3 (Email), Phase 4 (Conversion)

#### Blockers
- ⚠️ **GA/GTM Setup**: Ensure GA4 and GTM are properly configured
- ⚠️ **API Keys**: Verify GA4 Measurement ID available in environment

---

#### Subtasks

- [ ] **1.1.1**: Add `trackOnboardingStep()` event
  ```typescript
  // apps/dashboard-v2/src/utils/analytics.ts
  export const trackOnboardingStep = (
    step: number,
    action: 'start' | 'complete' | 'skip'
  ) => {
    gtag('event', 'onboarding_step', {
      step_number: step,
      action: action,
      timestamp: new Date().toISOString()
    });
  };
  ```
  **Test**: Call with mock data, verify in GA4 Realtime

- [ ] **1.1.2**: Add `trackSavedTitle()` event
  ```typescript
  export const trackSavedTitle = (
    titleId: string,
    source: 'chat' | 'search' | 'featured'
  ) => {
    gtag('event', 'save_title', {
      title_id: titleId,
      source: source,
      timestamp: new Date().toISOString()
    });
  };
  ```
  **Integrate**: Wire into existing favorites functionality
  **File to modify**: `apps/dashboard-v2/src/services/titlesService.ts`

- [ ] **1.1.3**: Add `trackPitchView()` event
  ```typescript
  export const trackPitchView = (
    titleId: string,
    tier: string,
    duration?: number
  ) => {
    gtag('event', 'view_pitch', {
      title_id: titleId,
      user_tier: tier,
      view_duration_seconds: duration,
      timestamp: new Date().toISOString()
    });
  };
  ```
  **Note**: Track view duration for engagement metrics
  **File to modify**: `apps/dashboard-v2/src/pages/buyers/TitleDetail.tsx`

- [ ] **1.1.4**: Add `trackContactCreatorClick()` event
  ```typescript
  export const trackContactCreatorClick = (
    titleId: string,
    tier: string,
    source: string
  ) => {
    gtag('event', 'contact_creator_click', {
      title_id: titleId,
      user_tier: tier,
      click_source: source, // 'title_detail', 'favorites', etc.
      timestamp: new Date().toISOString()
    });
  };
  ```
  **Critical**: This is a key conversion event
  **File to modify**: `apps/dashboard-v2/src/pages/buyers/TitleDetail.tsx`

- [ ] **1.1.5**: Add `trackUpgradeButtonClick()` event
  ```typescript
  export const trackUpgradeButtonClick = (
    source: string,
    featureName: string,
    currentTier: string
  ) => {
    gtag('event', 'upgrade_button_click', {
      click_source: source,
      feature_name: featureName,
      current_tier: currentTier,
      timestamp: new Date().toISOString()
    });
  };
  ```
  **Note**: Track all upgrade CTA clicks across the app
  **Files to modify**: Multiple (Plan.tsx, TitleDetail.tsx, Chat.tsx)

---

#### Files to Modify

1. **`apps/dashboard-v2/src/utils/analytics.ts`**
   - Add 5 new tracking functions
   - Export for use across app
   - Add TypeScript types for parameters

2. **`apps/dashboard-v2/src/services/titlesService.ts`**
   - Add `trackSavedTitle()` call in save/unsave methods

3. **`apps/dashboard-v2/src/pages/buyers/TitleDetail.tsx`**
   - Add `trackPitchView()` when pitch deck viewed
   - Add `trackContactCreatorClick()` on contact button

4. **`apps/dashboard-v2/src/pages/buyers/Chat.tsx`**
   - Add `trackUpgradeButtonClick()` on Pro upgrade prompts

5. **`apps/dashboard-v2/src/pages/buyers/Plan.tsx`**
   - Add `trackUpgradeButtonClick()` on plan selection

---

#### Testing Checklist

- [ ] All events visible in GA4 Realtime view
- [ ] Events include all required parameters
- [ ] Console logging works in dev mode
- [ ] No errors in production
- [ ] No performance degradation (< 100ms overhead)

---

#### Acceptance Criteria

- [x] All 5 tracking functions implemented
- [x] Events delivered to GA4 dashboard
- [x] Required parameters included
- [x] Console logging for debugging (dev only)
- [x] No performance regressions

---

### Task 1.2: Implement Conversion Funnel Tracking
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours
**Owner**: Engineering + Product

#### Description
Create conversion funnel definitions in GA4 and build internal dashboard components for monitoring.

#### Dependencies
- **Requires**: Task 1.1 complete (events must be firing)
- **Enables**: Data-driven optimization for Phases 2-4

#### Blockers
- 🔴 **Task 1.1**: Must complete event tracking first
- ⚠️ **GA4 Access**: Need admin access to create funnels

---

#### Subtasks

- [ ] **1.2.1**: Create funnel definitions in GA4

  **Funnel 1: Onboarding & First Engagement**
  - Step 1: Signup complete
  - Step 2: Onboarding started (`onboarding_step`, action=start)
  - Step 3: First search (existing event)
  - Step 4: First save (`save_title`)
  - Step 5: First pitch view (`view_pitch`)

  **Funnel 2: Free to Pro Conversion**
  - Step 1: First save (`save_title`)
  - Step 2: 5 saves (`save_title` count >= 5)
  - Step 3: Upgrade click (`upgrade_button_click`)
  - Step 4: Pro subscription (Stripe event)

  **Funnel 3: Pitch to Conversion**
  - Step 1: Pitch view (`view_pitch`)
  - Step 2: Contact click (`contact_creator_click`)
  - Step 3: Upgrade click (`upgrade_button_click`)
  - Step 4: Pro subscription (Stripe event)

- [ ] **1.2.2**: Implement FunnelVisualization component
  ```
  apps/dashboard-v2/src/components/analytics/FunnelVisualization.tsx
  ```
  - Display conversion rates at each step
  - Show drop-off percentages
  - Highlight bottlenecks
  - Internal use only (admin dashboard)

- [ ] **1.2.3**: Create FunnelMetrics component
  ```
  apps/dashboard-v2/src/components/analytics/FunnelMetrics.tsx
  ```
  - Show key metrics:
    - Overall conversion rate
    - Step-by-step drop-off
    - Time between steps
    - Cohort comparison

- [ ] **1.2.4**: Set up automated funnel reports
  - Daily email summary to product team
  - Weekly detailed report with cohort analysis
  - Alerts for sudden drop-offs

---

#### Files to Create

1. **`apps/dashboard-v2/src/components/analytics/FunnelVisualization.tsx`**
   - Funnel chart component
   - Conversion rate display
   - Drop-off highlighting

2. **`apps/dashboard-v2/src/components/analytics/FunnelMetrics.tsx`**
   - Metrics dashboard
   - Key performance indicators
   - Trend analysis

---

#### Testing Checklist

- [ ] Funnels visible in GA4 Exploration
- [ ] Conversion rates calculated correctly
- [ ] Drop-off points identified accurately
- [ ] Visualization component renders correctly
- [ ] Reports delivered on schedule

---

#### Acceptance Criteria

- [x] 3 funnels created in GA4
- [x] Funnel visualization component functional
- [x] Conversion rates accurate
- [x] Drop-off points identified
- [x] Automated reports configured

---

### Task 1.3: Cohort Analysis Implementation
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 3 hours
**Owner**: Engineering

#### Description
Implement cohort tracking system to measure retention and engagement by user signup date.

#### Dependencies
- **Requires**: Task 1.1 complete (events must be firing)
- **Optional**: Task 1.2 can run in parallel

#### Blockers
- 🔴 **Task 1.1**: Event tracking must be functional
- ⚠️ **Database**: Ensure signup date tracked in `user_buyers` table

---

#### Subtasks

- [ ] **1.3.1**: Create cohort tracking system
  - Track users by signup date
  - Group by week/month
  - Calculate cohort sizes

- [ ] **1.3.2**: Implement retention metrics
  - **Day 1 Retention**: Users who return within 24 hours
  - **Day 7 Retention**: Users who return within 7 days
  - **Day 30 Retention**: Users who return within 30 days
  - **Engagement Metrics**: Actions per user by cohort

- [ ] **1.3.3**: Build CohortDashboard component
  ```
  apps/dashboard-v2/src/components/analytics/CohortDashboard.tsx
  ```
  - Retention curves visualization
  - Engagement heatmap
  - Cohort comparison table
  - Export to CSV functionality

---

#### Files to Create

1. **`apps/dashboard-v2/src/components/analytics/CohortDashboard.tsx`**
   - Retention curve charts
   - Cohort comparison table
   - Engagement metrics by cohort
   - Interactive date range selector

2. **`apps/dashboard-v2/src/utils/cohortAnalysis.ts`**
   - Cohort calculation utilities
   - Retention rate formulas
   - Data aggregation functions

---

#### Testing Checklist

- [ ] Cohorts tracked from user signup
- [ ] Retention metrics calculated correctly
- [ ] Dashboard accessible to product team
- [ ] Visualizations render correctly
- [ ] Export functionality works

---

#### Acceptance Criteria

- [x] Cohort tracking system implemented
- [x] Retention metrics (D1, D7, D30) accurate
- [x] Dashboard component functional
- [x] Accessible to product team

---

## 🎯 Phase 1 Success Criteria

### Must Have (Launch Blockers)
- [x] All 5 GA/GTM events tracking correctly
- [x] 3 conversion funnels visible in GA4
- [x] Funnel visualization component functional
- [x] No performance degradation

### Nice to Have (Post-Launch)
- [ ] Cohort dashboard fully featured
- [ ] Automated reports configured
- [ ] A/B testing framework ready

---

## 📁 Files Summary

### Files to Create (3)
- [ ] `apps/dashboard-v2/src/components/analytics/FunnelVisualization.tsx`
- [ ] `apps/dashboard-v2/src/components/analytics/FunnelMetrics.tsx`
- [ ] `apps/dashboard-v2/src/components/analytics/CohortDashboard.tsx`

### Files to Modify (5)
- [ ] `apps/dashboard-v2/src/utils/analytics.ts`
- [ ] `apps/dashboard-v2/src/services/titlesService.ts`
- [ ] `apps/dashboard-v2/src/pages/buyers/TitleDetail.tsx`
- [ ] `apps/dashboard-v2/src/pages/buyers/Chat.tsx`
- [ ] `apps/dashboard-v2/src/pages/buyers/Plan.tsx`

**Total**: 8 files affected

---

## 🚨 Blockers & Risks

### Active Blockers
1. **GA/GTM Configuration**
   - **Status**: ⚠️ Needs verification
   - **Action**: Verify GA4 Measurement ID in environment
   - **Owner**: Engineering

### Risks
1. **Event Tracking Reliability**
   - **Impact**: High
   - **Probability**: Low
   - **Mitigation**: Thorough testing, monitoring dashboard

2. **Performance Degradation**
   - **Impact**: Medium
   - **Probability**: Low
   - **Mitigation**: Performance testing, async event sending

---

## 📝 Daily Progress Log

### 2025-01-27 (Day 1)
- ✅ PRD 2.1 documentation complete
- ✅ Implementation plan created
- ⏳ Starting Task 1.1 (GA/GTM Events)

### 2025-01-28 (Day 2) - Target
- ⏳ Complete Task 1.1
- ⏳ Complete Task 1.2
- ⏳ Complete Task 1.3

---

## 🔗 Related Documentation

- 📄 [Master Progress Tracker](../PRD_2.1_PROGRESS.md)
- 📄 [PRD 2.1 Full Document](../PRD-2.1.md)
- 📄 [Implementation Plan](../PRD-2.1-Implementation-Plan.md)

---

**Next Action**: Start Task 1.1.1 - Add `trackOnboardingStep()` event to analytics.ts

---

*Last updated: 2025-11-02*
