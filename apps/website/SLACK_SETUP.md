# Slack Notifications Setup for Signup Failures

This guide explains how to set up Slack notifications to receive alerts when users fail to sign up.

## Features

- 🚨 Real-time alerts for signup failures
- 📊 Detailed error information and analysis
- 🔍 Possible failure reasons and suggested actions
- 📱 Works for both OAuth (Google) and email/password signups
- 🛡️ Privacy-focused (emails are partially masked)

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

## Notification Format

When a signup fails, you'll receive a Slack message with:

```
🚨 Signup Failed: us***@example.com

Email: us***@example.com
Account Type: buyer/creator
Error Message: [Detailed error message]
Error Code: [If available]
Timestamp: [Date and time]
Environment: production/development
URL: https://kstorybridge.com

Possible Reason: [Automated analysis]
Suggested Action: [Recommended fix]
Severity: low/medium/high/critical

Additional Context: [Any extra information]
User Agent: [Browser information]
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
2. Try to sign up with an invalid email or existing account
3. Check your Slack channel for the notification

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

1. **Create a dedicated channel** (e.g., #signup-failures)
2. **Set up alerts** for critical failures
3. **Review weekly** for patterns in failures
4. **Update UI** based on common failure reasons
5. **Document fixes** for recurring issues

## Support

For issues or questions about Slack notifications, contact the development team or check the system logs.