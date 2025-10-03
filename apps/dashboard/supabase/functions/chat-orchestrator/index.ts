import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
  userId?: string;
}

interface UserProfile {
  id: string;
  email: string;
  account_type: string;
  tier?: string;
  full_name?: string;
  pen_name?: string;
}

interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  genre?: string[];
  tone?: string;
  similarity: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { messages, sessionId } = await req.json() as ChatRequest

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile and tier information
    const userProfile = await getUserProfile(supabase, user.id, user.email || '')

    // Get or create chat session
    const activeSession = sessionId
      ? await getSession(supabase, sessionId)
      : await getOrCreateActiveSession(supabase, user.id, user.email || '')

    if (!activeSession) {
      return new Response(
        JSON.stringify({ error: 'Failed to create or retrieve session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get conversation history for context
    const conversationHistory = await getConversationHistory(supabase, activeSession.id)

    // Get user's latest query
    const userQuery = messages[messages.length - 1]?.content || ''

    // Determine if this requires a search
    const needsSearch = shouldPerformSearch(userQuery)
    let searchResults: VectorSearchResult[] = []

    if (needsSearch) {
      searchResults = await performVectorSearch(supabase, userQuery, user.id)
    }

    // Build master prompt with all context
    const masterPrompt = buildMasterPrompt({
      userProfile,
      conversationHistory: [...conversationHistory, ...messages],
      searchResults,
      userQuery
    })

    // Call OpenAI GPT-4 with streaming response
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🔧 DEBUG: About to call OpenAI API', {
            model: 'gpt-4o-mini',
            apiProvider: 'OpenAI',
            hasApiKey: !!openaiApiKey,
            apiKeyPrefix: openaiApiKey?.substring(0, 20) + '...',
            promptLength: masterPrompt.length,
            searchResultsCount: searchResults.length
          });

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              max_tokens: 1000,
              temperature: 0.7,
              stream: true,
              messages: [
                {
                  role: 'system',
                  content: 'You are Jinu, an enthusiastic AI assistant specializing in Korean content discovery for KStoryBridge. You help users find their perfect Korean stories, dramas, and entertainment content with personalized recommendations and engaging conversation.'
                },
                {
                  role: 'user',
                  content: masterPrompt
                }
              ]
            })
          })

          console.log('🔧 DEBUG: OpenAI API response', {
            model: 'gpt-4o-mini',
            apiProvider: 'OpenAI',
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('🚨 OpenAI API error details:', errorText);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response stream available')
          }

          let fullResponse = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  // Save complete response to database
                  await saveResponseToDatabase(supabase, activeSession.id, user.id, userQuery, fullResponse, searchResults)
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  // OpenAI streaming format
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const text = parsed.choices[0].delta.content
                    fullResponse += text

                    // Send text chunk to client
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
                  }
                } catch (e) {
                  // Ignore parsing errors for non-JSON lines
                }
              }
            }
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))

        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper Functions

async function getUserProfile(supabase: any, userId: string, email: string): Promise<UserProfile> {
  // Try to get buyer profile first
  const { data: buyerProfile } = await supabase
    .from('user_buyers')
    .select('*')
    .eq('email', email)
    .single()

  if (buyerProfile) {
    return {
      id: userId,
      email,
      account_type: 'buyer',
      tier: buyerProfile.tier || 'basic',
      full_name: buyerProfile.full_name
    }
  }

  // Try creator profile
  const { data: creatorProfile } = await supabase
    .from('user_creators')
    .select('*')
    .eq('email', email)
    .single()

  if (creatorProfile) {
    return {
      id: userId,
      email,
      account_type: 'creator',
      full_name: creatorProfile.full_name,
      pen_name: creatorProfile.pen_name
    }
  }

  // Default profile
  return {
    id: userId,
    email,
    account_type: 'buyer',
    tier: 'basic'
  }
}

async function getSession(supabase: any, sessionId: string) {
  const { data } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  return data
}

async function getOrCreateActiveSession(supabase: any, userId: string, email: string) {
  // Look for active session
  const { data: existingSession } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession) {
    return existingSession
  }

  // Create new session
  const { data: newSession } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      user_email: email,
      session_type: 'openai',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  return newSession
}

async function getConversationHistory(supabase: any, sessionId: string): Promise<ChatMessage[]> {
  const { data } = await supabase.rpc('get_conversation_with_titles', {
    p_session_id: sessionId
  })

  if (!data) return []

  return data.slice(-10).map((msg: any) => ({
    role: msg.message_type === 'user_prompt' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.created_at
  }))
}

function shouldPerformSearch(query: string): boolean {
  const searchKeywords = [
    'find', 'search', 'look for', 'recommend', 'suggestion', 'similar',
    'like', 'about', 'genre', 'story', 'title', 'show me', 'what',
    'romance', 'action', 'drama', 'comedy', 'thriller', 'horror'
  ]

  const lowerQuery = query.toLowerCase()
  return searchKeywords.some(keyword => lowerQuery.includes(keyword))
}

async function performVectorSearch(supabase: any, query: string, userId: string): Promise<VectorSearchResult[]> {
  try {
    // Generate embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-ada-002'
      })
    })

    const embeddingData = await embeddingResponse.json()
    const embedding = embeddingData.data[0].embedding

    // Perform vector search
    const { data: results } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5
    })

    return results || []
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

