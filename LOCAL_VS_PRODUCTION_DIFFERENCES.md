# Local vs Production Environment Differences

**Last Updated**: 2025-10-03

## Executive Summary

This document outlines the key differences between local development and production environments for the KStoryBridge dashboard application. Understanding these differences is critical for accurate testing and avoiding production surprises.

## 🎯 Quick Reference

### Where Users See IDENTICAL Experience
- ✅ Database content (titles, profiles, favorites)
- ✅ Search results and ranking
- ✅ User authentication and sessions
- ✅ Cache behavior and expiry
- ✅ Tier system logic

### Where Users See DIFFERENT Experience
- ⚠️ OpenAI chat API implementation (direct vs backend proxy)
- ⚠️ Error messages and debugging verbosity
- ⚠️ OAuth redirect URLs
- ⚠️ Stripe payment mode (test vs live)
- ⚠️ API rate limits (individual vs shared)

---

## 🔧 Environment Configuration Comparison

### Local Development (.env.local)
```bash
# URLs
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173

# Database - USING PRODUCTION SUPABASE
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Testing Flags
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
VITE_OAUTH_REDIRECT_URL=http://localhost:8081/auth/callback

# OpenAI - DIRECT CLIENT MODE
VITE_OPENAI_ENABLED=true
VITE_OPENAI_API_KEY=sk-proj-... # Exposed to browser

# Optional: Force production API behavior locally
# VITE_FORCE_OPENAI_PRODUCTION=true
```

### Production (.env.production)
```bash
# URLs
VITE_WEBSITE_URL=https://kstorybridge.com
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com

# Database - PRODUCTION SUPABASE
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI - BACKEND API MODE (secure)
VITE_OPENAI_ENABLED=true
# No VITE_OPENAI_API_KEY - using backend edge function
```

---

## 🚨 Critical Differences

### 1. OpenAI Chat Implementation

#### Architecture Difference

**Local Environment:**
```
User Browser → OpenAI API (direct)
├── API Key: From VITE_OPENAI_API_KEY (.env.local)
├── Security: dangerouslyAllowBrowser: true
├── Performance: 1-2 seconds response time
└── Rate Limits: Individual developer quota
```

**Production Environment:**
```
User Browser → Supabase Edge Function → OpenAI API
├── API Key: Hidden in edge function secrets
├── Security: Never exposed to browser
├── Performance: 5-18 seconds response time
└── Rate Limits: Shared across all users
```

#### Code Implementation

**Local (direct mode):**
```typescript
// openaiService.ts lines 375-390
private shouldUseBackendAPI(): boolean {
  return import.meta.env.PROD ||
         import.meta.env.VITE_FORCE_OPENAI_PRODUCTION === 'true';
}

// Uses: new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY })
```

**Production (backend mode):**
```typescript
// chatOrchestratorService.ts lines 59-69
const response = await fetch(`${supabaseUrl}/functions/v1/chat-orchestrator`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ messages, sessionId }),
});
```

#### User-Visible Impact
- ⚠️ **Response Time**: Local is 70-90% faster (no edge function hop)
- ⚠️ **Error Messages**: Different error formats
  - Local: Direct OpenAI error codes (invalid_api_key, rate_limit_exceeded)
  - Production: Backend proxy errors (HTTP 400, 500, etc.)
- ⚠️ **Rate Limits**:
  - Local: Individual developer quota (higher for testing)
  - Production: Shared pool (may hit limits during traffic spikes)

---

### 2. Vector Search & Embeddings

#### Architecture Difference

**Local Environment:**
```typescript
// embeddingService.ts lines 51-52
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const isProduction = import.meta.env.PROD; // false in local

// Direct OpenAI embeddings API call
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: text
});
```

**Production Environment:**
```typescript
// Uses backend edge function for embedding generation
if (import.meta.env.PROD) {
  // Route through Supabase edge function
  const response = await fetch('/functions/v1/generate-embedding', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text })
  });
}
```

