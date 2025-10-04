import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface OrchestratorResponse {
  text?: string;
  error?: string;
  titles?: any[];
  suggestedQueries?: string[];
}

interface StreamingChatOptions {
  sessionId?: string;
  onChunk?: (text: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
  // Testing mode parameters
  model?: string;
  vectorSearchLimit?: number;
  systemPrompt?: string;
  formattingRules?: string;
}

class ChatOrchestratorService {
  private baseUrl: string;

  constructor() {
    // Use the Supabase URL for edge functions
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
    this.baseUrl = `${supabaseUrl}/functions/v1`;
  }

  /**
   * Send a message to the chat orchestrator with streaming response
   */
  async sendMessageStream(
    messages: ChatMessage[],
    options: StreamingChatOptions = {}
  ): Promise<string> {
    const { sessionId, onChunk, onComplete, onError, model, vectorSearchLimit, systemPrompt, formattingRules } = options;

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('🔄 Orchestrator Request:', {
        service: 'ChatOrchestratorService',
        method: 'sendMessageStream',
        targetAPI: 'OpenAI GPT-4 (via Supabase Edge Function)',
        url: `${this.baseUrl}/chat-orchestrator`,
        messagesCount: messages.length,
        sessionId,
        model: model || 'default',
        vectorSearchLimit: vectorSearchLimit || 'default',
        hasToken: !!session.access_token,
        timestamp: new Date().toISOString()
      });

      const requestBody: any = {
        messages,
        sessionId
      };

      // Add testing parameters if provided
      if (model) requestBody.model = model;
      if (vectorSearchLimit) requestBody.vectorSearchLimit = vectorSearchLimit;
      if (systemPrompt) requestBody.systemPrompt = systemPrompt;
      if (formattingRules) requestBody.formattingRules = formattingRules;

      const response = await fetch(`${this.baseUrl}/chat-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Orchestrator Response:', {
        service: 'ChatOrchestratorService',
        sourceAPI: 'OpenAI GPT-4 (via Supabase Edge Function)',
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              onComplete?.(fullResponse);
              return fullResponse;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.text) {
                fullResponse += parsed.text;
                onChunk?.(parsed.text);
              }
            } catch (parseError) {
              // Ignore parsing errors for non-JSON lines
              console.debug('Non-JSON line:', data);
            }
          }
        }
      }

      onComplete?.(fullResponse);
      return fullResponse;

    } catch (error) {
      console.error('🚨 Chat orchestrator error:', {
        error: error instanceof Error ? error.message : String(error),
        fullError: error,
        url: `${this.baseUrl}/chat-orchestrator`
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Send a simple message without streaming (fallback)
   */
  async sendMessage(
    messages: ChatMessage[],
    sessionId?: string
  ): Promise<OrchestratorResponse> {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.baseUrl}/chat-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages,
          sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Chat orchestrator error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format conversation history for the orchestrator
   */
  formatConversationHistory(messages: any[]): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp?.toISOString() || new Date().toISOString()
    }));
  }

  /**
   * Check if the orchestrator service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/chat-orchestrator`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const chatOrchestratorService = new ChatOrchestratorService();
export type { ChatMessage, OrchestratorResponse, StreamingChatOptions };