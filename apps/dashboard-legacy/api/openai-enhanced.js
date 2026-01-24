// Enhanced OpenAI Chat API with database integration and vector search
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Unified cache system (matches frontend implementation)
class UnifiedCacheManager {
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  static caches = new Map();
  
  static set(key, data, environment) {
    const entry = {
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
  
  static get(key, environment) {
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
    
    return entry.data;
  }
  
  static clear(key) {
    if (key) {
      const deleted = this.caches.delete(key);
      console.log('🗑️ CACHE CLEAR:', { key, deleted });
    } else {
      const size = this.caches.size;
      this.caches.clear();
      console.log('🗑️ CACHE CLEAR ALL:', { clearedEntries: size });
    }
  }
  
  static getStats() {
    return {
      totalEntries: this.caches.size,
      keys: Array.from(this.caches.keys())
    };
  }
}

// Legacy cache variables (kept for backward compatibility)
let titlesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Standardized error handler (matches frontend implementation)
class ChatbotErrorHandler {
  static categorizeError(error, environment = 'production') {
    // OpenAI API specific errors
    if (error.code === 'invalid_api_key' || error.message?.includes('api key')) {
      return {
        category: 'openai_api',
        message: 'Invalid OpenAI API key',
        userMessage: 'AI service configuration error. Please try again in a moment.',
        retryable: false,
        suggestedAction: 'Contact support if the issue persists.',
        originalError: error.message
      };
    }
    
    if (error.code === 'insufficient_quota' || error.code === 'rate_limit_exceeded' || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return {
        category: 'openai_api', 
        message: 'OpenAI API quota or rate limit exceeded',
        userMessage: 'AI service is temporarily busy. Please wait a moment and try again.',
        retryable: true,
        suggestedAction: 'Try again in 1-2 minutes.',
        originalError: error.message
      };
    }
    
    // Authentication errors
    if (error.name === 'AuthenticationError' || error.message?.includes('Unauthorized') || error.message?.includes('Invalid token')) {
      return {
        category: 'authentication',
        message: 'Authentication failed',
        userMessage: 'Please sign in to use the AI chatbot.',
        retryable: true,
        suggestedAction: 'Try refreshing the page or signing in again.',
        originalError: error.message
      };
    }
    
    // Authorization errors  
    if (error.message?.includes('Forbidden') || error.message?.includes('not authorized')) {
      return {
        category: 'authorization',
        message: 'User not authorized',
        userMessage: 'You do not have permission to use the AI chatbot.',
        retryable: false,
        suggestedAction: 'Contact support if you believe this is an error.',
        originalError: error.message
      };
    }
    
    // Database errors
    if (error.message?.includes('column') || error.message?.includes('database') || error.message?.includes('schema') || error.message?.includes('relation')) {
      return {
        category: 'database',
        message: 'Database error',
        userMessage: 'There was an issue accessing the content database. Please try again.',
        retryable: true,
        suggestedAction: 'Try again in a moment.',
        originalError: error.message
      };
    }
    
    // Server/Function errors
    if (error.message?.includes('Function') || error.message?.includes('timeout') || error.message?.includes('Internal server')) {
      return {
        category: 'server',
        message: 'Server error',
        userMessage: 'Service temporarily unavailable. Please try again in a moment.',
        retryable: true,
        suggestedAction: 'Try again in a few minutes.',
        originalError: error.message
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
  
  static formatErrorForUser(errorResponse) {
    let message = errorResponse.userMessage;
    
    if (errorResponse.suggestedAction) {
      message += ` ${errorResponse.suggestedAction}`;
    }
    
    return message;
  }
}

module.exports = async function handler(req, res) {
  try {
    console.log('🚀 Enhanced OpenAI Chat API started');
    console.log('📊 Request details:', {
      method: req.method,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      hasAuth: !!req.headers.authorization
    });

    // Environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('🔧 Environment check:', {
      OPENAI_API_KEY: !!OPENAI_API_KEY ? 'present' : 'missing',
      SUPABASE_URL: !!SUPABASE_URL ? 'present' : 'missing',
      SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY ? 'present' : 'missing'
    });

    // CORS headers
    const allowedOrigins = [
      'https://dashboard.kstorybridge.com',
      'http://localhost:8082',
      'http://localhost:8081',
      'http://localhost:3000',
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check environment variables
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        missing: {
          OPENAI_API_KEY: !OPENAI_API_KEY,
          SUPABASE_URL: !SUPABASE_URL,
          SUPABASE_SERVICE_KEY: !SUPABASE_SERVICE_KEY,
        }
      });
    }

    // Initialize clients
    let openai;
    try {
      openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      console.log('✅ OpenAI client initialized');
    } catch (initError) {
      console.error('❌ OpenAI client initialization failed:', initError);
      return res.status(500).json({
        error: 'OpenAI service configuration error',
        message: 'Failed to initialize AI service'
      });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Authentication
    console.log('🔐 Starting authentication...');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header provided');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token received, length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user returned');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Check authorized users - Allow all buyers, maintain admin access
    console.log('✅ User authenticated:', user.email);

    // Admin users (always allowed)
    const ADMIN_USERS = ['sungho@kstorybridge.com', 'kevin@sandstoneartists.com'];
    if (ADMIN_USERS.includes(user.email)) {
      console.log('✅ Admin user authorized for OpenAI chatbot:', user.email);
    } else {
      // Check if user is a buyer
      console.log('🔍 Checking buyer authorization for:', user.email);
      const { data: userProfile, error: profileError } = await supabase
        .from('user_buyers')
        .select('tier, email')
        .eq('email', user.email)
        .single();

      if (profileError || !userProfile) {
        console.log('❌ User is not a buyer:', user.email, profileError?.message);
        return res.status(403).json({ error: 'Forbidden - Chat is only available for buyers' });
      }

      console.log('✅ Buyer user authorized for OpenAI chatbot:', {
        email: user.email,
        tier: userProfile.tier
      });
    }

    // Get request data
    const { query, conversationHistory } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`📝 Processing query: "${query}"`);

    // Load titles from database (with caching)
    let titles = await loadTitlesFromDatabase(supabase);
    console.log(`📚 Loaded ${titles.length} titles from database`);
    
    // If no titles loaded, try once more without cache
    if (!titles || titles.length === 0) {
      console.log('⚠️ No titles loaded, clearing cache and retrying...');
      titlesCache = null;
      cacheTimestamp = null;
      titles = await loadTitlesFromDatabase(supabase);
      console.log(`📚 Retry loaded ${titles.length} titles from database`);
    }

    // Find relevant titles using vector search and text matching
    let relevantTitles = await findRelevantTitles(query, titles, openai);
    console.log(`🎯 Found ${relevantTitles.length} relevant titles`);

    // Create unified context for AI with our database titles (same as frontend)
    const databaseContext = createUnifiedKoreanIPContext(titles, relevantTitles, query);
    
    console.log('🔧 Context created:', {
      contextMethod: 'unified-korean-ip-context',
      allTitlesCount: titles.length,
      relevantTitlesCount: relevantTitles.length,
      contextLength: databaseContext.length
    });
    
    // Prepare conversation context
    const historyContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nConversation history:\n${conversationHistory.slice(-6).join('\n')}` 
      : '';

    const prompt = `${databaseContext}${historyContext}

User Query: "${query}"

CRITICAL INSTRUCTIONS:
You are KStoryBridge's database assistant. Your PRIMARY and MOST IMPORTANT goal is to recommend titles from OUR DATABASE COLLECTION. 

⚠️ MANDATORY TITLE NAMING RULES:
- ONLY use the EXACT title names provided in the database context above
- DO NOT create, modify, or invent new title names
- Copy the title names EXACTLY as they appear in the numbered list above
- If a title has both English and Korean names, use the English name in quotes
- Example: Use "Terrarium Adventure" NOT "Alone on the Island" or any other variation

FORMATTING RULES:
- DO NOT use asterisks (*) for bold or emphasis  
- DO NOT use markdown formatting like **text** or *text*
- Use plain text only
- Use emoji icons (📚 🌟) for section headers
- Use quotation marks around the EXACT title names from the database
- Use regular text for all descriptions

CONTENT RULES:
1. ALWAYS start with: "I completely understand that you're looking for something as [describe user's interest]. You're in for a treat because there are some fantastic Korean IPs that capture [relevant themes]. Here are my top recommendations:"
2. ALWAYS recommend database titles FIRST using their EXACT names from the numbered list above
3. ONLY mention external/market titles if we have ZERO relevant matches in our database
4. When mentioning external titles, ALWAYS preface with: "We don't currently have [specific title] in our collection, but..."

Response Structure:

📚 From Our KStoryBridge Collection:
[MANDATORY - Use EXACT title names from the numbered database list above]

You MUST format each recommendation exactly like this:
1. "[COPY THE EXACT ENGLISH TITLE FROM THE DATABASE LIST ABOVE]" ([Korean name if available])
   • Why it matches your interest: [explanation based on synopsis and genre]
   • Genre: [copy exact genre from database]
   • Tone: [copy exact tone from database]

EXAMPLE FORMAT (using the actual database titles provided above):
1. "Terrarium Adventure"
   • Why it matches your interest: This story follows...
   • Genre: SF/Action/Adventure  
   • Tone: Suspenseful

🌟 Not Yet in Our Collection:
[ONLY include this section if we have NO relevant database matches]
[If included, explicitly state these are NOT available in our database]

Additional Guidelines:
- If user asks for something specific (like "John Wick"), first acknowledge if we don't have it, then immediately pivot to what we DO have
- Example: "While we don't have John Wick in our collection, we have these excellent action titles available:"
- Always emphasize what IS available in our database
- Be enthusiastic about our collection
- Ask follow-up questions to help find more titles in our database

Remember: Your job is to promote and recommend titles from OUR DATABASE, not to provide general Korean content recommendations.`;

    // Call OpenAI API
    let completion, aiResponse;
    try {
      console.log(`🤖 Calling OpenAI with prompt length: ${prompt.length} characters`);
      
      // Add timeout protection (reduced for reliability)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timeout after 20 seconds')), 20000);
      });
      
      const apiPromise = openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500, // Reduced for faster responses
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      completion = await Promise.race([apiPromise, timeoutPromise]);
      
      aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      console.log(`✅ OpenAI API SUCCESS: Response received, length: ${aiResponse.length} characters`);
      
    } catch (openaiError) {
      // Use standardized error handling
      const standardError = ChatbotErrorHandler.categorizeError(openaiError, 'production');
      
      console.error('❌ OpenAI API Error (STANDARDIZED):', {
        category: standardError.category,
        message: standardError.message,
        userMessage: standardError.userMessage,
        retryable: standardError.retryable,
        originalError: standardError.originalError,
        name: openaiError.name,
        code: openaiError.code,
        status: openaiError.status,
        type: openaiError.type,
        stack: openaiError.stack?.substring(0, 200)
      });
      
      // For OpenAI errors, provide fallback response instead of failing completely
      if (standardError.category === 'openai_api') {
        console.log('🔄 Falling back to database-only response due to OpenAI error');
        
        // Provide fallback response with database titles
        aiResponse = `I apologize, but our AI service is temporarily experiencing issues. However, I can still help you discover great Korean content from our database!\n\n📚 From Our KStoryBridge Collection:\n`;
        if (relevantTitles.length > 0) {
          relevantTitles.slice(0, 3).forEach((title, index) => {
            aiResponse += `${index + 1}. "${title.title_name_en || title.title_name_kr}" - ${title.genre || 'Korean content'}\n`;
          });
          aiResponse += `\nThese titles were selected based on your search. Try asking again in a moment for AI-powered recommendations!`;
        } else {
          aiResponse += `We have ${titles.length} Korean titles in our collection. Please refine your search to find specific recommendations, or try again in a moment for AI-powered suggestions.`;
        }
        
        completion = { usage: null }; // Fallback for usage stats
      } else {
        // For non-OpenAI errors, throw to be handled by global error handler
        throw openaiError;
      }
    }

    // Post-process AI response to ensure database title names are used
    let processedResponse = aiResponse;
    if (relevantTitles.length > 0) {
      console.log('🔧 Post-processing AI response to fix title names...');
      processedResponse = replaceWithDatabaseTitles(aiResponse, relevantTitles);
    }

    // Extract suggested queries
    const suggestedQueries = extractSuggestedQueries(processedResponse);

    console.log('✅ Sending enhanced response with database context');
    console.log('📤 RESPONSE SUMMARY:', {
      messageLength: aiResponse.length,
      titleCount: relevantTitles.length,
      usesAI: aiResponse.includes('AI-powered semantic search'),
      hasFallback: aiResponse.includes('From Our KStoryBridge Collection'),
      firstTitleHasId: relevantTitles[0]?.title_id ? 'YES' : 'NO'
    });

    return res.status(200).json({
      message: processedResponse,
      recommendedTitles: relevantTitles.map(title => ({
        title_id: title.title_id || '',
        title_name_en: title.title_name_en || '',
        title_name_kr: title.title_name_kr || '',
        synopsis: title.synopsis || '',
        genre: title.genre || '',
        tone: title.tone || '',
        author: title.story_author || title.art_author || '',
        title_image: title.title_image || '',
        pitch: title.pitch || '',
        score: title.score || 0
      })),
      suggestedQueries: suggestedQueries || [],
      databaseStats: {
        totalTitles: titles.length,
        relevantTitles: relevantTitles.length,
        vectorSearchUsed: false, // Vector search not implemented yet
        contextMethod: 'unified-korean-ip-context'
      },
      usage: completion.usage,
    });

  } catch (error) {
    // Use standardized error handling
    const standardError = ChatbotErrorHandler.categorizeError(error, 'production');
    const userMessage = ChatbotErrorHandler.formatErrorForUser(standardError);
    
    console.error('❌ Enhanced OpenAI API Global Error (STANDARDIZED):', {
      category: standardError.category,
      message: standardError.message,
      userMessage: userMessage,
      retryable: standardError.retryable,
      originalError: standardError.originalError,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5),
      cause: error.cause,
      type: typeof error,
      timestamp: new Date().toISOString()
    });
    
    // Determine HTTP status code based on error category
    let statusCode = 500;
    if (standardError.category === 'authentication') {
      statusCode = 401;
    } else if (standardError.category === 'authorization') {
      statusCode = 403;
    } else if (standardError.category === 'network' || standardError.category === 'timeout') {
      statusCode = 408;
    } else if (standardError.category === 'openai_api') {
      statusCode = 503; // Service unavailable
    }
    
    return res.status(statusCode).json({ 
      error: userMessage,
      category: standardError.category,
      retryable: standardError.retryable,
      timestamp: new Date().toISOString(),
    });
  }
};

// Load titles from database with unified caching
async function loadTitlesFromDatabase(supabase) {
  const environment = 'PRODUCTION';
  const cacheKey = 'titles_database';
  
  // Try unified cache first
  const cachedTitles = UnifiedCacheManager.get(cacheKey, environment);
  if (cachedTitles && cachedTitles.length > 0) {
    return cachedTitles;
  }

  try {
    console.log('🔄 Loading fresh titles from database...');
    
    // First try a simple query to test connection
    const { data: testData, error: testError } = await supabase
      .from('titles')
      .select('title_id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      // Store empty array in cache to prevent repeated failures
      UnifiedCacheManager.set(cacheKey, [], environment);
      return [];
    }
    
    // Now load full data with proper column names
    const { data: titles, error } = await supabase
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        tagline,
        genre,
        tone,
        keywords,
        story_author,
        art_author,
        content_format,
        completed,
        rights,
        perfect_for,
        audience,
        views,
        likes,
        rating,
        comps,
        title_image,
        pitch
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('❌ Database query error:', error.message);
      console.error('Full error:', error);
      // Store empty array in cache to prevent repeated failures
      UnifiedCacheManager.set(cacheKey, [], environment);
      return [];
    }

    if (!titles || titles.length === 0) {
      console.error('⚠️ No titles returned from database');
      // Store empty array in cache
      UnifiedCacheManager.set(cacheKey, [], environment);
      return [];
    }

    // Store successful result in unified cache
    UnifiedCacheManager.set(cacheKey, titles, environment);
    
    // Also update legacy cache for backward compatibility
    titlesCache = titles;
    cacheTimestamp = Date.now();
    
    console.log(`✅ Loaded ${titles.length} titles from database`, {
      cacheKey,
      environment,
      cacheStats: UnifiedCacheManager.getStats()
    });
    
    return titles;
  } catch (error) {
    console.error('❌ Failed to load titles:', error.message);
    console.error('Full error:', error);
    // Store empty array in cache to prevent repeated failures
    UnifiedCacheManager.set(cacheKey, [], environment);
    return [];
  }
}

// Unified title scoring system (matches frontend implementation)
class UnifiedTitleScorer {
  static scoreTitle(title, query, queryWords) {
    let score = 0;
    let vectorScore = 0; // Placeholder for future vector search
    
    const queryLower = query.toLowerCase();
    
    // Check for special query types (same as frontend)
    const isActionQuery = queryLower.includes('action') || 
                         queryLower.includes('fight') || 
                         queryLower.includes('combat') ||
                         queryLower.includes('john wick') ||
                         queryLower.includes('martial') ||
                         queryLower.includes('assassin');
    
    // Create comprehensive searchable text from title (same as frontend)
    const searchableText = [
      title.title_name_en,
      title.title_name_kr,
      title.synopsis,
      title.tagline,
      Array.isArray(title.genre) ? title.genre.join(' ') : title.genre,
      title.tone,
      Array.isArray(title.keywords) ? title.keywords.join(' ') : (title.keywords || ''),
      title.story_author,
      title.art_author,
      title.perfect_for,
      title.audience
    ].filter(Boolean).join(' ').toLowerCase();

    // Text-based scoring with count multipliers (same as frontend)
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
    
    // Special scoring for action queries (same as frontend)
    if (isActionQuery) {
      const genreStr = Array.isArray(title.genre) ? title.genre.join(' ').toLowerCase() : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();
      
      if (genreStr.includes('action') || genreStr.includes('thriller')) score += 10;
      if (toneStr.includes('intense') || toneStr.includes('exciting')) score += 5;
      if (searchableText.includes('fight') || searchableText.includes('combat')) score += 3;
      if (searchableText.includes('assassin') || searchableText.includes('revenge')) score += 3;
    }

    // Additional scoring factors (same as frontend)
    if (title.synopsis && title.synopsis.trim().length > 50) score += 1;
    if (title.tagline && title.tagline.trim().length > 10) score += 1;
    if (title.views && title.views > 10000) score += 1;
    if (title.completed) score += 1;
    
    // Legacy bonus: pitch deck boost (from old frontend algorithm)
    if (title.pitch && title.pitch.trim()) {
      score += 2;
    }

    return { 
      ...title, 
      score, 
      vectorScore,
      relevance: score > 0 ? 'text-match' : 'none'
    };
  }
  
  static findRelevantTitles(titles, query, maxResults = 8) {
    if (!titles || titles.length === 0) {
      return [];
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Score each title
    const scoredTitles = titles.map(title => this.scoreTitle(title, query, queryWords));

    // Return top results sorted by score (same as frontend)
    return scoredTitles
      .filter(title => title.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}

// Legacy function - now uses unified scoring system
async function findRelevantTitles(query, titles, openai) {
  console.log('⚠️ Using legacy findRelevantTitles - now uses UnifiedTitleScorer');
  
  // Use unified scoring system (matches frontend)
  return UnifiedTitleScorer.findRelevantTitles(titles, query, 8);
}

// Unified context creation function (matches frontend implementation)
function createUnifiedKoreanIPContext(allTitles, relevantTitles, userQuery = '') {
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
2. Recommend specific Korean IPs that match their criteria from our database
3. When recommending titles, use this EXACT format: "Title Name" (without any IDs or extra text)
4. Explain WHY each recommendation fits their request
5. Ask clarifying questions to better understand their taste
6. Suggest related searches they might be interested in

IMPORTANT FORMATTING RULES:
- Use only the English title name in quotes, e.g., "The Devil and His Sacrifice"
- Do NOT include IDs, Korean names in the quoted title
- You may mention the Korean name separately if relevant
- If the user asks for specific themes (like "human vs devil"), try to find titles that actually match those themes

Always be enthusiastic and knowledgeable about Korean content!`;

  return context;
}

// Legacy function for backward compatibility - redirects to unified function
function createDatabaseContext(allTitles, relevantTitles, userQuery = '') {
  console.log('⚠️ Using legacy createDatabaseContext - consider migrating to createUnifiedKoreanIPContext');
  return createUnifiedKoreanIPContext(allTitles, relevantTitles, userQuery);
}

// Extract suggested queries from AI response
function extractSuggestedQueries(aiResponse) {
  const suggestions = [];
  const lines = aiResponse.split('\n');
  
  lines.forEach(line => {
    if (line.includes('"') && (line.toLowerCase().includes('search') || line.toLowerCase().includes('try'))) {
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
  
  return suggestions.slice(0, 3);
}

// Replace any fictional titles in AI response with actual database titles
function replaceWithDatabaseTitles(aiResponse, relevantTitles) {
  // Don't do any replacement - let the AI response stay as is
  // The AI already has access to real titles in the context
  console.log('📝 Keeping original AI response without title replacement');
  return aiResponse;
}