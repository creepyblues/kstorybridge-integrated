import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Import shared types from unified engine
import {
  COMPS_ENGINE_VERSION,
  DIMENSION_KEYS,
  type DimensionScore,
  type TitleMatchV2,
  type CompNavigatorResponse,
} from '../_shared/comps-types.ts';

import {
  calculateWeightedScore,
  logCompsEngine,
  estimateNavigatorCost,
} from '../_shared/comps-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Request timeout in milliseconds (30 seconds for API calls)
const REQUEST_TIMEOUT_MS = 30000

// =====================================================================
// RELEVANCY FILTERING THRESHOLDS
// =====================================================================
const MIN_OVERALL_SCORE = 55                    // Minimum overall score to show
const MIN_OVERALL_FOR_DIMENSION_EXCEPTION = 40  // Minimum overall when exceptional dimension exists
const EXCEPTIONAL_DIMENSION_SCORE = 80          // Score that qualifies as "exceptional" in one dimension

// Suggestions shown when no relevant results found
const NO_RESULTS_SUGGESTIONS = [
  "Try broader genre titles like 'Squid Game' or 'Parasite'",
  "Search for specific genres: thriller, romance, action",
  "Use fewer comp titles for wider matches"
]

/**
 * Hybrid relevancy filter: Shows titles that meet EITHER condition:
 * 1. Overall match score >= MIN_OVERALL_SCORE (55)
 * 2. Any dimension score >= EXCEPTIONAL_DIMENSION_SCORE (80) AND overall >= MIN_OVERALL_FOR_DIMENSION_EXCEPTION (40)
 */
function filterRelevantResults(results: TitleMatchV2[]): TitleMatchV2[] {
  return results.filter(result => {
    // Condition 1: Overall score meets minimum threshold
    if (result.overall_match_score >= MIN_OVERALL_SCORE) {
      return true
    }

    // Condition 2: Exceptional in one dimension + minimum overall score
    if (result.overall_match_score >= MIN_OVERALL_FOR_DIMENSION_EXCEPTION) {
      const hasExceptionalDimension = result.dimension_scores?.some(
        d => d.score >= EXCEPTIONAL_DIMENSION_SCORE
      )
      if (hasExceptionalDimension) {
        return true
      }
    }

    return false
  })
}

