import { supabase } from '@/integrations/supabase/client';

export interface ChatSession {
  id: string;
  user_id: string;
  user_email: string;
  session_type: 'openai' | 'traditional';
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user_prompt' | 'ai_response';
  content: string;
  tokens_used?: number;
  response_time_ms?: number;
  created_at: string;
}

export interface ChatTitleRecommendation {
  id: string;
  message_id: string;
  session_id: string;
  title_id: string;
  title_name_en?: string | null;
  title_name_kr?: string | null;
  recommendation_score?: number;
  recommendation_reason?: string | null;
  created_at: string;
}

export interface ChatInteraction {
  id: string;
  session_id: string;
  user_id: string;
  interaction_type: 'title_click' | 'suggestion_click' | 'title_view' | 'session_end';
  target_id?: string | null;
  target_title?: string | null;
  metadata?: any;
  created_at: string;
}

export interface ChatSuggestedQuery {
  id: string;
  message_id: string;
  session_id: string;
  suggested_query: string;
  query_position: number;
  clicked: boolean;
  created_at: string;
}

export interface CreateSessionData {
  user_id: string;
  user_email: string;
  session_type: 'openai' | 'traditional';
}

export interface CreateMessageData {
  session_id: string;
  user_id: string;
  message_type: 'user_prompt' | 'ai_response';
  content: string;
  tokens_used?: number;
  response_time_ms?: number;
}

export interface CreateRecommendationData {
  message_id: string;
  session_id: string;
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  recommendation_score?: number;
  recommendation_reason?: string;
}

export interface CreateInteractionData {
  session_id: string;
  user_id: string;
  interaction_type: 'title_click' | 'suggestion_click' | 'title_view' | 'session_end';
  target_id?: string;
  target_title?: string;
  metadata?: any;
}

export interface CreateSuggestedQueryData {
  message_id: string;
  session_id: string;
  suggested_query: string;
  query_position: number;
}

class ChatHistoryService {
  
