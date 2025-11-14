# Phase 3: Edge Functions Deployment Guide

**Date**: 2025-11-13
**Status**: 🟡 Ready to Deploy
**Prerequisites**: Phase 1 ✅, Phase 2 ✅

---

## 📋 Overview

Phase 3 creates 3 Supabase edge functions for creator subscription processing:
1. **create-creator-checkout** - Creates Stripe checkout sessions
2. **creator-stripe-webhook** - Processes Stripe webhook events
3. **get-creator-billing-history** - Fetches billing data for creators

---

## ✅ Files Created

All edge functions created in `/supabase/functions/`:

- ✅ `create-creator-checkout/index.ts` (250 lines)
- ✅ `creator-stripe-webhook/index.ts` (380 lines)
- ✅ `get-creator-billing-history/index.ts` (220 lines)

---

## 🚀 Deployment Steps

### Step 1: Configure Supabase Secrets

Run from project root:

```bash
cd /Users/sungholee/code/kstorybridge

# Set Stripe secret key (test mode)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Verify secrets
npx supabase secrets list
```

**Note**: Webhook secret will be set after creating the webhook endpoint (Step 3).

---

### Step 2: Deploy Edge Functions

Deploy all 3 functions to Supabase:

```bash
# Deploy checkout function
npx supabase functions deploy create-creator-checkout

# Deploy webhook function
npx supabase functions deploy creator-stripe-webhook

# Deploy billing history function
npx supabase functions deploy get-creator-billing-history
```

**Expected Output**:
```
✓ Deployed create-creator-checkout (project-ref: YOUR_PROJECT_REF)
✓ Deployed creator-stripe-webhook (project-ref: YOUR_PROJECT_REF)
✓ Deployed get-creator-billing-history (project-ref: YOUR_PROJECT_REF)
```

**Function URLs** (note these down):
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-creator-checkout
https://YOUR_PROJECT_REF.supabase.co/functions/v1/creator-stripe-webhook
https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-creator-billing-history
```

---

### Step 3: Configure Stripe Webhook

#### 3.1 Create Webhook Endpoint in Stripe Dashboard

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/creator-stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**

#### 3.2 Get Webhook Signing Secret

After creating the endpoint:
1. Click on the webhook endpoint you just created
2. Find **"Signing secret"** section
3. Click **"Reveal"** to show the secret
4. Copy the secret (starts with `whsec_...`)

#### 3.3 Configure Webhook Secret in Supabase

```bash
cd /Users/sungholee/code/kstorybridge

# Set webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Verify it was set
npx supabase secrets list
```

---

### Step 4: Test Edge Functions

#### 4.1 Test Checkout Function (Local)

Start local Supabase:
```bash
npx supabase functions serve
```

Test with curl:
```bash
curl -i -X POST \
  'http://localhost:54321/functions/v1/create-creator-checkout' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "plan_type": "packaging",
    "billing_period": "monthly",
    "title_id": "YOUR_TEST_TITLE_ID"
  }'
```

**Expected Response**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

#### 4.2 Test Webhook Function (Local)

In a separate terminal, forward Stripe events to local webhook:

```bash
stripe listen --forward-to localhost:54321/functions/v1/creator-stripe-webhook
```

**Expected Output**:
```
Ready! You are using Stripe API Version [2024-06-20]. Your webhook signing secret is whsec_... (^C to quit)
```

Trigger a test event:
```bash
stripe trigger checkout.session.completed
```

**Check logs** in the `npx supabase functions serve` terminal for webhook processing.

#### 4.3 Test Billing History Function

```bash
curl -i -X GET \
  'http://localhost:54321/functions/v1/get-creator-billing-history' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Expected Response**:
```json
{
  "subscriptions": [],
  "transactions": [],
  "paymentMethod": null
}
```

---

### Step 5: Test Production Deployment

#### 5.1 Test Checkout (Production)

```bash
curl -i -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-creator-checkout' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "plan_type": "premium",
    "billing_period": "yearly",
    "title_id": "YOUR_TEST_TITLE_ID"
  }'
```

#### 5.2 Trigger Test Webhook (Production)

In Stripe Dashboard:
1. Go to Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select event: `checkout.session.completed`
4. Click "Send test webhook"

**Check Supabase Logs**:
```bash
npx supabase functions logs creator-stripe-webhook
```

---

## 🔍 Verification Checklist

### Edge Function Deployment
- [ ] All 3 functions deployed successfully
- [ ] Function URLs noted and accessible
- [ ] No deployment errors in output

