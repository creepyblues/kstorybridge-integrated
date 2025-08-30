// Simple test endpoint without any imports or TypeScript
export default function handler(req, res) {
  try {
    // Basic CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Simple response without any external dependencies
    return res.status(200).json({
      status: 'Simple API working',
      timestamp: new Date().toISOString(),
      method: req.method,
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      message: 'Basic serverless function is operational'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Simple endpoint failed',
      message: error.message
    });
  }
}