  // Session Management
  async createSession(data: CreateSessionData): Promise<ChatSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: data.user_id,
          user_email: data.user_email,
          session_type: data.session_type,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Exception creating chat session:', error);
      return null;
    }
  }

  async endSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending chat session:', error);
        return false;
      }

      // Also record session end interaction
      await this.recordInteraction({
        session_id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        interaction_type: 'session_end',
        metadata: { ended_at: new Date().toISOString() }
      });

      return true;
    } catch (error) {
      console.error('Exception ending chat session:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching chat session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Exception fetching chat session:', error);
      return null;
    }
  }

  async getUserSessions(userId: string, limit: number = 50): Promise<ChatSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Exception fetching user sessions:', error);
      return [];
    }
  }

  // Message Management
  async recordMessage(data: CreateMessageData): Promise<ChatMessage | null> {
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: data.session_id,
          user_id: data.user_id,
          message_type: data.message_type,
          content: data.content,
          tokens_used: data.tokens_used || 0,
          response_time_ms: data.response_time_ms || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording chat message:', error);
        return null;
      }

      return message;
    } catch (error) {
      console.error('Exception recording chat message:', error);
      return null;
    }
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      // Clean up messages older than 24 hours
      await this.cleanupOldMessages(sessionId);

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Exception fetching session messages:', error);
      return [];
    }
  }

  // Get recommendations for a specific message
  async getMessageRecommendations(messageId: string): Promise<ChatTitleRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_title_recommendations')
        .select('*')
        .eq('message_id', messageId)
        .order('recommendation_score', { ascending: false });

      if (error) {
        console.error('Error fetching message recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching message recommendations:', error);
      return [];
    }
  }

  // Get suggested queries for a specific message
  async getMessageSuggestedQueries(messageId: string): Promise<ChatSuggestedQuery[]> {
    try {
      const { data, error } = await supabase
        .from('chat_suggested_queries')
        .select('*')
        .eq('message_id', messageId)
        .order('query_position', { ascending: true });

      if (error) {
        console.error('Error fetching suggested queries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching suggested queries:', error);
      return [];
    }
  }

  // Get messages with their related recommendations and suggested queries
  async getSessionMessagesWithData(sessionId: string): Promise<any[]> {
    try {
      // Clean up messages older than 24 hours
      await this.cleanupOldMessages(sessionId);

      const messages = await this.getSessionMessages(sessionId);
      
      // Enhance messages with related data
      const enhancedMessages = await Promise.all(
        messages.map(async (message) => {
          const baseMessage = {
            id: message.id,
            content: message.content,
            sender: message.message_type === 'user_prompt' ? 'user' : 'bot',
            timestamp: new Date(message.created_at),
            messageId: message.id
          };

          // Only add related data for bot messages
          if (message.message_type === 'ai_response') {
            const [recommendations, suggestedQueries] = await Promise.all([
              this.getMessageRecommendations(message.id),
              this.getMessageSuggestedQueries(message.id)
            ]);

            // For recommendations, we need to fetch full title data
            let fullTitles = undefined;
            if (recommendations.length > 0) {
              const { titlesService } = await import('./titlesService');
              const titlePromises = recommendations.map(async (rec) => {
                try {
                  const fullTitle = await titlesService.getTitleById(rec.title_id);
                  return fullTitle ? {
                    ...fullTitle,
                    score: rec.recommendation_score || 0
                  } : null;
                } catch (error) {
                  console.warn(`Failed to fetch title ${rec.title_id}:`, error);
                  return {
                    title_id: rec.title_id,
                    title_name_en: rec.title_name_en,
                    title_name_kr: rec.title_name_kr,
                    score: rec.recommendation_score || 0
                  };
                }
              });
              
              const resolvedTitles = await Promise.all(titlePromises);
              fullTitles = resolvedTitles.filter(title => title !== null);
            }

            return {
              ...baseMessage,
              titles: fullTitles,
              suggestedQueries: suggestedQueries.length > 0 ? suggestedQueries.map(sq => sq.suggested_query) : undefined
            };
          }

          return baseMessage;
        })
      );

      return enhancedMessages;
    } catch (error) {
      console.error('Exception fetching enhanced session messages:', error);
      return [];
    }
  }

  // Clean up messages older than 24 hours
  async cleanupOldMessages(sessionId: string): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Delete old messages (this will cascade to related recommendations and queries)
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .lt('created_at', twentyFourHoursAgo.toISOString());

      if (error) {
        console.error('Error cleaning up old messages:', error);
      } else {
        console.log('🧹 Cleaned up messages older than 24 hours');
      }
    } catch (error) {
      console.error('Exception cleaning up old messages:', error);
    }
  }

  // Title Recommendations
  async recordRecommendations(recommendations: CreateRecommendationData[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_title_recommendations')
        .insert(recommendations.map(rec => ({
          message_id: rec.message_id,
          session_id: rec.session_id,
          title_id: rec.title_id,
          title_name_en: rec.title_name_en,
          title_name_kr: rec.title_name_kr,
          recommendation_score: rec.recommendation_score || 0,
          recommendation_reason: rec.recommendation_reason,
        })));

      if (error) {
        console.error('Error recording title recommendations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception recording title recommendations:', error);
      return false;
    }
  }

  // Interactions (clicks, views, etc.)
  async recordInteraction(data: CreateInteractionData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_interactions')
        .insert({
          session_id: data.session_id,
          user_id: data.user_id,
          interaction_type: data.interaction_type,
          target_id: data.target_id,
          target_title: data.target_title,
          metadata: data.metadata || {},
        });

      if (error) {
        console.error('Error recording chat interaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception recording chat interaction:', error);
      return false;
    }
  }

  async getSessionInteractions(sessionId: string): Promise<ChatInteraction[]> {
    try {
      const { data: interactions, error } = await supabase
        .from('chat_interactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session interactions:', error);
        return [];
      }

      return interactions || [];
    } catch (error) {
      console.error('Exception fetching session interactions:', error);
      return [];
    }
  }

  // Suggested Queries
  async recordSuggestedQueries(queries: CreateSuggestedQueryData[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_suggested_queries')
        .insert(queries.map(query => ({
          message_id: query.message_id,
          session_id: query.session_id,
          suggested_query: query.suggested_query,
          query_position: query.query_position,
          clicked: false,
        })));

      if (error) {
        console.error('Error recording suggested queries:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception recording suggested queries:', error);
      return false;
    }
  }

  async markQueryAsClicked(messageId: string, suggestedQuery: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_suggested_queries')
        .update({ clicked: true })
        .eq('message_id', messageId)
        .eq('suggested_query', suggestedQuery);

      if (error) {
        console.error('Error marking query as clicked:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking query as clicked:', error);
      return false;
    }
  }

  // Analytics and Reporting
  async getUserChatStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalTitleClicks: number;
    averageSessionLength: number;
    mostRecommendedTitles: { title_id: string; title_name_en?: string; count: number }[];
  }> {
    try {
      // Get basic counts
      const [sessionsResult, messagesResult, interactionsResult, recommendationsResult] = await Promise.all([
        supabase.from('chat_sessions').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('chat_interactions').select('id', { count: 'exact' }).eq('user_id', userId).eq('interaction_type', 'title_click'),
        supabase.from('chat_title_recommendations')
          .select('title_id, title_name_en')
          .eq('session_id', userId) // This needs to be fixed to use sessions
      ]);

      // Get most recommended titles (this is a simplified version)
      const { data: topTitles } = await supabase
        .from('chat_title_recommendations')
        .select('title_id, title_name_en')
        .limit(5);

      return {
        totalSessions: sessionsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalTitleClicks: interactionsResult.count || 0,
        averageSessionLength: 0, // Would need to calculate from session durations
        mostRecommendedTitles: topTitles?.map((title, idx) => ({
          title_id: title.title_id,
          title_name_en: title.title_name_en,
          count: 5 - idx // Simplified count
        })) || []
      };
    } catch (error) {
      console.error('Exception getting user chat stats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalTitleClicks: 0,
        averageSessionLength: 0,
        mostRecommendedTitles: []
      };
    }
  }

  // Utility methods
  async getActiveSession(userId: string, sessionType: 'openai' | 'traditional'): Promise<ChatSession | null> {
    try {
      // Find the most recent session that hasn't been ended
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_type', sessionType)
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching active session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Exception fetching active session:', error);
      return null;
    }
  }

  async cleanupOldSessions(daysToKeep: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old sessions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception cleaning up old sessions:', error);
      return false;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();