#### User-Visible Impact
- ✅ **Search Results**: Identical (same algorithm, same similarity thresholds)
- ⚠️ **Search Speed**: Local 2-3x faster (direct API)
- ⚠️ **Failure Modes**: Different error handling

---

### 3. Database & Data Source

#### Current Configuration (IMPORTANT)

**Both environments use the SAME production Supabase database:**
- Database URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co`
- Same tables: `titles`, `user_buyers`, `user_creators`, `user_favorites`
- Same RLS policies and permissions

#### Mock Data Toggles (Development Only)

**Local has ability to mock tier data** (currently disabled):
```typescript
// useTierAccess.ts lines 30-40
const isLocalhost = window.location.hostname === 'localhost';
const useRealDataOnLocalhost = true; // Toggle for testing
const mockTier: UserTier = 'basic'; // Can be changed to 'pro' or 'suite'

if (isLocalhost && !useRealDataOnLocalhost) {
  setTier(mockTier); // Use mock data
}
```

**Titles Service** (always uses real data):
```typescript
// titlesService.ts lines 10-15
const shouldUseMockData = () => {
  return false; // Always use real Supabase data
};
```

#### User-Visible Impact
- ✅ **Data Consistency**: Local and production show SAME content
- ✅ **User Profiles**: SAME across environments
- ✅ **Favorites**: SAME across environments
- ⚠️ **Tier Testing**: Local can mock tier (if toggle enabled), production always uses real tier

---

### 4. OAuth & Authentication

#### Redirect URLs

**Local Environment:**
```bash
VITE_OAUTH_REDIRECT_URL=http://localhost:8081/auth/callback
VITE_OAUTH_TESTING=true  # Allows localhost redirects
```

**Production Environment:**
```bash
# Callback URL: https://dashboard.kstorybridge.com/auth/callback
# Strict domain validation (no localhost allowed)
```

#### OAuth Flow Performance

**Local:**
- PKCE exchange: 1-2 seconds
- Session establishment: ~500ms
- Total OAuth flow: 1.5-2.5 seconds

**Production:**
- PKCE exchange: 5-18 seconds (network latency, geographic routing)
- Session establishment: ~2 seconds
- Total OAuth flow: 7-20 seconds

#### RLS Policy Handling

**Both environments** (after 2025-10-03 migration):
```sql
-- OAuth-friendly RLS policies with JWT fallback
CREATE POLICY "OAuth-friendly buyer profile creation"
  WITH CHECK (
    auth.uid() = id OR
    (auth.jwt() ->> 'aud' = 'authenticated' AND
     current_setting('request.jwt.claim.sub', true) = id::text)
  );
