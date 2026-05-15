import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Import shared types from unified engine
import {
  COMPS_ENGINE_VERSION,
  DIMENSION_WEIGHTS,
  type DimensionScore,
  type SuggestedCompV2,
  type CompsGeneratorResponse,
  type StoryDeconstruction,
} from '../_shared/comps-types.ts';

import {
  logCompsEngine,
  estimateGeneratorCost,
} from '../_shared/comps-utils.ts';

import {
  buildAnalysisSummary,
  calculateDataCompleteness,
  deconstructStory,
  fetchWithTimeout,
  selectMode,
  type ContentAnalysis,
  type TitleData,
} from '../_shared/comps-deconstruction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 60000 // 60 seconds for GPT-4 calls
const OMDB_TIMEOUT_MS = 10000    // 10 seconds for OMDB lookups

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

interface CompsGeneratorRequest {
  title_id: string;
  mode?: 'rich' | 'limited' | 'auto';  // Auto-detect by default
  user_email: string;
}

// Use SuggestedCompV2 from shared types
type SuggestedComp = SuggestedCompV2;

// TitleData, ContentAnalysis, StoryDeconstruction are imported from shared modules

// =====================================================================
// MAIN HANDLER
// =====================================================================

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
    const requestData: CompsGeneratorRequest = await req.json()

    console.log('[COMPS-GEN] Starting comps generation', {
      title_id: requestData.title_id,
      mode: requestData.mode || 'auto',
      user_email: requestData.user_email
    })

    // Validate input
    if (!requestData.title_id) {
      throw new Error('title_id is required')
    }

    if (!requestData.user_email) {
      throw new Error('user_email is required')
    }

    // =====================================================================
    // PHASE 1: DATA COLLECTION
    // =====================================================================
    console.log('[COMPS-GEN] Phase 1: Collecting title data')
    const phase1Start = Date.now()

    // Fetch title data
    const { data: titleData, error: titleError } = await supabaseClient
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        synopsis_kr,
        genre,
        tone,
        content_format,
        character_details,
        story_structure,
        setting_description,
        world_lore,
        important_issues,
        inspiration,
        audience,
        perfect_for,
        comps
      `)
      .eq('title_id', requestData.title_id)
      .single()

    if (titleError || !titleData) {
      console.error('[COMPS-GEN] Title fetch error:', titleError)
      throw new Error(`Title not found: ${requestData.title_id}`)
    }

    // Fetch content analysis
    const { data: contentAnalysis } = await supabaseClient
      .from('title_content_analysis')
      .select(`
        semantic_tags,
        plot_elements,
        character_types,
        cultural_elements,
        mood_analysis,
        pitch_analysis,
        processing_confidence
      `)
      .eq('title_id', requestData.title_id)
      .maybeSingle()

    // Check for pitch deck
    const { data: pitchDocs } = await supabaseClient
      .from('title_documents')
      .select('id')
      .eq('title_id', requestData.title_id)
      .eq('document_type', 'source_pdf')
      .limit(1)

    const hasPitchDeck = pitchDocs && pitchDocs.length > 0

    const phase1Duration = Date.now() - phase1Start
    console.log('[COMPS-GEN] Phase 1 complete', {
      duration_ms: phase1Duration,
      has_content_analysis: !!contentAnalysis,
      has_pitch_deck: hasPitchDeck
    })

    // =====================================================================
    // PHASE 2: DATA COMPLETENESS SCORING
    // =====================================================================
    console.log('[COMPS-GEN] Phase 2: Calculating data completeness')

    const completenessScore = calculateDataCompleteness(
      titleData as TitleData,
      contentAnalysis as ContentAnalysis | null,
      hasPitchDeck
    )

    // Determine mode (auto-detect when not explicitly requested)
    const modeUsed = selectMode(requestData.mode, completenessScore)

    console.log('[COMPS-GEN] Data completeness:', {
      score: completenessScore,
      mode_used: modeUsed,
      auto_detected: !requestData.mode || requestData.mode === 'auto'
    })

    // =====================================================================
    // PHASE 3: STORY DECONSTRUCTION (GPT-4)
    // =====================================================================
    console.log('[COMPS-GEN] Phase 3: Story deconstruction')
    const phase3Start = Date.now()

    const deconstruction = await deconstructStory(
      titleData as TitleData,
      contentAnalysis as ContentAnalysis | null,
      modeUsed
    )

    const phase3Duration = Date.now() - phase3Start
    console.log('[COMPS-GEN] Phase 3 complete', {
      duration_ms: phase3Duration,
      save_the_cat_genre: deconstruction.save_the_cat_genre
    })

    // =====================================================================
    // PHASE 4: COMP GENERATION (GPT-4)
    // =====================================================================
    console.log('[COMPS-GEN] Phase 4: Generating comps')
    const phase4Start = Date.now()

    const suggestedComps = await generateComps(
      titleData as TitleData,
      deconstruction,
      modeUsed
    )

    const phase4Duration = Date.now() - phase4Start
    console.log('[COMPS-GEN] Phase 4 complete', {
      duration_ms: phase4Duration,
      comps_count: suggestedComps.length
    })

    // =====================================================================
    // PHASE 5: IMDB ENRICHMENT (OMDB API)
    // =====================================================================
    console.log('[COMPS-GEN] Phase 5: Enriching with IMDB links')
    const phase5Start = Date.now()

    const enrichedComps = await enrichCompsWithIMDB(suggestedComps)

    const phase5Duration = Date.now() - phase5Start
    console.log('[COMPS-GEN] Phase 5 complete', {
      duration_ms: phase5Duration,
      enriched_count: enrichedComps.filter(c => c.imdb_id).length
    })

    // =====================================================================
    // FINAL RESPONSE
    // =====================================================================
    const totalDuration = Date.now() - startTime

    // Cost estimation using unified engine utility
    const costEstimate = estimateGeneratorCost()

    logCompsEngine('Generation complete', {
      total_duration_ms: totalDuration,
      mode_used: modeUsed,
      comps_generated: suggestedComps.length,
      cost_estimate: costEstimate,
      engine_version: COMPS_ENGINE_VERSION,
    })

    const response: CompsGeneratorResponse = {
      title_id: requestData.title_id,
      title_name: titleData.title_name_en || titleData.title_name_kr || 'Unknown',
      mode_used: modeUsed,
      data_completeness: completenessScore,
      suggested_comps: enrichedComps,
      analysis_summary: buildAnalysisSummary(deconstruction, modeUsed),
      processing_time_ms: totalDuration,
      cost_estimate: costEstimate,
      engine_version: COMPS_ENGINE_VERSION,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[COMPS-GEN] Error:', error)
    // Distinguish client errors (400) from server errors (500)
    const clientErrors = ['title_id is required', 'user_email is required'];
    const isClientError = clientErrors.some(msg => error.message?.includes(msg));
    const status = isClientError ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================
// `calculateDataCompleteness`, `deconstructStory`, `buildRichDeconstructionPrompt`,
// `buildLimitedDeconstructionPrompt`, and `buildAnalysisSummary` live in
// ../_shared/comps-deconstruction.ts so that `score-manual-comp` can share them.

async function generateComps(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  mode: 'rich' | 'limited'
): Promise<SuggestedComp[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = buildCompGenerationPrompt(title, deconstruction, mode)

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Hollywood development executive expert in finding comparable titles (comps) for Korean content.
You know film and TV history deeply and can identify meaningful similarities across cultures.
Focus on recognizable titles from the last 10-15 years when possible.
Avoid mega-blockbusters like MCU films - they're unrealistic comps for most content.
Always return valid JSON matching the requested structure.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  }, REQUEST_TIMEOUT_MS) // 60 second timeout for GPT-4 comp generation

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const parsed = JSON.parse(content)
    // Handle both { comps: [...] } and direct array formats
    const comps = parsed.comps || parsed.suggested_comps || parsed
    if (!Array.isArray(comps)) {
      throw new Error('Invalid comps format')
    }
    return comps.slice(0, 5) as SuggestedComp[]
  } catch (e) {
    console.error('[COMPS-GEN] Failed to parse comps:', content)
    throw new Error('Failed to parse comp suggestions')
  }
}

function buildCompGenerationPrompt(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  mode: 'rich' | 'limited'
): string {
  const confidenceNote = mode === 'limited'
    ? '\n\nNOTE: Limited data was available for analysis. Adjust confidence accordingly and note uncertainty in explanations.'
    : ''

  return `Based on this story analysis, suggest 5-8 Hollywood/global comparable titles for this Korean webtoon/webnovel.

TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
GENRE: ${title.genre?.join(', ') || 'Not specified'}

STORY DECONSTRUCTION:
- Save the Cat Genre: ${deconstruction.save_the_cat_genre}
- Tone & Mood: ${deconstruction.tone_mood}
- Character Archetypes: ${deconstruction.character_archetypes}
- Plot Structure: ${deconstruction.plot_structure}
- Setting & World: ${deconstruction.setting_world}
- Themes: ${deconstruction.themes}
- Target Audience: ${deconstruction.target_audience}
- Format Style: ${deconstruction.format_style}
${confidenceNote}

For each comp, evaluate similarity across these 8 dimensions with scores and reasons.
Weight the dimensions as follows: Genre (20%), Tone (15%), Characters (15%), Plot (15%), Setting (10%), Themes (10%), Audience (10%), Format (5%).

Return a JSON object with a "comps" array containing 5-8 suggested comps:

{
  "comps": [
    {
      "comp_title": "Title Name",
      "comp_year": 2021,
      "comp_type": "TV Series | Film | Anime",
      "overall_match_score": 85,
      "dimension_scores": [
        { "dimension": "genre_blueprint", "score": 90, "reason": "Both are survival games with elimination rounds" },
        { "dimension": "tone_mood", "score": 85, "reason": "Dark, suspenseful atmosphere with social commentary" },
        { "dimension": "character_archetypes", "score": 80, "reason": "Ensemble cast of desperate characters" },
        { "dimension": "plot_structure", "score": 85, "reason": "Competition format with escalating stakes" },
        { "dimension": "setting_world", "score": 75, "reason": "Isolated facility, contemporary setting" },
        { "dimension": "themes", "score": 90, "reason": "Class inequality and human nature under pressure" },
        { "dimension": "target_audience", "score": 85, "reason": "Adult thriller audience" },
        { "dimension": "format_style", "score": 80, "reason": "Episodic challenges, ensemble drama" }
      ],
      "explanation": "2-3 sentence summary explaining the overall match and why this comp is relevant.",
      "match_reasons": [
        "Both feature survival game mechanics with deadly elimination",
        "Strong social commentary on economic inequality",
        "Ensemble cast with diverse character motivations",
        "Dark tone balanced with human drama moments"
      ]
    }
  ]
}

