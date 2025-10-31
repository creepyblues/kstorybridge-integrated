import { supabase } from '@/integrations/supabase/client';
import { embeddingService } from './embeddingService';
import { titlesService, type Title } from './titlesService';

export interface ExtractedMetadata {
  // Semantic Analysis
  themes: string[];
  mood: 'light' | 'dark' | 'balanced' | 'complex';
  emotionalTone: string[];
  
  // Character Analysis  
  characterTypes: string[];
  relationshipDynamics: string[];
  
  // Plot Analysis
  plotElements: string[];
  storyStructure: 'linear' | 'non-linear' | 'episodic' | 'complex';
  conflictTypes: string[];
  
  // Market Intelligence
  targetAudience: {
    ageGroups: string[];
    interests: string[];
    psychographics: string[];
  };
  marketPositioning: string[];
  competitorAnalysis: string[];
  
  // Content Quality Metrics
  complexityScore: number; // 1-10
  readabilityScore: number;
  commercialViability: number; // 1-10
  
  // Cultural Context
  culturalElements: string[];
  universalAppeal: number; // 1-10
  localizationComplexity: 'low' | 'medium' | 'high';
  
  // Production Insights
  adaptationPotential: {
    format: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedBudget: 'low' | 'medium' | 'high';
  };
  
  // Search Enhancement
  searchKeywords: string[];
  semanticClusters: string[];
  relatedQueries: string[];
}

class MetadataExtractionService {
  private readonly openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  /**
   * Extract rich metadata from title content using AI analysis
   */
  async extractMetadata(title: Title): Promise<ExtractedMetadata> {
    const contentText = this.buildContentText(title);
    
    try {
      // Use OpenAI for sophisticated content analysis
      const analysis = await this.performAIAnalysis(contentText, title);
      
      // Enhance with rule-based analysis
      const enhancedAnalysis = await this.enhanceWithRuleBasedAnalysis(analysis, title);
      
      // Store results in database
      await this.storeMetadata(title.title_id, enhancedAnalysis);
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      // Fallback to rule-based analysis only
      return this.performRuleBasedAnalysis(title);
    }
  }

  /**
   * Build comprehensive content text for analysis
   */
  private buildContentText(title: Title): string {
    const parts = [];
    
    if (title.title_name_en) parts.push(`Title: ${title.title_name_en}`);
    if (title.title_name_kr) parts.push(`Korean Title: ${title.title_name_kr}`);
    if (title.synopsis) parts.push(`Synopsis: ${title.synopsis}`);
    if (title.tagline) parts.push(`Tagline: ${title.tagline}`);
    if (title.pitch) parts.push(`Pitch: ${title.pitch}`);
    if (title.perfect_for) parts.push(`Perfect For: ${title.perfect_for}`);
    if (title.note) parts.push(`Notes: ${title.note}`);
    if (title.genre) parts.push(`Genres: ${Array.isArray(title.genre) ? title.genre.join(', ') : title.genre}`);
    if (title.tone) parts.push(`Tone: ${title.tone}`);
    if (title.audience) parts.push(`Audience: ${title.audience}`);
    if (title.comps && title.comps.length > 0) parts.push(`Comparables: ${title.comps.join(', ')}`);
    
    return parts.join('\n\n');
  }

  /**
   * Perform AI-powered content analysis
   */
  private async performAIAnalysis(contentText: string, title: Title): Promise<ExtractedMetadata> {
    if (!this.openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analyze this Korean content for TV/film production insights. Extract detailed metadata:

${contentText}

Provide a JSON response with the following structure:
{
  "themes": ["theme1", "theme2"],
  "mood": "light|dark|balanced|complex",
  "emotionalTone": ["romantic", "suspenseful", etc.],
  "characterTypes": ["protagonist_type", "relationship_dynamics"],
  "plotElements": ["story_elements", "plot_devices"],
  "storyStructure": "linear|non-linear|episodic|complex",
  "targetAudience": {
    "ageGroups": ["18-24", "25-34", etc.],
    "interests": ["interest1", "interest2"],
    "psychographics": ["personality_traits"]
  },
  "marketPositioning": ["market_category1", "market_category2"],
  "complexityScore": 1-10,
  "commercialViability": 1-10,
  "culturalElements": ["korean_specific_elements"],
  "universalAppeal": 1-10,
  "adaptationPotential": {
    "format": ["drama", "movie", "animation"],
    "difficulty": "easy|medium|hard",
    "estimatedBudget": "low|medium|high"
  },
  "searchKeywords": ["relevant", "keywords", "for", "search"],
  "relatedQueries": ["what users might search for"]
}

Focus on insights valuable for TV/film producers and content buyers.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText);
    
    // Add computed fields
    analysis.relationshipDynamics = this.extractRelationshipDynamics(contentText);
    analysis.conflictTypes = this.extractConflictTypes(contentText);
    analysis.readabilityScore = this.calculateReadabilityScore(contentText);
    analysis.semanticClusters = await this.generateSemanticClusters(contentText);
    analysis.localizationComplexity = this.assessLocalizationComplexity(analysis.culturalElements);
    
    return analysis as ExtractedMetadata;
  }

