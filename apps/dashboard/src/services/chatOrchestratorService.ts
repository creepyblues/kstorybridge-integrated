import { supabase } from '@/lib/supabase';
import { debug } from '@/utils/debug';
import { getAllChatbotQueries } from '@/data/examplesData';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// Intent detection result from chat-orchestrator
export interface IntentInfo {
  level1: 'title_search' | 'conversation';
  level2: string;
  confidence: number;
  engine: 'comps' | 'mandate' | 'vector' | null;
  isConversation: boolean;
}

// Rich explanation for title matches
export interface RichExplanation {
  title_id: string;
  title_name: string;
  overall_score: number;
  explanation_narrative: string;
  match_reasons: string[];
  source_engine: 'comps' | 'mandate' | 'vector';
}

export interface ChatResponse {
  response: string;
  titles?: any[];
  suggestedQueries?: string[];
  conversationId?: string;
  // New fields from intelligent routing
  intentInfo?: IntentInfo;
  explanations?: RichExplanation[];
  searchEngine?: 'comps' | 'mandate' | 'vector' | null;
}

// Phase types for processing status
export type ChatPhase = 'analyzing' | 'searching' | 'generating' | 'complete' | null;

// Phase data returned with phase changes
export interface PhaseData {
  count?: number;
  topTitles?: string[];
}

// Callbacks for real-time phase updates
export interface PhaseCallbacks {
  onPhaseChange?: (phase: ChatPhase, data?: PhaseData) => void;
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
   * @param callbacks Optional callbacks for real-time phase updates
   */
  async sendMessage(
    query: string,
    conversationHistory: ChatMessage[] = [],
    userId?: string,
    callbacks?: PhaseCallbacks
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

      // Parse SSE streaming response in REAL-TIME using ReadableStream
      // This allows phase callbacks to fire as events arrive, not after full response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let fullResponse = '';
      let titles: any[] = [];
      let suggestedQueries: string[] = [];
      let conversationId: string | undefined;
      let intentInfo: IntentInfo | undefined;
      let explanations: RichExplanation[] = [];
      let searchEngine: 'comps' | 'mandate' | 'vector' | null = null;
      let hasStartedGenerating = false; // Track if we've sent the 'generating' phase

      debug.log('📡 Starting real-time SSE stream processing...');

      // Process SSE events as they arrive
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventBlock of events) {
          // Find the data line in the event block
          const lines = eventBlock.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove "data: " prefix
                const data = JSON.parse(jsonStr);

                if (data.type === 'text') {
                  // Signal 'generating' phase on first text chunk
                  if (!hasStartedGenerating) {
                    hasStartedGenerating = true;
                    debug.log('✨ First text chunk received, signaling generating phase');
                    callbacks?.onPhaseChange?.('generating');
                  }
                  fullResponse += data.text;
                } else if (data.type === 'titles') {
                  titles = data.titles || [];
                } else if (data.type === 'suggestions' || data.type === 'suggested_queries') {
                  suggestedQueries = data.suggestedQueries || data.suggested_queries || [];
                } else if (data.type === 'complete') {
                  conversationId = data.conversationId;
                }
                // New event types from intelligent routing
                else if (data.type === 'intent_detected') {
                  intentInfo = {
                    level1: data.level1,
                    level2: data.level2,
                    confidence: data.confidence,
                    engine: data.engine,
                    isConversation: data.isConversation,
                  };
                  searchEngine = data.engine;
                  debug.log('🎯 Intent detected (real-time):', intentInfo);
                  // Signal 'analyzing' phase IMMEDIATELY
                  callbacks?.onPhaseChange?.('analyzing');
                } else if (data.type === 'search_complete') {
                  // Update search engine from search_complete event
                  if (data.engine) {
                    searchEngine = data.engine;
                  }
                  // Store titles from search_complete (backend sends topTitles here)
                  if (data.topTitles && data.topTitles.length > 0) {
                    titles = data.topTitles;
                    debug.log('📚 Captured titles from search_complete:', titles.length);
                  }
                  debug.log('🔍 Search complete (real-time):', {
                    count: data.resultsCount,
                    engine: data.engine,
                    avgSimilarity: data.avgSimilarity
                  });
                  // Signal 'searching' phase with result count IMMEDIATELY
                  callbacks?.onPhaseChange?.('searching', {
                    count: data.resultsCount,
                    topTitles: data.topTitles || [],
                  });
                } else if (data.type === 'explanations_ready') {
                  explanations = data.explanations || [];
                  debug.log('📝 Explanations ready (real-time):', {
                    count: explanations.length,
                    engine: explanations[0]?.source_engine
                  });
                }
              } catch (parseError) {
                debug.log('⚠️ Skipping unparseable line:', line.substring(0, 100));
              }
            }
          }
        }
      }

      debug.log('✅ Chatbot response parsed', {
        responseLength: fullResponse.length,
        titleCount: titles.length,
        suggestedQueriesCount: suggestedQueries.length,
        hasIntent: !!intentInfo,
        hasExplanations: explanations.length > 0,
        searchEngine,
      });

      return {
        response: fullResponse,
        titles,
        suggestedQueries,
        conversationId,
        intentInfo,
        explanations,
        searchEngine,
      };
    } catch (error: any) {
      console.error('❌ Chat service error', error);
      throw error;
    }
  },

  /**
   * Get suggested queries for empty state
   * Returns 5 random prompts from centralized examplesData.ts
   *
   * IMPORTANT: Uses examplesData.ts as single source of truth.
   * Do NOT hardcode prompts in this service.
   */
  getSuggestedQueries(): string[] {
    // Get all prompts from centralized data source
    const allPrompts = getAllChatbotQueries();

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
      synopsis: title.synopsis,
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
