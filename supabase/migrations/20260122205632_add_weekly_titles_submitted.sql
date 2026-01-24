-- Add submitted tracking fields to weekly_titles table
-- This allows tracking when a weekly title has been finalized/submitted

-- Add submitted field with default false
ALTER TABLE weekly_titles
ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE;

-- Add submitted_at timestamp to track when it was submitted
ALTER TABLE weekly_titles
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN weekly_titles.submitted IS 'Whether this weekly title has been submitted/finalized';
COMMENT ON COLUMN weekly_titles.submitted_at IS 'Timestamp when the weekly title was submitted';
