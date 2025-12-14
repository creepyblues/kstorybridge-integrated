/**
 * Format Fit Engine - Shared Types
 * Version: 1.0.0
 *
 * This file defines the canonical types and constants for the Format Fit Engine
 * which analyzes Korean titles for adaptation suitability across 5 content formats:
 * - Film
 * - TV Series
 * - Animation
 * - Microdrama (ReelShort, DramaBox style)
 * - Audio Drama (Podcast fiction)
 */

// =====================================================================
// ENGINE VERSION
// =====================================================================

export const FORMAT_FIT_ENGINE_VERSION = "1.0.0";

// =====================================================================
// FORMAT DEFINITIONS
// =====================================================================

/**
 * The 5 target content formats for adaptation analysis
 */
export const FORMAT_TYPES = [
  'film',
  'tv_series',
  'animation',
  'microdrama',
  'audio_drama',
] as const;

export type FormatType = typeof FORMAT_TYPES[number];

export const FORMAT_DISPLAY_NAMES: Record<FormatType, string> = {
  film: 'Film',
  tv_series: 'TV Series',
  animation: 'Animation',
  microdrama: 'Microdrama',
  audio_drama: 'Audio Drama',
};

export const FORMAT_DESCRIPTIONS: Record<FormatType, string> = {
  film: 'Theatrical or streaming movie (90-150 minutes)',
  tv_series: 'Multi-episode television drama (8-16 episodes)',
  animation: 'Animated series or film',
  microdrama: 'Short-form vertical drama (60-120s episodes, 70-100+ total)',
  audio_drama: 'Podcast or audio fiction series',
};

// =====================================================================
// DIMENSION DEFINITIONS
// =====================================================================

/**
 * 7 Canonical Dimensions for Format Fit Analysis
 */
export const FORMAT_FIT_DIMENSIONS = [
  'narrative_structure',
  'character_suitability',
  'visual_requirements',
  'pacing_fit',
  'production_feasibility',
  'audience_alignment',
  'genre_fit',
] as const;

export type FormatFitDimension = typeof FORMAT_FIT_DIMENSIONS[number];

export const DIMENSION_DISPLAY_NAMES: Record<FormatFitDimension, string> = {
  narrative_structure: 'Narrative Structure',
  character_suitability: 'Character Suitability',
  visual_requirements: 'Visual Requirements',
  pacing_fit: 'Pacing Fit',
  production_feasibility: 'Production Feasibility',
  audience_alignment: 'Audience Alignment',
  genre_fit: 'Genre Fit',
};

export const DIMENSION_DESCRIPTIONS: Record<FormatFitDimension, string> = {
  narrative_structure: 'How well the story arc fits the format\'s typical length/structure',
  character_suitability: 'Character depth, count, and archetypes for format requirements',
  visual_requirements: 'Visual complexity vs format constraints/capabilities',
  pacing_fit: 'Story pacing vs format expectations',
  production_feasibility: 'Budget/technical requirements for the format',
  audience_alignment: 'Target audience match with format\'s typical viewers',
  genre_fit: 'How well the genre works for this specific format',
};

/**
 * Format-specific dimension weights
 * Each format prioritizes dimensions differently
 * Weights must sum to 1.0
 */
