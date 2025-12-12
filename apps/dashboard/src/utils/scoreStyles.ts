/**
 * Score Badge Styling Utilities
 *
 * Shared utilities for consistent score badge styling across components.
 * Used by: TitleMatchCard, HomeResultCard, MatchDetailModal, CompsGeneratorModal
 */

// Score thresholds - single source of truth
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 55,
} as const;

export interface ScoreBadgeStyles {
  gradient: string;
  text: string;
  border: string;
  bgColor?: string;
}

/**
 * Get gradient badge styles based on match score
 * Used for overlay badges on cards
 */
export function getScoreBadgeStyles(score: number): ScoreBadgeStyles {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      gradient: 'bg-gradient-to-r from-emerald-100 to-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      bgColor: 'bg-emerald-100',
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      gradient: 'bg-gradient-to-r from-blue-100 to-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      bgColor: 'bg-blue-100',
    };
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return {
      gradient: 'bg-gradient-to-r from-amber-100 to-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      bgColor: 'bg-amber-100',
    };
  }
  return {
    gradient: 'bg-gradient-to-r from-purple-100 to-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    bgColor: 'bg-purple-100',
  };
}

/**
 * Get dimension score badge color (compact version for lists)
 */
export function getDimensionBadgeColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-emerald-100 text-emerald-700';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-blue-100 text-blue-700';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

/**
 * Get solid background color for score (used in CompsGeneratorModal)
 */
export function getScoreBackgroundColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-500';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-blue-500';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'bg-yellow-500';
  return 'bg-gray-400';
}

/**
 * Get text color for score display
 */
export function getScoreTextColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-blue-600';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'text-yellow-600';
  return 'text-gray-500';
}

/**
 * Get score label text
 */
export function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'Good';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'Fair';
  return 'Low';
}