```

#### User-Visible Impact
- ⚠️ **OAuth Speed**: Local 5-10x faster
- ⚠️ **Redirect Behavior**: Different URLs but same functionality
- ✅ **Session Validity**: Same 1-hour expiry in both

---

### 5. Stripe Billing Integration

#### Configuration

**Local Environment (.env.local - not currently set):**
```bash
# Would need these for local billing testing:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Test mode only
```

**Production Environment:**
```bash
# Set via Vercel dashboard (not in .env files):
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Live mode
```

#### Webhook Handling

**Local Testing:**
- Requires Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
- Uses test webhook secret
- Test payment methods

**Production:**
- Live webhook endpoint: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
- Live webhook secret
- Real payment processing

#### User-Visible Impact
- ⚠️ **Payment Testing**: Local requires manual Stripe test setup
- ⚠️ **Tier Upgrades**: May not work locally without proper configuration
- ⚠️ **Webhook Events**: Different testing vs production events

---

### 6. Session & Cache Behavior

#### Session Management (Identical)

**Both Environments:**
- Session expiry: 1 hour of inactivity
- Auto-refresh: Every 5 minutes
- Session validation: Same integrity checks
- Cleanup: Same logout behavior

**Code Reference:**
```typescript
// sessionManager.ts - shared logic
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// DataCacheContext.tsx - shared cache
const CACHE_KEY = 'kstorybridge-session-cache';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
```

#### Testing Flags (Local Only)

**Local Environment:**
```bash
VITE_LOCAL_TESTING=true  # Bypasses some production checks
VITE_AUTH_DEBUG=true     # Verbose auth logging
```

**Production Environment:**
- No testing flags
- Strict production checks
- Minimal logging

#### User-Visible Impact
- ✅ **Session Behavior**: Identical
- ✅ **Cache Performance**: Identical
- ⚠️ **Debug Logging**: Local shows detailed logs, production shows minimal

---

## 📊 Feature Parity Matrix

| Feature | Local | Production | User-Visible Difference |
|---------|-------|------------|------------------------|
| **Database** | ✅ Prod DB | ✅ Prod DB | ❌ None - Same data |
| **Titles/Content** | ✅ Real | ✅ Real | ❌ None - Identical |
| **User Profiles** | ✅ Real | ✅ Real | ❌ None - Identical |
| **Favorites** | ✅ Real | ✅ Real | ❌ None - Identical |
| **Search Results** | ✅ Same | ✅ Same | ❌ None - Same algorithm |
| **Chat (OpenAI)** | Direct API | Edge Function | ⚠️ Speed & error messages |
| **Vector Search** | Direct API | Edge Function | ⚠️ Speed difference |
| **OAuth Flow** | localhost | Production URL | ⚠️ Speed & redirect URL |
| **Stripe Billing** | Test mode | Live mode | ⚠️ Payment processing |
| **Session Expiry** | 1 hour | 1 hour | ❌ None - Identical |
| **Cache** | Session | Session | ❌ None - Identical |
| **Error Messages** | Verbose | Production | ⚠️ Different verbosity |
| **Rate Limits** | Individual | Shared | ⚠️ Different quotas |
| **Tier Mocking** | ✅ Possible | ❌ Not allowed | ⚠️ Testing only |

---

## 🧪 Testing Guidelines

### For Accurate Local Testing

#### 1. Test Production API Behavior Locally
```bash
# In .env.local, add:
VITE_FORCE_OPENAI_PRODUCTION=true

# This routes OpenAI calls through edge functions like production
# Tests: error handling, rate limits, backend API integration
```

#### 2. Test Tier-Based Features
```typescript
// useTierAccess.ts - Toggle for tier testing
const useRealDataOnLocalhost = false; // Enable mock tier
const mockTier: UserTier = 'pro'; // Test pro features

// Test:
// - Premium content gating
// - Tier upgrade prompts
// - Pro feature access
```

#### 3. Test Stripe Billing Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local edge function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Add test keys to .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 4. Test OAuth Flows
```bash
# Test both local and production-like redirects
VITE_OAUTH_REDIRECT_URL=http://localhost:8081/auth/callback  # Local
# VITE_OAUTH_REDIRECT_URL=https://dashboard.kstorybridge.com/auth/callback  # Prod-like
```

---

### For Production Parity

#### Checklist Before Production Deploy

- [ ] Test chat with `VITE_FORCE_OPENAI_PRODUCTION=true` (backend API mode)
- [ ] Verify search results match between environments
- [ ] Test OAuth signup/signin flows end-to-end
- [ ] Verify Stripe webhooks in test mode
- [ ] Test tier upgrade flow with test payments
- [ ] Verify session expiry and refresh
- [ ] Check error handling matches production expectations
- [ ] Test rate limit behavior under load

#### Known Production-Only Issues

1. **OAuth Timing**: Production OAuth takes 5-18 seconds vs 1-2 seconds local
   - **Mitigation**: Show clear loading states, timeout handling

2. **OpenAI Rate Limits**: Shared quota in production
   - **Mitigation**: Implement request queuing, show rate limit errors gracefully

3. **Edge Function Cold Starts**: First request may be slow
   - **Mitigation**: Keep-alive pings, clear loading indicators

---

## 🔍 Debugging Environment-Specific Issues

### Issue: Chat works locally but fails in production

**Likely Causes:**
1. OpenAI API key not set in edge function secrets
2. Edge function deployment failed
3. Rate limits exceeded in production

**Debugging:**
```bash
# Check edge function logs
npx supabase functions logs chat-orchestrator

