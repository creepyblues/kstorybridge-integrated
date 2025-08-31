// Debug OpenAI configuration and basic functionality
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Check environment variables
    console.log('Test 1: Environment Variables');
    results.tests.environment = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` : 'missing',
      SUPABASE_URL: process.env.SUPABASE_URL || 'missing',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'present' : 'missing',
      NODE_ENV: process.env.NODE_ENV
    };

    // Test 2: OpenAI Client Initialization
    console.log('Test 2: OpenAI Client');
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      results.tests.openai = { 
        initialized: true,
        error: null
      };
      
      // Test 3: Basic OpenAI API Call
      console.log('Test 3: OpenAI API Call');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10,
      });
      
      results.tests.openai_api = {
        success: true,
        response: completion.choices[0]?.message?.content || 'no content',
        usage: completion.usage
      };
      
    } catch (openaiError) {
      console.error('OpenAI Error:', openaiError);
      results.tests.openai = { 
        initialized: false,
        error: openaiError.message
      };
      results.tests.openai_api = {
        success: false,
        error: openaiError.message
      };
    }

    // Test 4: Supabase Database Connection
    console.log('Test 4: Database Connection');
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const { data, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en')
        .limit(3);

      if (error) {
        throw error;
      }

      results.tests.database = {
        success: true,
        titlesLoaded: data ? data.length : 0,
        sampleTitles: data
      };

    } catch (dbError) {
      console.error('Database Error:', dbError);
      results.tests.database = {
        success: false,
        error: dbError.message
      };
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ 
      error: 'Debug test failed',
      message: error.message,
      stack: error.stack
    });
  }
};