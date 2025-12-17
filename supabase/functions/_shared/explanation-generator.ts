/**
 * Explanation Generator Module
 *
 * Generates rich explanations for WHY titles match user queries.
 * Unifies explanation format across all search engines:
 * - Comps: Uses 8-dimensional scoring
 * - Mandate: Uses AI-generated explanations
 * - Vector: Adds lightweight explanation generation
 */

import type { DimensionScore, TitleMatchV2 } from './comps-types.ts';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface RichExplanation {
  title_id: string;
  title_name: string;
  title_name_kr?: string;
  overall_score: number;

  // Why this matches (narrative form)
  explanation_narrative: string;

  // Structured match reasons (bullet points)
  match_reasons: string[];

  // 8-dimensional breakdown (from comps engine)
  dimensions?: DimensionScore[];

  // Highlight keywords (from mandate engine)
  highlights?: string[];

  // Source engine for debugging
  source_engine: 'comps' | 'mandate' | 'vector';

  // Additional metadata
  metadata?: {
    genre?: string[];
    tone?: string;
    content_format?: string;
    synopsis?: string;
  };
}

export interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  genre?: string[];
  tone?: string;
  content_format?: string;
  comps?: string[];
  perfect_for?: string;
  audience?: string;
  similarity: number;
}

export interface MandateMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr?: string;
  match_score: number;
  synopsis?: string;
  genre?: string[];
  tone?: string;
  content_format?: string;
  ai_explanation?: string;
  match_highlights?: string[];
}

// =====================================================================
// DIMENSION DISPLAY NAMES
// =====================================================================

const DIMENSION_DISPLAY_NAMES: Record<string, string> = {
  genre_blueprint: 'Genre & Structure',
  tone_mood: 'Tone & Atmosphere',
  character_archetypes: 'Character Types',
  plot_structure: 'Plot & Pacing',
  setting_world: 'Setting & World',
  themes: 'Themes & Messages',
  target_audience: 'Target Audience',
  format_style: 'Format & Style',
};

// =====================================================================
// COMPS ENGINE EXPLANATION GENERATION
// =====================================================================

/**
 * Generate rich explanation from Comps Navigator results.
 * Leverages 8-dimensional scoring to create narrative.
 */
export function generateCompsExplanation(
  match: TitleMatchV2,
  compTitles: string[]
): RichExplanation {
  const dimensions = match.dimension_scores || [];

  // Sort dimensions by score (highest first)
  const sortedDimensions = [...dimensions].sort((a, b) => b.score - a.score);

  // Generate narrative from top 3 dimensions
  const narrative = generateNarrativeFromDimensions(sortedDimensions, compTitles, match.title_name_en);

  // Use existing match_reasons or generate from dimensions
  const matchReasons = match.match_reasons?.length
    ? match.match_reasons
    : generateReasonsFromDimensions(sortedDimensions, compTitles);

  return {
    title_id: match.title_id,
    title_name: match.title_name_en,
    title_name_kr: match.title_name_kr,
    overall_score: match.overall_match_score,
    explanation_narrative: match.explanation || narrative,
    match_reasons: matchReasons,
    dimensions: match.dimension_scores,
    source_engine: 'comps',
    metadata: {
      genre: match.genre,
      tone: match.tone,
      content_format: match.content_format,
      synopsis: match.synopsis,
    }
  };
}

/**
 * Generate a natural language narrative from dimension scores.
 */
function generateNarrativeFromDimensions(
  sortedDimensions: DimensionScore[],
  compTitles: string[],
  titleName: string
): string {
  if (sortedDimensions.length === 0) {
    return `"${titleName}" shares thematic DNA with ${compTitles.join(' and ')}.`;
  }

  const compStr = compTitles.length === 1
    ? compTitles[0]
    : compTitles.slice(0, -1).join(', ') + ' and ' + compTitles[compTitles.length - 1];

  // Start with intro
  let narrative = `"${titleName}" connects strongly with ${compStr}. `;

  // Add top dimension explanations
  const topDimensions = sortedDimensions.slice(0, 3);

  topDimensions.forEach((dim, idx) => {
    const dimName = DIMENSION_DISPLAY_NAMES[dim.dimension] || dim.dimension;
    const connector = idx === 0 ? 'The strongest alignment is in'
      : idx === 1 ? 'It also shares'
        : 'Additionally, there\'s connection in';

    if (dim.reason) {
      narrative += `${connector} ${dimName.toLowerCase()}: ${dim.reason} `;
    } else if (dim.score >= 80) {
      narrative += `${connector} ${dimName.toLowerCase()} (${dim.score}% match). `;
    }
  });

  return narrative.trim();
}

