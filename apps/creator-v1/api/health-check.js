// Simple health check to diagnose the OpenAI issues
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

    const results = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      checks: {}
    };

    // Check 1: Environment Variables
    results.checks.environment = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'present' : 'missing',
      SUPABASE_URL: !!process.env.SUPABASE_URL ? 'present' : 'missing', 
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY ? 'present' : 'missing',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };

    // Check 2: OpenAI Import
    try {
      const OpenAI = require('openai');
      results.checks.openai_import = { success: true };
      
      // Check 3: OpenAI Client Creation
      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        results.checks.openai_client = { success: true };
        
        // Check 4: Actual OpenAI API Call
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say hello" }],
            max_tokens: 10,
          });
          
          results.checks.openai_api = { 
            success: true, 
            response: completion.choices[0]?.message?.content || 'no content',
            usage: completion.usage
          };
        } catch (apiError) {
          results.checks.openai_api = { 
            success: false, 
            error: apiError.message,
            code: apiError.code,
            type: apiError.type,
            status: apiError.status
          };
        }
      } else {
        results.checks.openai_client = { success: false, error: 'No API key' };
        results.checks.openai_api = { success: false, error: 'No API key' };
      }
    } catch (error) {
      results.checks.openai_import = { success: false, error: error.message };
      results.checks.openai_client = { success: false, error: 'Import failed' };
    }

    // Check 5: Supabase Connection
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const supabase = createClient(
          process.env.SUPABASE_URL, 
          process.env.SUPABASE_SERVICE_KEY
        );
        
        // Test simple query
        const { data, error } = await supabase
          .from('titles')
          .select('title_id')
          .limit(1);
          
        if (error) {
          results.checks.database = { 
            success: false, 
            error: error.message,
            code: error.code 
          };
        } else {
          results.checks.database = { 
            success: true, 
            titleCount: data ? data.length : 0 
          };
        }
      } else {
        results.checks.database = { 
          success: false, 
          error: 'Missing Supabase credentials' 
        };
      }
    } catch (error) {
      results.checks.database = { 
        success: false, 
        error: error.message 
      };
    }

    // Overall status
    const allChecks = Object.values(results.checks);
    const failedChecks = allChecks.filter(check => check.success === false);
    
    if (failedChecks.length === 0) {
      results.status = 'healthy';
    } else {
      results.status = 'issues_detected';
      results.failedChecks = failedChecks.length;
      results.failedCheckDetails = failedChecks;
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
};