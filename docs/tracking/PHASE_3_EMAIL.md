# Phase 3: Email Re-engagement Strategy
## PRD 2.1 Implementation - Days 5-6

**Status**: ⚪ Not Started (0%)
**Owner**: Backend + Marketing Team
**Duration**: 2 days (11 hours total)
**Target Start**: 2025-01-31
**Target Completion**: 2025-02-01

---

## 📊 Phase Overview

```
░░░░░░ 0% Complete
```

### Task Summary
- [ ] **Task 3.1**: Email Automation Infrastructure (⚪ Not Started - 5 hours)
- [ ] **Task 3.2**: Email Template Development (⚪ Not Started - 4 hours)
- [ ] **Task 3.3**: Email Analytics & Optimization (⚪ Not Started - 2 hours)

---

## 📋 Task Breakdown

### Task 3.1: Email Automation Infrastructure
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 5 hours
**Owner**: Backend Team

#### Description
Build email automation infrastructure with queue system and triggers. Emails send at Day 1, Day 3, and Day 7 based on user actions.

#### Dependencies
- **Requires**: Phase 1 Task 1.1 (email event tracking)
- **Enables**: Automated re-engagement campaigns

#### Blockers
- 🔴 **Phase 1 Task 1.1**: Email tracking events must be functional
- ⚠️ **Email Service**: Verify Supabase Edge Function email service configured
- ⚠️ **SMTP Credentials**: Ensure email sending configured in production

---

#### Subtasks

- [ ] **3.1.1**: Create database migration
  ```
  apps/dashboard-v2/supabase/migrations/[timestamp]_create_email_automation_queue.sql
  ```
  **Schema**:
  ```sql
  CREATE TABLE email_automation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'day1_no_saved', 'day3_upgrade', 'day7_reengagement'
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    email_data JSONB, -- Personalization data (saved titles, etc.)
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX idx_email_queue_scheduled ON email_automation_queue(scheduled_at);
  CREATE INDEX idx_email_queue_status ON email_automation_queue(status);
  CREATE INDEX idx_email_queue_type ON email_automation_queue(email_type);
  CREATE INDEX idx_email_queue_user_email ON email_automation_queue(user_email);

  -- RLS policies
  ALTER TABLE email_automation_queue ENABLE ROW LEVEL SECURITY;

  -- Admin only access (internal tool)
  CREATE POLICY "Email queue admin access"
    ON email_automation_queue FOR ALL
    USING (auth.jwt() ->> 'email' IN (
      SELECT email FROM user_buyers WHERE tier = 'suite' -- Or admin table
    ));
  ```

- [ ] **3.1.2**: Create email automation service
  ```
  apps/dashboard-v2/src/services/emailAutomationService.ts
  ```
  **Functions**:
  - `scheduleEmail(userEmail, emailType, scheduledAt, data)` - Queue email
  - `cancelScheduledEmail(userEmail, emailType)` - Cancel pending email
  - `getScheduledEmails(userEmail)` - List user's queued emails
  - `processEmailQueue()` - Process pending emails (called by cron)

  **Email Types**:
  - `day1_no_saved` - Day 1 after signup, if no saved titles
  - `day3_upgrade` - Day 3 after signup, if saved titles but not Pro
  - `day7_reengagement` - Day 7 after signup, if no activity

- [ ] **3.1.3**: Implement email triggers
  **Trigger Logic**:

  **Day 1 Trigger** (24 hours after signup):
  - Condition: User has no saved titles
  - Action: Schedule `day1_no_saved` email
  - Data: Recommended titles based on search history (if any)

  **Day 3 Trigger** (72 hours after signup):
  - Condition: User has saved titles but tier = 'basic'
  - Action: Schedule `day3_upgrade` email
  - Data: List of saved titles (max 3), Pro features

  **Day 7 Trigger** (168 hours after signup):
  - Condition: User has no activity in last 3 days
  - Action: Schedule `day7_reengagement` email
  - Data: New featured titles, personalized recommendations

  **Implementation**: Trigger from signup flow or use cron job to check conditions

