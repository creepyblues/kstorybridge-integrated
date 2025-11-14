# Webhook Setup Checklist

**Quick reference for configuring Stripe webhook endpoint**

---

## Pre-Configuration

- [ ] Edge functions deployed successfully
- [ ] `STRIPE_WEBHOOK_SECRET` exists in Supabase secrets
- [ ] Have access to Stripe Dashboard

---

## Stripe Dashboard Configuration

### Test Mode Setup

- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Verify "Test mode" is ON
- [ ] Click "Add endpoint"
- [ ] Enter URL: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook`
- [ ] Click "Select events"

### Event Selection

- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`

### Finalize

- [ ] Click "Add events"
- [ ] Click "Add endpoint"
- [ ] Copy webhook signing secret (starts with `whsec_`)

---

## Verify Secret

- [ ] Run: `npx supabase secrets list`
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` matches
- [ ] If different, update: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`
- [ ] If updated, redeploy: `npx supabase functions deploy creator-stripe-webhook`

---

## Test Webhook

### Option 1: Stripe Dashboard Test
- [ ] Go to webhook endpoint page
- [ ] Click "Send test webhook"
- [ ] Select `checkout.session.completed`
- [ ] Click "Send test event"
- [ ] Verify HTTP 200 response

### Option 2: Real Payment Test
- [ ] Go to https://creator-staging.kstorybridge.com/plan
- [ ] Sign in as a creator
- [ ] Click "Go Packaging"
- [ ] Select a title
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Verify redirect to `/payment/success`
- [ ] Check webhook delivery in Stripe Dashboard

---

## Verify Data

- [ ] Check "Recent deliveries" in Stripe webhook page (should show HTTP 200)
- [ ] Check function logs: `npx supabase functions logs creator-stripe-webhook`
- [ ] Query database:
  ```sql
  SELECT * FROM public.creator_subscriptions ORDER BY created_at DESC LIMIT 1;
  SELECT * FROM public.creator_payments ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Go to https://creator-staging.kstorybridge.com/billing
- [ ] Verify subscription appears with correct details

---

## Production Setup (When Ready)

- [ ] Turn OFF test mode in Stripe Dashboard
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Create new endpoint with same URL and events
- [ ] Copy production webhook secret
- [ ] Update Supabase: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_[prod]`
- [ ] Redeploy: `npx supabase functions deploy creator-stripe-webhook`
- [ ] Test with real payment (small amount)
- [ ] Monitor for 24 hours

---

## Troubleshooting

**HTTP 401 Response**:
- Secret mismatch → Update Supabase secret and redeploy

**HTTP 500 Response**:
- Check function logs → `npx supabase functions logs creator-stripe-webhook`

**No Response**:
- Verify URL is correct
- Check Supabase project is not paused

**Data Not Appearing**:
- Check RLS policies
- Verify foreign key constraints (title_id exists)
- Check function logs for errors

---

**Status**: Ready to configure
**Time Required**: ~10 minutes
**Last Updated**: 2025-11-14
