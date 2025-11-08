# Dashboard V2 - Deployment Status

**Last Updated**: 2025-11-02 09:19 PST
**Status**: 🟡 Partially Complete - Manual Steps Required

---

## ✅ Completed Steps

### 1. Edge Functions Deployment ✅
All 8 critical edge functions are **DEPLOYED and ACTIVE**:

| Function | Version | Status | Last Updated |
|----------|---------|--------|--------------|
| chat-orchestrator | v104 | ✅ ACTIVE | 2025-10-22 |
| create-buyer-profile | v43 | ✅ ACTIVE | 2025-10-01 |
| create-oauth-profile | v43 | ✅ ACTIVE | 2025-10-01 |
| send-email | v60 | ✅ ACTIVE | 2025-10-08 |
| create-checkout-session | v53 | ✅ ACTIVE | 2025-09-25 |
| stripe-webhook | v65 | ✅ ACTIVE | 2025-10-10 |
| create-billing-portal | v52 | ✅ ACTIVE | 2025-09-24 |
| cancel-subscription | v1 | ✅ ACTIVE | 2025-11-02 |

**Dashboard Link**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

### 2. Code Fixes ✅
- Port configuration: All references updated 8086 → 8085
- Vercel config: `vercel.json` created
- TypeScript build: Zero errors
- Edge functions: Copied to root supabase/functions/

---

## ⏳ Next Steps (Manual Configuration Required)

### Step 2: Configure Supabase OAuth Redirect URLs

**Why**: Dashboard-v2 needs its own OAuth callback URL for production

**Instructions**:
1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/auth/url-configuration
2. Scroll to **Redirect URLs** section
3. Click **Add URL** button
4. Enter: `https://dashboard-v2.kstorybridge.com/auth/callback`
5. Click **Save**

**Important Notes**:
- Keep existing redirect URLs (for dashboard v1, creator app, website)
- This is additive - won't break existing OAuth flows
- Both http://localhost:8085/auth/callback (dev) and production URL will work

**Verification**:
- Existing URLs should include:
  - `http://localhost:8081/auth/callback` (dashboard v1 local)
  - `https://dashboard.kstorybridge.com/auth/callback` (dashboard v1 prod)
  - `https://creator.kstorybridge.com/auth/callback` (creator app)
  - Plus others for website and local testing

---

### Step 3: Configure Stripe Webhook (Production)

**Why**: Stripe needs to send subscription events to your edge function

**Current Status**:
- Webhook may already exist for dashboard v1
- Need to verify it points to correct endpoint

**Instructions**:
1. Go to: https://dashboard.stripe.com/webhooks
2. Check if webhook exists with endpoint:
   ```
   https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook
   ```
3. If exists:
   - Verify events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret
4. If doesn't exist:
   - Click **Add endpoint**
   - URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
   - Select events listed above
   - Copy signing secret

5. Set webhook secret in Supabase:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

**Note**: The same webhook endpoint serves both dashboard v1 and v2 (they share the database)

---

### Step 4: Set Supabase Edge Function Secrets (Production)

**Why**: Edge functions need production Stripe keys and URLs

**Instructions**:
```bash
cd /Users/sungholee/code/kstorybridge

# Production Stripe keys (from Stripe Dashboard)
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE

# Production Price IDs (from Stripe Products)
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_YOUR_SUITE_PRICE_ID

# Production dashboard URL
npx supabase secrets set DASHBOARD_URL=https://dashboard-v2.kstorybridge.com

# Verify all secrets set
npx supabase secrets list
```

**Expected Output**:
```
STRIPE_SECRET_KEY: sk_live_*** (hidden)
STRIPE_PRICE_ID_PRO: price_***
STRIPE_PRICE_ID_SUITE: price_***
STRIPE_WEBHOOK_SECRET: whsec_*** (from Step 3)
DASHBOARD_URL: https://dashboard-v2.kstorybridge.com
```

---

### Step 5: Deploy to Vercel

**Option A: Using Vercel Dashboard** (Recommended)

1. Go to: https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import Git Repository:
   - Repository: Your monorepo
   - Root Directory: `apps/dashboard-v2`
4. Configure Project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   VITE_DASHBOARD_URL=https://dashboard-v2.kstorybridge.com
   ```
6. Click **Deploy**
7. After deployment, go to **Settings** → **Domains**
8. Add custom domain: `dashboard-v2.kstorybridge.com`

**Option B: Using Vercel CLI**

```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard-v2

# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
vercel --prod

# Follow prompts to configure
```

---

## 🧪 Post-Deployment Testing

After completing all steps, test these critical flows:

### 1. OAuth Signup (2 min)
```
URL: https://dashboard-v2.kstorybridge.com/signup
Action: Click "Sign in with Google"
Expected: Redirect to Google → Complete profile → Redirect to /buyers/chat
```

### 2. Email Signup (2 min)
```
URL: https://dashboard-v2.kstorybridge.com/signup
Action: Enter work email, password, company, role
Expected: Profile created → Redirect to /buyers/chat
```

### 3. AI Chatbot (2 min)
```
URL: https://dashboard-v2.kstorybridge.com/buyers/chat
Action: Send "Show me romance titles"
Expected: Chatbot responds with title cards
```

### 4. Stripe Checkout (5 min)
```
URL: https://dashboard-v2.kstorybridge.com/buyers/plan
Action: Click "Upgrade to Pro"
Expected: Redirect to Stripe → Complete payment → Success page
Check: Database tier updated, webhook fired
```

---

## 📊 Current Status Summary

| Task | Status | Notes |
|------|--------|-------|
| ✅ Port Configuration | Complete | All files updated to 8085 |
| ✅ Vercel Config | Complete | vercel.json created |
| ✅ Edge Functions | Complete | 8 functions deployed |
| ✅ TypeScript Build | Complete | Zero errors |
| ⏳ OAuth Config | Pending | Add production redirect URL |
| ⏳ Stripe Webhook | Pending | Verify/create webhook |
| ⏳ Edge Function Secrets | Pending | Set production keys |
| ⏳ Vercel Deployment | Pending | Deploy to production |

**Estimated Time Remaining**: 30 minutes

---

## 🚨 Important Notes

### Database Safety ✅
- Dashboard v1 and v2 share the same Supabase database
- Edge functions are shared (same endpoints)
- No migration needed
- V1 and V2 can run in parallel safely

### Rollback Plan
If something goes wrong:
1. Dashboard v1 remains unaffected (different domain, different port)
2. Can delete dashboard-v2 Vercel deployment
3. Database unchanged (shared)
4. Edge functions still serve v1

### Monitoring
After deployment:
- Vercel Dashboard: Build logs, errors
- Supabase Dashboard: Edge function logs
- Stripe Dashboard: Webhook delivery
- Browser Console: Client-side errors

---

**Last Updated**: 2025-11-02 09:19 PST
**Next Action**: Configure Supabase OAuth redirect URLs (Step 2)
