# OpenAI Chatbot Production Setup Guide

## Overview
The OpenAI chatbot is already implemented with secure production architecture:
- ✅ Frontend automatically switches to backend API in production
- ✅ Backend API endpoint exists at `/api/openai-chat.ts`
- ✅ User authorization (only `sungho@dadble.com` and `kevin@sandstoneartists.com`)
- ✅ Secure server-side OpenAI API key handling

## Required Environment Variables

### In Your Deployment Platform (Vercel/Netlify/etc.)

Add these environment variables to your deployment platform's dashboard:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# Supabase Configuration  
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key-here
```

## Step-by-Step Setup

### 1. Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-proj-` or `sk-`)

### 2. Get Your Supabase Service Key
1. Go to https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/settings/api
2. Copy the **service_role** secret key
3. ⚠️ **Important**: This bypasses RLS - keep it secret!

### 3. Configure Environment Variables

#### For Vercel:
1. Go to your Vercel dashboard
2. Select your dashboard project
3. Go to Settings → Environment Variables
4. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key | Production |
| `SUPABASE_URL` | `https://dlrnrgcoguxlkkcitlpd.supabase.co` | Production |  
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | Production |

#### For Other Platforms:
Add the same environment variables to your deployment platform's environment configuration.

### 4. Frontend Configuration (Already Done)

The `.env.production` file is already configured:
```bash
# OpenAI enabled but uses backend API (no client-side key needed)
VITE_OPENAI_ENABLED=true
```

## How It Works

### Development Mode:
- Uses direct OpenAI client (with `dangerouslyAllowBrowser: true`)
- API key in `VITE_OPENAI_API_KEY` in `.env.local`

### Production Mode:
- Frontend detects `import.meta.env.PROD === true`
- Automatically switches to `/api/openai-chat` endpoint
- Backend handles OpenAI API securely with server-side keys
- No API keys exposed to browser

## Security Features

1. **Server-Side Only**: OpenAI API key never sent to browser
2. **User Authorization**: Only allowed users can access chatbot
3. **Authentication**: Requires valid Supabase auth token
4. **CORS Protection**: Only allows dashboard domain origins
5. **Rate Limiting**: Basic protection (can be enhanced with Redis)

## Testing Production Locally

To test the production flow locally:

1. **Set up environment variables** in `.env.local`:
```bash
# Regular development variables
VITE_OPENAI_ENABLED=true
VITE_OPENAI_API_KEY=your-dev-key

# Add these for API testing (note: no VITE_ prefix)
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

2. **Build for production** and serve:
```bash
npm run build
npm run preview
```

3. **Or force API mode** in development:
Set `NODE_ENV=production` temporarily to test API flow.

## Troubleshooting

### "Authentication required" Error
- Check that user is logged in to dashboard
- Verify user email is in allowed list (`sungho@dadble.com`, `kevin@sandstoneartists.com`)

### "Server configuration error" 
- Check `OPENAI_API_KEY` is set in deployment environment
- Verify the API key is valid and has credits

### "Service temporarily unavailable"
- OpenAI quota exceeded
- Check your OpenAI billing and usage

### CORS Errors
- Verify your production domain is in the `allowedOrigins` array in `/api/openai-chat.ts`
- Current allowed: `https://dashboard.kstorybridge.com`

### API Endpoint Not Found
- Make sure `api/` folder is deployed with your app
- Check your deployment platform supports serverless functions

## Cost Management

The system uses `gpt-4o-mini` model for cost efficiency:
- ~$0.00015 per request (600 tokens max)
- Conversation history limited to 6 messages
- No expensive vector operations on server

## Next Steps After Setup

1. Deploy with environment variables configured
2. Test with authorized user accounts
3. Monitor OpenAI usage in your OpenAI dashboard
4. Consider adding Redis for production-grade rate limiting
5. Add logging/analytics for usage tracking

## Files Modified

- ✅ `apps/dashboard/api/openai-chat.ts` - Backend API endpoint
- ✅ `apps/dashboard/src/services/openaiService.ts` - Auto-switches to API
- ✅ `apps/dashboard/.env.production` - Production config
- ✅ Frontend components already use the service

The chatbot is production-ready! Just add the environment variables and deploy. 🚀