- [ ] **3.1.4**: Create email queue processor edge function
  ```
  apps/dashboard-v2/supabase/functions/process-email-queue/index.ts
  ```
  **Logic**:
  - Query `email_automation_queue` where `status = 'pending'` AND `scheduled_at <= NOW()`
  - For each email:
    - Fetch email template by type
    - Inject personalization data
    - Send via email service
    - Update status to 'sent' or 'failed'
  - Log results

  **Cron Schedule**: Every hour (or use Supabase Cron or external service)

- [ ] **3.1.5**: Add email deduplication logic
  **Rule**: Don't send same email type to same user twice
  **Implementation**: Check `email_automation_queue` for existing sent/pending emails before scheduling

---

#### Files to Create (3)

1. **`apps/dashboard-v2/supabase/migrations/[timestamp]_create_email_automation_queue.sql`**
2. **`apps/dashboard-v2/src/services/emailAutomationService.ts`**
3. **`apps/dashboard-v2/supabase/functions/process-email-queue/index.ts`**

#### Files to Modify (2)

4. **`apps/dashboard-v2/src/services/emailService.ts`** (add new email types)
5. **`apps/dashboard-v2/src/lib/auth.ts`** (trigger Day 1 email on signup)

---

#### Testing Checklist

- [ ] Migration applies successfully
- [ ] Email queue functional
- [ ] Triggers fire at correct times
- [ ] Emails scheduled correctly
- [ ] Processor runs without errors
- [ ] Deduplication working
- [ ] Status updates correctly (pending → sent)
- [ ] Error handling for failed sends

---

#### Acceptance Criteria

- [x] Database migration applied
- [x] Email queue table created
- [x] Automation service functional
- [x] Triggers fire at Day 1, 3, 7
- [x] Queue processor functional
- [x] No duplicate emails sent

---

### Task 3.2: Email Template Development
**Priority**: P0 (Critical)
**Status**: ⚪ Not Started
**Estimated Time**: 4 hours
**Owner**: Marketing + Frontend Team

#### Description
Create responsive HTML email templates for Day 1, Day 3, and Day 7 campaigns with personalization and strong CTAs.

#### Dependencies
- **Requires**: Task 3.1 (email service must accept templates)
- **Enables**: Automated email sending

#### Blockers
- 🔴 **Task 3.1**: Email service must be functional
- ⚠️ **Copy Writing**: Ensure email copy approved by marketing
- ⚠️ **Design Assets**: Logo, brand colors, images

---

#### Subtasks

- [ ] **3.2.1**: Create Day 1 email template
  ```
  apps/dashboard-v2/src/email-templates/day1-no-saved-titles.html
  ```
  **Subject**: "Need help finding the perfect title?"

  **Content Structure**:
  - Header with KStoryBridge logo
  - Personalized greeting: "Hi [User Name],"
  - Body: "We noticed you haven't saved any titles yet. Let us help you discover titles matching your needs."
  - Recommended Titles section (3 titles with thumbnails)
  - CTA: "Explore Recommended Titles" → Dashboard
  - Footer: Unsubscribe link, contact info

  **Personalization Tokens**:
  - `{{user_name}}` - User's full name
  - `{{recommended_titles}}` - Array of title objects
  - `{{dashboard_url}}` - Link to dashboard

- [ ] **3.2.2**: Create Day 3 email template
  ```
  apps/dashboard-v2/src/email-templates/day3-upgrade-pro.html
  ```
  **Subject**: "Unlock premium access to [Title Name] and 2 more"

  **Content Structure**:
  - Header with KStoryBridge logo
  - Personalized greeting: "Hi [User Name],"
  - Body: "You've saved [X] titles! Upgrade to Pro to unlock pitch decks and contact creators directly."
  - Saved Titles showcase (max 3, with titles)
  - Pro Features highlight:
    - ✅ Unlimited pitch deck access
    - ✅ Contact creators directly
    - ✅ Advanced chat with deeper insights
  - Special offer: "20% Off First Month - New Users Only"
  - CTA: "Upgrade to Pro" → Pricing page
  - Footer: Unsubscribe, contact

  **Personalization Tokens**:
  - `{{user_name}}` - User's full name
  - `{{saved_titles}}` - Array of saved title objects (max 3)
  - `{{saved_count}}` - Total saved titles count
  - `{{pricing_url}}` - Link to pricing page

