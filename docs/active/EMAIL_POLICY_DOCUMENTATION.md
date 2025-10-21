# KStoryBridge Email Policy & Implementation Guide

## Overview

This document defines the centralized email policy for KStoryBridge to prevent duplicate emails, ensure consistent communication, and provide clear guidelines for email sending triggers.

## Email Sending Policy

### Core Principles

1. **No Duplicate Emails**: Each email type should only be sent once per user
2. **Centralized Tracking**: All emails are logged in the `email_logs` database table
3. **Single Responsibility**: Each email trigger should have a specific purpose
4. **Graceful Degradation**: Email failures should not break user workflows

### Email Types

| Email Type | Trigger | Frequency | Purpose |
|------------|---------|-----------|---------|
| `welcome` | User completes signup/profile | Once per user | Onboard new users |
| `verification_reminder` | Manual trigger only | As needed | Remind unverified users |
| `password_reset` | Password reset request | Once per request | Confirm password reset |
| `tier_upgrade` | Tier change event | Once per upgrade | Notify tier benefits |

## Implementation Architecture

### Current Trigger Points

#### ✅ FIXED: Welcome Email Triggers
**Problem**: Welcome emails were being sent from multiple locations causing duplicates

**Previous Issues**:
- `SignupForm.tsx` sent welcome emails during OAuth profile completion
- `useAuth.tsx` sent welcome emails on SIGNED_IN events
- Both used unreliable localStorage for deduplication
- No centralized coordination between triggers

**Solution Implemented**:
- Centralized deduplication in `EmailService.sendWelcomeEmail()`
- Database-backed tracking via `email_logs` table
- Removed localStorage-based tracking
- Single source of truth for email sending

### Email Service Architecture

```typescript
// Centralized email service with built-in deduplication
const emailService = EmailService.getInstance();

// Automatically prevents duplicates
await emailService.sendWelcomeEmail({
  userName: 'John Doe',
  userEmail: 'john@example.com',
  accountType: 'buyer'
});
```

#### Key Features:

1. **Automatic Deduplication**: Checks `email_logs` before sending
2. **Database Logging**: All attempts logged for analytics
3. **Error Handling**: Graceful failure with detailed logging
4. **Type Safety**: TypeScript interfaces for all email data

### Database Schema

```sql
-- email_logs table structure
CREATE TABLE email_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,           -- Recipient (normalized lowercase)
  email_type TEXT NOT NULL,           -- welcome, verification_reminder, etc.
  status TEXT NOT NULL,               -- 'sent' or 'failed'
  message_id TEXT,                    -- Provider message ID (Resend)
  error_message TEXT,                 -- Error details if failed
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Current Email Triggers

### 1. Welcome Emails

**When Sent**:
- ✅ OAuth users: After profile completion (SignupForm.tsx)
- ✅ Email users: After email verification (useAuth.tsx SIGNED_IN event)
- ✅ Both buyer and creator account types

**Deduplication**:
- ✅ Database-backed via `email_logs` table
- ✅ Automatic prevention in `EmailService.sendWelcomeEmail()`

**Template**: Uses `welcome` template in Supabase Edge Function

### 2. Slack Notifications (Separate System)

**Note**: Slack notifications for internal team use a separate system with its own blacklist:
- All notifications filtered through `SLACK_BLACKLIST_DOCUMENTATION.md`
- Uses centralized `sendSlackNotification()` utility
- Independent of user email system

## Configuration

### Environment Variables

```bash
# Supabase Edge Function environment
RESEND_API_KEY=re_xxxxxxxxx  # Required for email sending
```

### Edge Function Settings

**Function**: `apps/dashboard/supabase/functions/send-email/index.ts`
- Handles all email types through template system
- Integrates with Resend API
- Provides email template engine

## Email Content Guidelines

### Welcome Email Content

**Subject**: `Welcome to KStoryBridge, {userName}! 🎉`

**Content Includes**:
- Personalized greeting with user's name
- Account type-specific welcome message
- Clear next steps based on buyer/creator role
- Dashboard login button with correct URL
- Professional footer with unsubscribe options

**Account Type Variations**:
- **Buyers**: Access to Korean content catalog, save favorites, submit requests
- **Creators**: Add titles to catalog, connect with buyers, track interest

## Monitoring & Analytics

### Email Logs Query Examples

```sql
-- Check if welcome email was sent to user
SELECT * FROM email_logs
WHERE user_email = 'user@example.com'
AND email_type = 'welcome'
AND status = 'sent';

