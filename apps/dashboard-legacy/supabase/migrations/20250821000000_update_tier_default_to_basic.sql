-- Migration: Update default tier from 'invited' to 'basic'
-- Date: 2025-08-21
-- Description: Change the default tier for new user_buyers from 'invited' to 'basic'

-- Update the default value of the tier column to 'basic'
ALTER TABLE user_buyers 
ALTER COLUMN tier SET DEFAULT 'basic';

-- Update the column comment to reflect the new default
COMMENT ON COLUMN user_buyers.tier IS 'User tier: basic (default, standard access), invited (waiting approval), pro (premium features), suite (full access)';