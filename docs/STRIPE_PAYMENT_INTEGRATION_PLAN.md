# Stripe Payment Integration Plan - Creator App

**Created**: 2025-11-13
**Status**: 🟡 Planning Phase
**Owner**: Development Team
**Target Completion**: TBD

---

## 📋 Executive Summary

Implement Stripe payment processing for creator subscriptions in the Creator app, maintaining **complete separation** from existing buyer payment infrastructure in the Dashboard app.

### Current State
- ✅ **Dashboard (Buyers)**: Fully functional Stripe integration with subscription management
- ❌ **Creator App**: No payment system implemented
- ⚠️ **Website**: Pricing page exists (marketing only), no payment processing

### Target State
- ✅ **Separate payment infrastructure** for creator app (independent from dashboard)
- ✅ Creator app with 3-tier pricing (Free, Packaging, Premium)
- ✅ **Per-title subscription model** (each title = separate Stripe subscription)
- ✅ **Discount coupon system** for bundle discounts (manual issue/redeem process)
- ✅ Tier-based feature gating for creators
- ✅ Domain-specific payment flows (creator.kstorybridge.com)
- ✅ **10% commission agreement** on title upload for free tier

---

## 🎯 Business Requirements

### Creator Pricing Tiers

#### Tier 1: Free "Listing" Plan
- **Price**: $0 forever
- **Limits**: Up to 2 titles
- **Commission**: 10% on gross receipts (option payments, purchase prices, production bonuses, license fees)
- **Features**:
  - List titles in curated marketplace
  - Searchable by verified buyers (Netflix, Amazon, Disney)
  - Receive direct buyer inquiries
  - Basic messaging and notifications

#### Tier 2: "Packaging" Plan
- **Regular Price**: $200/month or $2,000/year per title
- **Launch Promo**: $100/month or $1,000/year per title (50% off - manual pricing)
- **Launch Duration**: Until Dec 31, 2025 (extendable by decision)
- **Features**:
  - Professional Adaptation Pitch Deck (worth $3-5K)
  - Deep Analytics Dashboard: readership trends, genre benchmarks
  - "Verified Creator" Badge: instant credibility with buyers
  - Buyer Insights tracking
  - 60-minute Adaptation Strategy Consultation

#### Tier 3: "Premium" Plan
- **Regular Price**: $400/month or $4,000/year per title
- **Launch Promo**: $200/month or $2,000/year per title (50% off - manual pricing)
- **Launch Duration**: Until Dec 31, 2025 (extendable by decision)
- **Features**:
  - Everything in Packaging, PLUS:
  - Personal pitching to 20+ buyers per year
  - Monthly Intelligence Reports
  - Featured in industry newsletter (1,000+ buyers)
  - Homepage spotlight positioning
  - 3 customized pitch versions
  - Producer coaching sessions

### Bundle Discount Strategy

**Managed via Discount Coupon System** (manual issue/redeem process):
- **5+ titles**: 25% additional discount (manual coupon issuance)
- **10+ titles**: 40% additional discount (manual coupon issuance)
- **Implementation**: Admins issue discount coupons, creators redeem during checkout
- **No automation**: Manual tracking and approval process

### Commission Structure
- **10% on gross receipts** for free tier creators
- Applies to: option payments, purchase prices, production bonuses, license fees
- **Agreement**: Accepted by creator during title upload
- **Compare to**: Traditional agents (20-40%), Other platforms (15-20%)

---

## ✅ Architectural Decisions (Confirmed)

### Decision 1: Per-Title Subscription Model ✅
**Decision**: Each title gets a separate Stripe subscription
**Rationale**: Matches "$X per title" pricing messaging
**Implications**:
- One creator can have multiple active subscriptions (one per title)
- Database: `creator_subscriptions.title_id` links to specific title
- Webhook complexity: Multiple webhook events per creator
- Billing: Each title billed independently (dates may vary)
- UX: Separate billing dates per title

**Example**: Creator with 5 Packaging titles = 5 separate $100/month subscriptions

---

