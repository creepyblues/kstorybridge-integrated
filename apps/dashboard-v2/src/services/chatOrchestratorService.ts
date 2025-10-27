import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  titles?: any[];
  suggestedQueries?: string[];
  conversationId?: string;
}

/**
 * Chat Orchestrator Service
 * Wraps the chat-orchestrator edge function
 * Implements AI chatbot (Jinu) with vector search and GPT-4
 */
export const chatOrchestratorService = {
  /**
   * Send a message to the chatbot
   * @param query User's message
   * @param conversationHistory Previous messages (optional)
   * @param userId User ID for personalization (optional)
   */
  async sendMessage(
    query: string,
    conversationHistory: ChatMessage[] = [],
    userId?: string
  ): Promise<ChatResponse> {
    try {
      console.log('🤖 Sending message to chatbot', { query, historyLength: conversationHistory.length });

      const { data, error } = await supabase.functions.invoke('chat-orchestrator', {
        body: {
          query,
          conversation_history: conversationHistory,
          user_id: userId,
        },
      });

      if (error) {
        console.error('❌ Chat orchestrator error', error);
        throw new Error(`Chatbot error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from chatbot');
      }

      console.log('✅ Chatbot response received', {
        responseLength: data.response?.length || 0,
        titleCount: data.titles?.length || 0,
        suggestedQueries: data.suggested_queries?.length || 0,
      });

      return {
        response: data.response || '',
        titles: data.titles || [],
        suggestedQueries: data.suggested_queries || [],
        conversationId: data.conversation_id,
      };
    } catch (error: any) {
      console.error('❌ Chat service error', error);
      throw error;
    }
  },

  /**
   * Get suggested queries for empty state
   */
  getSuggestedQueries(): string[] {
    return [
      "Show me romance webtoons with strong female leads",
      "I'm looking for action stories with great art",
      "What are some popular fantasy web novels?",
      "Find me stories similar to Solo Leveling",
      "Show me completed series with high ratings",
    ];
  },

  /**
   * Format title for display in chat
   */
  formatTitleForChat(title: any) {
    return {
      id: title.title_id,
      nameEn: title.title_name_en || title.title_name_kr,
      nameKr: title.title_name_kr,
      genre: title.genre,
      format: title.content_format,
      views: title.views,
      rating: title.rating,
      image: title.title_image,
      hasPitch: !!title.pitch,
      similarity: title.similarity_score || title.similarity,
    };
  },
};
