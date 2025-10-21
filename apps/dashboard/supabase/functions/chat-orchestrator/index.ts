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
  // Testing mode parameters
  model?: string;
  vectorSearchLimit?: number;
  systemPrompt?: string;
  formattingRules?: string;
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
  content_format?: string;
  comps?: string[];
  story_author?: string;
  art_author?: string;
  perfect_for?: string;
  audience?: string;
  age_rating?: string;
  similarity: number;

  // Pitch analytics fields (added 2025-01-30)
  pitch_analysis?: {
    characters?: Array<{
      name: string;
      role: string;
      archetype: string;
      description: string;
      relationships?: string;
    }>;
    story_elements?: {
      logline?: string;
      plot_summary?: string;
      narrative_structure?: string;
      central_conflict?: string;
    };
    themes_and_tone?: {
      primary_themes?: string[];
      mood?: string;
      emotional_beats?: string[];
    };
    market_positioning?: {
      comparable_titles?: Array<{
        title: string;
        platform: string;
        context: string;
      }>;
      target_demographics?: string[];
      market_differentiation?: string;
    };
    source_material?: {
      metrics?: {
        views?: number;
        chapters?: number;
        platform?: string;
      };
      serialization_status?: string;
    };
    korean_cultural_elements?: string[];
    ip_value?: {
      unique_selling_points?: string[];
      franchise_potential?: string;
      adaptation_opportunities?: string[];
      merchandising_potential?: string;
    };
    production_details?: {
      visual_style_notes?: string;
      production_complexity?: string;
      technical_requirements?: string[];
      estimated_budget_level?: string;
    };
    content_classification?: {
      age_rating?: string;
      content_warnings?: string[];
      complexity_score?: string;
      maturity_level?: string;
    };
    creative_team?: {
      creator_name?: string;
      previous_works?: string[];
      creative_background?: string;
      artistic_style?: string;
    };
  };
  processing_confidence?: number;
}

// ========== FEATURE FLAGS FOR SAFE ROLLOUT ==========
// These flags enable gradual deployment of chatbot improvements based on
// CHATBOT_SAMPLE_DIALOGUES.md with zero production risk
//
// DEPLOYMENT STRATEGY:
// Week 1: Deploy with all flags OFF (current behavior preserved)
// Week 2: Enable PERSONALITY for 10% of users
// Week 3: Enable EXPLORATION_MODE if metrics positive
// Week 4: Enable CONDITIONAL_INFO
//
// ROLLBACK: Set flag to 'false' to revert to previous behavior immediately

/**
 * Phase 2 Testing: Formal baseline for A/B testing
 * Controls: Use formal (non-conversational) prompt for true baseline comparison
 * Risk: TESTING ONLY - not for production use
 * Purpose: Measure improvement from formal → conversational → enhanced
 */
const USE_FORMAL_BASELINE = Deno.env.get('USE_FORMAL_BASELINE') === 'true';

/**
 * Phase 2: Enhanced personality with "story nerd" enthusiasm
 * Controls: System prompt conversational style (lines 209-258)
 * Risk: LOW (with flag) - affects tone but preserves anti-hallucination
 * Rollback: Set to 'false' to use original formal prompt
 */
const ENABLE_NEW_PERSONALITY = Deno.env.get('ENABLE_NEW_PERSONALITY') === 'true';

/**
 * Phase 3: Exploration mode for fresh conversations
 * Controls: Fresh conversation detection asking questions before recommending
 * Risk: MEDIUM - changes UX flow for broad queries
 * Rollback: Set to 'false' to immediately recommend titles
 */
const ENABLE_EXPLORATION_MODE = Deno.env.get('ENABLE_EXPLORATION_MODE') === 'true';

/**
 * Phase 4: Conditional display for information queries
 * Controls: "Tell me about X" responses hide empty sections
 * Risk: LOW - only affects information query structure
 * Rollback: Set to 'false' to show all sections
 */
const ENABLE_CONDITIONAL_INFO = Deno.env.get('ENABLE_CONDITIONAL_INFO') === 'true';

/**
 * Pitch Analytics Integration (Added 2025-01-30)
 * Controls: Whether to include pitch deck analytics in chatbot responses
 * Risk: MEDIUM - increases token cost (+100%), response time (+1s), prompt complexity
 * Benefits: Enables 60+ enhanced query types (characters, themes, market, cultural, IP value)
 * Rollback: Set to 'false' to exclude pitch context immediately
 * Quality Filter: Only includes pitch data with processing_confidence >= 0.70
 * Token Limit: 800 tokens max per title to prevent cost explosion
 */
const ENABLE_PITCH_CONTEXT = Deno.env.get('ENABLE_PITCH_CONTEXT') === 'true';

// Log feature flag status at startup
console.log('🚩 Feature Flags Initialized:', {
  USE_FORMAL_BASELINE,
  ENABLE_NEW_PERSONALITY,
  ENABLE_EXPLORATION_MODE,
  ENABLE_CONDITIONAL_INFO,
  ENABLE_PITCH_CONTEXT,
  deployment: 'Phase 2 Testing - Three-way A/B test mode + Pitch Analytics'
});

// ========== END FEATURE FLAGS ==========

/**
 * Get system prompt based on feature flags
 * Phase 2 Testing: Three-way A/B test (formal → conversational → enhanced)
 * @returns System prompt string for OpenAI API
 */
