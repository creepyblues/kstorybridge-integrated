// Test endpoint to verify database access and title loading - v2
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ 
        error: 'Database configuration missing',
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY
      });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Load titles from database
    console.log('Loading titles from database...');
    const { data: titles, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, genre, tone, story_author')
      .limit(10);

    if (error) {
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message
      });
    }

    // Return database info
    return res.status(200).json({
      status: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        titlesFound: titles ? titles.length : 0,
        sampleTitles: titles ? titles.slice(0, 3) : [],
        totalQuery: 'Would load 500+ titles in production'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL
      }
    });

  } catch (error) {
    console.error('Test database error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message
    });
  }
};