function buildMasterPrompt(context: {
  userProfile: UserProfile;
  conversationHistory: ChatMessage[];
  searchResults: VectorSearchResult[];
  userQuery: string;
}): string {
  const { userProfile, conversationHistory, searchResults, userQuery } = context

  const tierDescription = {
    'basic': 'exploring Korean content',
    'invited': 'special access member',
    'pro': 'premium content enthusiast',
    'suite': 'full platform access with exclusive content'
  }[userProfile.tier || 'basic'] || 'Korean content explorer'

  return `CONTEXT: You are Jinu, KStoryBridge's expert Korean content curator. You have deep knowledge of Korean entertainment including manhwa, webtoons, dramas, movies, and novels. You excel at personalized recommendations and engaging conversations about Korean culture and storytelling.

USER PROFILE:
- Name: ${userProfile.full_name || 'Fellow Korean content enthusiast'}
- Status: ${tierDescription}
- Account: ${userProfile.account_type === 'buyer' ? 'Content Buyer' : 'Content Creator'}
- Experience Level: ${userProfile.tier === 'basic' ? 'Getting started' : userProfile.tier === 'pro' ? 'Experienced' : 'Expert'}

CONVERSATION CONTEXT:
${conversationHistory.length > 0 ? conversationHistory.map(msg =>
  `${msg.role === 'user' ? 'User' : 'Jinu'}: ${msg.content}`
).join('\n') : 'This is the start of our conversation.'}

${searchResults.length > 0 ? `
RELEVANT KOREAN CONTENT DISCOVERED:
${searchResults.map((result, idx) => {
  const title = result.title_name_en || result.title_name_kr
  const genres = Array.isArray(result.genre) ? result.genre.join(', ') : result.genre || 'Mixed Genre'
  const matchScore = (result.similarity * 100).toFixed(0)

  return `${idx + 1}. "${title}" (${matchScore}% match)
   • Genre: ${genres}
   • Tone: ${result.tone || 'Varied'}
   • Synopsis: ${result.synopsis?.substring(0, 120) || 'Compelling Korean storytelling'}${result.synopsis?.length > 120 ? '...' : ''}`
}).join('\n\n')}

SEARCH INSIGHTS: Found ${searchResults.length} titles matching the user's interests with high relevance scores.` : ''}

CURRENT QUERY: "${userQuery}"

RESPONSE GUIDELINES:
1. **Personality**: Be Jinu - passionate, knowledgeable, and genuinely excited about Korean content
2. **Recommendations**: IMPORTANT - Only recommend ACTUAL titles from the search results above. Never invent or create fictional titles. If search results exist, enthusiastically recommend the most relevant titles using quotes with their EXACT names
3. **Engagement**: Ask thoughtful follow-up questions about preferences, genres, or specific interests
4. **Cultural Context**: Share insights about Korean storytelling trends, cultural elements, or industry highlights
5. **Personalization**: Tailor recommendations based on user's tier and conversation history
6. **Structure**: Keep responses conversational but organized, with clear title recommendations
7. **Follow-ups**: End with 2-3 engaging questions or suggestions to continue the conversation
8. **Accuracy**: NEVER make up title names. Only mention titles that appear in the search results provided above

Focus on creating an engaging, personalized experience that helps discover amazing Korean content!`
}

async function saveResponseToDatabase(
  supabase: any,
  sessionId: string,
  userId: string,
  userQuery: string,
  aiResponse: string,
  searchResults: VectorSearchResult[]
) {
  try {
    console.log('💾 Saving response to database', {
      searchResultsCount: searchResults.length,
      userId: userId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      responseLength: aiResponse.length
    });
    // Save user message
    const { data: userMessage } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'user_prompt',
        content: userQuery
      })
      .select()
      .single()

    // Save AI response
    const { data: aiMessage } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'ai_response',
        content: aiResponse
      })
      .select()
      .single()

    // Save title recommendations if any
    if (searchResults.length > 0 && aiMessage) {
      console.log('📋 Saving title recommendations', {
        count: searchResults.length,
        messageId: aiMessage.id,
        titles: searchResults.map(r => r.title_name_en || r.title_name_kr)
      });

      const recommendations = searchResults.map(result => ({
        message_id: aiMessage.id,
        session_id: sessionId,
        title_id: result.title_id,
        title_name_en: result.title_name_en,
        title_name_kr: result.title_name_kr,
        recommendation_score: result.similarity,
        recommendation_reason: `AI recommended based on user query: "${userQuery}"`
      }))

      const { data: savedRecommendations, error: recError } = await supabase
        .from('chat_title_recommendations')
        .insert(recommendations)
        .select()

      if (recError) {
        console.error('❌ Error saving recommendations:', recError);
      } else {
        console.log('✅ Recommendations saved successfully:', savedRecommendations?.length);
      }
    } else {
      console.log('📋 No title recommendations to save', {
        searchResultsLength: searchResults.length,
        hasAiMessage: !!aiMessage
      });
    }

    // Update session messages for context
    await supabase.rpc('append_session_message', {
      p_session_id: sessionId,
      p_message: JSON.stringify({
        role: 'user',
        content: userQuery,
        timestamp: new Date().toISOString()
      })
    })

    await supabase.rpc('append_session_message', {
      p_session_id: sessionId,
      p_message: JSON.stringify({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      })
    })

  } catch (error) {
    console.error('Error saving to database:', error)
  }
}