### Decision 2: Separate Subscription Infrastructure ✅
**Decision**: Creator app maintains its own subscription tables (NOT shared with dashboard)
**Rationale**: Simplifies isolation, reduces coupling between apps
**Implications**:
- Dashboard: Keeps existing tables in `/apps/dashboard/supabase/migrations/`
- Creator: New tables in `/apps/creator/supabase/migrations/` OR root `/supabase/migrations/`
- Edge functions: Creator-specific (not shared with dashboard)
- Webhooks: Separate webhook handling for creator subscriptions
- Code duplication: Some payment logic duplicated (trade-off for cleaner separation)

**Tables**:
- `creator_subscriptions` (separate from dashboard `subscriptions`)
- `creator_stripe_customers` (separate from dashboard `stripe_customers`)
- Optional: `creator_payments` for payment tracking

---

### Decision 3: Discount Coupon System (No Bundle Automation) ✅
**Decision**: Bundle discounts managed via manual coupon issue/redeem process
**Rationale**: Simpler initial implementation, easier to control
**Implications**:
- Admins manually issue discount coupons for qualifying creators
- Creators enter coupon codes during checkout
- No automatic bundle detection logic needed
- Requires admin interface for coupon management
- Requires creator interface for coupon redemption

**Implementation**:
- Stripe coupon creation via admin dashboard
- Coupon validation at checkout
- Database tracking: `discount_coupons`, `coupon_redemptions`

---

### Decision 4: Manual Launch Promo Handling ✅
**Decision**: 50% launch pricing handled manually (no system automation)
**Rationale**: Simplifies initial launch, easy to extend deadline
**Implications**:
- Create separate Stripe price IDs for launch vs regular pricing
- After Dec 31, 2025, manually switch UI to show regular prices only
- Early adopters can be grandfathered manually if needed
- No coupon expiration logic required
- No automatic price increase code needed

**Stripe Setup**:
- `price_packaging_monthly_launch` - $100/month (active until Dec 31, 2025)
- `price_packaging_monthly_regular` - $200/month (show after Jan 1, 2026)
- Similar for yearly and premium tiers

---

### Decision 5: Creator Payments on Creator App ✅
**Decision**: All creator payments processed on creator.kstorybridge.com
**Rationale**: Clean domain separation, professional experience
**Implications**:
- Checkout success URL: `https://creator.kstorybridge.com/payment/success`
- Checkout cancel URL: `https://creator.kstorybridge.com/pricing`
- Billing portal: Creator-branded
- No cross-domain payment flows needed

---

## 💳 Coupon Management System

### Admin Interface (Dashboard App)

**Features**:
- Issue discount coupons for bundle pricing
- Set discount amount/percentage (25% or 40%)
- Set expiration date (optional)
- Set usage limit (one-time or reusable)
- Assign to specific creators or make public
- View coupon usage history
- Deactivate/revoke coupons

**UI Location**: `/dashboard/admin/coupons`

**Workflow**:
1. Admin reviews creator's title count (5+ or 10+)
2. Admin creates appropriate coupon (BUNDLE25 or BUNDLE40)
3. Admin sends coupon code to creator via email/message
4. Creator uses coupon at checkout

---

### Creator Interface (Creator App)

**Features**:
- Input field to enter coupon code during checkout
- Real-time validation and preview of discount
- View applied discounts in billing summary
- See available bundle discount tiers (informational)

**UI Location**: `/creator/pricing` (checkout flow)

**Workflow**:
1. Creator clicks "Subscribe" on pricing page
2. Before Stripe checkout, coupon input field appears
3. Creator enters coupon code (e.g., "BUNDLE25")
4. System validates and applies discount
5. Discount shown in checkout summary
6. Proceeds to Stripe checkout with discounted price

---

### Database Schema (Coupon System)

