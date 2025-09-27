import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { titlesService, type Title } from './titlesService';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ContentEmbeddings {
  title_embedding: number[];
  description_embedding: number[];
  content_embedding: number[];
  combined_embedding: number[];
}

export interface ContentAnalysis {
  semantic_tags: string[];
  mood_analysis: {
    primary_mood: string;
    mood_intensity: number;
    emotional_spectrum: string[];
  };
  character_types: string[];
  plot_elements: string[];
  cultural_elements: string[];
  complexity_score: number;
  target_demographics: {
    age_range: string;
    interests: string[];
    content_preferences: string[];
  };
  content_warnings: string[];
}

class EmbeddingService {
  private client: OpenAI | null = null;
  private readonly EMBEDDING_MODEL = 'text-embedding-ada-002';
  private readonly EMBEDDING_DIMENSIONS = 1536;
  private readonly BATCH_SIZE = 100; // Process embeddings in batches

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isProduction = import.meta.env.PROD;

    // In production, embedding service is handled by backend - no warning needed
    if (isProduction) {
      console.log('✅ Embedding service configured for backend API mode');
      return;
    }

    if (!apiKey || apiKey === 'sk-your_actual_api_key_here') {
      console.warn('OpenAI API key not configured for embedding service (development mode)');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Move to backend for production
      });
      console.log('✅ Embedding service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize embedding service:', error);
    }
  }

  // Generate embedding for a single text
  async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // In production, use the secure backend API
    if (import.meta.env.PROD) {
      return this.generateEmbeddingViaAPI(text);
    }

    // Development: use direct client
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      console.log(`🔄 Generating embedding for text: "${text.substring(0, 50)}..."`);
      
      const response = await this.client.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text.trim(),
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
      
      return {
        embedding,
        model: this.EMBEDDING_MODEL,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('❌ Error generating embedding:', error);
      
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      }
      
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  private async generateEmbeddingViaAPI(text: string): Promise<EmbeddingResult | null> {
    try {
      console.log(`🔒 Using backend API for embedding generation: "${text.substring(0, 50)}..."`);
      
      // Get the current user's auth token
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Call the backend API
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
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

      const data = await response.json();
      console.log(`✅ Generated embedding via backend API with ${data.embedding.length} dimensions`);

      return {
        embedding: data.embedding,
        model: data.model,
        usage: data.usage,
      };

    } catch (error: any) {
      console.error('❌ Backend Embedding API Error:', error);
      
      if (error.message?.includes('Authentication required')) {
        throw new Error('Please sign in to use vector search');
      } else if (error.message?.includes('Rate limit exceeded')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  // Generate multiple embeddings for a title's content
  async generateTitleEmbeddings(title: Title): Promise<ContentEmbeddings> {
    // In production, use the backend API; in development, use direct client
    const useBackendAPI = import.meta.env.PROD;
    
    if (!useBackendAPI && !this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Prepare different text representations
      const titleText = [title.title_name_en, title.title_name_kr]
        .filter(Boolean)
        .join(' | ');
      
      const descriptionText = [title.synopsis, title.tagline]
        .filter(Boolean)
        .join(' ');

      const contentText = [
        titleText,
        descriptionText,
        title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : '',
        title.tone || '',
        title.tags ? (Array.isArray(title.tags) ? title.tags.join(', ') : title.tags) : '',
        title.author || '',
        title.rights_owner || ''
      ].filter(Boolean).join(' ');

      const combinedText = [
        `Title: ${titleText}`,
        `Description: ${descriptionText}`,
        `Genre: ${title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : 'Not specified'}`,
        `Tone: ${title.tone || 'Not specified'}`,
        `Format: ${title.content_format || 'Not specified'}`,
        `Author: ${title.author || 'Not specified'}`,
        title.completed ? 'Status: Completed' : 'Status: Ongoing'
      ].join('\n');

      console.log(`🔄 Generating embeddings for title: ${title.title_name_en || title.title_name_kr}`);

      // Generate embeddings in parallel
      const [titleEmbedding, descriptionEmbedding, contentEmbedding, combinedEmbedding] = await Promise.all([
        this.generateEmbedding(titleText),
        this.generateEmbedding(descriptionText),
        this.generateEmbedding(contentText),
        this.generateEmbedding(combinedText)
      ]);

      if (!titleEmbedding || !descriptionEmbedding || !contentEmbedding || !combinedEmbedding) {
        throw new Error('Failed to generate one or more embeddings');
      }

      return {
        title_embedding: titleEmbedding.embedding,
        description_embedding: descriptionEmbedding.embedding,
        content_embedding: contentEmbedding.embedding,
        combined_embedding: combinedEmbedding.embedding
      };
    } catch (error) {
      console.error(`❌ Error generating embeddings for title ${title.title_id}:`, error);
      throw error;
    }
  }

  // Analyze content semantically using AI
  async analyzeContent(title: Title): Promise<ContentAnalysis> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const analysisPrompt = `Analyze this Korean content and provide structured analysis:

Title (English): ${title.title_name_en || 'Not provided'}
Title (Korean): ${title.title_name_kr || 'Not provided'}
Synopsis: ${title.synopsis || 'Not provided'}
Synopsis: ${title.synopsis || 'Not provided'}
Genre: ${title.genre ? (Array.isArray(title.genre) ? title.genre.join(', ') : title.genre) : 'Not specified'}
Tone: ${title.tone || 'Not specified'}
Format: ${title.content_format || 'Not specified'}

Please analyze and provide:

1. Semantic Tags: Extract 5-10 key themes, concepts, and elements
2. Mood Analysis: Primary emotional tone and intensity (1-10)
3. Character Types: Main character archetypes present
4. Plot Elements: Key story structure elements
5. Cultural Elements: Korean cultural references and context
6. Complexity Score: Content complexity from 1 (simple) to 10 (complex)
7. Target Demographics: Who would enjoy this content
8. Content Warnings: Any sensitive content to note

Format your response as JSON with these exact keys:
{
  "semantic_tags": ["tag1", "tag2", ...],
  "mood_analysis": {
    "primary_mood": "mood",
    "mood_intensity": number,
    "emotional_spectrum": ["emotion1", "emotion2", ...]
  },
  "character_types": ["type1", "type2", ...],
  "plot_elements": ["element1", "element2", ...],
  "cultural_elements": ["element1", "element2", ...],
  "complexity_score": number,
  "target_demographics": {
    "age_range": "age range",
    "interests": ["interest1", "interest2", ...],
    "content_preferences": ["preference1", "preference2", ...]
  },
  "content_warnings": ["warning1", "warning2", ...]
}`;

    try {
      console.log(`🔄 Analyzing content for: ${title.title_name_en || title.title_name_kr}`);

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective for analysis
        messages: [
          {
            role: "system",
            content: "You are an expert analyst of Korean media content including webtoons, novels, and manhwa. Provide accurate, culturally-aware analysis in valid JSON format."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for consistent analysis
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis returned from OpenAI');
      }

      // Parse JSON response
      try {
        const analysis = JSON.parse(analysisText);
        console.log(`✅ Content analysis completed for: ${title.title_name_en || title.title_name_kr}`);
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse analysis JSON:', analysisText);
        throw new Error('Invalid JSON returned from content analysis');
      }
    } catch (error) {
      console.error(`❌ Error analyzing content for ${title.title_id}:`, error);
      throw error;
    }
  }

  // Store embeddings and analysis in database
  async storeTitleEmbeddings(titleId: string, embeddings: ContentEmbeddings): Promise<boolean> {
    try {
      console.log(`💾 Storing embeddings for title: ${titleId}`);

      // Ensure embeddings are exactly 1536 dimensions and properly formatted for vector storage
      const formatEmbedding = (embedding: number[]) => {
        if (!embedding || embedding.length === 0) {
          console.warn(`⚠️ Empty embedding detected, using zero vector`);
          return new Array(1536).fill(0);
        }

        // Truncate or pad to exactly 1536 dimensions
        if (embedding.length !== 1536) {
          console.warn(`⚠️ Embedding dimension mismatch: ${embedding.length} → 1536`);
          const formattedEmbedding = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(1536, embedding.length); i++) {
            formattedEmbedding[i] = embedding[i] || 0;
          }
          return formattedEmbedding;
        }

        return embedding;
      };

      const { error } = await supabase
        .from('titles')
        .update({
          title_embedding: formatEmbedding(embeddings.title_embedding),
          synopsis_embedding: formatEmbedding(embeddings.description_embedding),
          content_embedding: formatEmbedding(embeddings.content_embedding),
          combined_embedding: formatEmbedding(embeddings.combined_embedding),
          embedding_model: this.EMBEDDING_MODEL,
          embedding_created_at: new Date().toISOString(),
          embedding_updated_at: new Date().toISOString()
        })
        .eq('title_id', titleId);

      if (error) {
        console.error('Database error storing embeddings:', error);
        return false;
      }

      console.log(`✅ Embeddings stored for title: ${titleId}`);
      return true;
    } catch (error) {
      console.error('Error storing embeddings:', error);
      return false;
    }
  }

  // Store content analysis in database
  async storeContentAnalysis(titleId: string, analysis: ContentAnalysis): Promise<boolean> {
    try {
      console.log(`💾 Storing content analysis for title: ${titleId}`);

      const { error } = await supabase
        .from('title_content_analysis')
        .upsert({
          title_id: titleId,
          semantic_tags: analysis.semantic_tags,
          mood_analysis: analysis.mood_analysis,
          character_types: analysis.character_types,
          plot_elements: analysis.plot_elements,
          cultural_elements: analysis.cultural_elements,
          complexity_score: analysis.complexity_score,
          target_demographics: analysis.target_demographics,
          content_warnings: analysis.content_warnings,
          analysis_version: '1.0',
          processed_by: 'openai-gpt-4o-mini',
          processing_confidence: 0.8, // Default confidence
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database error storing analysis:', error);
        return false;
      }

      console.log(`✅ Content analysis stored for title: ${titleId}`);
      return true;
    } catch (error) {
      console.error('Error storing content analysis:', error);
      return false;
    }
  }

  // Process a single title completely
  async processTitle(title: Title): Promise<boolean> {
    try {
      console.log(`🚀 Starting complete processing for: ${title.title_name_en || title.title_name_kr}`);

      // Generate embeddings and analysis in parallel
      const [embeddings, analysis] = await Promise.all([
        this.generateTitleEmbeddings(title),
        this.analyzeContent(title)
      ]);

      // Store results in parallel
      const [embeddingsStored, analysisStored] = await Promise.all([
        this.storeTitleEmbeddings(title.title_id, embeddings),
        this.storeContentAnalysis(title.title_id, analysis)
      ]);

      const success = embeddingsStored && analysisStored;
      if (success) {
        console.log(`✅ Complete processing successful for: ${title.title_name_en || title.title_name_kr}`);
      } else {
        console.error(`❌ Processing failed for: ${title.title_name_en || title.title_name_kr}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ Error processing title ${title.title_id}:`, error);
      return false;
    }
  }

  // Batch process multiple titles
  async processTitlesBatch(titleIds: string[]): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    console.log(`🔄 Starting batch processing for ${titleIds.length} titles`);
    
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Load titles from database
    const titles = await titlesService.getAllTitles();
    const titlesToProcess = titles.filter(title => titleIds.includes(title.title_id));

    console.log(`📚 Found ${titlesToProcess.length} titles to process`);

    // Process in smaller batches to avoid rate limits
    for (let i = 0; i < titlesToProcess.length; i += this.BATCH_SIZE) {
      const batch = titlesToProcess.slice(i, i + this.BATCH_SIZE);
      console.log(`🔄 Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(titlesToProcess.length / this.BATCH_SIZE)}`);

      for (const title of batch) {
        try {
          const success = await this.processTitle(title);
          if (success) {
            processed++;
          } else {
            failed++;
            errors.push(`Failed to process title: ${title.title_id}`);
          }
        } catch (error: any) {
          failed++;
          errors.push(`Error processing ${title.title_id}: ${error.message}`);
        }

        // Add delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Longer delay between batches
      if (i + this.BATCH_SIZE < titlesToProcess.length) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ Batch processing complete: ${processed} processed, ${failed} failed`);
    return { processed, failed, errors };
  }

  // Get processing status for titles
  async getProcessingStatus(): Promise<{
    total_titles: number;
    with_embeddings: number;
    with_analysis: number;
    needs_processing: string[];
  }> {
    try {
      const { data: titleStats, error: titleError } = await supabase
        .from('titles')
        .select('title_id, combined_embedding')
        .limit(1000);

      const { data: analysisStats, error: analysisError } = await supabase
        .from('title_content_analysis')
        .select('title_id')
        .limit(1000);

      if (titleError || analysisError) {
        throw new Error('Failed to fetch processing status');
      }

      const totalTitles = titleStats?.length || 0;
      const withEmbeddings = titleStats?.filter(t => t.combined_embedding !== null).length || 0;
      const withAnalysis = analysisStats?.length || 0;
      
      const needsProcessing = titleStats
        ?.filter(t => t.combined_embedding === null)
        .map(t => t.title_id) || [];

      return {
        total_titles: totalTitles,
        with_embeddings: withEmbeddings,
        with_analysis: withAnalysis,
        needs_processing: needsProcessing
      };
    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  }

  // Health check
  isConfigured(): boolean {
    return this.client !== null;
  }
}

export const embeddingService = new EmbeddingService();