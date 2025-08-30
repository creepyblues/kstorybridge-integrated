import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only, never exposed to client
});

// Initialize Supabase for user verification
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // Service key for server-side operations
);

// Allowed users (same as frontend)
const ALLOWED_USERS = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for your dashboard domains
  const allowedOrigins = [
    'https://dashboard.kstorybridge.com',
    'http://localhost:8082', // For local testing
    'http://localhost:8081'  // Alternative local port
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Check if user is in allowed list
    if (!ALLOWED_USERS.includes(user.email || '')) {
      return res.status(403).json({ error: 'Forbidden - User not authorized for OpenAI chatbot' });
    }

    const { query, conversationHistory } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Rate limiting (simple example - you might want Redis for production)
    // This is a basic in-memory rate limit, consider using Upstash Redis for production
    
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

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

    // Return response
    res.status(200).json({
      message: aiResponse,
      suggestedQueries: suggestedQueries.slice(0, 3),
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Don't expose internal error details to client
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ error: 'Server configuration error' });
    } else if (error.code === 'insufficient_quota') {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    } else if (error.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}