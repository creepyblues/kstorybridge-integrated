import OpenAI from 'openai';
import { titlesService, type Title } from './titlesService';
import { vectorSearchService } from './vectorSearchService';

interface LLMChatResponse {
  message: string;
  recommendedTitles: Title[];
  suggestedQueries?: string[];
  vectorSearchUsed?: boolean;
  searchContext?: any;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private allTitles: Title[] = [];

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    console.log('🔧 DEBUG: Initializing OpenAI client...');
    console.log('🔧 DEBUG: Environment variables:', {
      VITE_OPENAI_ENABLED: import.meta.env.VITE_OPENAI_ENABLED,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? import.meta.env.VITE_OPENAI_API_KEY.substring(0, 15) + '...' : 'undefined',
      PROD: import.meta.env.PROD,
      MODE: import.meta.env.MODE
    });
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isProduction = import.meta.env.PROD;
    const isEnabled = import.meta.env.VITE_OPENAI_ENABLED === 'true';
    
    // Check if OpenAI is disabled
    if (!isEnabled) {
      console.warn('🔒 OpenAI is disabled in this environment');
      return;
    }
    
    if (!apiKey || apiKey === 'sk-your_actual_api_key_here' || apiKey.trim() === '') {
      const envFile = isProduction ? 'deployment platform environment variables' : '.env.local file';
      console.warn(`⚠️ OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your ${envFile}`);
      console.warn(`⚠️ Current API key value: "${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}"`);
      return;
    }