-- Get email sending statistics
SELECT
  email_type,
  status,
  COUNT(*) as count,
  DATE(sent_at) as date
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY email_type, status, DATE(sent_at)
ORDER BY date DESC;

-- Find users who didn't receive welcome emails
SELECT DISTINCT email
FROM user_buyers
WHERE email NOT IN (
  SELECT user_email FROM email_logs
  WHERE email_type = 'welcome' AND status = 'sent'
);
```

### Resend Dashboard Monitoring

Monitor delivery metrics at [Resend Dashboard](https://resend.com):
- Delivery rates
- Bounce rates
- Spam complaints
- Open/click tracking (if enabled)

## Troubleshooting

### Common Issues

#### "Email service not configured"
**Cause**: Missing `RESEND_API_KEY` environment variable
**Solution**:
1. Set environment variable in Supabase Dashboard
2. Redeploy Edge Function: `supabase functions deploy send-email`

#### Duplicate emails still being sent
**Cause**:
- Edge Function not using latest code
- Database migration not applied
- Multiple browser tabs/sessions

**Solution**:
1. Apply migration: `supabase db reset` or deploy migration
2. Redeploy function: `supabase functions deploy send-email`
3. Clear browser localStorage: `localStorage.clear()`

#### Emails going to spam
**Cause**: Domain not properly verified with Resend
**Solution**:
1. Verify domain in Resend Dashboard
2. Add SPF, DKIM, DMARC DNS records
3. Wait up to 24 hours for DNS propagation

### Debug Commands

```bash
# View email logs from local Supabase
supabase functions logs send-email --follow

# Test Edge Function locally
supabase functions serve send-email --debug

# Apply email_logs migration
supabase db push

# Reset local database (includes all migrations)
supabase db reset
```

## Development Guidelines

### Adding New Email Types

1. **Define Email Type**: Add to the email types table above
2. **Update EmailService**: Add method like `sendVerificationReminder()`
3. **Add Template**: Update Edge Function with new template
4. **Document Triggers**: Update this policy document
5. **Test Deduplication**: Verify no duplicates can be sent

### Testing Email Changes

1. **Use Test Environment**: Always test with staging email addresses
2. **Check email_logs**: Verify logging works correctly
3. **Test Deduplication**: Attempt to send same email twice
4. **Verify Templates**: Check email rendering across devices
5. **Monitor Logs**: Watch Supabase Function logs for errors

## Security & Compliance

### Data Protection
- User emails stored normalized (lowercase) in logs
- No sensitive user data in email logs
- RLS policies restrict access to own email logs only

### CAN-SPAM Compliance
- ✅ Clear sender identification
- ✅ Physical address in footer
- ✅ Unsubscribe mechanism provided
- ✅ Honor opt-out requests immediately

### GDPR Compliance
- User consent obtained during signup
- Data retention policies in place
- Right to erasure supported
- Privacy policy clearly displayed

## Future Enhancements

### Planned Features
1. **Email Preferences**: User-configurable email types
2. **Email Scheduling**: Send at optimal times per timezone
3. **A/B Testing**: Test different email versions
4. **Advanced Analytics**: Open/click tracking and reporting
5. **Email Queue**: Reliable delivery with retry logic

### Scaling Considerations
- Current Resend free tier: 100 emails/day, 3K/month
- Edge Function limits: 25MB memory, 150s timeout
- Consider queue system for high volume (>1K emails/day)

## Support

For email system issues:
1. Check this documentation first
2. Review Supabase Edge Function logs
3. Check Resend dashboard for delivery issues
4. Verify environment variables are set correctly

**Related Documentation**:
- `EMAIL_SYSTEM_SETUP.md` - Technical setup guide
- `SLACK_BLACKLIST_DOCUMENTATION.md` - Slack notification filtering
- `apps/dashboard/supabase/functions/send-email/index.ts` - Edge Function code