Requirements:
- Use recognizable titles (avoid obscure indie films)
- Include a mix of films and TV series
- Prioritize titles from the last 10 years, but classic matches are okay
- Be specific about WHY each comp matches - generic comparisons are not helpful
- Score honestly - if a dimension doesn't match well, say so
- Rank by overall_match_score (highest first)`
}

// =====================================================================
// OMDB ENRICHMENT (IMDB IDs)
// =====================================================================

interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OMDBSearchResponse {
  Search?: OMDBSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

interface OMDBDetailResponse {
  Response: string;
  Error?: string;
  Poster?: string;
  imdbID?: string;
  Title?: string;
  Year?: string;
}

/**
 * Run an OMDB Search query. Returns parsed body or null on transport/parse error.
 */
async function omdbSearch(
  apiKey: string,
  title: string,
  type: string,
  year?: number
): Promise<OMDBSearchResponse | null> {
  let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(title)}&type=${type}`
  if (year) url += `&y=${year}`
  try {
    const response = await fetchWithTimeout(url, {}, OMDB_TIMEOUT_MS)
    return await response.json() as OMDBSearchResponse
  } catch (error) {
    console.warn(`[COMPS-GEN] OMDB search transport error for "${title}":`, error)
    return null
  }
}

/**
 * Fetch poster URL via OMDB Detail endpoint (?i=). Detail returns Poster reliably
 * even for titles where Search returns Poster: 'N/A'.
 */
