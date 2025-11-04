# Dashboard V2 - Production Ready Checklist

**Date**: 2025-11-02
**Status**: ✅ Ready for Production Deployment

---

## ✅ Critical Issues Resolved

### 1. Port Configuration ✅
- **Fixed**: All port references updated from 8086 → 8085
- **Files Updated**:
  - `.env.local` (3 occurrences)
  - `CLAUDE.md` (2 occurrences)
  - `DEPLOYMENT_CHECKLIST.md` (4 occurrences)
  - `STRIPE_SETUP_GUIDE.md` (1 occurrence)
  - `supabase/functions/create-checkout-session/index.ts` (1 occurrence)

### 2. Vercel Configuration ✅
- **Created**: `vercel.json` with proper SPA rewrites
- **Content**:
  - SPA routing configuration
  - Build command specified
  - Output directory configured
  - Framework set to Vite

### 3. Edge Functions ✅
- **Copied 6 Critical Functions** from dashboard to dashboard-v2:
  1. ✅ `chat-orchestrator` - AI chatbot (CRITICAL)
  2. ✅ `create-buyer-profile` - Email signup (CRITICAL)
  3. ✅ `create-oauth-profile` - OAuth signup (CRITICAL)
  4. ✅ `send-email` - Welcome emails (CRITICAL)
  5. ✅ `create-billing-portal` - Stripe management
  6. ✅ `cancel-subscription` - Subscription cancellation

### 4. TypeScript Build Errors ✅
- **Fixed**: TitleEditModal.tsx field name mismatch
- **Change**: `description` → `synopsis` to match Title interface
- **Result**: Build completes successfully in 1.21s

### 5. Build Verification ✅
- **TypeScript**: Zero errors (strict mode)
- **Bundle Size**: 426.47 KB (gzipped: 121.94 KB)
- **CSS**: 29.16 KB (gzipped: 6.12 KB)
- **Total Gzipped**: ~128 KB
- **Build Time**: 1.21s

---

## 🎯 Production Deployment Readiness

### Environment Isolation ✅

**Development (Local)**:
- Port: 8085
- URL: http://localhost:8085
- OAuth Callback: http://localhost:8085/auth/callback
- Supabase: Shared project (dlrnrgcoguxlkkcitlpd)

**Production**:
- Port: N/A (Vercel handles)
- URL: https://dashboard-v2.kstorybridge.com
- OAuth Callback: https://dashboard-v2.kstorybridge.com/auth/callback
- Supabase: Shared project (dlrnrgcoguxlkkcitlpd)

**Dashboard V1** (No Conflict):
- Port: 8081
- URL: https://dashboard.kstorybridge.com
- Completely isolated from V2

### Deployment Configuration ✅

**Vercel Project Settings**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

**Environment Variables** (Set in Vercel Dashboard):
```bash
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
VITE_DASHBOARD_URL=https://dashboard-v2.kstorybridge.com
```

**Edge Function Secrets** (Set in Supabase):
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_YOUR_LIVE_PRO_ID
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_YOUR_LIVE_SUITE_ID
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_SECRET
npx supabase secrets set DASHBOARD_URL=https://dashboard-v2.kstorybridge.com
```

---

## 📋 Pre-Deployment Steps

### 1. Deploy Edge Functions (10 min)
```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard-v2

# Deploy all 8 functions
npx supabase functions deploy chat-orchestrator
npx supabase functions deploy create-buyer-profile
npx supabase functions deploy create-oauth-profile
npx supabase functions deploy send-email
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-billing-portal
npx supabase functions deploy cancel-subscription

# Verify all deployed
npx supabase functions list
```

### 2. Configure Supabase OAuth (5 min)
1. Go to https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd
2. Navigate to Authentication → URL Configuration
3. Add to **Redirect URLs**:
   ```
   https://dashboard-v2.kstorybridge.com/auth/callback
   ```
4. Keep existing redirect URLs for other apps

### 3. Configure Stripe Webhook (5 min)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create new endpoint:
   - URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy webhook signing secret
4. Set in Supabase: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

### 4. Deploy to Vercel (5 min)
1. Create new Vercel project or link existing
2. Set environment variables (see above)
3. Deploy from `main` branch
4. Assign custom domain: `dashboard-v2.kstorybridge.com`

---

## 🧪 Post-Deployment Testing

### Critical Flow Tests

**1. Email Signup** (2 min):
- Navigate to https://dashboard-v2.kstorybridge.com/signup
- Enter work email, password, company, role
- Verify profile creation
- Check redirect to /buyers/chat

**2. OAuth Signup** (2 min):
- Navigate to https://dashboard-v2.kstorybridge.com/signup
- Click "Sign in with Google"
- Complete profile if new user
- Verify redirect to /buyers/chat

**3. AI Chatbot** (2 min):
- Navigate to /buyers/chat
- Send test message: "Show me romance titles"
- Verify chatbot responds with title cards
- Check edge function logs for errors

**4. Stripe Checkout** (5 min):
- Navigate to /buyers/plan
- Click "Upgrade to Pro"
- Complete checkout with test card (if test mode)
- Verify redirect to success page
- Check database tier update
- Verify webhook fired in Stripe dashboard

**5. Title Discovery** (2 min):
- Navigate to /buyers/titles
- Search for titles
- Filter by genre/format
- Click title to view details
- Save to favorites

---

## 🔒 Security Checklist

- [ ] `.env.local` not committed to git
- [ ] Production Stripe keys (not test keys) in Vercel
- [ ] Webhook signing secret set correctly
- [ ] OAuth redirect URLs match production domain
- [ ] Edge function secrets set in Supabase (not in code)
- [ ] No console.log with sensitive data
- [ ] CORS configured properly for production domain

---

## 🚀 Rollback Plan

If deployment fails:

1. **Immediate**: Revert Vercel deployment to previous version
2. **DNS**: Keep dashboard.kstorybridge.com pointing to V1
3. **Database**: No changes needed (shared database, V1 unaffected)
4. **Edge Functions**: V1 functions still deployed, no conflict

---

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Dashboard**:
   - Build logs
   - Function errors
   - Performance metrics

2. **Supabase Dashboard**:
   - Edge function logs: `npx supabase functions logs <function-name>`
   - Database queries
   - Auth errors

3. **Stripe Dashboard**:
   - Webhook delivery status
   - Failed payments
   - Subscription events

4. **Browser Console**:
   - JavaScript errors
   - Network errors
   - Auth flow issues

---

## ✅ Final Readiness Status

| Category | Status | Notes |
|----------|--------|-------|
| **Port Configuration** | ✅ Fixed | All references updated to 8085 |
| **Vercel Config** | ✅ Created | vercel.json with SPA rewrites |
| **Edge Functions** | ✅ Complete | 8 functions ready to deploy |
| **TypeScript Build** | ✅ Passing | Zero errors, 1.21s build time |
| **Bundle Size** | ✅ Optimized | 128 KB gzipped |
| **Environment Isolation** | ✅ Verified | No conflicts with V1 |
| **OAuth Config** | ⏳ Pending | Need to add production URL |
| **Stripe Config** | ⏳ Pending | Need to set live keys |
| **Edge Function Deploy** | ⏳ Pending | Need to deploy 8 functions |

**Overall Status**: Ready for production deployment after completing pending items (estimated 30 minutes)

---

**Last Updated**: 2025-11-02
**Next Step**: Deploy edge functions → Configure OAuth → Deploy to Vercel
