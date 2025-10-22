-- Migration: Drop invitation_status column from user_buyers table
-- Date: 2025-08-10
-- Description: Remove invitation_status field since tier field now handles user status

-- Step 1: Drop the index on invitation_status (if it exists)
DROP INDEX IF EXISTS user_buyers_invitation_status_idx;

-- Step 2: Drop the invitation_status column
ALTER TABLE user_buyers DROP COLUMN IF EXISTS invitation_status;

-- Step 3: Add comment documenting the change
COMMENT ON TABLE user_buyers IS 'Buyer user profiles - invitation_status removed in favor of tier system';

-- Verification query (can be commented out in production)
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_buyers' AND table_schema = 'public'
-- ORDER BY column_name;