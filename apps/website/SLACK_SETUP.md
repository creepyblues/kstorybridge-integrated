# Slack Notifications Setup for Authentication Events

This guide explains how to set up Slack notifications to receive comprehensive alerts for all user authentication activities including signups and logins.

## Features

- 🚨 Real-time alerts for all signup attempts (successful and failed)
- 📱 Real-time alerts for all signin attempts (successful and failed)
- 📊 Detailed information for each authentication event
- 🔍 Error analysis with possible failure reasons and suggested actions
- 🌐 Works for both OAuth (Google) and email/password authentication
- 🛡️ Privacy-focused (emails are partially masked, sensitive data excluded)
- 📈 Complete audit trail of user authentication activity

## Setup Instructions

### 1. Create a Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Give your app a name (e.g., "KStoryBridge Signup Monitor")
5. Select your workspace

### 2. Configure Incoming Webhooks

1. In your app settings, go to "Features" → "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to ON
3. Click "Add New Webhook to Workspace"
4. Select the channel where you want to receive notifications (e.g., #signup-alerts)
5. Click "Allow"
6. Copy the Webhook URL (it looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### 3. Add Webhook URL to Environment

Add the webhook URL to your `.env.local` file:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and add your webhook URL
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Enable in development (default is false)
VITE_SLACK_ENABLE_DEV=true
```

### 4. Deploy to Production

For production deployment, add the environment variable to your hosting platform:

**Vercel:**
```bash
vercel env add VITE_SLACK_WEBHOOK_URL
```

**Netlify:**
Add in Site settings → Environment variables

**Other platforms:**
Add `VITE_SLACK_WEBHOOK_URL` to your environment configuration

## Notification Formats

### Signup Notifications

**Successful Signup:**
```
✅ New Buyer Signup / New Creator Signup

Email: us***@example.com
Full Name: [Name]
Company: [Company] (buyers only)
Pen Name: [Pen Name] (creators only)
Role: [Role]
Auth Type: email/google
Tier: basic/pro/suite (buyers)
Invitation Status: invited/accepted (creators)
Success: true
Timestamp: [Date and time]
Environment: production/development
```

**Failed Signup:**
```
🚨 Failed Buyer Signup / Failed Creator Signup

Email: us***@example.com
Auth Type: email/google
Success: false
Error Message: [Detailed error message]
Timestamp: [Date and time]
Environment: production/development

Possible Reason: [Automated analysis]
Suggested Action: [Recommended fix]
Severity: low/medium/high/critical
```

### Signin Notifications

**Successful Signin:**
```
✅ User Signin Success

Email: us***@example.com
Full Name: [Name]
Account Type: buyer/creator
Auth Type: email/google
Success: true
Tier: basic/pro/suite (buyers)
Invitation Status: invited/accepted (creators)  
Redirected To: dashboard/invited/creator/invited
Timestamp: [Date and time]
Session ID: [First 8 chars]...
```

**Failed Signin:**
```
🚨 User Signin Failed

Email: us***@example.com
Auth Type: email/google
Success: false
Error Message: [Error details]
Account Type: unknown (if not determinable)
Timestamp: [Date and time]
User Agent: [Browser info]
```

## Error Analysis

The system automatically analyzes failures and provides:

- **Possible Reasons:**
  - User already exists
  - Invalid email format
  - Weak password
  - Rate limiting
  - Database connection issues
  - Network problems
  - Configuration errors

- **Severity Levels:**
  - `low`: User errors (existing email, weak password)
  - `medium`: Rate limiting, network issues
  - `high`: Authentication configuration problems
  - `critical`: Database connection failures

## Testing

To test in development:

1. Set `VITE_SLACK_ENABLE_DEV=true` in `.env.local`
2. Test different scenarios:
   - **Signup Success:** Complete a new buyer/creator signup
   - **Signup Failure:** Try to sign up with an existing email or invalid data
   - **Signin Success:** Sign in with valid credentials 
   - **Signin Failure:** Try to sign in with invalid credentials
   - **OAuth Flows:** Test Google OAuth for both signup and signin
3. Check your Slack channel for notifications
4. Verify all notification types are working

### Test Scenarios to Verify

#### Signup Tests:
- ✅ Successful buyer email signup
- ✅ Successful creator email signup  
- ✅ Successful buyer OAuth signup
- ✅ Successful creator OAuth signup
- ❌ Failed email signup (existing email, weak password)
- ❌ Failed OAuth signup (profile creation error)
- ❌ Personal email rejection for buyer OAuth

#### Signin Tests:
- ✅ Successful buyer signin → dashboard
- ✅ Successful buyer signin → invited page (invited tier)
- ✅ Successful creator signin → dashboard (accepted status)
- ✅ Successful creator signin → creator invited page
- ✅ Successful OAuth signin (existing user)
- ❌ Failed signin (invalid credentials, unverified email)

## Privacy & Security

- Email addresses are partially masked (e.g., `jo***@example.com`)
- No passwords are ever logged or sent
- Sensitive user data is not included in notifications
- Webhook URLs should be kept secret and not committed to version control

## Troubleshooting

**Not receiving notifications?**

1. Check if webhook URL is correctly set in environment variables
2. Verify the Slack app has permissions for your channel
3. In development, ensure `VITE_SLACK_ENABLE_DEV=true`
4. Check browser console for any error messages
5. Test webhook manually:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification"}' \
  YOUR_WEBHOOK_URL
```

**Too many notifications?**

- Consider implementing rate limiting
- Filter by severity level
- Create separate channels for different error types

## Monitoring Best Practices

1. **Create dedicated channels:**
   - `#auth-events` - All authentication activity
   - `#signup-alerts` - Signup-specific notifications  
   - `#signin-alerts` - Signin-specific notifications
   - `#auth-failures` - Failed authentication attempts only

2. **Set up alerts:**
   - Critical failures (database errors, auth config issues)
   - Unusual patterns (multiple failures from same IP)
   - High-value user activities (enterprise signups)

3. **Regular monitoring:**
   - **Daily:** Review failed authentications
   - **Weekly:** Analyze signup/signin trends  
   - **Monthly:** Review notification effectiveness

4. **Actionable insights:**
   - Update UI based on common failure patterns
   - Improve error messages for frequent issues
   - Identify and fix authentication bottlenecks
   - Monitor conversion rates from signup to signin

5. **Data-driven improvements:**
   - Track success rates by auth method (email vs OAuth)
   - Identify drop-off points in auth flows
   - Monitor tier distribution and invitation approvals

## Support

For issues or questions about Slack notifications, contact the development team or check the system logs.