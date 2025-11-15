# Stripe Configuration Reference

**Last Updated**: 2025-11-14
**Status**: ✅ LIVE - Production Ready
**Integration Type**: Per-Title Creator Subscriptions with Environment-Based Configuration

---

## Overview

The Stripe payment integration uses **environment-based automatic configuration** that detects whether requests come from staging or production and uses the appropriate Stripe mode:

- **Staging** (creator-staging.kstorybridge.com) → **Test Mode** (safe testing, no real charges)
- **Production** (creator.kstorybridge.com) → **Live Mode** (real payments)
- **Localhost** (localhost:8083) → **Test Mode** (local development)

**No manual switching required** - environment detection is automatic based on request origin.

---

## Architecture

### Environment Detection

**File**: `/supabase/functions/_shared/stripe-config.ts`

Automatically detects environment from request origin header:

```typescript
export function getStripeConfig(request: Request): StripeConfig {
  const origin = request.headers.get('origin') || ''

  const isProduction = origin.includes('creator.kstorybridge.com') &&
                      !origin.includes('staging')

  const environment = isProduction ? 'production' : 'test'

  // Returns appropriate keys and prices based on environment
}
```

### Edge Functions

All three edge functions use environment-based configuration:

1. **create-creator-checkout** - Creates Stripe checkout sessions
   - Detects environment
   - Uses test/live secret key
   - Uses test/live price IDs

2. **creator-stripe-webhook** - Processes Stripe events
   - Detects environment
   - Uses test/live webhook secrets
   - Creates subscription records in database

3. **get-creator-billing-history** - Fetches billing data
   - Detects environment
   - Uses test/live secret key
   - Retrieves subscriptions and invoices

---

## Supabase Secrets Configuration

### Test Mode Secrets (6 total)

Used by: Staging, Localhost

```bash
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
STRIPE_PRICE_PACKAGING_MONTHLY_TEST=price_1STHmPDrScgTb4BobwAFdnLQ
STRIPE_PRICE_PACKAGING_YEARLY_TEST=price_1STHsIDrScgTb4Bopkgtrz2a
STRIPE_PRICE_PREMIUM_MONTHLY_TEST=price_1STID2DrScgTb4BotMszm1Zn
STRIPE_PRICE_PREMIUM_YEARLY_TEST=price_1STIKRDrScgTb4BoXWdU9vli
```

### Live Mode Secrets (6 total)

Used by: Production only

```bash
STRIPE_SECRET_KEY_LIVE=sk_live_51SAkTNDrScgTb4Bo...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_SgWWUxwPJkErXdOHzT6zRcViOsxi4XE7
STRIPE_PRICE_PACKAGING_MONTHLY_LIVE=price_1STTaTDrScgTb4BofZU2tdDn
STRIPE_PRICE_PACKAGING_YEARLY_LIVE=price_1STRjpDrScgTb4Bo3pCRNDfD
STRIPE_PRICE_PREMIUM_MONTHLY_LIVE=price_1STRnmDrScgTb4Boszy9nBf0
STRIPE_PRICE_PREMIUM_YEARLY_LIVE=price_1STRpWDrScgTb4BoZni8qVKL
```

### How to Update Secrets

```bash
cd /Users/sungholee/code/kstorybridge

# Update a single secret
npx supabase secrets set SECRET_NAME="value"

# Update multiple secrets
npx supabase secrets set \
  STRIPE_SECRET_KEY_TEST="sk_test_..." \
  STRIPE_WEBHOOK_SECRET_TEST="whsec_..."

# After updating secrets, redeploy affected functions
npx supabase functions deploy create-creator-checkout
npx supabase functions deploy creator-stripe-webhook
npx supabase functions deploy get-creator-billing-history
```

---

## Stripe Products & Pricing

### Live Mode (Production)

**Creator Packaging Plan** (`prod_TQIClXOvA2oTlE`)

Launch Promotion Pricing:
- Monthly: $100/month → `price_1STTaTDrScgTb4BofZU2tdDn` (Updated 2025-11-14)
- Yearly: $1,000/year → `price_1STRjpDrScgTb4Bo3pCRNDfD`

Regular Pricing (Future):
- Monthly: $200/month → `price_1STRcXDrScgTb4BofNrQV38R`
- Yearly: $2,000/year → `price_1STRiqDrScgTb4BoAP5OFXMU`

