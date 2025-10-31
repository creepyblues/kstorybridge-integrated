-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'openai', -- 'openai' or 'traditional'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user_prompt', 'ai_response')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0, -- For OpenAI usage tracking
  response_time_ms INTEGER DEFAULT 0, -- AI response time
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat title recommendations table
CREATE TABLE IF NOT EXISTS chat_title_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  title_id TEXT NOT NULL, -- References titles.title_id
  title_name_en TEXT,
  title_name_kr TEXT,
  recommendation_score FLOAT DEFAULT 0,
  recommendation_reason TEXT, -- Why this was recommended
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat interactions table (for clicks, etc.)
CREATE TABLE IF NOT EXISTS chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('title_click', 'suggestion_click', 'title_view', 'session_end')),
  target_id TEXT, -- title_id for title_click, query text for suggestion_click
  target_title TEXT, -- title name for better readability
  metadata JSONB DEFAULT '{}', -- Additional data like clicked position, search query, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat suggested queries table
CREATE TABLE IF NOT EXISTS chat_suggested_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  suggested_query TEXT NOT NULL,
  query_position INTEGER DEFAULT 0, -- Order in the suggestion list
  clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_email ON chat_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_title_recommendations_message_id ON chat_title_recommendations(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_title_recommendations_session_id ON chat_title_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_title_recommendations_title_id ON chat_title_recommendations(title_id);

CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_type ON chat_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_created_at ON chat_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_suggested_queries_message_id ON chat_suggested_queries(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_suggested_queries_session_id ON chat_suggested_queries(session_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_title_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_suggested_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own chat data
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own title recommendations" ON chat_title_recommendations
  FOR SELECT USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own title recommendations" ON chat_title_recommendations
  FOR INSERT WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own chat interactions" ON chat_interactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat interactions" ON chat_interactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own suggested queries" ON chat_suggested_queries
  FOR SELECT USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own suggested queries" ON chat_suggested_queries
  FOR INSERT WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own suggested queries" ON chat_suggested_queries
  FOR UPDATE USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores chat session information for both OpenAI and traditional chatbots';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE chat_title_recommendations IS 'Stores titles recommended by AI in responses';
COMMENT ON TABLE chat_interactions IS 'Stores user interactions like title clicks, suggestion clicks';
COMMENT ON TABLE chat_suggested_queries IS 'Stores AI-suggested follow-up queries';

COMMENT ON COLUMN chat_sessions.session_type IS 'Type of chatbot: openai or traditional';
COMMENT ON COLUMN chat_messages.message_type IS 'Either user_prompt or ai_response';
COMMENT ON COLUMN chat_messages.tokens_used IS 'OpenAI tokens consumed for this message';
COMMENT ON COLUMN chat_interactions.interaction_type IS 'Type of interaction: title_click, suggestion_click, title_view, session_end';
COMMENT ON COLUMN chat_interactions.metadata IS 'Additional interaction data in JSON format';