export const FORMAT_DIMENSION_WEIGHTS: Record<FormatType, Record<FormatFitDimension, number>> = {
  film: {
    narrative_structure: 0.25,    // Strong standalone arc crucial
    character_suitability: 0.15,  // Focus on protagonist journey
    visual_requirements: 0.20,    // High visual impact needed
    pacing_fit: 0.15,             // 90-150 min pacing
    production_feasibility: 0.10, // Budget considerations
    audience_alignment: 0.10,
    genre_fit: 0.05
  },
  tv_series: {
    narrative_structure: 0.15,    // Episodic potential matters
    character_suitability: 0.25,  // Ensemble cast important
    visual_requirements: 0.10,
    pacing_fit: 0.20,             // Season arc + episode hooks
    production_feasibility: 0.10,
    audience_alignment: 0.15,
    genre_fit: 0.05
  },
  animation: {
    narrative_structure: 0.15,
    character_suitability: 0.15,
    visual_requirements: 0.30,    // Visual distinctiveness key
    pacing_fit: 0.10,
    production_feasibility: 0.05, // Animation removes many constraints
    audience_alignment: 0.15,
    genre_fit: 0.10
  },
  microdrama: {
    narrative_structure: 0.10,    // Simple is better
    character_suitability: 0.10,  // Archetypal characters
    visual_requirements: 0.15,    // Vertical format + close-ups
    pacing_fit: 0.30,             // CRITICAL: 60-120s episodes with cliffhangers
    production_feasibility: 0.15, // Modern settings preferred
    audience_alignment: 0.15,     // Women 30-60, affluent
    genre_fit: 0.05
  },
  audio_drama: {
    narrative_structure: 0.20,
    character_suitability: 0.20,  // Voice distinctiveness
    visual_requirements: 0.05,    // Low visual dependency good
    pacing_fit: 0.15,
    production_feasibility: 0.15, // Audio-only production
    audience_alignment: 0.15,
    genre_fit: 0.10
  }
};

// =====================================================================
// SCORING INTERFACES
// =====================================================================

/**
 * Score for a single dimension
 */
export interface DimensionScore {
  dimension: FormatFitDimension;
  score: number;              // 0-100
  reason: string;             // 1-2 sentence explanation
  weight: number;             // Format-specific weight applied
}

/**
 * Fit level thresholds for UI display
 */
export type FitLevel = 'excellent' | 'good' | 'moderate' | 'poor';

export const FIT_LEVEL_THRESHOLDS = {
  excellent: 80,  // >= 80
  good: 60,       // >= 60
  moderate: 40,   // >= 40
  poor: 0,        // < 40
} as const;

export const FIT_LEVEL_COLORS: Record<FitLevel, string> = {
  excellent: 'green',
  good: 'blue',
  moderate: 'yellow',
  poor: 'gray',
};

export const FIT_LEVEL_LABELS: Record<FitLevel, string> = {
  excellent: 'Excellent Fit',
  good: 'Good Fit',
  moderate: 'Moderate Fit',
  poor: 'Poor Fit',
};

// =====================================================================
// FORMAT ANALYSIS INTERFACES
// =====================================================================

/**
 * Detailed analysis for a single format
 */
export interface FormatAnalysis {
  format: FormatType;
  overall_score: number;        // 0-100
  fit_level: FitLevel;
  summary: string;              // 2-3 sentence explanation

  // Dimension breakdown
  dimensions: DimensionScore[];

  // Key insights
  strengths: string[];          // What works well for this format (3-5 items)
  challenges: string[];         // What might be difficult (2-4 items)
  recommendations: string[];    // How to optimize for this format (2-3 items)

  // Format-specific insights
  format_specific?: MicrodramaSpecificInsights | AudioDramaSpecificInsights;
}

/**
 * Microdrama-specific analysis fields
 */
export interface MicrodramaSpecificInsights {
  cliffhanger_potential: number;        // 0-100
  trope_alignment: string[];            // Matching tropes
  episode_structure_fit: number;        // 0-100
  vertical_filming_compatibility: number; // 0-100
  target_platform_fit: string[];        // e.g., ["ReelShort", "DramaBox"]
}

/**
 * Audio drama-specific analysis fields
 */
export interface AudioDramaSpecificInsights {
  dialogue_richness: number;            // 0-100
  soundscape_potential: number;         // 0-100
  voice_character_distinctiveness: number; // 0-100
  atmosphere_conveyability: number;     // 0-100
}

// =====================================================================
// STORY DECONSTRUCTION (reused for analysis)
// =====================================================================

/**
 * Story deconstruction for format fit analysis
 * Similar to comps engine but focused on adaptation factors
 */
export interface StoryDeconstruction {
  // Core story elements
  save_the_cat_genre: string;
  tone_mood: string;
  character_archetypes: string;
  plot_structure: string;
  setting_world: string;
  themes: string;
  target_audience: string;
  format_style: string;

