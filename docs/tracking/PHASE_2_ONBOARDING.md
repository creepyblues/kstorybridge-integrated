# Phase 2: User Onboarding System
## PRD 2.1 Implementation - Days 3-4

**Status**: ⚪ Not Started (0%)
**Owner**: Frontend Team
**Duration**: 2 days (11 hours total)
**Target Start**: 2025-01-29
**Target Completion**: 2025-01-30

---

## 📊 Phase Overview

```
░░░░░░ 0% Complete
```

### Task Summary
- [ ] **Task 2.1**: Create Onboarding Components (⚪ Not Started - 6 hours)
- [ ] **Task 2.2**: Database Integration for Onboarding (⚪ Not Started - 3 hours)
- [ ] **Task 2.3**: Onboarding Analytics & Testing (⚪ Not Started - 2 hours)

---

## 📋 Task Breakdown

### Task 2.1: Create Onboarding Components
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 6 hours
**Owner**: Frontend Team

#### Description
Build interactive onboarding flow components to guide new users through key features. Tour should be < 30 seconds, skippable, and mobile responsive.

#### Dependencies
- **Requires**: Phase 1 Task 1.1 complete (`trackOnboardingStep()` must be available)
- **Enables**: User onboarding experience, completion tracking

#### Blockers
- 🔴 **Phase 1 Task 1.1**: Analytics tracking must be functional
- ⚠️ **Design Assets**: Ensure feature screenshots/illustrations available

---

#### Subtasks

- [ ] **2.1.1**: Create OnboardingModal component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingModal.tsx
  ```
  **Features**:
  - Welcome screen with KStoryBridge branding
  - "Take Tour" button (primary CTA)
  - "Skip" button (secondary, easy to find)
  - Smooth fade-in animation
  - Full-screen overlay (dim background)

  **Design Requirements**:
  - Use `StandardCard` component
  - Hanok-teal accent color for CTAs
  - SF Pro font (automatic)
  - Mobile responsive (stack buttons vertically)

- [ ] **2.1.2**: Create OnboardingFlow component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingFlow.tsx
  ```
  **Features**:
  - 4-step guided tour with tooltips
  - Progress indicator (1/4, 2/4, 3/4, 4/4)
  - "Next" and "Back" navigation
  - "Skip Tour" option on every step
  - Highlight UI elements with spotlight effect

  **State Management**:
  - Track current step (1-4)
  - Handle navigation (next/back/skip)
  - Call analytics on each step transition
  - Complete tour on step 4 finish

- [ ] **2.1.3**: Create OnboardingStepChat component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingStepChat.tsx
  ```
  **Content**:
  - Title: "Search with AI Chat"
  - Description: "Ask Jinu to find titles matching your needs. Try: 'Find rom-com webtoons with strong female leads'"
  - Visual: Highlight chat interface
  - Duration: ~5 seconds

  **Track**: `trackOnboardingStep(1, 'complete')`

- [ ] **2.1.4**: Create OnboardingStepSave component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingStepSave.tsx
  ```
  **Content**:
  - Title: "Save Titles You Love"
  - Description: "Click the heart icon to save titles to your favorites. Access them anytime from the Saved page."
  - Visual: Highlight heart icon and Saved menu
  - Duration: ~5 seconds

  **Track**: `trackOnboardingStep(2, 'complete')`

