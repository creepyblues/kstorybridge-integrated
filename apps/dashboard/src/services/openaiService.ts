import OpenAI from 'openai';
import { titlesService, type Title } from './titlesService';
import { vectorSearchService } from './vectorSearchService';

interface LLMChatResponse {
  message: string;
  recommendedTitles: Title[];
  suggestedQueries?: string[];
  vectorSearchUsed?: boolean;
  searchContext?: {
    query?: string;
    results?: unknown[];
    metadata?: Record<string, unknown>;
  };
}

interface StandardErrorResponse {
  category: 'openai_api' | 'authentication' | 'authorization' | 'network' | 'timeout' | 'server' | 'database' | 'unknown';
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction?: string;
  originalError?: string;
}

class ChatbotErrorHandler {
  static categorizeError(error: unknown, environment: 'development' | 'production'): StandardErrorResponse {
    // Type check error object
    const errorObj = error as Record<string, unknown>;
    const errorMessage = errorObj?.message as string || String(error);
    const errorCode = errorObj?.code as string;

    // OpenAI API specific errors
    if (errorCode === 'invalid_api_key') {
      return {
        category: 'openai_api',
        message: 'Invalid OpenAI API key',
        userMessage: 'AI service configuration error. Please try again in a moment.',
        retryable: false,
        suggestedAction: 'Contact support if the issue persists.',
        originalError: errorMessage
      };
    }
    
    if (errorCode === 'insufficient_quota' || errorCode === 'rate_limit_exceeded') {
      return {
        category: 'openai_api', 
        message: 'OpenAI API quota or rate limit exceeded',
        userMessage: 'AI service is temporarily busy. Please wait a moment and try again.',
        retryable: true,
        suggestedAction: 'Try again in 1-2 minutes.',
        originalError: errorMessage
      };
    }
    
    if (errorMessage?.includes('rate limit')) {
      return {
        category: 'openai_api',
        message: 'Rate limit exceeded',
        userMessage: 'AI service is temporarily busy. Please wait a moment and try again.',
        retryable: true,
        suggestedAction: 'Try again in 1-2 minutes.',
        originalError: errorMessage
      };
    }
    
    // Authentication errors
    if (error.name === 'AuthenticationError' || error.message?.includes('Authentication required') || error.message?.includes('No valid session')) {
      return {
        category: 'authentication',
        message: 'Authentication failed',
        userMessage: 'Please sign in to use the AI chatbot.',
        retryable: true,
        suggestedAction: 'Try refreshing the page or signing in again.',
        originalError: errorMessage
      };
    }
    
    // Authorization errors
    if (error.message?.includes('not authorized') || error.message?.includes('Forbidden') || error.message?.includes('permission')) {
      return {
        category: 'authorization',
        message: 'User not authorized',
        userMessage: 'You do not have permission to use the AI chatbot.',
        retryable: false,
        suggestedAction: 'Contact support if you believe this is an error.',
        originalError: errorMessage
      };
    }
    
    // Network errors
    if (error.name === 'AbortError') {
      return {
        category: 'timeout',
        message: 'Request timed out',
        userMessage: 'The request took too long to process. Please try again with a shorter query.',
        retryable: true,
        suggestedAction: 'Try again with a simpler or shorter question.',
        originalError: errorMessage
      };
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('network')) {
      return {
        category: 'network',
        message: 'Network connectivity issue',
        userMessage: 'Network error. Please check your connection and try again.',
        retryable: true,
        suggestedAction: 'Check your internet connection and retry.',
        originalError: errorMessage
      };
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      return {
        category: 'timeout',
        message: 'Request timeout',
        userMessage: 'The request took too long to process. Please try again.',
        retryable: true,
        suggestedAction: 'Try again with a simpler query.',
        originalError: errorMessage
      };
    }
    
    // Server errors
    if (error.message?.includes('Function crashed') || error.message?.includes('FUNCTION_INVOCATION_FAILED') || error.message?.includes('Internal server error')) {
      return {
        category: 'server',
        message: 'Server error',
        userMessage: 'Service temporarily unavailable. Please try again in a moment.',
        retryable: true,
        suggestedAction: 'Try again in a few minutes.',
        originalError: errorMessage
      };
    }
    
    // Database errors
    if (error.message?.includes('column') || error.message?.includes('database') || error.message?.includes('schema')) {
      return {
        category: 'database',
        message: 'Database error',
        userMessage: 'There was an issue accessing the content database. Please try again.',
        retryable: true,
        suggestedAction: 'Try again in a moment.',
        originalError: errorMessage
      };
    }
    
    // Unknown errors
    return {
      category: 'unknown',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      suggestedAction: 'Try again, or contact support if the issue persists.',
      originalError: error.message
    };
  }
  
