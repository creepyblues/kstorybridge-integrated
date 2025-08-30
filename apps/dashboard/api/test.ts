import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Test endpoint to verify deployment and environment variables
  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_KEY;
    
    res.status(200).json({
      status: 'API endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      environmentVariables: {
        OPENAI_API_KEY: hasOpenAI ? 'Set ✅' : 'Missing ❌',
        SUPABASE_URL: hasSupabaseUrl ? 'Set ✅' : 'Missing ❌',
        SUPABASE_SERVICE_KEY: hasSupabaseKey ? 'Set ✅' : 'Missing ❌',
        openaiKeyPreview: hasOpenAI ? process.env.OPENAI_API_KEY?.substring(0, 10) + '...' : 'N/A',
      },
      message: 'If you can see this, your API deployment is working!'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Test endpoint failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}