**Table: `discount_coupons`**
```sql
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- e.g., 'BUNDLE25', 'WELCOME10'
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL, -- 25 for 25%, or 50 for $50 off
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz, -- NULL = no expiration
  usage_limit integer, -- NULL = unlimited
  usage_count integer DEFAULT 0,
  applicable_plans text[], -- ['packaging', 'premium'] or NULL for all
  created_by text, -- admin email
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Table: `coupon_redemptions`**
```sql
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES discount_coupons(id),
  creator_email text NOT NULL,
  subscription_id text, -- Stripe subscription ID
  title_id uuid REFERENCES titles(title_id),
  discount_applied numeric NOT NULL, -- Actual discount amount
  redeemed_at timestamptz DEFAULT now()
);
```

---

## 🏗️ Technical Architecture

### Separate Infrastructure Model

**Dashboard App (Buyers)** - UNCHANGED:
- Tables: `subscriptions`, `stripe_customers`, `payments`
- Location: `/apps/dashboard/supabase/migrations/`
- Edge functions: Existing (no modifications needed)
- Domain: dashboard.kstorybridge.com

**Creator App (Creators)** - NEW:
- Tables: `creator_subscriptions`, `creator_stripe_customers`
- Location: `/apps/creator/supabase/migrations/` OR root `/supabase/migrations/`
- Edge functions: New creator-specific functions
- Domain: creator.kstorybridge.com

**Key Principle**: Zero shared payment infrastructure between apps

---

### Creator Database Schema

**Table: `creator_subscriptions`**
```sql
CREATE TABLE public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_email text NOT NULL,
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('packaging', 'premium')),
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_creator_subs_email ON creator_subscriptions(creator_email);
CREATE INDEX idx_creator_subs_title ON creator_subscriptions(title_id);
CREATE INDEX idx_creator_subs_stripe ON creator_subscriptions(stripe_subscription_id);
```

**Table: `creator_stripe_customers`**
```sql
CREATE TABLE public.creator_stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_email text UNIQUE NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### Edge Functions (Creator-Specific)

**Function 1: `create-creator-checkout`**
- Input: `{ plan_type, billing_period, title_id, coupon_code? }`
- Creates Stripe checkout session for creator subscription
- Validates coupon code if provided
- Applies discount to checkout session
- Returns checkout URL
- Success URL: `https://creator.kstorybridge.com/payment/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `https://creator.kstorybridge.com/pricing`

**Function 2: `creator-stripe-webhook`**
- Handles Stripe webhook events for creator subscriptions
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Updates `creator_subscriptions` table
- Does NOT touch dashboard payment tables
- Validates webhook signature

**Function 3: `create-creator-billing-portal`**
- Creates Stripe billing portal session for creators
- Return URL: `https://creator.kstorybridge.com/profile`

**Function 4: `validate-coupon`**
- Input: `{ coupon_code, plan_type, title_id }`
- Validates coupon exists, is active, not expired
- Checks usage limits
- Returns discount details or error

---

## 📅 Implementation Phases

### Phase 1: Database Schema for Creator Subscriptions
**Status**: ⬜ Not Started
**Estimated Time**: 2-3 hours
**Dependencies**: None
**Blocking**: All other phases

**Tasks**:
- [ ] Decide migration location: `/apps/creator/supabase/migrations/` OR root `/supabase/migrations/`
  - Recommendation: Root for consistency (per CLAUDE.md)
- [ ] Create migration: `20251113000000_create_creator_subscriptions.sql`
- [ ] Create `creator_subscriptions` table with per-title model
- [ ] Create `creator_stripe_customers` table
- [ ] Create `discount_coupons` table
- [ ] Create `coupon_redemptions` table
- [ ] Add RLS policies for creator access
- [ ] Create indexes for performance
- [ ] Run migration locally: `npx supabase db reset`
- [ ] Test with sample data
- [ ] Push to production: `npx supabase db push`
- [ ] Document in DATABASE_SCHEMA.md

**Success Criteria**:
- [ ] All tables created successfully
- [ ] RLS policies tested (creators can only see own subscriptions)
- [ ] Indexes improve query performance
- [ ] Zero errors in migration

---

