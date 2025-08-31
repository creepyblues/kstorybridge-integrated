# 🔒 Secure OpenAI Production Setup

## ⚠️ Current Security Issue

The OpenAI client currently runs in the browser with `dangerouslyAllowBrowser: true`, which **exposes your API key** to client-side code. This is a **critical security vulnerability** in production.

## 🚨 Immediate Actions Required

### Option 1: Disable OpenAI in Production (Recommended)
The service is now configured to automatically disable in production for security.

**Current Status**: OpenAI will be **disabled** in production unless explicitly overridden.

### Option 2: Force Enable (NOT RECOMMENDED)
Only use this for **temporary testing**:

```bash
# In your deployment platform (Vercel, Netlify, etc.)
VITE_OPENAI_ENABLED=true
VITE_FORCE_OPENAI_PRODUCTION=true
VITE_OPENAI_API_KEY=sk-your-production-key-here
```

⚠️ **WARNING**: This exposes your API key in the browser! Use only for testing.

## 🔧 Proper Production Solutions

### Solution 1: Backend API Proxy (Recommended)

Create a secure backend API endpoint that handles OpenAI requests:

```typescript
// backend/api/openai-proxy.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only
});

export async function POST(request: Request) {
  const { query, userId } = await request.json();
  
  // Add authentication/rate limiting here
  if (!isValidUser(userId)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      max_tokens: 600,
    });
    
    return Response.json({
      message: response.choices[0].message.content,
      // Don't expose internal details
    });
  } catch (error) {
    return new Response('OpenAI Error', { status: 500 });
  }
}
```

Then update the frontend service:

```typescript
// frontend: openaiService.ts
async generateChatResponse(userQuery: string): Promise<LLMChatResponse> {
  // In production, call your backend API
  if (import.meta.env.PROD) {
    const response = await fetch('/api/openai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery, userId: this.userId }),
    });
    
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  }
  
  // Development: use direct client (current implementation)
  return this.generateChatResponseDirect(userQuery);
}
```

### Solution 2: Serverless Functions

Use Vercel Functions, Netlify Functions, or similar:

```typescript
// api/openai.ts (Vercel function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      max_tokens: 600,
    });

    res.json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({ error: 'OpenAI request failed' });
  }
}
```

## 🚀 Deployment Configuration

### Vercel Deployment

1. **Environment Variables** (in Vercel dashboard):
```
VITE_OPENAI_ENABLED=true
# Don't set VITE_OPENAI_API_KEY - use backend API instead
```

2. **Serverless Function**:
```
OPENAI_API_KEY=sk-your-production-key-here
```

### Netlify Deployment

1. **Environment Variables**:
```
VITE_OPENAI_ENABLED=true
```

2. **Netlify Function**:
```
OPENAI_API_KEY=sk-your-production-key-here
```

## 🧪 Testing Production Setup

1. **Build for production**:
```bash
npm run build:dashboard
```

2. **Check console logs**:
- Should show "OpenAI client disabled in production for security"
- No API keys should be visible in browser dev tools

3. **Test API endpoints**:
```bash
curl -X POST https://yourdomain.com/api/openai-proxy \
  -H "Content-Type: application/json" \
  -d '{"query": "test message"}'
```

## 📋 Security Checklist

- [ ] ✅ OpenAI API key is NOT in client-side code
- [ ] ✅ API key is stored in backend environment variables only
- [ ] ✅ Frontend calls secure backend API endpoints
- [ ] ✅ Backend validates authentication/authorization
- [ ] ✅ Rate limiting implemented
- [ ] ✅ Error handling doesn't expose internal details
- [ ] ✅ API key rotation plan in place

## 🔄 Migration Steps

1. **Phase 1**: Disable production OpenAI (current state)
2. **Phase 2**: Implement backend API proxy
3. **Phase 3**: Update frontend to use backend API
4. **Phase 4**: Remove client-side OpenAI code
5. **Phase 5**: Enable production with secure backend

## 📞 Current Status

**Development**: ✅ Works with client-side OpenAI (with warnings)
**Production**: 🔒 **Disabled for security** (shows warning messages)

To enable production temporarily (NOT RECOMMENDED):
```bash
VITE_FORCE_OPENAI_PRODUCTION=true
```

## 🎯 Next Steps

1. Choose a backend solution (API proxy or serverless functions)
2. Implement secure backend endpoint
3. Update frontend to use backend API
4. Deploy and test
5. Remove `dangerouslyAllowBrowser` completely

This ensures your OpenAI integration is secure and production-ready!