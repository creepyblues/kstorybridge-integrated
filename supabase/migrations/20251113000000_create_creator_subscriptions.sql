/**
 * Migration: Create Creator Subscription Infrastructure
 * Date: 2025-11-13
 * Type: Schema Creation (Non-Destructive)
 * Status: 🟡 IN PROGRESS
 *
 * PURPOSE:
 * Implements separate payment infrastructure for creator subscriptions,
 * independent from buyer (dashboard) payment tables.
 *
 * TABLES CREATED:
 * - creator_subscriptions: Per-title subscription records
 * - creator_stripe_customers: Stripe customer mapping for creators
 * - discount_coupons: Admin-managed discount coupons
 * - coupon_redemptions: Coupon usage tracking
 * - creator_payments: Transaction history (optional - can use Stripe API instead)
 *
 * ARCHITECTURE DECISION:
 * Separate from dashboard payment infrastructure to maintain clean app separation.
 * Dashboard keeps: subscriptions, stripe_customers, payments (for buyers)
 * Creator gets: creator_* tables (for creators)
 *
 * RELATED DOCS:
 * - /docs/STRIPE_PAYMENT_INTEGRATION_PLAN.md
 * - /apps/creator/CLAUDE.md
 */

-- ============================================================================
-- TABLE: creator_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_email text NOT NULL,
  title_id uuid NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.creator_subscriptions IS
'Per-title subscription records for creators. Each title can have separate subscription (Packaging or Premium plan).';

COMMENT ON COLUMN public.creator_subscriptions.creator_email IS
'Creator email from auth.users.email or user_creators.email';

COMMENT ON COLUMN public.creator_subscriptions.title_id IS
'Foreign key to titles table - enables per-title subscription model';

COMMENT ON COLUMN public.creator_subscriptions.plan_type IS
'Subscription plan: packaging ($100-200/mo) or premium ($200-400/mo)';

COMMENT ON COLUMN public.creator_subscriptions.billing_period IS
'Billing frequency: monthly or yearly (yearly gets discount)';

-- Indexes for fast lookups
CREATE INDEX idx_creator_subs_email ON public.creator_subscriptions(creator_email);
CREATE INDEX idx_creator_subs_title ON public.creator_subscriptions(title_id);
CREATE INDEX idx_creator_subs_stripe ON public.creator_subscriptions(stripe_subscription_id);
CREATE INDEX idx_creator_subs_status ON public.creator_subscriptions(status);

-- ============================================================================
-- TABLE: creator_stripe_customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creator_stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_email text UNIQUE NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.creator_stripe_customers IS
'Mapping between creator emails and Stripe customer IDs';

-- ============================================================================
-- TABLE: discount_coupons
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  applicable_plans text[],
  created_by text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.discount_coupons IS
'Admin-managed discount coupons for bundle pricing and promotions';

COMMENT ON COLUMN public.discount_coupons.code IS
'Coupon code (e.g., BUNDLE25, WELCOME10)';

COMMENT ON COLUMN public.discount_coupons.discount_type IS
'Type: percentage (e.g., 25 for 25% off) or fixed_amount (e.g., 50 for $50 off)';

COMMENT ON COLUMN public.discount_coupons.applicable_plans IS
'Array of plan types: ["packaging", "premium"] or NULL for all plans';

-- Index for fast coupon lookups
CREATE INDEX idx_coupons_code ON public.discount_coupons(code);
CREATE INDEX idx_coupons_active ON public.discount_coupons(is_active);

-- ============================================================================
-- TABLE: coupon_redemptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  creator_email text NOT NULL,
  subscription_id text REFERENCES public.creator_subscriptions(stripe_subscription_id),
  title_id uuid REFERENCES public.titles(title_id),
  discount_applied numeric NOT NULL,
  redeemed_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.coupon_redemptions IS
'Tracks coupon usage and redemptions';

-- Indexes for redemption tracking
CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX idx_redemptions_creator ON public.coupon_redemptions(creator_email);

-- ============================================================================
-- TABLE: creator_payments (Optional - can use Stripe API instead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creator_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_email text NOT NULL,
  subscription_id text REFERENCES public.creator_subscriptions(stripe_subscription_id),
  stripe_payment_intent_id text UNIQUE,
  stripe_invoice_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  invoice_url text,
  receipt_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.creator_payments IS
'Transaction history for creator subscriptions. Optional - can fetch from Stripe API instead.';

-- Indexes for payment history
CREATE INDEX idx_creator_payments_email ON public.creator_payments(creator_email);
CREATE INDEX idx_creator_payments_sub ON public.creator_payments(subscription_id);
CREATE INDEX idx_creator_payments_status ON public.creator_payments(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: creator_subscriptions
-- ============================================================================

-- Creators can view their own subscriptions
CREATE POLICY "Creators can view own subscriptions"
ON public.creator_subscriptions
FOR SELECT
USING (
  creator_email = auth.jwt()->>'email'
);

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
ON public.creator_subscriptions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: creator_stripe_customers
-- ============================================================================

-- Creators can view their own customer record
CREATE POLICY "Creators can view own customer record"
ON public.creator_stripe_customers
FOR SELECT
USING (creator_email = auth.jwt()->>'email');

-- Service role can manage all customer records
CREATE POLICY "Service role can manage customer records"
ON public.creator_stripe_customers
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: discount_coupons
-- ============================================================================

-- Anyone can view active coupons (for validation)
CREATE POLICY "Anyone can view active coupons"
ON public.discount_coupons
FOR SELECT
USING (is_active = true);

-- Only authenticated users can view all coupons (including inactive)
CREATE POLICY "Authenticated users can view all coupons"
ON public.discount_coupons
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can create/update coupons (TODO: replace with proper admin check)
CREATE POLICY "Admins can manage coupons"
ON public.discount_coupons
FOR ALL
USING (
  auth.jwt()->>'role' = 'service_role'
  -- TODO: Add admin check via user_buyers.tier = 'admin' or similar
)
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
);

-- ============================================================================
-- RLS POLICIES: coupon_redemptions
-- ============================================================================

-- Creators can view their own redemptions
CREATE POLICY "Creators can view own redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (creator_email = auth.jwt()->>'email');

-- Service role can manage all redemptions
CREATE POLICY "Service role can manage redemptions"
ON public.coupon_redemptions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: creator_payments
-- ============================================================================

-- Creators can view their own payment history
CREATE POLICY "Creators can view own payments"
ON public.creator_payments
FOR SELECT
USING (creator_email = auth.jwt()->>'email');

-- Service role can manage all payments (for webhook inserts)
CREATE POLICY "Service role can manage payments"
ON public.creator_payments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_creator_subscriptions_updated_at
  BEFORE UPDATE ON public.creator_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_stripe_customers_updated_at
  BEFORE UPDATE ON public.creator_stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

/**
 * POST-MIGRATION CHECKLIST:
 * - [ ] Run migration locally: npx supabase db reset
 * - [ ] Verify all tables created: \dt creator_*
 * - [ ] Test RLS policies with creator user
 * - [ ] Insert test data
 * - [ ] Push to production: npx supabase db push
 * - [ ] Document in DATABASE_SCHEMA.md
 *
 * NEXT STEPS:
 * - Phase 2: Configure Stripe products and prices
 * - Phase 3: Create edge functions for checkout and webhooks
 */
