# Email System Setup Guide - KStoryBridge

## Overview
This email system uses Resend API through Supabase Edge Functions to send event-driven emails. The system supports:
- Welcome emails for new signups
- Template-based emails
- Custom HTML/text emails
- Event-driven notifications

## Architecture

```
User Action → Email Service → Supabase Edge Function → Resend API → User's Email
```

### Components:
1. **Email Service** (`src/services/emailService.ts`) - Client-side service
2. **Edge Function** (`supabase/functions/send-email/index.ts`) - Server-side email sender
3. **Email Templates** - Built into the Edge Function
4. **Integration Points** - Connected to signup flow

## Setup Instructions

### 1. Deploy Supabase Edge Function

```bash
cd apps/dashboard
supabase functions deploy send-email
```

### 2. Set Environment Variables

In your Supabase Dashboard → Settings → Edge Functions → Environment Variables:

```bash
RESEND_API_KEY=re_xxxxxxxxx
```

**Get your Resend API key from:** https://resend.com/api-keys

### 3. Verify Domain in Resend

1. Go to Resend Dashboard → Domains
2. Add your domain: `kstorybridge.com`
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification ✅

### 4. Configure Sender Emails

Update the email addresses in the Edge Function to match your verified domain:
- `noreply@kstorybridge.com`
- `welcome@kstorybridge.com` 
- `notifications@kstorybridge.com`

## Usage Examples

### Send Welcome Email
```typescript
import { sendWelcomeEmail } from '@/services/emailService';

await sendWelcomeEmail({
  userName: 'John Doe',
  userEmail: 'john@example.com',
  accountType: 'buyer',
  dashboardUrl: 'https://dashboard.kstorybridge.com',
  loginUrl: 'https://dashboard.kstorybridge.com/signin'
});
```

### Send Custom Email
```typescript
import { emailService } from '@/services/emailService';

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  html: '<p>Hello!</p>',
  text: 'Hello!',
  from: 'Custom Sender <custom@kstorybridge.com>'
});
```

### Send Event-Based Email
```typescript
import { sendEventEmail } from '@/services/emailService';

await sendEventEmail({
  eventType: 'tier_upgrade',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  metadata: { newTier: 'Pro' },
  timestamp: new Date().toISOString()
});
```

## Available Templates

### 1. Welcome Email Template
- **Trigger**: User completes signup
- **Template ID**: `welcome`
- **Data Required**:
  - `userName` - User's display name
  - `userEmail` - User's email address
  - `accountType` - 'buyer' or 'creator'
  - `dashboardUrl` - Dashboard URL for account type
  - `loginUrl` - Login page URL

### 2. Future Templates (Ready to Add)
- Verification reminder
- Password reset confirmation
- Tier upgrade notification
- Content request notifications
- Weekly digest emails

## Integration Points

### Signup Flow Integration
Welcome emails are automatically sent when:
1. ✅ OAuth users complete profile setup
2. ✅ Email users complete signup (after verification)
3. ✅ Both buyer and creator account types

**Files Modified:**
- `src/components/SignupForm.tsx` - Added welcome email calls

### Slack Integration
The system works alongside existing Slack notifications:
1. Slack notification sent (for internal tracking)
2. Welcome email sent (for user engagement)

## Testing

### 1. Use Test Interface
```bash
open apps/dashboard/test-email-system.html
```

### 2. Manual Testing
```bash
# Test Edge Function directly
curl -X POST https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "Hello from KStoryBridge!"
  }'
```

### 3. Integration Testing
1. Sign up with a real email address
2. Complete profile setup
3. Check email inbox for welcome message
4. Verify email rendering and links

## Monitoring & Analytics

### Email Logs
The system logs all email attempts to help with debugging:
- Email sent successfully ✅
- Email failed ❌
- Rate limit reached ⚠️
- Invalid email format ❌

### Resend Dashboard
Monitor email delivery in Resend Dashboard:
- Delivery rates
- Bounce rates
- Spam complaints
- Opens/clicks (if enabled)

## Troubleshooting

### Common Issues

**1. "Email service not configured"**
- ✅ Check `RESEND_API_KEY` environment variable
- ✅ Redeploy Edge Function after setting env vars

**2. "Domain not verified"**
- ✅ Verify domain in Resend dashboard
- ✅ Add all required DNS records
- ✅ Wait up to 24 hours for propagation

**3. "From address not allowed"**
- ✅ Use email addresses from verified domain only
- ✅ Format: `Name <email@yourdomain.com>`

**4. Rate limits**
- Resend free tier: 100 emails/day, 10/second
- Upgrade plan if needed

**5. Emails go to spam**
- ✅ Complete domain verification (SPF, DKIM, DMARC)
- ✅ Use consistent sender addresses
- ✅ Avoid spam trigger words
- ✅ Include unsubscribe links

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs send-email --follow

# Test email locally
supabase functions serve send-email --debug

# Check Resend API status
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY"
```

## Scaling & Future Features

### Ready to Add:
1. **Email Templates Database** - Store templates in Supabase
2. **User Email Preferences** - Allow users to opt out
3. **Email Scheduling** - Send emails at optimal times
4. **A/B Testing** - Test different email versions
5. **Advanced Analytics** - Track opens, clicks, conversions
6. **Transactional Emails** - Order confirmations, receipts
7. **Marketing Emails** - Newsletters, announcements

### Performance Considerations:
- Edge Function has 25MB memory limit
- Timeout after 150 seconds
- Consider queue system for high volume
- Implement retry logic for failed sends

## Security

### Best Practices:
- ✅ Never expose Resend API key in frontend
- ✅ Use Supabase RLS for email logs
- ✅ Validate email addresses before sending
- ✅ Rate limit email sending per user
- ✅ Include unsubscribe mechanisms

### Compliance:
- GDPR compliant (user consent required)
- CAN-SPAM Act compliant
- Include physical address in emails
- Honor unsubscribe requests immediately

## Cost Estimation

**Resend Pricing (as of 2025):**
- Free: 100 emails/day, 3K/month
- Pro: $20/month for 50K emails
- Business: $85/month for 200K emails

**Supabase Edge Functions:**
- Included in Pro plan
- $25/month for 500K invocations

## Support

For issues with this email system:
1. Check the troubleshooting section above
2. Test with the provided HTML test interface
3. Review Supabase Edge Function logs
4. Check Resend dashboard for delivery issues

**Internal Documentation:**
- `src/services/emailService.ts` - Service implementation
- `supabase/functions/send-email/index.ts` - Edge Function code
- `test-email-system.html` - Testing interface