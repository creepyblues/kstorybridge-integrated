-- Migration: Add tier system to user_buyers table
-- Date: 2025-08-10
-- Description: Upgrade buyer user tier system

-- Step 1: Create enum type for tier values
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');

-- Step 2: Add new tier column with enum type to user_buyers table
ALTER TABLE user_buyers ADD COLUMN tier user_tier DEFAULT 'invited';

-- Step 3: Add invitation_status column temporarily to track current status
-- (This assumes there might be some business logic that sets user status)
ALTER TABLE user_buyers ADD COLUMN invitation_status TEXT DEFAULT 'invited';

-- Step 4: Update existing users to basic tier (assuming they're already accepted)
-- All existing user_buyers records are considered 'basic' since they already have access
UPDATE user_buyers 
SET tier = 'basic', invitation_status = 'accepted'
WHERE tier IS NULL OR tier = 'invited';

-- Step 5: Add comment for documentation
COMMENT ON COLUMN user_buyers.tier IS 'User tier: invited (waiting approval), basic (standard access), pro (premium features), suite (full access)';

-- Step 6: Add index for tier filtering
CREATE INDEX idx_user_buyers_tier ON user_buyers(tier);

-- Step 7: Add index for user_id lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_buyers_user_id ON user_buyers(user_id);