/**
 * Generate bullet-point reasons from dimension scores.
 */
function generateReasonsFromDimensions(
  sortedDimensions: DimensionScore[],
  compTitles: string[]
): string[] {
  const reasons: string[] = [];

  // Add reasons from top dimensions
  sortedDimensions.slice(0, 4).forEach(dim => {
    if (dim.reason) {
      reasons.push(dim.reason);
    } else if (dim.score >= 70) {
      const dimName = DIMENSION_DISPLAY_NAMES[dim.dimension] || dim.dimension;
      const alignedComps = dim.aligned_comps?.length
        ? `like ${dim.aligned_comps.join(' and ')}`
        : '';
      reasons.push(`Strong ${dimName.toLowerCase()} match ${alignedComps}`.trim());
    }
  });

  // If still no reasons, add generic ones
  if (reasons.length === 0) {
    reasons.push(`Shares narrative DNA with ${compTitles.join(' and ')}`);
    reasons.push('Similar genre and tone profile');
  }

  return reasons.slice(0, 5);
}

// =====================================================================
// MANDATE ENGINE EXPLANATION GENERATION
// =====================================================================

/**
 * Generate rich explanation from Mandate Matcher results.
 * Uses AI-generated explanations and highlights.
 */
export function generateMandateExplanation(
  match: MandateMatch,
  mandateText: string
): RichExplanation {
  // Use existing AI explanation or generate fallback
  const narrative = match.ai_explanation || generateMandateFallbackExplanation(match);

  // Use highlights or generate from metadata
  const highlights = match.match_highlights?.length
    ? match.match_highlights
    : generateHighlightsFromMetadata(match);

  return {
    title_id: match.title_id,
    title_name: match.title_name_en,
    title_name_kr: match.title_name_kr,
    overall_score: match.match_score,
    explanation_narrative: narrative,
    match_reasons: highlights,
    highlights,
    source_engine: 'mandate',
    metadata: {
      genre: match.genre,
      tone: match.tone,
      content_format: match.content_format,
      synopsis: match.synopsis,
    }
  };
}

/**
 * Generate fallback explanation when AI explanation is missing.
 */
function generateMandateFallbackExplanation(match: MandateMatch): string {
  const parts: string[] = [];

  parts.push(`"${match.title_name_en}" may align with your mandate`);

  if (match.genre?.length) {
    parts.push(`based on its ${match.genre.slice(0, 2).join(' and ')} elements`);
  }

  if (match.tone) {
    parts.push(`with a ${match.tone.toLowerCase()} tone`);
  }

  if (match.content_format) {
    parts.push(`as a ${match.content_format.toLowerCase()}`);
  }

  return parts.join(' ') + '.';
}

/**
 * Generate highlight bullets from metadata.
 */
function generateHighlightsFromMetadata(match: MandateMatch): string[] {
  const highlights: string[] = [];

  if (match.genre?.length) {
    highlights.push(`${match.genre[0]} genre`);
  }

  if (match.tone) {
    highlights.push(`${match.tone} tone`);
  }

  if (match.content_format) {
    highlights.push(`${match.content_format} format`);
  }

  if (highlights.length === 0) {
    highlights.push('Relevant to your criteria');
  }

  return highlights.slice(0, 3);
}

// =====================================================================
// VECTOR SEARCH EXPLANATION GENERATION
// =====================================================================

/**
 * Generate rich explanation from vector search results.
 * Creates lightweight explanation based on metadata.
 */
export function generateVectorExplanation(
  result: VectorSearchResult,
  userQuery: string
): RichExplanation {
  const score = Math.round(result.similarity * 100);

  // Generate narrative from available metadata
  const narrative = generateVectorNarrative(result, userQuery);

  // Generate match reasons from metadata
  const matchReasons = generateVectorReasons(result, userQuery);

  return {
    title_id: result.title_id,
    title_name: result.title_name_en || result.title_name_kr || 'Unknown Title',
    title_name_kr: result.title_name_kr,
    overall_score: score,
    explanation_narrative: narrative,
    match_reasons: matchReasons,
    source_engine: 'vector',
    metadata: {
      genre: result.genre,
      tone: result.tone,
      content_format: result.content_format,
      synopsis: result.synopsis,
    }
  };
}

/**
 * Generate narrative for vector search result.
 */
