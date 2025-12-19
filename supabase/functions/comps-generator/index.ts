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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 60000 // 60 seconds for GPT-4 calls
const OMDB_TIMEOUT_MS = 10000    // 10 seconds for OMDB lookups

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

interface TitleData {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string | null;
  synopsis: string | null;
  synopsis_kr: string | null;
  genre: string[] | null;
  tone: string | null;
  content_format: string | null;
  character_details: Record<string, unknown> | null;
  story_structure: string | null;
  setting_description: string | null;
  world_lore: string | null;
  important_issues: string | null;
  inspiration: string | null;
  audience: string | null;
  perfect_for: string | null;
  comps: string[] | null;
}

interface ContentAnalysis {
  semantic_tags: unknown[] | null;
  plot_elements: string[] | null;
  character_types: string[] | null;
  cultural_elements: string[] | null;
  mood_analysis: Record<string, unknown> | null;
  pitch_analysis: Record<string, unknown> | null;
  processing_confidence: number | null;
}

// StoryDeconstruction is imported from shared types

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

    // Determine mode
    let modeUsed: 'rich' | 'limited'
    if (requestData.mode === 'rich' || requestData.mode === 'limited') {
      modeUsed = requestData.mode
    } else {
      // Auto-detect based on completeness
      modeUsed = completenessScore >= 50 ? 'rich' : 'limited'
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

function calculateDataCompleteness(
  title: TitleData,
  analysis: ContentAnalysis | null,
  hasPitchDeck: boolean
): number {
  let score = 0

  // Core fields (required for basic analysis)
  if (title.synopsis && title.synopsis.length > 50) score += 10
  if (title.genre && title.genre.length > 0) score += 10
  if (title.tone) score += 10

  // Rich data fields
  if (title.character_details && Object.keys(title.character_details).length > 0) score += 15
  if (title.story_structure) score += 10
  if (title.setting_description) score += 5
  if (title.important_issues) score += 5
  if (title.world_lore) score += 5
  if (title.inspiration) score += 5

  // Content analysis fields
  if (analysis) {
    if (analysis.plot_elements && analysis.plot_elements.length > 0) score += 10
    if (analysis.semantic_tags && Array.isArray(analysis.semantic_tags) && analysis.semantic_tags.length > 0) score += 10
    if (analysis.character_types && analysis.character_types.length > 0) score += 5
    if (analysis.pitch_analysis && Object.keys(analysis.pitch_analysis).length > 0) score += 15
  }

  // Pitch deck bonus
  if (hasPitchDeck) score += 10

  return Math.min(score, 100)
}

async function deconstructStory(
  title: TitleData,
  analysis: ContentAnalysis | null,
  mode: 'rich' | 'limited'
): Promise<StoryDeconstruction> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = mode === 'rich'
    ? buildRichDeconstructionPrompt(title, analysis)
    : buildLimitedDeconstructionPrompt(title)

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
          content: `You are a story analyst expert in deconstructing narratives for Hollywood comp matching.
You understand Blake Snyder's "Save the Cat" genre taxonomy and can identify story patterns across cultures.
Always return valid JSON matching the requested structure.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  }, REQUEST_TIMEOUT_MS) // 60 second timeout for GPT-4 story deconstruction

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    return JSON.parse(content) as StoryDeconstruction
  } catch (e) {
    console.error('[COMPS-GEN] Failed to parse deconstruction:', content)
    throw new Error('Failed to parse story deconstruction')
  }
}

function buildRichDeconstructionPrompt(title: TitleData, analysis: ContentAnalysis | null): string {
  return `Analyze this Korean webtoon/webnovel for Hollywood comp matching.

TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
SYNOPSIS: ${title.synopsis || title.synopsis_kr || 'Not available'}
GENRE: ${title.genre?.join(', ') || 'Not specified'}
TONE: ${title.tone || 'Not specified'}
FORMAT: ${title.content_format || 'Not specified'}
TARGET AUDIENCE: ${title.audience || title.perfect_for || 'Not specified'}

STORY DETAILS:
- Characters: ${title.character_details ? JSON.stringify(title.character_details) : 'Not available'}
- Story Structure: ${title.story_structure || 'Not available'}
- Setting: ${title.setting_description || 'Not available'}
- World/Lore: ${title.world_lore || 'Not available'}
- Themes/Issues: ${title.important_issues || 'Not available'}
- Inspiration: ${title.inspiration || 'Not available'}

AI ANALYSIS DATA:
- Semantic Tags: ${analysis?.semantic_tags ? JSON.stringify(analysis.semantic_tags) : 'Not available'}
- Plot Elements: ${analysis?.plot_elements?.join(', ') || 'Not available'}
- Character Types: ${analysis?.character_types?.join(', ') || 'Not available'}
- Mood Analysis: ${analysis?.mood_analysis ? JSON.stringify(analysis.mood_analysis) : 'Not available'}
- Pitch Analysis: ${analysis?.pitch_analysis ? JSON.stringify(analysis.pitch_analysis) : 'Not available'}

Deconstruct this story into these 8 dimensions. Return a JSON object with these exact keys:

{
  "save_the_cat_genre": "Choose ONE: Monster in the House | Golden Fleece | Out of the Bottle | Dude with a Problem | Rites of Passage | Buddy Love | Whydunit | Fool Triumphant | Institutionalized | Superhero",
  "tone_mood": "Describe the emotional register (e.g., 'Dark and suspenseful with moments of dark humor')",
  "character_archetypes": "Identify hero type, antagonist pattern, key relationships (e.g., 'Reluctant hero with tragic backstory, system as antagonist, found family dynamics')",
  "plot_structure": "Identify the core narrative arc (e.g., 'Survival game with elimination rounds, revenge subplot, social commentary')",
  "setting_world": "Describe time/place/worldbuilding (e.g., 'Contemporary Korea, isolated game facility, dystopian undertones')",
  "themes": "Core messages and social commentary (e.g., 'Class inequality, desperation under capitalism, human nature under pressure')",
  "target_audience": "Demographics and appeal factors (e.g., 'Adults 18-45, thriller fans, social drama enthusiasts')",
  "format_style": "Narrative style and pacing (e.g., 'High-stakes action sequences, ensemble cast, episodic challenges')"
}`
}

function buildLimitedDeconstructionPrompt(title: TitleData): string {
  return `Analyze this Korean webtoon/webnovel for Hollywood comp matching. Note: Limited data available.

TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
SYNOPSIS: ${title.synopsis || title.description_kr || 'Not available'}
GENRE: ${title.genre?.join(', ') || 'Not specified'}
TONE: ${title.tone || 'Not specified'}
FORMAT: ${title.content_format || 'Not specified'}

Based on the limited information available, deconstruct this story. Make reasonable inferences from the title, genre, and synopsis.

Return a JSON object with these exact keys:

{
  "save_the_cat_genre": "Choose ONE: Monster in the House | Golden Fleece | Out of the Bottle | Dude with a Problem | Rites of Passage | Buddy Love | Whydunit | Fool Triumphant | Institutionalized | Superhero",
  "tone_mood": "Describe the emotional register based on genre and synopsis",
  "character_archetypes": "Infer likely hero type and relationships from genre conventions",
  "plot_structure": "Infer the core narrative arc from genre and synopsis",
  "setting_world": "Describe likely setting based on available information",
  "themes": "Infer themes from genre and synopsis",
  "target_audience": "Estimate target demographics from genre",
  "format_style": "Infer narrative style from genre conventions"
}`
}

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

function buildAnalysisSummary(deconstruction: StoryDeconstruction, mode: 'rich' | 'limited'): string {
  const modeNote = mode === 'limited'
    ? ' (Note: Analysis based on limited data - some inferences may be approximate)'
    : ''

  return `Story Type: ${deconstruction.save_the_cat_genre}
Tone: ${deconstruction.tone_mood}
Core Appeal: ${deconstruction.target_audience}${modeNote}`
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
        // Map comp_type to OMDB type parameter
        const omdbType = comp.comp_type.toLowerCase().includes('series') ? 'series' : 'movie'

        // Build search URL with title and optional year
        let searchUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(comp.comp_title)}&type=${omdbType}`
        if (comp.comp_year) {
          searchUrl += `&y=${comp.comp_year}`
        }

        const response = await fetchWithTimeout(searchUrl, {}, OMDB_TIMEOUT_MS)
        const data: OMDBSearchResponse = await response.json()

        if (data.Response === 'True' && data.Search && data.Search.length > 0) {
          // Find best match - prefer exact year match if available
          let match = data.Search[0]
          if (comp.comp_year) {
            const exactYearMatch = data.Search.find(
              (s) => parseInt(s.Year) === comp.comp_year
            )
            if (exactYearMatch) {
              match = exactYearMatch
            }
          }

          console.log(`[COMPS-GEN] OMDB match for "${comp.comp_title}": ${match.imdbID}`)

          return {
            ...comp,
            imdb_id: match.imdbID,
            imdb_url: `https://www.imdb.com/title/${match.imdbID}`,
            poster_url: match.Poster && match.Poster !== 'N/A' ? match.Poster : undefined,
          }
        } else {
          console.log(`[COMPS-GEN] No OMDB match for "${comp.comp_title}": ${data.Error || 'No results'}`)
        }
      } catch (error) {
        console.warn(`[COMPS-GEN] OMDB lookup failed for "${comp.comp_title}":`, error)
      }

      // Return unchanged if lookup fails
      return comp
    })
  )

  const enrichedCount = enrichedComps.filter((c) => c.imdb_id).length
  console.log(`[COMPS-GEN] IMDB enrichment complete: ${enrichedCount}/${comps.length} comps enriched`)

  return enrichedComps
}
