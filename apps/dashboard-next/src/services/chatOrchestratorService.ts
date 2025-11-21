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

      // Get current session with auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ No active session', sessionError);
        throw new Error('Please sign in to use the chatbot');
      }

      // Combine conversation history with new query into messages array
      const messages: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: query }
      ];

      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL not configured');
      }

      // Use fetch with explicit Authorization header (like dashboard V1)
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // ✅ Explicit auth token
        },
        body: JSON.stringify({
          messages,
          userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat orchestrator error', { status: response.status, error: errorText });
        throw new Error(`Chatbot error: ${response.statusText || 'Unknown error'}`);
      }

      // Parse SSE streaming response
      const text = await response.text();
      console.log('📦 Raw response received:', text.substring(0, 200));

      let fullResponse = '';
      let titles: any[] = [];
      let suggestedQueries: string[] = [];
      let conversationId: string | undefined;

      // Parse SSE format: "data: {...}\n\n"
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const data = JSON.parse(jsonStr);

            if (data.type === 'text') {
              fullResponse += data.text;
            } else if (data.type === 'titles') {
              titles = data.titles || [];
            } else if (data.type === 'suggestions' || data.type === 'suggested_queries') {
              suggestedQueries = data.suggestedQueries || data.suggested_queries || [];
            } else if (data.type === 'complete') {
              conversationId = data.conversationId;
            }
          } catch (parseError) {
            console.log('⚠️ Skipping unparseable line:', line.substring(0, 100));
          }
        }
      }

      console.log('✅ Chatbot response parsed', {
        responseLength: fullResponse.length,
        titleCount: titles.length,
        suggestedQueriesCount: suggestedQueries.length,
      });

      return {
        response: fullResponse,
        titles,
        suggestedQueries,
        conversationId,
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
