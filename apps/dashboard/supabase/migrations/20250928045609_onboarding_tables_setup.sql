-- KStoryBridge Onboarding System Migration
-- Creates missing tables for PRD 2.1 onboarding functionality
-- Date: 2025-01-27

-- =============================================
-- 1. USER_ONBOARDING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_started_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    current_step INTEGER DEFAULT 1,
    skipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_email ON user_onboarding(user_email);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(onboarding_completed);

-- RLS policies
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own onboarding status"
ON user_onboarding FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can update their own onboarding progress"
ON user_onboarding FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Service role can insert onboarding records"
ON user_onboarding FOR INSERT
WITH CHECK (true);

-- =============================================
-- 2. EMAIL_LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email deduplication
CREATE INDEX IF NOT EXISTS idx_email_logs_user_email ON email_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_dedup ON email_logs(user_email, email_type, date_trunc('day', sent_at));

-- RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can insert email logs"
ON email_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role can read email logs"
ON email_logs FOR SELECT
USING (true);

-- =============================================
-- 3. UPDATE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at
    BEFORE UPDATE ON user_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();