/**
 * Fetch with timeout wrapper to prevent hanging requests
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

interface CompNavigatorRequest {
  comp_titles: string[]; // 1-3 comp titles
  refinement_text?: string; // Optional text refinement
  user_email: string;
  save_search?: boolean; // Whether to save to history
  search_name?: string; // For bookmarking
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request
    const requestData: CompNavigatorRequest = await req.json()

    console.log('[COMPS] Search started', {
      comp_titles: requestData.comp_titles,
      has_refinement: !!requestData.refinement_text,
      user_email: requestData.user_email
    })

    // Validate input
    if (!requestData.comp_titles || requestData.comp_titles.length === 0 || requestData.comp_titles.length > 3) {
      throw new Error('Must provide 1-3 comparable titles')
    }

    // Email is only strictly required when saving search
    // For trial mode, we accept placeholder emails
    if (requestData.save_search !== false && (!requestData.user_email || typeof requestData.user_email !== 'string')) {
      throw new Error('Valid user email is required when saving search')
    }

    if (requestData.refinement_text && typeof requestData.refinement_text === 'string' && requestData.refinement_text.length > 500) {
      throw new Error('Refinement text must be 500 characters or less')
    }

    if (requestData.search_name && typeof requestData.search_name === 'string' && requestData.search_name.length > 100) {
      throw new Error('Search name must be 100 characters or less')
    }

    // PHASE 1: Semantic Retrieval (Vector Search)
    console.log('[COMPS] Phase 1: Generating embeddings and performing vector search')
    const phase1Start = Date.now()

    // Generate embeddings for comp titles
    const embeddingStart = Date.now()
    const compEmbeddings = await Promise.all(
      requestData.comp_titles.map(title => getOrGenerateEmbedding(supabaseClient, title))
    )
    const embeddingDuration = Date.now() - embeddingStart

    console.log('[COMPS] Generated embeddings:', compEmbeddings.map(e => `${e.length} dims`))
    console.log('[COMPS] ⏱️  Embedding generation took:', embeddingDuration, 'ms')

    // Average the embeddings
    const avgEmbedding = averageEmbeddings(compEmbeddings)
    console.log('[COMPS] Averaged embedding:', avgEmbedding.length, 'dims, sample:', avgEmbedding.slice(0, 3))

    // Blend with refinement text if provided
    let finalEmbedding = avgEmbedding
    if (requestData.refinement_text && typeof requestData.refinement_text === 'string' && requestData.refinement_text.trim()) {
      const refinementEmbedding = await generateEmbedding(requestData.refinement_text)
      finalEmbedding = combineEmbeddings(avgEmbedding, refinementEmbedding, 0.7, 0.3)
    }

    // Perform vector search using optimized RPC function
    console.log('[COMPS] Calling vector search with embedding dim:', finalEmbedding.length)
    const vectorSearchStart = Date.now()

    const { data: candidates, error: vectorError } = await supabaseClient.rpc('match_titles_by_embedding_optimized', {
      query_embedding: finalEmbedding,
      match_threshold: 0.6,
      match_count: 15  // Reduced from 30 for faster processing
    })

    const vectorSearchDuration = Date.now() - vectorSearchStart

    if (vectorError) {
      console.error('[COMPS] Vector search error:', JSON.stringify(vectorError))
      console.error('[COMPS] Error details:', {
        message: vectorError.message,
        details: vectorError.details,
        hint: vectorError.hint,
        code: vectorError.code
      })
      throw new Error(`Vector search failed: ${vectorError.message}`)
    }

    console.log('[COMPS] Vector search succeeded, candidates type:', typeof candidates, 'is array:', Array.isArray(candidates))
    console.log('[COMPS] ⏱️  Vector search took:', vectorSearchDuration, 'ms')

    const phase1Duration = Date.now() - phase1Start
    console.log('[COMPS] ✅ Phase 1 complete', {
      candidates_found: candidates?.length || 0,
      total_duration_ms: phase1Duration,
      embedding_ms: embeddingDuration,
      vector_search_ms: vectorSearchDuration,
      sample_candidate: candidates?.[0]?.title_name_en
    })

    if (!candidates || candidates.length === 0) {
      console.log('[COMPS] WARNING: Phase 1 returned 0 candidates!')
      return new Response(
        JSON.stringify({
          results: [],
          processing_time_ms: Date.now() - startTime,
          cost_estimate: 0.001
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PHASE 1.5: Smart Prioritization
    // Apply business-value scoring before LLM re-ranking
    console.log('[COMPS] Phase 1.5: Applying smart prioritization')
    const prioritizationStart = Date.now()

    // Fetch pitch deck availability for all candidates
    const titleIds = candidates.map((c: any) => c.title_id)
    const titlesWithPitchDeck = await fetchPitchDeckAvailability(supabaseClient, titleIds)

    // Apply weighted scoring and re-sort
    const prioritizedCandidates = applySmartPrioritization(candidates, titlesWithPitchDeck)

    const prioritizationDuration = Date.now() - prioritizationStart
    console.log('[COMPS] ⏱️  Smart prioritization took:', prioritizationDuration, 'ms')

    // PHASE 2: LLM Re-Ranking
    console.log('[COMPS] Phase 2: LLM re-ranking top candidates')
    const phase2Start = Date.now()

    // Take top 5 from prioritized candidates (business-value weighted)
    const topCandidates = prioritizedCandidates.slice(0, 5)
    const rerankedResults = await llmRerank(
      requestData.comp_titles,
      requestData.refinement_text,
      topCandidates
    )

    const phase2Duration = Date.now() - phase2Start

    console.log('[COMPS] ✅ Phase 2 complete', {
      results_count: rerankedResults.length,
      duration_ms: phase2Duration,
      sample_result: rerankedResults[0]?.title_name_en,
      all_title_ids: rerankedResults.map(r => r.title_id).slice(0, 5)
    })

    // PHASE 3: Relevancy Filtering
    console.log('[COMPS] Phase 3: Applying relevancy filtering')
    const preFilterCount = rerankedResults.length
    const filteredResults = filterRelevantResults(rerankedResults)
    const filteredCount = preFilterCount - filteredResults.length

    console.log('[COMPS] ✅ Relevancy filtering complete', {
      pre_filter_count: preFilterCount,
      post_filter_count: filteredResults.length,
      filtered_out: filteredCount,
      threshold_overall: MIN_OVERALL_SCORE,
      threshold_dimension: EXCEPTIONAL_DIMENSION_SCORE,
    })

    const totalDuration = Date.now() - startTime

    console.log('[COMPS] 📊 Performance Summary:', {
      total_duration_ms: totalDuration,
      phase1_ms: phase1Duration,
      prioritization_ms: prioritizationDuration,
      phase2_ms: phase2Duration,
      embedding_generation_ms: embeddingDuration,
      vector_search_ms: vectorSearchDuration,
      llm_reranking_ms: phase2Duration
    })

    // Calculate cost estimate using unified engine utility
    const totalCost = estimateNavigatorCost(
      requestData.comp_titles.length,
      !!requestData.refinement_text
    )

    // Prepare no results message and suggestions if needed
    let noResultsMessage: string | undefined
    let suggestions: string[] | undefined

    if (filteredResults.length === 0) {
      const compTitlesFormatted = requestData.comp_titles.join(', ')
      noResultsMessage = `Unfortunately, we don't have any titles comparable to ${compTitlesFormatted}`
      suggestions = NO_RESULTS_SUGGESTIONS
      console.log('[COMPS] No relevant results - showing suggestions')
    }

    // Save search if requested (save filtered results for accurate history)
    let searchId: string | undefined

    if (requestData.save_search) {
      const avgMatchScore = filteredResults.length > 0
        ? filteredResults.reduce((sum, r) => sum + (r.match_score || r.overall_match_score), 0) / filteredResults.length
        : 0

      const { data: searchData, error: saveError } = await supabaseClient
        .from('comp_searches')
        .insert({
          user_email: requestData.user_email,
          comp_titles: requestData.comp_titles,
          refinement_text: requestData.refinement_text,
          search_name: requestData.search_name,
          search_results: filteredResults,
          is_bookmarked: !!requestData.search_name,
          result_count: filteredResults.length,
          avg_match_score: avgMatchScore
        })
        .select('id')
        .single()

      if (saveError) {
        console.error('[COMPS] Failed to save search:', saveError)
      } else {
        searchId = searchData?.id
      }
    }

    logCompsEngine('Search complete', {
      total_duration_ms: totalDuration,
      cost_estimate: totalCost,
      results_count: filteredResults.length,
      filtered_count: filteredCount,
      engine_version: COMPS_ENGINE_VERSION,
    })

    const response: CompNavigatorResponse = {
      results: filteredResults.slice(0, 5), // Return top 5 for faster response
      search_id: searchId,
      processing_time_ms: totalDuration,
      cost_estimate: totalCost,
      engine_version: COMPS_ENGINE_VERSION,
      mode_used: 'fast',
      // v2.1.0 - Relevancy filtering fields
      filtered_count: filteredCount,
      no_results_message: noResultsMessage,
      suggestions: suggestions,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[COMPS] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper Functions

async function getOrGenerateEmbedding(supabaseClient: any, compTitle: string): Promise<number[]> {
  const normalizedTitle = compTitle.toLowerCase().trim()

  // Check cache first
  const { data: cached, error: cacheError } = await supabaseClient
    .from('comp_title_cache')
    .select('embedding')
    .eq('comp_title', normalizedTitle)
    .maybeSingle() // Use maybeSingle instead of single to avoid error on no match

  // Validate cached embedding
  if (cached && cached.embedding) {
    const embedding = cached.embedding

    // Validate embedding is an array of numbers without nulls
    if (Array.isArray(embedding) &&
        embedding.length === 1536 &&
        embedding.every(v => typeof v === 'number' && !isNaN(v))) {
      console.log(`[COMPS] Cache hit for "${compTitle}"`)
      return embedding
    } else {
      console.warn(`[COMPS] Invalid cached embedding for "${compTitle}" - regenerating`)
      // Delete invalid cache entry
      await supabaseClient
        .from('comp_title_cache')
        .delete()
        .eq('comp_title', normalizedTitle)
    }
  }

  if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.warn(`[COMPS] Cache lookup error for "${compTitle}":`, cacheError)
  }

  // Generate new embedding
  console.log(`[COMPS] Cache miss for "${compTitle}", generating embedding`)
  const embedding = await generateEmbedding(compTitle)

  // Cache for future use (use upsert to handle duplicates)
  try {
    const { error: cacheError } = await supabaseClient
      .from('comp_title_cache')
      .upsert({
        comp_title: normalizedTitle,
        embedding,
        source: 'user_input',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'comp_title'
      })

    if (cacheError) {
      console.warn(`[COMPS] Failed to cache embedding for "${compTitle}":`, cacheError)
    } else {
      console.log(`[COMPS] Successfully cached embedding for "${compTitle}"`)
    }
  } catch (insertError) {
    console.warn(`[COMPS] Exception caching embedding for "${compTitle}":`, insertError)
  }

  return embedding
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetchWithTimeout('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    })
  }, 15000) // 15 second timeout for embeddings

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error('No embeddings to average')
  }

  const dim = embeddings[0].length
  const avg = new Array(dim).fill(0)

  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += embedding[i]
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length
  }

  return avg
}

function combineEmbeddings(
  embed1: number[],
  embed2: number[],
  weight1: number,
  weight2: number
): number[] {
  return embed1.map((val, i) => val * weight1 + embed2[i] * weight2)
}

// =====================================================================
// SMART PRIORITIZATION FUNCTIONS
// Weights: similarity (35%) + pitch deck (25%) + priority (20%) + verified (10%) + engagement (10%)
// =====================================================================

interface CandidateWithPriority {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  synopsis: string;
  description: string;
  genre: string[];
  tone: string;
  content_format: string;
  title_image: string;
  similarity: number;
  priority: string | null;
  verified: boolean;
  views: number;
  likes: number;
  hasPitchDeck?: boolean;
  priorityScore?: number;
}

async function fetchPitchDeckAvailability(
  supabaseClient: any,
  titleIds: string[]
): Promise<Set<string>> {
  if (titleIds.length === 0) return new Set()

  const { data, error } = await supabaseClient
    .from('title_documents')
    .select('title_id')
    .in('title_id', titleIds)
    .eq('document_type', 'source_pdf')

  if (error) {
    console.warn('[COMPS] Failed to fetch pitch deck availability:', error)
    return new Set()
  }

  const titlesWithPitchDeck = new Set<string>(data?.map((d: any) => d.title_id) || [])
  console.log(`[COMPS] Pitch deck availability: ${titlesWithPitchDeck.size}/${titleIds.length} titles have pitch decks`)
  return titlesWithPitchDeck
}

function calculatePriorityScore(
  candidate: CandidateWithPriority,
  maxEngagement: number
): number {
  // Weights: similarity (35%) + pitch deck (25%) + priority (20%) + verified (10%) + engagement (10%)
  const similarityScore = (candidate.similarity || 0) * 0.35

  const pitchDeckScore = candidate.hasPitchDeck ? 0.25 : 0

  // Priority: '1' = 1.0, '2' = 0.5, '3' or null = 0
  const priorityValue = candidate.priority === '1' ? 1.0 : candidate.priority === '2' ? 0.5 : 0
  const priorityScore = priorityValue * 0.20

  const verifiedScore = candidate.verified ? 0.10 : 0

  // Normalize engagement to 0-1 range
  const engagement = ((candidate.views || 0) + (candidate.likes || 0)) / Math.max(maxEngagement, 1)
  const engagementScore = Math.min(engagement, 1) * 0.10

  return similarityScore + pitchDeckScore + priorityScore + verifiedScore + engagementScore
}

function applySmartPrioritization(
  candidates: CandidateWithPriority[],
  titlesWithPitchDeck: Set<string>
): CandidateWithPriority[] {
  // Calculate max engagement for normalization
  const maxEngagement = Math.max(
    ...candidates.map(c => (c.views || 0) + (c.likes || 0)),
    1
  )

  // Add pitch deck info and calculate priority scores
  const candidatesWithScores = candidates.map(c => ({
    ...c,
    hasPitchDeck: titlesWithPitchDeck.has(c.title_id),
    priorityScore: 0 // Will be set below
  }))

  // Calculate priority scores
  for (const candidate of candidatesWithScores) {
    candidate.priorityScore = calculatePriorityScore(candidate, maxEngagement)
  }

  // Sort by priority score (descending)
  candidatesWithScores.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))

  console.log('[COMPS] Smart prioritization applied:', candidatesWithScores.slice(0, 5).map(c => ({
    title: c.title_name_en?.substring(0, 30),
    similarity: c.similarity?.toFixed(3),
    hasPitchDeck: c.hasPitchDeck,
    priority: c.priority,
    verified: c.verified,
    engagement: (c.views || 0) + (c.likes || 0),
    finalScore: c.priorityScore?.toFixed(3)
  })))

  return candidatesWithScores
}

/**
 * Escape special characters in titles for safe interpolation in JSON prompts.
 * Prevents malformed JSON when titles contain quotes, backslashes, or other special chars.
 */
