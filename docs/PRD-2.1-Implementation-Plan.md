# PRD 2.1 Implementation Plan
## KStoryBridge Buyer Dashboard: User Engagement & Paid Conversion Optimization

**Document Status**: ACTIVE
**Version**: 2.1
**Last Updated**: 2025-01-27
**Target Completion**: 10 days

---

## Quick Links
- [PRD 2.1 Full Document](./PRD-2.1.md)
- [Progress Dashboard](#progress-dashboard)
- [Current Sprint](#current-sprint)

---

## Progress Dashboard

### Overall Progress: 20% Complete (2/10 days)

| Phase | Status | Progress | Start Date | Target Date | Actual Date |
|-------|--------|----------|------------|-------------|-------------|
| Phase 1: Analytics & Tracking | 🟡 In Progress | 40% | 2025-01-27 | 2025-01-28 | - |
| Phase 2: User Onboarding | ⚪ Not Started | 0% | 2025-01-29 | 2025-01-30 | - |
| Phase 3: Email Re-engagement | ⚪ Not Started | 0% | 2025-01-31 | 2025-02-01 | - |
| Phase 4: Paid Conversion | ⚪ Not Started | 0% | 2025-02-02 | 2025-02-04 | - |
| Phase 5: Documentation | 🟢 Complete | 100% | 2025-01-27 | 2025-01-27 | 2025-01-27 |

**Legend**: 🟢 Complete | 🟡 In Progress | 🔴 Blocked | ⚪ Not Started

---

## Phase 1: Analytics & Tracking Infrastructure
**Duration**: 2 days (Days 1-2)
**Status**: 🟡 In Progress (40%)
**Owner**: Engineering Team

### Task 1.1: Enhance GA/GTM Tracking Events
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours

#### Subtasks
- [ ] Add `trackOnboardingStep()` event
  - Parameters: `step: number`, `action: 'start' | 'complete' | 'skip'`
  - Test with mock data

- [ ] Add `trackSavedTitle()` event
  - Parameters: `titleId: string`, `source: 'chat' | 'search' | 'featured'`
  - Integrate with existing favorites functionality

- [ ] Add `trackPitchView()` event
  - Parameters: `titleId: string`, `tier: string`, `duration: number`
  - Track view duration for engagement metrics

- [ ] Add `trackContactCreatorClick()` event
  - Parameters: `titleId: string`, `tier: string`, `source: string`
  - Critical for conversion funnel tracking

- [ ] Add `trackUpgradeButtonClick()` event
  - Parameters: `source: string`, `featureName: string`, `currentTier: string`
  - Track all upgrade CTA clicks across the app

#### Files to Modify
- `apps/dashboard/src/utils/analytics.ts`

#### Acceptance Criteria
- [ ] All new events tracked in GA4 dashboard
- [ ] Events include required parameters
- [ ] Console logging for debugging (dev mode only)
- [ ] No performance degradation

---

### Task 1.2: Implement Conversion Funnel Tracking
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours

#### Subtasks
- [ ] Create funnel definitions in GA4
  - **Funnel 1**: Signup → First Search → First Save → First Pitch View
  - **Funnel 2**: First Save → 5 Saves → Upgrade Click → Pro Subscription
  - **Funnel 3**: Pitch View → Contact Click → Pro Subscription

- [ ] Implement funnel visualization component (internal use)
  - Create `FunnelVisualization.tsx` component
  - Display conversion rates at each step
  - Show drop-off points

- [ ] Set up automated funnel reports
  - Daily email summary to product team
  - Weekly detailed report with cohort analysis

#### Files to Create
- `apps/dashboard/src/components/analytics/FunnelVisualization.tsx`
- `apps/dashboard/src/components/analytics/FunnelMetrics.tsx`

#### Acceptance Criteria
- [ ] Funnels visible in GA4 dashboard
- [ ] Conversion rates calculated correctly
- [ ] Drop-off points identified
- [ ] Reports automated and delivered

---

### Task 1.3: Cohort Analysis Implementation
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 3 hours

#### Subtasks
- [ ] Create cohort tracking system
  - Track users by signup date
  - Group by week/month

- [ ] Implement retention metrics
  - Day 1, Day 7, Day 30 retention
  - Engagement metrics by cohort

- [ ] Build cohort dashboard component
  - Retention curves visualization
  - Engagement heatmap

#### Files to Create
- `apps/dashboard/src/components/analytics/CohortDashboard.tsx`

#### Acceptance Criteria
- [ ] Cohorts tracked from signup
- [ ] Retention metrics accurate
- [ ] Dashboard accessible to product team

---

## Phase 2: User Onboarding System
**Duration**: 2 days (Days 3-4)
**Status**: ⚪ Not Started
**Owner**: Frontend Team

### Task 2.1: Create Onboarding Components
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 6 hours

#### Subtasks
- [ ] Create `OnboardingModal` component
  - Welcome screen with branding
  - "Take Tour" and "Skip" buttons
  - Smooth animations and transitions

- [ ] Create `OnboardingFlow` component
  - 4-step guided tour
  - Highlight key features (tooltips)
  - Progress indicator

- [ ] Create individual step components
  - `OnboardingStepChat.tsx` - "Search with AI Chat"
  - `OnboardingStepSave.tsx` - "Save Titles You Love"
  - `OnboardingStepPitch.tsx` - "Access Premium Content"
  - `OnboardingStepContact.tsx` - "Contact Creators Directly"

#### Files to Create
- `apps/dashboard/src/components/onboarding/OnboardingModal.tsx`
- `apps/dashboard/src/components/onboarding/OnboardingFlow.tsx`
- `apps/dashboard/src/components/onboarding/OnboardingStepChat.tsx`
- `apps/dashboard/src/components/onboarding/OnboardingStepSave.tsx`
- `apps/dashboard/src/components/onboarding/OnboardingStepPitch.tsx`
- `apps/dashboard/src/components/onboarding/OnboardingStepContact.tsx`
- `apps/dashboard/src/components/onboarding/index.ts`

#### Design Requirements
- Use existing design system (`StandardButton`, `StandardCard`)
- Follow color guidelines (no yellow, use hanok-teal for CTAs)
- Responsive design (mobile-first)
- Smooth transitions (250ms duration)

#### Acceptance Criteria
- [ ] Modal appears on first login
- [ ] Tour completable in < 30 seconds
- [ ] Easy skip at any step
- [ ] Smooth animations and UX
- [ ] Mobile responsive

---

### Task 2.2: Database Integration for Onboarding
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 3 hours

#### Subtasks
- [ ] Create `user_onboarding` table migration
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
  ```

- [ ] Create onboarding service
  - `onboardingService.ts` with CRUD operations
  - Track start, progress, completion, skip

- [ ] Integrate with auth flow
  - Check onboarding status on login
  - Show modal if not completed

- [ ] Add "Restart Tour" option in user settings

#### Files to Create
- `apps/dashboard/supabase/migrations/[timestamp]_create_user_onboarding.sql`
- `apps/dashboard/src/services/onboardingService.ts`

#### Files to Modify
- `apps/dashboard/src/hooks/useAuth.tsx` (check onboarding status)
- `apps/dashboard/src/pages/BuyerHome.tsx` (show modal)
- `apps/dashboard/src/pages/Profile.tsx` (restart tour button)

#### Acceptance Criteria
- [ ] Migration applied successfully
- [ ] Onboarding status persisted
- [ ] Modal shown only to new users
- [ ] Restart tour functional

---

### Task 2.3: Onboarding Analytics & Testing
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 2 hours

#### Subtasks
- [ ] Track onboarding events
  - `trackOnboardingStep(1, 'start')`
  - `trackOnboardingStep(1, 'complete')`
  - `trackOnboardingStep(1, 'skip')`

- [ ] Create onboarding analytics dashboard
  - Completion rate by step
  - Average time per step
  - Drop-off analysis

- [ ] A/B test onboarding variations (future)
  - Variant A: Full tour
  - Variant B: Quick tour (2 steps)

#### Acceptance Criteria
- [ ] All steps tracked in GA4
- [ ] Analytics dashboard functional
- [ ] Completion rate > 60%

---

## Phase 3: Email Re-engagement Strategy
**Duration**: 2 days (Days 5-6)
**Status**: ⚪ Not Started
**Owner**: Backend + Marketing Team

### Task 3.1: Email Automation Infrastructure
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 5 hours

#### Subtasks
- [ ] Create `email_automation_queue` table migration
  ```sql
  CREATE TABLE email_automation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    email_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] Create email automation service
  - `emailAutomationService.ts`
  - Schedule emails based on user actions
  - Process email queue (cron job)

- [ ] Implement email triggers
  - **Day 1**: No saved titles → "Need help finding titles?"
  - **Day 3**: Saved titles but not Pro → "Unlock premium access"
  - **Day 7**: No activity → "We have new titles!"

- [ ] Set up email queue processor
  - Supabase Edge Function or cron job
  - Process pending emails every hour
  - Update status on send

#### Files to Create
- `apps/dashboard/supabase/migrations/[timestamp]_create_email_automation_queue.sql`
- `apps/dashboard/src/services/emailAutomationService.ts`
- `apps/dashboard/supabase/functions/process-email-queue/index.ts`

#### Files to Modify
- `apps/dashboard/src/services/emailService.ts` (add new email types)

#### Acceptance Criteria
- [ ] Migration applied successfully
- [ ] Email queue functional
- [ ] Triggers fire at correct times
- [ ] Emails sent successfully

---

### Task 3.2: Email Template Development
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours

#### Subtasks
- [ ] Create Day 1 email template
  - Subject: "Need help finding the perfect title?"
  - Personalized recommendations
  - CTA: "Explore Recommended Titles"

- [ ] Create Day 3 email template
  - Subject: "Unlock premium access to [Saved Title Names]"
  - Highlight Pro features
  - CTA: "Upgrade to Pro - 20% Off First Month"

- [ ] Create Day 7 email template
  - Subject: "We have new titles you'll love!"
  - New featured titles
  - Personalized picks based on history
  - CTA: "See What's New"

- [ ] Create email template components
  - Header with branding
  - Personalization tokens
  - Responsive design

#### Files to Create
- `apps/dashboard/src/email-templates/day1-no-saved-titles.html`
- `apps/dashboard/src/email-templates/day3-upgrade-pro.html`
- `apps/dashboard/src/email-templates/day7-re-engagement.html`
- `apps/dashboard/src/email-templates/components/EmailHeader.tsx`
- `apps/dashboard/src/email-templates/components/EmailFooter.tsx`

#### Design Requirements
- Mobile-responsive HTML email
- Plain text fallback version
- Unsubscribe link in footer
- Brand colors and fonts

#### Acceptance Criteria
- [ ] All templates created and tested
- [ ] Personalization working correctly
- [ ] Mobile responsive
- [ ] Deliverability tested (inbox, not spam)

---

### Task 3.3: Email Analytics & Optimization
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 2 hours

#### Subtasks
- [ ] Track email metrics
  - Open rates
  - Click-through rates
  - Conversion rates
  - Unsubscribe rates

- [ ] Create email analytics dashboard
  - Performance by email type
  - A/B test results
  - Cohort analysis

- [ ] Implement A/B testing for subject lines
  - Test 2-3 variations per email type
  - Measure open rate improvement

#### Acceptance Criteria
- [ ] Email metrics tracked
- [ ] Dashboard functional
- [ ] Open rate > 30%
- [ ] CTR > 10%

---

## Phase 4: Paid Conversion Optimization
**Duration**: 3 days (Days 7-9)
**Status**: ⚪ Not Started
**Owner**: Full Stack Team

### Task 4.1: Strategic Upgrade Prompts
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 6 hours

#### Subtasks
- [ ] Create `UpgradePrompt` component
  - Reusable component for all upgrade prompts
  - Props: `message`, `featureName`, `source`, `ctaText`
  - Frequency capping (1 per session)
  - Easy dismissal

- [ ] Add prompt to Favorites page (5+ saved titles)
  - Trigger: User has 5+ saved titles
  - Message: "You've saved 5 titles! Upgrade to Pro to contact all creators directly."
  - CTA: "Upgrade to Pro"

- [ ] Add prompt to Title Detail page (3+ pitch views)
  - Trigger: User viewed 3+ pitches
  - Message: "Enjoying the pitches? Get unlimited access with Pro."
  - CTA: "Unlock Unlimited Pitch Access"

- [ ] Add prompt to Chat page (5+ basic chat uses)
  - Trigger: User used basic chat 5+ times
  - Message: "Try Advanced Chat for deeper insights and faster results."
  - CTA: "Try Advanced Chat (Pro)"

#### Files to Create
- `apps/dashboard/src/components/UpgradePrompt.tsx`
- `apps/dashboard/src/hooks/useUpgradePromptTrigger.ts`

#### Files to Modify
- `apps/dashboard/src/pages/Favorites.tsx`
- `apps/dashboard/src/pages/TitleDetailNew.tsx`
- `apps/dashboard/src/pages/Chat.tsx`

#### Design Requirements
- Non-intrusive placement
- Easy dismissal with "X" button
- "Don't show again" option (localStorage)
- Smooth animation on appear

#### Acceptance Criteria
- [ ] Prompts trigger at correct thresholds
- [ ] Frequency capping working
- [ ] Dismissal persisted across sessions
- [ ] Click tracking functional

---

### Task 4.2: Enhanced Pricing Page
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 5 hours

#### Subtasks
- [ ] Add social proof section
  - Customer testimonials (3-5)
  - "Trusted by 500+ global buyers" badge
  - Success story highlights

- [ ] Enhance feature comparison table
  - Visual comparison: Basic vs Pro vs Suite
  - Highlight most popular plan ("Most Popular" badge)
  - Add "Best Value" badge to annual plans

- [ ] Add limited-time offer banner
  - "20% Off First Month - New Users Only"
  - Countdown timer (3 days)
  - Prominent placement at top

- [ ] Improve mobile responsiveness
  - Stack cards vertically on mobile
  - Sticky CTA buttons
  - Larger touch targets

#### Files to Modify
- `apps/dashboard/src/pages/BuyersPricing.tsx`

#### Files to Create
- `apps/dashboard/src/components/pricing/TestimonialCard.tsx`
- `apps/dashboard/src/components/pricing/FeatureComparisonTable.tsx`
- `apps/dashboard/src/components/pricing/LimitedTimeOffer.tsx`

#### Design Requirements
- Use existing design system
- Social proof authentic (real testimonials)
- Countdown timer dynamic (JavaScript)
- Mobile-first design

#### Acceptance Criteria
- [ ] Social proof visible and compelling
- [ ] Feature comparison clear
- [ ] Offer banner prominent
- [ ] Mobile UX excellent

---

### Task 4.3: Conversion Funnel Tracking & Optimization
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours

#### Subtasks
- [ ] Track upgrade button clicks by source
  - `trackUpgradeButtonClick('favorites', 'contact_creator', 'basic')`
  - `trackUpgradeButtonClick('title_detail', 'pitch_access', 'basic')`
  - `trackUpgradeButtonClick('chat', 'advanced_chat', 'basic')`

- [ ] Measure conversion funnel
  - Click → Pricing page view → Payment intent → Subscription
  - Track drop-off at each step

- [ ] Implement A/B testing for prompt copy
  - Variant A: "Upgrade to Pro"
  - Variant B: "Unlock Premium Features"
  - Measure click-through rate

- [ ] Create conversion dashboard
  - Conversion rate by source
  - Funnel visualization
  - A/B test results

#### Files to Create
- `apps/dashboard/src/components/analytics/ConversionDashboard.tsx`

#### Files to Modify
- `apps/dashboard/src/utils/analytics.ts` (add conversion tracking)

#### Acceptance Criteria
- [ ] All clicks tracked
- [ ] Funnel visible in dashboard
- [ ] A/B test framework functional
- [ ] Conversion rate increased by 25%

---

### Task 4.4: Abandoned Cart Recovery (Stretch Goal)
**Priority**: P2 (Nice to Have)
**Status**: ⚪ Not Started
**Estimated Time**: 3 hours

#### Subtasks
- [ ] Track pricing page visits without purchase
  - Identify users who viewed pricing but didn't subscribe

- [ ] Create abandoned cart email
  - Subject: "Complete your Pro upgrade - Save 20%"
  - Remind users of benefits
  - Limited time offer

- [ ] Implement email trigger
  - Send 24 hours after pricing page visit
  - Don't send if user already subscribed

#### Acceptance Criteria
- [ ] Abandoned carts identified
- [ ] Email sent after 24 hours
- [ ] Conversion rate improvement measured

---

## Phase 5: Testing & Documentation
**Duration**: 1 day (Day 10)
**Status**: 🟢 Complete (Documentation)
**Owner**: QA + Engineering Team

### Task 5.1: End-to-End Testing
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours

#### Subtasks
- [ ] Test complete user journey
  - Signup → Onboarding → Search → Save → Pitch View → Upgrade
  - Verify all tracking events fired

- [ ] Test email automation
  - Create test users with different scenarios
  - Verify correct emails sent at correct times

- [ ] Test upgrade prompts
  - Trigger each prompt condition
  - Verify frequency capping
  - Test dismissal persistence

- [ ] Test analytics dashboard
  - Verify metrics accurate
  - Check funnel visualizations
  - Test cohort analysis

#### Acceptance Criteria
- [ ] All user journeys tested
- [ ] No critical bugs found
- [ ] Analytics accurate
- [ ] Email automation working

---

### Task 5.2: Performance Testing
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 2 hours

#### Subtasks
- [ ] Test page load times
  - Onboarding modal should not delay page load
  - Analytics tracking should not block rendering

- [ ] Test database performance
  - Query optimization for onboarding checks
  - Email queue processing performance

- [ ] Test GA4 event delivery
  - Ensure events delivered reliably
  - No duplicate events

#### Acceptance Criteria
- [ ] Page load time < 2 seconds
- [ ] Analytics events < 100ms overhead
- [ ] No performance regressions

---

### Task 5.3: Documentation & Training
**Priority**: P0 (Critical)
**Status**: 🟢 Complete
**Estimated Time**: 3 hours

#### Subtasks
- [x] Create PRD 2.1 documentation
- [x] Create Implementation Plan with task tracking
- [ ] Update CLAUDE.md with new components and patterns
- [ ] Create team training materials
  - Onboarding system overview
  - Analytics dashboard guide
  - Email automation guide

- [ ] Document API endpoints
  - Onboarding service APIs
  - Email automation APIs
  - Analytics APIs

#### Files to Create/Update
- [x] `/docs/PRD-2.1.md`
- [x] `/docs/PRD-2.1-Implementation-Plan.md`
- [ ] `/docs/onboarding-guide.md`
- [ ] `/docs/analytics-guide.md`
- [ ] `/docs/email-automation-guide.md`
- [ ] `/CLAUDE.md` (update with new patterns)

#### Acceptance Criteria
- [x] PRD documented comprehensively
- [x] Implementation plan detailed
- [ ] Team trained on new features
- [ ] Documentation complete and accessible

---

## Daily Standup Template

### Day [X] - [Date]
**Yesterday**: [What was completed]
**Today**: [What will be worked on]
**Blockers**: [Any blockers]

---

## Sprint Planning

### Sprint 1: Foundation (Days 1-5)
- Phase 1: Analytics & Tracking Infrastructure
- Phase 2: User Onboarding System
- Phase 3: Email Re-engagement Strategy (started)

### Sprint 2: Conversion (Days 6-10)
- Phase 3: Email Re-engagement Strategy (completed)
- Phase 4: Paid Conversion Optimization
- Phase 5: Testing & Documentation

---

## Definition of Done (DoD)

A task is considered "Done" when:
- [ ] Code implemented and tested
- [ ] Unit tests written (if applicable)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Analytics tracking verified
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA tested and approved
- [ ] Product owner signed off

---

## Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Email deliverability issues | Medium | Medium | Use established provider, monitor bounce rates | Backend |
| Aggressive prompts annoy users | High | Medium | Frequency capping, easy dismissal, A/B test | Product |
| Onboarding adds friction | Medium | Low | Optional tour, easy skip, quick completion | Frontend |
| Analytics not tracking correctly | High | Low | Thorough testing, monitoring dashboard | Engineering |
| Performance degradation | Medium | Low | Performance testing, optimization | Engineering |

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-27 | 1.0 | Initial implementation plan created | Product Team |
| TBD | 1.1 | Updated with Phase 1 results | Engineering |
| TBD | 1.2 | Updated with Phase 2 results | Engineering |
| TBD | 2.0 | Final version with all phases complete | Product Team |

---

## Contact & Resources

### Team Contacts
- **Product Manager**: [Name] - [Email]
- **Engineering Lead**: [Name] - [Email]
- **Frontend Lead**: [Name] - [Email]
- **Backend Lead**: [Name] - [Email]
- **QA Lead**: [Name] - [Email]

### Resources
- [PRD 2.1 Full Document](./PRD-2.1.md)
- [User Journey Map](./USER_JOURNEY_MAP.md)
- [Analytics Dashboard](https://analytics.google.com/)
- [Project Slack Channel](#kstorybridge-prd-2-1)
- [GitHub Project Board](https://github.com/)

---

*This is a living document. Update regularly as tasks are completed and new information becomes available.*

**Last Updated**: 2025-01-27