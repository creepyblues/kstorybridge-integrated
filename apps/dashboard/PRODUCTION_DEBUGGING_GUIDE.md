# Production OpenAI API Debugging Guide

## Current Error Analysis

**Error**: `"Unexpected token 'A', 'A server e'... is not valid JSON"`

**Root Cause**: The API endpoint is returning an HTML error page instead of JSON response.

## Immediate Debug Steps

### 1. Test API Endpoint Directly

Visit this URL in your browser:
```
https://dashboard.kstorybridge.com/api/test
```

**Expected Response**: JSON with environment status
**If you see HTML**: API deployment issue

### 2. Check Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.app)
2. Select your dashboard project
3. Go to **Functions** tab
4. Look for `/api/openai-chat` function
5. Check recent invocations for errors

### 3. Verify File Structure

Your project should have this structure:
```
apps/dashboard/
├── api/
│   ├── openai-chat.ts      ← Must be here
│   └── test.ts             ← New debug endpoint
├── src/
└── package.json
```

If `api/` folder is in `src/` or elsewhere, move it to root level.

### 4. Check Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

| Variable | Status | Value Format |
|----------|--------|--------------|
| `OPENAI_API_KEY` | ✅ Required | `sk-proj-...` or `sk-...` |
| `SUPABASE_URL` | ✅ Required | `https://dlrnrgcoguxlkkcitlpd.supabase.co` |
| `SUPABASE_SERVICE_KEY` | ✅ Required | `eyJhbGciOiJIUzI1NiIs...` |

**Important**: Set Environment to **Production** for all variables.

## Quick Fixes

### Fix 1: Redeploy with Debug Endpoint

1. **Deploy the test endpoint** I created (`api/test.ts`)
2. **Visit**: `https://dashboard.kstorybridge.com/api/test`
3. **Check output** - should show environment variable status

### Fix 2: Replace Main API with Debug Version

**Backup current API**:
```bash
cp api/openai-chat.ts api/openai-chat-backup.ts
```

**Replace with debug version**:
```bash
cp api/openai-chat-debug.ts api/openai-chat.ts
```

**Deploy and check Vercel function logs** for detailed error information.

### Fix 3: Verify API Route Format

Ensure `api/openai-chat.ts` has this structure:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Your code here
}
```

## Common Issues & Solutions

### Issue 1: API Not Deployed
**Symptoms**: 404 Not Found, HTML error page
**Solution**: 
- Ensure `api/` folder is at project root (not in `src/`)
- Redeploy project
- Check Vercel build logs

### Issue 2: Environment Variables Not Loading
**Symptoms**: "Server configuration error", undefined variables
**Solution**:
- Verify variables are set in Vercel dashboard
- Set Environment to "Production" 
- Redeploy after adding variables

### Issue 3: OpenAI API Key Invalid
**Symptoms**: "invalid_api_key", "Server configuration error"
**Solution**:
- Generate new API key from OpenAI dashboard
- Ensure key has sufficient quota/credits
- Update in Vercel environment variables

### Issue 4: Supabase Connection Failed
**Symptoms**: "Database not initialized", auth errors
**Solution**:
- Verify `SUPABASE_URL` is correct
- Use **service_role** key, not anon key
- Check Supabase project is active

## Testing Procedure

### Step 1: Test Basic Deployment
```bash
curl https://dashboard.kstorybridge.com/api/test
```
**Expected**: JSON response with environment status

### Step 2: Test OpenAI Endpoint (GET)
```bash
curl https://dashboard.kstorybridge.com/api/openai-chat
```
**Expected**: `{"error": "Method not allowed"}` (405 status)

### Step 3: Test Full Request
```bash
curl -X POST https://dashboard.kstorybridge.com/api/openai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{"query": "test message"}'
```
**Expected**: JSON response with AI message

## Debug Logging

If you deployed the debug version, check Vercel function logs for:
- Environment variable status
- Authentication flow
- OpenAI API call details
- Detailed error information

## Recovery Steps

If nothing works:

### 1. Start Fresh
```bash
# Delete all API files
rm -rf api/

# Recreate from working template
mkdir api
# Copy working openai-chat.ts from backup
```

### 2. Minimal Test API
Create `api/hello.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'API is working!' });
}
```

Test: `https://dashboard.kstorybridge.com/api/hello`

### 3. Check Vercel Configuration
Ensure `vercel.json` (if exists) doesn't override API routes.

## Get Help

If still stuck, share:
1. **Response** from `/api/test` endpoint
2. **Vercel function logs** for `/api/openai-chat`
3. **Environment variables** screenshot (values hidden)
4. **Project structure** in Vercel dashboard

The error suggests a deployment or environment configuration issue rather than a code problem. The API should return JSON, but it's returning HTML instead, indicating a server-level error.