**Creator Premium Plan** (`prod_TQINzezciGlU4L`)

Launch Promotion Pricing:
- Monthly: $200/month → `price_1STRnmDrScgTb4Boszy9nBf0`
- Yearly: $2,000/year → `price_1STRpWDrScgTb4BoZni8qVKL`

Regular Pricing (Future):
- Monthly: $400/month → `price_1STRmSDrScgTb4BoAGHmartC`
- Yearly: $4,000/year → `price_1STRorDrScgTb4BovEi85Xef`

### Test Mode (Staging/Localhost)

Uses same pricing structure but with test mode price IDs.

---

## Webhook Endpoints

### Test Mode Webhook

- **URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/creator-stripe-webhook`
- **Environment**: Stripe Test Mode
- **Signing Secret**: `STRIPE_WEBHOOK_SECRET_TEST`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### Live Mode Webhook

- **URL**: Same as test (same endpoint, different secret)
- **Environment**: Stripe Live Mode
- **Signing Secret**: `STRIPE_WEBHOOK_SECRET_LIVE`
- **Events**: Same as test mode

### Important Configuration

**File**: `/supabase/config.toml`

```toml
[functions.creator-stripe-webhook]
verify_jwt = false  # REQUIRED: Bypasses JWT auth, uses Stripe signature verification
```

**Why**: Stripe webhooks send `Stripe-Signature` header, not JWT tokens. This configuration allows the webhook to bypass Supabase's JWT authentication while maintaining security through Stripe's signature verification.

---

## Database Tables

### creator_subscriptions

Stores per-title subscription records.

**Key Fields**:
- `creator_email` (text) - Creator's email
- `title_id` (uuid) - Title being subscribed to
- `stripe_subscription_id` (text) - Stripe subscription ID
- `plan_type` (text) - "packaging" or "premium"
- `billing_period` (text) - "monthly" or "yearly"
- `status` (text) - Stripe subscription status
- `current_period_start` / `current_period_end` (timestamptz)
- `cancel_at_period_end` (boolean)

### creator_stripe_customers

Links creator emails to Stripe customer IDs.

**Key Fields**:
- `creator_email` (text, unique) - Creator's email
- `stripe_customer_id` (text) - Stripe customer ID

### creator_payments

Transaction history.

**Key Fields**:
- `creator_email` (text) - Creator's email
- `stripe_payment_intent_id` (text) - Stripe payment intent ID
- `amount` (numeric) - Amount in dollars
- `status` (text) - "succeeded" or "failed"
- `description` (text) - Payment description

---

## Testing

### Test Mode (Staging/Localhost)

**Test Cards**:
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Test Flow**:
1. Go to: https://creator-staging.kstorybridge.com/plan
2. Click "Go Packaging" or "Go Premium"
3. Select a title
4. Complete checkout with test card
5. Verify subscription appears on billing page

**Monitoring**:
```bash
# Check checkout function logs
npx supabase functions logs create-creator-checkout --limit 20

# Check webhook logs
npx supabase functions logs creator-stripe-webhook --limit 20

# Should see: environment: 'test'
```

### Live Mode (Production)

**⚠️ WARNING**: Production uses real credit cards and charges real money.

**Production URLs**:
- Checkout: https://creator.kstorybridge.com/plan
- Billing: https://creator.kstorybridge.com/billing

**Monitoring**:
- Stripe Dashboard: https://dashboard.stripe.com/payments (LIVE MODE)
- Webhook logs: https://dashboard.stripe.com/webhooks (LIVE MODE)
- Function logs: Same as test mode, should show `environment: 'production'`

---

## Troubleshooting

### Issue: "Invalid API Key" Error

**Symptom**: Checkout modal shows "Invalid API Key provided: sk_test_***" or "sk_live_***"

**Cause**: Wrong secret key configured in Supabase secrets

**Fix**:
1. Get correct key from Stripe Dashboard → API Keys
2. Update Supabase secret:
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_...
   # or
   npx supabase secrets set STRIPE_SECRET_KEY_LIVE=sk_live_...
   ```
3. Redeploy function:
   ```bash
   npx supabase functions deploy create-creator-checkout
   ```

### Issue: Webhook Returns 401 Error

**Symptom**: Stripe webhook events show "401 ERR" in Stripe Dashboard

