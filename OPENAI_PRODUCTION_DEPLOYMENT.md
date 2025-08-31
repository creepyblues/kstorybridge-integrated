# 🚀 OpenAI Chatbot Production Deployment Guide

## 🔒 Secure Architecture

The production setup uses a **secure backend API** approach where:
- ✅ OpenAI API key stays on the server (never exposed to browsers)
- ✅ User authentication is verified server-side
- ✅ Rate limiting and access control at the API level
- ✅ Frontend makes authenticated requests to backend API

## 📋 Deployment Steps

### Step 1: Vercel Environment Variables

In your **Vercel Dashboard** → **Project Settings** → **Environment Variables**, add:

**🔐 Server-side Variables (for the API function):**
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

**📱 Client-side Variables (for the frontend):**
```
VITE_OPENAI_ENABLED=true
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
```

> **Important:** Do NOT set `VITE_OPENAI_API_KEY` in production - the frontend will use the secure API endpoint instead.

### Step 2: Get Your API Keys

1. **OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Supabase Service Key:**
   - Go to your Supabase dashboard
   - Project Settings → API
   - Copy the "service_role" key (not the anon key)

### Step 3: Deploy

```bash
# Build and deploy
npm run build:dashboard
vercel deploy --prod
```

### Step 4: Test Production

1. **Visit your production URL**: `https://dashboard.kstorybridge.com`
2. **Navigate to OpenAI Chatbot** (authorized users only)
3. **Check browser console** - should show:
   - ✅ "🔒 Using secure backend API for OpenAI request..."
   - ✅ "✅ Received response from backend API"
   - ❌ No API keys visible in Network tab or console

## 🔍 Verification Checklist

### ✅ Security Verification
- [ ] No `VITE_OPENAI_API_KEY` in production environment
- [ ] Browser dev tools show no API keys in Network requests
- [ ] Frontend console shows "Using secure backend API" messages
- [ ] API endpoint requires authentication (403/401 without token)

### ✅ Functionality Verification  
- [ ] Authorized users can access OpenAI chatbot
- [ ] Conversation history persists across page refreshes
- [ ] AI responses are generated successfully
- [ ] Suggested queries and title recommendations work
- [ ] Mobile responsiveness works properly

### ✅ Error Handling
- [ ] Unauthorized users see proper error messages
- [ ] Network failures are handled gracefully
- [ ] Rate limiting responses are user-friendly

## 🔧 Architecture Details

### Request Flow
1. **Frontend** → Authenticated request to `/api/openai-chat`
2. **API Function** → Verifies user auth with Supabase
3. **API Function** → Makes OpenAI request with server-side key
4. **API Function** → Returns sanitized response
5. **Frontend** → Displays response + searches for relevant titles

### File Structure
```
apps/dashboard/
├── api/
│   └── openai-chat.ts          # Secure serverless function
├── src/services/
│   └── openaiService.ts        # Updated to use API in production
├── .env.production             # Production config (no API keys)
└── vercel.json                 # Vercel deployment config
```

## 🚨 Security Features

1. **Authentication**: Server verifies JWT tokens with Supabase
2. **Authorization**: Only allowed users can access the API
3. **Rate Limiting**: Built-in protection against abuse
4. **Error Sanitization**: Internal errors aren't exposed to clients
5. **CORS Protection**: Only dashboard domain can access API

## 🛠️ Troubleshooting

### "OpenAI client not initialized" Error
- ✅ **Expected in production** - frontend should use API instead
- Check console for "Using secure backend API" message
- Verify `VITE_OPENAI_ENABLED=true` is set

### "Authentication required" Error
- User needs to be signed in
- Check if user is in authorized list (service currently restricted)

### "API request failed" Error
- Check Vercel function logs for details
- Verify environment variables are set correctly
- Ensure OpenAI API key has sufficient quota

### Function Timeout
- Current timeout: 30 seconds (configured in vercel.json)
- Check OpenAI API response times
- Consider optimizing prompt length

## 📊 Monitoring

### Vercel Dashboard
- Monitor function invocations and errors
- Check function logs for debugging
- Monitor response times and success rates

### OpenAI Dashboard  
- Monitor API usage and costs
- Check rate limits and quotas
- Review request patterns

## 🔄 Rollback Plan

If issues arise, you can temporarily disable the feature:

```bash
# In Vercel environment variables
VITE_OPENAI_ENABLED=false
```

This will hide the OpenAI chatbot from the UI without breaking other functionality.

## 📈 Next Steps

1. **Rate Limiting**: Implement Redis-based rate limiting for production
2. **Caching**: Add response caching for common queries  
3. **Analytics**: Track usage patterns and user engagement
4. **Cost Monitoring**: Set up alerts for OpenAI API usage
5. **A/B Testing**: Test different prompts and models

---

✨ **The OpenAI chatbot is now production-ready with enterprise-grade security!**