### Phase 2: Stripe Product & Price Configuration
**Status**: ⬜ Not Started
**Estimated Time**: 30-45 minutes
**Dependencies**: None (can run in parallel with Phase 1)
**Blocking**: Phase 3, Phase 5

**Stripe Products to Create**:

#### Packaging Plan
- [ ] Create product: "Creator Packaging Plan - Per Title"
- [ ] Create price (monthly launch): $100/month
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (yearly launch): $1,000/year
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (monthly regular): $200/month
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (yearly regular): $2,000/year
  - Price ID: `price_________________________` (fill in)

#### Premium Plan
- [ ] Create product: "Creator Premium Plan - Per Title"
- [ ] Create price (monthly launch): $200/month
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (yearly launch): $2,000/year
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (monthly regular): $400/month
  - Price ID: `price_________________________` (fill in)
- [ ] Create price (yearly regular): $4,000/year
  - Price ID: `price_________________________` (fill in)

#### Bundle Discount Coupons
- [ ] Create coupon: "BUNDLE25" (25% off)
  - Coupon ID: `_________________________`
  - Duration: Forever
  - For: 5+ title creators
- [ ] Create coupon: "BUNDLE40" (40% off)
  - Coupon ID: `_________________________`
  - Duration: Forever
  - For: 10+ title creators

**Environment Variables**:
```bash
# Creator app (.env.local and Vercel)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase edge function secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH=price_...
npx supabase secrets set STRIPE_PRICE_PACKAGING_YEARLY_LAUNCH=price_...
npx supabase secrets set STRIPE_PRICE_PACKAGING_MONTHLY_REGULAR=price_...
npx supabase secrets set STRIPE_PRICE_PACKAGING_YEARLY_REGULAR=price_...
npx supabase secrets set STRIPE_PRICE_PREMIUM_MONTHLY_LAUNCH=price_...
npx supabase secrets set STRIPE_PRICE_PREMIUM_YEARLY_LAUNCH=price_...
npx supabase secrets set STRIPE_PRICE_PREMIUM_MONTHLY_REGULAR=price_...
npx supabase secrets set STRIPE_PRICE_PREMIUM_YEARLY_REGULAR=price_...
```

**Success Criteria**:
- [ ] All products visible in Stripe Dashboard
- [ ] Price IDs documented in this file
- [ ] Test payment succeeds in Stripe test mode
- [ ] Environment variables set

---

### Phase 3: Creator Edge Functions
**Status**: ⬜ Not Started
**Estimated Time**: 4-5 hours
**Dependencies**: Phase 1, Phase 2
**Blocking**: Phase 5

**Create Edge Function: `create-creator-checkout`**

Location: `/supabase/functions/create-creator-checkout/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { plan_type, billing_period, title_id, coupon_code } = await req.json()

    // Get or create Stripe customer
    // Validate coupon if provided
    // Get correct price ID based on plan_type and billing_period
    // Create checkout session
    // Return checkout URL

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Tasks**:
- [ ] Create `/supabase/functions/create-creator-checkout/index.ts`
- [ ] Implement customer lookup/creation
- [ ] Implement coupon validation logic
- [ ] Implement price ID selection (launch vs regular)
- [ ] Add metadata: `{ title_id, account_type: 'creator' }`
- [ ] Set success/cancel URLs
- [ ] Test locally: `npx supabase functions serve`
- [ ] Deploy: `npx supabase functions deploy create-creator-checkout`

---

**Create Edge Function: `creator-stripe-webhook`**

Location: `/supabase/functions/creator-stripe-webhook/index.ts`

**Tasks**:
- [ ] Create `/supabase/functions/creator-stripe-webhook/index.ts`
- [ ] Verify webhook signature
- [ ] Handle `checkout.session.completed` event
  - Create/update `creator_subscriptions` record
  - Update `creator_stripe_customers` record
  - Record coupon redemption if used
- [ ] Handle `customer.subscription.updated` event
  - Update subscription status
- [ ] Handle `customer.subscription.deleted` event
  - Mark subscription as canceled
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/creator-stripe-webhook`
- [ ] Deploy: `npx supabase functions deploy creator-stripe-webhook`
- [ ] Add webhook endpoint to Stripe Dashboard

