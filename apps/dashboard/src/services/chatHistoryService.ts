import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TitleRow = Database['public']['Tables']['titles']['Row'];

export interface ChatSession {
  id: string;
  user_id: string;
  user_email: string;
  session_type: 'openai' | 'traditional';
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
  messages?: any[]; // JSONB conversation context
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
  metadata?: Record<string, unknown>;
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

export interface ChatMessageFeedback {
  id: string;
  message_id: string;
  session_id: string;
  user_id: string;
  overall_rating: number;
  response_quality: 'excellent' | 'good' | 'fair' | 'poor';
  title_relevance: 'excellent' | 'good' | 'fair' | 'poor';
  title_feedback: Record<string, unknown>; // JSON field
  general_feedback?: string;
  suggested_improvements?: string;
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
  metadata?: Record<string, unknown>;
}

export interface CreateSuggestedQueryData {
  message_id: string;
  session_id: string;
  suggested_query: string;
  query_position: number;
}

class ChatHistoryService {
  // Session expiry constant: 24 hours
  private readonly SESSION_EXPIRY_HOURS = 24;

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

  // Get messages with their related recommendations and suggested queries (OPTIMIZED)
  async getSessionMessagesWithData(sessionId: string): Promise<(ChatMessage & {
    recommendations: (ChatTitleRecommendation & { title?: TitleRow })[],
    suggested_queries: string[]
  })[]> {
    try {
      // Clean up messages older than 24 hours
      await this.cleanupOldMessages(sessionId);

      const messages = await this.getSessionMessages(sessionId);
      
      if (messages.length === 0) {
        return [];
      }

      // Extract all message IDs for batch queries
      const messageIds = messages.map(msg => msg.id);
      
      // Batch fetch all recommendations and suggested queries in parallel
      const [allRecommendations, allSuggestedQueries] = await Promise.all([
        // Get all recommendations for all messages in one query
        supabase
          .from('chat_title_recommendations')
          .select('*')
          .in('message_id', messageIds)
          .order('recommendation_score', { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error batch fetching recommendations:', error);
              return [];
            }
            return data || [];
          }),
        
        // Get all suggested queries for all messages in one query  
        supabase
          .from('chat_suggested_queries')
          .select('*')
          .in('message_id', messageIds)
          .order('query_position', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error batch fetching suggested queries:', error);
              return [];
            }
            return data || [];
          })
      ]);

      // Extract unique title IDs and batch fetch all titles
      const uniqueTitleIds = [...new Set(allRecommendations.map(rec => rec.title_id))];
      let titleLookup: Record<string, TitleRow> = {};
      
      if (uniqueTitleIds.length > 0) {
        const { titlesService } = await import('./titlesService');
        const { data: titles, error } = await supabase
          .from('titles')
          .select('*')
          .in('title_id', uniqueTitleIds);
          
        if (!error && titles) {
          // Create lookup map for O(1) title access
          titleLookup = titles.reduce((acc, title) => {
            acc[title.title_id] = title;
            return acc;
          }, {} as Record<string, TitleRow>);
        }
      }

      // Group recommendations and queries by message ID for O(1) lookup
      const recsByMessageId: Record<string, (ChatTitleRecommendation & { title?: TitleRow })[]> = {};
      const queriesByMessageId: Record<string, string[]> = {};
      
      allRecommendations.forEach(rec => {
        if (!recsByMessageId[rec.message_id]) {
          recsByMessageId[rec.message_id] = [];
        }
        recsByMessageId[rec.message_id].push(rec);
      });
      
      allSuggestedQueries.forEach(query => {
        if (!queriesByMessageId[query.message_id]) {
          queriesByMessageId[query.message_id] = [];
        }
        queriesByMessageId[query.message_id].push(query.suggested_query);
      });