- [ ] **2.1.5**: Create OnboardingStepPitch component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingStepPitch.tsx
  ```
  **Content**:
  - Title: "Access Premium Content"
  - Description: "Pro members get unlimited pitch deck access. See detailed market analysis, character breakdowns, and more."
  - Visual: Highlight pitch deck section (with Pro badge)
  - Duration: ~10 seconds

  **Track**: `trackOnboardingStep(3, 'complete')`

- [ ] **2.1.6**: Create OnboardingStepContact component
  ```
  apps/dashboard-v2/src/components/onboarding/OnboardingStepContact.tsx
  ```
  **Content**:
  - Title: "Contact Creators Directly"
  - Description: "Pro members can contact creators directly to discuss licensing opportunities. Close deals faster."
  - Visual: Highlight "Contact Creator" button
  - Duration: ~10 seconds

  **Track**: `trackOnboardingStep(4, 'complete')`

- [ ] **2.1.7**: Create index.ts barrel export
  ```
  apps/dashboard-v2/src/components/onboarding/index.ts
  ```
  Export all onboarding components for easy import

---

#### Files to Create (7)

1. **`apps/dashboard-v2/src/components/onboarding/OnboardingModal.tsx`**
2. **`apps/dashboard-v2/src/components/onboarding/OnboardingFlow.tsx`**
3. **`apps/dashboard-v2/src/components/onboarding/OnboardingStepChat.tsx`**
4. **`apps/dashboard-v2/src/components/onboarding/OnboardingStepSave.tsx`**
5. **`apps/dashboard-v2/src/components/onboarding/OnboardingStepPitch.tsx`**
6. **`apps/dashboard-v2/src/components/onboarding/OnboardingStepContact.tsx`**
7. **`apps/dashboard-v2/src/components/onboarding/index.ts`**

---

#### Design Checklist

- [ ] Use existing design system (`StandardButton`, `StandardCard`)
- [ ] Follow color guidelines (no yellow, hanok-teal for CTAs)
- [ ] Mobile-first responsive design
- [ ] Smooth transitions (250ms duration)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Spotlight effect for highlighted elements

---

#### Testing Checklist

- [ ] Modal appears correctly on first login
- [ ] Tour completable in < 30 seconds
- [ ] Easy skip at any step
- [ ] Smooth animations
- [ ] Mobile responsive (iPhone, Android)
- [ ] Tablet responsive (iPad)
- [ ] Desktop responsive (1080p, 4K)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

#### Acceptance Criteria

- [x] All 6 step components created
- [x] OnboardingFlow orchestrates tour
- [x] OnboardingModal shows on first login
- [x] Tour completable in < 30 seconds
- [x] Easy skip at any step
- [x] Smooth animations and UX
- [x] Mobile responsive
- [x] Analytics tracking on each step

---

### Task 2.2: Database Integration for Onboarding
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 3 hours
**Owner**: Backend Team

#### Description
Create database infrastructure to track onboarding progress and completion status. Ensure modal only shows for new users who haven't completed tour.

#### Dependencies
- **Requires**: Task 2.1 (components must exist to test integration)
- **Enables**: Persistent onboarding state, restart tour feature

#### Blockers
- 🔴 **Task 2.1**: Components must be functional first
- ⚠️ **Database Access**: Need Supabase migration permissions

---

#### Subtasks

- [ ] **2.2.1**: Create database migration
  ```
  apps/dashboard-v2/supabase/migrations/[timestamp]_create_user_onboarding.sql
  ```
  **Schema**:
  ```sql
  CREATE TABLE user_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_started_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    current_step INTEGER DEFAULT 0,
    skipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX idx_user_onboarding_email ON user_onboarding(user_email);
  CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);

  -- RLS policies
  ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can read own onboarding"
    ON user_onboarding FOR SELECT
    USING (auth.email() = user_email);

  CREATE POLICY "Users can update own onboarding"
    ON user_onboarding FOR UPDATE
    USING (auth.email() = user_email);

  CREATE POLICY "Users can insert own onboarding"
    ON user_onboarding FOR INSERT
    WITH CHECK (auth.email() = user_email);
  ```

- [ ] **2.2.2**: Create onboarding service
  ```
  apps/dashboard-v2/src/services/onboardingService.ts
  ```
  **Functions**:
  - `getOnboardingStatus(userEmail: string)` - Check if onboarding complete
  - `startOnboarding(userEmail: string)` - Create onboarding record
  - `updateOnboardingStep(userEmail: string, step: number)` - Track progress
  - `completeOnboarding(userEmail: string)` - Mark as complete
  - `skipOnboarding(userEmail: string)` - Mark as skipped
  - `resetOnboarding(userEmail: string)` - Allow restart

- [ ] **2.2.3**: Integrate with auth flow
  **File to modify**: `apps/dashboard-v2/src/hooks/useAuth.tsx`
  - Check onboarding status on login
  - Store status in context for easy access
  - Trigger modal if not completed and not skipped

- [ ] **2.2.4**: Add modal trigger to BuyerHome
  **File to modify**: `apps/dashboard-v2/src/pages/buyers/Home.tsx`
  - Import OnboardingModal
  - Show if `!onboardingComplete && !onboardingSkipped`
  - Pass callbacks for start/skip/complete

- [ ] **2.2.5**: Add "Restart Tour" to Profile page
  **File to modify**: `apps/dashboard-v2/src/pages/buyers/Profile.tsx`
  - Add button in settings section
  - Call `resetOnboarding()` on click
  - Show success message

---

#### Files to Create (2)

1. **`apps/dashboard-v2/supabase/migrations/[timestamp]_create_user_onboarding.sql`**
2. **`apps/dashboard-v2/src/services/onboardingService.ts`**

#### Files to Modify (3)

3. **`apps/dashboard-v2/src/hooks/useAuth.tsx`**
4. **`apps/dashboard-v2/src/pages/buyers/Home.tsx`**
5. **`apps/dashboard-v2/src/pages/buyers/Profile.tsx`**

---

#### Testing Checklist

- [ ] Migration applies successfully
- [ ] Onboarding status persisted correctly
- [ ] Modal shows only to new users (not onboarded)
- [ ] Modal doesn't show after completion
- [ ] Modal doesn't show after skip
- [ ] Restart tour functional from Profile
- [ ] RLS policies prevent unauthorized access

---

#### Acceptance Criteria

- [x] Migration applied successfully
- [x] Onboarding service functional
- [x] Status checked on login
- [x] Modal shown only to new users
- [x] Restart tour working

---

### Task 2.3: Onboarding Analytics & Testing
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 2 hours
**Owner**: Engineering + QA

#### Description
Track onboarding events in GA4 and create analytics dashboard to monitor completion rates and drop-off points.

#### Dependencies
- **Requires**: Task 2.1 (components with tracking) + Task 2.2 (database integration)
- **Enables**: Data-driven onboarding optimization

#### Blockers
- 🔴 **Task 2.1 & 2.2**: Must be complete first
- 🔴 **Phase 1 Task 1.1**: Analytics tracking must be functional

---

#### Subtasks

- [ ] **2.3.1**: Verify onboarding events tracking
  **Events to verify**:
  - `trackOnboardingStep(1, 'start')` - Tour started
  - `trackOnboardingStep(1, 'complete')` - Step 1 complete
  - `trackOnboardingStep(2, 'complete')` - Step 2 complete
  - `trackOnboardingStep(3, 'complete')` - Step 3 complete
  - `trackOnboardingStep(4, 'complete')` - Step 4 complete (tour done)
  - `trackOnboardingStep(X, 'skip')` - Tour skipped at step X

  **Test**: Check GA4 Realtime for all events

- [ ] **2.3.2**: Create onboarding analytics queries
  **Metrics to track**:
  - Completion rate: `(completed / started) * 100%`
  - Drop-off by step: `(started_step_N - completed_step_N) / started_step_N`
  - Average time per step
  - Skip rate by step

  **Tool**: GA4 Exploration or custom dashboard

- [ ] **2.3.3**: Set up GA4 funnel for onboarding
  **Funnel steps**:
  1. Onboarding started (step 1 start)
  2. Step 1 complete
  3. Step 2 complete
  4. Step 3 complete
  5. Step 4 complete (tour done)

  **Goal**: Identify where users drop off most

- [ ] **2.3.4**: Create onboarding dashboard (stretch)
  ```
  apps/dashboard-v2/src/components/analytics/OnboardingDashboard.tsx
  ```
  **Features**:
  - Completion rate over time
  - Drop-off by step visualization
  - Average completion time
  - Skip rate trends

- [ ] **2.3.5**: Plan A/B test variations (future)
  **Variant A**: Full tour (4 steps, current)
  **Variant B**: Quick tour (2 steps, Chat + Save only)
  **Variant C**: No tour (control group)

  **Measure**: Engagement, retention, conversion

---

#### Files to Create (1)

1. **`apps/dashboard-v2/src/components/analytics/OnboardingDashboard.tsx`** (optional)

---

#### Testing Checklist

- [ ] All onboarding events tracked in GA4
- [ ] Events include correct parameters
- [ ] Funnel visible in GA4 Exploration
- [ ] Drop-off points identified
- [ ] Completion rate calculated correctly

---

#### Acceptance Criteria

- [x] All steps tracked in GA4
- [x] Onboarding funnel created
- [x] Analytics dashboard functional (or GA4 queries ready)
- [x] Completion rate > 60% (target)
- [x] Drop-off analysis complete

---

## 🎯 Phase 2 Success Criteria

### Must Have (Launch Blockers)
- [x] Onboarding modal shows on first login
- [x] Tour completable in < 30 seconds
- [x] Database persistence working
- [x] Analytics tracking functional
- [x] Restart tour option available

### Nice to Have (Post-Launch)
- [ ] Onboarding dashboard component
- [ ] A/B test framework for variations
- [ ] Advanced analytics (heatmaps, session recordings)

### Target Metrics
- **Completion rate**: > 60%
- **Average completion time**: < 30 seconds
- **Skip rate**: < 30%
- **Drop-off rate** (any step): < 15%

---

## 📁 Files Summary

### Files to Create (10)
- [ ] `OnboardingModal.tsx`
- [ ] `OnboardingFlow.tsx`
- [ ] `OnboardingStepChat.tsx`
- [ ] `OnboardingStepSave.tsx`
- [ ] `OnboardingStepPitch.tsx`
- [ ] `OnboardingStepContact.tsx`
- [ ] `index.ts` (barrel export)
- [ ] `create_user_onboarding.sql` (migration)
- [ ] `onboardingService.ts`
- [ ] `OnboardingDashboard.tsx` (optional)

### Files to Modify (3)
- [ ] `useAuth.tsx`
- [ ] `buyers/Home.tsx`
- [ ] `buyers/Profile.tsx`

**Total**: 13 files affected

---

## 🚨 Blockers & Risks

### Active Blockers
1. **Phase 1 Task 1.1 (Analytics Events)**
   - **Status**: 🔴 Blocking
   - **Action**: Must complete before starting Phase 2
   - **Impact**: Can't track onboarding without events

2. **Design Assets**
   - **Status**: ⚠️ Needs verification
   - **Action**: Verify feature screenshots/illustrations available
   - **Owner**: Design team

### Risks
1. **Onboarding Adds Friction to Signup**
   - **Impact**: Medium
   - **Probability**: Low
   - **Mitigation**: Optional tour, easy skip, < 30 seconds

2. **Low Completion Rate**
   - **Impact**: Medium
   - **Probability**: Medium
   - **Mitigation**: A/B test variations, optimize tour length

---

## 📝 Daily Progress Log

### 2025-01-29 (Day 3) - Target
- ⏳ Complete Task 2.1 (Components)
- ⏳ Start Task 2.2 (Database)

### 2025-01-30 (Day 4) - Target
- ⏳ Complete Task 2.2 (Database)
- ⏳ Complete Task 2.3 (Analytics)

---

## 🔗 Related Documentation

- 📄 [Master Progress Tracker](../PRD_2.1_PROGRESS.md)
- 📄 [PRD 2.1 Full Document](../PRD-2.1.md)
- 📄 [Phase 1: Analytics](./PHASE_1_ANALYTICS.md)

---

**Next Action**: Wait for Phase 1 Task 1.1 completion, then start Task 2.1.1 (OnboardingModal component)

---

*Last updated: 2025-11-02*
