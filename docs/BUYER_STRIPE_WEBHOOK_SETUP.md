# Buyer Stripe Webhook Setup & Verification Guide

**Last Updated**: 2025-11-15
**Status**: ✅ Configuration Complete - Needs Stripe Dashboard Setup

---

## Overview

The buyer/dashboard Stripe webhook handles subscription events for Pro tier upgrades.

**Webhook URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`

---

## ✅ Completed Configuration

### 1. Edge Function Deployment
- ✅ Function: `stripe-webhook` deployed
- ✅ JWT bypass enabled in `config.toml`
- ✅ Signature verification implemented

### 2. Supabase Secrets (Live Mode)
```bash
✅ STRIPE_SECRET_KEY - Live mode key configured
✅ STRIPE_PRICE_ID_PRO - price_1SGrYjDrScgTb4Bok3I71wES
✅ STRIPE_WEBHOOK_SECRET - Set (verify matches Stripe Dashboard)
```

---

## 🔧 Required: Stripe Dashboard Setup

### Step 1: Navigate to Webhooks (Live Mode)

1. Go to: https://dashboard.stripe.com/webhooks
2. **IMPORTANT**: Toggle "Test mode" to **OFF** (top right corner)
3. You should see "Viewing live mode data"

### Step 2: Add or Update Webhook Endpoint

**If webhook doesn't exist**:
1. Click **"Add endpoint"**
2. Enter URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
3. Description: `KStoryBridge Buyer Pro Subscriptions (Live Mode)`

**If webhook already exists**:
1. Find the webhook endpoint (search for `dlrnrgcoguxlkkcitlpd`)
2. Click on it to edit
3. Verify URL is correct

### Step 3: Configure Events to Listen

Select the following events:

**Checkout & Subscription Events**:
- ✅ `checkout.session.completed` - Initial Pro upgrade
- ✅ `customer.subscription.created` - Subscription created
- ✅ `customer.subscription.updated` - Subscription changes
- ✅ `customer.subscription.deleted` - Subscription canceled

**Payment Events**:
- ✅ `invoice.payment_succeeded` - Recurring payment success
- ✅ `invoice.payment_failed` - Payment failure

**Refund Events**:
- ✅ `charge.refunded` - Refund processed

### Step 4: Get Signing Secret

1. After saving, click **"Reveal"** next to "Signing secret"
2. Copy the secret (starts with `whsec_`)
3. This will be used in Step 5

### Step 5: Update Supabase Secret (If Changed)

**ONLY if the signing secret is different from what's currently set**:

```bash
cd /Users/sungholee/code/kstorybridge

# Update webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE" --project-ref dlrnrgcoguxlkkcitlpd

# Redeploy webhook function to pick up new secret
npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
```

---

## 🧪 Testing the Webhook

### Test 1: Complete a Real Purchase (Live Mode)

**⚠️ WARNING**: This will charge a real credit card.

1. Go to: https://dashboard.kstorybridge.com/buyers/pricing
2. Sign in with a test account
3. Click "Upgrade to Pro"
4. Complete checkout with real card
5. After successful payment, check:
   - ✅ Redirected to `/payment/success`
   - ✅ User tier updated to `pro` in database
   - ✅ Webhook delivered successfully in Stripe Dashboard

### Test 2: Verify Webhook Delivery in Stripe

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Recent deliveries"** tab
4. You should see recent events with status:
   - ✅ **200 OK** - Webhook processed successfully
   - ❌ **401 Unauthorized** - JWT verification issue (should be fixed now)
   - ❌ **400 Bad Request** - Signature verification failed (wrong secret)
   - ❌ **500 Server Error** - Database or code error

### Test 3: Check Supabase Function Logs

```bash
# View recent webhook logs
npx supabase functions logs stripe-webhook --limit 50 --project-ref dlrnrgcoguxlkkcitlpd

# Look for these log entries:
✅ "✅ SIGNATURE VERIFICATION SUCCESSFUL"
✅ "✅ User {userId} successfully upgraded to Pro tier"
✅ "✅ Stripe customer record updated successfully"
✅ "Event recorded successfully"

# Red flags:
❌ "❌ AUTHENTICATION FAILURE: No Stripe signature header found"
❌ "❌ SIGNATURE VERIFICATION FAILED"
❌ "❌ Failed to update user tier"
```

### Test 4: Verify Database Updates

After a successful webhook:

```sql
-- Check stripe_customers table
SELECT * FROM stripe_customers
WHERE user_id = 'USER_ID_HERE';
-- Should show: subscription_status = 'active', stripe_subscription_id populated

-- Check user_buyers table
SELECT id, email, tier FROM user_buyers
WHERE id = 'USER_ID_HERE';
-- Should show: tier = 'pro'