    // Security check for production
    if (isProduction) {
      console.error('🚨 SECURITY WARNING: OpenAI client should NOT run in production browsers!');
      console.error('🚨 Move OpenAI functionality to a secure backend API endpoint.');
      console.error('🚨 Current implementation exposes API keys to client-side code.');
      
      // In production, disable the client to prevent security risks
      if (import.meta.env.VITE_FORCE_OPENAI_PRODUCTION !== 'true') {
        console.warn('🔒 OpenAI client disabled in production for security. Set VITE_FORCE_OPENAI_PRODUCTION=true to override (NOT RECOMMENDED)');
        return;
      }
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // ONLY for development - NEVER use in production
        baseURL: 'https://api.openai.com/v1',
      });
      
      const environment = isProduction ? 'PRODUCTION (INSECURE)' : 'DEVELOPMENT';
      console.log(`✅ OpenAI client initialized successfully [${environment}]`);
      
      if (isProduction) {
        console.warn('🚨 PRODUCTION WARNING: API key exposed in browser! Move to backend ASAP!');
      }
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
    }
  }

  async initialize(): Promise<void> {
    if (this.allTitles.length === 0) {
      try {
        console.log('📚 Loading titles for LLM context...');
        // Add timeout for titles loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Titles loading timeout after 5 seconds')), 5000);
        });

        const titlesPromise = titlesService.getAllTitles();
        this.allTitles = await Promise.race([titlesPromise, timeoutPromise]) as Title[];
        console.log(`📚 Loaded ${this.allTitles.length} titles for LLM context`);
      } catch (error) {
        console.warn('Failed to load titles, continuing without full context:', error);
        // Continue without titles - the service can still work
        this.allTitles = [];
      }
    }
  }

  private createKoreanIPContext(): string {
    // Create a representative sample of titles for context
    const sampleTitles = this.allTitles.slice(0, 10).map(title => ({
      title_name_en: title.title_name_en,
      title_name_kr: title.title_name_kr,
      genre: title.genre,
      tone: title.tone,
      content_format: title.content_format,
      synopsis: title.synopsis?.substring(0, 150) + '...',
    }));

    return `You are an expert assistant specializing in Korean intellectual properties (IPs) including webtoons, novels, manhwa, and other content. You help users discover Korean content that matches their preferences.

Available content database sample:
${JSON.stringify(sampleTitles, null, 2)}

Key categories in our database:
- Genres: Romance, Thriller, Fantasy, Comedy, Drama, Horror, Action, Slice of Life
- Formats: Webtoon, Novel, Manhwa, Web Novel, Book Series
- Tones: Dark, Light, Comedic, Dramatic, Suspenseful, Heartwarming
- Themes: Revenge, Family Drama, Coming of Age, Supernatural, Historical, Modern

Your role:
1. Understand user preferences and intent
2. Recommend specific Korean IPs that match their criteria
3. Explain WHY each recommendation fits their request
4. Ask clarifying questions to better understand their taste
5. Suggest related searches they might be interested in

Always be enthusiastic and knowledgeable about Korean content!`;
  }

  private async findRelevantTitlesWithVector(query: string, userId?: string, sessionId?: string): Promise<{ titles: Title[], vectorSearchUsed: boolean, searchContext?: any }> {
    try {
      // Try vector search first if available
      console.log('🔍 Attempting vector search for:', query.substring(0, 50) + '...');
      
      const vectorResults = await vectorSearchService.vectorSearch(query, {
        user_id: userId,
        session_id: sessionId, // Use the actual session ID from chat session
      }, {
        threshold: 0.65, // Lower threshold for more results
        limit: 8,
        includeAnalysis: true
      });

      if (vectorResults && vectorResults.length > 0) {
        console.log(`✅ Vector search found ${vectorResults.length} semantic matches`);
        
        // Convert vector results to Title format and add scores
        const vectorTitles = await Promise.all(
          vectorResults.map(async (result) => {
            const fullTitle = await titlesService.getTitleById(result.title_id);
            if (fullTitle) {
              return {
                ...fullTitle,
                score: Math.round(result.similarity * 100) // Convert similarity to score
              };
            }
            return null;
          })
        );

        const validTitles = vectorTitles.filter(title => title !== null) as Title[];
        
        return {
          titles: validTitles,
          vectorSearchUsed: true,
          searchContext: {
            searchType: 'vector',
            averageScore: vectorResults.reduce((acc, r) => acc + r.similarity, 0) / vectorResults.length,
            resultCount: vectorResults.length
          }
        };
      }
    } catch (error) {
      console.warn('⚠️ Vector search failed, falling back to text search:', error);
      // Log more details for debugging
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('🗄️ Database schema issue detected:', error.message);
        console.error('🔧 Consider running database migrations or updating the vector search function');
      }
    }

    // Fallback to traditional text-based search
    console.log('📝 Using traditional text-based search');
    return {
      titles: this.findRelevantTitlesLegacy(query),
      vectorSearchUsed: false,
      searchContext: {
        searchType: 'text_fallback',
        reason: 'vector_search_failed'
      }
    };
  }

  private findRelevantTitlesLegacy(query: string): Title[] {
    const queryWords = query.toLowerCase().split(' ');

    // Score titles based on relevance to query
    const scoredTitles = this.allTitles.map(title => {
      let score = 0;
      
      const titleText = [
        title.title_name_en,
        title.title_name_kr,
        title.synopsis,
        title.synopsis,
        ...(Array.isArray(title.genre) ? title.genre : [title.genre]),
        title.tone,
        ...(Array.isArray(title.tags) ? title.tags : []),
      ].filter(Boolean).join(' ').toLowerCase();

      // Score based on word matches
      queryWords.forEach(word => {
        if (word.length > 2 && titleText.includes(word)) {
          score += 1;
        }
      });

      // Boost for titles with pitch decks
      if (title.pitch && title.pitch.trim()) {
        score += 2;
      }

      // Boost for completed series
      if (title.completed) {
        score += 1;
      }

      return { ...title, score };
    });

    // Return top 6 most relevant titles
    return scoredTitles
      .filter(title => title.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  async generateChatResponse(userQuery: string, conversationHistory: string[] = [], userId?: string, sessionId?: string): Promise<LLMChatResponse> {
    // In production, use the secure backend API
    if (import.meta.env.PROD) {
      return this.generateChatResponseViaAPI(userQuery, conversationHistory, userId, sessionId);
    }

    // Development: use direct client
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please check your API key configuration.');
    }

    await this.initialize();

    try {
      // Prepare conversation context
      const context = this.createKoreanIPContext();
      const historyContext = conversationHistory.length > 0 
        ? `\n\nConversation history:\n${conversationHistory.join('\n')}` 
        : '';

      const prompt = `${context}${historyContext}

User Query: "${userQuery}"

Please provide a helpful response that:
1. Shows you understand what the user is looking for
2. Recommends specific Korean IPs that match their criteria (mention specific titles from the database when relevant)
3. Explains why these recommendations fit their request
4. Asks a follow-up question to help narrow down their preferences further
5. Suggests 2-3 related searches they might be interested in

Keep your response conversational, enthusiastic, and focused on Korean content discovery.`;

      console.log('🤖 Sending request to OpenAI...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timeout after 30 seconds')), 30000);
      });

      const apiPromise = this.client.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective model
        messages: [
          {
            role: "user",
            content: prompt,
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const completion = await Promise.race([apiPromise, timeoutPromise]) as any;

      const aiResponse = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      console.log('✅ Received response from OpenAI');

      // Find titles using vector search with fallback to text search
      const searchResult = await this.findRelevantTitlesWithVector(userQuery, userId, sessionId);

      // Extract suggested queries from the AI response (simple parsing)
      const suggestedQueries = this.extractSuggestedQueries(aiResponse);

      // Enhance AI response if vector search was used
      let enhancedResponse = aiResponse;
      if (searchResult.vectorSearchUsed && searchResult.titles.length > 0) {
        enhancedResponse = `🎯 *Using AI-powered semantic search to find your perfect matches*\n\n${aiResponse}`;
      }

      return {
        message: enhancedResponse,
        recommendedTitles: searchResult.titles,
        suggestedQueries,
        vectorSearchUsed: searchResult.vectorSearchUsed,
        searchContext: searchResult.searchContext,
      };

    } catch (error: any) {
      console.error('❌ OpenAI API Error:', error);
      
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  private async generateChatResponseViaAPI(userQuery: string, conversationHistory: string[] = [], userId?: string, sessionId?: string): Promise<LLMChatResponse> {
    try {
      console.log('🔒 Using secure backend API for OpenAI request...');
      
      // Get the current user's auth token
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Call the backend API
      const response = await fetch('/api/openai-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: userQuery,
          conversationHistory: conversationHistory.slice(-6), // Limit context to last 6 messages
          userId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), get text
          try {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText.substring(0, 200));
            errorMessage = `Server error (${response.status}): ${errorText.includes('FUNCTION_INVOCATION_FAILED') ? 'Function crashed' : 'Invalid response format'}`;
          } catch (textError) {
            console.error('Could not parse error response:', parseError);
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse successful response as JSON:', parseError);
        const responseText = await response.text();
        console.error('Response text:', responseText.substring(0, 500));
        throw new Error('Server returned invalid JSON response');
      }
      console.log('✅ Received response from backend API');

      // Find relevant titles (using local search since API doesn't have access to titles)
      await this.initialize();
      const searchResult = await this.findRelevantTitlesWithVector(userQuery, userId, sessionId);

      return {
        message: data.message,
        recommendedTitles: searchResult.titles,
        suggestedQueries: data.suggestedQueries || [],
        vectorSearchUsed: searchResult.vectorSearchUsed,
        searchContext: searchResult.searchContext,
      };

    } catch (error: any) {
      console.error('❌ Backend API Error:', error);
      
      if (error.message?.includes('Authentication required')) {
        throw new Error('Please sign in to use the OpenAI chatbot');
      } else if (error.message?.includes('not authorized')) {
        throw new Error('You do not have permission to use the OpenAI chatbot');
      } else if (error.message?.includes('Too many requests')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  private extractSuggestedQueries(aiResponse: string): string[] {
    // Simple extraction of suggested searches from AI response
    const suggestions: string[] = [];
    const lines = aiResponse.split('\n');
    
    lines.forEach(line => {
      // Look for lines that might contain suggestions
      if (line.includes('"') && (line.toLowerCase().includes('try') || line.toLowerCase().includes('search'))) {
        const matches = line.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const query = match.replace(/"/g, '');
            if (query.length > 5 && query.length < 50) {
              suggestions.push(query);
            }
          });
        }
      }
    });
    
    return suggestions.slice(0, 3); // Maximum 3 suggestions
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      console.error('OpenAI client not initialized');
      return false;
    }

    try {
      console.log('🔍 Testing OpenAI connection with simple request...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });

      const apiPromise = this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10,
      });

      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      console.log('✅ OpenAI connection test successful:', response.choices[0].message.content);
      return response.choices.length > 0;
    } catch (error: any) {
      console.error('❌ OpenAI connection test failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      return false;
    }
  }

  // Get usage information (if needed)
  getUsageInfo(): { configured: boolean; model: string } {
    return {
      configured: this.client !== null,
      model: "gpt-4o-mini"
    };
  }
}

export const openaiService = new OpenAIService();