- [ ] **3.2.3**: Create Day 7 email template
  ```
  apps/dashboard-v2/src/email-templates/day7-re-engagement.html
  ```
  **Subject**: "We have new titles you'll love!"

  **Content Structure**:
  - Header with KStoryBridge logo
  - Personalized greeting: "Hi [User Name],"
  - Body: "We miss you! Check out the latest titles added to our catalog this week."
  - New Titles section (5 titles with thumbnails)
  - Personalized Picks section (3 titles based on search history)
  - CTA: "See What's New" → Featured Titles page
  - Secondary CTA: "Continue Your Search" → Chat page
  - Footer: Unsubscribe, contact

  **Personalization Tokens**:
  - `{{user_name}}` - User's full name
  - `{{new_titles}}` - Array of recently added titles
  - `{{personalized_picks}}` - Array of recommended titles
  - `{{dashboard_url}}` - Link to dashboard

- [ ] **3.2.4**: Create email template components
  **Reusable Components**:
  ```
  apps/dashboard-v2/src/email-templates/components/EmailHeader.tsx
  ```
  - Logo, brand colors, responsive header

  ```
  apps/dashboard-v2/src/email-templates/components/EmailFooter.tsx
  ```
  - Unsubscribe link, contact info, social links, legal text

  ```
  apps/dashboard-v2/src/email-templates/components/TitleCard.tsx
  ```
  - Title thumbnail, name, genre, short description

- [ ] **3.2.5**: Add plain text fallback versions
  Create `.txt` version of each template for email clients that don't support HTML

---

#### Files to Create (8)

1. **`apps/dashboard-v2/src/email-templates/day1-no-saved-titles.html`**
2. **`apps/dashboard-v2/src/email-templates/day1-no-saved-titles.txt`** (plain text)
3. **`apps/dashboard-v2/src/email-templates/day3-upgrade-pro.html`**
4. **`apps/dashboard-v2/src/email-templates/day3-upgrade-pro.txt`** (plain text)
5. **`apps/dashboard-v2/src/email-templates/day7-re-engagement.html`**
6. **`apps/dashboard-v2/src/email-templates/day7-re-engagement.txt`** (plain text)
7. **`apps/dashboard-v2/src/email-templates/components/EmailHeader.tsx`**
8. **`apps/dashboard-v2/src/email-templates/components/EmailFooter.tsx`**

---

#### Design Requirements

- [ ] Mobile-responsive HTML (stack vertically on mobile)
- [ ] Plain text fallback for all templates
- [ ] Unsubscribe link in footer (required by law)
- [ ] Brand colors (hanok-teal for CTAs, gray palette)
- [ ] SF Pro font (web-safe fallback)
- [ ] Accessible (alt text for images, semantic HTML)
- [ ] Test in major email clients (Gmail, Outlook, Apple Mail)

---

#### Testing Checklist

- [ ] All templates render correctly in:
  - Gmail (web, mobile)
  - Outlook (web, desktop)
  - Apple Mail (Mac, iOS)
  - Yahoo Mail
- [ ] Personalization tokens replaced correctly
- [ ] CTAs clickable and track correctly
- [ ] Unsubscribe link functional
- [ ] Mobile responsive
- [ ] Plain text fallback works
- [ ] Images load (or alt text shows)
- [ ] No broken links
- [ ] Deliverability tested (inbox, not spam)

---

#### Acceptance Criteria