**Cause**: JWT authentication blocking webhooks

**Fix**: Verify `/supabase/config.toml` has:
```toml
[functions.creator-stripe-webhook]
verify_jwt = false
```

Redeploy:
```bash
npx supabase functions deploy creator-stripe-webhook
```

### Issue: Webhook Returns 400 "Signature Verification Failed"

**Symptom**: Stripe webhook events show "400 ERR" with message about signature

**Cause**: Webhook secret mismatch between Stripe and Supabase

**Fix**:
1. Go to Stripe Dashboard → Webhooks
2. Click on webhook endpoint
3. Reveal signing secret (starts with `whsec_`)
4. Update Supabase secret:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET_TEST=whsec_...
   # or
   npx supabase secrets set STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
   ```
5. Redeploy webhook function

### Issue: Wrong Environment Detected

**Symptom**: Production using test mode or vice versa

**Cause**: Origin header detection not working correctly

**Debug**:
1. Check function logs for `🔧 Stripe Configuration:` entry
2. Verify `origin`, `environment`, `isProduction` values
3. Check `/supabase/functions/_shared/stripe-config.ts` logic

**Fix**: Ensure origin detection matches your domain patterns

### Issue: Subscription Not Appearing After Payment

**Symptom**: Payment successful but no subscription on billing page

**Causes & Fixes**:
1. **Webhook not firing**: Check Stripe Dashboard → Webhooks for delivery status
2. **Webhook failing**: Check Supabase function logs for errors
3. **Database error**: Check logs for RLS or constraint errors
4. **Title ownership mismatch**: Verify title belongs to the creator

---

## Maintenance

### Switching from Launch Promo to Regular Pricing

When ready to end launch promotion:

1. Update price IDs in Supabase secrets:
   ```bash
   npx supabase secrets set \
     STRIPE_PRICE_PACKAGING_MONTHLY_LIVE=price_1STRcXDrScgTb4BofNrQV38R \
     STRIPE_PRICE_PACKAGING_YEARLY_LIVE=price_1STRiqDrScgTb4BoAP5OFXMU \
     STRIPE_PRICE_PREMIUM_MONTHLY_LIVE=price_1STRmSDrScgTb4BoAGHmartC \
     STRIPE_PRICE_PREMIUM_YEARLY_LIVE=price_1STRorDrScgTb4BovEi85Xef
   ```

2. Redeploy checkout function:
   ```bash
   npx supabase functions deploy create-creator-checkout
   ```

3. Existing subscriptions stay at promo pricing (grandfathered)
4. New subscriptions use regular pricing

### Rotating API Keys

If API keys are compromised:

1. Generate new keys in Stripe Dashboard
2. Update Supabase secrets
3. Redeploy all functions
4. Test immediately to ensure no downtime

### Monitoring Production

**Weekly checks**:
- Stripe Dashboard → Payments (verify successful payments)
- Stripe Dashboard → Subscriptions (verify active subscriptions)
- Stripe Dashboard → Webhooks (check for failed deliveries)
- Supabase Dashboard → Database (verify subscription records match Stripe)

**Alert on**:
- Webhook delivery failures
- Increased payment failures
- Database constraint errors
- Subscription status mismatches

---

## Reference Links

**Stripe Dashboard**:
- Test Mode: https://dashboard.stripe.com (toggle "Test mode" ON)
- Live Mode: https://dashboard.stripe.com (toggle "Test mode" OFF)
- Webhooks: https://dashboard.stripe.com/webhooks
- API Keys: https://dashboard.stripe.com/apikeys

**Supabase Dashboard**:
- Functions: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- SQL Editor: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql
- Secrets: Manage via CLI only

**Application URLs**:
- Staging: https://creator-staging.kstorybridge.com
- Production: https://creator.kstorybridge.com

**Codebase**:
- Edge Functions: `/supabase/functions/`
- Stripe Config: `/supabase/functions/_shared/stripe-config.ts`
- Supabase Config: `/supabase/config.toml`
- Creator Billing Page: `/apps/creator/src/pages/Billing.tsx`
- Checkout Modal: `/apps/creator/src/components/CheckoutModal.tsx`

---

**Created**: 2025-11-14
**Author**: Claude Code (AI Assistant)
**Status**: Production Active
**Next Review**: When switching from launch promo to regular pricing