  static formatErrorForUser(errorResponse: StandardErrorResponse): string {
    let message = errorResponse.userMessage;
    
    if (errorResponse.suggestedAction) {
      message += ` ${errorResponse.suggestedAction}`;
    }
    
    return message;
  }
  
  static shouldRetry(errorResponse: StandardErrorResponse): boolean {
    return errorResponse.retryable;
  }
}

// Unified cache system (matches backend implementation)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  environment: string;
}

class UnifiedCacheManager {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (same as backend)
  private static caches = new Map<string, CacheEntry<unknown>>();
  
  static set<T>(key: string, data: T, environment: string): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      environment
    };
    this.caches.set(key, entry);
    
    console.log('💾 CACHE SET:', {
      key,
      dataSize: Array.isArray(data) ? data.length : typeof data,
      environment,
      timestamp: new Date(entry.timestamp).toISOString()
    });
  }
  
  static get<T>(key: string, environment: string): T | null {
    const entry = this.caches.get(key);
    
    if (!entry) {
      console.log('📦 CACHE MISS:', {
        key,
        reason: 'no-entry',
        environment
      });
      return null;
    }
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) >= this.CACHE_DURATION;
    
    if (isExpired) {
      this.caches.delete(key);
      console.log('📦 CACHE MISS:', {
        key,
        reason: 'expired',
        age: `${Math.round((now - entry.timestamp) / 1000)}s`,
        maxAge: `${Math.round(this.CACHE_DURATION / 1000)}s`,
        environment
      });
      return null;
    }
    
    console.log('📦 CACHE HIT:', {
      key,
      dataSize: Array.isArray(entry.data) ? entry.data.length : typeof entry.data,
      age: `${Math.round((now - entry.timestamp) / 1000)}s`,
      remainingTime: `${Math.round((this.CACHE_DURATION - (now - entry.timestamp)) / 1000)}s`,
      environment
    });
    
    return entry.data as T;
  }
  
  static clear(key?: string): void {
    if (key) {
      const deleted = this.caches.delete(key);
      console.log('🗑️ CACHE CLEAR:', { key, deleted });
    } else {
      const size = this.caches.size;
      this.caches.clear();
      console.log('🗑️ CACHE CLEAR ALL:', { clearedEntries: size });
    }
  }
  
  static getStats(): { totalEntries: number; keys: string[] } {
    return {
      totalEntries: this.caches.size,
      keys: Array.from(this.caches.keys())
    };
  }
}

// Unified title scoring system (matches backend implementation)
interface ScoredTitle extends Title {
  score: number;
  vectorScore: number;
  relevance: string;
}

