/**
 * Unified Comps Matching Engine - Shared Utilities
 * Version: 2.0.0
 */

import {
  COMPS_ENGINE_VERSION,
  DIMENSION_WEIGHTS,
  DIMENSION_DISPLAY_NAMES,
  SCORE_THRESHOLDS,
  type DimensionKey,
  type DimensionScore,
  type ScoreLevel,
  type EngineMode,
} from './comps-types.ts';

// =====================================================================
// SCORE CALCULATION
// =====================================================================

/**
 * Calculate weighted overall score from dimension scores
 */
export function calculateWeightedScore(dimensions: DimensionScore[]): number {
  let total = 0;
  let weightSum = 0;

  for (const dim of dimensions) {
    const weight = DIMENSION_WEIGHTS[dim.dimension as DimensionKey];
    if (weight !== undefined) {
      total += dim.score * weight;
      weightSum += weight;
    }
  }

  // Normalize to handle missing dimensions
  if (weightSum === 0) return 0;
  return Math.round(total / weightSum);
}

/**
 * Get score level for UI display
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.strong) return 'strong';
  if (score >= SCORE_THRESHOLDS.moderate) return 'moderate';
  return 'weak';
}

/**
 * Get color class for score level
 */
export function getScoreColor(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'excellent':
      return 'bg-green-500';
    case 'strong':
      return 'bg-blue-500';
    case 'moderate':
      return 'bg-yellow-500';
    case 'weak':
      return 'bg-gray-400';
  }
}

/**
 * Get score level label
 */
export function getScoreLevelLabel(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'excellent':
      return 'Excellent Match';
    case 'strong':
      return 'Strong Match';
    case 'moderate':
      return 'Moderate Match';
    case 'weak':
      return 'Weak Match';
  }
}

// =====================================================================
// DIMENSION FORMATTING
// =====================================================================

/**
 * Format dimension key for display
 */
export function formatDimensionName(key: string): string {
  return DIMENSION_DISPLAY_NAMES[key as DimensionKey] || key;
}

/**
 * Get dimension weight as percentage string
 */
export function getDimensionWeightPercent(key: string): string {
  const weight = DIMENSION_WEIGHTS[key as DimensionKey];
  if (weight === undefined) return '0%';
  return `${Math.round(weight * 100)}%`;
}

/**
 * Sort dimensions by weight (highest first)
 */
export function sortDimensionsByWeight(dimensions: DimensionScore[]): DimensionScore[] {
  return [...dimensions].sort((a, b) => {
    const weightA = DIMENSION_WEIGHTS[a.dimension as DimensionKey] || 0;
    const weightB = DIMENSION_WEIGHTS[b.dimension as DimensionKey] || 0;
    return weightB - weightA;
  });
}

// =====================================================================
// ENGINE METADATA
// =====================================================================

/**
 * Build engine metadata for response
 */
export function buildEngineMetadata(mode: EngineMode): {
  engine_version: string;
  mode_used: EngineMode;
  timestamp: string;
} {
  return {
    engine_version: COMPS_ENGINE_VERSION,
    mode_used: mode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get current engine version
 */
export function getEngineVersion(): string {
  return COMPS_ENGINE_VERSION;
}

// =====================================================================
// VALIDATION
// =====================================================================

/**
 * Validate dimension scores array
 */
export function validateDimensionScores(dimensions: DimensionScore[]): boolean {
  if (!Array.isArray(dimensions)) return false;
  if (dimensions.length !== 8) return false;

  for (const dim of dimensions) {
    if (typeof dim.dimension !== 'string') return false;
    if (typeof dim.score !== 'number') return false;
    if (dim.score < 0 || dim.score > 100) return false;
    if (typeof dim.reason !== 'string') return false;
    if (!Array.isArray(dim.aligned_comps)) return false;
  }

  return true;
}

/**
 * Ensure dimension scores have all 8 dimensions
 */
export function ensureAllDimensions(dimensions: DimensionScore[]): DimensionScore[] {
  const dimMap = new Map(dimensions.map(d => [d.dimension, d]));
  const allDimensions: DimensionKey[] = [
    'genre_blueprint',
    'tone_mood',
    'character_archetypes',
    'plot_structure',
    'setting_world',
    'themes',
    'target_audience',
    'format_style',
  ];

  return allDimensions.map(key => dimMap.get(key) || {
    dimension: key,
    score: 0,
    reason: 'Not analyzed',
    aligned_comps: [],
  });
}

// =====================================================================
// LOGGING
// =====================================================================

/**
 * Log engine operation with consistent format
 */
export function logCompsEngine(
  operation: string,
  data: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const prefix = `[COMPS-ENGINE v${COMPS_ENGINE_VERSION}]`;
  const message = `${prefix} ${operation}`;

  switch (level) {
    case 'warn':
      console.warn(message, data);
      break;
    case 'error':
      console.error(message, data);
      break;
    default:
      console.log(message, data);
  }
}

// =====================================================================
// COST ESTIMATION
// =====================================================================

/**
 * Estimate cost for Navigator search (fast mode)
 */
export function estimateNavigatorCost(compCount: number, hasRefinement: boolean): number {
  const embeddingCost = compCount * 0.0001 + (hasRefinement ? 0.0001 : 0);
  const llmCost = 0.014; // GPT-4o-mini for 8-dimensional scoring
  return embeddingCost + llmCost;
}

/**
 * Estimate cost for Generator (deep mode)
 */
export function estimateGeneratorCost(): number {
  const storyDeconstructionCost = 0.02; // GPT-4o
  const compGenerationCost = 0.06;      // GPT-4o
  return storyDeconstructionCost + compGenerationCost;
}
