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

    // Environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Check authorized users
    const ALLOWED_USERS = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];
    if (!ALLOWED_USERS.includes(user.email)) {
      return res.status(403).json({ error: 'Forbidden - User not authorized' });
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

Please provide a helpful response that:

1. **PRIMARY FOCUS - Our Database Titles**: Recommend specific Korean IPs from our database that match the user's criteria. When recommending titles from our database, mention:
   - Title names (both Korean and English if available)
   - Brief description of why they match
   - Genre, tone, and key features
   - Author/creator information if relevant

2. **SECONDARY - General Market Recommendations**: After covering our database titles, you may also suggest 2-3 well-known Korean IPs from the broader market that match their criteria, but clearly label these as "Additional market recommendations (not yet in our database):"

3. **Follow-up**: Ask a follow-up question to help narrow down their preferences

4. **Suggested Searches**: Suggest 2-3 related searches for our database

Format your response to clearly distinguish between:
- 📚 **From Our Database:** [titles we have]
- 🌟 **Additional Market Suggestions:** [popular titles not in our database yet]

Keep your response conversational, enthusiastic, and focused on Korean content discovery.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Extract suggested queries
    const suggestedQueries = extractSuggestedQueries(aiResponse);

    console.log('✅ Sending enhanced response with database context');

    return res.status(200).json({
      message: aiResponse,
      recommendedTitles: relevantTitles.map(title => ({
        title_id: title.title_id,
        title_name_en: title.title_name_en,
        title_name_kr: title.title_name_kr,
        synopsis: title.synopsis,
        genre: title.genre,
        tone: title.tone,
        author: title.story_author || title.art_author,
        score: title.score || 0
      })),
      suggestedQueries,
      databaseStats: {
        totalTitles: titles.length,
        relevantTitles: relevantTitles.length,
        vectorSearchUsed: relevantTitles.some(t => t.vectorScore > 0)
      },
      usage: completion.usage,
    });

  } catch (error) {
    console.error('❌ Enhanced OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Load titles from database with caching
async function loadTitlesFromDatabase(supabase) {
  const now = Date.now();
  
  // Return cached titles if still valid
  if (titlesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using cached titles');
    return titlesCache;
  }

  try {
    console.log('🔄 Loading titles from database...');
    
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
        tags,
        story_author,
        art_author,
        content_format,
        completed,
        rights_owner,
        perfect_for,
        audience,
        views,
        likes,
        rating
      `)
      .order('created_at', { ascending: false })
      .limit(500); // Limit for performance

    if (error) {
      console.error('❌ Database error:', error);
      return [];
    }

    // Cache the results
    titlesCache = titles || [];
    cacheTimestamp = now;
    
    console.log(`✅ Loaded ${titlesCache.length} titles from database`);
    return titlesCache;
  } catch (error) {
    console.error('❌ Failed to load titles:', error);
    return [];
  }
}

// Find relevant titles using text matching and scoring
async function findRelevantTitles(query, titles, openai) {
  if (!titles || titles.length === 0) {
    return [];
  }

  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
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
      Array.isArray(title.tags) ? title.tags.join(' ') : title.tags,
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
      if (title.genre?.toLowerCase().includes(word) || 
          title.tone?.toLowerCase().includes(word)) {
        score += 3;
      }
    });

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