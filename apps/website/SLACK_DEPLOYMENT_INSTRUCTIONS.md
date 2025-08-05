# Slack Webhook Integration - Deployment Instructions

The CORS issue with Slack webhook notifications has been resolved by implementing a Supabase Edge Function proxy. Here's how to deploy and test it:

## 🔧 Implementation Summary

**Problem:** Browser CORS policy blocked direct requests to Slack webhooks from the client-side JavaScript.

**Solution:** Created a Supabase Edge Function (`slack-webhook-proxy`) that acts as a server-side proxy to forward webhook requests to Slack.

## 📁 Files Modified/Created

1. **NEW:** `supabase/functions/slack-webhook-proxy/index.ts` - Edge Function to proxy Slack requests
2. **UPDATED:** `src/utils/slack.ts` - Now uses the proxy endpoint instead of direct Slack calls
3. **UPDATED:** `.env.local` - Updated configuration comments

## 🚀 Deployment Steps

### Step 1: Deploy the Edge Function

1. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```

2. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy slack-webhook-proxy
   ```

### Step 2: Configure Environment Variables

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd
   - Navigate to "Edge Functions" → "slack-webhook-proxy" → "Settings"

2. **Add Environment Variable:**
   - Key: `SLACK_WEBHOOK_URL`
   - Value: `https://hooks.slack.com/services/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`

### Step 3: Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test signup flow:**
   - Visit: http://localhost:5173/signup/buyer
   - Fill out and submit the form
   - Check browser console for success logs
   - Check your Slack channel for the notification

3. **Alternative: Test via browser console:**
   ```javascript
   testSlackNotification()
   ```

## 🔍 How It Works

1. **Client-side:** When a user signs up, `SignupForm.tsx` calls `notifyBuyerSignup()` or `notifyCreatorSignup()`
2. **Proxy Call:** These functions send data to the Supabase Edge Function at `/functions/v1/slack-webhook-proxy`
3. **Server-side:** The Edge Function receives the data and forwards it to Slack's webhook URL
4. **Result:** Slack receives the notification without CORS issues

## 🐛 Troubleshooting

**Edge Function not deployed:**
- Check deployment logs: `supabase functions deploy slack-webhook-proxy --debug`
- Verify you're logged in: `supabase status`

**Environment variable not set:**
- Check Supabase dashboard → Edge Functions → slack-webhook-proxy → Settings
- Ensure `SLACK_WEBHOOK_URL` is set correctly

**Still getting errors:**
- Check browser console for detailed error messages
- Check Supabase Edge Function logs in the dashboard
- Verify the Slack webhook URL is still valid

## 📊 Expected Console Output

**Success:**
```
🔍 Debug: Using Slack proxy endpoint
🔍 Debug: Notification data: {event: "New Buyer Signup", ...}
🔍 Debug: Sending to proxy endpoint: https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/slack-webhook-proxy
🔍 Debug: Proxy response status: 200
🔍 Debug: Proxy response ok: true
✅ Slack notification sent successfully via proxy! {success: true, message: "Slack notification sent successfully"}
```

**Failure:**
```
❌ Failed to send Slack notification via proxy: 500 Internal Server Error
❌ Response body: {"error": "Slack webhook not configured"}
```

## 🎯 Next Steps

1. Deploy the Edge Function using the commands above
2. Set the environment variable in Supabase dashboard
3. Test the signup flow
4. Monitor Slack notifications

The integration should now work without CORS issues! 🎉