-- Fix RLS Policies for User Profile Creation
-- Run these SQL commands in Supabase SQL Editor

-- Enable RLS on user_buyers table (if not already enabled)
ALTER TABLE user_buyers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own buyer profile" ON user_buyers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to select their own profile
CREATE POLICY "Users can view their own buyer profile" ON user_buyers
    FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own buyer profile" ON user_buyers
    FOR UPDATE USING (auth.uid() = id);

-- Similar policies for user_creators table
ALTER TABLE user_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own creator profile" ON user_creators
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own creator profile" ON user_creators
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own creator profile" ON user_creators
    FOR UPDATE USING (auth.uid() = id);