# Verify edge function secrets
npx supabase secrets list

# Test edge function directly
curl -X POST https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/chat-orchestrator \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

### Issue: Search results differ between environments

**Likely Causes:**
1. Database migration not applied in production
2. Different title data in environments
3. Vector embeddings not synchronized

**Debugging:**
```typescript
// Enable search debugging
if (import.meta.env.DEV) {
  console.log('Search query:', query);
  console.log('Results:', results);
  console.log('Similarity scores:', results.map(r => r.similarity));
}
```

### Issue: Tier system behaves differently

**Likely Causes:**
1. Mock tier enabled locally
2. Stripe subscription status not synced
3. Database tier field mismatch

**Debugging:**
```typescript
// Check tier source
console.log('Tier debug:', {
  isLocalhost,
  useRealDataOnLocalhost,
  mockTier,
  actualTier: tier,
  userId: user?.id
});
```

---

## 📝 Environment Variable Reference

### Required in All Environments
```bash
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DASHBOARD_URL=<dashboard-url>
VITE_WEBSITE_URL=<website-url>
VITE_OPENAI_ENABLED=true
```

### Local Development Only
```bash
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
VITE_OAUTH_REDIRECT_URL=http://localhost:8081/auth/callback
VITE_AUTH_DEBUG=true  # Optional: verbose auth logs
VITE_OPENAI_API_KEY=<dev-api-key>  # For direct OpenAI testing
VITE_FORCE_OPENAI_PRODUCTION=true  # Optional: test backend API mode
```

### Production Only (Set via Vercel Dashboard)
```bash
# OpenAI (in edge function secrets, not env vars)
OPENAI_API_KEY=<prod-api-key>

# Stripe (set in Vercel dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚀 Deployment Checklist

### Pre-Deployment Verification

1. **Environment Variables**
   - [ ] All production env vars set in Vercel dashboard
   - [ ] Edge function secrets configured in Supabase
   - [ ] No local-only flags in production env files

2. **Feature Testing**
   - [ ] Chat works with backend API mode
   - [ ] Search returns expected results
   - [ ] OAuth signup/signin successful
   - [ ] Stripe billing functional (test mode)
   - [ ] Tier system working correctly

3. **Performance**
   - [ ] OAuth flow < 20 seconds
   - [ ] Chat response < 10 seconds
   - [ ] Search results < 3 seconds
   - [ ] Page load < 2 seconds

4. **Error Handling**
   - [ ] OpenAI rate limit errors displayed
   - [ ] Network errors handled gracefully
   - [ ] Session expiry redirects to signin
   - [ ] Stripe payment failures shown clearly

---

## 📚 Related Documentation

- **AUTH_DOCUMENTATION.md** - Authentication system details
- **DATABASE_SCHEMA.md** - Database structure and fields
- **CLAUDE.md** - General development guidelines
- **apps/dashboard/CLAUDE.md** - Dashboard-specific documentation

---

## 🔄 Changelog

### 2025-10-03
- Initial documentation created
- Comprehensive environment comparison
- Testing guidelines added
- Debugging section added

---

## 💡 Best Practices

1. **Always test with `VITE_FORCE_OPENAI_PRODUCTION=true` before deploying chat features**
2. **Use same database (production) for local testing to ensure data consistency**
3. **Test OAuth flows on localhost AND production-like URLs**
4. **Monitor OpenAI rate limits in production (shared quota)**
5. **Keep environment variables in sync between .env files and Vercel/Supabase dashboards**
6. **Document any new environment-specific behavior in this file**
