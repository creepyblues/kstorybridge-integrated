# Deploy Edge Function with Resend Integration

## Quick Steps to Fix Email Function

### 1. Deploy via Supabase Dashboard
Since CLI linking requires database password, use the dashboard:

1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
2. Click "Create a new function" or "Deploy from GitHub"
3. Or use the CLI after proper linking

### 2. Set Environment Variable
1. In Supabase Dashboard → Edge Functions → Environment Variables
2. Add new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
3. Save the secret

### 3. Deploy Function Code
Copy the content from:
`/Users/sungholee/code/kstorybridge-monorepo/supabase/functions/send-approval-email/index.ts`

To your Supabase function deployment.

### 4. Test
After deployment, the function should:
- Detect the RESEND_API_KEY
- Send real emails via Resend
- Return `method: 'resend'` instead of `'simulation'`

## Alternative: CLI Deployment
If you can link the project:

```bash
# Link project (requires database password)
supabase link --project-ref dlrnrgcoguxlkkcitlpd

# Set API key
supabase secrets set RESEND_API_KEY=your_resend_api_key_here

# Deploy function
supabase functions deploy send-approval-email

# Test function
supabase functions invoke send-approval-email --data '{"email":"test@example.com"}'
```

## Current Issue
The function is returning `method: 'simulation'` because:
1. Either the RESEND_API_KEY environment variable is not set
2. Or the updated function with Resend integration is not deployed
3. Or there's a deployment cache issue

## Debug Information
The current function should log:
- Whether RESEND_API_KEY exists
- The length of the API key
- All available environment variables

If you don't see these logs, the updated function hasn't been deployed yet.