class UnifiedTitleScorer {
  static scoreTitle(title: Title, query: string, queryWords: string[]): ScoredTitle {
    let score = 0;
    const vectorScore = 0; // Placeholder for future vector search
    
    const queryLower = query.toLowerCase();
    
    // Check for special query types
    const isActionQuery = queryLower.includes('action') || 
                         queryLower.includes('fight') || 
                         queryLower.includes('combat') ||
                         queryLower.includes('john wick') ||
                         queryLower.includes('martial') ||
                         queryLower.includes('assassin');
    
    // Create comprehensive searchable text from title (same as backend)
    const searchableText = [
      title.title_name_en,
      title.title_name_kr,
      title.synopsis,
      title.tagline,
      Array.isArray(title.genre) ? title.genre.join(' ') : title.genre,
      title.tone,
      Array.isArray(title.tags) ? title.tags.join(' ') : (title.tags || ''), // Handle tags field
      title.story_author,
      title.art_author,
      title.perfect_for,
      title.audience
    ].filter(Boolean).join(' ').toLowerCase();

    // Text-based scoring with count multipliers (same as backend)
    queryWords.forEach(word => {
      if (word.length <= 2) return; // Skip short words
      
      const count = (searchableText.match(new RegExp(word, 'g')) || []).length;
      score += count * 2; // Base score: 2 points per occurrence
      
      // Boost for exact matches in titles (+5 points)
      if (title.title_name_en?.toLowerCase().includes(word) || 
          title.title_name_kr?.toLowerCase().includes(word)) {
        score += 5;
      }
      
      // Boost for genre/tone matches (+3 points)
      const genreStr = Array.isArray(title.genre) ? title.genre.join(' ').toLowerCase() : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();
      
      if (genreStr.includes(word) || toneStr.includes(word)) {
        score += 3;
      }
    });
    
    // Special scoring for action queries (same as backend)
    if (isActionQuery) {
      const genreStr = Array.isArray(title.genre) ? title.genre.join(' ').toLowerCase() : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();
      
      if (genreStr.includes('action') || genreStr.includes('thriller')) score += 10;
      if (toneStr.includes('intense') || toneStr.includes('exciting')) score += 5;
      if (searchableText.includes('fight') || searchableText.includes('combat')) score += 3;
      if (searchableText.includes('assassin') || searchableText.includes('revenge')) score += 3;
    }

    // Additional scoring factors (same as backend)
    if (title.synopsis && title.synopsis.trim().length > 50) score += 1;
    if (title.tagline && title.tagline.trim().length > 10) score += 1;
    if (title.views && title.views > 10000) score += 1;
    if (title.completed) score += 1;
    
    // Legacy bonus: pitch deck boost (from old dev algorithm)
    if (title.pitch && title.pitch.trim()) {
      score += 2;
    }

    return { 
      ...title, 
      score, 
      vectorScore,
      relevance: score > 0 ? 'text-match' : 'none'
    } as ScoredTitle;
  }
  
