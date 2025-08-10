-- Migration: Rename invitation_status to tier and update values
-- Date: 2025-08-10
-- Description: Upgrade buyer user tier system

-- Step 1: Create enum type for tier values
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');

-- Step 2: Add new tier column with enum type
ALTER TABLE profiles ADD COLUMN tier user_tier;

-- Step 3: Migrate existing data
-- Convert 'accepted' to 'basic', keep 'invited' as 'invited'
UPDATE profiles 
SET tier = CASE 
  WHEN invitation_status = 'accepted' THEN 'basic'::user_tier
  WHEN invitation_status = 'invited' THEN 'invited'::user_tier
  ELSE NULL
END;

-- Step 4: Drop old invitation_status column
ALTER TABLE profiles DROP COLUMN invitation_status;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN profiles.tier IS 'User tier: invited (waiting approval), basic (standard access), pro (premium features), suite (full access)';

-- Step 6: Add index for tier filtering
CREATE INDEX idx_profiles_tier ON profiles(tier);