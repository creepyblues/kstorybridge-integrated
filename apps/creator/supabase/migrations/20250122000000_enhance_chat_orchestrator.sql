-- Enhancement for AI Chat Orchestrator
-- Adds conversation context storage and helper functions

-- Add messages JSONB column to chat_sessions for conversation context
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on messages queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_messages ON chat_sessions USING gin(messages);

-- Function to get recent messages with context for a user
CREATE OR REPLACE FUNCTION get_recent_messages(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  user_email TEXT,
  session_type TEXT,
  messages JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.user_id,
    cs.user_email,
    cs.session_type,
    cs.messages,
    cs.started_at,
    cs.updated_at
  FROM chat_sessions cs
  WHERE cs.user_id = p_user_id
    AND cs.ended_at IS NULL  -- Only active sessions
  ORDER BY cs.updated_at DESC
  LIMIT 1; -- Get the most recent active session
END;
$$;

-- Function to update conversation context in session
CREATE OR REPLACE FUNCTION update_session_messages(
  p_session_id UUID,
  p_messages JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE chat_sessions
  SET
    messages = p_messages,
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$$;

-- Function to append a single message to session context
CREATE OR REPLACE FUNCTION append_session_message(
  p_session_id UUID,
  p_message JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE chat_sessions
  SET
    messages = COALESCE(messages, '[]'::jsonb) || p_message::jsonb,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Keep only last 30 messages for performance
  UPDATE chat_sessions
  SET messages = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(messages) elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 30
    ) recent_messages
  )
  WHERE id = p_session_id
    AND jsonb_array_length(messages) > 30;

  RETURN FOUND;
END;
$$;

-- Function to get conversation history with title data
CREATE OR REPLACE FUNCTION get_conversation_with_titles(
  p_session_id UUID
)
RETURNS TABLE (
  message_id UUID,
  message_type TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  titles JSONB,
  suggested_queries JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id as message_id,
    cm.message_type,
    cm.content,
    cm.created_at,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'title_id', ctr.title_id,
          'title_name_en', ctr.title_name_en,
          'title_name_kr', ctr.title_name_kr,
          'recommendation_score', ctr.recommendation_score,
          'recommendation_reason', ctr.recommendation_reason
        )
      ) FILTER (WHERE ctr.title_id IS NOT NULL),
      '[]'::jsonb
    ) as titles,
    COALESCE(
      jsonb_agg(
        DISTINCT cqr.suggested_query
      ) FILTER (WHERE cqr.suggested_query IS NOT NULL),
      '[]'::jsonb
    ) as suggested_queries
  FROM chat_messages cm
  LEFT JOIN chat_title_recommendations ctr ON cm.id = ctr.message_id
  LEFT JOIN chat_suggested_queries cqr ON cm.id = cqr.message_id
  WHERE cm.session_id = p_session_id
  GROUP BY cm.id, cm.message_type, cm.content, cm.created_at
  ORDER BY cm.created_at ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_recent_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_messages(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION append_session_message(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_with_titles(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_recent_messages IS 'Retrieves the most recent active chat session with message context for a user';
COMMENT ON FUNCTION update_session_messages IS 'Updates the complete message context for a chat session';
COMMENT ON FUNCTION append_session_message IS 'Appends a single message to session context, maintaining 30 message limit';
COMMENT ON FUNCTION get_conversation_with_titles IS 'Gets conversation history with associated title recommendations and suggested queries';

COMMENT ON COLUMN chat_sessions.messages IS 'JSONB array storing conversation context (last 30 messages) for efficient retrieval';