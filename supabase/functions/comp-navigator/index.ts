import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Import caching utilities
import {
  checkSemanticCache,
  storeInSemanticCache,
  checkRerankingCache,
  storeRerankingResult,
  logCacheMetrics,
  generateRerankingCacheKey
} from '../_shared/search-cache.ts';

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

// Cache configuration
const ENABLE_CACHE = true;  // Feature flag for caching
const CACHE_SIMILARITY_THRESHOLD = 0.92;  // High threshold for quality
const ENABLE_RERANKING_CACHE = true;  // Cache LLM re-ranking results

// =====================================================================
// RELEVANCY FILTERING THRESHOLDS (v2.3.0 - lowered for better coverage)
// =====================================================================
const MIN_OVERALL_SCORE = 45                    // Minimum overall score to show (was 55)
const MIN_OVERALL_FOR_DIMENSION_EXCEPTION = 35  // Minimum overall when exceptional dimension exists (was 40)
const EXCEPTIONAL_DIMENSION_SCORE = 70          // Score that qualifies as "exceptional" in one dimension (was 80)

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

/**
 * Fetch with retry logic for transient OpenAI API errors
 * Retries up to maxRetries times with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs)

      // Retry on 5xx server errors and specific connection errors
      if (response.status >= 500 && attempt < maxRetries) {
        const errorText = await response.text()
        console.warn(`[COMPS] OpenAI API error (attempt ${attempt}/${maxRetries}): ${response.status} - ${errorText}`)
        lastError = new Error(`OpenAI API error: ${errorText}`)
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        continue
      }

      return response
    } catch (error) {
      lastError = error
      const isRetryableError =
        error.message?.includes('upstream connect error') ||
        error.message?.includes('connection termination') ||
        error.message?.includes('reset before headers') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('socket hang up')

      if (isRetryableError && attempt < maxRetries) {
        console.warn(`[COMPS] Retryable error (attempt ${attempt}/${maxRetries}): ${error.message}`)
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

interface CompNavigatorRequest {
  action?: 'search' | 'describe'; // Action type (default: search)
  comp_titles: string[]; // 1-3 comp titles
  refinement_text?: string; // Optional text refinement
  user_email: string;
  save_search?: boolean; // Whether to save to history
  search_name?: string; // For bookmarking
  provided_descriptions?: Record<string, string>; // Pre-generated descriptions to skip LLM call
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

    // Handle "describe" action - only generate descriptions, no search
    if (requestData.action === 'describe') {
      console.log('[COMPS] Describe action: generating descriptions only')
      const descriptions: Record<string, string> = {};
      for (const title of requestData.comp_titles) {
        descriptions[title] = await generateCompDescription(title);
      }
      return new Response(JSON.stringify({
        descriptions,
        processing_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PHASE 1: Semantic Retrieval (Vector Search)
    console.log('[COMPS] Phase 1: Generating embeddings and performing vector search')
    const phase1Start = Date.now()

    // Generate embeddings for comp titles (use provided descriptions if available)
    const embeddingStart = Date.now()
    const compEmbeddings = await Promise.all(
      requestData.comp_titles.map(title =>
        getOrGenerateEmbedding(supabaseClient, title, requestData.provided_descriptions?.[title])
      )
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

    // PERFORMANCE: Check semantic cache for similar queries
    // Cache hit returns in ~50ms vs ~2-3s for full search
    if (ENABLE_CACHE) {
      const cacheStart = Date.now()
      const cachedResult = await checkSemanticCache(
        supabaseClient,
        finalEmbedding,
        'comps',
        CACHE_SIMILARITY_THRESHOLD
      )

      if (cachedResult) {
        const cacheTime = Date.now() - cacheStart
        logCacheMetrics('comps', true, cacheTime, cachedResult.similarity)

        console.log(`[COMPS] 🚀 CACHE HIT! Returning cached results (${cacheTime}ms vs ~2-3s)`)

        // Return cached response
        const processingTime = Date.now() - startTime
        return new Response(JSON.stringify({
          results: cachedResult.response_data,
          search_id: '',
          processing_time_ms: processingTime,
          cost_estimate: 0.0001,  // Minimal cost for cache hit
          engine_version: COMPS_ENGINE_VERSION,
          mode_used: 'cached',
          cache_hit: true,
          cache_similarity: cachedResult.similarity
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      logCacheMetrics('comps', false, Date.now() - cacheStart)
    }

    // Perform vector search using optimized RPC function
    console.log('[COMPS] Calling vector search with embedding dim:', finalEmbedding.length)
    const vectorSearchStart = Date.now()

    const { data: candidates, error: vectorError } = await supabaseClient.rpc('match_titles_by_embedding_optimized', {
      query_embedding: finalEmbedding,
      match_threshold: 0.6,
      match_count: 20  // Increased from 15 for better diversity (v2.3.0)
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
    const candidateIds = topCandidates.map((c: any) => c.title_id)

    // PERFORMANCE: Check LLM reranking cache for exact match
    // Cache hit saves 3-8 seconds and ~$0.01 per search
    let rerankedResults: TitleMatchV2[]
    let rerankingCacheHit = false

    if (ENABLE_RERANKING_CACHE) {
      const rerankCacheStart = Date.now()
      const cachedReranking = await checkRerankingCache(
        supabaseClient,
        requestData.comp_titles,
        requestData.refinement_text,
        candidateIds
      )

      if (cachedReranking) {
        const rerankCacheTime = Date.now() - rerankCacheStart
        console.log(`[COMPS] 🚀 RERANKING CACHE HIT! (${rerankCacheTime}ms vs ~3-8s LLM call)`)
        rerankingCacheHit = true

        // Merge cached reranking results with candidate metadata
        rerankedResults = cachedReranking.reranking_results.map((ranking: any) => {
          const candidate = topCandidates.find((c: any) => c.title_id === ranking.title_id)
          if (!candidate) return null
          return {
            ...ranking,
            title_image: candidate.title_image,
            synopsis: candidate.synopsis,
            genre: candidate.genre || [],
            tone: candidate.tone,
            content_format: candidate.content_format,
            has_pitch_deck: candidate.hasPitchDeck || false,
          }
        }).filter(Boolean)
      } else {
        // Cache miss - call LLM
        rerankedResults = await llmRerank(
          requestData.comp_titles,
          requestData.refinement_text,
          topCandidates
        )

        // Store reranking results in cache (fire-and-forget)
        storeRerankingResult(
          supabaseClient,
          requestData.comp_titles,
          requestData.refinement_text,
          candidateIds,
          rerankedResults.map(r => ({
            title_id: r.title_id,
            title_name_en: r.title_name_en,
            title_name_kr: r.title_name_kr,
            overall_match_score: r.overall_match_score,
            dimension_scores: r.dimension_scores,
            explanation: r.explanation,
            match_reasons: r.match_reasons,
            match_score: r.match_score,
          })),
          { modelUsed: 'gpt-4o-mini' }
        ).catch(err => console.warn('[COMPS] Failed to cache reranking:', err))
      }
    } else {
      // Caching disabled - always call LLM
      rerankedResults = await llmRerank(
        requestData.comp_titles,
        requestData.refinement_text,
        topCandidates
      )
    }

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
    // PERFORMANCE OPTIMIZATION: Fire-and-forget async save to reduce response latency by 100-200ms
    let searchId: string | undefined

    if (requestData.save_search) {
      const avgMatchScore = filteredResults.length > 0
        ? filteredResults.reduce((sum, r) => sum + (r.match_score || r.overall_match_score), 0) / filteredResults.length
        : 0

      // Generate predictable UUID so we can return it immediately
      searchId = crypto.randomUUID()

      // Fire-and-forget: Don't await the database save
      supabaseClient
        .from('comp_searches')
        .insert({
          id: searchId,
          user_email: requestData.user_email,
          comp_titles: requestData.comp_titles,
          refinement_text: requestData.refinement_text,
          search_name: requestData.search_name,
          search_results: filteredResults,
          is_bookmarked: !!requestData.search_name,
          result_count: filteredResults.length,
          avg_match_score: avgMatchScore
        })
        .then(({ error: saveError }) => {
          if (saveError) {
            console.error('[COMPS] Failed to save search (async):', saveError)
          } else {
            console.log('[COMPS] Search saved successfully (async)')
          }
        })
        .catch((err) => {
          console.error('[COMPS] Exception saving search (async):', err)
        })
    }

    logCompsEngine('Search complete', {
      total_duration_ms: totalDuration,
      cost_estimate: totalCost,
      results_count: filteredResults.length,
      filtered_count: filteredCount,
      engine_version: COMPS_ENGINE_VERSION,
    })

    // PERFORMANCE: Store results in semantic cache for future similar queries
    // Expected hit rate: 20-40% for comps searches
    if (ENABLE_CACHE && filteredResults.length > 0) {
      const avgScore = filteredResults.reduce((sum, r) => sum + (r.overall_match_score || 0), 0) / filteredResults.length
      storeInSemanticCache(
        supabaseClient,
        'comps',
        requestData.comp_titles.join(' | ') + (requestData.refinement_text ? ` | ${requestData.refinement_text}` : ''),
        finalEmbedding,
        filteredResults.slice(0, 5),  // Store top 5 for cache
        {
          compTitles: requestData.comp_titles,
          refinementText: requestData.refinement_text,
          resultCount: filteredResults.length,
          avgMatchScore: avgScore
        }
      ).catch(err => console.warn('[COMPS] Failed to store in semantic cache:', err))
    }

    const response: CompNavigatorResponse = {
      results: filteredResults.slice(0, 5), // Return top 5 for faster response
      search_id: searchId,
      processing_time_ms: totalDuration,
      cost_estimate: totalCost,
      engine_version: COMPS_ENGINE_VERSION,
      mode_used: rerankingCacheHit ? 'cached_rerank' : 'fast',
      // v2.1.0 - Relevancy filtering fields
      filtered_count: filteredCount,
      no_results_message: noResultsMessage,
      suggestions: suggestions,
      // v2.2.0 - Timing breakdown for UI display
      timing: {
        embedding_ms: embeddingDuration,
        vector_search_ms: vectorSearchDuration,
        prioritization_ms: prioritizationDuration,
        llm_reranking_ms: phase2Duration,
        total_ms: totalDuration,
        cache_hit: rerankingCacheHit,
      },
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

async function getOrGenerateEmbedding(supabaseClient: any, compTitle: string, providedDescription?: string): Promise<number[]> {
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

  // Generate new embedding with LLM-enriched context
  console.log(`[COMPS] Cache miss for "${compTitle}", generating enriched embedding`)

  // Use provided description or generate new one from LLM
  const description = providedDescription || await generateCompDescription(compTitle)
  if (providedDescription) {
    console.log(`[COMPS] Using provided description for "${compTitle}"`)
  }

  // Generate embedding from title + description for richer semantic matching
  const embeddingInput = `${compTitle}: ${description}`
  const embedding = await generateEmbedding(embeddingInput)

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

/**
 * Generate a thematic description of a Hollywood comp title using GPT-4o-mini.
 * This enriches the embedding context beyond just the title text.
 */
