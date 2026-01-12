/**
 * Shared Types for KStoryBridge AI Tools
 *
 * Types for Comps Generator, Format Fit Analyzer, and Intelligence Service
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Export Intelligence types
export * from './intelligence';

// =====================================================================
// SUPABASE CLIENT TYPE
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClientType = SupabaseClient<any, any, any>;

// =====================================================================
// COMPS GENERATOR TYPES
// =====================================================================

export interface DimensionScore {
  dimension: string;
  score: number;
  reason: string;
}

export interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;  // "TV Series" | "Film" | "Anime"
  overall_match_score: number;  // 0-100
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];
  // IMDB enrichment (from OMDB API)
  imdb_id?: string;   // e.g., "tt6994104"
  imdb_url?: string;  // e.g., "https://www.imdb.com/title/tt6994104"
  poster_url?: string; // e.g., "https://m.media-amazon.com/images/M/..."
  // Source tracking for manual vs AI-generated comps
  source?: 'ai' | 'manual';  // Optional for backward compatibility
}

// =====================================================================
// OMDB API TYPES
// =====================================================================

export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

export interface OMDBSearchResponse {
  Search?: OMDBSearchResult[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export interface CompsGeneratorResponse {
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;  // 0-100
  suggested_comps: SuggestedComp[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
}

export interface CompsGeneratorError {
  error: string;
}

// =====================================================================
// FORMAT FIT ANALYZER TYPES
// =====================================================================

export type FormatType = 'film' | 'tv_series' | 'animation' | 'microdrama' | 'audio_drama';
export type FitLevel = 'excellent' | 'good' | 'moderate' | 'poor';
export type FormatFitDimension =
  | 'narrative_structure'
  | 'character_suitability'
  | 'visual_requirements'
  | 'pacing_fit'
  | 'production_feasibility'
  | 'audience_alignment'
  | 'genre_fit';

export interface FormatDimensionScore {
  dimension: FormatFitDimension;
  score: number;
  reason: string;
  weight: number;
}

export interface MicrodramaSpecificInsights {
  cliffhanger_potential: number;
  trope_alignment: string[];
  episode_structure_fit: number;
  vertical_filming_compatibility: number;
  target_platform_fit: string[];
}

export interface FormatAnalysis {
  format: FormatType;
  overall_score: number;
  fit_level: FitLevel;
  summary: string;
  dimensions: FormatDimensionScore[];
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  format_specific?: MicrodramaSpecificInsights;
}

export interface FormatFitScores {
  film: number;
  tv_series: number;
  animation: number;
  microdrama: number;
  audio_drama: number;
}

export interface StoryDeconstruction {
  save_the_cat_genre: string;
  tone_mood: string;
  character_archetypes: string;
  plot_structure: string;
  setting_world: string;
  themes: string;
  target_audience: string;
  format_style: string;
  narrative_complexity: 'simple' | 'moderate' | 'complex';
  character_count: 'few' | 'moderate' | 'ensemble';
  visual_intensity: 'low' | 'moderate' | 'high';
  pacing_type: 'fast' | 'moderate' | 'slow';
  setting_production_cost: 'low' | 'moderate' | 'high';
}

export interface FormatFitResponse {
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;
  scores: FormatFitScores;
  best_format: FormatType;
  best_format_score: number;
  film_analysis: FormatAnalysis;
  tv_series_analysis: FormatAnalysis;
  animation_analysis: FormatAnalysis;
  microdrama_analysis: FormatAnalysis;
  audio_drama_analysis: FormatAnalysis;
  story_deconstruction: StoryDeconstruction;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
}

export interface FormatFitRecord {
  id: string;
  title_id: string;
  film_score: number;
  tv_series_score: number;
  animation_score: number;
  microdrama_score: number;
  audio_drama_score: number;
  film_analysis: FormatAnalysis;
  tv_series_analysis: FormatAnalysis;
  animation_analysis: FormatAnalysis;
  microdrama_analysis: FormatAnalysis;
  audio_drama_analysis: FormatAnalysis;
  story_deconstruction: StoryDeconstruction;
  data_completeness: number;
  mode_used: string;
  analysis_version: string;
  processing_time_ms: number;
  cost_estimate: number;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// HOOK STATE TYPES
// =====================================================================

export interface UseCompsGeneratorState {
  loading: boolean;
  error: string | null;
  response: CompsGeneratorResponse | null;
  selectedComps: Set<string>;
}

export interface UseFormatFitAnalyzerState {
  loading: boolean;
  error: string | null;
  response: FormatFitResponse | null;
  existingRecord: FormatFitRecord | null;
}

// =====================================================================
// SUMMARY TYPES FOR LIST VIEWS
// =====================================================================

export interface FormatFitSummary {
  title_id: string;
  score: number;
  fit_level: string;
  summary: string;
}
