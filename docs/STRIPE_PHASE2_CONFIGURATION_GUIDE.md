# Phase 2: Stripe Product Configuration Guide

**Date**: 2025-11-13
**Phase**: Phase 2 - Manual Stripe Setup
**Status**: 🟡 IN PROGRESS
**Prerequisites**: Phase 1 database schema completed ✅

---

## Overview

Phase 2 involves manual configuration in the Stripe Dashboard to create products, prices, and discount coupons. This guide provides step-by-step instructions for setting up the creator subscription infrastructure.

**Time Estimate**: 30-45 minutes
**Required Access**: Stripe Dashboard admin access
**Mode**: Test Mode (for initial setup and testing)

---

## Checklist

- [ ] **Step 1**: Create "Packaging" Plan product
- [ ] **Step 2**: Create "Premium" Plan product
- [ ] **Step 3**: Create 4 prices for Packaging Plan (monthly/yearly × launch/regular)
- [ ] **Step 4**: Create 4 prices for Premium Plan (monthly/yearly × launch/regular)
- [ ] **Step 5**: Create BUNDLE25 discount coupon
- [ ] **Step 6**: Create BUNDLE40 discount coupon
- [ ] **Step 7**: Document all price IDs
- [ ] **Step 8**: Configure environment variables
- [ ] **Step 9**: Verify configuration
- [ ] **Step 10**: Test checkout flow (once Phase 3 is complete)

---

## Step 1: Create "Packaging" Plan Product

### Navigation
1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"** button
3. Select **"Recurring"** tab

### Product Configuration
**Name**: `Creator Packaging Plan`

**Description**:
```
Professional content packaging service for K-content creators. Includes market research, comp analysis, pitch deck creation, and synopses. Perfect for creators seeking global distribution opportunities.
```

**Pricing Model**: Select **"Standard pricing"**

**Metadata** (Click "Add metadata"):
- `plan_type` = `packaging`
- `commission_rate` = `10`
- `features` = `market_research,comp_analysis,pitch_deck,synopses`
- `tier_level` = `2`

### Save Product
Click **"Save product"** to create the product. Note down the **Product ID** (starts with `prod_`).

**Product ID**: `prod_TQ7vbAesj2B5ap` (fill in after creation)

---

## Step 2: Create "Premium" Plan Product

### Navigation
Same as Step 1, create another product.

### Product Configuration
**Name**: `Creator Premium Plan`

**Description**:
```
Comprehensive premium service for K-content creators. Includes everything in Packaging Plan plus advanced promotion, buyer-creator connections, networking events, and priority support. For creators ready for global expansion.
```

**Pricing Model**: Select **"Standard pricing"**

**Metadata** (Click "Add metadata"):
- `plan_type` = `premium`
- `commission_rate` = `10`
- `features` = `all_packaging_features,promotion,connections,networking,priority_support`
- `tier_level` = `3`

### Save Product
Click **"Save product"**. Note down the **Product ID**.

**Product ID**: `prod_TQ7xPyDbrSJjVU` (fill in after creation)

---

## Step 3: Create Pricing for Packaging Plan

For the "Creator Packaging Plan" product, create **4 price objects**:

### Price 3.1: Packaging - Monthly (Launch Promo)

**Navigate to Product**: Click on "Creator Packaging Plan" → "Add another price"

**Configuration**:
- **Price**: `$100.00 USD`
- **Billing period**: `Monthly`
- **Price description**: `Monthly - Launch Promotion ($100/month)`
- **Price ID will be auto-generated**

**Metadata**:
- `billing_period` = `monthly`
- `price_type` = `launch_promo`
- `regular_price` = `200`
- `valid_until` = `2026-01-31` (adjust as needed)

**Save** and note the **Price ID**: `price_1STHmPDrScgTb4BobwAFdnLQ`

---

### Price 3.2: Packaging - Monthly (Regular)

**Configuration**:
- **Price**: `$200.00 USD`
- **Billing period**: `Monthly`
- **Price description**: `Monthly - Regular Price ($200/month)`

**Metadata**:
- `billing_period` = `monthly`
- `price_type` = `regular`

**Save** and note the **Price ID**: `price_1STHflDrScgTb4BomGMVuPY9`

---

### Price 3.3: Packaging - Yearly (Launch Promo)

**Configuration**:
- **Price**: `$2,000.00 USD` (20% discount: $100 × 12 × 0.8)
- **Billing period**: `Yearly`
- **Price description**: `Annual - Launch Pronmotio ($2,000/year)`

**Metadata**:
- `billing_period` = `yearly`
- `price_type` = `launch_promo`
- `regular_price` = `2400`
- `discount_percent` = `10`
- `valid_until` = `2026-01-31`

