import { supabase } from '@/lib/supabase';
import { debug } from '@/utils/debug';

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
      debug.log('🤖 Sending message to chatbot', { query, historyLength: conversationHistory.length });

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
      debug.log('📦 Raw response received:', text.substring(0, 200));

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
            debug.log('⚠️ Skipping unparseable line:', line.substring(0, 100));
          }
        }
      }

      debug.log('✅ Chatbot response parsed', {
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
   * Returns 5 random prompts from a pool of 50 comprehensive suggestions
   */
  getSuggestedQueries(): string[] {
    const allPrompts = [
      // Genre-specific searches
      "Show me romance webtoons with strong female leads",
      "I'm looking for action stories with great art",
      "What are some popular fantasy web novels?",
      "Find me psychological thriller webtoons",
      "Show me slice-of-life stories with heartwarming moments",
      "I want dark fantasy with complex worldbuilding",
      "Find horror webtoons with unique art styles",
      "Show me comedy webtoons that are actually funny",
      "I'm looking for sci-fi stories set in space",
      "Find historical dramas with romance elements",

      // Comparison searches
      "Find me stories similar to Solo Leveling",
      "Show me webtoons like Tower of God",
      "I want something similar to Omniscient Reader's Viewpoint",
      "Find stories with vibes like True Beauty",
      "Show me web novels similar to The Legendary Moonlight Sculptor",
      "I'm looking for stories like Remarried Empress",
      "Find action series like The God of High School",
      "Show me romance like What's Wrong with Secretary Kim",
      "I want fantasy like The Beginning After The End",
      "Find stories similar to Lore Olympus",

      // Specific characteristics
      "Show me completed series with high ratings",
      "Find ongoing series with weekly updates",
      "I want stories with overpowered protagonists",
      "Show me webtoons with revenge plots",
      "Find stories with time travel or regression themes",
      "I'm looking for underdog to hero storylines",
      "Show me stories with complex female characters",
      "Find webtoons with found family dynamics",
      "I want stories with enemies-to-lovers romance",
      "Show me series with plot twists and mysteries",

      // Platform and popularity
      "What are the most popular webtoons right now?",
      "Show me top-rated web novels from Korea",
      "Find hidden gems that deserve more attention",
      "What are the best completed series to binge?",
      "Show me award-winning Korean content",
      "Find trending stories on Naver and Kakao",
      "What are the highest-rated romance webtoons?",
      "Show me the best action series available",
      "Find critically acclaimed web novels",
      "What are the most viewed webtoons this year?",

      // Target audience and tone
      "I'm looking for mature, adult-oriented stories",
      "Show me family-friendly webtoons",
      "Find stories with serious, dark themes",
      "I want lighthearted, feel-good content",
      "Show me thought-provoking narratives",
      "Find fast-paced, action-packed stories",
      "I'm looking for slow-burn character development",
      "Show me epic fantasy with multiple storylines",
      "Find short, binge-worthy series under 100 chapters",
      "I want long-running series with deep lore",
    ];

    // Fisher-Yates shuffle algorithm for true randomization
    const shuffled = [...allPrompts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Return first 5 from shuffled array
    return shuffled.slice(0, 5);
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