### Supabase Secrets
- [ ] `STRIPE_SECRET_KEY` configured (starts with `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configured (starts with `whsec_`)
- [ ] `npx supabase secrets list` shows both secrets

### Stripe Webhook
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook URL matches deployed function URL
- [ ] All 6 events selected (checkout, subscription, invoice)
- [ ] Webhook signing secret copied to Supabase

### Local Testing
- [ ] Checkout function returns valid Stripe checkout URL
- [ ] Webhook function processes test events successfully
- [ ] Billing history function returns JSON response
- [ ] No errors in function logs

### Production Testing
- [ ] Production checkout function accessible
- [ ] Stripe test webhook delivers successfully
- [ ] Function logs show successful event processing
- [ ] Database records created correctly

---

## 🐛 Troubleshooting

### Issue: "No authorization header"
**Solution**: Include `Authorization: Bearer YOUR_ANON_KEY` header in request

### Issue: "Webhook signature verification failed"
**Causes**:
1. Wrong webhook secret configured
2. Using test mode secret with live mode events (or vice versa)
3. Webhook URL mismatch

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure test mode webhook is used with test mode secret
3. Redeploy webhook function: `npx supabase functions deploy creator-stripe-webhook`

### Issue: "Title not found or access denied"
**Cause**: Title doesn't exist or doesn't belong to the authenticated creator

**Solution**:
1. Verify `title_id` is valid UUID
2. Check title exists: `SELECT * FROM titles WHERE title_id = 'YOUR_TITLE_ID'`
3. Verify `creator_id` matches user email

### Issue: "This title already has an active subscription"
**Cause**: Title already has active subscription (duplicate checkout attempt)

**Solution**: This is intentional validation. Cancel existing subscription first.

### Issue: "Missing required metadata"
**Cause**: Webhook event missing required metadata fields

**Solution**: Ensure checkout session includes all metadata:
- `title_id`
- `creator_email`
- `plan_type`
- `billing_period`

---

## 📊 Edge Function Endpoints

### 1. create-creator-checkout

**URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-creator-checkout`

**Method**: POST

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "plan_type": "packaging" | "premium",
  "billing_period": "monthly" | "yearly",
  "title_id": "uuid",
  "coupon_code": "optional - not used yet"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Price IDs Used** (Launch Promo):
- Packaging Monthly: `price_1STHmPDrScgTb4BobwAFdnLQ`
- Packaging Yearly: `price_1STHsIDrScgTb4Bopkgtrz2a`
- Premium Monthly: `price_1STID2DrScgTb4BotMszm1Zn`
- Premium Yearly: `price_1STIKRDrScgTb4BoXWdU9vli`

---

### 2. creator-stripe-webhook

**URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/creator-stripe-webhook`

**Method**: POST

**Headers**:
```
Stripe-Signature: [Stripe signature]
Content-Type: application/json
```

**Request Body**: Stripe webhook event payload

**Events Handled**:
- `checkout.session.completed` → Creates subscription record
- `customer.subscription.updated` → Updates subscription status
- `customer.subscription.deleted` → Marks subscription as canceled
- `invoice.payment_succeeded` → Records payment (optional)
- `invoice.payment_failed` → Updates status to past_due

**Response**:
```json
{
  "received": true,
  "eventType": "checkout.session.completed"
}
```

---

### 3. get-creator-billing-history

**URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-creator-billing-history`

**Method**: GET

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "creator_email": "creator@example.com",
      "title_id": "uuid",
      "plan_type": "packaging",
      "billing_period": "monthly",
      "status": "active",
      "current_period_end": "2025-12-13T00:00:00Z",
      "cancel_at_period_end": false,
      "titles": {
        "title_id": "uuid",
        "title_name_kr": "제목",
        "title_name_en": "Title",
        "title_image": "https://..."
      }
    }
  ],
  "transactions": [
    {
      "id": "in_...",
      "date": "2025-11-13T00:00:00Z",
      "amount": 100.00,
      "currency": "usd",
      "status": "paid",
      "invoiceUrl": "https://...",
      "receiptUrl": "https://...",
      "paid": true
    }
  ],
  "paymentMethod": {
    "id": "pm_...",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    }
  }
}
```

---

## 🎯 Next Steps

Once Phase 3 is deployed and tested:

1. ✅ **Phase 3 Complete**: All edge functions deployed and webhook configured
2. **Skip Phase 4** (Coupon UI - on hold)
3. **Proceed to Phase 5**: Integrate payment UI in creator app
   - Update `/apps/creator/src/pages/Plan.tsx` with checkout modal
   - Call `create-creator-checkout` edge function
   - Handle success/cancel redirects
   - Create billing page using `get-creator-billing-history`

---

**Phase 3 Status**: 🟡 Ready to Deploy
**Estimated Time**: 30-45 minutes (deployment + testing)
**Last Updated**: 2025-11-13
