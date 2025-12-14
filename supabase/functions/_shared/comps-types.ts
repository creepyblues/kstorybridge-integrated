/**
 * Unified Comps Matching Engine - Shared Types
 * Version: 2.0.0
 *
 * This file defines the canonical types and constants used by both:
 * - comps-generator (admin): Korean title -> Hollywood comps
 * - comp-navigator (buyer): Hollywood comps -> Korean titles
 */

// =====================================================================
// ENGINE VERSION
// =====================================================================

export const COMPS_ENGINE_VERSION = "2.0.0";

// =====================================================================
// DIMENSION DEFINITIONS
// =====================================================================

/**
 * 8 Canonical Dimensions for Comps Matching
 * Weights must sum to 1.0
 */
export const DIMENSION_WEIGHTS = {
  genre_blueprint: 0.20,      // Save the Cat genre classification
  tone_mood: 0.15,            // Emotional register and atmosphere
  character_archetypes: 0.15, // Hero types, antagonist patterns, relationships
  plot_structure: 0.15,       // Narrative arc and pacing
  setting_world: 0.10,        // Time, place, worldbuilding
  themes: 0.10,               // Core messages and social commentary
  target_audience: 0.10,      // Demographics and appeal factors
  format_style: 0.05,         // Narrative structure and format
} as const;

export type DimensionKey = keyof typeof DIMENSION_WEIGHTS;

export const DIMENSION_KEYS: DimensionKey[] = [
  'genre_blueprint',
  'tone_mood',
  'character_archetypes',
  'plot_structure',
  'setting_world',
  'themes',
  'target_audience',
  'format_style',
];

export const DIMENSION_DISPLAY_NAMES: Record<DimensionKey, string> = {
  genre_blueprint: 'Genre Blueprint',
  tone_mood: 'Tone & Mood',
  character_archetypes: 'Characters',
  plot_structure: 'Plot Structure',
  setting_world: 'Setting & World',
  themes: 'Themes',
  target_audience: 'Target Audience',
  format_style: 'Format Style',
};

/**
 * Save the Cat genre options for genre_blueprint dimension
 */
export const SAVE_THE_CAT_GENRES = [
  'Monster in the House',
  'Golden Fleece',
  'Out of the Bottle',
  'Dude with a Problem',
  'Rites of Passage',
  'Buddy Love',
  'Whydunit',
  'Fool Triumphant',
  'Institutionalized',
  'Superhero',
] as const;

export type SaveTheCatGenre = typeof SAVE_THE_CAT_GENRES[number];

// =====================================================================
// SCORING INTERFACES
// =====================================================================

/**
 * Score for a single dimension
 */
export interface DimensionScore {
  dimension: DimensionKey;
  score: number;              // 0-100
  reason: string;             // 1-2 sentence explanation
  aligned_comps: string[];    // Which input comps this dimension aligned with
}

/**
 * Score level thresholds for UI display
 */
export type ScoreLevel = 'excellent' | 'strong' | 'moderate' | 'weak';

export const SCORE_THRESHOLDS = {
  excellent: 85,  // >= 85
  strong: 70,     // >= 70
  moderate: 55,   // >= 55
  weak: 0,        // < 55
} as const;

// =====================================================================
// MATCH RESULT INTERFACES
// =====================================================================

/**
 * Unified match result structure for both Generator and Navigator
 */
export interface MatchResult {
  // Core identification
  target_id: string;
  target_name: string;
  target_type: 'korean_title' | 'hollywood_comp';

  // Unified scoring
  overall_match_score: number;    // 0-100, weighted average
  dimension_scores: DimensionScore[];

  // Explanations
  explanation: string;            // 2-3 sentence summary
  match_reasons: string[];        // 4-5 bullet points

  // Metadata (varies by direction)
  metadata: MatchMetadata;

  // Engine tracking
  engine_version: string;
  mode_used: EngineMode;
}

export interface MatchMetadata {
  // For Hollywood comps (Generator output)
  comp_year?: number;
  comp_type?: string;           // "TV Series" | "Film" | "Anime"
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;