**Save** and note the **Price ID**: `price_1STHsIDrScgTb4Bopkgtrz2a`

---

### Price 3.4: Packaging - Yearly (Regular)

**Configuration**:
- **Price**: `$1,620.00 USD` ($150 × 12 × 0.9)
- **Billing period**: `Yearly`
- **Price description**: `Annual - Regular Price ($1,620/year, save 10%)`

**Metadata**:
- `billing_period` = `yearly`
- `price_type` = `regular`
- `discount_percent` = `10`

**Save** and note the **Price ID**: `price_1STI4VDrScgTb4BoAP5EuBhT`

---

## Step 4: Create Pricing for Premium Plan

For the "Creator Premium Plan" product, create **4 price objects**:

### Price 4.1: Premium - Monthly (Launch Promo)

**Configuration**:
- **Price**: `$200.00 USD`
- **Billing period**: `Monthly`
- **Price description**: `Monthly - Launch Promotion ($200/month)`

**Metadata**:
- `billing_period` = `monthly`
- `price_type` = `launch_promo`
- `regular_price` = `400`
- `valid_until` = `2026-01-31`

**Save** and note the **Price ID**: `price_1STID2DrScgTb4BotMszm1Zn`

---

### Price 4.2: Premium - Monthly (Regular)

**Configuration**:
- **Price**: `$400.00 USD`
- **Billing period**: `Monthly`
- **Price description**: `Monthly - Regular Price ($400/month)`

**Metadata**:
- `billing_period` = `monthly`
- `price_type` = `regular`

**Save** and note the **Price ID**: `price_1STHhqDrScgTb4Bory0Br0FI`

---

### Price 4.3: Premium - Yearly (Launch Promo)

**Configuration**:
- **Price**: `$2,000.00 USD` ($200 × 12 × 0.9)
- **Billing period**: `Yearly`
- **Price description**: `Annual - Launch Promotion ($2,000/year)`

**Metadata**:
- `billing_period` = `yearly`
- `price_type` = `launch_promo`
- `regular_price` = `4000`
- `discount_percent` = `10`
- `valid_until` = `2026-01-31`

**Save** and note the **Price ID**: `price_1STIKRDrScgTb4BoXWdU9vli`

---

### Price 4.4: Premium - Yearly (Regular)

**Configuration**:
- **Price**: `$4,000.00 USD` ($300 × 12 × 0.9)
- **Billing period**: `Yearly`
- **Price description**: `Annual - Regular Price ($4,000/year)`

**Metadata**:
- `billing_period` = `yearly`
- `price_type` = `regular`
- `discount_percent` = `10`

**Save** and note the **Price ID**: `price_1STIHmDrScgTb4BoQyeiJkCG`

---

## Step 5: Create BUNDLE25 Discount Coupon

### Navigation
1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/coupons
2. Click **"Create coupon"** button

### Coupon Configuration
**Coupon ID**: `BUNDLE25` (Use this exact ID)

**Type**: `Percentage discount`

**Percent off**: `25%`

**Duration**: `Forever` (applies to all future invoices)

**Applies to**:
- Select **"Specific products"**
- Choose both: "Creator Packaging Plan" AND "Creator Premium Plan"

**Metadata**:
- `bundle_type` = `2_titles`
- `description` = `25% off when bundling 2 titles`
- `min_titles` = `2`
- `max_titles` = `2`

