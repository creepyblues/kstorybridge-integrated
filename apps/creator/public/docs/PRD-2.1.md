# Product Requirements Document (PRD) 2.1
## KStoryBridge Buyer Dashboard: User Engagement & Paid Conversion Optimization

**Document Status**: ACTIVE
**Version**: 2.1
**Last Updated**: 2025-01-27
**Author**: Product Team
**Target Release**: Q1 2025

---

## Executive Summary

PRD 2.1 focuses on dramatically improving user engagement and driving paid conversion through strategic improvements to onboarding, analytics tracking, email re-engagement, and conversion optimization. This release targets the buyer side of the KStoryBridge platform.

### Goals
1. **Improve User Onboarding** - Increase new user engagement by 60%
2. **Implement Comprehensive GA/GTM Tracking** - Track every step of user journey for data-driven optimization
3. **Augment Email Strategy** - Reduce churn with automated re-engagement emails
4. **Drive Paid Conversion** - Increase Pro plan conversion rate by 25%

---

## User Journey Overview

### Current User Journey (v2.0)
```
1. SEARCHING → Chat / Search Bar / Featured Titles
2. SAVED TITLES → Favorites Page
3. ENGAGEMENT → Title Detail View / Pitch Access (Pro)
4. COMMITMENT → Contact Creator (Pro)
```

### Key CTAs by Stage

#### Stage 1: Searching
- **Primary CTA**: "Save Title" (Heart icon)
- **Secondary CTA**: "View Details"
- **Pro Feature Trigger**: Search 5+ times → Suggest Advanced Chat

#### Stage 2: Saved Titles
- **Primary CTA**: "View Saved Title Details"
- **Secondary CTA**: "Continue Searching"
- **Pro Feature Trigger**: Save 5+ titles → "Upgrade to Contact Creators"

#### Stage 3: Engagement
- **Primary CTA**: "View Pitch Deck" (Pro)
- **Secondary CTA**: "Contact Creator" (Pro)
- **Pro Feature Trigger**: View 3+ pitch decks → "Unlock Unlimited Pitch Access"

#### Stage 4: Commitment
- **Primary CTA**: "Contact Creator" (Pro)
- **Secondary CTA**: "Download Pitch"
- **Pro Feature Trigger**: Click Contact → Pro upgrade modal

---

## Current Implementation (v2.0)

### Existing Features
✅ **Chat Interface** - AI-powered title discovery
✅ **Search System** - Vector search with enhanced matching
✅ **Featured Titles** - Curated recommendations on home page
✅ **Favorites System** - Save and manage titles
✅ **Title Detail Pages** - Comprehensive title information
✅ **Pro Features**:
  - Contact Creator
  - Advanced Chat Mode
  - Pitch Deck Access

### Existing Infrastructure
✅ **Analytics**: GA/GTM partially implemented
✅ **Email Service**: Basic welcome emails
✅ **Tier System**: Basic/Pro/Suite tiers
✅ **Pricing Page**: Basic plan comparison

---

## Gaps & Opportunities (PRD 2.1 Focus)

### 1. User Onboarding Gap
**Problem**: New users land on dashboard with no guidance
- No welcome tour or feature introduction
- High bounce rate for first-time visitors
- Users don't discover Pro features

**Solution**: Structured onboarding flow
- Welcome modal with quick tour
- Progressive disclosure of features
- Clear path to first saved title

### 2. Analytics & Tracking Gap
**Problem**: Incomplete tracking of user journey
- Missing conversion funnel tracking
- No engagement metrics by cohort
- Cannot identify drop-off points

**Solution**: Comprehensive GA/GTM tracking
- Track all user interactions
- Implement conversion funnels
- Create analytics dashboard

### 3. Email Re-engagement Gap
**Problem**: Limited email strategy beyond welcome email
- No follow-up emails for inactive users
- No personalized recommendations
- No Pro feature education

**Solution**: Automated email triggers
- Day 1: "Did you find what you're looking for?"
- Day 3: "Explore Pro features"
- Day 7: "We miss you!" re-engagement

### 4. Paid Conversion Gap
**Problem**: Pro features not effectively monetized
- Upgrade prompts not strategically placed
- No urgency or social proof
- Limited conversion funnel optimization

**Solution**: Strategic upgrade optimization
- Contextual upgrade prompts at engagement peaks
- Enhanced pricing page with social proof
- A/B testing for conversion optimization

---

## PRD 2.1 Features

### Feature 1: User Onboarding System

#### User Stories
- As a **new buyer**, I want a **quick tour of key features** so I can **start finding titles quickly**
- As a **new buyer**, I want to **understand Pro features** so I can **decide if I should upgrade**

#### Requirements
1. **Welcome Modal**
   - Show on first login only
   - Highlight: Chat, Search, Save, Pro features
   - Options: "Take Tour" or "Skip"

2. **Interactive Tour**
   - 4-step guided tour (30 seconds total)
   - Step 1: "Search with AI Chat" (5 seconds)
   - Step 2: "Save Titles You Love" (5 seconds)
   - Step 3: "Access Premium Content" (10 seconds)
   - Step 4: "Contact Creators Directly" (10 seconds)