function generateVectorNarrative(result: VectorSearchResult, userQuery: string): string {
  const titleName = result.title_name_en || result.title_name_kr || 'This title';
  const parts: string[] = [];

  // Start with title name and basic connection
  parts.push(`"${titleName}" is a strong match for your search.`);

  // Add genre/tone context
  if (result.genre?.length && result.tone) {
    parts.push(`It's a ${result.tone.toLowerCase()} ${result.genre[0].toLowerCase()} story`);
  } else if (result.genre?.length) {
    parts.push(`It's a ${result.genre[0].toLowerCase()} title`);
  }

  // Add "perfect for" context if available
  if (result.perfect_for) {
    parts.push(`that's perfect for ${result.perfect_for.toLowerCase()}.`);
  } else if (result.audience) {
    parts.push(`appealing to ${result.audience.toLowerCase()} audiences.`);
  } else {
    // End the previous sentence
    if (parts.length > 1) {
      parts[parts.length - 1] += '.';
    }
  }

  // Add comps if available
  if (result.comps?.length) {
    parts.push(`Think of it as similar to ${result.comps.slice(0, 2).join(' and ')}.`);
  }

  return parts.join(' ');
}

/**
 * Generate match reasons for vector search result.
 */
function generateVectorReasons(result: VectorSearchResult, userQuery: string): string[] {
  const reasons: string[] = [];
  const lowerQuery = userQuery.toLowerCase();

  // Check for genre matches with query
  if (result.genre?.length) {
    const matchingGenres = result.genre.filter(g =>
      lowerQuery.includes(g.toLowerCase())
    );
    if (matchingGenres.length) {
      reasons.push(`Matches requested ${matchingGenres.join(', ')} genre`);
    } else {
      reasons.push(`${result.genre[0]} genre`);
    }
  }

  // Add tone
  if (result.tone) {
    reasons.push(`${result.tone} tone and atmosphere`);
  }

  // Add format
  if (result.content_format) {
    reasons.push(`${result.content_format} format`);
  }

  // Add comps reference
  if (result.comps?.length) {
    reasons.push(`Similar to ${result.comps[0]}`);
  }

  // Add perfect_for
  if (result.perfect_for) {
    reasons.push(`Great for ${result.perfect_for}`);
  }

  // Ensure at least 2 reasons
  if (reasons.length < 2) {
    reasons.push('High semantic similarity to your query');
  }

  return reasons.slice(0, 5);
}

// =====================================================================
// BATCH EXPLANATION GENERATION
// =====================================================================

/**
 * Generate explanations for multiple comps results.
 */
export function generateCompsExplanations(
  matches: TitleMatchV2[],
  compTitles: string[]
): RichExplanation[] {
  return matches.map(match => generateCompsExplanation(match, compTitles));
}

/**
 * Generate explanations for multiple mandate results.
 */
export function generateMandateExplanations(
  matches: MandateMatch[],
  mandateText: string
): RichExplanation[] {
  return matches.map(match => generateMandateExplanation(match, mandateText));
}

/**
 * Generate explanations for multiple vector results.
 */
export function generateVectorExplanations(
  results: VectorSearchResult[],
  userQuery: string
): RichExplanation[] {
  return results.map(result => generateVectorExplanation(result, userQuery));
}

// =====================================================================
// FORMATTING UTILITIES
// =====================================================================

/**
 * Format explanation for chat display.
 */
export function formatExplanationForChat(explanation: RichExplanation): string {
  const lines: string[] = [];

  // Title with score
  lines.push(`**${explanation.title_name}** (${explanation.overall_score}% match)`);

  // Narrative
  lines.push(explanation.explanation_narrative);

  // Match reasons as bullets
  if (explanation.match_reasons.length > 0) {
    lines.push('');
    lines.push('Key connections:');
    explanation.match_reasons.slice(0, 3).forEach(reason => {
      lines.push(`• ${reason}`);
    });
  }

  return lines.join('\n');
}

/**
 * Format multiple explanations for chat.
 */
export function formatExplanationsForChat(
  explanations: RichExplanation[],
  contextPhrase?: string
): string {
  const lines: string[] = [];

  // Optional context phrase
  if (contextPhrase) {
    lines.push(contextPhrase);
    lines.push('');
  }

  // Format each explanation
  explanations.forEach((exp, idx) => {
    if (idx > 0) lines.push('---');
    lines.push(formatExplanationForChat(exp));
    lines.push('');
  });

  return lines.join('\n').trim();
}

/**
 * Get score level label for display.
 */
export function getScoreLevel(score: number): 'excellent' | 'strong' | 'moderate' | 'weak' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  return 'weak';
}

/**
 * Get score color class for UI.
 */
export function getScoreColorClass(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-gray-600';
}