  /**
   * Enhance AI analysis with rule-based insights
   */
  private async enhanceWithRuleBasedAnalysis(
    aiAnalysis: ExtractedMetadata, 
    title: Title
  ): Promise<ExtractedMetadata> {
    // Add genre-specific enhancements
    const genreInsights = this.getGenreSpecificInsights(title.genre);
    
    // Add format-specific insights
    const formatInsights = this.getFormatSpecificInsights(title.content_format);
    
    // Enhance target audience based on existing data
    const audienceEnhancements = this.enhanceAudienceAnalysis(title, aiAnalysis);
    
    // Add competitor analysis based on comps
    const competitorAnalysis = this.analyzeCompetitors(title.comps);
    
    return {
      ...aiAnalysis,
      marketPositioning: [...aiAnalysis.marketPositioning, ...genreInsights.positioning],
      targetAudience: {
        ...aiAnalysis.targetAudience,
        ...audienceEnhancements
      },
      competitorAnalysis,
      searchKeywords: [
        ...aiAnalysis.searchKeywords,
        ...genreInsights.keywords,
        ...formatInsights.keywords
      ]
    };
  }

  /**
   * Fallback rule-based analysis when AI is unavailable
   */
  private performRuleBasedAnalysis(title: Title): ExtractedMetadata {
    return {
      themes: this.extractThemes(title),
      mood: this.determineMood(title),
      emotionalTone: this.extractEmotionalTone(title),
      characterTypes: this.inferCharacterTypes(title),
      relationshipDynamics: this.extractRelationshipDynamics(this.buildContentText(title)),
      plotElements: this.extractPlotElements(title),
      storyStructure: this.determineStoryStructure(title),
      conflictTypes: this.extractConflictTypes(this.buildContentText(title)),
      targetAudience: this.analyzeTargetAudience(title),
      marketPositioning: this.determineMarketPositioning(title),
      competitorAnalysis: this.analyzeCompetitors(title.comps),
      complexityScore: this.calculateComplexityScore(title),
      readabilityScore: this.calculateReadabilityScore(this.buildContentText(title)),
      commercialViability: this.assessCommercialViability(title),
      culturalElements: this.extractCulturalElements(title),
      universalAppeal: this.assessUniversalAppeal(title),
      localizationComplexity: 'medium',
      adaptationPotential: this.assessAdaptationPotential(title),
      searchKeywords: this.generateSearchKeywords(title),
      semanticClusters: [],
      relatedQueries: this.generateRelatedQueries(title)
    };
  }

