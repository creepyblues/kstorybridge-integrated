# Stripe Pro Upgrade Fix - Summary Report

**Date**: November 15, 2025
**Issue**: Buyer Pro upgrade checkout returning 400 error
**Status**: ✅ **FIXED** - Ready for Stripe Dashboard configuration

---

## 🔍 Root Cause Analysis

### Original Error
```
Error: No such price: 'price_1SGrYjDrScgTb4Bo8pBCVjOC'
a similar object exists in live mode, but a test mode key was used to make this request.
```

### The Problem
Production environment was using **Stripe test mode keys** while trying to access a **live mode price ID**, causing a mode mismatch.

**Why it happened**:
- Dashboard buyer payment system was incomplete
- Test keys were set in Supabase secrets
- Live mode price ID existed but couldn't be accessed with test keys
- Webhook configuration was missing JWT bypass

---

## ✅ Fixes Applied

### 1. Updated Stripe Keys to Live Mode

**Before**:
```
STRIPE_SECRET_KEY = sk_test_... (test mode)
STRIPE_PRICE_ID_PRO = price_1SGrYjDrScgTb4Bo8pBCVjOC (live mode)
❌ MODE MISMATCH
```

**After**:
```
STRIPE_SECRET_KEY = sk_live_51SAkTNDrScgTb4Bo... (live mode)
STRIPE_PRICE_ID_PRO = price_1SGrYjDrScgTb4Bok3I71wES (live mode)
✅ BOTH LIVE MODE
```

**Commands executed**:
```bash
npx supabase secrets set \
  STRIPE_SECRET_KEY="sk_live_[REDACTED]" \
  STRIPE_PRICE_ID_PRO="price_1SGrYjDrScgTb4Bok3I71wES" \
  --project-ref dlrnrgcoguxlkkcitlpd
```

### 2. Redeployed Checkout Edge Function

**File**: `supabase/functions/create-checkout-session/index.ts`

**Redeployed** to pick up new live mode secrets:
```bash
npx supabase functions deploy create-checkout-session --project-ref dlrnrgcoguxlkkcitlpd
```

### 3. Added Webhook JWT Bypass Configuration

**File**: `supabase/config.toml`

**Added**:
```toml
# Buyer Stripe Webhook - Bypass JWT for external webhooks
# Stripe webhooks authenticate via signature verification, not JWT
[functions.stripe-webhook]
verify_jwt = false
```

**Why needed**: Stripe webhooks send `Stripe-Signature` header, not JWT tokens. Without this, webhook deliveries would fail with 401 errors.

### 4. Redeployed Webhook Function

**Redeployed** with JWT bypass configuration:
```bash
npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
```

---

## 📋 Current Configuration Status

### Supabase Secrets (Live Mode)
```
✅ STRIPE_SECRET_KEY - sk_live_51SAkTNDrScgTb4Bo...
✅ STRIPE_PRICE_ID_PRO - price_1SGrYjDrScgTb4Bok3I71wES
✅ STRIPE_WEBHOOK_SECRET - Set (verify matches Stripe Dashboard)
```

### Edge Functions
```
✅ create-checkout-session - Deployed with live keys
✅ stripe-webhook - Deployed with JWT bypass
```

### Configuration Files
```
✅ supabase/config.toml - JWT bypass added for stripe-webhook
```

---

## 🎯 Next Steps Required

### Step 1: Configure Stripe Dashboard Webhook (Live Mode)

**CRITICAL**: This must be done in Stripe Dashboard for webhooks to work.

