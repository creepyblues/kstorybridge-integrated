import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import {
  FORMAT_FIT_ENGINE_VERSION,
  FORMAT_TYPES,
  FORMAT_DIMENSION_WEIGHTS,
  MICRODRAMA_POSITIVE_GENRES,
  MICRODRAMA_WINNING_TROPES,
  MICRODRAMA_POSITIVE_SETTINGS,
  getFitLevel,
  calculateWeightedScore,
  estimateFormatFitCost,
  type FormatType,
  type FormatFitDimension,
  type DimensionScore,
  type FormatAnalysis,
  type StoryDeconstruction,
  type FormatFitResponse,
  type MicrodramaSpecificInsights,
} from '../_shared/format-fit-types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

interface FormatFitRequest {
  title_id: string;
  user_email: string;
  mode?: 'rich' | 'limited' | 'auto';
}

interface TitleData {
  title_id: string;
  title_name_en: string | null;
  title_name_kr: string | null;
  synopsis: string | null;
  description_kr: string | null;
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
  chapters: number | null;
  completed: string | null;
  age_rating: string | null;
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
    const requestData: FormatFitRequest = await req.json()

    console.log('[FORMAT-FIT] Starting format fit analysis', {
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
    console.log('[FORMAT-FIT] Phase 1: Collecting title data')
    const phase1Start = Date.now()

    // Fetch title data
    const { data: titleData, error: titleError } = await supabaseClient
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        description_kr,
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
        chapters,
        completed,
        age_rating
      `)
      .eq('title_id', requestData.title_id)
      .single()

    if (titleError || !titleData) {
      console.error('[FORMAT-FIT] Title fetch error:', titleError)
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
    console.log('[FORMAT-FIT] Phase 1 complete', {
      duration_ms: phase1Duration,
      has_content_analysis: !!contentAnalysis,
      has_pitch_deck: hasPitchDeck
    })

    // =====================================================================
    // PHASE 2: DATA COMPLETENESS SCORING
    // =====================================================================
    console.log('[FORMAT-FIT] Phase 2: Calculating data completeness')

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
      modeUsed = completenessScore >= 50 ? 'rich' : 'limited'
    }

    console.log('[FORMAT-FIT] Data completeness:', {
      score: completenessScore,
      mode_used: modeUsed,
      auto_detected: !requestData.mode || requestData.mode === 'auto'
    })

    // =====================================================================
    // PHASE 3: STORY DECONSTRUCTION (GPT-4o)
    // =====================================================================
    console.log('[FORMAT-FIT] Phase 3: Story deconstruction')
    const phase3Start = Date.now()

    const deconstruction = await deconstructStory(
      titleData as TitleData,
      contentAnalysis as ContentAnalysis | null,
      modeUsed
    )

    const phase3Duration = Date.now() - phase3Start
    console.log('[FORMAT-FIT] Phase 3 complete', {
      duration_ms: phase3Duration,
      save_the_cat_genre: deconstruction.save_the_cat_genre
    })

    // =====================================================================
    // PHASE 4: FORMAT FIT SCORING (GPT-4o)
    // =====================================================================
    console.log('[FORMAT-FIT] Phase 4: Format fit scoring')
    const phase4Start = Date.now()

    const formatAnalyses = await analyzeAllFormats(
      titleData as TitleData,
      deconstruction,
      contentAnalysis as ContentAnalysis | null,
      modeUsed
    )

    const phase4Duration = Date.now() - phase4Start
    console.log('[FORMAT-FIT] Phase 4 complete', {
      duration_ms: phase4Duration,
      analyses_generated: Object.keys(formatAnalyses).length
    })

    // =====================================================================
    // PHASE 5: SAVE TO DATABASE
    // =====================================================================
    console.log('[FORMAT-FIT] Phase 5: Saving results')
    const phase5Start = Date.now()

    const scores = {
      film: formatAnalyses.film.overall_score,
      tv_series: formatAnalyses.tv_series.overall_score,
      animation: formatAnalyses.animation.overall_score,
      microdrama: formatAnalyses.microdrama.overall_score,
      audio_drama: formatAnalyses.audio_drama.overall_score,
    }

    // Find best format
    let bestFormat: FormatType = 'film'
    let bestScore = 0
    for (const [format, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score
        bestFormat = format as FormatType
      }
    }

    // Save to database
    const { error: saveError } = await supabaseClient
      .from('title_format_fit')
      .upsert({
        title_id: requestData.title_id,
        film_score: scores.film,
        tv_series_score: scores.tv_series,
        animation_score: scores.animation,
        microdrama_score: scores.microdrama,
        audio_drama_score: scores.audio_drama,
        film_analysis: formatAnalyses.film,
        tv_series_analysis: formatAnalyses.tv_series,
        animation_analysis: formatAnalyses.animation,
        microdrama_analysis: formatAnalyses.microdrama,
        audio_drama_analysis: formatAnalyses.audio_drama,
        story_deconstruction: deconstruction,
        data_completeness: completenessScore,
        mode_used: modeUsed,
        analysis_version: FORMAT_FIT_ENGINE_VERSION,
        processing_time_ms: Date.now() - startTime,
        cost_estimate: estimateFormatFitCost(),
      }, {
        onConflict: 'title_id',
      })

    if (saveError) {
      console.error('[FORMAT-FIT] Save error:', saveError)
      // Don't throw - continue to return results even if save fails
    }

    const phase5Duration = Date.now() - phase5Start
    console.log('[FORMAT-FIT] Phase 5 complete', { duration_ms: phase5Duration })

    // =====================================================================
    // FINAL RESPONSE
    // =====================================================================
    const totalDuration = Date.now() - startTime

    console.log('[FORMAT-FIT] Analysis complete', {
      total_duration_ms: totalDuration,
      mode_used: modeUsed,
      best_format: bestFormat,
      best_score: bestScore,
    })

    const response: FormatFitResponse = {
      title_id: requestData.title_id,
      title_name: titleData.title_name_en || titleData.title_name_kr || 'Unknown',
      mode_used: modeUsed,
      data_completeness: completenessScore,
      scores,
      best_format: bestFormat,
      best_format_score: bestScore,
      film_analysis: formatAnalyses.film,
      tv_series_analysis: formatAnalyses.tv_series,
      animation_analysis: formatAnalyses.animation,
      microdrama_analysis: formatAnalyses.microdrama,
      audio_drama_analysis: formatAnalyses.audio_drama,
      story_deconstruction: deconstruction,
      processing_time_ms: totalDuration,
      cost_estimate: estimateFormatFitCost(),
      engine_version: FORMAT_FIT_ENGINE_VERSION,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[FORMAT-FIT] Error:', error)
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
  if (title.audience) score += 5

  // Content analysis fields
  if (analysis) {
    if (analysis.plot_elements && analysis.plot_elements.length > 0) score += 10
    if (analysis.semantic_tags && Array.isArray(analysis.semantic_tags) && analysis.semantic_tags.length > 0) score += 5
    if (analysis.character_types && analysis.character_types.length > 0) score += 5
    if (analysis.pitch_analysis && Object.keys(analysis.pitch_analysis).length > 0) score += 10
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

  const prompt = buildDeconstructionPrompt(title, analysis, mode)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: `You are an expert content adaptation analyst specializing in analyzing Korean webtoons and webnovels for adaptation potential across different media formats (Film, TV, Animation, Microdrama, Audio Drama).

You understand story structure, character archetypes, pacing requirements, and production constraints for each format.
Always return valid JSON matching the requested structure.`
        },
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

  try {
    return JSON.parse(content) as StoryDeconstruction
  } catch (e) {
    console.error('[FORMAT-FIT] Failed to parse deconstruction:', content)
    throw new Error('Failed to parse story deconstruction')
  }
}

function buildDeconstructionPrompt(
  title: TitleData,
  analysis: ContentAnalysis | null,
  mode: 'rich' | 'limited'
): string {
  const titleInfo = `
TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
SYNOPSIS: ${title.synopsis || title.description_kr || 'Not available'}
GENRE: ${title.genre?.join(', ') || 'Not specified'}
TONE: ${title.tone || 'Not specified'}
FORMAT: ${title.content_format || 'Not specified'}
CHAPTERS: ${title.chapters || 'Unknown'}
COMPLETION STATUS: ${title.completed || 'Unknown'}
TARGET AUDIENCE: ${title.audience || title.perfect_for || 'Not specified'}
AGE RATING: ${title.age_rating || 'Not specified'}`

  const richDetails = mode === 'rich' ? `
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
- Mood Analysis: ${analysis?.mood_analysis ? JSON.stringify(analysis.mood_analysis) : 'Not available'}` : ''

  return `Analyze this Korean webtoon/webnovel for content format adaptation potential.
${titleInfo}
${richDetails}

Deconstruct this story for adaptation analysis. Return a JSON object with these exact keys:

{
  "save_the_cat_genre": "Choose ONE: Monster in the House | Golden Fleece | Out of the Bottle | Dude with a Problem | Rites of Passage | Buddy Love | Whydunit | Fool Triumphant | Institutionalized | Superhero",
  "tone_mood": "Describe the emotional register (e.g., 'Dark and suspenseful with moments of dark humor')",
  "character_archetypes": "Identify hero type, antagonist pattern, key relationships (e.g., 'Reluctant hero with tragic backstory, system as antagonist, found family dynamics')",
  "plot_structure": "Identify the core narrative arc (e.g., 'Survival game with elimination rounds, revenge subplot, social commentary')",
  "setting_world": "Describe time/place/worldbuilding (e.g., 'Contemporary Korea, isolated game facility, dystopian undertones')",
  "themes": "Core messages and social commentary (e.g., 'Class inequality, desperation under capitalism, human nature under pressure')",
  "target_audience": "Demographics and appeal factors (e.g., 'Adults 18-45, thriller fans, social drama enthusiasts')",
  "format_style": "Narrative style and pacing (e.g., 'High-stakes action sequences, ensemble cast, episodic challenges')",

  "narrative_complexity": "Choose ONE: simple | moderate | complex",
  "character_count": "Choose ONE: few | moderate | ensemble",
  "visual_intensity": "Choose ONE: low | moderate | high",
  "pacing_type": "Choose ONE: fast | moderate | slow",
  "setting_production_cost": "Choose ONE: low | moderate | high"
}`
}

async function analyzeAllFormats(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  analysis: ContentAnalysis | null,
  mode: 'rich' | 'limited'
): Promise<Record<FormatType, FormatAnalysis>> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = buildFormatAnalysisPrompt(title, deconstruction, analysis, mode)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: `You are an expert content adaptation analyst. You deeply understand what makes content successful across different media formats:

FILM (90-150 min): Strong standalone arcs, visual impact, protagonist journey, high concept
TV SERIES (8-16 episodes): Ensemble casts, episodic potential, season arcs, cliffhangers
ANIMATION: Visual distinctiveness, fantasy/supernatural elements, action sequences, art style
MICRODRAMA (60-120s episodes, 70-100+ total): Simple melodrama, cliffhangers every minute, romance/revenge/supernatural, modern settings, dialogue-heavy, target: women 30-60
AUDIO DRAMA: Dialogue-driven, atmospheric, mystery/thriller, distinctive voices, low visual dependency

Always return valid JSON. Be specific and honest in your evaluations.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const parsed = JSON.parse(content)

    // Process and validate each format analysis
    const result: Record<FormatType, FormatAnalysis> = {} as Record<FormatType, FormatAnalysis>

    for (const format of FORMAT_TYPES) {
      const formatData = parsed[format] || parsed[format + '_analysis'] || {}

      // Calculate weighted score from dimensions
      const dimensions = formatData.dimensions || []
      const weightedScore = calculateWeightedScoreFromRaw(dimensions, format)

      result[format] = {
        format,
        overall_score: Math.round(weightedScore),
        fit_level: getFitLevel(weightedScore),
        summary: formatData.summary || '',
        dimensions: dimensions.map((d: any) => ({
          dimension: d.dimension,
          score: d.score,
          reason: d.reason,
          weight: FORMAT_DIMENSION_WEIGHTS[format][d.dimension as FormatFitDimension] || 0,
        })),
        strengths: formatData.strengths || [],
        challenges: formatData.challenges || [],
        recommendations: formatData.recommendations || [],
        format_specific: format === 'microdrama' ? formatData.microdrama_specific : undefined,
      }
    }

    return result
  } catch (e) {
    console.error('[FORMAT-FIT] Failed to parse format analysis:', content)
    throw new Error('Failed to parse format analysis')
  }
}

function calculateWeightedScoreFromRaw(
  dimensions: { dimension: string; score: number }[],
  format: FormatType
): number {
  const weights = FORMAT_DIMENSION_WEIGHTS[format]
  let totalScore = 0
  let totalWeight = 0

  for (const dim of dimensions) {
    const weight = weights[dim.dimension as FormatFitDimension] || 0
    totalScore += dim.score * weight
    totalWeight += weight
  }

  // Normalize if weights don't sum to 1
  if (totalWeight > 0 && totalWeight !== 1) {
    totalScore = totalScore / totalWeight
  }

  return totalScore
}

function buildFormatAnalysisPrompt(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  analysis: ContentAnalysis | null,
  mode: 'rich' | 'limited'
): string {
  return `Analyze this Korean title for adaptation suitability across 5 content formats.

TITLE: ${title.title_name_en || title.title_name_kr || 'Unknown'}
GENRE: ${title.genre?.join(', ') || 'Not specified'}
CHAPTERS: ${title.chapters || 'Unknown'}

STORY DECONSTRUCTION:
- Save the Cat Genre: ${deconstruction.save_the_cat_genre}
- Tone & Mood: ${deconstruction.tone_mood}
- Character Archetypes: ${deconstruction.character_archetypes}
- Plot Structure: ${deconstruction.plot_structure}
- Setting & World: ${deconstruction.setting_world}
- Themes: ${deconstruction.themes}
- Target Audience: ${deconstruction.target_audience}
- Format Style: ${deconstruction.format_style}

ADAPTATION FACTORS:
- Narrative Complexity: ${deconstruction.narrative_complexity}
- Character Count: ${deconstruction.character_count}
- Visual Intensity: ${deconstruction.visual_intensity}
- Pacing Type: ${deconstruction.pacing_type}
- Setting Production Cost: ${deconstruction.setting_production_cost}

For each of the 5 formats, evaluate these 7 dimensions (score 0-100):
1. narrative_structure - How well does the story arc fit the format?
2. character_suitability - Do the characters work for this format?
3. visual_requirements - Can the visual demands be met (or are they even needed)?
4. pacing_fit - Does the pacing match format expectations?
5. production_feasibility - Is production realistic for this format?
6. audience_alignment - Does the target audience match?
7. genre_fit - How well does the genre work for this format?

CRITICAL FOR MICRODRAMA SCORING:
- HIGH SCORES if: romance/revenge/supernatural themes, modern settings, simple melodrama, clear conflicts, dialogue-heavy, cliffhanger potential
- LOW SCORES if: complex worldbuilding, slow-burn, action-heavy, period settings, large ensemble, non-linear narrative

Return a JSON object with analysis for all 5 formats:

{
  "film": {
    "summary": "2-3 sentence explanation of overall fit",
    "dimensions": [
      { "dimension": "narrative_structure", "score": 75, "reason": "..." },
      { "dimension": "character_suitability", "score": 80, "reason": "..." },
      { "dimension": "visual_requirements", "score": 70, "reason": "..." },
      { "dimension": "pacing_fit", "score": 65, "reason": "..." },
      { "dimension": "production_feasibility", "score": 60, "reason": "..." },
      { "dimension": "audience_alignment", "score": 75, "reason": "..." },
      { "dimension": "genre_fit", "score": 70, "reason": "..." }
    ],
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "tv_series": { ... same structure ... },
  "animation": { ... same structure ... },
  "microdrama": {
    ... same structure ...,
    "microdrama_specific": {
      "cliffhanger_potential": 85,
      "trope_alignment": ["secret_billionaire", "revenge"],
      "episode_structure_fit": 80,
      "vertical_filming_compatibility": 75,
      "target_platform_fit": ["ReelShort", "DramaBox"]
    }
  },
  "audio_drama": { ... same structure ... }
}

Be specific and honest. If a format is a poor fit, say so with clear reasons.`
}
