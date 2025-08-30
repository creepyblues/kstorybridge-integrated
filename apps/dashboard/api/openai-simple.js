// Pure CommonJS OpenAI Chat Function
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    console.log('🚀 OpenAI Chat API started (CommonJS)');

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

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow POST
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

    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify user
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
    const { query } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `You are an expert assistant for Korean IP content discovery. User query: "${query}"` }],
      max_tokens: 600,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({
      message: aiResponse,
      suggestedQueries: [],
      usage: completion.usage,
    });

  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};