async function generateCompDescription(compTitle: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  console.log(`[COMPS] Generating description for "${compTitle}"`)

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a film/TV expert. Given a title, provide a brief (2-3 sentence) description focusing on: genre, tone, themes, setting, and target audience. Be specific about story elements. Do not include the title in your response.'
      }, {
        role: 'user',
        content: `Describe: "${compTitle}"`
      }],
      max_tokens: 150,
      temperature: 0.3
    })
  }, 10000)  // 10 second timeout

  if (!response.ok) {
    const error = await response.text()
    console.warn(`[COMPS] Failed to generate description for "${compTitle}": ${error}`)
    // Fallback to just the title if description generation fails
    return compTitle
  }

  const data = await response.json()
  const description = data.choices?.[0]?.message?.content || compTitle
  console.log(`[COMPS] Description for "${compTitle}": ${description}`)
  return description
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

/**
 * Score a SINGLE candidate against comp titles (v2.3.0 - parallel processing)
 * This is called in parallel for each candidate to reduce total latency
 */
async function llmRerankSingle(
  compTitles: string[],
  refinementText: string | undefined,
  candidate: any,
  openaiApiKey: string
): Promise<any | null> {
  const escapedCompTitles = compTitles.map(escapeForJsonPrompt)

  const systemPrompt = `You are a Hollywood development executive scoring Korean content against Hollywood comps.
Return valid JSON. Score honestly - low scores are fine if dimensions don't match.`

  const prompt = `Score this Korean title against the comp combination.

COMPS: ${compTitles.join(', ')}${refinementText ? `\nFOCUS: ${refinementText}` : ''}

TITLE: ${candidate.title_name_en || candidate.title_name_kr}
Synopsis: ${candidate.synopsis || 'No synopsis'}
Genre: ${candidate.genre?.join(', ') || 'Unknown'}
Tone: ${candidate.tone || 'Unknown'}

Score 8 dimensions (0-100) with brief reason and which comp(s) align:
genre_blueprint, tone_mood, character_archetypes, plot_structure, setting_world, themes, target_audience, format_style

Return JSON:
{"dimension_scores":[{"dimension":"genre_blueprint","score":75,"reason":"...","aligned_comps":["${escapedCompTitles[0]}"]},...],
"explanation":"2 sentences why this matches",
"match_reasons":["reason1","reason2","reason3"]}`

  try {
    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,  // Limit tokens for faster response
        response_format: { type: 'json_object' }
      })
    }, 30000, 2) // 30 second timeout, 2 retries per candidate

    if (!response.ok) {
      console.error(`[COMPS] LLM error for ${candidate.title_id}:`, await response.text())
      return null
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)

    return {
      title_id: candidate.title_id,
      dimension_scores: parsed.dimension_scores || [],
      explanation: parsed.explanation || '',
      match_reasons: parsed.match_reasons || []
    }
  } catch (error) {
    console.error(`[COMPS] Failed to score ${candidate.title_id}:`, error.message)
    return null
  }
}