function getSystemPrompt(): string {
  // PRIORITY 1: Testing mode - Formal baseline (non-conversational)
  if (USE_FORMAL_BASELINE) {
    console.log('📄 Using FORMAL BASELINE prompt (A/B testing - true baseline)');
    // FORMAL BASELINE: Pure informational, no conversational markers
    // This is the true baseline for measuring conversational improvement
    return `You are Jinu, a Hollywood showrunner who specializes in Korean storytelling.

CORE IDENTITY:
- Role: Story analyst and content advisor
- Expertise: Korean narrative structures, character development, adaptation strategy
- Focus: 70% story analysis, 30% business insights (when requested)

RESPONSE GUIDELINES:

For story information queries:
- Provide detailed analysis of plot, characters, themes, and structure
- Include genre, tone, content format, and target audience information
- Reference the title's synopsis, tagline, and key story elements
- Link to full title details page when applicable

For discovery queries:
- Ask clarifying questions to understand specific preferences
- Inquire about genre preferences, tone, themes, or narrative style
- Reference user's stated interests in follow-up questions

For comparison queries:
- Analyze structural and thematic differences between titles or genres
- Compare character arcs, narrative pacing, and story elements
- Provide objective assessment of how titles differ

For recommendations:
- When user mentions platforms, networks, or business context, provide market fit analysis
- Reference successful Korean content adaptations (Squid Game, Pachinko, Extraordinary Attorney Woo)
- Discuss episode structure, format, and audience targeting

REAL INDUSTRY EXAMPLES (Reference when discussing business):
- Squid Game (Netflix 2021) - International appeal of Korean storytelling
- Pachinko (Apple TV+ 2022) - Multi-generational family saga, prestige format
- Extraordinary Attorney Woo (Netflix 2022) - Character-driven procedural
- Mask Girl (Netflix 2023) - Genre-bending structure
- The Good Daughter (ABC) - Adapted from "The Good Bad Mother"

Key insights for adaptation:
- American audiences respond to character depth over spectacle
- Cultural specificity can be a feature, not a limitation
- Story structure matters more than language
- Emotional universality transcends origin

NEVER use fictional personal experience ("When I worked on..."). Always use real examples.

EXAMPLES:

Example 1 - Information Query:
User: "Tell me about The Dilettante"
Jinu: "The Dilettante features a protagonist who is a talented dilettante—someone who excels at multiple things but has never committed fully to any single pursuit. The central conflict is internal: the character possesses ability but lacks purpose. The story follows a three-act structure where the protagonist must choose a path and commit to it, exploring themes of talent, commitment, and finding purpose."

Example 2 - Platform Query:
User: "Where would this work?"
Jinu: "For platform fit, this title aligns with character-driven drama formats similar to Apple TV+'s Pachinko—prestige format with character depth over spectacle. The narrative structure supports episodic storytelling. Netflix demonstrated with Squid Game that American audiences are receptive to Korean narratives when story structure is solid. Target demographics would be 25-40, character-driven drama audiences."

Example 3 - Discovery Query:
User: "I want strong character development"
Jinu: "To help identify suitable titles with strong character development: Are you interested in slow-burn character arcs where transformation occurs gradually, or do you prefer dramatic transformation moments? Additionally, what type of character journey interests you more: internal emotional struggles or growth through external conflicts?"`;
  }

  // PRIORITY 2: Enhanced personality (conversational + enthusiastic)
  if (ENABLE_NEW_PERSONALITY) {
    console.log('🎭 Using ENHANCED personality prompt (Phase 2 ACTIVE)');
    // PHASE 2: ENHANCED PERSONALITY - Conversational "story nerd" based on CHATBOT_SAMPLE_DIALOGUES.md
    return `You are Jinu, a Hollywood showrunner who specializes in Korean storytelling.

CORE IDENTITY:
- Passion: Story craft—character arcs, structure, themes, emotional beats
- Tone: Enthusiastic story nerd (think: excited colleague sharing discoveries, not formal consultant)
- Focus: 70% story craft, 30% business (only when user signals interest)

ENHANCED CONVERSATIONAL PATTERNS (Use these frequently for natural flow):

**Story Enthusiasm**:
- "Oh, you found a gem!"
- "Okay, story nerd moment—you're speaking my language!"
- "Let me tell you why this story works..."
- "I love that you're focused on [aspect]!"
- "The character arc here is fascinating—"
- "What hooked me is how the narrative structures..."
- "The emotional core here is..."
- "Great question! The structural DNA is really different..."

**Development Questions** (Natural, conversational):
- "I'm curious—what kind of emotional experience are you looking for?"
- "Let me ask you this—are you into slow-burn arcs or dramatic transformation moments?"
- "What draws you more: the protagonist's internal journey or how they change through external conflicts?"
- "Tell me more about what you're imagining..."

**Story Craft Deep Dives**:
- "Okay, so the protagonist isn't your typical [X]—they're [unique trait]. The genius here is..."
- "Why the story structure is smart: [breakdown]"
- "The hook: [describe what makes it compelling]"
- "Notice how the writer [specific technique]..."
- "What makes the storytelling effective is..."

BUSINESS TRIGGER KEYWORDS (Switch to business discussion when user mentions):
- "where would this work", "where could this work", "platform", "network", "streaming", "TV"
- "budget", "pitch", "sell", "market", "adaptation", "production", "development"
- When triggered, lead with: "Oh, thinking about [market/platform/production]? Let me break down..."

REAL INDUSTRY EXAMPLES (Reference these naturally when discussing business):
- Squid Game (Netflix 2021) - Proved international appeal of Korean storytelling
- Pachinko (Apple TV+ 2022) - Multi-generational family saga, prestige format
- Extraordinary Attorney Woo (Netflix 2022) - Character-driven procedural
- Mask Girl (Netflix 2023) - Genre-bending structure, identity themes
- The Good Daughter (ABC) - Adapted from "The Good Bad Mother"

Key insights to mention:
- American audiences respond to character depth, not just spectacle
- Cultural specificity is a feature, not a bug
- Story structure matters more than language
- Emotional universality transcends origin

NEVER use fictional personal experience ("When I worked on..."). Always use real examples.

ENHANCED FEW-SHOT EXAMPLES:

Example 1 - Enthusiastic Story Craft Focus:
User: "Tell me about The Dilettante"
Jinu: "Oh, you found a gem! Let me tell you why The Dilettante works so well as a story. The protagonist's arc is fascinating—she starts as this top counterterrorism agent, totally in control, and then her twin brother's death shatters that control. What makes it compelling is how the writer structures the emotional beats around her identity crisis. The character development is what drives everything here..."

Example 2 - Business Trigger with Natural Transition:
User: "Where would this work?"
Jinu: "Oh, thinking about market fit? Given the character-driven structure here, this feels very much in the vein of what Apple TV+ did with Pachinko—prestige format, character depth over spectacle. The emotional core is strong enough to carry episode-length storytelling. Netflix showed with Squid Game that American audiences are ready for Korean narratives when the story structure is solid..."

Example 3 - Natural Development Questions:
User: "I want strong character development"
Jinu: "I love that you're focused on character! Let me ask you this—are you into slow-burn arcs where characters evolve gradually, or do you prefer those dramatic transformation moments? And what draws you more: the protagonist's internal journey (like their emotional struggles) or how they change through external conflicts?"`;
  }

  console.log('📝 Using ORIGINAL personality prompt (Phase 2 OFF - production default)');
  // ORIGINAL: Phase 1 prompt (flag OFF) - Current production behavior
  return `You are Jinu, a Hollywood showrunner who specializes in Korean storytelling.

CORE IDENTITY:
- Passion: Story craft—character arcs, structure, themes, emotional beats
- Tone: Casual, enthusiastic story nerd (excited colleague, not formal consultant)
- Focus: 70% story craft, 30% business (only when user signals interest)

STORY CRAFT LANGUAGE (Use these patterns frequently):
- "Let me tell you why this story works..."
- "The character arc here is really smart because..."
- "What hooked me is how the narrative structures..."
- "Okay, story nerd moment—notice how the writer..."
- "The emotional core here is..."
- "What makes the storytelling effective is..."
- "The protagonist's journey from X to Y..."
- "Notice the three-act structure here..."

BUSINESS TRIGGER KEYWORDS (Switch to business discussion when user mentions):
- "where would this work", "where could this work", "platform", "network", "streaming", "TV"
- "budget", "pitch", "sell", "market", "adaptation", "production", "development"
- When triggered, lead with: "Oh, thinking about [market/platform/production]? Let me break down..."

REAL INDUSTRY EXAMPLES (Reference these naturally when discussing business):
- Squid Game (Netflix 2021) - Proved international appeal of Korean storytelling
- Pachinko (Apple TV+ 2022) - Multi-generational family saga, prestige format
- Extraordinary Attorney Woo (Netflix 2022) - Character-driven procedural
- Mask Girl (Netflix 2023) - Genre-bending structure, identity themes
- The Good Daughter (ABC) - Adapted from "The Good Bad Mother"

Key insights to mention:
- American audiences respond to character depth, not just spectacle
- Cultural specificity is a feature, not a bug
- Story structure matters more than language
- Emotional universality transcends origin

NEVER use fictional personal experience ("When I worked on..."). Always use real examples.

FEW-SHOT EXAMPLES:

Example 1 - Story Craft Focus:
User: "Tell me about The Dilettante"
Jinu: "Okay, let me tell you why The Dilettante works so well as a story. The protagonist's arc is fascinating—she starts as this top counterterrorism agent, totally in control, and then her twin brother's death shatters that control. What makes it compelling is how the writer structures the emotional beats around her identity crisis. The character development is what drives everything here..."

Example 2 - Business Trigger:
User: "Where would this work?"
Jinu: "Oh, thinking about market fit? Given the character-driven structure here, this feels very much in the vein of what Apple TV+ did with Pachinko—prestige format, character depth over spectacle. The emotional core is strong enough to carry episode-length storytelling. Netflix showed with Squid Game that American audiences are ready for Korean narratives when the story structure is solid..."

Example 3 - Development Questions:
User: "I want strong character development"
Jinu: "I love that you're focused on character! Let me ask you this—are you into slow-burn arcs where characters evolve gradually, or do you prefer those dramatic transformation moments? And what draws you more: the protagonist's internal journey (like their emotional struggles) or how they change through external conflicts?"`;
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
    const { messages, sessionId, model, vectorSearchLimit, systemPrompt, formattingRules } = await req.json() as ChatRequest

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

    // Always run vector search for all queries
    let searchResults: VectorSearchResult[] = []

    const searchLimit = vectorSearchLimit || 10  // Increased default from 5 to 10
    const searchThreshold = 0.7  // Can be made configurable via request params

    // Try vector search first
    searchResults = await performVectorSearch(supabase, userQuery, user.id, searchLimit, searchThreshold)

    // Log pitch analytics usage (added 2025-01-30)
    const pitchEnabledCount = ENABLE_PITCH_CONTEXT
      ? searchResults.filter(r => r.processing_confidence && r.processing_confidence >= 0.70).length
      : 0;

    console.log('📊 Pitch Analytics Status:', {
      featureEnabled: ENABLE_PITCH_CONTEXT,
      totalResults: searchResults.length,
      withPitchData: pitchEnabledCount,
      coveragePercent: searchResults.length > 0 ? ((pitchEnabledCount / searchResults.length) * 100).toFixed(0) + '%' : '0%'
    });

    // Fallback to keyword search if no results
    if (searchResults.length === 0) {
      console.log('⚠️ Vector search returned no results, trying fallback keyword search...');
      searchResults = await performKeywordSearch(supabase, userQuery, searchLimit)

      if (searchResults.length > 0) {
        console.log('✅ Fallback keyword search successful:', searchResults.length, 'results');
      } else {
        console.log('❌ Both vector and keyword search returned no results');
      }
    }

    // Build master prompt with all context (use custom prompt if provided)
    const masterPrompt = systemPrompt || buildMasterPrompt({
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
          // PHASE 1: Send search complete event with previews
          if (searchResults && searchResults.length > 0) {
            const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;

            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  type: 'search_complete',
                  resultsCount: searchResults.length,
                  avgSimilarity: Math.round(avgSimilarity * 100) / 100,
                  topTitles: searchResults.slice(0, 3).map(r => ({
                    title_id: r.title_id,
                    title_name_en: r.title_name_en,
                    title_name_kr: r.title_name_kr,
                    title_image: r.title_image,
                    genre: r.genre,
                    tone: r.tone,
                    similarity: Math.round(r.similarity * 100) / 100
                  }))
                })}\n\n`
              )
            );

            console.log('✅ Sent search_complete event:', {
              count: searchResults.length,
              avgSimilarity: avgSimilarity.toFixed(2),
              topTitles: searchResults.slice(0, 3).map(r => r.title_name_en || r.title_name_kr)
            });
          }

          // PHASE 2: Start AI streaming
          // Use custom model if provided, otherwise default to gpt-4o-mini
          const selectedModel = model || 'gpt-4o-mini';

          console.log('🔧 DEBUG: About to call OpenAI API', {
            model: selectedModel,
            apiProvider: 'OpenAI',
            hasApiKey: !!openaiApiKey,
            apiKeyPrefix: openaiApiKey?.substring(0, 20) + '...',
            promptLength: masterPrompt.length,
            searchResultsCount: searchResults.length,
            vectorSearchLimit: vectorSearchLimit || 5
          });

          // Build API request body with model-specific parameters
          const requestBody: any = {
            model: selectedModel,
            stream: true,  // All models support streaming (GPT-5 requires org verification)
            messages: [
              {
                role: 'system',
                content: getSystemPrompt()  // Phase 2: Use feature flag controlled prompt
                },
                {
                  role: 'user',
                  content: masterPrompt
                }
              ]
          };

          // Apply model-specific parameter configuration
          if (selectedModel.startsWith('gpt-5')) {
            // GPT-5 models: Use max_completion_tokens, temperature locked at 1.0 (default)
            // STREAMING MODE: Tokens stream progressively, avoiding reasoning exhaustion
            requestBody.max_completion_tokens = 2000;

            // Optional: Enable faster streaming (minimal reasoning, faster token generation)
            // Uncomment below to prioritize speed over reasoning depth
            // requestBody.reasoning_effort = 'minimal';

            console.log('🔧 Using GPT-5 streaming config: max_completion_tokens=2000, temp=1.0 (default), stream=true');
          } else {
            // GPT-4 and earlier: Use max_tokens, temperature configurable
            requestBody.max_tokens = 1000;
            requestBody.temperature = 0.85;
            console.log('🔧 Using GPT-4 config: max_tokens=1000, temp=0.85');
          }

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify(requestBody)
          })

          console.log('🔧 DEBUG: OpenAI API response', {
            model: selectedModel,
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

          let fullResponse = ''
          let suggestedQueries: string[] = []

          // ===== STREAMING PATH (All models - GPT-4 and GPT-5) =====
          console.log('🔄 Handling STREAMING response:', selectedModel);

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response stream available')
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  // Validate response for title hallucinations
                  const validation = validateAIResponse(fullResponse, searchResults)

                  if (!validation.isValid) {
                    console.warn('🚨 Hallucinations replaced in response:', validation.hallucinations)
                    fullResponse = validation.validatedResponse
                  }

                  // Generate suggestions AFTER AI response is complete
                  const queryIntent = classifyQueryIntent(userQuery, conversationHistory);
                  const responseAnalysis = analyzeAIResponse(fullResponse);
                  const conversationStage = getConversationStage(conversationHistory);

                  // Smart suppression logic - avoid duplication with AI-generated suggestions
                  const skipSuggestions =
                    queryIntent === 'information' || // Skip for specific title info requests
                    (conversationStage === 'initial' && responseAnalysis.hasTrySection) || // Skip if AI already provided "Try:" section
                    (responseAnalysis.hasQuestions && responseAnalysis.questionCount >= 3) || // Skip if AI asked 3+ questions
                    (responseAnalysis.hasBulletList && responseAnalysis.questionCount >= 2); // Skip if AI provided structured suggestions

                  if (!skipSuggestions) {
                    suggestedQueries = generateSuggestedQueries({
                      queryIntent,
                      searchResults,
                      userQuery,
                      conversationHistory,
                      aiResponse: fullResponse, // Pass AI response for context-aware suggestions
                      responseAnalysis // Pass analysis results
                    });

                    // Send suggestions AFTER full response but BEFORE [DONE]
                    if (suggestedQueries.length > 0) {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({
                            type: 'suggestions',
                            suggestedQueries,
                            generatedAt: 'after_completion'
                          })}\n\n`
                        )
                      );

                      console.log('💡 Sent suggestions after completion:', suggestedQueries);
                    }
                  } else {
                    console.log('🔇 Suppressing suggestions:', {
                      reason: queryIntent === 'information' ? 'information query' :
                              responseAnalysis.hasTrySection ? 'AI provided Try section' :
                              responseAnalysis.questionCount >= 3 ? 'AI asked 3+ questions' :
                              'AI provided structured suggestions',
                      conversationStage,
                      responseAnalysis
                    });
                  }

                  // Save response and suggestions to database
                  await saveResponseToDatabase(supabase, activeSession.id, user.id, userQuery, fullResponse, searchResults, suggestedQueries)
                  continue
                }

                try {
                  const parsed = JSON.parse(data)

                  // Handle STREAMING format (GPT-4 and earlier with stream: true)
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const text = parsed.choices[0].delta.content
                    fullResponse += text

                    // Send text chunk to client with structured format
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`))
                  }
                } catch (e) {
                  // Ignore parsing errors for non-JSON lines
                }
              }
            }
          }

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

/**
 * Fallback keyword search when vector search returns no results
 */
async function performKeywordSearch(
  supabase: any,
  query: string,
  matchCount: number = 10
): Promise<VectorSearchResult[]> {
  try {
    console.log('🔍 Performing fallback keyword search:', {
      query: query.substring(0, 50) + '...',
      matchCount
    });

    // Extract keywords from query (remove common words)
    const stopWords = ['find', 'show', 'me', 'the', 'a', 'an', 'about', 'with', 'like', 'similar'];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .join(' & '); // PostgreSQL full-text search syntax

    if (!keywords) {
      console.warn('⚠️ No valid keywords extracted from query');
      return [];
    }

    // Search across title names, synopsis, genre, and tags
    const { data: results } = await supabase
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        genre,
        tone
      `)
      .or(`
        title_name_en.ilike.%${query}%,
        title_name_kr.ilike.%${query}%,
        synopsis.ilike.%${query}%
      `)
      .limit(matchCount);

    // Add dummy similarity scores based on match quality
    const scoredResults = (results || []).map(result => {
      let similarity = 0.5; // Base score for keyword matches

      const titleMatch = [result.title_name_en, result.title_name_kr].some(
        title => title?.toLowerCase().includes(query.toLowerCase())
      );

      if (titleMatch) similarity = 0.75; // Higher score for title matches

      return {
        ...result,
        similarity
      };
    });

    console.log('✅ Keyword Search Results:', {
      resultCount: scoredResults.length,
      keywords: keywords.substring(0, 50) + '...'
    });

    return scoredResults;
  } catch (error) {
    console.error('❌ Keyword search error:', error);
    return [];
  }
}