  static findRelevantTitles(titles: Title[], query: string, maxResults: number = 8): ScoredTitle[] {
    if (!titles || titles.length === 0) {
      return [];
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Score each title
    const scoredTitles = titles.map(title => this.scoreTitle(title, query, queryWords));

    // Return top results sorted by score (same as backend)
    return scoredTitles
      .filter(title => title.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}

class OpenAIService {
  private client: OpenAI | null = null;
  private static readonly TITLES_CACHE_KEY = 'titles_database';

  constructor() {
    this.logEnvironmentSetup();
    this.initializeClient();
  }

  private shouldUseLocalBackend(): boolean {
    return import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';
  }

  private getBackendURL(): string {
    if (this.shouldUseLocalBackend()) {
      const localUrl = import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:3001';
      return localUrl;
    }
    return ''; // Use current domain for production
  }

  private shouldUseBackendAPI(): boolean {
    return import.meta.env.PROD || 
           import.meta.env.VITE_FORCE_OPENAI_PRODUCTION === 'true';
  }

  private logEnvironmentSetup() {
    const authBypass = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST;
    const forceProduction = import.meta.env.VITE_FORCE_OPENAI_PRODUCTION;
    const hasLocalApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
    const useLocalBackend = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';
    const localBackendUrl = import.meta.env.VITE_LOCAL_BACKEND_URL;
    
    // Determine execution path based on environment flags
    let executionPath = 'direct-client';
    if (import.meta.env.PROD) {
      executionPath = 'production-api';
    } else if (forceProduction === 'true' && useLocalBackend) {
      executionPath = 'local-backend-api';
    } else if (forceProduction === 'true') {
      executionPath = 'production-api';
    }
    
    console.log('🌍 OPENAI SERVICE ENVIRONMENT SETUP:', {
      environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT',
      mode: import.meta.env.MODE,
      executionPath: executionPath,
      openaiEnabled: import.meta.env.VITE_OPENAI_ENABLED === 'true',
      hasLocalApiKey: hasLocalApiKey,
      authBypass: authBypass === 'true',
      forceProduction: forceProduction === 'true',
      useLocalBackend: useLocalBackend,
      localBackendUrl: localBackendUrl || 'not-configured',
      willUseBackendAPI: import.meta.env.PROD || forceProduction === 'true',
      backendUrl: useLocalBackend ? localBackendUrl : 'production',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      url: window.location.href
    });
    
    // Log execution path details
    if (import.meta.env.PROD || forceProduction === 'true') {
      console.log('🔒 SECURE MODE: Using backend API endpoint for OpenAI requests');
      if (useLocalBackend) {
        console.log('📡 API Endpoint: Local Backend Server (' + localBackendUrl + '/api/openai-enhanced)');
        console.log('🧪 Testing Mode: Mirrors production behavior locally');
      } else {
        console.log('📡 API Endpoint: Production (/api/openai-enhanced)');
        console.log('🔴 Live Mode: Using production API');
      }
      console.log('🔐 Authentication: Supabase token required');
    } else {
      console.log('⚠️ DEV MODE: Using direct OpenAI client (insecure)');
      console.log('🔑 API Key Source: VITE_OPENAI_API_KEY environment variable');
      console.log('🚫 Security Warning: API key exposed to browser');
    }
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
    // ⚡ LAZY LOADING OPTIMIZATION: Don't load all titles on page init
    // This was causing 10+ second delays in production when loading thousands of titles
    // Now we only load titles when actually needed for chat responses
    console.log('⚡ FAST INIT: OpenAI service initialized with lazy loading (no upfront database load)');
    
    const environment = import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT';
    console.log(`🚀 Ready for ${environment} OpenAI requests with on-demand title loading`);
  }

  // Load titles only when needed for chat responses
  private async loadTitlesOnDemand(): Promise<Title[]> {
    const environment = import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT';
    
    // Try to get from unified cache first
    const cachedTitles = UnifiedCacheManager.get<Title[]>(OpenAIService.TITLES_CACHE_KEY, environment);
    
    if (cachedTitles && cachedTitles.length > 0) {
      console.log(`📦 CACHE HIT: Using ${cachedTitles.length} cached titles (no database query needed)`);
      return cachedTitles;
    }
    
    // Cache miss - need to load fresh data
    const startTime = Date.now();
    try {
      console.log('📚 ON-DEMAND LOADING: Loading titles for chat response...');
      
      // Add timeout for titles loading (reduced to 8 seconds for faster feedback)
      const timeoutPromise = new Promise<Title[]>((_, reject) => {
        setTimeout(() => reject(new Error('Titles loading timeout after 8 seconds')), 8000);
      });

      const titlesPromise = titlesService.getAllTitles();
      const freshTitles = await Promise.race([titlesPromise, timeoutPromise]);
      const loadTime = Date.now() - startTime;
      
      // Store in unified cache
      UnifiedCacheManager.set(OpenAIService.TITLES_CACHE_KEY, freshTitles, environment);
      
      console.log('📊 ON-DEMAND LOAD SUCCESS:', {
        titlesLoaded: freshTitles.length,
        loadTime: loadTime + 'ms',
        cacheUsed: false,
        sampleTitles: freshTitles.slice(0, 3).map(t => ({ 
          id: t.title_id?.substring(0, 8), 
          name: t.title_name_en 
        })),
        environment,
        cacheKey: OpenAIService.TITLES_CACHE_KEY,
        cacheStats: UnifiedCacheManager.getStats()
      });
      
      return freshTitles;
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.warn('📊 ON-DEMAND LOAD FAILED:', {
        error: error.message,
        loadTime: loadTime + 'ms',
        fallbackUsed: true,
        environment,
        cacheKey: OpenAIService.TITLES_CACHE_KEY
      });
      
      // Store empty array in cache to prevent repeated failures
      UnifiedCacheManager.set(OpenAIService.TITLES_CACHE_KEY, [], environment);
      return [];
    }
  }
  
  // Helper method to get titles from cache (replaces this.allTitles)
  private getAllTitlesFromCache(): Title[] {
    const environment = import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT';
    return UnifiedCacheManager.get<Title[]>(OpenAIService.TITLES_CACHE_KEY, environment) || [];
  }
  
  // Async version that loads titles if not cached
  private async getAllTitles(): Promise<Title[]> {
    return await this.loadTitlesOnDemand();
  }

  private createUnifiedKoreanIPContext(allTitles: Title[], relevantTitles: Title[], userQuery: string = ''): string {
    const totalTitles = allTitles.length;
    const genres = [...new Set(allTitles.map(t => Array.isArray(t.genre) ? t.genre.join(', ') : t.genre).filter(Boolean))].slice(0, 15);
    const formats = [...new Set(allTitles.map(t => t.content_format).filter(Boolean))];
    
    let context = `You are an expert assistant for KStoryBridge's Korean IP marketplace. Our database contains ${totalTitles} Korean titles including webtoons, novels, manhwa, and other content.

Available genres: ${genres.join(', ')}
Available formats: ${formats.join(', ')}

`;

    if (relevantTitles && relevantTitles.length > 0) {
      context += `Most relevant titles from our database for this query:\n\n`;
      
      relevantTitles.slice(0, 6).forEach((title, index) => {
        context += `${index + 1}. "${title.title_name_en || title.title_name_kr}"`;
        if (title.title_name_en && title.title_name_kr) {
          context += ` (${title.title_name_kr})`;
        }
        context += `\n`;
        if (title.synopsis) context += `   Synopsis: ${title.synopsis.substring(0, 150)}...\n`;
        if (title.genre) context += `   Genre: ${Array.isArray(title.genre) ? title.genre.join(', ') : title.genre}\n`;
        if (title.tone) context += `   Tone: ${title.tone}\n`;
        if (title.story_author || title.art_author) context += `   Author: ${title.story_author || title.art_author}\n`;
        context += `\n`;
      });
    } else {
      // Fallback: provide sample titles when no specific matches
      const sampleTitles = allTitles.slice(0, 8);
      
      if (userQuery && userQuery.trim()) {
        context += `IMPORTANT: No exact matches for "${userQuery}" in our database.\n`;
        context += `You MUST still recommend titles from our collection. Here are titles to recommend instead:\n\n`;
      } else {
        context += `Sample titles from our database:\n\n`;
      }
      
      sampleTitles.forEach((title, index) => {
        context += `${index + 1}. "${title.title_name_en || title.title_name_kr}"`;
        if (title.title_name_kr && title.title_name_en) {
          context += ` (${title.title_name_kr})`;
        }
        context += `\n`;
        if (title.genre) context += `   Genre: ${Array.isArray(title.genre) ? title.genre.join(', ') : title.genre}\n`;
        if (title.tone) context += `   Tone: ${title.tone}\n`;
        if (title.synopsis) context += `   Synopsis: ${title.synopsis.substring(0, 100)}...\n`;
        context += `\n`;
      });
    }

    context += `
Your role:
1. Understand user preferences and intent  
2. Recommend specific Korean IPs that match their criteria using the EXACT title names from the numbered list above
3. Explain WHY each recommendation fits their request
4. Ask clarifying questions to better understand their taste
5. Suggest related searches they might be interested in

CRITICAL: Always use the exact title names from the numbered list above. Do not create or modify title names.
Always be enthusiastic and knowledgeable about Korean content!`;

    return context;
  }

  // Legacy method for backward compatibility - now uses unified context
  private createKoreanIPContext(): string {
    console.log('⚠️ Using legacy createKoreanIPContext - consider migrating to createUnifiedKoreanIPContext');
    return this.createUnifiedKoreanIPContext(this.allTitles, [], '');
  }

  private async findRelevantTitlesWithVector(query: string, userId?: string, sessionId?: string): Promise<{ titles: Title[], vectorSearchUsed: boolean, searchContext?: { query: string; results: unknown[]; metadata?: Record<string, unknown>; } }> {
    try {
      // Try vector search first if available
      console.log('🔍 Attempting vector search for:', query.substring(0, 50) + '...', {
        hasUserId: !!userId,
        hasSessionId: !!sessionId,
        userIdPreview: userId?.substring(0, 8) + '...' || 'null',
        sessionIdPreview: sessionId?.substring(0, 8) + '...' || 'null'
      });
      
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
        
        // Convert vector results to Title format and add scores using batch operation
        const titleIds = vectorResults.map(result => result.title_id);
        console.log(`📚 Fetching ${titleIds.length} titles in batch for vector results`);

        const fullTitles = await titlesService.getTitlesByIds(titleIds);

        // Map back to include scores from vector results
        const vectorTitles = vectorResults.map(result => {
          const fullTitle = fullTitles.find(title => title.title_id === result.title_id);
          if (fullTitle) {
            return {
              ...fullTitle,
              score: Math.round(result.similarity * 100) // Convert similarity to score
            };
          }
          return null;
        });

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
      console.warn('⚠️ Vector search failed, falling back to text search:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
        name: error.name,
        cause: error.cause,
        hasUserId: !!userId,
        hasSessionId: !!sessionId
      });
      
      // Log more details for debugging
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('🗄️ Database schema issue detected:', error.message);
        console.error('🔧 Consider running database migrations or updating the vector search function');
      }
      
      if (error.message?.includes('Cannot read properties of null')) {
        console.error('🚨 Null pointer error in vector search - likely related to null user/session ID handling');
      }
    }

    // Fallback to traditional text-based search
    console.log('📝 Using traditional text-based search');
    try {
      const legacyTitles = await this.findRelevantTitlesLegacy(query);
      return {
        titles: Array.isArray(legacyTitles) ? legacyTitles : [],
        vectorSearchUsed: false,
        searchContext: {
          searchType: 'text_fallback',
          reason: 'vector_search_failed'
        }
      };
    } catch (legacyError) {
      console.error('❌ Legacy search also failed:', legacyError);
      // Return empty result as absolute fallback
      return {
        titles: [],
        vectorSearchUsed: false,
        searchContext: {
          searchType: 'empty_fallback',
          reason: 'all_search_methods_failed'
        }
      };
    }
  }

  // Legacy method - now uses unified scoring system
  private async findRelevantTitlesLegacy(query: string): Promise<Title[]> {
    const allTitles = await this.getAllTitles(); // Load titles on-demand
    console.log('⚠️ Using legacy findRelevantTitlesLegacy - now uses UnifiedTitleScorer');
    
    // Use unified scoring system (matches production)
    return UnifiedTitleScorer.findRelevantTitles(allTitles, query, 6); // Keep legacy 6 result limit
  }

  async generateChatResponse(userQuery: string, conversationHistory: string[] = [], userId?: string, sessionId?: string): Promise<LLMChatResponse> {
    const requestId = Date.now().toString(36);
    const startTime = Date.now();
    
    // Determine execution path
    const useBackend = this.shouldUseBackendAPI();
    const useLocalBackend = this.shouldUseLocalBackend();
    
    let executionPath = 'direct-client';
    if (useBackend && useLocalBackend) {
      executionPath = 'local-backend-api';
    } else if (useBackend) {
      executionPath = 'production-api';
    }
    
    // Log request start with detailed context
    console.log(`🔄 [${requestId}] REQUEST START:`, {
      environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT',
      executionPath: executionPath,
      query: userQuery.substring(0, 50) + '...',
      queryLength: userQuery.length,
      historyLength: conversationHistory.length,
      userId: userId?.substring(0, 8) + '...',
      sessionId: sessionId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      hasDirectClient: !!this.client,
      useBackend: useBackend,
      useLocalBackend: useLocalBackend,
      backendUrl: useLocalBackend ? this.getBackendURL() : 'production',
      cacheStats: UnifiedCacheManager.getStats()
    });

    // Use backend API if configured
    if (useBackend) {
      if (useLocalBackend) {
        console.log(`🧪 [${requestId}] Routing to LOCAL backend API for testing`);
      } else {
        console.log(`📡 [${requestId}] Routing to PRODUCTION backend API`);
      }
      return this.generateChatResponseViaAPI(userQuery, conversationHistory, userId, sessionId, requestId);
    }

    // Development: use direct client
    console.log(`⚡ [${requestId}] Using direct OpenAI client`);
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please check your API key configuration.');
    }

    // Skip the old initialize() call that loaded all titles upfront
    // Now using lazy loading for better performance

    try {
      // Load titles on-demand (this will be cached after first request)
      console.log(`📚 [${requestId}] Loading titles on-demand for chat context...`);
      const allTitles = await this.getAllTitles();
      
      // Find relevant titles first to create proper context
      console.log(`🔍 [${requestId}] Finding relevant titles for context...`);
      const searchResult = await this.findRelevantTitlesWithVector(userQuery, userId, sessionId);
      
      // Defensive check for searchResult
      if (!searchResult) {
        throw new Error('Search result is undefined - fallback search failed');
      }
      
      // Ensure searchResult.titles is an array
      const relevantTitles = Array.isArray(searchResult.titles) ? searchResult.titles : [];
      
      // Create unified context with actual search results (same as production)
      const context = this.createUnifiedKoreanIPContext(allTitles, relevantTitles, userQuery);
      
      console.log(`🔧 [${requestId}] Context created:`, {
        contextMethod: 'unified-korean-ip-context',
        allTitlesCount: allTitles.length,
        relevantTitlesCount: relevantTitles.length,
        vectorSearchUsed: searchResult.vectorSearchUsed,
        contextLength: context.length,
        cacheStats: UnifiedCacheManager.getStats()
      });
      
      const historyContext = conversationHistory.length > 0 
        ? `\n\nConversation history:\n${conversationHistory.join('\n')}` 
        : '';

      const prompt = `${context}${historyContext}

You are Alex, an enthusiastic Korean content curator at KStoryBridge who absolutely loves discussing Korean entertainment. You're chatting with someone who shares your passion for discovering amazing stories.

🎭 Your Personality:
- Genuinely excited about Korean stories and culture
- Speak like a knowledgeable friend, not a database
- Use natural expressions: "Oh, you'd love this!", "I think you might really enjoy...", "That reminds me of..."
- Ask engaging questions: "Have you tried anything like that before?", "What drew you to that genre?"
- Share brief cultural insights when relevant

💬 Communication Style:
- Natural conversation flow - no rigid formatting or mandatory sections
- Respond to the user's emotions and enthusiasm
- Use casual transitions between topics
- Sound excited about recommendations without being pushy
- Ask follow-up questions to keep the conversation engaging

🎯 Recommendation Approach:
- Start by connecting emotionally with what the user is looking for
- Naturally weave in 2-3 title suggestions from our database when relevant
- Use exact title names from the numbered list above, but mention them conversationally
- If we don't have exact matches, acknowledge this naturally: "We don't have that specific one, but based on what you're looking for, I think you'd really enjoy..."
- Explain appeal in personal terms, not just features
- Never apologize for what we don't have - get excited about what we do have

User just said: "${userQuery}"

Respond as if you're having a friendly, engaging conversation about Korean entertainment. Be natural, enthusiastic, and helpful while mentioning relevant titles from our collection when appropriate.`;

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
        max_tokens: 700, // Slightly more tokens for conversational responses
        temperature: 0.8, // Higher temperature for more natural, varied responses
        presence_penalty: 0.3, // Encourage diverse vocabulary
        frequency_penalty: 0.2, // Reduce repetition for more natural flow
      });

