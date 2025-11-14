# Stripe Webhook Configuration Guide

**Date**: 2025-11-14
**Purpose**: Configure Stripe webhook endpoint to process subscription events
**Status**: Ready to configure

---

## Overview

The `creator-stripe-webhook` edge function is deployed and ready. This guide walks through configuring the webhook endpoint in the Stripe Dashboard to complete the payment integration.

---

## Webhook Endpoint Details

**URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook`

**Method**: POST

**Authentication**: Stripe signature verification (STRIPE_WEBHOOK_SECRET)

**Events to Monitor**:
- `checkout.session.completed` - When payment succeeds
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription status changes
- `customer.subscription.deleted` - Subscription canceled/expired
- `invoice.payment_succeeded` - Recurring payment succeeds
- `invoice.payment_failed` - Payment fails

---

## Step-by-Step Configuration

### 1. Access Stripe Webhooks Dashboard

**Test Mode** (for testing):
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Make sure "Test mode" toggle is ON (top right)

**Production Mode** (after testing):
1. Go to: https://dashboard.stripe.com/webhooks
2. Make sure "Test mode" toggle is OFF

### 2. Create New Webhook Endpoint

1. Click **"Add endpoint"** button (top right)

2. **Endpoint URL**:
   ```
   https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook
   ```

3. **Description** (optional):
   ```
   Creator subscription webhook - processes subscription lifecycle events
   ```

4. **Events to send**: Click "Select events"

### 3. Select Events

Under "Select events to listen to":

**Checkout Events**:
- ✅ `checkout.session.completed`

**Customer Events**:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

**Invoice Events**:
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

Click **"Add events"** when done.

### 4. API Version

- **Recommended**: Use latest API version (should auto-select)
- **Current deployment**: Functions work with 2023-10-16 or later

### 5. Create Endpoint

Click **"Add endpoint"** button at bottom.

---

## Verify Webhook Secret

After creating the endpoint, Stripe will show you the webhook signing secret.

### Copy Webhook Secret

1. On the webhook endpoint page, you'll see:
   ```
   Signing secret
   whsec_[rest of secret]
   ```

2. Click "Reveal" to show the full secret

3. Copy the entire secret (starts with `whsec_`)

### Verify Supabase Secret Matches

Run this command to check your current Supabase secret:

```bash
cd /Users/sungholee/code/kstorybridge
npx supabase secrets list
```

You should see:
```
STRIPE_WEBHOOK_SECRET=whsec_[your_secret]
```

**If the secrets don't match**, update it:

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_[new_secret_from_stripe]
```

**Note**: If you update the secret, you must redeploy the webhook function:

```bash
npx supabase functions deploy creator-stripe-webhook
```

---

## Test the Webhook

### Method 1: Stripe CLI (Recommended)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Forward webhook events to local (for testing):
   ```bash
   stripe listen --forward-to https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook
   ```

3. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Method 2: Stripe Dashboard

1. Go to your webhook endpoint page
2. Click **"Send test webhook"** button
3. Select event type: `checkout.session.completed`
4. Click **"Send test event"**

### Method 3: Real Payment Test

1. Go to creator app: https://creator-staging.kstorybridge.com/plan
2. Click "Go Packaging" or "Go Premium"
3. Complete checkout with test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. After payment, check webhook delivery in Stripe Dashboard

---

## Verify Webhook is Working

### Check Stripe Dashboard

1. Go to webhook endpoint page
2. Scroll to **"Recent deliveries"** section
3. You should see successful deliveries (HTTP 200)

**Success indicators**:
- ✅ HTTP 200 response
- ✅ Response time < 5 seconds
- ✅ No error messages

**Failure indicators**:
- ❌ HTTP 401 (signature verification failed - check secret)
- ❌ HTTP 500 (server error - check function logs)
- ❌ Timeout (function taking too long)

### Check Supabase Logs

```bash
npx supabase functions logs creator-stripe-webhook --limit 50
```

Look for:
```
✅ Webhook received: checkout.session.completed
✅ Processing subscription creation...
✅ Subscription created: sub_xxx
```

### Check Database

After a successful webhook event, verify data was created:

```sql
-- Check subscriptions
SELECT * FROM public.creator_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- Check payments
SELECT * FROM public.creator_payments
ORDER BY created_at DESC
LIMIT 5;

-- Check stripe customers
SELECT * FROM public.creator_stripe_customers
ORDER BY created_at DESC
LIMIT 5;
```

---

## Common Issues and Solutions

### Issue 1: HTTP 401 - Signature Verification Failed

**Cause**: Webhook secret mismatch between Stripe and Supabase

**Solution**:
1. Copy signing secret from Stripe webhook page
2. Update Supabase secret: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`
3. Redeploy function: `npx supabase functions deploy creator-stripe-webhook`

### Issue 2: HTTP 500 - Server Error

**Cause**: Function error (database, Stripe API, etc.)

**Solution**:
1. Check function logs: `npx supabase functions logs creator-stripe-webhook`
2. Look for error stack trace
3. Common causes:
   - RLS policy blocking insert
   - Missing required fields
   - Invalid foreign key reference

### Issue 3: Timeout

**Cause**: Function taking too long (>25 seconds)

**Solution**:
1. Check if database queries are slow
2. Verify Stripe API calls are completing
3. Ensure no infinite loops or heavy processing

### Issue 4: Duplicate Subscription Records

**Cause**: Webhook event processed multiple times

**Solution**:
- Function already has idempotency check using `stripe_subscription_id` unique constraint
- Duplicate events will be safely ignored
- Check logs to confirm

---

## Security Checklist

Before going live, verify:

- ✅ Webhook endpoint uses HTTPS (not HTTP)
- ✅ Signature verification is enabled (STRIPE_WEBHOOK_SECRET set)
- ✅ Test mode webhook secret is different from production
- ✅ RLS policies prevent unauthorized access
- ✅ Function logs don't expose sensitive data
- ✅ Service role key is securely stored in Supabase secrets

---

## Production Deployment

### When Ready for Production

1. **Create production webhook**:
   - Go to https://dashboard.stripe.com/webhooks (test mode OFF)
   - Add endpoint with same URL
   - Select same events
   - Copy new production signing secret

2. **Update Supabase production secret**:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_[production_secret]
   ```

3. **Redeploy function**:
   ```bash
   npx supabase functions deploy creator-stripe-webhook
   ```

4. **Test with real payment** (small amount first)

5. **Monitor for 24 hours** before full launch

---

## Monitoring and Maintenance

### Daily Checks (First Week)

- Check webhook delivery success rate in Stripe Dashboard
- Review function logs for errors
- Verify subscription records match Stripe Dashboard

### Weekly Checks (Ongoing)

- Review failed webhook deliveries
- Check for any stuck subscriptions (status mismatch)
- Verify payment records are complete

### Monthly Checks

- Audit subscription data accuracy
- Review webhook performance metrics
- Update API version if Stripe deprecates current version

---

## Next Steps

After webhook is configured:

1. ✅ Verify webhook delivery in Stripe Dashboard
2. ✅ Test complete payment flow end-to-end
3. ✅ Check billing page shows subscription correctly
4. ✅ Test subscription updates (cancel, reactivate)
5. Move to Phase 6: Feature gating implementation

---

## Reference Links

- **Stripe Webhooks Documentation**: https://stripe.com/docs/webhooks
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Integration Plan**: [STRIPE_PAYMENT_INTEGRATION_PLAN.md](./STRIPE_PAYMENT_INTEGRATION_PLAN.md)
- **Phase 3 Summary**: [PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md)

---

**Status**: Ready for configuration
**Last Updated**: 2025-11-14
