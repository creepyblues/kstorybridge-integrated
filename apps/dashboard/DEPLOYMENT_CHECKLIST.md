# Dashboard V2 Deployment Checklist

**Date**: 2025-10-26
**Status**: Ready for Manual Configuration

---

## ✅ What's Already Done

- [x] All Supabase credentials copied from dashboard app
- [x] `.env.local` created with correct port (8085)
- [x] OAuth redirect URL configured for localhost
- [x] Edge functions created (create-checkout-session, stripe-webhook)
- [x] Complete codebase implemented (Phases 1-5)
- [x] Production build tested (427KB, zero errors)

---

## 📋 Manual Steps Required

### 1. Stripe Account Setup (15-20 minutes)

**Create Stripe Account**:
1. Go to https://stripe.com and create account
2. Complete business verification

**Get API Keys**:
1. Navigate to Developers → API Keys
2. Copy **Test Mode** keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
3. **Action**: Update `.env.local` line 30:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
   ```

**Create Products**:
1. Go to Products → Add Product
2. Create **Pro Plan**:
   - Name: Pro Plan
   - Price: $99.00 / month
   - Recurring: Monthly
   - **Copy Price ID**: `price_xxxxx...`
3. Create **Suite Plan**:
   - Name: Suite Plan
   - Price: $299.00 / month
   - Recurring: Monthly
   - **Copy Price ID**: `price_xxxxx...`

---

### 2. Configure Edge Function Secrets (5 minutes)

**Run these commands** from dashboard-v2 directory:

```bash
# Navigate to dashboard-v2
cd /Users/sungholee/code/kstorybridge/apps/dashboard-v2

# Set Stripe secret key (from Step 1)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Set Price IDs (from Step 1)
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_YOUR_SUITE_ID

# Set dashboard URL
npx supabase secrets set DASHBOARD_URL=http://localhost:8085

# Verify secrets were set
npx supabase secrets list
```

**Expected Output**:
```
STRIPE_SECRET_KEY: sk_test_*** (hidden)
STRIPE_PRICE_ID_PRO: price_***
STRIPE_PRICE_ID_SUITE: price_***
DASHBOARD_URL: http://localhost:8085
```

---

### 3. Deploy Edge Functions (2 minutes)

```bash
# Still in dashboard-v2 directory
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook

# Verify deployment
npx supabase functions list
```

**Expected Output**:
```
create-checkout-session - Deployed
stripe-webhook - Deployed
```

---

### 4. Setup Stripe Webhook (5 minutes)

**In Stripe Dashboard**:
1. Go to Developers → Webhooks
2. Click "+ Add endpoint"
3. **Endpoint URL**:
   ```
   https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook
   ```
4. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. **Copy Signing Secret**: `whsec_xxxxx...`

**Set webhook secret**:
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

---

### 5. Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# Server should start on http://localhost:8085
```

**Test Flow**:
1. Navigate to http://localhost:8085/signin
2. Sign in with test account
3. Go to `/buyers/plan`
4. Click "Upgrade to Pro"
5. Should redirect to Stripe Checkout
6. Use test card: `4242 4242 4242 4242`
7. Complete checkout
8. Should redirect to success page
9. Check database - tier should update to 'pro'

---

### 6. Database Migration (Optional - if not already done)

**Run this SQL in Supabase**:

```sql
-- Add Stripe columns if they don't exist
ALTER TABLE user_buyers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_buyers_stripe_customer_id
ON user_buyers(stripe_customer_id);
```

**How to run**:
1. Go to https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd
2. Click SQL Editor
3. Paste SQL above
4. Click "Run"

---

### 7. Production Deployment (When Ready)

**Update Stripe to Live Mode**:
1. Get Live Mode API keys from Stripe
2. Create Live Mode products and get Price IDs
3. Update `.env.local` with live publishable key

**Vercel Environment Variables**:
Set these in Vercel Dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (same as local)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
```

**Production Edge Function Secrets**:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_YOUR_LIVE_PRO_ID
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_YOUR_LIVE_SUITE_ID
npx supabase secrets set DASHBOARD_URL=https://dashboard-v2.kstorybridge.com
```

**Update Stripe Webhook**:
- Endpoint URL: Same as above (edge function handles both test/live)
- Copy new webhook secret
- Set: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_LIVE_SECRET`

**Update Supabase OAuth**:
- Go to Authentication → URL Configuration
- Add to Redirect URLs: `https://dashboard-v2.kstorybridge.com/auth/callback`

---

## 🧪 Test Cards (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Card declined |
| 4000 0000 0000 0341 | Requires authentication |

**All test cards**:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## 📊 Verification Checklist

After completing all steps, verify:

- [ ] `.env.local` has Stripe publishable key
- [ ] Edge function secrets are set (run `npx supabase secrets list`)
- [ ] Edge functions are deployed (run `npx supabase functions list`)
- [ ] Stripe webhook endpoint created
- [ ] Webhook secret is set
- [ ] Local dev server starts without errors
- [ ] Can navigate to /buyers/plan
- [ ] Clicking upgrade redirects to Stripe
- [ ] Test checkout completes successfully
- [ ] User tier updates in database after checkout
- [ ] Database has stripe_customer_id columns

---

## 🆘 Troubleshooting

**Issue**: "STRIPE_SECRET_KEY not configured"
- **Solution**: Run `npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...`

**Issue**: Checkout redirect fails
- **Solution**: Check browser console for errors, verify edge function logs

**Issue**: Tier doesn't update after payment
- **Solution**:
  1. Check Stripe Dashboard → Webhooks for delivery attempts
  2. View edge function logs: `npx supabase functions logs stripe-webhook`
  3. Verify webhook secret is correct

**Issue**: OAuth fails on localhost
- **Solution**: Make sure `VITE_OAUTH_REDIRECT_URL=http://localhost:8085/auth/callback` in `.env.local`

---

## 📞 Resources

- **Stripe Docs**: https://stripe.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Complete Guide**: See `STRIPE_SETUP_GUIDE.md` for detailed instructions

---

**Estimated Total Time**: 30-35 minutes

**Status**: All automatic setup complete ✅
**Next Step**: Follow Manual Steps 1-7 above