  // Adaptation-specific analysis
  narrative_complexity: 'simple' | 'moderate' | 'complex';
  character_count: 'few' | 'moderate' | 'ensemble';
  visual_intensity: 'low' | 'moderate' | 'high';
  pacing_type: 'fast' | 'moderate' | 'slow';
  setting_production_cost: 'low' | 'moderate' | 'high';
}

// =====================================================================
// REQUEST/RESPONSE TYPES
// =====================================================================

/**
 * Format Fit Engine request
 */
export interface FormatFitRequest {
  title_id: string;
  user_email: string;
  mode?: 'rich' | 'limited' | 'auto';
}

/**
 * Format Fit Engine response
 */
export interface FormatFitResponse {
  title_id: string;
  title_name: string;

  // Analysis mode and completeness
  mode_used: 'rich' | 'limited';
  data_completeness: number;    // 0-100

  // Overall scores for quick reference
  scores: {
    film: number;
    tv_series: number;
    animation: number;
    microdrama: number;
    audio_drama: number;
  };

  // Best format recommendation
  best_format: FormatType;
  best_format_score: number;

  // Detailed analysis per format
  film_analysis: FormatAnalysis;
  tv_series_analysis: FormatAnalysis;
  animation_analysis: FormatAnalysis;
  microdrama_analysis: FormatAnalysis;
  audio_drama_analysis: FormatAnalysis;

  // Shared story analysis
  story_deconstruction: StoryDeconstruction;

  // Metadata
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
}

// =====================================================================
// MICRODRAMA SCORING CRITERIA
// =====================================================================

/**
 * Microdrama-specific scoring criteria based on research
 * Target audience: Women 30-60, affluent, urban, mobile-first
 */
export const MICRODRAMA_POSITIVE_GENRES = [
  'romance', 'drama', 'thriller', 'fantasy', 'supernatural'
];

export const MICRODRAMA_WINNING_TROPES = [
  'secret_billionaire',
  'ceo_romance',
  'revenge',
  'mistaken_identity',
  'rags_to_riches',
  'betrayal',
  'contract_marriage',
  'fake_dating',
  'enemies_to_lovers',
  'second_chance_romance',
  'forbidden_love',
  'secret_identity',
  'arranged_marriage',
  'love_triangle',
];

export const MICRODRAMA_POSITIVE_SETTINGS = [
  'modern', 'contemporary', 'urban', 'corporate', 'office'
];

export const MICRODRAMA_NEGATIVE_INDICATORS = {
  complexity: ['complex_worldbuilding', 'multiple_povs', 'non_linear_narrative', 'philosophical'],
  high_production: ['historical', 'period', 'fantasy_world', 'space', 'war', 'large_scale_action'],
  pacing: ['slow_burn', 'detailed_exposition', 'character_study'],
  cast: ['large_ensemble', 'many_subplots'],
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get fit level from score
 */
export function getFitLevel(score: number): FitLevel {
  if (score >= FIT_LEVEL_THRESHOLDS.excellent) return 'excellent';
  if (score >= FIT_LEVEL_THRESHOLDS.good) return 'good';
  if (score >= FIT_LEVEL_THRESHOLDS.moderate) return 'moderate';
  return 'poor';
}

/**
 * Calculate weighted score from dimension scores
 */
export function calculateWeightedScore(
  dimensions: DimensionScore[],
  format: FormatType
): number {
  const weights = FORMAT_DIMENSION_WEIGHTS[format];
  let totalScore = 0;

  for (const dim of dimensions) {
    const weight = weights[dim.dimension] || 0;
    totalScore += dim.score * weight;
  }

  return Math.round(totalScore);
}

/**
 * Estimate API cost for format fit analysis
 * Based on GPT-4o token usage
 */
export function estimateFormatFitCost(): number {
  // Approximate: 2000 input tokens + 3000 output tokens
  // GPT-4o pricing: $5/1M input, $15/1M output
  const inputCost = (2000 / 1000000) * 5;
  const outputCost = (3000 / 1000000) * 15;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // ~$0.055
}