async function performVectorSearch(
  supabase: any,
  query: string,
  userId: string,
  matchCount: number = 10,  // Increased default from 5 to 10
  matchThreshold: number = 0.7  // Configurable threshold
): Promise<VectorSearchResult[]> {
  try {
    console.log('🔍 Vector Search Configuration:', {
      query: query.substring(0, 50) + '...',
      matchCount,
      matchThreshold,
      userId: userId.substring(0, 8) + '...'
    });

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

    // Perform vector search with configurable parameters
    const { data: results } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    })

    console.log('✅ Vector Search Results:', {
      resultCount: results?.length || 0,
      topScores: results?.slice(0, 3).map((r: any) => r.similarity.toFixed(3)) || []
    });

    return results || []
  } catch (error) {
    console.error('❌ Vector search error:', error)
    return []
  }
}

/**
 * Format pitch analytics data for GPT context (Added 2025-01-30)
 * Quality filter: Only include if processing_confidence >= 0.70
 * Token efficiency: Limit arrays to 3 items, truncate long strings, max 800 tokens per title
 * @param result Vector search result with optional pitch_analysis
 * @returns Formatted pitch context string or empty string if unavailable/low quality
 */
function formatPitchAnalytics(result: VectorSearchResult): string {
  // Quality checks: feature flag, pitch data exists, confidence threshold
  if (!ENABLE_PITCH_CONTEXT || !result.pitch_analysis || !result.processing_confidence || result.processing_confidence < 0.70) {
    return ''; // No pitch data, low quality, or feature disabled
  }

  const pitch = result.pitch_analysis;
  let formatted = `\n📊 Detailed Analysis (Confidence: ${(result.processing_confidence * 100).toFixed(0)}%):`;
  let tokenCount = 0; // Track tokens to avoid explosion
  const MAX_TOKENS = 800; // Limit per title

  // 1. CHARACTERS (limit to 3 for token efficiency)
  if (pitch.characters && pitch.characters.length > 0 && tokenCount < MAX_TOKENS) {
    const chars = pitch.characters.slice(0, 3).map(c => {
      const desc = c.description?.slice(0, 100) || 'No description';
      return `${c.name} (${c.archetype || c.role}): ${desc}`;
    }).join('; ');
    formatted += `\n- Characters: ${chars}`;
    tokenCount += chars.length / 4; // Rough token estimate (4 chars = 1 token)
  }

  // 2. STORY ELEMENTS
  if (pitch.story_elements && tokenCount < MAX_TOKENS) {
    if (pitch.story_elements.logline) {
      const logline = pitch.story_elements.logline.slice(0, 150);
      formatted += `\n- Logline: ${logline}`;
      tokenCount += logline.length / 4;
    }
    if (pitch.story_elements.central_conflict) {
      const conflict = pitch.story_elements.central_conflict.slice(0, 100);
      formatted += `\n- Conflict: ${conflict}`;
      tokenCount += conflict.length / 4;
    }
  }

  // 3. THEMES (concise)
  if (pitch.themes_and_tone?.primary_themes && tokenCount < MAX_TOKENS) {
    const themes = pitch.themes_and_tone.primary_themes.slice(0, 4).join(', ');
    formatted += `\n- Themes: ${themes}`;
    tokenCount += themes.length / 4;
  }

  // 4. MARKET POSITIONING (limit to 3 comps)
  if (pitch.market_positioning?.comparable_titles && tokenCount < MAX_TOKENS) {
    const comps = pitch.market_positioning.comparable_titles
      .slice(0, 3)
      .map(c => `${c.title} (${c.platform})`)
      .join(', ');
    formatted += `\n- Similar to: ${comps}`;
    tokenCount += comps.length / 4;
  }

  // 5. SOURCE METRICS (concise)
  if (pitch.source_material?.metrics && tokenCount < MAX_TOKENS) {
    const metrics = pitch.source_material.metrics;
    const parts = [];
    if (metrics.views) parts.push(`${(metrics.views / 1000000).toFixed(1)}M views`);
    if (metrics.chapters) parts.push(`${metrics.chapters} chapters`);
    if (metrics.platform) parts.push(metrics.platform);
    if (parts.length > 0) {
      formatted += `\n- Source: ${parts.join(', ')}`;
      tokenCount += parts.join(', ').length / 4;
    }
  }

  // 6. KOREAN CULTURAL ELEMENTS (limit to 3)
  if (pitch.korean_cultural_elements && pitch.korean_cultural_elements.length > 0 && tokenCount < MAX_TOKENS) {
    const cultural = pitch.korean_cultural_elements.slice(0, 3).join(', ');
    formatted += `\n- Korean Elements: ${cultural}`;
    tokenCount += cultural.length / 4;
  }

  // 7. IP VALUE (unique selling points only, limit to 3)
  if (pitch.ip_value?.unique_selling_points && tokenCount < MAX_TOKENS) {
    const usps = pitch.ip_value.unique_selling_points.slice(0, 3).join('; ');
    formatted += `\n- Unique Strengths: ${usps}`;
    tokenCount += usps.length / 4;
  }

  // Log token estimate for monitoring
  console.log(`📊 Pitch context formatted: ${tokenCount.toFixed(0)} tokens (max: ${MAX_TOKENS})`);

  return formatted;
}

/**
 * Weight conversation history - recent messages are more important
 * Returns formatted conversation with emphasis markers
 */
function weightConversationHistory(history: ChatMessage[]): string {
  if (history.length === 0) {
    return 'This is the start of our conversation.';
  }

  // Weight recent messages more heavily
  const weighted = history.map((msg, index) => {
    const recencyWeight = index / history.length; // 0 (oldest) to 1 (newest)
    const isRecent = recencyWeight > 0.7; // Last 30% of conversation
    const isMostRecent = index >= history.length - 2; // Last 2 messages

    const prefix = isMostRecent ? '**[MOST RECENT]** ' :
                   isRecent ? '**[RECENT]** ' : '';

    return `${prefix}${msg.role === 'user' ? 'User' : 'Jinu'}: ${msg.content}`;
  });

  return weighted.join('\n');
}

/**
 * Extract recent title recommendations from conversation for follow-up queries
 */
function getRecentTitleMentions(history: ChatMessage[]): string[] {
  const recentMessages = history.slice(-4); // Last 4 messages
  const titles: string[] = [];

  recentMessages.forEach(msg => {
    if (msg.role === 'assistant') {
      // Extract quoted titles from assistant messages
      const matches = msg.content.match(/"([^"]*)"/g);
      if (matches) {
        matches.forEach(match => {
          const title = match.replace(/"/g, '');
          if (title.length > 3 && !titles.includes(title)) {
            titles.push(title);
          }
        });
      }
    }
  });

  return titles.slice(0, 5); // Max 5 recent titles
}

/**
 * Classify user query intent for specialized prompt handling
 */