async function omdbFetchPoster(apiKey: string, imdbId: string): Promise<string | undefined> {
  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`
    const response = await fetchWithTimeout(url, {}, OMDB_TIMEOUT_MS)
    const data = await response.json() as OMDBDetailResponse
    if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
      return data.Poster
    }
  } catch (error) {
    console.warn(`[COMPS-GEN] OMDB detail lookup failed for ${imdbId}:`, error)
  }
  return undefined
}

/**
 * Pick best match from OMDB Search results, preferring exact year match.
 */
function pickBestMatch(results: OMDBSearchResult[], year?: number): OMDBSearchResult {
  if (year) {
    const exact = results.find((s) => parseInt(s.Year) === year)
    if (exact) return exact
  }
  return results[0]
}

/**
 * Find an OMDB match for a comp using progressive fallbacks:
 *   1. Search title + type + year
 *   2. Retry without year
 *   3. Strip subtitle after ":" and retry without year (handles season/installment names
 *      like "American Horror Story: Murder House" → "American Horror Story")
 */
async function findOMDBMatch(
  apiKey: string,
  comp: SuggestedComp,
  omdbType: string
): Promise<OMDBSearchResult | null> {
  // Attempt 1: full title + year
  const r1 = await omdbSearch(apiKey, comp.comp_title, omdbType, comp.comp_year)
  if (r1?.Response === 'True' && r1.Search && r1.Search.length > 0) {
    return pickBestMatch(r1.Search, comp.comp_year)
  }

  // Attempt 2: full title without year
  const r2 = await omdbSearch(apiKey, comp.comp_title, omdbType)
  if (r2?.Response === 'True' && r2.Search && r2.Search.length > 0) {
    return pickBestMatch(r2.Search, comp.comp_year)
  }

  // Attempt 3: strip subtitle after ":" (e.g. season names) and retry without year
  if (comp.comp_title.includes(':')) {
    const baseTitle = comp.comp_title.split(':')[0].trim()
    if (baseTitle && baseTitle !== comp.comp_title) {
      const r3 = await omdbSearch(apiKey, baseTitle, omdbType)
      if (r3?.Response === 'True' && r3.Search && r3.Search.length > 0) {
        return pickBestMatch(r3.Search, comp.comp_year)
      }
    }
  }

  return null
}

async function enrichCompsWithIMDB(comps: SuggestedComp[]): Promise<SuggestedComp[]> {
  const omdbApiKey = Deno.env.get('OMDB_API_KEY')

  if (!omdbApiKey) {
    console.log('[COMPS-GEN] OMDB API key not configured - skipping IMDB enrichment')
    return comps
  }

  console.log('[COMPS-GEN] Enriching comps with IMDB IDs')

  const enrichedComps = await Promise.all(
    comps.map(async (comp) => {
      try {
        const omdbType = comp.comp_type.toLowerCase().includes('series') ? 'series' : 'movie'

        const match = await findOMDBMatch(omdbApiKey, comp, omdbType)
        if (!match) {
          console.log(`[COMPS-GEN] No OMDB match for "${comp.comp_title}"`)
          return comp
        }

        // Prefer Search poster; fall back to Detail endpoint when Search returns N/A.
        // Detail (?i=) reliably returns posters when the title has one.
        let posterUrl: string | undefined =
          match.Poster && match.Poster !== 'N/A' ? match.Poster : undefined
        if (!posterUrl) {
          posterUrl = await omdbFetchPoster(omdbApiKey, match.imdbID)
        }

        console.log(
          `[COMPS-GEN] OMDB match for "${comp.comp_title}": ${match.imdbID} (poster=${!!posterUrl})`
        )

        return {
          ...comp,
          imdb_id: match.imdbID,
          imdb_url: `https://www.imdb.com/title/${match.imdbID}`,
          poster_url: posterUrl,
        }
      } catch (error) {
        console.warn(`[COMPS-GEN] OMDB lookup failed for "${comp.comp_title}":`, error)
      }

      return comp
    })
  )

  const enrichedCount = enrichedComps.filter((c) => c.imdb_id).length
  const posterCount = enrichedComps.filter((c) => c.poster_url).length
  console.log(
    `[COMPS-GEN] IMDB enrichment complete: ${enrichedCount}/${comps.length} matched, ${posterCount}/${comps.length} with posters`
  )

  return enrichedComps
}
