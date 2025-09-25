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