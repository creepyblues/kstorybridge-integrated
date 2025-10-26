# Stripe Integration Setup Guide

**Status**: Implementation Complete - Configuration Required
**Date**: 2025-10-26

---

## 📋 Overview

The dashboard-v2 has a complete Stripe integration implementation with:
- ✅ Checkout session edge function
- ✅ Webhook handler for subscription events
- ✅ Frontend checkout flow
- ⚠️ Requires Stripe account configuration

---

## 🔧 Setup Steps

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Navigate to Developers → API Keys

### 2. Get API Keys

From your Stripe Dashboard (Developers → API Keys):

**Test Mode** (for development):
- **Publishable key**: `pk_test_...`
- **Secret key**: `sk_test_...`

**Live Mode** (for production):
- **Publishable key**: `pk_live_...`
- **Secret key**: `sk_live_...`

### 3. Create Products and Prices

1. Go to Products → Add Product
2. Create two products:

**Pro Plan**:
- Name: Pro Plan
- Description: Access to pitch decks and premium features
- Price: $99.00 / month
- Recurring: Monthly
- Copy the **Price ID**: `price_xxxxx...`

**Suite Plan**:
- Name: Suite Plan
- Description: Full access with priority support
- Price: $299.00 / month
- Recurring: Monthly
- Copy the **Price ID**: `price_xxxxx...`

### 4. Set Environment Variables

#### Local Development (.env.local)

Add to `/apps/dashboard-v2/.env.local`:

```bash
# Existing Supabase vars
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe Configuration (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

#### Edge Function Secrets

Set these secrets in Supabase CLI:

```bash
# Navigate to project root
cd /Users/sungholee/code/kstorybridge

# Set Stripe secret key (Test Mode)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Set Price IDs
npx supabase secrets set STRIPE_PRICE_ID_PRO=price_xxxxx_pro
npx supabase secrets set STRIPE_PRICE_ID_SUITE=price_xxxxx_suite

# Set dashboard URL (for callbacks)
npx supabase secrets set DASHBOARD_URL=http://localhost:8086

# List secrets to verify
npx supabase secrets list
```

#### Production (Vercel)

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
```

In Supabase Dashboard → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_PRICE_ID_PRO=price_xxxxx_pro_live
STRIPE_PRICE_ID_SUITE=price_xxxxx_suite_live
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from step 5)
DASHBOARD_URL=https://dashboard-v2.kstorybridge.com
```

### 5. Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint"

**Endpoint URL**:
- Development: `http://localhost:54321/functions/v1/stripe-webhook`
- Production: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`

**Events to listen for**:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

3. Click "Add endpoint"
4. Copy the **Signing secret**: `whsec_xxxxx...`
5. Add to edge function secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
   ```

### 6. Deploy Edge Functions

```bash
# Navigate to dashboard-v2
cd /Users/sungholee/code/kstorybridge/apps/dashboard-v2

# Deploy checkout session function
npx supabase functions deploy create-checkout-session

# Deploy webhook handler
npx supabase functions deploy stripe-webhook

# Verify deployment
npx supabase functions list
```

### 7. Test the Integration

1. Start local dev server: `npm run dev`
2. Navigate to `/buyers/plan`
3. Click "Upgrade to Pro"
4. Should redirect to Stripe Checkout (Test Mode)
5. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
6. Complete checkout
7. Should redirect to `/buyers/checkout/success`
8. Check database - user tier should be updated to 'pro'

---

## 🧪 Test Cards (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Card declined |
| 4000 0000 0000 0341 | Requires authentication |

**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP**: Any 5 digits

---

## 🔍 Troubleshooting

### Checkout Session Fails

**Error**: "STRIPE_SECRET_KEY not configured"
- **Solution**: Set edge function secret via `npx supabase secrets set`

**Error**: "No checkout URL returned"
- **Solution**: Check Stripe API logs for error details

### Webhook Not Firing

**Issue**: Tier not updating after payment
- **Solution**:
  1. Check webhook endpoint URL is correct
  2. Verify webhook secret is set
  3. Check Stripe Dashboard → Webhooks for delivery attempts
  4. View edge function logs: `npx supabase functions logs stripe-webhook`

### Database Update Fails

**Issue**: Webhook fires but tier doesn't update
- **Solution**:
  1. Check `stripe_customer_id` and `stripe_subscription_id` columns exist in `user_buyers` table
  2. Verify RLS policies allow service role to update
  3. Check edge function logs for detailed error

---

## 📊 Database Schema Updates

Add these columns to `user_buyers` table if missing:

```sql
ALTER TABLE user_buyers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_buyers_stripe_customer_id
ON user_buyers(stripe_customer_id);
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Switch to Stripe Live Mode API keys
- [ ] Create Live Mode products and prices
- [ ] Update Stripe Price IDs in edge function secrets
- [ ] Update webhook endpoint to production URL
- [ ] Test full checkout flow in Live Mode
- [ ] Verify webhook delivery in Live Mode
- [ ] Set up Stripe email notifications
- [ ] Configure billing portal (optional)
- [ ] Add terms of service and privacy policy links
- [ ] Test subscription cancellation flow
- [ ] Test subscription upgrade/downgrade

---

## 📝 Additional Features (Future)

### Billing Portal

Allow users to manage their subscriptions:

```typescript
// In Profile.tsx, add:
const handleManageBilling = async () => {
  const { data } = await supabase.functions.invoke('create-billing-portal', {
    body: { customerId: stripeCustomerId },
  });
  window.location.href = data.url;
};
```

### Proration

Stripe automatically handles proration when users upgrade/downgrade mid-cycle.

### Trial Periods

Add `trial_period_days` to checkout session:

```typescript
'subscription_data[trial_period_days]': '14',
```

---

## 📞 Support

- **Stripe Docs**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Webhook Testing**: https://stripe.com/docs/webhooks/test

---

**Last Updated**: 2025-10-26
**Status**: Ready for configuration
