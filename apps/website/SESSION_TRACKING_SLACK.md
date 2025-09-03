# Session Tracking with Slack Notifications

## Overview
The website now sends Slack notifications when users start a session. This helps track user activity and engagement in real-time.

## Features

### Notification Types

1. **Logged-in Users**
   - Shows user's email address
   - Shows the URL they visited
   - Shows referrer if not direct traffic

2. **Anonymous Users**
   - Shows the full URL visited
   - Shows referrer if not direct traffic

### Session Management
- Notifications are sent once per 30-minute session
- A new notification is sent when a user logs in (even within the same session)
- Session data is stored in `sessionStorage` to prevent duplicate notifications

## Configuration

### Environment Variables
- `VITE_SLACK_ENABLE_DEV=true` - Enable Slack notifications in development mode
- By default, notifications are disabled in development to avoid noise

### Slack Webhook
The Slack webhook URL is configured in the Supabase Edge Function environment:
- Variable: `SLACK_WEBHOOK_URL`
- Location: Supabase Dashboard > Edge Functions > slack-webhook-proxy > Settings

## Implementation Details

### Files Created/Modified
1. **`src/utils/sessionTracking.ts`** - Core session tracking logic
2. **`src/components/SessionTracker.tsx`** - React component for session tracking
3. **`src/App.tsx`** - Added SessionTracker component
4. **`supabase/functions/slack-webhook-proxy/index.ts`** - Updated message formatting for session events

### How It Works
1. When the website loads, `SessionTracker` component initializes
2. It checks if a notification was already sent in the current session (30 minutes)
3. If not, it fetches the current user (if logged in) and sends a notification
4. The notification goes through the Supabase proxy function to Slack
5. Session information is stored to prevent duplicate notifications

## Testing

### Local Testing
1. Set environment variable in `.env.local`:
   ```
   VITE_SLACK_ENABLE_DEV=true
   ```

2. Run the website:
   ```bash
   npm run dev:website
   ```

3. Visit the website and check Slack for notifications

### Clear Session (for testing)
Open browser console and run:
```javascript
sessionStorage.removeItem('kstorybridge_session_notified')
```

Then refresh the page to trigger a new notification.

## Deployment

The Supabase Edge Function (`slack-webhook-proxy`) needs to be deployed with the updated message formatting:

```bash
supabase functions deploy slack-webhook-proxy
```

Make sure the `SLACK_WEBHOOK_URL` environment variable is set in the Supabase dashboard.