- [x] All 3 templates created (HTML + TXT)
- [x] Personalization working correctly
- [x] Mobile responsive
- [x] Email clients tested
- [x] Deliverability verified (not spam)

---

### Task 3.3: Email Analytics & Optimization
**Priority**: P1 (High)
**Status**: ⚪ Not Started
**Estimated Time**: 2 hours
**Owner**: Backend + Marketing Team

#### Description
Track email performance metrics and set up A/B testing framework for subject lines and content.

#### Dependencies
- **Requires**: Task 3.1 (emails must be sending) + Task 3.2 (templates must exist)
- **Enables**: Data-driven email optimization

#### Blockers
- 🔴 **Task 3.1 & 3.2**: Must be complete first
- ⚠️ **Analytics Service**: Need email tracking pixels or service with analytics

---

#### Subtasks

- [ ] **3.3.1**: Track email metrics
  **Metrics to track**:
  - **Send rate**: Emails sent successfully / emails attempted
  - **Open rate**: Emails opened / emails sent
  - **Click-through rate (CTR)**: Links clicked / emails opened
  - **Conversion rate**: Upgrades / emails sent
  - **Unsubscribe rate**: Unsubscribes / emails sent
  - **Bounce rate**: Bounces / emails sent

  **Implementation Options**:
  - Option A: Use Supabase email service analytics
  - Option B: Add tracking pixel to email templates
  - Option C: Use third-party service (SendGrid, Mailgun)