  // For Korean titles (Navigator output)
  title_image?: string;
  synopsis?: string;
  genre?: string[];
  tone?: string;
  content_format?: string;
  has_pitch_deck?: boolean;
  priority?: string;
  verified?: boolean;
}

// =====================================================================
// ENGINE CONFIGURATION
// =====================================================================

export type EngineMode = 'fast' | 'deep';

export interface CompsEngineConfig {
  mode: EngineMode;
  model: 'gpt-4o' | 'gpt-4o-mini';
  temperature: number;
  max_results: number;
}

export const FAST_MODE_CONFIG: CompsEngineConfig = {
  mode: 'fast',
  model: 'gpt-4o-mini',
  temperature: 0.3,
  max_results: 5,
};

export const DEEP_MODE_CONFIG: CompsEngineConfig = {
  mode: 'deep',
  model: 'gpt-4o',
  temperature: 0.4,
  max_results: 8,
};

// =====================================================================
// STORY DECONSTRUCTION (Generator only)
// =====================================================================

/**
 * 8-dimensional story deconstruction used by Generator
 */
export interface StoryDeconstruction {
  save_the_cat_genre: SaveTheCatGenre | string;
  tone_mood: string;
  character_archetypes: string;
  plot_structure: string;
  setting_world: string;
  themes: string;
  target_audience: string;
  format_style: string;
}

// =====================================================================
// REQUEST/RESPONSE TYPES
// =====================================================================

/**
 * Navigator request structure
 */
export interface CompNavigatorRequest {
  comp_titles: string[];        // 1-3 comp titles
  refinement_text?: string;     // Optional text refinement (max 500 chars)
  user_email: string;
  save_search?: boolean;        // Whether to save to history
  search_name?: string;         // For bookmarking
}

/**
 * Navigator response structure (v2.0.0)
 */
export interface CompNavigatorResponse {
  results: TitleMatchV2[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
  mode_used: EngineMode;
  // v2.1.0 - Relevancy filtering
  filtered_count?: number;          // How many results were filtered out
  no_results_message?: string;      // Message when no relevant results found
  suggestions?: string[];           // Suggestions when no results
}

/**
 * Title match result for Navigator (v2.0.0)
 */
export interface TitleMatchV2 {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;

  // Unified scoring (NEW in v2.0.0)
  overall_match_score: number;
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];

  // Metadata
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  content_format?: string;
  has_pitch_deck?: boolean;

  // Backward compatibility
  match_score?: number;         // DEPRECATED - use overall_match_score
}

/**
 * Generator request structure
 */
export interface CompsGeneratorRequest {
  title_id: string;
  mode?: 'rich' | 'limited' | 'auto';
  user_email: string;
}

/**
 * Generator response structure (v2.0.0)
 */
export interface CompsGeneratorResponse {
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;
  suggested_comps: SuggestedCompV2[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
}

/**
 * Suggested comp for Generator (v2.0.0)
 */
export interface SuggestedCompV2 {
  comp_title: string;
  comp_year?: number;
  comp_type: string;            // "TV Series" | "Film" | "Anime"

  // Unified scoring
  overall_match_score: number;
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];

  // IMDB enrichment
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;
}

// =====================================================================
// LEGACY COMPATIBILITY TYPES
// =====================================================================

/**
 * Legacy TitleMatch (v1.x) - for backward compatibility
 * @deprecated Use TitleMatchV2 instead
 */
export interface TitleMatchLegacy {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  match_score: number;          // Single score (0-100)
  explanation: string;          // Single sentence
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  has_pitch_deck?: boolean;
}

/**
 * Legacy SuggestedComp (v1.x) - for backward compatibility
 * @deprecated Use SuggestedCompV2 instead
 */
export interface SuggestedCompLegacy {
  comp_title: string;
  comp_year?: number;
  comp_type: string;
  overall_match_score: number;
  dimension_scores: {
    dimension: string;
    score: number;
    reason: string;
  }[];
  explanation: string;
  match_reasons: string[];
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;
}
