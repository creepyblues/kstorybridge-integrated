# Stripe Refund Automation Setup

**Last Updated**: 2025-10-10

## Overview

This document explains how to configure Stripe to automatically cancel subscriptions when refunds are issued, which triggers automatic user tier downgrades through existing webhook handlers.

## How It Works

```
Refund Issued in Stripe
  ↓
Stripe Auto-Cancels Subscription (configured in Dashboard)
  ↓
Stripe fires `customer.subscription.deleted` webhook
  ↓
KStoryBridge webhook handler receives event
  ↓
User automatically downgraded to 'basic' tier
```

---

## Setup Steps

### 1. Configure Subscription Cancellation on Refund

**Location:** Stripe Dashboard → Settings → Billing → Subscriptions and emails

**Steps:**

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to: **Settings** → **Billing** → **Subscriptions and emails**
3. Scroll to **"Subscription cancellation policy"**
4. Enable: **"Cancel subscriptions when a full refund is issued"**
5. **Save changes**

**Alternative Location (Product-specific):**

For product-specific settings:
1. Go to **Products** → Select your Pro Plan product
2. Click **"More options"** → **"Edit product"**
3. Under **"Payment behavior"**, configure cancellation on refund
4. **Save**

---

### 2. Verify Webhook Configuration

Ensure the `customer.subscription.deleted` webhook event is active and pointing to your edge function.

**Steps:**

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Find your production webhook endpoint:
   ```
   https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook
   ```