3. **Progress Tracking**
   - Store completion status in database
   - Track drop-off at each step
   - Option to restart tour from settings

#### Success Metrics
- **Onboarding completion rate** > 60%
- **Time to first saved title** reduced by 40%
- **Feature discovery rate** increased by 50%

---

### Feature 2: Comprehensive Analytics Tracking

#### User Stories
- As a **product manager**, I want to **track user journey funnels** so I can **identify drop-off points**
- As a **marketing team**, I want to **measure campaign effectiveness** so I can **optimize acquisition**

#### Requirements
1. **Enhanced Event Tracking**
   ```typescript
   // New tracking events
   trackOnboardingStep(step: number, action: 'start' | 'complete' | 'skip')
   trackSavedTitle(titleId: string, source: 'chat' | 'search' | 'featured')
   trackPitchView(titleId: string, tier: string)
   trackContactCreatorClick(titleId: string, tier: string)
   trackUpgradeButtonClick(source: string, featureName: string)
   ```

2. **Conversion Funnel Tracking**
   - Funnel 1: Signup → First Search → First Save → First Pitch View
   - Funnel 2: First Save → 5 Saves → Upgrade Click → Pro Subscription
   - Funnel 3: Pitch View → Contact Click → Pro Subscription

3. **Cohort Analysis**
   - Track user cohorts by signup date
   - Measure retention by cohort (Day 1, Day 7, Day 30)
   - Compare engagement metrics across cohorts

#### Success Metrics
- **Event tracking coverage** 100% of user actions
- **Funnel completion visibility** for all key flows
- **Data-driven decisions** enabled for product team

---

### Feature 3: Automated Email Re-engagement

#### User Stories
- As an **inactive user**, I want to **receive relevant recommendations** so I can **re-engage with the platform**
- As a **user with saved titles**, I want **Pro feature reminders** so I can **unlock more value**

#### Requirements
1. **Email Triggers**
   - **Day 1 Email** (if no saved titles)
     - Subject: "Need help finding the perfect title?"
     - Content: Personalized recommendations based on search history
     - CTA: "Explore Recommended Titles"

   - **Day 3 Email** (if saved titles but not Pro)
     - Subject: "Unlock premium access to [Saved Title Names]"
     - Content: Highlight Pro features (Pitch, Contact)
     - CTA: "Upgrade to Pro - 20% Off First Month"

   - **Day 7 Email** (if no activity)
     - Subject: "We have new titles you'll love!"
     - Content: New featured titles + personalized picks
     - CTA: "See What's New"

2. **Email Personalization**
   - Include user's saved titles
   - Recommend similar titles based on search history
   - Dynamic content based on user tier

3. **Email Analytics**
   - Track open rates, click rates, conversion rates
   - A/B test subject lines and CTAs
   - Measure re-engagement success

#### Success Metrics
- **Email open rate** > 30%
- **Click-through rate** > 10%
- **Re-engagement rate** > 15% (7-day inactive users)

---

### Feature 4: Paid Conversion Optimization

#### User Stories
- As a **buyer with 5+ saved titles**, I want to **easily upgrade to contact creators** so I can **close deals faster**
- As a **free tier user**, I want to **understand Pro value** so I can **make an informed upgrade decision**

#### Requirements
1. **Strategic Upgrade Prompts**
   - **After 5+ saved titles**
     - Location: Favorites page
     - Message: "You've saved 5 titles! Upgrade to Pro to contact all creators directly."
     - CTA: "Upgrade to Pro"

   - **After 3rd pitch view**
     - Location: Title detail modal
     - Message: "Enjoying the pitches? Get unlimited access with Pro."
     - CTA: "Unlock Unlimited Pitch Access"

   - **After 5+ basic chat uses**
     - Location: Chat interface
     - Message: "Try Advanced Chat for deeper insights and faster results."
     - CTA: "Try Advanced Chat (Pro)"

2. **Enhanced Pricing Page**
   - **Social Proof Section**
     - Customer testimonials
     - "Trusted by 500+ global buyers"
     - Success stories

   - **Feature Comparison Table**
     - Visual comparison: Basic vs Pro vs Suite
     - Highlight most popular plan
     - Add "Best Value" badge

   - **Limited-Time Offer Banner**
     - "20% Off First Month - New Users Only"
     - Countdown timer (3 days)
     - Prominent placement at top

3. **Conversion Funnel Optimization**
   - Track upgrade button clicks by source
   - Measure conversion rate from click to payment
   - A/B test prompt copy and design
   - Implement abandoned cart recovery

#### Success Metrics
- **Pro conversion rate** increased by 25%
- **Upgrade button CTR** > 15%
- **Average revenue per user (ARPU)** increased by 30%

---

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Onboarding  │  │   Analytics  │  │  Email   │ │
│  │  Components  │  │   Tracking   │  │  Triggers│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │     User Journey Pages (Chat, Search, etc)  │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ GA/GTM Events
                         ▼
┌─────────────────────────────────────────────────────┐
│              Google Tag Manager (GTM)               │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │     GA4      │  │  Conversions │  │  Funnels │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ Backend APIs
                         ▼
