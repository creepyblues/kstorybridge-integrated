-- Add newsletter consent columns to user_buyers and user_creators tables
ALTER TABLE user_buyers
  ADD COLUMN IF NOT EXISTS newsletter_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_consented_at timestamptz;

ALTER TABLE user_creators
  ADD COLUMN IF NOT EXISTS newsletter_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_consented_at timestamptz;
