// Pure CommonJS function for Vercel compatibility
module.exports = function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Simple JSON response
    res.status(200).json({
      status: 'Pure CommonJS API working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      environmentVariables: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      },
      message: 'CommonJS function deployed successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Function failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};