# Production API Debugging Steps

## Current Status
✅ Function no longer crashes (`FUNCTION_INVOCATION_FAILED` fixed)  
❌ Still getting "Unexpected token 'A', 'A server e'... is not valid JSON"

## This Error Means
The API is running but still returning HTML instead of JSON in some cases.

## Debugging Steps

### Step 1: Test Health Endpoint
I created `api/health.ts`. After deployment, visit:
```
https://dashboard.kstorybridge.com/api/health
```

**Expected**: JSON response with environment status  
**If HTML**: Still has deployment/routing issues

### Step 2: Check Browser Network Tab
1. Open browser DevTools → Network tab
2. Try using the chatbot
3. Find the `/api/openai-chat` request
4. Check the **Response** tab
5. **Look for**: Is it HTML or JSON?

### Step 3: Test Specific Endpoint
Test the main endpoint directly:
```bash
curl -X POST https://dashboard.kstorybridge.com/api/openai-chat \
  -H "Content-Type: application/json" \
  -v
```

**Expected**: `{"error": "Unauthorized - No token provided"}` (401)  
**If HTML**: Routing/deployment issue

### Step 4: Test with Authentication
Get your Supabase token from browser:
1. Open DevTools → Application → Local Storage
2. Find `sb-dlrnrgcoguxlkkcitlpd-auth-token`
3. Copy the `access_token` value

```bash
curl -X POST https://dashboard.kstorybridge.com/api/openai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"query": "test"}' \
  -v
```

**Expected**: JSON response (success or error)  
**If HTML**: Server error or configuration issue

## Common Causes & Solutions

### Cause 1: Caching Issue
**Solution**: 
- Hard refresh browser (Ctrl+Shift+R)
- Try incognito mode
- Clear browser cache

### Cause 2: Vercel Routing Issue  
**Symptoms**: `/api/health` returns HTML
**Solution**: 
- Ensure `api/` folder is at project root
- Check `vercel.json` doesn't override routes
- Redeploy project

### Cause 3: Environment Variables Not Set
**Symptoms**: `/api/health` shows missing env vars
**Solution**:
- Check Vercel Dashboard → Environment Variables
- Ensure all 3 variables are set for Production
- Redeploy after adding variables

### Cause 4: OpenAI API Key Invalid
**Symptoms**: "Server configuration error"
**Solution**:
- Generate new OpenAI API key
- Update in Vercel environment variables
- Verify key has sufficient credits

### Cause 5: CORS Issues
**Symptoms**: Network errors, blocked requests
**Solution**:
- Check browser console for CORS errors
- Verify domain in API's `allowedOrigins`

## Quick Tests You Can Do

### Test 1: Simple GET
```
https://dashboard.kstorybridge.com/api/health
```
Should return JSON with environment status.

### Test 2: POST without Auth
```bash
curl -X POST https://dashboard.kstorybridge.com/api/openai-chat
```
Should return JSON: `{"error": "Unauthorized - No token provided"}`

### Test 3: Check Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to Functions tab
4. Click on `/api/openai-chat`
5. Check recent invocations for errors

## Expected Results After Fix

✅ `/api/health` returns JSON  
✅ `/api/openai-chat` returns JSON errors (not HTML)  
✅ Chatbot works with proper authentication  
✅ No more "Unexpected token" errors

## If Still Failing

Share these details:
1. **Response from `/api/health`**
2. **Browser Network tab screenshot**
3. **Vercel function logs**
4. **curl command output**

This will help identify the exact remaining issue.