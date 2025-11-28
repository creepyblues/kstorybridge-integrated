import OpenAI from 'openai';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Simplified Embedding Service for Dashboard-Next
 *
 * Generates OpenAI embeddings for semantic search.
 * Development mode: Direct OpenAI client
 * Production mode: Backend API (future enhancement)
 */
class EmbeddingService {
  private client: OpenAI | null = null;
  private readonly EMBEDDING_MODEL = 'text-embedding-ada-002';
  private readonly EMBEDDING_DIMENSIONS = 1536;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isProduction = import.meta.env.PROD;

    // In production, could use backend API - but for now use direct client
    if (isProduction) {
      console.log('⚠️ Production mode: Consider moving to backend API for security');
    }

    if (!apiKey || apiKey === 'sk-your_actual_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured for embedding service');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // TODO: Move to backend for production
      });
      console.log('✅ Embedding service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize embedding service:', error);
    }
  }

  /**
   * Generate embedding for a single text string
   * Used for semantic search queries
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (!this.client) {
      throw new Error('OpenAI client not initialized. Check VITE_OPENAI_API_KEY in .env.local');
    }

    try {
      console.log(`🔄 Generating embedding for: "${text.substring(0, 50)}..."`);

      const response = await this.client.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text.trim(),
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      console.log(`✅ Generated ${embedding.length}-dimensional embedding`);

      return {
        embedding,
        model: this.EMBEDDING_MODEL,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('❌ Error generating embedding:', error);

      // Handle specific OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }

      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Get the embedding model name
   */
  getModel(): string {
    return this.EMBEDDING_MODEL;
  }

  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return this.EMBEDDING_DIMENSIONS;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
