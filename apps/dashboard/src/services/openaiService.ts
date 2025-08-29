import OpenAI from 'openai';
import { titlesService, type Title } from './titlesService';

interface LLMChatResponse {
  message: string;
  recommendedTitles: Title[];
  suggestedQueries?: string[];
}

class OpenAIService {
  private client: OpenAI | null = null;
  private allTitles: Title[] = [];

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'sk-your_actual_api_key_here') {
      console.warn('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Only for development - move to backend for production
        baseURL: 'https://api.openai.com/v1', // Ensure we're using the correct endpoint
      });
      console.log('✅ OpenAI client initialized successfully');
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
      description: title.description?.substring(0, 150) + '...',
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

  private findRelevantTitles(query: string, aiResponse: string): Title[] {
    const queryWords = query.toLowerCase().split(' ');
    const responseWords = aiResponse.toLowerCase().split(' ');
    const allWords = [...queryWords, ...responseWords];

    // Score titles based on relevance to query and AI response
    const scoredTitles = this.allTitles.map(title => {
      let score = 0;
      
      const titleText = [
        title.title_name_en,
        title.title_name_kr,
        title.description,
        title.synopsis,
        ...(Array.isArray(title.genre) ? title.genre : [title.genre]),
        title.tone,
        ...(Array.isArray(title.tags) ? title.tags : []),
      ].filter(Boolean).join(' ').toLowerCase();

      // Score based on word matches
      allWords.forEach(word => {
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

  async generateChatResponse(userQuery: string, conversationHistory: string[] = []): Promise<LLMChatResponse> {
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

      // Find titles that are most relevant to the query and AI response
      const recommendedTitles = this.findRelevantTitles(userQuery, aiResponse);

      // Extract suggested queries from the AI response (simple parsing)
      const suggestedQueries = this.extractSuggestedQueries(aiResponse);

      return {
        message: aiResponse,
        recommendedTitles,
        suggestedQueries,
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