/**
 * LLM Re-ranking with PARALLEL processing (v2.3.0)
 * Scores candidates in parallel for ~5x faster execution
 */
async function llmRerank(
  compTitles: string[],
  refinementText: string | undefined,
  candidates: any[]
): Promise<TitleMatchV2[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  console.log('[COMPS] Starting parallel LLM reranking for', candidates.length, 'candidates')
  const startTime = Date.now()

  // Score ALL candidates in PARALLEL
  const rankingPromises = candidates.map(candidate =>
    llmRerankSingle(compTitles, refinementText, candidate, openaiApiKey)
  )

  const rankings = await Promise.all(rankingPromises)

  const parallelDuration = Date.now() - startTime
  console.log(`[COMPS] Parallel LLM completed in ${parallelDuration}ms`)

  // Filter out failed rankings and merge with candidate data
  const seenIds = new Set<string>()
  const results: TitleMatchV2[] = rankings
    .filter(ranking => ranking !== null)
    .map(ranking => {
      if (seenIds.has(ranking.title_id)) {
        return null
      }
      seenIds.add(ranking.title_id)

      const candidate = candidates.find(c => c.title_id === ranking.title_id)
      if (!candidate) {
        return null
      }

      const dimensionScores: DimensionScore[] = ranking.dimension_scores || []
      const overallScore = calculateWeightedScore(dimensionScores)

      return {
        title_id: candidate.title_id,
        title_name_en: candidate.title_name_en,
        title_name_kr: candidate.title_name_kr,
        overall_match_score: overallScore,
        dimension_scores: dimensionScores,
        explanation: ranking.explanation || '',
        match_reasons: ranking.match_reasons || [],
        title_image: candidate.title_image,
        synopsis: candidate.synopsis,
        genre: candidate.genre || [],
        tone: candidate.tone,
        content_format: candidate.content_format,
        has_pitch_deck: candidate.hasPitchDeck || false,
        match_score: overallScore,
      }
    })
    .filter(Boolean) as TitleMatchV2[]

  logCompsEngine('Parallel LLM results', {
    candidates_count: candidates.length,
    successful_scores: results.length,
    failed_scores: candidates.length - results.length,
    duration_ms: parallelDuration
  })

  // Sort by overall_match_score descending
  results.sort((a, b) => (b.overall_match_score || 0) - (a.overall_match_score || 0))

  return results
}