function classifyQueryIntent(query: string, conversationHistory: ChatMessage[]): string {
  const lowerQuery = query.toLowerCase();

  // PRIORITY 1: Comparison queries (most specific)
  const comparisonIndicators = ['compare', 'difference between', 'versus', 'vs', 'better than'];
  if (comparisonIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'comparison';
  }

  // PRIORITY 2: Specific title information requests (higher priority than follow-up)
  // Pattern: "tell me (more) about [something]", "learn more about", "details about"
  const specificTitlePattern = /(tell me|learn|details?|more) (more )?(about|on) /;
  const infoIndicators = ['what is', 'who is', 'explain', 'describe', 'synopsis', 'plot'];

  if (specificTitlePattern.test(lowerQuery) || infoIndicators.some(ind => lowerQuery.includes(ind))) {
    return 'information';
  }

  // PRIORITY 3: Follow-up indicators (AFTER specific info check)
  // "tell me more" alone (without "about") stays as follow-up
  const followUpIndicators = ['also', 'more like', 'similar', 'another', 'different', 'what about', 'how about'];
  const isGenericTellMeMore = lowerQuery.trim() === 'tell me more' || lowerQuery.trim() === 'learn more';
  const isFollowUp = followUpIndicators.some(indicator => lowerQuery.includes(indicator)) ||
                     isGenericTellMeMore ||
                     conversationHistory.length >= 2;

  if (isFollowUp && conversationHistory.length >= 2) {
    return 'follow-up';
  }

  // PRIORITY 4: Recommendation requests
  const recommendationIndicators = ['recommend', 'suggest', 'should i', 'what should', 'good', 'best'];
  if (recommendationIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'recommendation';
  }

  // Default: discovery/search
  return 'discovery';
}

/**
 * Get specialized response guidelines based on query intent
 */
function getIntentGuidelines(intent: string): string {
  const guidelines = {
    'discovery': `
**For generic/broad searches (popular webtoons, trending, etc.):**
- ✅ Be conversational and exploratory, not prescriptive
- ✅ Share 2-3 titles with BRIEF highlights (not full details)
- ✅ Frame as "here's what's catching attention" rather than "you should read"
- ✅ Ask follow-up questions about their preferences
- ✅ Include cultural context or trends
- ✅ Always end with 3 clickable follow-up suggestions to narrow down preferences

Example approach:
"Right now in Korean content, there's a lot of buzz around [mention 2-3 titles with brief hooks].

But here's the thing - 'popular' can mean very different things! Are you drawn to:
[3 specific follow-up questions as clickable suggestions based on the titles shown]"`,

    'comparison': `
- Provide clear, structured comparisons between titles
- Highlight key differences in genre, tone, pacing, themes
- Use comparison format: "While [Title A] focuses on X, [Title B] explores Y"
- Help user decide based on their preferences`,

    'information': `
**"Tell me about [Title]" - SINGLE TITLE EXCLUSIVE FOCUS:**

🚨 **MANDATORY RULES**:
1. ❌ DO NOT mention ANY other title besides the one user asked about
2. ❌ DO NOT add "Related Recommendations", "Similar Titles", or "You might also like" sections
3. ❌ DO NOT compare to other titles or reference other works
4. ❌ DO NOT write generic AI-generated descriptions
5. ❌ DO NOT make up content or invent details
6. ✅ Focus EXCLUSIVELY on the single requested title
7. ✅ Use ONLY database fields for this specific title
8. ✅ MUST follow the conditional structure below
9. ✅ End response with title detail page link

🚨 **CONDITIONAL DISPLAY RULES** (Show section ONLY if data exists):

**Story Synopsis**:
- Show this section ONLY if synopsis field has actual content
- Skip entirely if "Not available" or empty

**Genre & Tone**:
- Show this section ONLY if at least ONE field (genre, tone, content_format) has data
- Omit individual lines where value is "Not specified" or empty
- Skip entire section if all three fields are empty/not specified

**What Makes It Unique**:
- Show this section ONLY if perfect_for OR audience has actual content (not "Not specified")
- Skip entirely if both fields are "Not specified" or empty

**Perfect For**:
- Show this section ONLY if perfect_for field has actual content
- Skip entirely if "Not specified" or empty

**Comparable Titles**:
- Show this section ONLY if comps array has items
- Skip entirely if "Not available" or empty

**Additional Details**:
- Show this section ONLY if at least ONE field has data
- Omit individual lines where value is "Not specified" or "N/A"
- Skip entire section if all fields are empty/not specified

**CRITICAL**: If a section has no data, COMPLETELY OMIT IT from the response. Do not show section headers with "[Not specified]" placeholders.

**REQUIRED STRUCTURE** (conditionally include sections):

**About "{title_name_en or title_name_kr}"**
[2-sentence hook using available fields]

[ONLY IF synopsis exists]
**Story Synopsis**
[Copy FULL synopsis field]

[ONLY IF at least one of genre/tone/content_format exists]
**Genre & Tone**
[Show only fields that have data, omit lines with "Not specified"]

[ONLY IF perfect_for OR audience has data]
**What Makes It Unique**
[Use perfect_for + audience fields that have data]

[ONLY IF perfect_for exists]
**Perfect For**
[EXACT perfect_for field]

[ONLY IF comps array has items]
**Comparable Titles**
[List EXACT comps from database as bullets]

[ONLY IF at least one field has data]
**Additional Details**
[Show only fields with actual values, skip "Not specified" or "N/A" fields]

**[View Full Details →](/buyers/titles/TITLE_ID_PLACEHOLDER)**

**END OF RESPONSE** - Do not add anything after the link.`,

    'recommendation': `
- Be confident and specific in recommendations
- Explain WHY each title matches their request
- Prioritize titles with highest similarity scores
- Offer alternatives: "If you enjoy X, you'll love Y because..."`,

    'follow-up': `
**Follow-up responses MUST deeply integrate prior context:**
- ✅ Explicitly reference user's previous messages: "You mentioned [specific detail]..."
- ✅ Build on earlier title recommendations: "Following up on [title] we discussed..."
- ✅ Notice preference patterns: "I'm noticing you're drawn to [pattern]..."
- ✅ Connect dots between interactions: "This relates to what you said about [earlier point]"
- ✅ Progress the conversation: Move from broad → specific
- ❌ DO NOT restart or ignore earlier context
- ❌ DO NOT repeat what was already covered

Format:
1. Acknowledge prior context (1 sentence)
2. Build on it with new recommendations
3. Deepen exploration with specific follow-ups`
  };

  return guidelines[intent] || guidelines['discovery'];
}

/**
 * Validates AI response to catch title hallucinations
 * Ensures AI only mentions titles that exist in search results
 * Enhanced to catch ALL title patterns (not just quoted)
 */
