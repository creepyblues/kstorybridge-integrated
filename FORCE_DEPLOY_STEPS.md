# 🚨 CRITICAL: Force Deploy Debug Function

## The Problem
The debug function with extensive logging is **NOT deployed yet**. You're still getting the old function response.

**Evidence:**
- No `🚀 FUNCTION STARTED - Debug Version v2.0` in console
- Response doesn't include `debug.functionVersion: "debug-v2.0"`
- Still getting `method: 'simulation'` without debug info

## 🛠️ SOLUTION: Force Deploy via Supabase Dashboard

### Step 1: Copy the Debug Function Code
1. Open this file in your editor:
   `/Users/sungholee/code/kstorybridge-monorepo/supabase/functions/send-approval-email/index.ts`

2. Select ALL the code (Cmd+A) and copy it (Cmd+C)

### Step 2: Deploy via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

2. **Option A: Edit Existing Function**
   - Find `send-approval-email` in the list
   - Click "Edit"
   - Delete ALL existing code
   - Paste the new debug code
   - Click "Deploy"

3. **Option B: Create New Function (if edit doesn't work)**
   - Click "Create a new function"
   - Name: `send-approval-email-debug`
   - Paste the debug code
   - Deploy
   - Update your admin code to call the new function name

### Step 3: Verify Environment Variables
1. In the same dashboard, go to "Environment Variables" or "Secrets"
2. Ensure `RESEND_API_KEY` is set with your actual Resend API key
3. The key should start with `re_`

### Step 4: Test the Function
After deployment, try the approval process again. You should see:

**Console Logs (if deployed correctly):**
```
🚀 FUNCTION STARTED - Debug Version v2.0
📅 Timestamp: 2025-08-14T...
📧 Email request for: test@example.com
🔍 EXTENSIVE ENVIRONMENT DEBUG:
================================
📋 Total env vars count: 5
📋 All env var keys: ["KEY1", "KEY2", "RESEND_API_KEY"]
🔑 RESEND_API_KEY status:
  - Exists: true
  - Type: string
  - Length: 45
  - First 10 chars: re_abc123
  - Starts with "re_": true
```

**Response (if deployed correctly):**
```json
{
  "success": true,
  "method": "resend" or "simulation",
  "debug": {
    "functionVersion": "debug-v2.0",
    "resendKeyFound": true/false,
    "resendKeyLength": 45,
    "envVarCount": 5,
    "envVarKeys": ["list", "of", "keys"]
  }
}
```

## 🚨 If Still Not Working

### Alternative 1: CLI Deployment (if you have DB password)
```bash
# Navigate to project root
cd /Users/sungholee/code/kstorybridge-monorepo

# Link project (enter DB password when prompted)
supabase link --project-ref dlrnrgcoguxlkkcitlpd

# Deploy function
supabase functions deploy send-approval-email

# Set API key
supabase secrets set RESEND_API_KEY=your_actual_key_here
```

### Alternative 2: Check Function Logs
1. In Supabase Dashboard → Functions → `send-approval-email`
2. Click "Logs" tab
3. Look for any deployment errors or the debug logs

### Alternative 3: Create with Different Name
If the function is cached/stuck:
1. Create a new function with name `send-approval-email-v2`
2. Update admin code to call the new function:
   ```typescript
   supabase.functions.invoke('send-approval-email-v2', { body: { email: userEmail } })
   ```

## ⚠️ Key Point
**Until you see the debug logs with emojis and version numbers, the new function is NOT deployed!**

The current response format proves the old function is still running.