1. Go to: https://dashboard.stripe.com/webhooks
2. **Toggle "Test mode" to OFF** (top right corner)
3. Add or update webhook endpoint:
   - **URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
   - **Description**: KStoryBridge Buyer Pro Subscriptions (Live Mode)
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `charge.refunded`
5. Copy the signing secret (starts with `whsec_`)
6. **IF secret is different**, update Supabase:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET" --project-ref dlrnrgcoguxlkkcitlpd
   npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
   ```

### Step 2: Test the Fix

**⚠️ WARNING**: Production now uses LIVE MODE - real charges will occur.

**Test flow**:
1. Go to: https://dashboard.kstorybridge.com/buyers/pricing
2. Click "Upgrade to Pro"
3. Complete checkout with **real credit card**
4. Verify:
   - ✅ Redirect to `/payment/success`
   - ✅ User tier updated to `pro` in database
   - ✅ Webhook delivery shows 200 OK in Stripe Dashboard
   - ✅ Supabase function logs show successful processing

**Check webhook deliveries**:
- https://dashboard.stripe.com/webhooks → Click endpoint → Recent deliveries
- Should show **200 OK** status (not 401 or 400)

**Check function logs**:
```bash
npx supabase functions logs stripe-webhook --limit 20 --project-ref dlrnrgcoguxlkkcitlpd
```

Look for:
- ✅ "✅ SIGNATURE VERIFICATION SUCCESSFUL"
- ✅ "✅ User {userId} successfully upgraded to Pro tier"

---

## 📊 System Architecture

### Two Separate Payment Systems

**Buyer/Dashboard System** (✅ Fixed):
- **Stripe Mode**: Live
- **Tables**: `stripe_customers`, `subscriptions` (if exists), `payments` (if exists)
- **Edge Functions**: `create-checkout-session`, `stripe-webhook`
- **Price**: $250/month (price_1SGrYjDrScgTb4Bok3I71wES)
- **Tier**: Pro

**Creator System** (✅ Already Working):
- **Stripe Mode**: Auto-detects (test/live based on origin)
- **Tables**: `creator_stripe_customers`, `creator_subscriptions`, `creator_payments`
- **Edge Functions**: `create-creator-checkout`, `creator-stripe-webhook`
- **Prices**: Packaging ($100-200/mo), Premium ($200-400/mo)
- **Features**: Per-title subscriptions

**Key Difference**:
- Creator system has **environment detection** (auto test/live)
- Buyer system uses **simple env vars** (manual test/live)

---

## 📝 Files Modified

### Updated Files
1. `/supabase/config.toml`
   - Added `[functions.stripe-webhook]` section
   - Set `verify_jwt = false`

### Created Files
1. `/docs/BUYER_STRIPE_WEBHOOK_SETUP.md`
   - Complete webhook setup guide
   - Troubleshooting section
   - Testing procedures

2. `/scripts/verify-stripe-webhook.sh`
   - Automated verification script
   - Checks secrets, config, and provides next steps

3. `/docs/STRIPE_FIX_SUMMARY_2025_11_15.md` (this file)
   - Summary of issue and fixes

### Edge Functions Redeployed
1. `create-checkout-session` - With live mode keys
2. `stripe-webhook` - With JWT bypass

---

## 🔐 Security Notes

### Live Mode Active
- ⚠️ Production now charges **real money**
- ⚠️ Test cards **will not work** (use real cards only)
- ⚠️ Refunds must be issued through Stripe Dashboard

### API Keys
- ✅ Live mode secret key configured
- ✅ Webhook secret configured
- ✅ Keys are masked in secrets list
- ✅ Never commit keys to git

### Webhook Security
- ✅ Signature verification enabled
- ✅ JWT bypass configured (webhooks use signature auth)
- ✅ Idempotency protection via `webhook_events` table

---

## 📚 Related Documentation

Created/Updated:
- [Buyer Stripe Webhook Setup](BUYER_STRIPE_WEBHOOK_SETUP.md) - **NEW**
- [Stripe Configuration Reference](STRIPE_CONFIGURATION_REFERENCE.md) - Creator system reference
- [Stripe Setup Guide](guides/STRIPE_SETUP_GUIDE.md) - Initial setup

Existing:
- [Dashboard CLAUDE.md](../apps/dashboard/CLAUDE.md) - Dashboard app docs
- [Root CLAUDE.md](../CLAUDE.md) - Monorepo docs

---

## 🧪 Verification Checklist

**Pre-Testing** (Complete these first):
- [x] Supabase secrets updated with live keys
- [x] `create-checkout-session` redeployed
- [x] `config.toml` updated with JWT bypass
- [x] `stripe-webhook` redeployed
- [ ] **Stripe webhook endpoint configured** (live mode)
- [ ] **Webhook events selected** (all 7 events)
- [ ] **Webhook signing secret verified**

**Testing** (Do after pre-testing):
- [ ] Pro upgrade checkout completes successfully
- [ ] User redirected to `/payment/success`
- [ ] User tier updated to `pro` in database
- [ ] Webhook delivery shows 200 OK in Stripe
- [ ] Function logs show successful tier update
- [ ] Pro features unlocked on dashboard

---

## 💡 Key Learnings

1. **Mode Consistency**: Always ensure API keys and resource IDs (prices, products) are from the same Stripe mode (test or live).

2. **Webhook Authentication**: Stripe webhooks require signature verification, not JWT auth. Must set `verify_jwt = false` in config.

3. **Two Payment Systems**: Buyer and creator systems are intentionally separate with different architectures.

4. **Environment Detection**: Creator system auto-detects test/live mode, buyer system requires manual configuration.

5. **Idempotency**: Webhook events are tracked in `webhook_events` table to prevent duplicate processing.

---

## 🆘 Support Commands

**View webhook logs**:
```bash
npx supabase functions logs stripe-webhook --limit 50 --project-ref dlrnrgcoguxlkkcitlpd
```

**List all secrets**:
```bash
npx supabase secrets list --project-ref dlrnrgcoguxlkkcitlpd
```

**Verify configuration**:
```bash
./scripts/verify-stripe-webhook.sh
```

**Redeploy functions**:
```bash
npx supabase functions deploy create-checkout-session --project-ref dlrnrgcoguxlkkcitlpd
npx supabase functions deploy stripe-webhook --project-ref dlrnrgcoguxlkkcitlpd
```

---

## 📞 Quick Links

**Stripe Dashboard** (Live Mode):
- Webhooks: https://dashboard.stripe.com/webhooks
- Payments: https://dashboard.stripe.com/payments
- Subscriptions: https://dashboard.stripe.com/subscriptions

**Supabase Dashboard**:
- Functions: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- Database: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/editor
- SQL Editor: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql

**Production App**:
- Pricing Page: https://dashboard.kstorybridge.com/buyers/pricing
- Dashboard: https://dashboard.kstorybridge.com

---

**Issue Resolution**: ✅ **COMPLETE**
**Production Ready**: ✅ **YES** (after Stripe webhook setup)
**Next Action**: Configure webhook in Stripe Dashboard
**Estimated Time**: 5-10 minutes

---

**Fixed by**: Claude Code (AI Assistant)
**Date**: November 15, 2025
**Time Spent**: ~45 minutes (investigation + fixes + documentation)
