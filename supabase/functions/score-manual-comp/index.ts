import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import {
  COMPS_ENGINE_VERSION,
  type SuggestedCompV2,
  type StoryDeconstruction,
} from '../_shared/comps-types.ts';

import {
  buildAnalysisSummary,
  calculateDataCompleteness,
  deconstructStory,
  fetchWithTimeout,
  selectMode,
  type ContentAnalysis,
  type TitleData,
} from '../_shared/comps-deconstruction.ts';

import {
  estimateGeneratorCost,
  logCompsEngine,
} from '../_shared/comps-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REQUEST_TIMEOUT_MS = 60000;
const MAX_CANDIDATES = 8;

// =====================================================================
// TYPES
// =====================================================================

interface CandidateInput {
  comp_title: string;
  comp_year?: number;
  comp_type: string;
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;
}

interface ScoreManualCompRequest {
  title_id: string;
  candidates: CandidateInput[];
  mode?: 'rich' | 'limited' | 'auto';
  user_email?: string;
}

interface ScoreManualCompResponse {
  success: true;
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  scored_comps: SuggestedCompV2[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
}

// =====================================================================
// MAIN HANDLER
// =====================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const requestData: ScoreManualCompRequest = await req.json();

    if (!requestData.title_id) throw new Error('title_id is required');
    if (!Array.isArray(requestData.candidates) || requestData.candidates.length === 0) {
      throw new Error('candidates array is required and must be non-empty');
    }
    if (requestData.candidates.length > MAX_CANDIDATES) {
      throw new Error(`Too many candidates: max ${MAX_CANDIDATES} per call`);
    }
    for (const c of requestData.candidates) {
      if (!c.comp_title || !c.comp_type) {
        throw new Error('each candidate must have comp_title and comp_type');
      }
    }

    console.log('[SCORE-MANUAL-COMP] Starting', {
      title_id: requestData.title_id,
      candidate_count: requestData.candidates.length,
      mode: requestData.mode || 'auto',
    });

    // =====================================================================
    // PHASE 1: FETCH TITLE
    // =====================================================================
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
      .single();

    if (titleError || !titleData) {
      console.error('[SCORE-MANUAL-COMP] Title fetch error:', titleError);
      throw new Error(`Title not found: ${requestData.title_id}`);
    }

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
      .maybeSingle();

    const { data: pitchDocs } = await supabaseClient
      .from('title_documents')
      .select('id')
      .eq('title_id', requestData.title_id)
      .eq('document_type', 'source_pdf')
      .limit(1);

    const hasPitchDeck = !!(pitchDocs && pitchDocs.length > 0);

    // =====================================================================
    // PHASE 2: MODE SELECTION + DECONSTRUCTION
    // =====================================================================
    const completenessScore = calculateDataCompleteness(
      titleData as TitleData,
      contentAnalysis as ContentAnalysis | null,
      hasPitchDeck,
    );
    const modeUsed = selectMode(requestData.mode, completenessScore);

    const deconstruction = await deconstructStory(
      titleData as TitleData,
      contentAnalysis as ContentAnalysis | null,
      modeUsed,
      '[SCORE-MANUAL-COMP]',
    );

    // =====================================================================
    // PHASE 3: SCORE THE PROVIDED CANDIDATES
    // =====================================================================
    const scoredFromAi = await scoreCandidates(
      titleData as TitleData,
      deconstruction,
      modeUsed,
      requestData.candidates,
    );

    // Merge AI scoring with the original candidate's IMDB metadata,
    // preferring the AI's scoring fields and the input's identity fields.
    const scoredComps: SuggestedCompV2[] = requestData.candidates.map((candidate, idx) => {
      const aiResult = scoredFromAi[idx];
      const base: SuggestedCompV2 = {
        comp_title: candidate.comp_title,
        comp_year: candidate.comp_year,
        comp_type: candidate.comp_type,
        overall_match_score: aiResult?.overall_match_score ?? 0,
        dimension_scores: aiResult?.dimension_scores ?? [],
        explanation: aiResult?.explanation ?? '',
        match_reasons: aiResult?.match_reasons ?? [],
        imdb_id: candidate.imdb_id,
        imdb_url: candidate.imdb_url,
        poster_url: candidate.poster_url,
      };
      // Tag as manual-sourced so consumers can preserve the distinction.
      return { ...base, source: 'manual' } as SuggestedCompV2 & { source: 'manual' };
    });

    const totalDuration = Date.now() - startTime;
    const costEstimate = estimateGeneratorCost();

    logCompsEngine('Manual comp scoring complete', {
      title_id: requestData.title_id,
      total_duration_ms: totalDuration,
      mode_used: modeUsed,
      scored_count: scoredComps.length,
      engine_version: COMPS_ENGINE_VERSION,
    });

