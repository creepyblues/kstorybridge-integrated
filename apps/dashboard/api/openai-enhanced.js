// Enhanced OpenAI Chat API with database integration and vector search
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Cache for titles to avoid repeated database queries
let titlesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Check authorized users
    console.log('✅ User authenticated:', user.email);
    const ALLOWED_USERS = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];
    if (!ALLOWED_USERS.includes(user.email)) {
      console.log('❌ User not authorized:', user.email);
      return res.status(403).json({ error: 'Forbidden - User not authorized' });
    }
    console.log('✅ User authorized for OpenAI chatbot');

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

    // Create context for AI with our database titles
    const databaseContext = createDatabaseContext(titles, relevantTitles);
    
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
1. "EXACT_TITLE_FROM_DATABASE" (Korean name if available)
   • Why it matches your interest: [explanation]
   • Genre: [from database]
   • Tone: [from database]

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
      
      // Add AI-powered indicator to successful responses
      if (aiResponse && !aiResponse.includes('🎯 *Using AI-powered semantic search')) {
        aiResponse = `🎯 *Using AI-powered semantic search to find your perfect matches*\n\n${aiResponse}`;
      }
      
    } catch (openaiError) {
      console.error('❌ OpenAI API Error (DETAILED):', {
        name: openaiError.name,
        message: openaiError.message,
        code: openaiError.code,
        status: openaiError.status,
        type: openaiError.type,
        stack: openaiError.stack?.substring(0, 200),
        fullError: openaiError
      });
      
      // Log what we're about to return as fallback
      console.log('🔄 Falling back to database-only response due to OpenAI error');
      
      // Provide fallback response with database titles
      aiResponse = `Based on your query, here are titles from our KStoryBridge collection:\n\n📚 From Our KStoryBridge Collection:\n`;
      if (relevantTitles.length > 0) {
        relevantTitles.slice(0, 3).forEach((title, index) => {
          aiResponse += `${index + 1}. "${title.title_name_en || title.title_name_kr}" - ${title.genre || 'Korean content'}\n`;
        });
      } else {
        aiResponse += `We have ${titles.length} Korean titles in our collection. Please refine your search to find specific recommendations.\n`;
      }
      
      completion = { usage: null }; // Fallback for usage stats
    }

    // Extract suggested queries
    const suggestedQueries = extractSuggestedQueries(aiResponse);

    console.log('✅ Sending enhanced response with database context');
    console.log('📤 RESPONSE SUMMARY:', {
      messageLength: aiResponse.length,
      titleCount: relevantTitles.length,
      usesAI: aiResponse.includes('AI-powered semantic search'),
      hasFallback: aiResponse.includes('From Our KStoryBridge Collection'),
      firstTitleHasId: relevantTitles[0]?.title_id ? 'YES' : 'NO'
    });

    return res.status(200).json({
      message: aiResponse,
      recommendedTitles: relevantTitles.map(title => ({
        title_id: title.title_id || '',
        title_name_en: title.title_name_en || '',
        title_name_kr: title.title_name_kr || '',
        synopsis: title.synopsis || '',
        genre: title.genre || '',
        tone: title.tone || '',
        author: title.story_author || title.art_author || '',
        score: title.score || 0
      })),
      suggestedQueries: suggestedQueries || [],
      databaseStats: {
        totalTitles: titles.length,
        relevantTitles: relevantTitles.length,
        vectorSearchUsed: false // Vector search not implemented yet
      },
      usage: completion.usage,
    });

  } catch (error) {
    console.error('❌ Enhanced OpenAI API error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      cause: error.cause,
      type: typeof error
    });
    
    // More specific error messages
    let errorMessage = 'Internal server error';
    if (error.message?.includes('column')) {
      errorMessage = 'Database schema error';
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = 'AI service error';
    } else if (error.message?.includes('rate')) {
      errorMessage = 'Rate limit exceeded';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Load titles from database with caching
async function loadTitlesFromDatabase(supabase) {
  const now = Date.now();
  
  // Only use cache if it has actual titles (not empty)
  if (titlesCache && titlesCache.length > 0 && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`📦 Using cached titles (${titlesCache.length} titles)`);
    return titlesCache;
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
      // Don't cache empty results
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
        comps
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('❌ Database query error:', error.message);
      console.error('Full error:', error);
      // Don't cache empty results on error
      return [];
    }

    if (!titles || titles.length === 0) {
      console.error('⚠️ No titles returned from database');
      // Don't cache empty results
      return [];
    }

    // Only cache if we got actual titles
    titlesCache = titles;
    cacheTimestamp = now;
    
    console.log(`✅ Loaded ${titles.length} titles from database`);
    return titles;
  } catch (error) {
    console.error('❌ Failed to load titles:', error.message);
    console.error('Full error:', error);
    // Don't cache errors
    return [];
  }
}

