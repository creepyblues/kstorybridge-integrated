# Phase 2 Summary: Stripe Product Configuration

**Date**: 2025-11-13
**Status**: 🟡 Ready to Begin
**Phase**: 2 of 8
**Estimated Time**: 30-45 minutes

---

## ✅ Prerequisites Completed

- ✅ **Phase 1 - Database Schema**: COMPLETED (2025-11-13)
  - All 5 tables created (creator_subscriptions, creator_stripe_customers, discount_coupons, coupon_redemptions, creator_payments)
  - 11 RLS policies configured
  - 9 indexes for performance
  - Code review: 90/100 (Excellent)
  - Test coverage: 85%

---

## 🎯 Phase 2 Objectives

Configure Stripe Dashboard with:
1. **2 Products** (Packaging Plan, Premium Plan)
2. **8 Price Objects** (4 per product: monthly/yearly × launch/regular)
3. **2 Discount Coupons** (BUNDLE25, BUNDLE40)
4. **Environment Variables** (Local, Staging, Production)

---

## 📚 Resources

### Step-by-Step Guides
1. **[STRIPE_PHASE2_CONFIGURATION_GUIDE.md](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md)**
   - Complete Stripe Dashboard walkthrough
   - Screenshots and exact configuration values
   - Environment variable setup
   - Troubleshooting guide

2. **[STRIPE_PRICE_ID_REFERENCE.md](./STRIPE_PRICE_ID_REFERENCE.md)**
   - Fill-in template for tracking IDs
   - Quick reference table
   - Environment variable mapping

### Validation Tools
- **Validation Script**: `apps/creator/scripts/validate-stripe-config.ts`
  - Run: `cd apps/creator && npx tsx scripts/validate-stripe-config.ts`
  - Checks all required environment variables
  - Validates format of price IDs, product IDs, keys

---

## 🚀 Quick Start

### Step 1: Open Stripe Dashboard
```bash
# Test Mode (for development)
https://dashboard.stripe.com/test/products
```

### Step 2: Follow Configuration Guide
Open [STRIPE_PHASE2_CONFIGURATION_GUIDE.md](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md) and follow Steps 1-10:

- **Steps 1-2**: Create products (Packaging, Premium)
- **Steps 3-4**: Create prices (8 total)
- **Steps 5-6**: Create coupons (BUNDLE25, BUNDLE40)
- **Step 7**: Document all IDs in [STRIPE_PRICE_ID_REFERENCE.md](./STRIPE_PRICE_ID_REFERENCE.md)
- **Step 8**: Configure environment variables
- **Step 9**: Verify configuration
- **Step 10**: Test (after Phase 3)

### Step 3: Configure Environment Variables

**Local Development** (`apps/creator/.env.local`):
```bash
# Copy template from STRIPE_PHASE2_CONFIGURATION_GUIDE.md Step 8
# Fill in with your actual price IDs and keys
```

**Supabase Secrets** (from project root):
```bash
cd /Users/sungholee/code/kstorybridge
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

**Vercel** (both staging and production):
- Add all environment variables via Vercel Dashboard
- Settings → Environment Variables

### Step 4: Validate Configuration
```bash
cd apps/creator
npx tsx scripts/validate-stripe-config.ts
```

Expected output:
```
✅ Success: 11/11 required variables configured
⚠️  Warnings: 0 variables with format issues
❌ Errors: 0 required variables missing