┌─────────────────────────────────────────────────────┐
│               Supabase Backend                      │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Database   │  │ Edge Functions│  │  Storage │ │
│  │  (Postgres)  │  │  (Email API)  │  │  (PDFs)  │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
```

### New Database Tables

#### `user_onboarding`
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

#### `user_engagement_events`
```sql
CREATE TABLE user_engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_user_id ON user_engagement_events(user_id);
CREATE INDEX idx_engagement_event_type ON user_engagement_events(event_type);
```

#### `email_automation_queue`
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

CREATE INDEX idx_email_queue_scheduled ON email_automation_queue(scheduled_at);
CREATE INDEX idx_email_queue_status ON email_automation_queue(status);
```

---

## Implementation Phases

### Phase 1: Analytics & Tracking Infrastructure (Days 1-2)
- Enhance `analytics.ts` with new tracking events
- Test GA4 event delivery
- Create analytics dashboard component (internal use)

### Phase 2: User Onboarding (Days 3-4)
- Build `OnboardingFlow` and `OnboardingModal` components
- Integrate into auth flow
- Create database migration for `user_onboarding` table
- Track completion and drop-off rates

### Phase 3: Email Re-engagement Strategy (Days 5-6)
- Enhance `emailService.ts` with automated triggers
- Create email templates
- Set up email automation queue
- Test email delivery and tracking

### Phase 4: Paid Conversion Optimization (Days 7-9)
- Add upgrade prompts to Favorites, TitleDetail, Chat pages
- Enhance BuyersPricing page with social proof
- Implement conversion funnel tracking
- A/B test upgrade prompt variations

### Phase 5: Testing & Documentation (Days 10)
- End-to-end testing of all features
- Performance testing
- Update documentation
- Create training materials for team

---

## Success Criteria

### Key Performance Indicators (KPIs)

| Metric | Baseline (v2.0) | Target (v2.1) | Measurement |
|--------|-----------------|---------------|-------------|
| Onboarding Completion Rate | N/A | > 60% | Google Analytics |
| Saved Titles per User | 2.3 | 3.2 (+40%) | Database query |
| Pro Conversion Rate | 2.1% | 2.6% (+25%) | Stripe dashboard |
| Email Open Rate | N/A | > 30% | Email service |
| User Engagement (D7 retention) | 35% | 47% (+35%) | Google Analytics |
| Average Revenue Per User | $12.50 | $16.25 (+30%) | Stripe dashboard |

### Launch Criteria
✅ All new GA/GTM events tracking correctly
✅ Onboarding flow tested with 20+ users
✅ Email automation tested and deliverability verified
✅ Upgrade prompts A/B test configured
✅ Analytics dashboard functional
✅ Zero critical bugs

---

## Risks & Mitigations

### Risk 1: Email Deliverability Issues
**Impact**: Medium | **Probability**: Medium
**Mitigation**:
- Use established email service (Supabase Edge Functions)
- Implement proper SPF/DKIM/DMARC
- Monitor bounce rates and adjust frequency

### Risk 2: Aggressive Upgrade Prompts Annoy Users
**Impact**: High | **Probability**: Medium
**Mitigation**:
- Frequency capping (max 1 prompt per session)
- Easy dismissal with "Don't show again" option
- A/B test prompt aggressiveness
- Monitor user feedback and churn metrics

### Risk 3: Onboarding Adds Friction to Signup
**Impact**: Medium | **Probability**: Low
**Mitigation**:
- Optional onboarding (easy skip)
- Keep tour under 30 seconds
- Allow restart from settings
- Monitor signup abandonment rate

---

## Open Questions

1. **Pricing Strategy**: Should we offer a time-limited discount for new users?
   - **Recommendation**: Yes, 20% off first month for new signups to incentivize conversion

2. **Email Frequency**: How often should we send re-engagement emails?
   - **Recommendation**: Day 1, Day 3, Day 7 initial schedule. Adjust based on engagement data.

3. **Onboarding Timing**: When should onboarding tour appear?
   - **Recommendation**: Immediately after first login, with prominent "Skip" option

4. **Social Proof**: Should we use real customer testimonials or anonymized data?
   - **Recommendation**: Real testimonials with customer permission for authenticity

---

## Appendix

### Related Documents
- [PRD 2.1 Implementation Plan](./PRD-2.1-Implementation-Plan.md)
- [User Journey Map](./USER_JOURNEY_MAP.md)
- [Analytics Event Specification](./analytics-events-spec.md)
- [Email Template Designs](./email-templates/)

### Glossary
- **GA/GTM**: Google Analytics / Google Tag Manager
- **CTA**: Call to Action
- **ARPU**: Average Revenue Per User
- **D7 Retention**: Day 7 Retention Rate (users returning after 7 days)

---

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | [Name] | ________ | __/__/____ |
| Engineering Lead | [Name] | ________ | __/__/____ |
| Design Lead | [Name] | ________ | __/__/____ |
| Marketing Lead | [Name] | ________ | __/__/____ |

---

*End of Document*