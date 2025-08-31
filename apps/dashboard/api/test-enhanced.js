// Test the enhanced API to see what's happening
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // Test loading titles with the exact query from enhanced API
    console.log('Testing title loading...');
    
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
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message,
        hint: error.hint,
        code: error.code
      });
    }

    // Check for specific problematic fields
    const sampleTitle = titles && titles[0] ? titles[0] : null;
    const fieldTypes = {};
    
    if (sampleTitle) {
      Object.keys(sampleTitle).forEach(key => {
        const value = sampleTitle[key];
        fieldTypes[key] = {
          type: typeof value,
          isArray: Array.isArray(value),
          isNull: value === null,
          sample: value === null ? null : 
                  Array.isArray(value) ? `[${value.slice(0,2).join(', ')}...]` :
                  typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' :
                  value
        };
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      titlesLoaded: titles ? titles.length : 0,
      sampleTitle: sampleTitle ? {
        title_name_en: sampleTitle.title_name_en,
        genre: sampleTitle.genre,
        tone: sampleTitle.tone
      } : null,
      fieldTypes: fieldTypes,
      message: 'Database query successful'
    });

  } catch (error) {
    console.error('Test enhanced error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
};