**Redemption limits**:
- Max redemptions: `Unlimited` (we'll track in database)
- First time transaction: `No`

**Save** and note the **Coupon ID**: `BUNDLE25`

---

## Step 6: Create BUNDLE40 Discount Coupon

### Navigation
Same as Step 5.

### Coupon Configuration
**Coupon ID**: `BUNDLE40` (Use this exact ID)

**Type**: `Percentage discount`

**Percent off**: `40%`

**Duration**: `Forever`

**Applies to**:
- Select **"Specific products"**
- Choose both: "Creator Packaging Plan" AND "Creator Premium Plan"

**Metadata**:
- `bundle_type` = `3_plus_titles`
- `description` = `40% off when bundling 3+ titles`
- `min_titles` = `3`

**Redemption limits**:
- Max redemptions: `Unlimited`
- First time transaction: `No`

**Save** and note the **Coupon ID**: `BUNDLE40`

---

## Step 7: Document All IDs

### Price ID Reference Table

Copy all Price IDs into this table:

| Plan | Period | Type | Price | Price ID |
|------|--------|------|-------|----------|
| Packaging | Monthly | Launch | $100 | price___________________ |
| Packaging | Monthly | Regular | $150 | price___________________ |
| Packaging | Yearly | Launch | $1,080 | price___________________ |
| Packaging | Yearly | Regular | $1,620 | price___________________ |
| Premium | Monthly | Launch | $200 | price___________________ |
| Premium | Monthly | Regular | $300 | price___________________ |
| Premium | Yearly | Launch | $2,160 | price___________________ |
| Premium | Yearly | Regular | $3,240 | price___________________ |

### Product ID Reference

| Product | Product ID |
|---------|------------|
| Creator Packaging Plan | prod___________________ |
| Creator Premium Plan | prod___________________ |

### Coupon ID Reference

| Coupon | Coupon ID | Discount |
|--------|-----------|----------|
| Bundle 2 Titles | BUNDLE25 | 25% |
| Bundle 3+ Titles | BUNDLE40 | 40% |

---

## Step 8: Configure Environment Variables

### For Edge Functions (Supabase Secrets)

Run these commands from your project root:

```bash
# Navigate to root directory
cd /Users/sungholee/code/kstorybridge

# Set Stripe secret key (test mode)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY

# Set Stripe webhook secret (will be created in Phase 3)
# npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Verify secrets were set
npx supabase secrets list
```

### For Creator App (.env files)

**Local Development** (`apps/creator/.env.local`):
```bash
# Stripe Publishable Key (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY

# Price IDs - Launch Promo (Active)
VITE_STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH=price___________________
VITE_STRIPE_PRICE_PACKAGING_YEARLY_LAUNCH=price___________________
VITE_STRIPE_PRICE_PREMIUM_MONTHLY_LAUNCH=price___________________
VITE_STRIPE_PRICE_PREMIUM_YEARLY_LAUNCH=price___________________

# Price IDs - Regular (Future)
VITE_STRIPE_PRICE_PACKAGING_MONTHLY_REGULAR=price___________________
VITE_STRIPE_PRICE_PACKAGING_YEARLY_REGULAR=price___________________
VITE_STRIPE_PRICE_PREMIUM_MONTHLY_REGULAR=price___________________
VITE_STRIPE_PRICE_PREMIUM_YEARLY_REGULAR=price___________________

# Product IDs
VITE_STRIPE_PRODUCT_PACKAGING=prod___________________
VITE_STRIPE_PRODUCT_PREMIUM=prod___________________

# Coupon IDs
VITE_STRIPE_COUPON_BUNDLE_2=BUNDLE25
VITE_STRIPE_COUPON_BUNDLE_3=BUNDLE40

# Launch Promo Settings
VITE_LAUNCH_PROMO_ACTIVE=true
VITE_LAUNCH_PROMO_END_DATE=2026-01-31
```

**Vercel Staging** (creator-staging project):
Add all the same environment variables in Vercel Dashboard:
1. Go to https://vercel.com/your-team/creator-staging/settings/environment-variables
2. Add each variable above
3. Select "Preview" and "Development" environments

**Vercel Production** (creator project):
Add all the same environment variables in Vercel Dashboard:
1. Go to https://vercel.com/your-team/creator/settings/environment-variables
2. Add each variable above
3. Select "Production" environment

**IMPORTANT**: For production, use production Stripe keys and price IDs (created in Stripe live mode).

---

## Step 9: Verification Checklist

### Stripe Dashboard Verification

- [ ] **Products**: Both products visible in https://dashboard.stripe.com/test/products
- [ ] **Prices**: All 8 prices created (4 per product)
- [ ] **Coupons**: Both coupons visible in https://dashboard.stripe.com/test/coupons
- [ ] **Metadata**: All products/prices have correct metadata
- [ ] **Coupon Applicability**: Coupons apply to both products

### Environment Variable Verification

- [ ] **Supabase Secrets**: `npx supabase secrets list` shows STRIPE_SECRET_KEY
- [ ] **Local .env**: All price IDs populated in `apps/creator/.env.local`
- [ ] **Vercel Staging**: All env vars added to creator-staging project
- [ ] **Vercel Production**: All env vars added to creator project (when ready)

### Price ID Validation

Run this validation script locally:

```typescript
// Create apps/creator/scripts/validate-stripe-config.ts
const requiredEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH',
  'VITE_STRIPE_PRICE_PACKAGING_YEARLY_LAUNCH',
  'VITE_STRIPE_PRICE_PREMIUM_MONTHLY_LAUNCH',
  'VITE_STRIPE_PRICE_PREMIUM_YEARLY_LAUNCH',
  'VITE_STRIPE_PRICE_PACKAGING_MONTHLY_REGULAR',
  'VITE_STRIPE_PRICE_PACKAGING_YEARLY_REGULAR',
  'VITE_STRIPE_PRICE_PREMIUM_MONTHLY_REGULAR',
  'VITE_STRIPE_PRICE_PREMIUM_YEARLY_REGULAR',
  'VITE_STRIPE_PRODUCT_PACKAGING',
  'VITE_STRIPE_PRODUCT_PREMIUM',
];

requiredEnvVars.forEach((envVar) => {
  if (!import.meta.env[envVar]) {
    console.error(`❌ Missing: ${envVar}`);
  } else if (import.meta.env[envVar].startsWith('price_') ||
             import.meta.env[envVar].startsWith('prod_') ||
             import.meta.env[envVar].startsWith('pk_test_')) {
    console.log(`✅ ${envVar}: ${import.meta.env[envVar].substring(0, 20)}...`);
  } else {
    console.warn(`⚠️ ${envVar}: Invalid format`);
  }
});
```

Run validation:
```bash
cd apps/creator
npx tsx scripts/validate-stripe-config.ts
```

Expected output:
```
✅ VITE_STRIPE_PUBLISHABLE_KEY: pk_test_xxxxx...
✅ VITE_STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH: price_xxxxx...
✅ VITE_STRIPE_PRICE_PACKAGING_YEARLY_LAUNCH: price_xxxxx...
... (all 11 variables should show ✅)
```

---

## Step 10: Database Sync (Optional)

Optionally, you can pre-populate the `discount_coupons` table in your database with the Stripe coupon details. This is useful for validation and tracking.

**SQL Script**:
```sql
-- Insert BUNDLE25 coupon
INSERT INTO public.discount_coupons (
  code,
  discount_type,
  discount_value,
  applicable_plans,
  valid_from,
  valid_until,
  is_active,
  created_by
) VALUES (
  'BUNDLE25',
  'percentage',
  25,
  ARRAY['packaging', 'premium'],
  now(),
  NULL, -- No expiration
  true,
  'admin'
) ON CONFLICT (code) DO UPDATE
SET discount_value = 25, is_active = true;

-- Insert BUNDLE40 coupon
INSERT INTO public.discount_coupons (
  code,
  discount_type,
  discount_value,
  applicable_plans,
  valid_from,
  valid_until,
  is_active,
  created_by
) VALUES (
  'BUNDLE40',
  'percentage',
  40,
  ARRAY['packaging', 'premium'],
  now(),
  NULL,
  true,
  'admin'
) ON CONFLICT (code) DO UPDATE
SET discount_value = 40, is_active = true;
```

Run via Supabase SQL Editor or locally:
```bash
npx supabase db execute --file scripts/seed-discount-coupons.sql
```

---

## Common Issues & Troubleshooting

### Issue 1: "Coupon doesn't apply to products"
**Symptom**: Coupon created but doesn't show discount in checkout
**Solution**:
1. Edit coupon in Stripe Dashboard
2. Check "Applies to" section
3. Ensure both products are selected
4. Save changes

### Issue 2: "Price ID not found"
**Symptom**: Edge function returns "No such price: price_xxx"
**Solution**:
1. Verify price ID is correct (copy from Stripe Dashboard)
2. Check you're using TEST mode price IDs with TEST mode keys
3. Ensure environment variable has no extra spaces or quotes

### Issue 3: "Environment variable not loading"
**Symptom**: `import.meta.env.VITE_STRIPE_PRICE_xxx` is undefined
**Solution**:
1. Restart Vite dev server after adding env vars
2. Check `.env.local` file exists in `apps/creator/`
3. Verify variable names start with `VITE_` prefix
4. Check for typos in variable names

### Issue 4: "Stripe key mismatch"
**Symptom**: "No such price in live mode" or vice versa
**Solution**:
1. Ensure publishable key matches secret key (both test or both live)
2. Use `pk_test_` and `sk_test_` for test mode
3. Use `pk_live_` and `sk_live_` for production

---

## Phase 2 Completion Checklist

Before proceeding to Phase 3, verify:

- [x] All 2 products created in Stripe
- [x] All 8 prices created (4 per product)
- [x] All 2 coupons created
- [x] All IDs documented in this guide
- [x] Environment variables configured locally
- [x] Environment variables configured in Vercel (staging)
- [x] Validation script passes with all ✅
- [x] Optional: Coupons synced to database

**Phase 2 Status**: 🟢 READY FOR PHASE 3

---

## Next Phase

**Phase 3: Create Edge Functions**

Once Phase 2 is complete, proceed to Phase 3 to create the edge functions:
1. `create-creator-checkout` - Stripe Checkout Session creation
2. `creator-stripe-webhook` - Webhook event processing
3. `validate-coupon` - Coupon validation and redemption tracking
4. `get-creator-billing-history` - Billing history retrieval

**See**: `/docs/STRIPE_PAYMENT_INTEGRATION_PLAN.md` Section "Phase 3: Edge Functions"

---

**Phase 2 Guide Created**: 2025-11-13
**Status**: 📋 READY FOR MANUAL CONFIGURATION
**Next Action**: Complete Stripe Dashboard setup following this guide