---

**Create Edge Function: `validate-coupon`**

Location: `/supabase/functions/validate-coupon/index.ts`

**Tasks**:
- [ ] Create `/supabase/functions/validate-coupon/index.ts`
- [ ] Check coupon exists in `discount_coupons` table
- [ ] Validate: is_active = true
- [ ] Validate: valid_from <= now <= valid_until
- [ ] Validate: usage_count < usage_limit
- [ ] Validate: applicable to requested plan_type
- [ ] Return discount details or error message
- [ ] Test locally
- [ ] Deploy

**Success Criteria**:
- [ ] All edge functions deployed
- [ ] Webhook successfully receives events
- [ ] Checkout session creation works
- [ ] Coupon validation works correctly
- [ ] Zero TypeScript errors

---

### Phase 4: Coupon Management UI
**Status**: ⬜ Not Started
**Estimated Time**: 3-4 hours
**Dependencies**: Phase 1, Phase 3
**Blocking**: None (can launch without this initially)

**Admin Dashboard (Dashboard App)**:

Create: `/apps/dashboard/src/pages/admin/CouponManagement.tsx`

**Features**:
- [ ] List all coupons with status
- [ ] Create new coupon form
  - Code input
  - Discount type (percentage/fixed)
  - Discount value
  - Valid from/until dates
  - Usage limit
  - Applicable plans
- [ ] View coupon usage history
- [ ] Deactivate/reactivate coupons
- [ ] Copy coupon code to clipboard
- [ ] Search and filter coupons

**Tasks**:
- [ ] Create `src/services/couponService.ts` (dashboard app)
- [ ] Create `CouponManagement.tsx` page
- [ ] Add route: `/admin/coupons`
- [ ] Add navigation link in admin sidebar
- [ ] Test CRUD operations
- [ ] Add RLS policies for admin-only access

---

**Creator Interface (Creator App)**:

Modify: `/apps/creator/src/pages/Pricing.tsx`

**Features**:
- [ ] Coupon input field in pricing page
- [ ] "Have a coupon code?" expandable section
- [ ] Real-time validation on blur
- [ ] Show discount preview
- [ ] Pass coupon to checkout function

**Tasks**:
- [ ] Add coupon input component
- [ ] Call `validate-coupon` edge function
- [ ] Display validation errors/success
- [ ] Pass `coupon_code` to checkout
- [ ] Test coupon application flow

**Success Criteria**:
- [ ] Admin can create coupons
- [ ] Creator can enter and validate coupons
- [ ] Discount correctly applied at checkout
- [ ] Invalid coupons show clear errors

---

### Phase 5: Creator App Payment UI
**Status**: ⬜ Not Started
**Estimated Time**: 4-5 hours
**Dependencies**: Phase 2, Phase 3
**Blocking**: Phase 6

**Components to Create**:

#### 1. Stripe Client Library
- [ ] Create `src/lib/stripe.ts`
  ```typescript
  import { loadStripe } from '@stripe/stripe-js';
  export const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  );
  ```

#### 2. Payment Service
- [ ] Create `src/services/paymentService.ts`
  ```typescript
  export const createCheckoutSession = async (
    planType: 'packaging' | 'premium',
    billingPeriod: 'monthly' | 'yearly',
    titleId: string,
    couponCode?: string
  ) => {
    // Call create-creator-checkout edge function
  }
  ```

#### 3. PaymentButton Component
- [ ] Create `src/components/PaymentButton.tsx`
- [ ] Props: `planType`, `billingPeriod`, `titleId`, `buttonText`
- [ ] Loading state
- [ ] Error handling
- [ ] Redirects to Stripe Checkout

#### 4. Update Pricing Page
- [ ] Modify `src/pages/CreatorsPricingPage.tsx` (if exists) OR create new
- [ ] Add title selection dropdown (for per-title model)
- [ ] Monthly/yearly toggle
- [ ] PaymentButton integration
- [ ] Coupon input section
- [ ] Show launch vs regular pricing (until Dec 31, 2025)

