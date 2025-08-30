// Simple health check endpoint to verify API deployment
export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Environment check
    const envStatus = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      openaiKeyPreview: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'Not set',
    };

    // Test dynamic imports
    let importTest = { success: false, error: null };
    try {
      const OpenAI = (await import('openai')).default;
      const { createClient } = await import('@supabase/supabase-js');
      importTest.success = true;
    } catch (error: any) {
      importTest.error = error.message;
    }

    // Simple OpenAI client test
    let openaiTest = { success: false, error: null };
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        openaiTest.success = true;
      } catch (error: any) {
        openaiTest.error = error.message;
      }
    }

    const response = {
      status: 'API endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      environmentVariables: envStatus,
      tests: {
        imports: importTest,
        openaiClient: openaiTest,
      },
      message: 'Health check successful - API is deployed and working'
    };

    return res.status(200).json(response);
    
  } catch (error: any) {
    return res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}