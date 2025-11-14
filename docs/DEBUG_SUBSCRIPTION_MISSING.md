# Debug Guide: Subscription Missing But Payment Exists

**Issue**: Billing page shows transaction ($100 PAID) but no active subscription

**Root Cause**: Webhook is processing payment but failing to create subscription record

---

## Step 1: Run Database Debug Query (2 min)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql/new
2. Copy and paste contents of `/scripts/debug-subscription-issue.sql`
3. Click "Run"

**What to look for**:
- ✅ Payment record exists (amount: $100, status: succeeded)
- ❌ Subscription record missing (no rows)
- ✅ Stripe customer record exists
- ✅ Your titles exist with correct `creator_id` (UUID matching your auth user)

---

## Step 2: Check Stripe Webhook Logs (3 min)

### Manual Check (Recommended)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Make sure "Test mode" is ON
3. Click on your webhook endpoint (should be: `...creator-stripe-webhook`)
4. Scroll to "Webhook attempts" section
5. Find recent `checkout.session.completed` event (timestamp: Nov 14, 2025)
6. Click on the event

**Check Response Tab**:
- HTTP Status: Should be 200 or 500?
- Response body: Any error messages?

**Check Request Tab**:
- Verify `data.object.metadata` has:
  - `title_id`: UUID of your title
  - `creator_email`: your email
  - `plan_type`: 'packaging' or 'premium'
  - `billing_period`: 'monthly' or 'yearly'

**Common Issues**:
- HTTP 500 = Database error (subscription insert failed)
- Missing metadata = Checkout session created without proper metadata
- Wrong title_id = Title doesn't exist or doesn't match

---

## Step 3: Check Supabase Edge Function Logs (2 min)

1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
2. Click on `creator-stripe-webhook`
3. Click "Logs" tab
4. Filter by recent timestamp (Nov 14, 2025)

**Look for error messages**:
```
❌ Failed to create subscription record: [error details]
```

**Common Errors**:
- `foreign key constraint violation`: title_id doesn't exist in titles table
- `duplicate key value`: Subscription already exists (unlikely)
- `null value in column`: Missing required field

---

## Step 4: Analyze Results

### Scenario A: Webhook Never Fired
**Symptoms**:
- No webhook attempt in Stripe Dashboard
- No logs in Supabase Edge Functions

**Cause**: Webhook endpoint not configured in Stripe

**Fix**: Configure webhook endpoint:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

---

### Scenario B: Webhook Fired But Subscription Creation Failed
**Symptoms**:
- ✅ Webhook attempt shows in Stripe (HTTP 200 or 500)
- ✅ Payment record exists
- ❌ Subscription record missing
- ✅ Error in Supabase logs

**Common Causes**:

**1. Foreign Key Constraint Violation**:
```
ERROR: insert or update on table "creator_subscriptions" violates foreign key constraint
```

**Solution**:
- Check if `title_id` in metadata matches an actual title
- Verify title exists: `SELECT * FROM titles WHERE title_id = '[uuid_from_metadata]'`
- If title missing, checkout function query failed (bug in line 83)

**2. Title Ownership Check Failed**:
```
Title not found or you do not have access to this title
```

**Solution**:
- Edge function query at line 83 uses wrong field
- Should be: `.eq('creator_id', user.id)` for UUID
- Or: `.eq('creator_id', user.email)` for email
- Check database: `titles.creator_id` stores UUID or email?

**3. Email Mismatch**:
```
creator_email doesn't match
```

**Solution**:
- Check if `creator_email` in metadata matches actual user email
- Case sensitivity issue (use lowercase)

---

### Scenario C: Metadata Missing
**Symptoms**:
- Webhook fired (HTTP 200)
- No error in logs
- Subscription creation skipped
- Payment created

**Cause**: Checkout session metadata missing or incomplete

**Fix**:
- Check Stripe checkout session metadata (lines 207-214 in edge function)
- Ensure `title_id`, `creator_email`, `plan_type`, `billing_period` are set

---

## Step 5: Apply Fix Based on Analysis

### Fix 1: Title Ownership Query Bug

**If** debug query shows:
- ✅ Your title exists in database
- ✅ `creator_id` matches your auth UUID
- ❌ But checkout function can't find it

**Then** fix line 83 in `create-creator-checkout/index.ts`:

```typescript
// Current
.eq('creator_id', user.email)  // If using email

// Should be
.eq('creator_id', user.id)  // If titles.creator_id is UUID
```

**Deploy**:
```bash
npx supabase functions deploy create-creator-checkout
```

### Fix 2: Webhook Subscription Insert Error

**If** Supabase logs show foreign key error:

**Then** check webhook code (line 154-169) and verify:
- `title_id` from metadata exists in `titles` table
- `creator_email` is correctly formatted

### Fix 3: Webhook Not Configured

**If** no webhook attempts in Stripe:

**Then** add webhook endpoint in Stripe Dashboard (see Scenario A above)

---

## Step 6: Test Again

After applying fix:

1. Complete new test payment
2. Use different test card to avoid duplicate: `5555 5555 5555 4444`
3. Check webhook logs in Stripe immediately
4. Check Supabase function logs
5. Refresh billing page
6. Should now see subscription!

---

## Quick Diagnosis Checklist

Run through this checklist:

- [ ] Database query shows payment record exists
- [ ] Database query shows NO subscription record
- [ ] Stripe webhook dashboard shows recent `checkout.session.completed` event
- [ ] Stripe webhook response is HTTP 200 or 500?
- [ ] Stripe webhook request has complete metadata (title_id, creator_email, etc.)?
- [ ] Supabase edge function logs show error message
- [ ] Identified specific error (FK constraint, missing data, etc.)
- [ ] Applied appropriate fix
- [ ] Redeployed edge function if needed
- [ ] Tested with new payment
- [ ] Subscription now appears in billing page

---

**Created**: 2025-11-14
**Purpose**: Debug missing subscription record when payment exists
**Related**: Stripe payment integration Phase 3-5
