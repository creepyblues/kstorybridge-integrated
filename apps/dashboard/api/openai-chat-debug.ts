import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Add extensive logging for debugging
console.log('🔍 DEBUG: API endpoint loaded');
console.log('🔍 DEBUG: Environment check:', {
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
  nodeEnv: process.env.NODE_ENV,
  vercel: process.env.VERCEL,
});

// Initialize with error handling
let openai: OpenAI | null = null;
let supabase: any = null;

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found in environment');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized');
} catch (error: any) {
  console.error('❌ OpenAI initialization failed:', error.message);
}

try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase environment variables missing');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log('✅ Supabase client initialized');
} catch (error: any) {
  console.error('❌ Supabase initialization failed:', error.message);
}

const ALLOWED_USERS = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 DEBUG: Request received:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
  });

  try {
    // Enhanced CORS handling
    const allowedOrigins = [
      'https://dashboard.kstorybridge.com',
      'http://localhost:8082',
      'http://localhost:8081',
      'http://localhost:3000', // Add common dev port
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      console.log('🔍 DEBUG: Origin not in allowed list:', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      console.log('🔍 DEBUG: Handling OPTIONS request');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('🔍 DEBUG: Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check initialization
    if (!openai) {
      console.error('❌ OpenAI client not initialized');
      return res.status(500).json({ error: 'Server configuration error - OpenAI not initialized' });
    }

    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return res.status(500).json({ error: 'Server configuration error - Database not initialized' });
    }

    // Auth validation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 DEBUG: No auth header provided');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔍 DEBUG: Token received, length:', token.length);

    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    if (!user) {
      console.log('🔍 DEBUG: No user found for token');
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    console.log('🔍 DEBUG: User authenticated:', user.email);

    // Check if user is authorized
    if (!ALLOWED_USERS.includes(user.email || '')) {
      console.log('🔍 DEBUG: User not authorized:', user.email);
      return res.status(403).json({ error: 'Forbidden - User not authorized for OpenAI chatbot' });
    }

    const { query, conversationHistory } = req.body;
    console.log('🔍 DEBUG: Request body:', { 
      hasQuery: !!query, 
      historyLength: conversationHistory?.length || 0 
    });

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Prepare context
    const historyContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nConversation history:\n${conversationHistory.join('\n')}` 
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

    console.log('🔍 DEBUG: Calling OpenAI API...');

    // Call OpenAI API with timeout
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout after 25 seconds')), 25000)
      )
    ]) as any;

    console.log('✅ OpenAI API response received');

    const aiResponse = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

    // Extract suggested queries (simple parsing)
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

    const response = {
      message: aiResponse,
      suggestedQueries: suggestedQueries.slice(0, 3),
      usage: completion.usage,
      debug: {
        timestamp: new Date().toISOString(),
        user: user.email,
        queryLength: query.length,
        responseLength: aiResponse.length,
      }
    };

    console.log('✅ Sending successful response');
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Unhandled error in API:', error);
    
    // Detailed error logging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
    });
    
    // Return detailed error for debugging (remove in production)
    return res.status(500).json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }
    });
  }
}