#### 5. Success/Cancel Pages
- [ ] Create `src/pages/PaymentSuccess.tsx`
  - Thank you message
  - "Your subscription is now active"
  - Link to title dashboard
  - What happens next section
- [ ] Create `src/pages/PaymentCancel.tsx`
  - "Payment canceled" message
  - Reassurance
  - Return to pricing link

#### 6. Routes
- [ ] Add routes in `src/App.tsx`:
  - `/pricing` - Pricing page
  - `/payment/success` - Success page
  - `/payment/cancel` - Cancel page

**Success Criteria**:
- [ ] Creator can select plan and title
- [ ] Click "Subscribe" opens Stripe Checkout
- [ ] Payment succeeds in test mode
- [ ] Redirects to success page
- [ ] Subscription appears in database

---

### Phase 6: Tier-Based Feature Gating
**Status**: ⬜ Not Started
**Estimated Time**: 3-4 hours
**Dependencies**: Phase 5
**Blocking**: None

**Free Tier Features** (0 active subscriptions):
- [ ] Title limit enforcement: Max 2 titles
  - Check before allowing title creation
  - Show upgrade prompt at limit
  - Error: "Free plan limited to 2 titles. Upgrade to unlock unlimited."
- [ ] 10% commission agreement checkbox on title upload
- [ ] Basic messaging and notifications

**Packaging Tier Features** (1+ packaging subscriptions):
- [ ] Remove title limit (unlimited titles)
- [ ] Enable pitch deck features (when built)
- [ ] Show "Verified Creator" badge
- [ ] Enable analytics dashboard (when built)

**Premium Tier Features** (1+ premium subscriptions):
- [ ] All Packaging features
- [ ] Featured placement flag on titles
- [ ] Priority in search results (boost ranking)
- [ ] Access to premium reports (when built)
- [ ] Priority support badge

**Implementation**:

#### 1. Subscription Status Hook
- [ ] Create `src/hooks/useCreatorSubscriptions.tsx`
  ```typescript
  export const useCreatorSubscriptions = () => {
    const { user } = useAuth()

    const { data: subscriptions } = useQuery({
      queryKey: ['creator-subscriptions', user?.email],
      queryFn: async () => {
        const { data } = await supabase
          .from('creator_subscriptions')
          .select('*')
          .eq('creator_email', user?.email)
          .eq('status', 'active')
        return data
      }
    })

    return {
      subscriptions,
      hasPackaging: subscriptions?.some(s => s.plan_type === 'packaging'),
      hasPremium: subscriptions?.some(s => s.plan_type === 'premium'),
      activeCount: subscriptions?.length || 0
    }
  }
  ```

#### 2. Title Limit Enforcement
- [ ] Modify `src/pages/AddTitle.tsx`
  - Check subscription count before allowing creation
  - If free tier (0 subs) and ≥2 titles exist, block creation
  - Show upgrade modal

#### 3. Feature Access Guards
- [ ] Create `src/components/FeatureGate.tsx`
  ```typescript
  export const FeatureGate = ({
    requiredTier,
    children,
    fallback
  }) => {
    const { hasPackaging, hasPremium } = useCreatorSubscriptions()
    // Render children if tier met, else fallback
  }
  ```

**Success Criteria**:
- [ ] Free tier blocked at 2 titles
- [ ] Packaging tier unlocks unlimited titles
- [ ] Premium features correctly gated
- [ ] Tier checks efficient (cached)

---

### Phase 7: Testing & Validation
**Status**: ⬜ Not Started
**Estimated Time**: 4-5 hours
**Dependencies**: Phase 6
**Blocking**: Production deployment

