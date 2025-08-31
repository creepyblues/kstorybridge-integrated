// Debug endpoint to test title loading
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
        error: 'Database configuration missing'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Test 1: Simple query
    console.log('Test 1: Simple query');
    const { data: simple, error: simpleError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr')
      .limit(5);
    
    // Test 2: Query with all fields from enhanced API
    console.log('Test 2: Full query');
    const { data: full, error: fullError } = await supabase
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
      .limit(5);

    // Test 3: Get column names
    console.log('Test 3: Get one row to see all columns');
    const { data: oneRow, error: oneRowError } = await supabase
      .from('titles')
      .select('*')
      .limit(1);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      tests: {
        simple: {
          success: !simpleError,
          count: simple ? simple.length : 0,
          error: simpleError ? simpleError.message : null,
          sample: simple ? simple[0] : null
        },
        full: {
          success: !fullError,
          count: full ? full.length : 0,
          error: fullError ? fullError.message : null,
          sample: full ? full[0] : null
        },
        oneRow: {
          success: !oneRowError,
          error: oneRowError ? oneRowError.message : null,
          columns: oneRow && oneRow[0] ? Object.keys(oneRow[0]) : []
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ 
      error: 'Debug failed',
      message: error.message
    });
  }
};