// Find relevant titles using text matching and scoring
async function findRelevantTitles(query, titles, openai) {
  if (!titles || titles.length === 0) {
    return [];
  }

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  // Check for action-related keywords
  const isActionQuery = queryLower.includes('action') || 
                       queryLower.includes('fight') || 
                       queryLower.includes('combat') ||
                       queryLower.includes('john wick') ||
                       queryLower.includes('martial') ||
                       queryLower.includes('assassin');
  
  // Score each title based on relevance
  const scoredTitles = titles.map(title => {
    let score = 0;
    let vectorScore = 0; // Placeholder for future vector search
    
    // Create searchable text from title
    const searchableText = [
      title.title_name_en,
      title.title_name_kr,
      title.synopsis,
      title.tagline,
      Array.isArray(title.genre) ? title.genre.join(' ') : title.genre,
      title.tone,
      Array.isArray(title.keywords) ? title.keywords.join(' ') : title.keywords,
      title.story_author,
      title.art_author,
      title.perfect_for,
      title.audience
    ].filter(Boolean).join(' ').toLowerCase();

    // Text-based scoring
    queryWords.forEach(word => {
      const count = (searchableText.match(new RegExp(word, 'g')) || []).length;
      score += count * 2;
      
      // Boost for exact matches in titles
      if (title.title_name_en?.toLowerCase().includes(word) || 
          title.title_name_kr?.toLowerCase().includes(word)) {
        score += 5;
      }
      
      // Boost for genre/tone matches
      const genreStr = Array.isArray(title.genre) ? title.genre.join(' ').toLowerCase() : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();
      
      if (genreStr.includes(word) || toneStr.includes(word)) {
        score += 3;
      }
    });
    
    // Special scoring for action queries
    if (isActionQuery) {
      const genreStr = Array.isArray(title.genre) ? title.genre.join(' ').toLowerCase() : (title.genre || '').toLowerCase();
      const toneStr = (title.tone || '').toLowerCase();
      
      if (genreStr.includes('action') || genreStr.includes('thriller')) score += 10;
      if (toneStr.includes('intense') || toneStr.includes('exciting')) score += 5;
      if (searchableText.includes('fight') || searchableText.includes('combat')) score += 3;
      if (searchableText.includes('assassin') || searchableText.includes('revenge')) score += 3;
    }

    // Additional scoring factors
    if (title.synopsis && title.synopsis.trim().length > 50) score += 1;
    if (title.tagline && title.tagline.trim().length > 10) score += 1;
    if (title.views && title.views > 10000) score += 1;
    if (title.completed) score += 1;

    return { 
      ...title, 
      score, 
      vectorScore,
      relevance: score > 0 ? 'text-match' : 'none'
    };
  });

  // Return top 8 most relevant titles
  return scoredTitles
    .filter(title => title.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

// Create database context for AI
function createDatabaseContext(allTitles, relevantTitles) {
  const totalTitles = allTitles.length;
  const genres = [...new Set(allTitles.map(t => Array.isArray(t.genre) ? t.genre.join(', ') : t.genre).filter(Boolean))].slice(0, 15);
  const formats = [...new Set(allTitles.map(t => t.content_format).filter(Boolean))];
  
  let context = `You are an expert assistant for KStoryBridge's Korean IP marketplace. Our database contains ${totalTitles} Korean titles including webtoons, novels, manhwa, and other content.

Available genres: ${genres.join(', ')}
Available formats: ${formats.join(', ')}

`;

  if (relevantTitles.length > 0) {
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
    // No exact matches, but provide alternative recommendations from database
    context += `IMPORTANT: No exact matches for "${query}" in our database.\n`;
    context += `You MUST still recommend titles from our collection. Here are titles to recommend instead:\n\n`;
    
    // Try to find titles with relevant genres or tones
    const actionTitles = allTitles.filter(t => 
      (Array.isArray(t.genre) ? t.genre.join(' ') : t.genre || '').toLowerCase().includes('action') ||
      (Array.isArray(t.genre) ? t.genre.join(' ') : t.genre || '').toLowerCase().includes('thriller') ||
      (t.tone || '').toLowerCase().includes('intense') ||
      (t.tone || '').toLowerCase().includes('exciting')
    ).slice(0, 5);
    
    const titlesToRecommend = actionTitles.length > 0 ? actionTitles : allTitles.slice(0, 8);
    
    context += `Recommended titles from our database:\n`;
    titlesToRecommend.forEach((title, index) => {
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

  return context;
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