**Subscription Workflow Tests**:
- [ ] Free creator creates 1st title (success)
- [ ] Free creator creates 2nd title (success)
- [ ] Free creator tries to create 3rd title (blocked with upgrade prompt)
- [ ] Creator subscribes to Packaging plan for Title 1 (success)
- [ ] Creator can now create 3rd, 4th, 5th titles (unlimited)
- [ ] Creator subscribes to Premium for Title 2 (success)
- [ ] Creator now has 2 active subscriptions (1 Packaging, 1 Premium)

**Payment Flow Tests**:
- [ ] Packaging monthly payment succeeds
- [ ] Packaging yearly payment succeeds
- [ ] Premium monthly payment succeeds
- [ ] Premium yearly payment succeeds
- [ ] Payment with valid coupon applies discount
- [ ] Payment with invalid coupon shows error
- [ ] Payment cancellation returns to pricing page

**Webhook Tests**:
- [ ] `checkout.session.completed` creates subscription record
- [ ] `customer.subscription.updated` updates subscription status
- [ ] `customer.subscription.deleted` marks as canceled
- [ ] Webhook updates occur within 10 seconds

**Coupon Tests**:
- [ ] Valid coupon validates successfully
- [ ] Expired coupon rejected
- [ ] Usage limit enforced
- [ ] Inactive coupon rejected
- [ ] Discount correctly calculated

**Edge Cases**:
- [ ] Creator cancels subscription (title still exists, tier reverts)
- [ ] Expired card during renewal (webhook handles)
- [ ] Multiple concurrent subscriptions for one creator
- [ ] Free tier with 2 titles, subscribes, creates 3rd, then cancels subscription
- [ ] Checkout session timeout handling

**Dashboard Regression** (CRITICAL):
- [ ] Existing buyer subscriptions still work
- [ ] Dashboard webhook still updates `user_buyers.tier`
- [ ] No interference between creator and buyer payments
- [ ] Buyer tier access unchanged

**Success Criteria**:
- [ ] 100% of test cases pass
- [ ] Zero payment failures in test mode
- [ ] No regression in buyer (dashboard) functionality
- [ ] Webhook processing < 5 seconds

---

### Phase 8: Documentation & Production Deployment
**Status**: ⬜ Not Started
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 7
**Blocking**: None

**Documentation Updates**:

- [ ] Update `docs/active/DATABASE_SCHEMA.md`
  - Document `creator_subscriptions` table
  - Document `discount_coupons` table
  - Document per-title subscription model

- [ ] Update `apps/creator/CLAUDE.md`
  - Add payment system section
  - Document tier levels and features
  - Link to this plan

- [ ] Update `docs/guides/STRIPE_SETUP_GUIDE.md`
  - Add creator-specific setup instructions
  - Document new price IDs
  - Update webhook configuration

- [ ] Create `docs/CREATOR_PAYMENT_FLOW.md`
  - User journey diagrams
  - Technical architecture diagrams
  - Troubleshooting guide for common issues

**Production Deployment**:

- [ ] Switch from test to production Stripe keys
- [ ] Update webhook endpoint in Stripe Dashboard (production mode)
- [ ] Test webhook signing with production secret
- [ ] Deploy edge functions to production
- [ ] Set environment variables in Vercel (creator app)
- [ ] Set secrets in Supabase (production)
- [ ] Smoke test in production:
  - Create test subscription
  - Verify webhook updates database
  - Test billing portal access
  - Cancel test subscription
- [ ] Monitor error logs for 24 hours
- [ ] Create rollback plan

**Success Criteria**:
- [ ] All documentation updated and accurate
- [ ] Production deployment successful
- [ ] Zero errors in production logs
- [ ] Team can support creators with payment issues

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Payment Success Rate**: >95% in production
- [ ] **Webhook Processing Time**: <5 seconds average
- [ ] **Checkout Session Creation**: <2 seconds
- [ ] **Page Load Time**: <3 seconds for pricing page
- [ ] **Zero Downtime**: No impact to dashboard/buyer payments