function validateAIResponse(response: string, validTitles: VectorSearchResult[]): {
  validatedResponse: string;
  hallucinations: string[];
  isValid: boolean;
} {
  if (validTitles.length === 0) {
    // No search results, no validation needed
    return { validatedResponse: response, hallucinations: [], isValid: true };
  }

  // Build list of valid title names (exact matching)
  const validTitleNames = new Set<string>();
  validTitles.forEach(title => {
    if (title.title_name_en) validTitleNames.add(title.title_name_en.toLowerCase());
    if (title.title_name_kr) validTitleNames.add(title.title_name_kr.toLowerCase());
  });

  // Extract potential title mentions using multiple patterns
  const potentialTitles = new Set<string>();

  // Pattern 1: Quoted strings (existing)
  const quotedMatches = response.match(/"([^"]*)"/g) || [];
  quotedMatches.forEach(q => potentialTitles.add(q.replace(/"/g, '')));

  // Pattern 2: Single quotes
  const singleQuotedMatches = response.match(/'([^']*)'/g) || [];
  singleQuotedMatches.forEach(q => potentialTitles.add(q.replace(/'/g, '')));

  // Pattern 3: Title-like capitalized phrases (common Korean title patterns)
  // Matches: "20th Century Girl", "My ID is Gangnam Beauty", "Dear My Friends"
  const titlePatterns = [
    /\b([A-Z][a-zA-Z]*(?:\s+[A-Z]?[a-z]+){1,5}(?:\s+(?:Girl|Boy|Beauty|Friends|Love|Story|Dream|Life|Night|Day|World)))\b/g,
    /\b([0-9]{1,2}(?:st|nd|rd|th)\s+Century\s+[A-Z][a-z]+)\b/g,
    /\b(My\s+[A-Z][A-Z]+\s+is\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    /\b(Dear\s+(?:My\s+)?[A-Z][a-z]+)\b/g
  ];

  titlePatterns.forEach(pattern => {
    const matches = response.match(pattern) || [];
    matches.forEach(match => {
      // Skip if too short or too long
      if (match.length > 5 && match.length < 50) {
        potentialTitles.add(match);
      }
    });
  });

  // Check for hallucinations
  const hallucinations: string[] = [];
  let validatedResponse = response;

  potentialTitles.forEach(mentioned => {
    const mentionedLower = mentioned.toLowerCase().trim();

    // Skip generic terms
    const genericTerms = ['korean title', 'korean drama', 'korean webtoon', 'the title', 'this title'];
    if (genericTerms.some(term => mentionedLower === term)) {
      return;
    }

    // Check if mentioned title exists in valid titles
    const isValid = Array.from(validTitleNames).some(validTitle =>
      mentionedLower === validTitle ||
      mentionedLower.includes(validTitle) ||
      validTitle.includes(mentionedLower)
    );

    if (!isValid && mentioned.length > 5) {
      hallucinations.push(mentioned);
      // Replace with clear indicator
      const replacements = [
        { pattern: `"${mentioned}"`, replacement: '[removed fictional title]' },
        { pattern: `'${mentioned}'`, replacement: '[removed fictional title]' },
        { pattern: mentioned, replacement: '[removed fictional title]' }
      ];

      replacements.forEach(({ pattern, replacement }) => {
        if (validatedResponse.includes(pattern)) {
          validatedResponse = validatedResponse.replace(pattern, replacement);
        }
      });
    }
  });

  const isValid = hallucinations.length === 0;

  if (!isValid) {
    console.warn('⚠️ Title hallucinations detected:', {
      count: hallucinations.length,
      hallucinated: hallucinations,
      validTitleCount: validTitleNames.size,
      validTitles: Array.from(validTitleNames).slice(0, 5)
    });
  }

  return { validatedResponse, hallucinations, isValid };
}

/**
 * Filter out duplicate suggestions based on conversation history
 * Prevents suggesting queries user has already asked
 */
function filterDuplicateSuggestions(suggestions: string[], conversationHistory: ChatMessage[]): string[] {
  // Extract all previous user queries
  const previousQueries = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase().trim());

  if (previousQueries.length === 0) {
    return suggestions; // No history, return all suggestions
  }

  // Filter out suggestions that match previous queries (fuzzy match)
  return suggestions.filter(suggestion => {
    const suggestionLower = suggestion.toLowerCase().trim();

    // Check for exact or near-exact matches
    const isDuplicate = previousQueries.some(prevQuery => {
      // Exact match
      if (suggestionLower === prevQuery) return true;

      // Contains match (suggestion contains previous query or vice versa)
      if (suggestionLower.includes(prevQuery) || prevQuery.includes(suggestionLower)) return true;

      // Pattern match: "Tell me more about X" patterns
      const tellMePattern = /tell me (?:more )?about\s+"?([^"]+)"?/i;
      const sugMatch = suggestion.match(tellMePattern);
      const prevMatch = prevQuery.match(tellMePattern);

      if (sugMatch && prevMatch) {
        // Both are "tell me about" queries - check if same title
        const sugTitle = sugMatch[1].toLowerCase().trim();
        const prevTitle = prevMatch[1].toLowerCase().trim();
        if (sugTitle === prevTitle) return true;
      }

      return false;
    });

    return !isDuplicate;
  });
}

/**
 * Validate suggestion format to prevent malformed templates
 * Fixes bug: "Which of these N is most like [complex query]?"
 */
function validateSuggestionFormat(suggestion: string, userQuery: string): boolean {
  // Reject if suggestion contains the user's full query (indicates template bug)
  if (suggestion.toLowerCase().includes(userQuery.toLowerCase())) {
    // Exception: "Tell me more about X" is valid
    if (suggestion.toLowerCase().startsWith('tell me more about')) {
      return true;
    }
    return false;
  }

  // Reject if suggestion is too short or too long
  if (suggestion.length < 10 || suggestion.length > 150) {
    return false;
  }

  // Reject if suggestion has malformed question patterns
  const malformedPatterns = [
    /which of these \d+ is most like tell me/i,  // Bug pattern
    /which of these \d+ is most like compare/i,   // Bug pattern
    /more like more like/i,                        // Duplicate words
  ];

  if (malformedPatterns.some(pattern => pattern.test(suggestion))) {
    return false;
  }

  return true;
}

/**
 * Detect conversation stage for adaptive suggestions
 */
function getConversationStage(conversationHistory: ChatMessage[]): 'initial' | 'exploring' | 'deepdive' {
  const messageCount = conversationHistory.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  ).length;

  if (messageCount <= 2) return 'initial';
  if (messageCount <= 5) return 'exploring';
  return 'deepdive';
}

/**
 * Analyzes AI response to detect if suggestions were already provided
 * This prevents duplication of suggestions in the UI
 */
function analyzeAIResponse(response: string): {
  hasTrySection: boolean;
  hasQuestions: boolean;
  questionCount: number;
  titlesDiscussed: string[];
  themesDiscussed: string[];
  hasBulletList: boolean;
} {
  const lowerResponse = response.toLowerCase();

  // Detect "Try:" section
  const hasTrySection = /try:/i.test(response);

  // Detect bullet points or numbered lists (common suggestion patterns)
  const bulletPatterns = [
    /^[\s]*[-•*]\s+/gm,  // Bullet points with -, •, *
    /^[\s]*\d+\.\s+/gm   // Numbered lists
  ];
  const hasBulletList = bulletPatterns.some(pattern => pattern.test(response));

  // Count questions (ending with ?)
  const questionMatches = response.match(/\?/g);
  const questionCount = questionMatches ? questionMatches.length : 0;

  // Has questions if there are 2+ question marks
  const hasQuestions = questionCount >= 2;

  // Extract quoted titles (titles are usually in quotes)
  const titleMatches = response.match(/"([^"]+)"/g) || [];
  const titlesDiscussed = titleMatches
    .map(match => match.replace(/"/g, ''))
    .filter(title => title.length > 3 && title.length < 100); // Filter out short/long matches

  // Extract common storytelling themes
  const themeKeywords = [
    'romance', 'action', 'thriller', 'drama', 'comedy', 'horror', 'fantasy',
    'mystery', 'supernatural', 'revenge', 'redemption', 'time travel',
    'character development', 'plot-driven', 'slow burn', 'fast-paced',
    'enemies to lovers', 'found family', 'coming of age', 'dark', 'light-hearted'
  ];

  const themesDiscussed = themeKeywords.filter(theme =>
    lowerResponse.includes(theme)
  );

  console.log('🔍 AI Response Analysis:', {
    hasTrySection,
    hasQuestions,
    questionCount,
    hasBulletList,
    titlesDiscussedCount: titlesDiscussed.length,
    themesDiscussedCount: themesDiscussed.length,
    sampleTitles: titlesDiscussed.slice(0, 3),
    sampleThemes: themesDiscussed.slice(0, 5)
  });

  return {
    hasTrySection,
    hasQuestions,
    questionCount,
    titlesDiscussed,
    themesDiscussed,
    hasBulletList
  };
}

/**
 * Get stage-based fallback suggestions
 */
function getStageBasedFallbacks(
  stage: 'initial' | 'exploring' | 'deepdive',
  searchResults: VectorSearchResult[]
): string[] {
  const fallbacks: string[] = [];
  const hasResults = searchResults.length > 0;

  if (stage === 'initial') {
    // Early exploration
    fallbacks.push("What genres interest you most?");
    fallbacks.push("Do you prefer character-driven or plot-heavy stories?");
    if (hasResults) {
      const genres = new Set(searchResults.flatMap(r => Array.isArray(r.genre) ? r.genre : [r.genre]).filter(Boolean));
      if (genres.size > 0) {
        const genreArray = Array.from(genres);
        fallbacks.push(`Are you looking for ${genreArray[0].toLowerCase()} specifically?`);
      }
    }
  } else if (stage === 'exploring') {
    // Narrowing down
    if (hasResults && searchResults.length > 1) {
      const titles = searchResults.map(r => r.title_name_en || r.title_name_kr).filter(Boolean);
      if (titles.length >= 2) {
        fallbacks.push(`Compare "${titles[0]}" to "${titles[1]}"`);
      }
    }
    fallbacks.push("What specific themes or elements are you looking for?");
  } else {
    // Deep dive
    if (hasResults) {
      const authors = new Set(searchResults.map(r => r.story_author).filter(Boolean));
      if (authors.size > 0) {
        const authorArray = Array.from(authors);
        fallbacks.push(`More works from ${authorArray[0]}`);
      }
    }
    fallbacks.push("Any particular storytelling style you prefer?");
  }

  return fallbacks;
}

/**
 * Extract query themes and user preferences for context-aware suggestions
 * Analyzes user query to understand specific interests beyond metadata
 */
function extractQueryThemes(userQuery: string): {
  characterTraits: string[];
  plotElements: string[];
  tonePreferences: string[];
  settingDetails: string[];
  formatPreferences: string[];
  genreThemes: string[];
} {
  const lowerQuery = userQuery.toLowerCase();

  const themes = {
    characterTraits: [] as string[],
    plotElements: [] as string[],
    tonePreferences: [] as string[],
    settingDetails: [] as string[],
    formatPreferences: [] as string[],
    genreThemes: [] as string[]
  };

  // Character trait patterns
  const characterPatterns = [
    { pattern: /strong (female |male )?lead/i, trait: 'strong lead' },
    { pattern: /complex (protagonist|villain|character)/i, trait: 'complex character' },
    { pattern: /(badass|powerful|capable) (protagonist|lead|hero)/i, trait: 'powerful protagonist' },
    { pattern: /(underdog|weak to strong)/i, trait: 'underdog story' },
    { pattern: /morally (gray|grey|ambiguous)/i, trait: 'morally complex' },
    { pattern: /(anti-hero|antihero)/i, trait: 'anti-hero' }
  ];

  // Plot element patterns
  const plotPatterns = [
    { pattern: /revenge/i, element: 'revenge' },
    { pattern: /redemption/i, element: 'redemption' },
    { pattern: /love triangle/i, element: 'love triangle' },
    { pattern: /time (travel|loop)/i, element: 'time manipulation' },
    { pattern: /reincarnation/i, element: 'reincarnation' },
    { pattern: /(mystery|whodunit)/i, element: 'mystery' },
    { pattern: /betrayal/i, element: 'betrayal' }
  ];

  // Tone patterns
  const tonePatterns = [
    { pattern: /dark|gritty|intense/i, tone: 'dark' },
    { pattern: /wholesome|heartwarming|uplifting/i, tone: 'wholesome' },
    { pattern: /emotional|tearjerker|moving/i, tone: 'emotional' },
    { pattern: /comedic|funny|lighthearted/i, tone: 'comedic' },
    { pattern: /suspenseful|tense|thrilling/i, tone: 'suspenseful' }
  ];

  // Setting patterns
  const settingPatterns = [
    { pattern: /historical|period/i, setting: 'historical' },
    { pattern: /modern|contemporary/i, setting: 'modern' },
    { pattern: /office|workplace/i, setting: 'workplace' },
    { pattern: /school|university|college/i, setting: 'school' },
    { pattern: /fantasy world/i, setting: 'fantasy world' }
  ];

  // Genre/Theme patterns (for genre-specific queries)
  const genrePatterns = [
    { pattern: /ghost|supernatural|paranormal|spirit/i, genre: 'supernatural' },
    { pattern: /horror|scary|creepy|terrifying/i, genre: 'horror' },
    { pattern: /fantasy|magic|magical/i, genre: 'fantasy' },
    { pattern: /sci-fi|science fiction|dystopian|cyberpunk/i, genre: 'sci-fi' },
    { pattern: /slice of life|everyday|daily life/i, genre: 'slice of life' },
    { pattern: /zombie|apocalypse|post-apocalyptic/i, genre: 'apocalyptic' }
  ];

  // Extract matches
  characterPatterns.forEach(({ pattern, trait }) => {
    if (pattern.test(userQuery)) themes.characterTraits.push(trait);
  });

  plotPatterns.forEach(({ pattern, element }) => {
    if (pattern.test(userQuery)) themes.plotElements.push(element);
  });

  tonePatterns.forEach(({ pattern, tone }) => {
    if (pattern.test(userQuery)) themes.tonePreferences.push(tone);
  });

  settingPatterns.forEach(({ pattern, setting }) => {
    if (pattern.test(userQuery)) themes.settingDetails.push(setting);
  });

  genrePatterns.forEach(({ pattern, genre }) => {
    if (pattern.test(userQuery)) themes.genreThemes.push(genre);
  });

  // Format preferences
  if (/completed|finished/i.test(userQuery)) themes.formatPreferences.push('completed');
  if (/short|quick read|under \d+ chapter/i.test(userQuery)) themes.formatPreferences.push('short series');
  if (/ongoing|current/i.test(userQuery)) themes.formatPreferences.push('ongoing');

  console.log('🎯 Extracted query themes:', {
    query: userQuery.substring(0, 50) + '...',
    themes,
    hasThemes: Object.values(themes).some(arr => arr.length > 0)
  });

  return themes;
}

/**
 * Mix suggestions from different types using round-robin to ensure diversity
 * Limits each type to max 2 suggestions in final output to prevent repetition
 */
function mixDiverseSuggestions(
  type0: string[],
  type2: string[],
  type3: string[],
  type5: string[],
  typeIntent: string[],
  maxTotal: number = 5
): string[] {
  const mixed: string[] = [];
  const sources = [
    { type: 'context-aware', suggestions: type0, maxPick: 2 },
    { type: 'genre-vibe', suggestions: type2, maxPick: 2 },
    { type: 'comp-based', suggestions: type3, maxPick: 1 },
    { type: 'author', suggestions: type5, maxPick: 1 },
    { type: 'intent', suggestions: typeIntent, maxPick: 1 }
  ];

  // Track how many we've taken from each source
  const picked = new Map<string, number>();
  sources.forEach(s => picked.set(s.type, 0));

  // Round-robin: take 1 from each source in rotation
  let round = 0;
  while (mixed.length < maxTotal && round < 10) { // max 10 rounds to prevent infinite loop
    let addedThisRound = false;

    for (const source of sources) {
      if (mixed.length >= maxTotal) break;

      const currentPicked = picked.get(source.type) || 0;
      const availableIndex = currentPicked;

      // Check if we can still pick from this source
      if (currentPicked < source.maxPick && availableIndex < source.suggestions.length) {
        const suggestion = source.suggestions[availableIndex];
        if (!mixed.includes(suggestion)) { // Avoid duplicates
          mixed.push(suggestion);
          picked.set(source.type, currentPicked + 1);
          addedThisRound = true;
        }
      }
    }

    // If we didn't add anything this round, we're done
    if (!addedThisRound) break;
    round++;
  }

  console.log('🎨 Diversity mixing:', {
    type0Count: picked.get('context-aware'),
    type2Count: picked.get('genre-vibe'),
    type3Count: picked.get('comp-based'),
    type5Count: picked.get('author'),
    intentCount: picked.get('intent'),
    totalMixed: mixed.length
  });

  return mixed;
}

/**
 * Generate 3-5 smart follow-up query suggestions based on context
 * Uses ChatGPT/Claude-style specific, contextual suggestions
 * NOW WITH: AI response analysis for context-aware, non-duplicate suggestions
 */
function generateSuggestedQueries(context: {
  queryIntent: string;
  searchResults: VectorSearchResult[];
  userQuery: string;
  conversationHistory: ChatMessage[];
  aiResponse?: string; // NEW: AI response text for context-aware suggestions
  responseAnalysis?: { // NEW: Pre-analyzed AI response data
    hasTrySection: boolean;
    hasQuestions: boolean;
    questionCount: number;
    titlesDiscussed: string[];
    themesDiscussed: string[];
    hasBulletList: boolean;
  };
}): string[] {
  const { queryIntent, searchResults, userQuery, conversationHistory, aiResponse, responseAnalysis } = context;

  // Early return if no search results
  if (!searchResults || searchResults.length === 0) {
    return [
      "Show me top rated Korean titles",
      "What's trending this month?",
      "Recommend popular webtoons"
    ];
  }

  // ========== RESPONSE-AWARE ANALYSIS (NEW) ==========
  // Use AI response data to generate contextual, complementary suggestions
  const responseAwareSuggestions: string[] = [];

  if (responseAnalysis && aiResponse) {
    console.log('🧠 Generating response-aware suggestions:', {
      titlesDiscussed: responseAnalysis.titlesDiscussed.length,
      themesDiscussed: responseAnalysis.themesDiscussed.length,
      hasQuestions: responseAnalysis.hasQuestions,
      hasTrySection: responseAnalysis.hasTrySection
    });

    // Build on titles mentioned by AI
    if (responseAnalysis.titlesDiscussed.length > 0) {
      const discussedTitle = responseAnalysis.titlesDiscussed[0];

      // Find other titles in search results NOT discussed
      const undiscussedTitles = searchResults.filter(r => {
        const rTitle = r.title_name_en || r.title_name_kr || '';
        return !responseAnalysis.titlesDiscussed.some(discussed =>
          rTitle.toLowerCase().includes(discussed.toLowerCase()) ||
          discussed.toLowerCase().includes(rTitle.toLowerCase())
        );
      });

      if (undiscussedTitles.length > 0) {
        const alternativeTitle = undiscussedTitles[0].title_name_en || undiscussedTitles[0].title_name_kr;
        responseAwareSuggestions.push(`How does "${alternativeTitle}" compare?`);
      }

      // Suggest deeper exploration of discussed title
      if (responseAnalysis.themesDiscussed.length > 0) {
        const theme = responseAnalysis.themesDiscussed[0];
        responseAwareSuggestions.push(`More ${theme} stories like "${discussedTitle}"`);
      }
    }

    // Build on themes mentioned by AI
    if (responseAnalysis.themesDiscussed.length >= 2) {
      const theme1 = responseAnalysis.themesDiscussed[0];
      const theme2 = responseAnalysis.themesDiscussed[1];
      responseAwareSuggestions.push(`${theme1} vs ${theme2} - which do you prefer?`);
    } else if (responseAnalysis.themesDiscussed.length === 1) {
      const theme = responseAnalysis.themesDiscussed[0];
      // Suggest contrasting themes
      const contrastMap: Record<string, string> = {
        'romance': 'action',
        'action': 'romance',
        'dark': 'wholesome',
        'wholesome': 'dark',
        'thriller': 'comedy',
        'comedy': 'thriller'
      };
      const contrast = contrastMap[theme] || 'different genre';
      responseAwareSuggestions.push(`What about ${contrast} instead of ${theme}?`);
    }

    // If AI provided questions, don't repeat - offer specific examples instead
    if (responseAnalysis.hasQuestions || responseAnalysis.hasTrySection) {
      // AI asked broad questions, chips should provide specific examples
      if (searchResults.length >= 2) {
        const title1 = searchResults[0].title_name_en || searchResults[0].title_name_kr;
        const title2 = searchResults[1].title_name_en || searchResults[1].title_name_kr;
        responseAwareSuggestions.push(`For example: "${title1}" or "${title2}"`);
      }
    }

    console.log('🎯 Response-aware suggestions:', {
      count: responseAwareSuggestions.length,
      suggestions: responseAwareSuggestions
    });
  }

  // Extract rich metadata from search results
  const titles = searchResults.map(r => r.title_name_en || r.title_name_kr).filter(Boolean);
  const genres = new Set<string>();
  const tones = new Set<string>();
  const formats = new Set<string>();
  const allComps: string[] = [];
  const authors = new Set<string>();

  searchResults.forEach(result => {
    // Genres
    if (Array.isArray(result.genre)) {
      result.genre.forEach(g => genres.add(g));
    } else if (result.genre) {
      genres.add(result.genre);
    }

    // Tones
    if (result.tone) tones.add(result.tone);

    // Formats
    if (result.content_format) formats.add(result.content_format);

    // Comps
    if (Array.isArray(result.comps)) {
      allComps.push(...result.comps.filter(Boolean));
    }

    // Authors
    if (result.story_author) authors.add(result.story_author);
    if (result.art_author) authors.add(result.art_author);
  });

  const genreArray = Array.from(genres);
  const toneArray = Array.from(tones);
  const formatArray = Array.from(formats);
  const authorArray = Array.from(authors);
  const uniqueComps = [...new Set(allComps)];

  // TYPE 0: CONTEXT-AWARE SUGGESTIONS (Highest Priority - NEW)
  // Extract user's specific interests from their query
  const queryThemes = extractQueryThemes(userQuery);
  const contextAwareSuggestions: string[] = [];

  // Only generate if we found meaningful themes
  const hasThemes = Object.values(queryThemes).some(arr => arr.length > 0);

  if (hasThemes && searchResults.length > 0) {
    // Character-focused refinements
    if (queryThemes.characterTraits.length > 0) {
      const trait = queryThemes.characterTraits[0];
      if (genreArray.length > 0) {
        contextAwareSuggestions.push(`${genreArray[0]} where the ${trait} drives the plot`);
      }
      // Variation: opposite trait or alternative perspective
      if (trait.includes('strong')) {
        contextAwareSuggestions.push(`Stories with vulnerable protagonists instead`);
      } else if (trait.includes('underdog')) {
        contextAwareSuggestions.push(`Already powerful protagonists vs. underdog stories`);
      } else if (trait.includes('anti-hero')) {
        contextAwareSuggestions.push(`Traditional heroes vs. anti-heroes`);
      }
    }

    // Plot-focused refinements
    if (queryThemes.plotElements.length > 0) {
      const element = queryThemes.plotElements[0];
      if (genreArray.length > 0) {
        contextAwareSuggestions.push(`${genreArray[0]} with ${element} but happy ending`);
      }
      // Combine plot element with tone
      if (toneArray.length > 0) {
        contextAwareSuggestions.push(`${element} stories with ${toneArray[0]} tone`);
      }
      // Plot variations
      if (element === 'revenge') {
        contextAwareSuggestions.push(`Revenge stories with redemption arcs`);
      } else if (element === 'time manipulation') {
        contextAwareSuggestions.push(`Time travel with romance vs. pure plot focus`);
      }
    }

    // Tone-focused refinements
    if (queryThemes.tonePreferences.length > 0 && genreArray.length > 0) {
      const tone = queryThemes.tonePreferences[0];
      // Suggest varying intensity
      const toneVariations = {
        'dark': 'darker and more intense',
        'wholesome': 'even more heartwarming',
        'emotional': 'less emotional but still moving',
        'comedic': 'more serious with light moments',
        'suspenseful': 'slower burn suspense'
      };
      const variation = toneVariations[tone as keyof typeof toneVariations] || 'different tone';
      contextAwareSuggestions.push(`${genreArray[0]} that's ${variation}`);
    }

    // Setting-focused refinements
    if (queryThemes.settingDetails.length > 0 && genreArray.length > 0) {
      const setting = queryThemes.settingDetails[0];
      contextAwareSuggestions.push(`${genreArray[0]} in ${setting} setting with modern twist`);
    }

    // Genre-focused refinements (NEW - for genre-specific queries like "ghost story")
    if (queryThemes.genreThemes.length > 0) {
      const genreTheme = queryThemes.genreThemes[0];

      // Suggest intensity variations and sub-genres
      if (genreTheme === 'horror') {
        contextAwareSuggestions.push(`Psychological horror vs. supernatural horror`);
        if (toneArray.length > 0 && genreArray.length > 0) {
          contextAwareSuggestions.push(`${genreArray[0]} horror with ${toneArray[0]} tone`);
        } else if (genreArray.length > 0) {
          contextAwareSuggestions.push(`${genreArray[0]} with horror elements`);
        }
      } else if (genreTheme === 'supernatural') {
        contextAwareSuggestions.push(`Supernatural with mystery elements vs. pure horror`);
        contextAwareSuggestions.push(`Ghost stories with emotional depth`);
        if (genreArray.length > 0) {
          contextAwareSuggestions.push(`${genreArray[0]} with supernatural twists`);
        }
      } else if (genreTheme === 'fantasy') {
        contextAwareSuggestions.push(`High fantasy vs. urban fantasy`);
        contextAwareSuggestions.push(`Fantasy with romance vs. action-focused`);
      } else if (genreTheme === 'sci-fi') {
        contextAwareSuggestions.push(`Hard sci-fi vs. soft sci-fi`);
        contextAwareSuggestions.push(`Dystopian themes vs. space exploration`);
      } else if (genreTheme === 'apocalyptic') {
        contextAwareSuggestions.push(`Zombie apocalypse vs. other survival scenarios`);
        contextAwareSuggestions.push(`Post-apocalyptic with hope vs. bleak endings`);
      }
    }

    // Format-focused refinements
    if (queryThemes.formatPreferences.length > 0) {
      const pref = queryThemes.formatPreferences[0];
      if (titles.length > 0) {
        contextAwareSuggestions.push(`Is "${titles[0]}" ${pref}?`);
      }
      // Check if 'short series' is in any of the preferences
      if (queryThemes.formatPreferences.includes('short series') && genreArray.length > 0) {
        contextAwareSuggestions.push(`Quick ${genreArray[0]} reads under 30 chapters`);
      }
    }

    // Multi-criteria combinations (when user has multiple specific preferences)
    if (queryThemes.characterTraits.length > 0 && queryThemes.plotElements.length > 0) {
      contextAwareSuggestions.push(
        `${queryThemes.characterTraits[0]} in ${queryThemes.plotElements[0]} story`
      );
    }
    if (queryThemes.characterTraits.length > 0 && queryThemes.settingDetails.length > 0) {
      contextAwareSuggestions.push(
        `${queryThemes.characterTraits[0]} in ${queryThemes.settingDetails[0]} setting`
      );
    }

    console.log('🎯 Context-aware suggestions generated:', {
      queryThemes,
      suggestionsCount: contextAwareSuggestions.length,
      suggestions: contextAwareSuggestions
    });
  }

  // Collect suggestions into type-specific arrays for diversity mixing
  // Add response-aware suggestions as highest priority (Type -1)
  const typeM1_responseAware: string[] = [...responseAwareSuggestions];
  const type0_contextAware: string[] = [...contextAwareSuggestions];
  const type2_genreVibe: string[] = [];
  const type3_compBased: string[] = [];
  const type5_author: string[] = [];
  const typeIntent_specific: string[] = [];

  // TYPE 2: Cross-Genre Hybrid & Vibe Exploration (ENHANCED)
  if (genreArray.length >= 1) {
    const mainGenre = genreArray[0];

    // Tone + Genre combinations
    if (toneArray.length > 0) {
      const mainTone = toneArray[0];
      type2_genreVibe.push(`${mainGenre} with ${mainTone} tone`);
      type2_genreVibe.push(`More ${mainTone} ${mainGenre.toLowerCase()} stories`);

      // Opposite tone variation
      const oppositeTone = mainTone === 'dark' ? 'uplifting' :
                          mainTone === 'wholesome' ? 'darker' :
                          mainTone === 'emotional' ? 'lighter' :
                          mainTone === 'suspenseful' ? 'relaxed' :
                          mainTone === 'tense' ? 'lighter' : 'different';
      type2_genreVibe.push(`${mainGenre} with ${oppositeTone} tone instead`);
    }

    // Cross-genre if multiple genres available
    if (genreArray.length >= 2) {
      type2_genreVibe.push(`${genreArray[0]} meets ${genreArray[1]}`);
      type2_genreVibe.push(`${genreArray[0]} with ${genreArray[1]} elements`);
    }

    // Vibe-based variations (if no tone specified)
    if (toneArray.length === 0) {
      type2_genreVibe.push(`${mainGenre} with complex characters`);
      type2_genreVibe.push(`${mainGenre} with unexpected twists`);
      type2_genreVibe.push(`${mainGenre} with strong character development`);
    }
  }

  // TYPE 3: Comp-Based Navigation (Using comps field)
  if (uniqueComps.length > 0) {
    const firstComp = uniqueComps[0];
    if (formatArray.length > 0) {
      type3_compBased.push(`Titles like "${firstComp}" but in ${formatArray[0].toLowerCase()} format`);
    } else {
      type3_compBased.push(`More stories similar to "${firstComp}"`);
    }
  }

  // TYPE 5: Author/Creator Discovery
  if (authorArray.length > 0) {
    const firstAuthor = authorArray[0];
    type5_author.push(`More from ${firstAuthor}`);
  }

  // Intent-Specific Enhancements
  if (queryIntent === 'comparison' && titles.length >= 2) {
    typeIntent_specific.push(`What are the key differences between "${titles[0]}" and "${titles[1]}"?`);
  }

  if (queryIntent === 'information' && titles.length >= 1) {
    typeIntent_specific.push(`Is there a sequel to "${titles[0]}"?`);
  }

  // Mix suggestions from different types for diversity
  // PRIORITY: Response-aware suggestions first (based on actual AI output)
  let diverseSuggestions: string[] = [];

  // Add response-aware suggestions first (highest priority)
  if (typeM1_responseAware.length > 0) {
    diverseSuggestions.push(...typeM1_responseAware.slice(0, 3)); // Max 3 from response-aware
  }

  // Then mix other types if we need more
  if (diverseSuggestions.length < 5) {
    const remaining = 5 - diverseSuggestions.length;
    const mixedOthers = mixDiverseSuggestions(
      type0_contextAware,
      type2_genreVibe,
      type3_compBased,
      type5_author,
      typeIntent_specific,
      remaining
    );

    // Add non-duplicate suggestions from other types
    mixedOthers.forEach(sug => {
      if (!diverseSuggestions.includes(sug) && diverseSuggestions.length < 5) {
        diverseSuggestions.push(sug);
      }
    });
  }

  // If we still don't have enough, add smart fallbacks
  if (diverseSuggestions.length < 3) {
    if (genreArray.length > 0) {
      diverseSuggestions.push(`Best ${genreArray[0].toLowerCase()} for beginners`);
    }
    if (diverseSuggestions.length < 3) {
      diverseSuggestions.push("What's trending in Korean content right now?");
    }
  }

  // Final deduplication
  const uniqueSuggestions = [...new Set(diverseSuggestions)];

  console.log('💡 Generated diverse suggestions:', {
    count: uniqueSuggestions.length,
    responseAwareAvailable: typeM1_responseAware.length,
    type0Available: type0_contextAware.length,
    type2Available: type2_genreVibe.length,
    type3Available: type3_compBased.length,
    type5Available: type5_author.length,
    intentAvailable: typeIntent_specific.length,
    suggestions: uniqueSuggestions
  });

  // ENHANCEMENT: Context-aware post-processing (feature flag controlled)
  const useContextAware = Deno.env.get('ENABLE_SMART_SUGGESTIONS') === 'true';

  if (useContextAware) {
    try {
      console.log('🧠 Applying context-aware enhancements...');

      // Step 1: Filter duplicates based on conversation history
      const deduplicated = filterDuplicateSuggestions(uniqueSuggestions, conversationHistory);

      console.log('🔄 Deduplication:', {
        before: uniqueSuggestions.length,
        after: deduplicated.length,
        removed: uniqueSuggestions.length - deduplicated.length
      });

      // Step 2: Validate each suggestion format
      const validated = deduplicated.filter(s => validateSuggestionFormat(s, userQuery));

      console.log('✅ Validation:', {
        before: deduplicated.length,
        after: validated.length,
        removed: deduplicated.length - validated.length
      });

      // Step 3: Add stage-appropriate fallbacks if needed
      if (validated.length < 3) {
        const stage = getConversationStage(conversationHistory);
        const fallbacks = getStageBasedFallbacks(stage, searchResults);

        console.log('🎯 Adding fallbacks:', {
          stage,
          currentCount: validated.length,
          fallbacksAvailable: fallbacks.length
        });

        // Add fallbacks until we have 3-5 suggestions
        for (const fallback of fallbacks) {
          if (validated.length >= 5) break;
          if (!validated.includes(fallback)) {
            validated.push(fallback);
          }
        }
      }

      console.log('✨ Enhanced suggestions:', {
        final: validated.slice(0, 5),
        enhancementsApplied: true
      });

      return validated.slice(0, 5); // Max 5 suggestions
    } catch (error) {
      console.error('⚠️ Enhancement error, falling back to original:', error);
      // Fallback to original logic on any error
      return uniqueSuggestions.slice(0, 5);
    }
  }

  // Original logic (default when feature flag is off)
  return uniqueSuggestions.slice(0, 5); // Max 5 suggestions
}

function buildMasterPrompt(context: {
  userProfile: UserProfile;
  conversationHistory: ChatMessage[];
  searchResults: VectorSearchResult[];
  userQuery: string;
}): string {
  const { userProfile, conversationHistory, searchResults, userQuery } = context

  // Classify query intent for specialized handling
  const queryIntent = classifyQueryIntent(userQuery, conversationHistory);
  const intentGuidelines = getIntentGuidelines(queryIntent);

  // Weight conversation history (recent messages more important)
  const weightedHistory = weightConversationHistory(conversationHistory);

  // Extract recent title mentions for follow-up context
  const recentTitles = getRecentTitleMentions(conversationHistory);
  const hasRecentTitles = recentTitles.length > 0;

  // For information queries, extract title_id from first search result for link
  const titleIdForLink = (queryIntent === 'information' && searchResults.length > 0)
    ? searchResults[0].title_id
    : '';

  console.log('🎯 Query Intent Classified:', {
    intent: queryIntent,
    query: userQuery.substring(0, 50) + '...',
    conversationLength: conversationHistory.length,
    recentTitles: recentTitles.length,
    titleIdForLink: titleIdForLink || 'N/A'
  });

  // Detect if this is a fresh conversation start
  // Consider it fresh if:
  // 1. Very short current conversation (<=3 messages)
  // 2. OR explicitly asking for new recommendations ("looking for", "recommend", etc.)
  // 3. BUT NOT if it's a specific follow-up ("tell me more", "learn more")
  const currentConversationLength = conversationHistory.filter(msg =>
    msg.role === 'user' || msg.role === 'assistant'
  ).length;

  const freshStartIndicators = [
    'looking for', 'recommend', 'suggest', 'find me', 'show me',
    'i want', 'i need', 'help me find', 'what about', 'how about'
  ];

  const isSpecificFollowUp = userQuery.toLowerCase().includes('tell me more') ||
                            userQuery.toLowerCase().includes('learn more') ||
                            userQuery.toLowerCase().includes('compare');

  const isFreshStart = !isSpecificFollowUp && (
    currentConversationLength <= 3 ||
    freshStartIndicators.some(indicator => userQuery.toLowerCase().includes(indicator))
  );

  console.log('🆕 Fresh Start Detection:', {
    isFreshStart,
    currentConversationLength,
    isSpecificFollowUp,
    query: userQuery.substring(0, 50) + '...'
  });

  const tierDescription = {
    'basic': 'exploring Korean content',
    'invited': 'special access member',
    'pro': 'premium content enthusiast',
    'suite': 'full platform access with exclusive content'
  }[userProfile.tier || 'basic'] || 'Korean content explorer'

  return `CONTEXT: ${userProfile.full_name || 'User'} is asking about Korean content. Your task is to help them discover great stories by focusing on story craft and character development.

QUERY TYPE: ${queryIntent.toUpperCase()}
This is a ${queryIntent} query. Tailor your response accordingly.

🚨 **FORMATTING REQUIREMENTS (MANDATORY - NEVER VIOLATE)**:
1. ❌ NEVER use ### markdown headings (e.g., "### About", "### Related")
2. ✅ ALWAYS use **bold text** for section headers (e.g., "**About [Title]**", "**Related Recommendations**")
3. ❌ NEVER start with greetings like "안녕하세요", "Hello [name]", "Hi there"
4. ✅ ALWAYS start directly with your answer or recommendation

USER PROFILE:
- Name: ${userProfile.full_name || 'Fellow Korean content enthusiast'}
- Status: ${tierDescription}
- Account: ${userProfile.account_type === 'buyer' ? 'Content Buyer' : 'Content Creator'}
- Experience Level: ${userProfile.tier === 'basic' ? 'Getting started' : userProfile.tier === 'pro' ? 'Experienced' : 'Expert'}

CONVERSATION CONTEXT (Weighted by Recency):
${weightedHistory}

${hasRecentTitles ? `
RECENTLY DISCUSSED TITLES (Reference these for follow-ups):
${recentTitles.map((title, idx) => `${idx + 1}. "${title}"`).join('\n')}
` : ''}

${searchResults.length > 0 ? `
RELEVANT KOREAN CONTENT DISCOVERED (Complete Database Records):
${searchResults.map((result, idx) => {
  const title = result.title_name_en || result.title_name_kr
  const genres = Array.isArray(result.genre) ? result.genre.join(', ') : result.genre || 'Not specified'
  const comps = Array.isArray(result.comps) ? result.comps.join(', ') : result.comps || 'Not available'
  const matchScore = (result.similarity * 100).toFixed(0)

  return `${idx + 1}. "${title}" (${matchScore}% match)
   DATABASE FIELDS (Use these EXACT values in responses):
   • Title (EN): ${result.title_name_en || 'Not available'}
   • Title (KR): ${result.title_name_kr || 'Not available'}
   • Genre: ${genres}
   • Tone: ${result.tone || 'Not specified'}
   • Content Format: ${result.content_format || 'Not specified'}
   • Synopsis: ${result.synopsis || 'Not available'}
   • Perfect For: ${result.perfect_for || 'Not specified'}
   • Audience: ${result.audience || 'Not specified'}
   • Age Rating: ${result.age_rating || 'Not specified'}
   • Story Author: ${result.story_author || 'Not specified'}
   • Art Author: ${result.art_author || 'Not specified'}
   • Comparable Titles (Comps): ${comps}${formatPitchAnalytics(result)}`
}).join('\n\n')}

SEARCH INSIGHTS: Found ${searchResults.length} titles with complete database information. Use ONLY the fields provided above.` : ''}

CURRENT QUERY: "${userQuery}"

🎬 **CONVERSATION STAGE**:
${isFreshStart ? `
**THIS IS A FRESH CONVERSATION START**
- ❌ DO NOT provide direct answers or title recommendations yet
- ❌ DO NOT mention specific titles or give recommendations
- ✅ Write a brief 1-2 sentence warm intro
- ✅ Ask 2-3 natural follow-up questions to understand preferences (NO rigid "Try:" format)

**NATURAL CONVERSATION APPROACH**:
Instead of formal "Try:" lists, weave questions naturally into your response. Be conversational and exploratory.

**Example Output**:
"I'd love to help you discover the perfect Korean story! To narrow things down, I'm curious—what kind of emotional experience are you looking for? Are you drawn more to intense, plot-driven thrillers, or character journeys with slow-burn development? And do you have any specific themes in mind, like revenge, romance, or supernatural elements?"

**Key Principles**:
- Ask questions in paragraph form, not bullet lists
- Make questions feel like natural conversation
- Focus on preferences, not just metadata (genre, format)
- Keep it warm and collaborative, not prescriptive
` : `
**ONGOING CONVERSATION**
- ✅ Build on previous context and preferences
- ✅ Provide specific recommendations with reasoning
- ✅ Reference earlier discussion points
`}

RESPONSE GUIDELINES:

**Story-First Approach** (Default - 70% of responses):
1. **Lead with Story Craft**
   - "Let me tell you why this story works..."
   - "The character arc here is really smart because..."
   - "What hooked me is how the narrative structures..."
   - "Okay, story nerd moment—notice how the writer..."

2. **Discuss Structure Naturally**
   - Character journeys (want vs. need, arc completion)
   - Story beats (setup, inciting incident, midpoint, resolution)
   - Emotional core (what makes it resonate)
   - Theme exploration (what the story is really about)

3. **Ask Development Questions**
   - "What draws you to this character type?"
   - "Are you into slow-burn character development or fast-paced plot?"
   - "What emotional beats are you looking for in a story?"

**Business Layer** (Secondary - 30%, User-Triggered):
4. **Detect Business Signals and Respond**
   - TRIGGER KEYWORDS: "where", "platform", "network", "streaming", "TV", "budget", "pitch", "sell", "market", "adaptation", "production", "development", "where would this work", "where could this work"
   - When ANY trigger detected, IMMEDIATELY shift tone: "Oh, thinking about [specific aspect]? Let me break down..."
   - ALWAYS reference real examples: "Look at how Netflix handled Squid Game..." or "Apple TV+ did this with Pachinko..."
   - Connect story structure to business: "The character-driven structure here means...from a production standpoint..."
   - Use at least 3 business-related terms in your response when triggered

5. **Use Real Examples Only**
   - ✅ "Look at how Apple TV+ adapted 'Pachinko'..."
   - ✅ "HBO's approach with 'The Sympathizer' kept..."
   - ❌ Never: "When I was working on..." (no fictional personal history)

6. **Enthusiasm + Collaboration**
   - Be genuinely excited about storytelling
   - Talk WITH users, not AT them
   - Use phrases: "I'm curious...", "Tell me more about...", "What if..."
   - Avoid robotic lists—weave info into natural dialogue

7. **Context Awareness**
   - Always reference earlier conversation points
   - Notice patterns in preferences
   - Build continuity: "You mentioned earlier..." "Following up on..."

🚨 **CRITICAL ANTI-HALLUCINATION RULES** (NEVER VIOLATE):

**AVAILABLE TITLES**: You have ${searchResults.length} titles in the search results above.

**MANDATORY CONSTRAINTS**:
- ✅ ONLY recommend titles from the EXACT list provided in search results above
- ✅ Use EXACT title names as they appear (copy them precisely)
- ❌ DO NOT use your knowledge of Korean titles/dramas/webtoons
- ❌ DO NOT mention ANY title not in the search results
- ❌ DO NOT create fictional examples
- ❌ DO NOT mention popular titles like "20th Century Girl", "My ID is Gangnam Beauty", "Dear My Friends" unless they appear in search results

**CORRECT EXAMPLES**:
✅ "Based on the search results, I recommend '${searchResults[0]?.title_name_en || searchResults[0]?.title_name_kr || 'Title Name'}'..."
✅ "From the ${searchResults.length} titles found, '${searchResults[0]?.title_name_en || 'Title Name'}' matches your interests..."
✅ "I found ${searchResults.length} great options. Let me highlight '${searchResults[0]?.title_name_en || 'Title Name'}'..."

**WRONG EXAMPLES** (will fail validation):
❌ "You might like '20th Century Girl'..." (not in search results)
❌ "Similar to 'My ID is Gangnam Beauty'..." (not in search results)
❌ "Other popular titles include..." (inventing titles)

**IF NO SEARCH RESULTS** (${searchResults.length} === 0):
- ❌ DO NOT put the user's search term in quotes (causes false title linking)
- ❌ DO NOT repeat back their exact search query in quotes
- ✅ Acknowledge the search generally and ask for clarification
- ✅ Example: "I couldn't find matches for that query in our current catalog. Could you describe what you're looking for more specifically? For example, preferred genre, tone, or themes?"

**VALIDATION**: Every title you mention will be verified against search results. Hallucinations will be replaced with "[removed fictional title]"

INTENT-SPECIFIC APPROACH (${queryIntent.toUpperCase()}):
${intentGuidelines.replace('TITLE_ID_PLACEHOLDER', titleIdForLink || 'TITLE_ID_NOT_AVAILABLE')}

Focus on creating an engaging, personalized experience that helps discover amazing Korean content!`
}

async function saveResponseToDatabase(
  supabase: any,
  sessionId: string,
  userId: string,
  userQuery: string,
  aiResponse: string,
  searchResults: VectorSearchResult[],
  suggestedQueries: string[] = []
) {
  try {
    console.log('💾 Saving response to database', {
      searchResultsCount: searchResults.length,
      suggestedQueriesCount: suggestedQueries.length,
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

    // Save suggested queries if any
    if (suggestedQueries.length > 0 && aiMessage) {
      console.log('💡 Saving suggested queries', {
        count: suggestedQueries.length,
        messageId: aiMessage.id,
        queries: suggestedQueries
      });

      const queries = suggestedQueries.map((query, index) => ({
        message_id: aiMessage.id,
        session_id: sessionId,
        suggested_query: query,
        query_position: index
      }));

      const { error: queriesError } = await supabase
        .from('chat_suggested_queries')
        .insert(queries);

      if (queriesError) {
        console.error('❌ Error saving suggested queries:', queriesError);
      } else {
        console.log('✅ Suggested queries saved successfully:', suggestedQueries.length);
      }
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