      // Build enhanced messages with O(1) lookups
      const enhancedMessages = messages.map((message) => {
        const baseMessage = {
          id: message.id,
          content: message.content,
          sender: message.message_type === 'user_prompt' ? 'user' : 'bot',
          timestamp: new Date(message.created_at),
          messageId: message.id
        };

        // Only add related data for bot messages
        if (message.message_type === 'ai_response') {
          const recommendations = recsByMessageId[message.id] || [];
          const suggestedQueries = queriesByMessageId[message.id] || [];

          // Map recommendations to full title data using lookup
          let fullTitles = undefined;
          if (recommendations.length > 0) {
            fullTitles = recommendations
              .map(rec => {
                const fullTitle = titleLookup[rec.title_id];
                return fullTitle ? {
                  ...fullTitle,
                  score: rec.recommendation_score || 0
                } : {
                  title_id: rec.title_id,
                  title_name_en: rec.title_name_en,
                  title_name_kr: rec.title_name_kr,
                  score: rec.recommendation_score || 0
                };
              })
              .filter(Boolean);
          }

          return {
            ...baseMessage,
            titles: fullTitles,
            suggestedQueries: suggestedQueries.length > 0 ? suggestedQueries : undefined
          };
        }

        return baseMessage;
      });

      console.log(`📚 Optimized batch load: ${messages.length} messages, ${allRecommendations.length} recommendations, ${uniqueTitleIds.length} unique titles`);
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

      // If no session found, return null
      if (!session) {
        return null;
      }

      // Check if session is expired (older than SESSION_EXPIRY_HOURS)
      const sessionAge = Date.now() - new Date(session.started_at).getTime();
      const sessionAgeHours = sessionAge / (1000 * 60 * 60);

      if (sessionAgeHours > this.SESSION_EXPIRY_HOURS) {
        console.log(`[SessionExpiry] Session ${session.id} is ${sessionAgeHours.toFixed(1)}h old, expiring it`);

        // End the expired session
        await this.endSession(session.id);

        return null; // Return null so a new session will be created
      }

      console.log(`[SessionValidation] Session ${session.id} is valid (${sessionAgeHours.toFixed(1)}h old)`);
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