      const completion = await Promise.race([apiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;

      const aiResponse = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      console.log(`✅ [${requestId}] Received response from OpenAI`);

      // Extract suggested queries from the AI response (simple parsing)
      const suggestedQueries = this.extractSuggestedQueries(aiResponse);

      // Use AI response as-is without additional enhancement text
      const enhancedResponse = aiResponse;

      const responseTime = Date.now() - startTime;
      
      // Log successful response details
      console.log(`✅ [${requestId}] RESPONSE COMPLETE (DEV):`, {
        environment: 'DEVELOPMENT',
        executionPath: 'direct-client',
        responseTime: responseTime + 'ms',
        aiResponseLength: aiResponse.length,
        titlesCount: relevantTitles.length,
        vectorSearchUsed: searchResult.vectorSearchUsed,
        suggestedQueriesCount: suggestedQueries.length,
        responsePreview: aiResponse.substring(0, 100) + '...',
        titleIds: relevantTitles.map(t => t.title_id?.substring(0, 8)),
        contextMethod: 'unified-korean-ip-context',
        allTitlesInContext: allTitles.length,
        relevantTitlesInContext: relevantTitles.length,
        openaiTokens: completion.usage?.total_tokens || 0
      });

      return {
        message: enhancedResponse,
        recommendedTitles: relevantTitles,
        suggestedQueries,
        vectorSearchUsed: searchResult.vectorSearchUsed,
        searchContext: searchResult.searchContext,
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      
      // Use standardized error handling
      const standardError = ChatbotErrorHandler.categorizeError(error, 'development');
      const userMessage = ChatbotErrorHandler.formatErrorForUser(standardError);
      
      console.error(`❌ [${requestId}] OPENAI API ERROR (DEV):`, {
        environment: 'DEVELOPMENT',
        executionPath: 'direct-client',
        errorCategory: standardError.category,
        errorMessage: standardError.message,
        userMessage: userMessage,
        retryable: standardError.retryable,
        originalError: errorMessage,
        code: error.code,
        status: error.status,
        type: error.type,
        responseTime: responseTime + 'ms',
        query: userQuery.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
      
      throw new Error(userMessage);
    }
  }

  private async generateChatResponseViaAPI(userQuery: string, conversationHistory: string[] = [], userId?: string, sessionId?: string, requestId?: string): Promise<LLMChatResponse> {
    const currentRequestId = requestId || Date.now().toString(36);
    const startTime = Date.now();
    
    try {
      console.log(`🔒 [${currentRequestId}] Using secure backend API for OpenAI request...`);
      
      // Get the current user's auth token
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      
      console.log(`🔍 [${currentRequestId}] Session details:`, {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at
      });
      
      if (!session?.access_token) {
        throw new Error('Authentication required - No valid session found');
      }

      // Call the backend API with cache busting and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Determine API endpoint
      const backendUrl = this.getBackendURL();
      const apiEndpoint = backendUrl ? `${backendUrl}/api/openai-enhanced` : '/api/openai-enhanced';
      
      console.log(`🌐 [${currentRequestId}] API Endpoint: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          query: userQuery,
          conversationHistory: conversationHistory.slice(-6), // Limit context to last 6 messages
          userId,
          timestamp: Date.now(), // Cache busting
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        
        // Handle specific HTTP status codes
        if (response.status === 401) {
          errorMessage = 'Authentication failed - Please sign in again';
        } else if (response.status === 403) {
          errorMessage = 'Access denied - You do not have permission to use the OpenAI chatbot';
        }
        
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          console.log('🔍 Backend API error response:', error);
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
        const responseText = await response.text();
        console.log('🔍 Raw response preview:', responseText.substring(0, 200) + '...');
        
        if (!responseText || responseText.trim() === '') {
          throw new Error('Server returned empty response');
        }
        
        // Check if response looks like HTML error page
        if (responseText.trim().startsWith('<')) {
          console.error('❌ Received HTML instead of JSON:', responseText.substring(0, 300));
          throw new Error('Server configuration error - received HTML instead of JSON');
        }
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned malformed response. Please try again.');
      }
      console.log(`✅ [${currentRequestId}] Received response from backend API`);

      // Enhanced backend API now provides titles directly from database
      const recommendedTitles = data.recommendedTitles || [];
      const databaseStats = data.databaseStats || {};
      const responseTime = Date.now() - startTime;
      
      // Convert backend titles to frontend Title format
      const formattedTitles = recommendedTitles.map(title => ({
        title_id: title.title_id,
        title_name_en: title.title_name_en,
        title_name_kr: title.title_name_kr,
        synopsis: title.synopsis,
        genre: title.genre,
        tone: title.tone,
        author: title.author,
        title_image: title.title_image,
        score: title.score || 0
      }));

      // Log successful response details
      console.log(`✅ [${currentRequestId}] RESPONSE COMPLETE (PROD):`, {
        environment: 'PRODUCTION',
        executionPath: 'backend-api',
        responseTime: responseTime + 'ms',
        aiResponseLength: data.message?.length || 0,
        titlesCount: formattedTitles.length,
        vectorSearchUsed: databaseStats.vectorSearchUsed || false,
        suggestedQueriesCount: (data.suggestedQueries || []).length,
        responsePreview: data.message?.substring(0, 100) + '...' || 'No message',
        titleIds: formattedTitles.map(t => t.title_id?.substring(0, 8)),
        contextMethod: databaseStats.contextMethod || 'unified-korean-ip-context',
        databaseTotalTitles: databaseStats.totalTitles,
        databaseRelevantTitles: databaseStats.relevantTitles,
        openaiTokens: data.usage?.total_tokens || 0
      });

      return {
        message: data.message,
        recommendedTitles: formattedTitles,
        suggestedQueries: data.suggestedQueries || [],
        vectorSearchUsed: databaseStats.vectorSearchUsed || false,
        searchContext: {
          totalTitles: databaseStats.totalTitles,
          relevantTitles: databaseStats.relevantTitles,
          source: 'backend-database'
        },
      };

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      
      // Use standardized error handling
      const standardError = ChatbotErrorHandler.categorizeError(error, 'production');
      const userMessage = ChatbotErrorHandler.formatErrorForUser(standardError);
      
      console.error(`❌ [${currentRequestId}] BACKEND API ERROR (PROD):`, {
        environment: 'PRODUCTION',
        executionPath: 'backend-api',
        errorCategory: standardError.category,
        errorMessage: standardError.message,
        userMessage: userMessage,
        retryable: standardError.retryable,
        originalError: errorMessage,
        name: error.name,
        status: error.status,
        responseTime: responseTime + 'ms',
        query: userQuery.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
        stack: error.stack?.split('\n').slice(0, 3),
        cause: error.cause,
        type: typeof error
      });
      
      throw new Error(userMessage);
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

      const response = await Promise.race([apiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
      
      console.log('✅ OpenAI connection test successful:', response.choices[0].message.content);
      return response.choices.length > 0;
    } catch (error: unknown) {
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