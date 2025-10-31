-- Create chat_message_feedback table for collecting user feedback on chatbot responses
CREATE TABLE IF NOT EXISTS chat_message_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Overall rating (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Predefined quality assessments
    response_quality VARCHAR(20) NOT NULL CHECK (response_quality IN ('excellent', 'good', 'fair', 'poor')),
    title_relevance VARCHAR(20) NOT NULL CHECK (title_relevance IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Detailed feedback data (JSON)
    title_feedback JSONB, -- Individual title feedback with relevance scores and notes
    
    -- Text feedback
    general_feedback TEXT,
    suggested_improvements TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_message_id ON chat_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_session_id ON chat_message_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_user_id ON chat_message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_created_at ON chat_message_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_overall_rating ON chat_message_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_response_quality ON chat_message_feedback(response_quality);
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_title_relevance ON chat_message_feedback(title_relevance);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only insert feedback for their own messages
CREATE POLICY "Users can insert their own feedback" ON chat_message_feedback
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_messages cm 
            WHERE cm.id = message_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON chat_message_feedback
    FOR SELECT 
    USING (user_id = auth.uid());

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback" ON chat_message_feedback
    FOR UPDATE 
    USING (user_id = auth.uid());

-- Admin users can view all feedback (update with actual admin emails)
CREATE POLICY "Admins can view all feedback" ON chat_message_feedback
    FOR SELECT 
    USING (
        auth.jwt() ->> 'email' IN ('sungho@dadble.com', 'kevin@sandstoneartists.com')
    );

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_message_feedback_updated_at 
    BEFORE UPDATE ON chat_message_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy feedback analysis with related data
CREATE OR REPLACE VIEW feedback_analysis AS
SELECT 
    f.*,
    cm.content as message_content,
    cm.message_type,
    cm.tokens_used,
    cm.response_time_ms,
    cs.session_type,
    cs.started_at as session_started,
    
    -- Calculate title feedback stats
    CASE 
        WHEN f.title_feedback IS NOT NULL 
        THEN jsonb_array_length(f.title_feedback)
        ELSE 0 
    END as title_count,
    
    CASE 
        WHEN f.title_feedback IS NOT NULL 
        THEN (
            SELECT AVG((title->>'relevance_score')::numeric) 
            FROM jsonb_array_elements(f.title_feedback) as title
        )
        ELSE NULL 
    END as avg_title_relevance_score

FROM chat_message_feedback f
JOIN chat_messages cm ON f.message_id = cm.id
JOIN chat_sessions cs ON f.session_id = cs.id
ORDER BY f.created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON feedback_analysis TO authenticated;
GRANT ALL ON chat_message_feedback TO authenticated;

-- Insert some sample data for testing (optional - remove in production)
/*
INSERT INTO chat_message_feedback (
    message_id, 
    session_id, 
    user_id, 
    overall_rating, 
    response_quality, 
    title_relevance,
    title_feedback,
    general_feedback,
    suggested_improvements
) VALUES (
    -- Replace with actual UUIDs from your chat_messages table
    (SELECT id FROM chat_messages LIMIT 1),
    (SELECT session_id FROM chat_messages LIMIT 1),
    (SELECT user_id FROM chat_messages LIMIT 1),
    4,
    'good',
    'excellent',
    '[{"title_id": "sample123", "title_name": "Sample Title", "is_relevant": true, "relevance_score": 4, "feedback_note": "Great recommendation!"}]'::jsonb,
    'The response was helpful and comprehensive.',
    'Could provide more diverse genre options.'
);
*/