### Business Metrics (Post-Launch)
- [ ] **Free Plan Signups**: Track conversion rate
- [ ] **Packaging Plan Adoption**: % of creators subscribing
- [ ] **Premium Plan Adoption**: % choosing highest tier
- [ ] **Monthly vs Yearly**: Split between billing periods
- [ ] **Churn Rate**: Track subscription cancellations
- [ ] **Bundle Discount Usage**: Number of coupons redeemed
- [ ] **Average Subscriptions per Creator**: Per-title model effectiveness

---

## 🚨 Risks & Mitigation

### High Risk
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Per-title model too complex for creators | High | Medium | Clear onboarding, help docs, visual subscription list |
| Webhook routing errors affect subscriptions | Critical | Low | Extensive testing, separate webhook endpoints |
| Creator cancels subscription but keeps using features | Medium | High | Real-time tier validation, grace period handling |

### Medium Risk
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Launch pricing confusion (when does it end?) | Medium | Medium | Clear UI messaging, FAQ section |
| Manual coupon process too slow | Medium | Low | Admin dashboard for quick issuance |
| Multiple subscription billing dates confuse creators | Medium | High | Subscription dashboard showing all billing dates |

### Low Risk
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Stripe API rate limits | Low | Low | Implement retry logic, queue processing |
| Edge function cold starts | Low | Medium | Keep warm with health checks |

---

## 📝 Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-11-13 | Per-title subscription model | Matches "$X per title" pricing messaging | Each title = separate Stripe subscription |
| 2025-11-13 | Separate subscription infrastructure | Cleaner app separation, reduces coupling | Creator & dashboard maintain own tables |
| 2025-11-13 | Discount coupon system (no automation) | Simpler initial implementation | Manual admin process for bundle discounts |
| 2025-11-13 | Manual launch promo handling | Easy to extend deadline, no code complexity | Manual UI switch on Jan 1, 2026 |
| 2025-11-13 | 10% commission for free tier | Industry-leading low rate | Agreement required on title upload |

---

## 🔗 Related Documentation

- [Root CLAUDE.md](../CLAUDE.md) - Monorepo overview
- [Creator CLAUDE.md](../apps/creator/CLAUDE.md) - Creator app documentation
- [Dashboard CLAUDE.md](../apps/dashboard/CLAUDE.md) - Dashboard app (buyers)
- [DATABASE_SCHEMA.md](./active/DATABASE_SCHEMA.md) - Database schema reference
- [STRIPE_SETUP_GUIDE.md](./guides/STRIPE_SETUP_GUIDE.md) - Stripe configuration
- [Migration Safety Guide](./guides/MIGRATION_SAFETY_GUIDE.md) - Database migration protocols

---

## ✅ Pre-Launch Checklist

**Planning Complete**:
- [x] Architectural decisions documented
- [x] Per-title vs per-user model chosen
- [x] Bundle discount strategy defined
- [x] Launch pricing approach confirmed
- [x] Coupon system designed

**Technical Readiness**:
- [ ] All 8 phases completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Stripe products created (production mode)
- [ ] Environment variables configured (production)
- [ ] Database migrations applied (production)
- [ ] Edge functions deployed (production)

**Operational Readiness**:
- [ ] Team trained on new system
- [ ] Support documentation ready
- [ ] Common issues documented
- [ ] Monitoring and alerts configured
- [ ] Rollback plan tested

**Business Readiness**:
- [ ] Pricing page live
- [ ] Email templates ready (subscription confirmations)
- [ ] FAQ section updated
- [ ] Terms of service updated (10% commission)
- [ ] Launch announcement prepared

---

## 📞 Resources

**Stripe Account**: [Link to Stripe Dashboard]
**Supabase Project**: `dlrnrgcoguxlkkcitlpd`

**Production Domains**:
- Dashboard: https://dashboard.kstorybridge.com
- Creator: https://creator.kstorybridge.com
- Website: https://kstorybridge.com

**Staging Domains**:
- Dashboard: https://dashboard-staging.kstorybridge.com
- Creator: https://creator-staging.kstorybridge.com

---

**Last Updated**: 2025-11-13
**Next Review**: After Phase 1 completion
**Status**: 🟡 Planning Complete - Ready for Implementation
