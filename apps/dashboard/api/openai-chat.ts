// Vercel Serverless Function for OpenAI Chat
// This function handles OpenAI API calls securely on the server-side
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add extensive error handling to prevent crashes
  try {
    console.log('🚀 OpenAI Chat API started');
    
    // Dynamic imports for ES modules
    const { default: OpenAI } = await import('openai');
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('📦 Modules loaded successfully');

    // Environment variable validation with detailed logging
    const requiredEnvVars = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    };

    console.log('🔍 Environment check:', {
      OPENAI_API_KEY: !!requiredEnvVars.OPENAI_API_KEY,
      SUPABASE_URL: !!requiredEnvVars.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!requiredEnvVars.SUPABASE_SERVICE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    });

    // Check for missing environment variables
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return res.status(500).json({ 
        error: 'Server configuration error', 
        missing: missingVars 
      });
    }

    // Initialize clients with error handling
    let openai: any;
    let supabase: any;

    try {
      openai = new OpenAI({
        apiKey: requiredEnvVars.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI client initialized');
    } catch (error: any) {
      console.error('❌ OpenAI initialization failed:', error.message);
      return res.status(500).json({ error: 'OpenAI client initialization failed' });
    }

    try {
      supabase = createClient(
        requiredEnvVars.SUPABASE_URL!,
        requiredEnvVars.SUPABASE_SERVICE_KEY!
      );
      console.log('✅ Supabase client initialized');
    } catch (error: any) {
      console.error('❌ Supabase initialization failed:', error.message);
      return res.status(500).json({ error: 'Database client initialization failed' });
    }

    // CORS headers
    const allowedOrigins = [
      'https://dashboard.kstorybridge.com',
      'http://localhost:8082',
      'http://localhost:8081',
      'http://localhost:3000',
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📝 Processing POST request');

    // Extract and validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Token received, length:', token.length);

    // Verify user with Supabase
    let user: any;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('❌ Auth error:', authError.message);
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      if (!authUser) {
        console.log('❌ No user found');
        return res.status(401).json({ error: 'Unauthorized - User not found' });
      }

      user = authUser;
      console.log('✅ User authenticated:', user.email);
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.message);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check user authorization
    const ALLOWED_USERS = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];
    if (!ALLOWED_USERS.includes(user.email || '')) {
      console.log('❌ User not authorized:', user.email);
      return res.status(403).json({ error: 'Forbidden - User not authorized for OpenAI chatbot' });
    }

    // Parse and validate request body
    const { query, conversationHistory } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('📨 Processing query, length:', query.length);

    // Prepare conversation context
    const historyContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nConversation history:\n${conversationHistory.slice(-6).join('\n')}` 
      : '';

    const prompt = `You are an expert assistant specializing in Korean intellectual properties (IPs) including webtoons, novels, manhwa, and other content. You help users discover Korean content that matches their preferences.

${historyContext}

User Query: "${query}"

Please provide a helpful response that:
1. Shows you understand what the user is looking for
2. Recommends specific Korean IPs that match their criteria
3. Explains why these recommendations fit their request
4. Asks a follow-up question to help narrow down their preferences further
5. Suggests 2-3 related searches they might be interested in

Keep your response conversational, enthusiastic, and focused on Korean content discovery.`;

    // Call OpenAI API with timeout protection
    let completion: any;
    try {
      console.log('🤖 Calling OpenAI API...');
      
      const apiCall = openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      // Add timeout protection
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout after 25 seconds')), 25000)
      );

      completion = await Promise.race([apiCall, timeout]);
      console.log('✅ OpenAI API response received');
    } catch (error: any) {
      console.error('❌ OpenAI API error:', error.message);
      
      if (error.message?.includes('timeout')) {
        return res.status(504).json({ error: 'Request timeout - please try again' });
      } else if (error.code === 'insufficient_quota') {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      } else if (error.code === 'invalid_api_key') {
        return res.status(500).json({ error: 'Server configuration error' });
      } else if (error.message?.includes('rate limit')) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    // Extract response
    const aiResponse = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again.";

    // Simple suggested queries extraction
    const suggestedQueries: string[] = [];
    const lines = aiResponse.split('\n');
    
    lines.forEach(line => {
      if (line.includes('"') && (line.toLowerCase().includes('try') || line.toLowerCase().includes('search'))) {
        const matches = line.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const query = match.replace(/"/g, '');
            if (query.length > 5 && query.length < 50) {
              suggestedQueries.push(query);
            }
          });
        }
      }
    });

    console.log('✅ Sending successful response');

    // Return successful response
    return res.status(200).json({
      message: aiResponse,
      suggestedQueries: suggestedQueries.slice(0, 3),
      usage: completion.usage || null,
    });

  } catch (error: any) {
    // Catch-all error handler
    console.error('💥 Unexpected error in OpenAI Chat API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // Limited stack trace
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}