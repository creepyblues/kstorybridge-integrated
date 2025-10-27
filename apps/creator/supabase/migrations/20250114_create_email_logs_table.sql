-- Create email_logs table for tracking and preventing duplicate emails
-- This table helps prevent the same email being sent multiple times to users

CREATE TABLE IF NOT EXISTS email_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'welcome', 'verification_reminder', 'password_reset', etc.
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  message_id TEXT, -- ID from email provider (Resend)
  error_message TEXT, -- Error details if status = 'failed'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user email and email type (main deduplication query)
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type
ON email_logs (user_email, email_type);

-- Index for looking up by status for analytics
CREATE INDEX IF NOT EXISTS idx_email_logs_status
ON email_logs (status);

-- Index for time-based queries (email sending analytics)
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
ON email_logs (sent_at);

-- Composite index for the most common query (check if specific email type was sent to user)
CREATE INDEX IF NOT EXISTS idx_email_logs_dedup_check
ON email_logs (user_email, email_type, status);

-- Add RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own email logs
CREATE POLICY "Users can view their own email logs" ON email_logs
FOR SELECT
TO authenticated
USING (
  auth.email()::TEXT = user_email
);

-- Policy: Service role can insert/update email logs (for the emailService)
CREATE POLICY "Service role can manage email logs" ON email_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can insert email logs (for client-side logging if needed)
CREATE POLICY "Authenticated users can insert email logs" ON email_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.email()::TEXT = user_email
);

-- Add helpful comments
COMMENT ON TABLE email_logs IS 'Tracks all email sending attempts for deduplication and analytics';
COMMENT ON COLUMN email_logs.user_email IS 'Email address of the recipient (normalized to lowercase)';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: welcome, verification_reminder, password_reset, etc.';
COMMENT ON COLUMN email_logs.status IS 'Whether the email was successfully sent or failed';
COMMENT ON COLUMN email_logs.message_id IS 'Unique message ID from the email provider (Resend)';
COMMENT ON COLUMN email_logs.error_message IS 'Error details if the email failed to send';
COMMENT ON COLUMN email_logs.sent_at IS 'When the email was sent (or attempted)';