- [ ] **3.3.2**: Create email analytics table (optional)
  ```sql
  CREATE TABLE email_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_queue_id UUID REFERENCES email_automation_queue(id),
    user_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.3.3**: Create email analytics dashboard (internal)
  ```
  apps/dashboard-v2/src/components/analytics/EmailAnalyticsDashboard.tsx
  ```
  **Features**:
  - Performance by email type (Day 1, 3, 7)
  - Open rate, CTR, conversion rate over time
  - A/B test results comparison
  - Cohort analysis (email recipients by signup date)

  **Metrics Display**:
  - Day 1 Email: Open rate, CTR, recommended titles clicked
  - Day 3 Email: Open rate, CTR, upgrade conversion rate
  - Day 7 Email: Open rate, CTR, re-engagement rate

- [ ] **3.3.4**: Implement A/B testing for subject lines
  **Test Variations**:

  **Day 1 Email**:
  - Variant A: "Need help finding the perfect title?"
  - Variant B: "Discover titles matching your needs"
  - Variant C: "[User Name], we have recommendations for you"

  **Day 3 Email**:
  - Variant A: "Unlock premium access to [Title Name] and 2 more"
  - Variant B: "Ready to contact creators? Upgrade to Pro"
  - Variant C: "20% off Pro - Limited time offer"

  **Day 7 Email**:
  - Variant A: "We have new titles you'll love!"
  - Variant B: "We miss you! Come back to discover more"
  - Variant C: "[User Name], your favorites await"

  **Implementation**: Randomly assign variant on email schedule, track open rate by variant

- [ ] **3.3.5**: Set up automated alerts
  **Alert Conditions**:
  - Open rate < 20% (target: >30%)
  - CTR < 5% (target: >10%)
  - Bounce rate > 5%
  - Unsubscribe rate > 2%

  **Delivery**: Email to product team, Slack notification

---

#### Files to Create (2)

1. **`apps/dashboard-v2/src/components/analytics/EmailAnalyticsDashboard.tsx`** (optional)
2. **`apps/dashboard-v2/supabase/migrations/[timestamp]_create_email_analytics.sql`** (optional)

---

#### Testing Checklist

- [ ] Email metrics tracked accurately
- [ ] Open tracking pixel working
- [ ] Click tracking working
- [ ] Conversion attribution correct
- [ ] Dashboard displays metrics correctly
- [ ] A/B test variants distributed evenly
- [ ] Alerts trigger correctly

---

#### Acceptance Criteria

- [x] Email metrics tracked
- [x] Analytics dashboard functional (or manual queries)
- [x] A/B testing framework implemented
- [x] Open rate > 30% (target)
- [x] CTR > 10% (target)

---

## 🎯 Phase 3 Success Criteria

### Must Have (Launch Blockers)
- [x] Email automation queue functional
- [x] All 3 email templates created and tested
- [x] Triggers fire at Day 1, 3, 7
- [x] Emails delivered successfully
- [x] Unsubscribe link working

### Nice to Have (Post-Launch)
- [ ] Email analytics dashboard component
- [ ] A/B testing for content (not just subject lines)
- [ ] Advanced personalization (ML recommendations)

### Target Metrics
- **Open rate**: > 30%
- **Click-through rate**: > 10%
- **Re-engagement rate**: > 15% (7-day inactive users)
- **Bounce rate**: < 5%
- **Unsubscribe rate**: < 2%

---

## 📁 Files Summary

### Files to Create (13)
- [ ] `create_email_automation_queue.sql` (migration)
- [ ] `emailAutomationService.ts`
- [ ] `process-email-queue/index.ts` (edge function)
- [ ] `day1-no-saved-titles.html`
- [ ] `day1-no-saved-titles.txt`
- [ ] `day3-upgrade-pro.html`
- [ ] `day3-upgrade-pro.txt`
- [ ] `day7-re-engagement.html`
- [ ] `day7-re-engagement.txt`
- [ ] `EmailHeader.tsx` (component)
- [ ] `EmailFooter.tsx` (component)
- [ ] `EmailAnalyticsDashboard.tsx` (optional)
- [ ] `create_email_analytics.sql` (optional)

### Files to Modify (2)
- [ ] `emailService.ts`
- [ ] `lib/auth.ts`

**Total**: 15 files affected

---

## 🚨 Blockers & Risks

### Active Blockers
1. **Phase 1 Task 1.1 (Analytics Events)**
   - **Status**: 🔴 Blocking
   - **Action**: Must complete before starting Phase 3
   - **Impact**: Can't track email engagement without events

2. **Email Service Configuration**
   - **Status**: ⚠️ Needs verification
   - **Action**: Verify Supabase Edge Function email service configured
   - **Owner**: Backend team

3. **SMTP Credentials**
   - **Status**: ⚠️ Needs setup
   - **Action**: Configure email sending in production
   - **Owner**: DevOps

### Risks
1. **Email Deliverability Issues**
   - **Impact**: Medium
   - **Probability**: Medium
   - **Mitigation**: Use established provider, monitor bounce rates, proper SPF/DKIM/DMARC

2. **Aggressive Emails Annoy Users**
   - **Impact**: Medium
   - **Probability**: Low
   - **Mitigation**: Easy unsubscribe, frequency capping (max 3 emails/week), valuable content

3. **Low Open Rates**
   - **Impact**: Medium
   - **Probability**: Medium
   - **Mitigation**: A/B test subject lines, optimize send times, personalization

---

## 📝 Daily Progress Log

### 2025-01-31 (Day 5) - Target
- ⏳ Complete Task 3.1 (Email Infrastructure)
- ⏳ Start Task 3.2 (Email Templates)

### 2025-02-01 (Day 6) - Target
- ⏳ Complete Task 3.2 (Email Templates)
- ⏳ Complete Task 3.3 (Analytics)

---

## 🔗 Related Documentation

- 📄 [Master Progress Tracker](../PRD_2.1_PROGRESS.md)
- 📄 [PRD 2.1 Full Document](../PRD-2.1.md)
- 📄 [Phase 1: Analytics](./PHASE_1_ANALYTICS.md)
- 📄 [Phase 2: Onboarding](./PHASE_2_ONBOARDING.md)
- 📄 [Email Policy Documentation](../active/EMAIL_POLICY_DOCUMENTATION.md)

---

**Next Action**: Wait for Phase 1 Task 1.1 completion, then start Task 3.1.1 (Database migration)

---

*Last updated: 2025-11-02*
