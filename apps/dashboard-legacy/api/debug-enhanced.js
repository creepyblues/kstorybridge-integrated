// Debug version of enhanced endpoint to isolate the issue
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🐛 Debug Enhanced API started');
  
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Step 1: Environment check
    console.log('Step 1: Environment check');
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ 
        error: 'Environment variables missing',
        step: 1
      });
    }
    console.log('✅ Step 1 passed');

    // Step 2: Client initialization
    console.log('Step 2: Client initialization');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Step 2 passed');

    // Step 3: Authentication check
    console.log('Step 3: Authentication check');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No auth token',
        step: 3
      });
    }
    
    const token = authHeader.substring(7);
    console.log('✅ Step 3 passed - token length:', token.length);

    // Step 4: User validation (simplified)
    console.log('Step 4: User validation');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ 
          error: 'Auth validation failed',
          details: authError?.message,
          step: 4
        });
      }
      console.log('✅ Step 4 passed - user:', user.email);
      
      // Check authorization
      const ALLOWED_USERS = ['sungho@kstorybridge.com', 'kevin@sandstoneartists.com'];
      if (!ALLOWED_USERS.includes(user.email)) {
        return res.status(403).json({ 
          error: 'User not authorized',
          email: user.email,
          step: 4
        });
      }
      console.log('✅ Step 4 authorization passed');
    } catch (authException) {
      return res.status(500).json({
        error: 'Auth exception',
        message: authException.message,
        step: 4
      });
    }

    // Step 5: Request body check
    console.log('Step 5: Request body check');
    const { query } = req.body || {};
    if (!query) {
      return res.status(400).json({ 
        error: 'Query required',
        step: 5
      });
    }
    console.log('✅ Step 5 passed - query:', query.substring(0, 50));

    // Step 6: Database query
    console.log('Step 6: Database query');
    try {
      const { data: titles, error } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr')
        .limit(5);

      if (error) {
        return res.status(500).json({
          error: 'Database query failed',
          details: error.message,
          step: 6
        });
      }
      console.log('✅ Step 6 passed - titles loaded:', titles.length);
    } catch (dbException) {
      return res.status(500).json({
        error: 'Database exception',
        message: dbException.message,
        step: 6
      });
    }

    // Step 7: OpenAI API call
    console.log('Step 7: OpenAI API call');
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10,
      });
      console.log('✅ Step 7 passed - OpenAI response received');
    } catch (openaiException) {
      return res.status(500).json({
        error: 'OpenAI API exception',
        message: openaiException.message,
        step: 7
      });
    }

    console.log('✅ All steps passed successfully');
    return res.status(200).json({
      success: true,
      message: 'All debug steps completed successfully',
      stepsCompleted: 7
    });

  } catch (error) {
    console.error('❌ Debug Enhanced API error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
};