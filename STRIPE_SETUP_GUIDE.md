# Stripe Integration Setup Guide

## 🚨 Critical: Database Migration Required

**IMPORTANT**: The `stripe_customers` table must be created before the Stripe integration will work.

### Execute this SQL in Supabase SQL Editor:

```sql
-- Create stripe_customers table to track Stripe subscription data
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  subscription_status text CHECK (subscription_status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid')),
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own Stripe customer data
CREATE POLICY "Users can view own stripe customer data" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all stripe customer data (for webhooks)
CREATE POLICY "Service role can manage stripe customers" ON stripe_customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_customer_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_subscription_id ON stripe_customers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_subscription_status ON stripe_customers(subscription_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_customers_updated_at();

-- Add comment for documentation
COMMENT ON TABLE stripe_customers IS 'Tracks Stripe customer and subscription data for Pro tier users';
COMMENT ON COLUMN stripe_customers.subscription_status IS 'Stripe subscription status - active means Pro tier access';
COMMENT ON COLUMN stripe_customers.current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN stripe_customers.cancel_at_period_end IS 'Whether subscription will cancel at period end';
```

## 🎯 Stripe Dashboard Setup

### 1. Create Product and Price

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add Product**
3. Create product:
   - **Name**: `KStoryBridge Pro`
   - **Description**: `Pro tier access to premium features including pitch deck access, creator contact, and AI enhanced chat`
4. Add pricing:
   - **Type**: `Recurring`
   - **Price**: `$250.00`
   - **Billing Period**: `Monthly`
   - **Currency**: `USD`
5. **Save the Price ID** (starts with `price_`) - you'll need this for environment variables

### 2. Configure Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. **Add endpoint**:
   - **URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook`
   - **Description**: `KStoryBridge Pro Subscription Webhook`
3. **Select events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Save the Webhook Secret** (starts with `whsec_`) - you'll need this for environment variables

## 🔐 Environment Variables Setup

### Frontend Environment Variables

Create or update `apps/dashboard/.env`

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Supabase Edge Function Secrets

Set these via Supabase CLI:

```bash
# Stripe Secret Key (from Stripe Dashboard → Developers → API Keys)
npx supabase secrets set STRIPE_SECRET_KEY=

# Webhook Secret (from webhook endpoint you created)
npx supabase secrets set STRIPE_WEBHOOK_SECRET=

# Pro Plan Price ID (from the product you created)
npx supabase secrets set STRIPE_PRICE_ID_PRO=
```

## ✅ Verification Steps

### 1. Verify Database Table

Run this query in Supabase SQL Editor:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stripe_customers'
ORDER BY ordinal_position;
```

Should return the table schema with columns like `user_id`, `stripe_customer_id`, etc.

### 2. Verify Edge Functions

Check that functions are deployed:
- https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/create-checkout-session
- https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook
- https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/create-billing-portal

### 3. Verify Environment Variables

Test in Supabase Functions logs that secrets are loaded:
```bash
npx supabase functions invoke create-checkout-session --method POST --body '{}'
```

## 🧪 Testing the Integration

### Test Flow:
1. **Navigate** to `/buyers/pricing`
2. **Click** "Upgrade to Pro" on Pro plan
3. **Complete** Stripe checkout (use test card: 4242 4242 4242 4242)
4. **Verify** redirect to `/payment/success`
5. **Check** user tier updated to `pro` in database
6. **Test** Pro features are unlocked (pitch deck access, contact creator)

### Test Cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## 🔧 Pro Features Enabled

Once a user has Pro tier (`tier = 'pro'` in `user_buyers` table), they get:

1. **Pitch Deck Access** - View pitch presentations on title detail pages
2. **Contact Rights Owners** - Direct communication with content creators
3. **AI Chat Enhanced** - Personalized recommendations and insights
4. **Premium Content Access** - Full title information and market data

## 🚨 Important Notes

- **Test Mode**: Use Stripe test keys for development
- **Production**: Switch to live keys for production deployment
- **Webhooks**: Must be accessible from Stripe's servers (no localhost)
- **Database**: Migration must be applied before any payment functionality works
- **Secrets**: Never commit real API keys to git - use environment variables only

## 📞 Support

If you encounter issues:
1. Check Supabase Functions logs for webhook errors
2. Verify Stripe webhook endpoint is receiving events
3. Confirm database table exists and has proper RLS policies
4. Test with Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`