    const response: ScoreManualCompResponse = {
      success: true,
      title_id: requestData.title_id,
      title_name: titleData.title_name_en || titleData.title_name_kr || 'Unknown',
      mode_used: modeUsed,
      scored_comps: scoredComps,
      analysis_summary: buildAnalysisSummary(deconstruction, modeUsed),
      processing_time_ms: totalDuration,
      cost_estimate: costEstimate,
      engine_version: COMPS_ENGINE_VERSION,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[SCORE-MANUAL-COMP] Error:', error);
    const clientErrors = [
      'title_id is required',
      'candidates array is required',
      'each candidate must have',
      'Too many candidates',
      'Title not found',
    ];
    const message = (error as Error).message ?? 'Unknown error';
    const isClientError = clientErrors.some((m) => message.includes(m));
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: isClientError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// =====================================================================
// CANDIDATE SCORING
// =====================================================================

async function scoreCandidates(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  mode: 'rich' | 'limited',
  candidates: CandidateInput[],
): Promise<SuggestedCompV2[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = buildScoringPrompt(title, deconstruction, mode, candidates);

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Hollywood development executive expert in scoring comparable titles (comps) for Korean content.
You know film and TV history deeply and can identify meaningful similarities across cultures.
You are given a Korean title's story analysis AND a fixed list of candidate comps.
Your job is to SCORE each provided candidate honestly across the 8 dimensions — NOT to invent new comps.
Always return valid JSON matching the requested structure, in the same order as the input candidates.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    const comps = parsed.comps || parsed.scored_comps || parsed;
    if (!Array.isArray(comps)) {
      throw new Error('Invalid scored comps format - expected array');
    }
    return comps as SuggestedCompV2[];
  } catch (e) {
    console.error('[SCORE-MANUAL-COMP] Failed to parse scoring response:', content);
    throw new Error('Failed to parse manual comp scoring response');
  }
}

function buildScoringPrompt(
  title: TitleData,
  deconstruction: StoryDeconstruction,
  mode: 'rich' | 'limited',
  candidates: CandidateInput[],
): string {
  const confidenceNote = mode === 'limited'
    ? '\n\nNOTE: Limited data was available for the Korean title. Adjust confidence accordingly and note uncertainty in explanations.'
    : '';

  const candidateLines = candidates.map((c, idx) => {
    const parts = [`${idx + 1}. ${c.comp_title}`];
    if (c.comp_year) parts.push(`(${c.comp_year})`);
    parts.push(`[${c.comp_type}]`);
    if (c.imdb_id) parts.push(`IMDB: ${c.imdb_id}`);
    return parts.join(' ');
  }).join('\n');

  return `Score these specific Hollywood/global comp candidates against the Korean title below.
Do NOT suggest new comps - only score the candidates provided, in the same order.

KOREAN TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
SYNOPSIS: ${title.synopsis || title.synopsis_kr || 'Not available'}
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

CANDIDATES TO SCORE:
${candidateLines}

For each candidate, evaluate similarity to the Korean title across these 8 dimensions with scores and reasons.
Weight the dimensions as follows: Genre (20%), Tone (15%), Characters (15%), Plot (15%), Setting (10%), Themes (10%), Audience (10%), Format (5%).

Return a JSON object with a "comps" array, one entry per candidate in the SAME ORDER as the input:

{
  "comps": [
    {
      "comp_title": "<copy from input>",
      "comp_year": <copy from input or null>,
      "comp_type": "<copy from input>",
      "overall_match_score": 85,
      "dimension_scores": [
        { "dimension": "genre_blueprint", "score": 90, "reason": "Both are workplace dramas with underdog protagonists" },
        { "dimension": "tone_mood", "score": 80, "reason": "Mix of humor and emotional depth" },
        { "dimension": "character_archetypes", "score": 85, "reason": "Outsider hero in a corporate environment" },
        { "dimension": "plot_structure", "score": 75, "reason": "Episodic workplace challenges leading to growth" },
        { "dimension": "setting_world", "score": 80, "reason": "Contemporary corporate setting" },
        { "dimension": "themes", "score": 85, "reason": "Identity, self-worth, fitting in" },
        { "dimension": "target_audience", "score": 80, "reason": "Adult audience drawn to character-driven workplace stories" },
        { "dimension": "format_style", "score": 70, "reason": "Slice-of-life episodic format" }
      ],
      "explanation": "2-3 sentence summary explaining the overall match and why this comp is relevant.",
      "match_reasons": [
        "Both feature underdog protagonists in competitive industries",
        "Similar mix of humor and emotional depth",
        "Explores themes of identity and self-worth"
      ]
    }
  ]
}

Requirements:
- Score honestly - if a dimension does not match well, give a low score and say why.
- Be specific in reasons - generic statements like "both are dramas" are not useful.
- Return EXACTLY ${candidates.length} entries in the comps array, one per input candidate, in the same order.
- Use the exact dimension keys: genre_blueprint, tone_mood, character_archetypes, plot_structure, setting_world, themes, target_audience, format_style.
- overall_match_score is an integer 0-100 derived from a weighted average using the weights listed above.`;
}
