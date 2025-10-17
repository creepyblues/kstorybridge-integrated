-- Add DELETE policies for chat tables to allow users to delete their own data
-- Required for A/B testing cleanup and user privacy controls

-- Allow users to delete their own chat sessions
-- CASCADE will automatically delete related chat_messages, chat_title_recommendations,
-- chat_interactions, and chat_suggested_queries
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Allow users to delete their own chat messages (if needed independently)
CREATE POLICY "Users can delete their own chat messages" ON chat_messages
  FOR DELETE USING (user_id = auth.uid());

-- Allow users to delete their own chat interactions
CREATE POLICY "Users can delete their own chat interactions" ON chat_interactions
  FOR DELETE USING (user_id = auth.uid());

-- Comments for documentation
COMMENT ON POLICY "Users can delete their own chat sessions" ON chat_sessions IS
  'Allows users to delete their own chat sessions. CASCADE will automatically delete related messages, recommendations, interactions, and suggested queries.';

COMMENT ON POLICY "Users can delete their own chat messages" ON chat_messages IS
  'Allows users to delete individual chat messages if needed.';

COMMENT ON POLICY "Users can delete their own chat interactions" ON chat_interactions IS
  'Allows users to delete their own interaction records.';