function escapeForJsonPrompt(title: string): string {
  return title
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t')    // Escape tabs
}

async function llmRerank(
  compTitles: string[],
  refinementText: string | undefined,
  candidates: any[]
): Promise<TitleMatchV2[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Format candidates for the prompt
  const formattedCandidates = candidates.map((c, idx) => `
${idx + 1}. ${c.title_name_en || c.title_name_kr} (ID: ${c.title_id})
   Synopsis: ${c.synopsis || 'No synopsis available'}
   Genre: ${c.genre?.join(', ') || 'Unknown'}
   Tone: ${c.tone || 'Unknown'}
   Format: ${c.content_format || 'Unknown'}
  `).join('\n')

  // Escape comp titles for safe JSON interpolation in prompt examples
  const escapedCompTitles = compTitles.map(escapeForJsonPrompt)
  console.log('[COMPS] Original comp titles:', compTitles)
  console.log('[COMPS] Escaped comp titles for prompt:', escapedCompTitles)

  // V2.0.0: 8-dimensional scoring prompt with aligned_comps
  const systemPrompt = `You are a Hollywood development executive expert in finding comparable titles (comps) for Korean content.
You know film and TV history deeply and can identify meaningful similarities across cultures.
Always return valid JSON matching the requested structure exactly.
Score each dimension honestly - low scores are fine if dimensions don't match.`

  const prompt = `Analyze how well each Korean title matches the Hollywood comp combination.

COMP COMBINATION: ${compTitles.join(', ')}
${refinementText ? `FOCUS: ${refinementText}` : ''}

CANDIDATES:
${formattedCandidates}

For EACH candidate, score these 8 dimensions (0-100) with a 1-sentence reason:
1. genre_blueprint - Save the Cat genre match (Monster in House, Golden Fleece, etc.)
2. tone_mood - Emotional register and atmosphere
3. character_archetypes - Hero types, antagonist patterns, relationships
4. plot_structure - Narrative arc and pacing
5. setting_world - Time, place, worldbuilding
6. themes - Core messages and social commentary
7. target_audience - Demographics and appeal factors
8. format_style - Narrative structure and format

IMPORTANT: For each dimension, specify which comp(s) it aligns with in "aligned_comps" array.

Return JSON:
{
  "results": [
    {
      "rank": 1,
      "title_id": "uuid",
      "dimension_scores": [
        {"dimension": "genre_blueprint", "score": 85, "reason": "Both feature survival competition with elimination", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "tone_mood", "score": 72, "reason": "Similar dark, tense atmosphere", "aligned_comps": ["${escapedCompTitles[0]}"${escapedCompTitles.length > 1 ? `, "${escapedCompTitles[1]}"` : ''}]},
        {"dimension": "character_archetypes", "score": 80, "reason": "Desperate underdogs facing impossible odds", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "plot_structure", "score": 75, "reason": "Tournament arc with escalating stakes", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "setting_world", "score": 65, "reason": "Contemporary setting with isolated location", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "themes", "score": 82, "reason": "Class struggle and human desperation", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "target_audience", "score": 78, "reason": "Adult thriller audience", "aligned_comps": ["${escapedCompTitles[0]}"]},
        {"dimension": "format_style", "score": 70, "reason": "Episodic with ensemble cast", "aligned_comps": ["${escapedCompTitles[0]}"]}
      ],
      "explanation": "This title captures the survival game tension with similar class commentary themes.",
      "match_reasons": ["Survival competition mechanics", "Class inequality themes", "Ensemble of desperate characters", "High-stakes elimination format"]
    }
  ]
}`

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // Fast mode for Navigator
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  }, 90000) // 90 second timeout for LLM re-ranking (increased from 45s due to OpenAI latency)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  // DEBUG: Log raw LLM response details
  console.log('[COMPS] LLM response received, content length:', content?.length)
  console.log('[COMPS] LLM response preview (first 500 chars):', content?.substring(0, 500))

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[COMPS] JSON parse error:', e.message)
    console.error('[COMPS] Failed content type:', typeof content)
    console.error('[COMPS] Failed content (first 1000 chars):', content?.substring(0, 1000))
    throw new Error(`Failed to parse LLM response: ${e.message}`)
  }

  logCompsEngine('LLM response received', {
    response_keys: Object.keys(parsed),
    results_count: parsed.results?.length || 0,
  })

  // DEBUG: Log parsed structure for debugging
  console.log('[COMPS] Parsed response type:', typeof parsed)
  console.log('[COMPS] Parsed response keys:', parsed ? Object.keys(parsed) : 'null')
  console.log('[COMPS] Has results array:', Array.isArray(parsed?.results))
  console.log('[COMPS] Results length:', parsed?.results?.length)

  // Extract rankings from the response object
  let rankings = []
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.results)) {
      rankings = parsed.results
    } else if (Array.isArray(parsed)) {
      rankings = parsed
    } else {
      console.error('[COMPS] Invalid LLM response structure:', parsed)
      throw new Error('LLM response missing "results" array')
    }
  } else {
    console.error('[COMPS] Invalid LLM response type:', typeof parsed)
    throw new Error('LLM response is not an object')
  }

  // Validate rankings array
  if (!rankings || rankings.length === 0) {
    console.error('[COMPS] No rankings returned from LLM')
    throw new Error('LLM returned empty results')
  }

  // Merge LLM rankings with original candidate data
  // Add deduplication to prevent duplicate title_ids in results
  const seenIds = new Set<string>()
  const results: TitleMatchV2[] = rankings.map(ranking => {
    // Filter out duplicate title_ids (LLM sometimes returns same title twice)
    if (seenIds.has(ranking.title_id)) {
      console.warn(`[COMPS] Duplicate title_id filtered: ${ranking.title_id}`)
      return null
    }
    seenIds.add(ranking.title_id)

    const candidate = candidates.find(c => c.title_id === ranking.title_id)
    if (!candidate) {
      console.warn(`[COMPS] LLM returned unknown title_id: ${ranking.title_id}`)
      return null
    }

    // Calculate weighted overall score from dimensions
    const dimensionScores: DimensionScore[] = ranking.dimension_scores || []
    const overallScore = calculateWeightedScore(dimensionScores)

    return {
      title_id: candidate.title_id,
      title_name_en: candidate.title_name_en,
      title_name_kr: candidate.title_name_kr,
      // V2.0.0 fields
      overall_match_score: overallScore,
      dimension_scores: dimensionScores,
      explanation: ranking.explanation || '',
      match_reasons: ranking.match_reasons || [],
      // Metadata
      title_image: candidate.title_image,
      synopsis: candidate.synopsis,
      genre: candidate.genre || [],
      tone: candidate.tone,
      content_format: candidate.content_format,
      has_pitch_deck: candidate.hasPitchDeck || false,
      // Backward compatibility
      match_score: overallScore,
    }
  }).filter(Boolean) as TitleMatchV2[]

  logCompsEngine('Results processed', {
    input_count: rankings.length,
    output_count: results.length,
    duplicates_filtered: rankings.length - results.length,
  })

  // Sort by overall_match_score descending (highest score first)
  results.sort((a, b) => (b.overall_match_score || 0) - (a.overall_match_score || 0))

  logCompsEngine('Results sorted by score', {
    top_scores: results.slice(0, 3).map(r => ({
      title: r.title_name_en?.substring(0, 25),
      score: r.overall_match_score
    }))
  })

  return results
}
