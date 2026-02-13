# Stripe Price ID Reference

**Last Updated**: 2025-11-13
**Environment**: Test Mode
**Status**: 🟡 Pending Configuration

> 📋 **Instructions**: Fill in this template as you create products and prices in Stripe Dashboard.
> See [STRIPE_PHASE2_CONFIGURATION_GUIDE.md](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md) for step-by-step instructions.

---

## Product IDs

| Product Name | Product ID | Created Date | Status |
|--------------|------------|--------------|--------|
| Creator Packaging Plan | `prod_TQ7vbAesj2B5ap` | YYYY-MM-DD | ⬜ Pending |
| Creator Premium Plan | `prod_TQ7xPyDbrSJjVU` | YYYY-MM-DD | ⬜ Pending |

---

## Price IDs - Packaging Plan

| Period | Type | Amount | Price ID | Created Date | Status |
|--------|------|--------|----------|--------------|--------|
| Monthly | Launch Promo | $100/mo | `price_____________________` | YYYY-MM-DD | ⬜ Pending |
| Monthly | Regular | $150/mo | `price_____________________` | YYYY-MM-DD | ⬜ Pending |

---

## Price IDs - Premium Plan

| Period | Type | Amount | Price ID | Created Date | Status |
|--------|------|--------|----------|--------------|--------|
| Monthly | Launch Promo | $200/mo | `price_____________________` | YYYY-MM-DD | ⬜ Pending |
| Monthly | Regular | $300/mo | `price_____________________` | YYYY-MM-DD | ⬜ Pending |

---

## Environment Variable Mapping

Once all IDs are created, copy them to your `.env.local` file:

```bash
# Stripe Publishable Key (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_____________________

# Price IDs - Launch Promo (Currently Active)
VITE_STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH=price_____________________
VITE_STRIPE_PRICE_PREMIUM_MONTHLY_LAUNCH=price_____________________

# Price IDs - Regular (Future Use)
VITE_STRIPE_PRICE_PACKAGING_MONTHLY_REGULAR=price_____________________
VITE_STRIPE_PRICE_PREMIUM_MONTHLY_REGULAR=price_____________________

# Product IDs
VITE_STRIPE_PRODUCT_PACKAGING=prod_____________________
VITE_STRIPE_PRODUCT_PREMIUM=prod_____________________

# Launch Promo Settings
VITE_LAUNCH_PROMO_ACTIVE=true
VITE_LAUNCH_PROMO_END_DATE=2026-01-31
```

---

## Validation Checklist

After filling in all IDs above:

- [ ] All 2 product IDs start with `prod_`
- [ ] All 4 price IDs start with `price_`
- [ ] IDs copied to `apps/creator/.env.local`
- [ ] IDs added to Vercel environment variables (staging)
- [ ] Run validation script: `cd apps/creator && npx tsx scripts/validate-stripe-config.ts`
- [ ] Validation script passes with all ✅

---

## Test Mode vs Live Mode

### Test Mode (Development & Staging)
- **Use**: Stripe test mode keys and IDs
- **Publishable Key**: `pk_test_...`
- **Secret Key**: `sk_test_...`
- **Price IDs**: Created in test mode
- **No real charges**: Test credit cards only

### Live Mode (Production)
- **Use**: Stripe live mode keys and IDs
- **Publishable Key**: `pk_live_...`
- **Secret Key**: `sk_live_...`
- **Price IDs**: Create new prices in live mode (same amounts)
- **Real charges**: Real credit cards, real money

**IMPORTANT**: Never mix test and live mode keys. Always match test keys with test price IDs, and live keys with live price IDs.

---

## Quick Links

- **Stripe Dashboard**: https://dashboard.stripe.com/test/products
- **Stripe Coupons**: https://dashboard.stripe.com/test/coupons
- **Configuration Guide**: [STRIPE_PHASE2_CONFIGURATION_GUIDE.md](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md)
- **Integration Plan**: [STRIPE_PAYMENT_INTEGRATION_PLAN.md](./STRIPE_PAYMENT_INTEGRATION_PLAN.md)

---

**Status**: 🟡 Awaiting Stripe Dashboard configuration
**Next Step**: Follow [Phase 2 Configuration Guide](./STRIPE_PHASE2_CONFIGURATION_GUIDE.md) to create products and prices