  /**
   * Store extracted metadata in database
   */
  private async storeMetadata(titleId: string, metadata: ExtractedMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('title_content_analysis')
        .upsert({
          title_id: titleId,
          semantic_tags: metadata.themes,
          mood_analysis: {
            mood: metadata.mood,
            emotional_tone: metadata.emotionalTone,
            complexity_score: metadata.complexityScore
          },
          character_types: metadata.characterTypes,
          plot_elements: metadata.plotElements,
          cultural_elements: metadata.culturalElements,
          target_demographics: metadata.targetAudience,
          content_warnings: [], // To be implemented
          keyword_density: this.buildKeywordDensity(metadata.searchKeywords),
          complexity_score: metadata.complexityScore,
          content_quality_score: metadata.commercialViability / 10,
          search_boost_factor: this.calculateSearchBoost(metadata)
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store metadata:', error);
    }
  }

  // Helper methods (implement based on business logic)
  private extractThemes(title: Title): string[] {
    const themes = [];
    const content = this.buildContentText(title).toLowerCase();
    
    if (content.includes('love') || content.includes('romance')) themes.push('romance');
    if (content.includes('family')) themes.push('family');
    if (content.includes('friendship')) themes.push('friendship');
    if (content.includes('betrayal')) themes.push('betrayal');
    if (content.includes('revenge')) themes.push('revenge');
    if (content.includes('growth') || content.includes('coming of age')) themes.push('personal growth');
    
    return themes;
  }

  private determineMood(title: Title): 'light' | 'dark' | 'balanced' | 'complex' {
    const content = this.buildContentText(title).toLowerCase();
    const darkWords = ['death', 'murder', 'revenge', 'betrayal', 'dark', 'tragedy'];
    const lightWords = ['comedy', 'romance', 'wholesome', 'heartwarming', 'light'];
    
    const darkCount = darkWords.reduce((count, word) => count + (content.includes(word) ? 1 : 0), 0);
    const lightCount = lightWords.reduce((count, word) => count + (content.includes(word) ? 1 : 0), 0);
    
    if (darkCount > lightCount + 1) return 'dark';
    if (lightCount > darkCount + 1) return 'light';
    if (darkCount > 0 && lightCount > 0) return 'complex';
    return 'balanced';
  }

  private calculateComplexityScore(title: Title): number {
    let score = 5; // Base score
    
    if (title.synopsis && title.synopsis.length > 500) score += 1;
    if (title.comps && title.comps.length > 3) score += 1;
    if (Array.isArray(title.genre) && title.genre.length > 2) score += 1;
    
    return Math.min(10, Math.max(1, score));
  }

  private generateSearchKeywords(title: Title): string[] {
    const keywords = [];
    
    if (title.genre) {
      const genres = Array.isArray(title.genre) ? title.genre : [title.genre];
      keywords.push(...genres);
    }
    
    if (title.tone) keywords.push(title.tone);
    if (title.audience) keywords.push(...title.audience.split(' '));
    
    return keywords.filter(Boolean);
  }

  private calculateSearchBoost(metadata: ExtractedMetadata): number {
    let boost = 1.0;
    
    if (metadata.commercialViability >= 8) boost += 0.3;
    if (metadata.universalAppeal >= 8) boost += 0.2;
    if (metadata.complexityScore <= 3) boost += 0.1; // Simple content often performs better
    
    return Math.min(2.0, boost);
  }

  // Additional helper methods to implement...
  private extractEmotionalTone(title: Title): string[] { return []; }
  private inferCharacterTypes(title: Title): string[] { return []; }
  private extractRelationshipDynamics(content: string): string[] { return []; }
  private extractPlotElements(title: Title): string[] { return []; }
  private determineStoryStructure(title: Title): 'linear' | 'non-linear' | 'episodic' | 'complex' { return 'linear'; }
  private extractConflictTypes(content: string): string[] { return []; }
  private analyzeTargetAudience(title: Title): any { return { ageGroups: [], interests: [], psychographics: [] }; }
  private determineMarketPositioning(title: Title): string[] { return []; }
  private analyzeCompetitors(comps?: string[]): string[] { return comps || []; }
  private calculateReadabilityScore(content: string): number { return 5; }
  private assessCommercialViability(title: Title): number { return 5; }
  private extractCulturalElements(title: Title): string[] { return []; }
  private assessUniversalAppeal(title: Title): number { return 5; }
  private assessLocalizationComplexity(culturalElements: string[]): 'low' | 'medium' | 'high' { return 'medium'; }
  private assessAdaptationPotential(title: Title): any { return { format: [], difficulty: 'medium', estimatedBudget: 'medium' }; }
  private generateRelatedQueries(title: Title): string[] { return []; }
  private generateSemanticClusters(content: string): Promise<string[]> { return Promise.resolve([]); }
  private getGenreSpecificInsights(genre: any): any { return { positioning: [], keywords: [] }; }
  private getFormatSpecificInsights(format: any): any { return { keywords: [] }; }
  private enhanceAudienceAnalysis(title: Title, analysis: ExtractedMetadata): any { return {}; }
  private buildKeywordDensity(keywords: string[]): any { return {}; }
}

export const metadataExtractionService = new MetadataExtractionService();