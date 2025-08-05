-- Add plan field to user_buyers table
-- This field will store the user's pricing plan with options: free, pro, a-la-carte, suite

-- Create enum type for plan options
CREATE TYPE buyer_plan AS ENUM ('free', 'pro', 'a-la-carte', 'suite');

-- Add plan column to user_buyers table with default 'free'
ALTER TABLE public.user_buyers 
ADD COLUMN plan buyer_plan NOT NULL DEFAULT 'free';

-- Create index for better performance when querying by plan
CREATE INDEX user_buyers_plan_idx ON public.user_buyers(plan);

-- Add comment for documentation
COMMENT ON COLUMN public.user_buyers.plan IS 'Pricing plan for the buyer: free, pro, a-la-carte, or suite';