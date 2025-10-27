// Minimal test that mimics the enhanced OpenAI endpoint logic
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    console.log('🧪 Minimal test started');

    // CORS headers (simplified)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    console.log('✅ Environment variables loaded');

    // Initialize clients (exact same as enhanced)
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('✅ Clients initialized');

    // Test authentication (simplified - no user check)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No auth header' });
    }

    console.log('✅ Auth header present');

    // Test database title loading (exact same query as enhanced)
    console.log('🗄️ Testing database title loading...');
    
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
      .limit(10);

    if (error) {
      console.error('❌ Database query failed:', error);
      return res.status(500).json({ 
        error: 'Database query failed', 
        details: error.message 
      });
    }

    console.log(`✅ Loaded ${titles.length} titles`);

    // Test OpenAI call with database context (simplified)
    console.log('🤖 Testing OpenAI call...');
    
    const prompt = `You are a Korean content expert. Based on these ${titles.length} titles in our database, respond to: "Hello"
    
Sample titles: ${titles.slice(0, 3).map(t => t.title_name_en || t.title_name_kr).join(', ')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "No response";
    console.log('✅ OpenAI call successful');

    return res.status(200).json({
      success: true,
      message: 'All tests passed',
      results: {
        titlesLoaded: titles.length,
        aiResponse: aiResponse.substring(0, 100) + '...',
        usage: completion.usage
      }
    });

  } catch (error) {
    console.error('❌ Minimal test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
};