-- Check webhook_events table (idempotency)
SELECT * FROM webhook_events
ORDER BY processed_at DESC
LIMIT 10;
-- Should show recent Stripe event IDs
```

---

## 🔍 Troubleshooting

### Issue: Webhook Returns 401 Unauthorized

**Symptom**: Stripe Dashboard shows "401 ERR" for webhook deliveries

**Causes**:
- JWT verification blocking webhooks (should be fixed now)
- Missing `verify_jwt = false` in config.toml

**Fix**:
1. Verify `/supabase/config.toml` has:
   ```toml
   [functions.stripe-webhook]
   verify_jwt = false
   ```
2. Redeploy function:
   ```bash
   npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
   ```

### Issue: Webhook Returns 400 Signature Verification Failed

**Symptom**: Stripe Dashboard shows "400 ERR" with signature verification message

**Causes**:
- Webhook secret mismatch between Stripe and Supabase
- Using test mode secret for live mode webhook (or vice versa)

**Fix**:
1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Reveal signing secret
3. Update Supabase secret:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_CORRECT_SECRET" --project-ref dlrnrgcoguxlkkcitlpd
   npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
   ```

### Issue: Webhook Returns 200 but Tier Not Updated

**Symptom**: Webhook shows success but user still has `basic` tier

**Causes**:
- Database RLS policies blocking updates
- User ID mismatch in metadata
- Subscription status not 'active' or 'trialing'

**Debug**:
1. Check function logs for the specific event:
   ```bash
   npx supabase functions logs stripe-webhook --limit 100 --project-ref dlrnrgcoguxlkkcitlpd
   ```
2. Look for error messages after "✅ SIGNATURE VERIFICATION SUCCESSFUL"
3. Check if user exists in `user_buyers` table
4. Verify subscription metadata includes `user_id` or `supabase_user_id`

### Issue: Duplicate Event Processing

**Symptom**: Same webhook event processed multiple times

**Fix**:
- Webhook has built-in idempotency via `webhook_events` table
- Check logs for "✅ Event already processed at:" messages
- Duplicates are automatically prevented (returns 200 but doesn't re-process)

---

## 📊 Webhook Event Flow

### checkout.session.completed

```
1. Stripe sends webhook → stripe-webhook function
2. Verify signature → ✅ SIGNATURE VERIFICATION SUCCESSFUL
3. Extract user_id from session.metadata
4. Retrieve subscription details from Stripe
5. Update stripe_customers table (upsert)
6. Check subscription.status = 'active' or 'trialing'
7. Update user_buyers.tier = 'pro'
8. Send Slack notification (non-blocking)
9. Record event in webhook_events (idempotency)
10. Return 200 OK to Stripe
```

### customer.subscription.updated

```
1. Extract user_id from subscription.metadata
2. Update stripe_customers (status, period_end, cancel_at_period_end)
3. Determine tier based on status:
   - active/trialing → tier = 'pro'
   - other → tier = 'basic'
4. Update user_buyers.tier
5. Send notification if upgraded to pro
6. Return 200 OK
```

### customer.subscription.deleted

```
1. Extract user_id from subscription.metadata
2. Update stripe_customers.subscription_status = 'canceled'
3. Downgrade user_buyers.tier = 'basic'
4. Return 200 OK
```

### charge.refunded

```
1. Retrieve invoice → subscription → user_id
2. Check if full refund (amount === amount_refunded)
3. If full refund:
   - Update stripe_customers.subscription_status = 'canceled'
   - Downgrade user_buyers.tier = 'basic'
   - Send notification
4. If partial refund:
   - Log for audit
   - Don't downgrade tier
5. Return 200 OK
```

---

## 📋 Post-Setup Checklist

After completing setup:

- [ ] Webhook endpoint exists in Stripe Dashboard (live mode)
- [ ] Webhook URL is correct: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
- [ ] All 7 events are selected (checkout, subscription, invoice, charge)
- [ ] Signing secret revealed and copied
- [ ] Signing secret matches `STRIPE_WEBHOOK_SECRET` in Supabase
- [ ] `verify_jwt = false` in config.toml
- [ ] Function deployed with JWT bypass
- [ ] Test purchase completed successfully
- [ ] Webhook deliveries show 200 OK status
- [ ] User tier updated to 'pro' in database
- [ ] Function logs show successful processing

---

## 🔗 Related Documentation

- [Stripe Configuration Reference](STRIPE_CONFIGURATION_REFERENCE.md) - Complete Stripe setup
- [Stripe Setup Guide](guides/STRIPE_SETUP_GUIDE.md) - Initial setup instructions
- [Dashboard CLAUDE.md](../apps/dashboard/CLAUDE.md) - Dashboard app documentation

---

## 📞 Support

**Common Commands**:
```bash
# View webhook logs
npx supabase functions logs stripe-webhook --limit 50 --project-ref dlrnrgcoguxlkkcitlpd

# List all secrets
npx supabase secrets list --project-ref dlrnrgcoguxlkkcitlpd

# Redeploy webhook
npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
```

**Stripe Dashboard URLs**:
- Live Webhooks: https://dashboard.stripe.com/webhooks
- Live Payments: https://dashboard.stripe.com/payments
- Live Subscriptions: https://dashboard.stripe.com/subscriptions

**Supabase Dashboard**:
- Functions: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- Database: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/editor

---

**Created**: 2025-11-15
**Status**: Ready for Stripe Dashboard configuration
**Next Step**: Add webhook endpoint in Stripe Dashboard (live mode)