  /**
   * Validate if a session is still valid (belongs to user and not expired)
   */
  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        console.log(`[SessionValidation] Session ${sessionId} not found`);
        return false;
      }

      // Check user ownership
      if (session.user_id !== userId) {
        console.log(`[SessionValidation] Session ${sessionId} belongs to different user`);
        return false;
      }

      // Check if session ended
      if (session.ended_at) {
        console.log(`[SessionValidation] Session ${sessionId} already ended`);
        return false;
      }

      // Check session age
      const sessionAge = Date.now() - new Date(session.started_at).getTime();
      const sessionAgeHours = sessionAge / (1000 * 60 * 60);

      if (sessionAgeHours > this.SESSION_EXPIRY_HOURS) {
        console.log(`[SessionValidation] Session ${sessionId} expired (${sessionAgeHours.toFixed(1)}h old)`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception validating session:', error);
      return false;
    }
  }

  /**
   * Invalidate (end) all old sessions for a user
   * Useful for cleanup on login or periodically
   */
  async invalidateOldSessions(userId: string): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.SESSION_EXPIRY_HOURS);

      // Find all active sessions older than expiry threshold
      const { data: oldSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .is('ended_at', null)
        .lt('started_at', cutoffDate.toISOString());

      if (fetchError) {
        console.error('Error fetching old sessions:', fetchError);
        return 0;
      }

      if (!oldSessions || oldSessions.length === 0) {
        return 0;
      }

      // End all old sessions
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ ended_at: new Date().toISOString() })
        .in('id', oldSessions.map(s => s.id));

      if (updateError) {
        console.error('Error invalidating old sessions:', updateError);
        return 0;
      }

      console.log(`[SessionCleanup] Invalidated ${oldSessions.length} expired sessions for user ${userId}`);
      return oldSessions.length;
    } catch (error) {
      console.error('Exception invalidating old sessions:', error);
      return 0;
    }
  }

  // Submit feedback for a message
  async submitMessageFeedback(messageId: string, feedbackData: {
    overall_rating: number;
    response_quality: 'excellent' | 'good' | 'fair' | 'poor';
    title_relevance: 'excellent' | 'good' | 'fair' | 'poor';
    title_feedback: Record<string, unknown>;
    general_feedback?: string;
    suggested_improvements?: string;
  }): Promise<ChatMessageFeedback | null> {
    try {
      // First get the message to extract session_id and user_id
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .select('session_id, user_id')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        console.error('Error fetching message for feedback:', messageError);
        return null;
      }

      const { data, error } = await supabase
        .from('chat_message_feedback')
        .insert([{
          message_id: messageId,
          session_id: message.session_id,
          user_id: message.user_id,
          overall_rating: feedbackData.overall_rating,
          response_quality: feedbackData.response_quality,
          title_relevance: feedbackData.title_relevance,
          title_feedback: feedbackData.title_feedback,
          general_feedback: feedbackData.general_feedback,
          suggested_improvements: feedbackData.suggested_improvements
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting message feedback:', error);
        return null;
      }

      console.log('📝 Message feedback submitted successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Exception submitting message feedback:', error);
      return null;
    }
  }

  // Get feedback for a specific message
  async getMessageFeedback(messageId: string): Promise<ChatMessageFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('chat_message_feedback')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching message feedback:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching message feedback:', error);
      return [];
    }
  }

  // Get all feedback for analysis (admin function)
  async getAllFeedback(limit: number = 100): Promise<(ChatMessageFeedback & {
    chat_messages: {
      content: string;
      message_type: string;
      session_id: string;
      created_at: string;
    } | null;
  })[]> {
    try {
      const { data, error } = await supabase
        .from('chat_message_feedback')
        .select(`
          *,
          chat_messages (
            content,
            message_type,
            session_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all feedback:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching all feedback:', error);
      return [];
    }
  }

  // Get feedback analytics
  async getFeedbackAnalytics(): Promise<{
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    qualityDistribution: Record<string, number>;
    relevanceDistribution: Record<string, number>;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('chat_message_feedback')
        .select('overall_rating, response_quality, title_relevance, created_at');

      if (error) {
        console.error('Error fetching feedback analytics:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          totalFeedbacks: 0,
          averageRating: 0,
          qualityBreakdown: {},
          relevanceBreakdown: {},
          feedbackOverTime: []
        };
      }

      // Calculate analytics
      const totalFeedbacks = data.length;
      const averageRating = data.reduce((sum, f) => sum + f.overall_rating, 0) / totalFeedbacks;
      
      const qualityBreakdown = data.reduce((acc, f) => {
        acc[f.response_quality] = (acc[f.response_quality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const relevanceBreakdown = data.reduce((acc, f) => {
        acc[f.title_relevance] = (acc[f.title_relevance] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by day for trend analysis
      const feedbackOverTime = data.reduce((acc, f) => {
        const date = new Date(f.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalFeedbacks,
        averageRating: Math.round(averageRating * 100) / 100,
        qualityBreakdown,
        relevanceBreakdown,
        feedbackOverTime: Object.entries(feedbackOverTime).map(([date, count]) => ({
          date,
          count
        }))
      };
    } catch (error) {
      console.error('Exception calculating feedback analytics:', error);
      return null;
    }
  }

  // === AI Orchestrator Methods ===

  /**
   * Get recent conversation context for AI orchestrator
   */
  async getRecentMessagesContext(userId: string, limit: number = 15): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase.rpc('get_recent_messages', {
        p_user_id: userId,
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching recent messages context:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Exception fetching recent messages context:', error);
      return null;
    }
  }

  /**
   * Update session conversation context
   */
  async updateSessionMessages(sessionId: string, messages: any[]): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_session_messages', {
        p_session_id: sessionId,
        p_messages: JSON.stringify(messages)
      });

      if (error) {
        console.error('Error updating session messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating session messages:', error);
      return false;
    }
  }

  /**
   * Append a single message to session context
   */
  async appendSessionMessage(sessionId: string, message: any): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('append_session_message', {
        p_session_id: sessionId,
        p_message: JSON.stringify(message)
      });

      if (error) {
        console.error('Error appending session message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception appending session message:', error);
      return false;
    }
  }

  /**
   * Get conversation with all related data for orchestrator
   */
  async getConversationWithTitles(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_with_titles', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Error fetching conversation with titles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching conversation with titles:', error);
      return [];
    }
  }

  /**
   * Get formatted conversation history for LLM context
   */
  async getFormattedConversationHistory(sessionId: string, limit: number = 10): Promise<string[]> {
    try {
      const messages = await this.getConversationWithTitles(sessionId);

      return messages
        .slice(-limit * 2) // Get last N conversation pairs
        .map(msg => {
          const role = msg.message_type === 'user_prompt' ? 'User' : 'Assistant';
          return `${role}: ${msg.content}`;
        });
    } catch (error) {
      console.error('Exception formatting conversation history:', error);
      return [];
    }
  }
}

export const chatHistoryService = new ChatHistoryService();