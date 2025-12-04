import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompNavigatorRequest {
  comp_titles: string[]; // 1-3 comp titles
  refinement_text?: string; // Optional text refinement
  user_email: string;
  save_search?: boolean; // Whether to save to history
  search_name?: string; // For bookmarking
}

interface TitleMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  match_score: number; // 0-100
  explanation: string;
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
}

interface CompNavigatorResponse {
  results: TitleMatch[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
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
    const totalDuration = Date.now() - startTime

    console.log('[COMPS] ✅ Phase 2 complete', {
      results_count: rerankedResults.length,
      duration_ms: phase2Duration,
      sample_result: rerankedResults[0]?.title_name_en,
      all_title_ids: rerankedResults.map(r => r.title_id).slice(0, 5)
    })

    console.log('[COMPS] 📊 Performance Summary:', {
      total_duration_ms: totalDuration,
      phase1_ms: phase1Duration,
      prioritization_ms: prioritizationDuration,
      phase2_ms: phase2Duration,
      embedding_generation_ms: embeddingDuration,
      vector_search_ms: vectorSearchDuration,
      llm_reranking_ms: phase2Duration
    })

    // Calculate cost estimate
    const embeddingCost = requestData.comp_titles.length * 0.0001 + (requestData.refinement_text ? 0.0001 : 0)
    const llmCost = 0.014 // Approximate GPT-4 Turbo cost
    const totalCost = embeddingCost + llmCost

    // Save search if requested
    let searchId: string | undefined

    if (requestData.save_search) {
      const avgMatchScore = rerankedResults.reduce((sum, r) => sum + r.match_score, 0) / rerankedResults.length

      const { data: searchData, error: saveError } = await supabaseClient
        .from('comp_searches')
        .insert({
          user_email: requestData.user_email,
          comp_titles: requestData.comp_titles,
          refinement_text: requestData.refinement_text,
          search_name: requestData.search_name,
          search_results: rerankedResults,
          is_bookmarked: !!requestData.search_name,
          result_count: rerankedResults.length,
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

    // totalDuration already calculated at line 175
    console.log('[COMPS] Search complete', {
      total_duration_ms: totalDuration,
      cost_estimate: totalCost,
      results_count: rerankedResults.length
    })

    const response: CompNavigatorResponse = {
      results: rerankedResults.slice(0, 5), // Return top 5 for faster response
      search_id: searchId,
      processing_time_ms: totalDuration,
      cost_estimate: totalCost
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

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    })
  })

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

async function llmRerank(
  compTitles: string[],
  refinementText: string | undefined,
  candidates: any[]
): Promise<TitleMatch[]> {
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

  // Simplified prompt for faster processing - removed comp_alignments for speed
  const prompt = `Match Korean titles to: ${compTitles.join(', ')}
${refinementText ? `\nFocus: ${refinementText}` : ''}

Candidates:
${formattedCandidates}

Rank all ${candidates.length} by match score (0-100). Give a brief 1-sentence explanation for each.
Return JSON:
{"results":[{"rank":1,"title_id":"uuid","match_score":85,"explanation":"One sentence why this matches"}]}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // Switched from gpt-4-turbo for 3-5x faster response
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[COMPS] Failed to parse LLM response:', content)
    throw new Error('Failed to parse LLM response')
  }

  console.log('[COMPS] Raw LLM response:', JSON.stringify(parsed).substring(0, 500))
  console.log('[COMPS] LLM response keys:', Object.keys(parsed))

  // Extract rankings from the response object
  // GPT-4 is instructed to return { "results": [...] } format
  let rankings = []
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.results)) {
      rankings = parsed.results
    } else if (Array.isArray(parsed)) {
      // Fallback: handle if GPT-4 returns bare array despite instructions
      rankings = parsed
    } else {
      console.error('[COMPS] Invalid LLM response structure:', parsed)
      throw new Error('LLM response missing "results" array')
    }
  } else {
    console.error('[COMPS] Invalid LLM response type:', typeof parsed)
    throw new Error('LLM response is not an object')
  }

  console.log('[COMPS] LLM Rankings:', {
    parsed_type: typeof parsed,
    is_array: Array.isArray(parsed),
    rankings_length: rankings.length,
    first_ranking: rankings[0]
  })

  // Validate rankings array
  if (!rankings || rankings.length === 0) {
    console.error('[COMPS] No rankings returned from LLM')
    throw new Error('LLM returned empty results')
  }

  // Merge LLM rankings with original candidate data
  // Add deduplication to prevent duplicate title_ids in results
  const seenIds = new Set<string>()
  const results: TitleMatch[] = rankings.map(ranking => {
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

    return {
      title_id: candidate.title_id,
      title_name_en: candidate.title_name_en,
      title_name_kr: candidate.title_name_kr,
      match_score: ranking.match_score,
      explanation: ranking.explanation,
      title_image: candidate.title_image,
      synopsis: candidate.synopsis,
      genre: candidate.genre || [],
      tone: candidate.tone
    }
  }).filter(Boolean) as TitleMatch[]

  console.log(`[COMPS] Deduplicated results: ${rankings.length} → ${results.length} (filtered ${rankings.length - results.length} duplicates)`)

  return results
}
