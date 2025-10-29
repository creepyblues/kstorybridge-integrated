-- Add account_type columns to user_buyers and user_creators tables
-- Date: 2025-09-21 00:00:00
-- Purpose: Store account_type in database tables to eliminate OAuth metadata dependency

-- Add account_type column to user_buyers table
ALTER TABLE public.user_buyers
ADD COLUMN account_type public.account_type DEFAULT 'buyer'::public.account_type NOT NULL;

-- Add account_type column to user_creators table
ALTER TABLE public.user_creators
ADD COLUMN account_type public.account_type DEFAULT 'creator'::public.account_type NOT NULL;

-- Update existing records to have correct account_type values
UPDATE public.user_buyers SET account_type = 'buyer' WHERE account_type IS NULL;
UPDATE public.user_creators SET account_type = 'creator' WHERE account_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_buyers.account_type
IS 'Account type stored in database - eliminates need for metadata lookup';

COMMENT ON COLUMN public.user_creators.account_type
IS 'Account type stored in database - eliminates need for metadata lookup';

-- Add indexes for performance (account_type will be queried frequently)
CREATE INDEX IF NOT EXISTS idx_user_buyers_account_type ON public.user_buyers(account_type);
CREATE INDEX IF NOT EXISTS idx_user_creators_account_type ON public.user_creators(account_type);

-- Verification queries (commented out - for manual testing)
-- SELECT account_type, COUNT(*) FROM public.user_buyers GROUP BY account_type;
-- SELECT account_type, COUNT(*) FROM public.user_creators GROUP BY account_type;