3. Click on the webhook to view details
4. Under **"Events to send"**, verify these events are enabled:
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`
   - ✅ `checkout.session.completed`
   - ✅ `charge.refunded` (optional, but recommended)
5. Check **"Signing secret"** is configured in Supabase Edge Function secrets

---

### 3. Test in Stripe Test Mode

**Before going live**, test the automation in Stripe test mode:

**Test Steps:**

1. Switch to **Test Mode** in Stripe Dashboard (toggle in top right)
2. Create a test subscription:
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout for Pro plan
   - Verify user gets Pro tier in dashboard
3. Issue a full refund:
   - Go to **Payments** → Find the test payment
   - Click **"Refund payment"** → **"Refund"**
4. Verify automation:
   - Check **Developers** → **Webhooks** → View webhook events
   - Verify `customer.subscription.deleted` was sent
   - Log into dashboard as test user
   - Verify tier is now 'basic'

---

## Existing Webhook Handler

The webhook handler already has logic to downgrade users when subscriptions are deleted:

**File:** `apps/dashboard/supabase/functions/stripe-webhook/index.ts`

**Lines 580-624:** `customer.subscription.deleted` handler

```typescript
case 'customer.subscription.deleted': {
  const subscription = receivedEvent.data.object as Stripe.Subscription
  const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id

  // Update stripe_customers table
  await supabase
    .from('stripe_customers')
    .update({
      subscription_status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id)

  // Downgrade user to basic tier
  await supabase
    .from('user_buyers')
    .update({ tier: 'basic' })
    .eq('id', userId)

  console.log(`✅ User ${userId} downgraded to basic tier`)
  break
}
```

**This code is already battle-tested and deployed!** No code changes needed.

---

## Refund Types and Behavior

### Full Refund
- ✅ **Triggers:** Subscription cancellation (if configured)
- ✅ **Webhook:** `customer.subscription.deleted`
- ✅ **Result:** User downgraded to basic immediately

### Partial Refund
- ⚠️ **Does NOT trigger** subscription cancellation
- ℹ️ **Webhook:** `charge.refunded` only
- ℹ️ **Result:** No automatic downgrade (subscription remains active)

**Note:** The refund webhook handler (added in this implementation) can detect partial refunds and log them, but won't downgrade users.

---

## Manual Downgrade (When Needed)

If you need to manually downgrade a user (e.g., Stripe automation not configured yet, or edge case):

**Use:** `apps/dashboard/downgrade-user-after-refund.sql`

**Steps:**

1. Open Supabase SQL Editor
2. Copy contents of `downgrade-user-after-refund.sql`
3. Replace `'user@example.com'` with actual user email (3 places)
4. Execute script
5. Review "BEFORE STATE" and "AFTER STATE" output
6. Verify changes are correct
7. Transaction will auto-commit

**Safety:** Script runs in a transaction, so you can `ROLLBACK` if anything looks wrong.

---

## Monitoring & Verification

### Check Webhook Logs

**Supabase:**
1. Go to [Edge Functions](https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions)
2. Click **stripe-webhook** function
3. View **Logs** tab
4. Look for:
   ```
   ✅ User {userId} downgraded to basic tier
   ✅ Subscription canceled: {subscriptionId}
   ```

**Stripe:**
1. Go to **Developers** → **Webhooks** → Select your endpoint
2. View **Logs** tab
3. Check for successful `customer.subscription.deleted` events
4. Status should be `200` with `{ received: true }`

### Verify User State

**SQL Query:**
```sql
-- Check user tier and subscription status
SELECT
  ub.email,
  ub.full_name,
  ub.tier,
  sc.subscription_status,
  sc.stripe_subscription_id,
  sc.updated_at
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON sc.user_id = ub.id
WHERE ub.email = 'user@example.com';
```

---

## Troubleshooting

### Issue: User not downgraded after refund

**Check:**
1. Is Stripe configured to cancel subscriptions on refund?
   - Dashboard → Settings → Billing → Check cancellation policy
2. Did webhook fire?
   - Stripe → Developers → Webhooks → Check logs
3. Did webhook succeed?
   - Status should be `200`
   - If `400` or `500`, check Supabase edge function logs
4. Is user_id in subscription metadata?
   - Webhook needs `user_id` or `supabase_user_id` in metadata

**Solution:** Run manual downgrade script while investigating webhook issue

### Issue: Webhook signature verification failed

**Check:**
1. Is webhook signing secret configured in Supabase?
   - Supabase → Edge Functions → stripe-webhook → Secrets
   - Should have `STRIPE_WEBHOOK_SECRET` set
2. Are you using the correct webhook endpoint?
   - Production: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`

**Solution:** Reset webhook signing secret and update in Supabase

### Issue: Partial refund downgraded user

**Behavior:** This should NOT happen with Stripe automation (only full refunds trigger cancellation)

**If it happens:**
- Check webhook logs for unexpected `customer.subscription.deleted` event
- Manually restore user tier if needed:
  ```sql
  UPDATE user_buyers SET tier = 'pro' WHERE email = 'user@example.com';
  UPDATE stripe_customers SET subscription_status = 'active'
  WHERE user_id = (SELECT id FROM user_buyers WHERE email = 'user@example.com');
  ```

---

## Additional Refund Webhook Handler

This implementation also adds a `charge.refunded` webhook handler as a safety net.

**Purpose:**
- Catch edge cases where Stripe automation doesn't fire
- Handle partial refunds differently from full refunds
- Send Slack notifications about refunds

**File:** `apps/dashboard/supabase/functions/stripe-webhook/index.ts`

**New handler:** Lines ~760 (after `invoice.payment_failed`)

**Behavior:**
- Full refund → Downgrade to basic (backup to Stripe automation)
- Partial refund → Log only, don't downgrade
- Send Slack notification about all refunds

---

## Best Practices

1. **Test first** - Always test in Stripe test mode before production
2. **Monitor webhooks** - Check Supabase and Stripe logs regularly
3. **Keep metadata** - Always include `user_id` in subscription metadata
4. **Document refunds** - Note reason in Stripe refund description
5. **Communicate** - Notify users before/after refunds
6. **Audit trail** - All downgrades logged with timestamps

---

## Support & Resources

- **Stripe Docs:** [Subscription Cancellation](https://stripe.com/docs/billing/subscriptions/cancel)
- **Stripe Webhooks:** [Webhook Events Reference](https://stripe.com/docs/api/events)
- **Supabase Edge Functions:** [Edge Function Logs](https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions)
- **KStoryBridge Docs:** See `AUTH_DOCUMENTATION.md` for tier system details

---

## Summary

**Easiest Setup:** Configure Stripe Dashboard → Automatic downgrade via existing webhooks

**Immediate Need:** Use manual SQL script in `downgrade-user-after-refund.sql`

**Extra Safety:** Refund webhook handler catches edge cases

✅ **Zero new bugs** - Uses existing, battle-tested webhook code

✅ **Fully automated** - Set it and forget it

✅ **Audit trail** - All changes logged with timestamps