✅ VALIDATION PASSED
```

---

## 📋 Phase 2 Checklist

### Stripe Dashboard (Manual Setup)
- [ ] **Product 1**: Creator Packaging Plan created
- [ ] **Product 2**: Creator Premium Plan created
- [ ] **Price 1**: Packaging Monthly Launch ($100) created
- [ ] **Price 2**: Packaging Monthly Regular ($150) created
- [ ] **Price 3**: Packaging Yearly Launch ($1,080) created
- [ ] **Price 4**: Packaging Yearly Regular ($1,620) created
- [ ] **Price 5**: Premium Monthly Launch ($200) created
- [ ] **Price 6**: Premium Monthly Regular ($300) created
- [ ] **Price 7**: Premium Yearly Launch ($2,160) created
- [ ] **Price 8**: Premium Yearly Regular ($3,240) created
- [ ] **Coupon 1**: BUNDLE25 (25% off) created
- [ ] **Coupon 2**: BUNDLE40 (40% off) created

### Documentation
- [ ] All product IDs documented in [STRIPE_PRICE_ID_REFERENCE.md](./STRIPE_PRICE_ID_REFERENCE.md)
- [ ] All price IDs documented in [STRIPE_PRICE_ID_REFERENCE.md](./STRIPE_PRICE_ID_REFERENCE.md)
- [ ] Coupon IDs verified (BUNDLE25, BUNDLE40)

### Environment Configuration
- [ ] `.env.local` created in `apps/creator/`
- [ ] All price IDs added to `.env.local`
- [ ] Stripe publishable key added to `.env.local`
- [ ] Supabase secrets configured (`STRIPE_SECRET_KEY`)
- [ ] Vercel staging environment variables configured
- [ ] Vercel production environment variables configured (when ready)

### Validation
- [ ] Validation script runs without errors
- [ ] All variables show ✅ in validation output
- [ ] All price IDs start with `price_`
- [ ] All product IDs start with `prod_`
- [ ] Publishable key starts with `pk_test_` (test mode)

---

## ⚠️ Important Notes

### Test Mode vs Live Mode
- **Use Test Mode** for all development and staging
- **Use Live Mode** only for production (create separate products/prices)
- Never mix test and live mode keys

### Price Amounts
Double-check these amounts match the plan:

**Packaging Plan**:
- Monthly Launch: $100/month
- Monthly Regular: $150/month
- Yearly Launch: $1,080/year (10% discount)
- Yearly Regular: $1,620/year (10% discount)

**Premium Plan**:
- Monthly Launch: $200/month
- Monthly Regular: $300/month
- Yearly Launch: $2,160/year (10% discount)
- Yearly Regular: $3,240/year (10% discount)

### Metadata
All products and prices should have proper metadata:
- `plan_type` = `packaging` or `premium`
- `billing_period` = `monthly` or `yearly`
- `price_type` = `launch_promo` or `regular`

See [Configuration Guide](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md) for complete metadata specifications.

---

## 🔍 Common Issues

### Issue: "Environment variable not loading"
**Solution**: Restart Vite dev server after adding to `.env.local`

### Issue: "Price ID not found"
**Solution**: Verify you're using test mode keys with test mode price IDs

### Issue: "Coupon doesn't apply"
**Solution**: Check "Applies to" section in Stripe Dashboard includes both products

**See**: [Configuration Guide Troubleshooting](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md#common-issues--troubleshooting) for more solutions

---

## ✅ Phase 2 Completion Criteria

Before proceeding to Phase 3, ensure:

- [x] All 2 products created in Stripe
- [x] All 8 prices created (4 per product)
- [x] All 2 coupons created
- [x] All IDs documented
- [x] Environment variables configured (local + staging)
- [x] Validation script passes with 11/11 ✅
- [x] Price amounts match the plan exactly
- [x] Metadata correctly set on all products/prices

**When all items above are checked**, Phase 2 is complete! ✅

---

## 🎯 Next Phase

**Phase 3: Create Edge Functions**

Once Phase 2 is complete, we'll create 4 edge functions:

1. **create-creator-checkout** - Stripe Checkout Session creation
2. **creator-stripe-webhook** - Webhook event processing
3. **validate-coupon** - Coupon validation and redemption tracking
4. **get-creator-billing-history** - Billing history retrieval

**See**: [Integration Plan - Phase 3](./STRIPE_PAYMENT_INTEGRATION_PLAN.md#phase-3-creator-edge-functions)

---

## 📞 Need Help?

- **Configuration Questions**: See [STRIPE_PHASE2_CONFIGURATION_GUIDE.md](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md)
- **Stripe Dashboard**: https://dashboard.stripe.com/test/products
- **Stripe Docs**: https://stripe.com/docs/products-prices/overview
- **Integration Plan**: [STRIPE_PAYMENT_INTEGRATION_PLAN.md](./STRIPE_PAYMENT_INTEGRATION_PLAN.md)

---

**Phase 2 Status**: 🟡 Ready to Begin
**Blocking**: Phase 3 (Edge Functions), Phase 5 (Payment UI)
**Estimated Completion**: 30-45 minutes of manual configuration
**Last Updated**: 2025-11-13
