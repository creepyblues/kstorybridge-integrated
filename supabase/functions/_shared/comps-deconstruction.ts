/**
 * Shared Story Deconstruction Helpers
 *
 * Used by both `comps-generator` (generates fresh comps) and `score-manual-comp`
 * (scores admin-provided candidates). Both need to take a title and produce an
 * 8-dimension Story Deconstruction via GPT-4o before any comp scoring happens.
 */

import type { StoryDeconstruction } from './comps-types.ts';

export const DECONSTRUCTION_TIMEOUT_MS = 60000;

export interface TitleData {
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

export interface ContentAnalysis {
  semantic_tags: unknown[] | null;
  plot_elements: string[] | null;
  character_types: string[] | null;
  cultural_elements: string[] | null;
  mood_analysis: Record<string, unknown> | null;
  pitch_analysis: Record<string, unknown> | null;
  processing_confidence: number | null;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DECONSTRUCTION_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function calculateDataCompleteness(
  title: TitleData,
  analysis: ContentAnalysis | null,
  hasPitchDeck: boolean,
): number {
  let score = 0;

  if (title.synopsis && title.synopsis.length > 50) score += 10;
  if (title.genre && title.genre.length > 0) score += 10;
  if (title.tone) score += 10;

  if (title.character_details && Object.keys(title.character_details).length > 0) score += 15;
  if (title.story_structure) score += 10;
  if (title.setting_description) score += 5;
  if (title.important_issues) score += 5;
  if (title.world_lore) score += 5;
  if (title.inspiration) score += 5;

  if (analysis) {
    if (analysis.plot_elements && analysis.plot_elements.length > 0) score += 10;
    if (analysis.semantic_tags && Array.isArray(analysis.semantic_tags) && analysis.semantic_tags.length > 0) {
      score += 10;
    }
    if (analysis.character_types && analysis.character_types.length > 0) score += 5;
    if (analysis.pitch_analysis && Object.keys(analysis.pitch_analysis).length > 0) score += 15;
  }

  if (hasPitchDeck) score += 10;

  return Math.min(score, 100);
}

export function selectMode(
  requested: 'rich' | 'limited' | 'auto' | undefined,
  completenessScore: number,
): 'rich' | 'limited' {
  if (requested === 'rich' || requested === 'limited') return requested;
  return completenessScore >= 50 ? 'rich' : 'limited';
}

export function buildRichDeconstructionPrompt(
  title: TitleData,
  analysis: ContentAnalysis | null,
): string {
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
}`;
}

export function buildLimitedDeconstructionPrompt(title: TitleData): string {
  return `Analyze this Korean webtoon/webnovel for Hollywood comp matching. Note: Limited data available.

TITLE: ${title.title_name_en || ''} / ${title.title_name_kr || ''}
SYNOPSIS: ${title.synopsis || title.synopsis_kr || 'Not available'}
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
}`;
}

export async function deconstructStory(
  title: TitleData,
  analysis: ContentAnalysis | null,
  mode: 'rich' | 'limited',
  logPrefix = '[COMPS-DECON]',
): Promise<StoryDeconstruction> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = mode === 'rich'
    ? buildRichDeconstructionPrompt(title, analysis)
    : buildLimitedDeconstructionPrompt(title);

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
            content: `You are a story analyst expert in deconstructing narratives for Hollywood comp matching.
You understand Blake Snyder's "Save the Cat" genre taxonomy and can identify story patterns across cultures.
Always return valid JSON matching the requested structure.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    },
    DECONSTRUCTION_TIMEOUT_MS,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content) as StoryDeconstruction;
  } catch (_e) {
    console.error(`${logPrefix} Failed to parse deconstruction:`, content);
    throw new Error('Failed to parse story deconstruction');
  }
}

export function buildAnalysisSummary(
  deconstruction: StoryDeconstruction,
  mode: 'rich' | 'limited',
): string {
  const modeNote = mode === 'limited'
    ? ' (Note: Analysis based on limited data - some inferences may be approximate)'
    : '';

  return `Story Type: ${deconstruction.save_the_cat_genre}
Tone: ${deconstruction.tone_mood}
Core Appeal: ${deconstruction.target_audience}${modeNote}`;
}
