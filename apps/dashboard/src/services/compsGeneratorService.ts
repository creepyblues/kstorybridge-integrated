/**
 * Comps Generator Service (Dashboard)
 *
 * Thin wrapper around @kstorybridge/tools that binds the dashboard's Supabase client.
 * This maintains backward compatibility with existing component imports.
 */

import { supabase } from '@/lib/supabase';
import {
  // Service functions (with dependency injection)
  generateComps as _generateComps,
  saveCompsToTitle as _saveCompsToTitle,
  saveCompsWithAnalysis as _saveCompsWithAnalysis,
  appendCompsToTitle as _appendCompsToTitle,
  getCurrentComps as _getCurrentComps,
  getCompsWithAnalysis as _getCompsWithAnalysis,
  clearComps as _clearComps,
  // Utility functions (no supabase needed)
  getMatchScoreColor,
  getMatchScoreLabel,
  formatCompsDimensionName as formatDimensionName,
  getDimensionWeight,
} from '@kstorybridge/tools';

// Re-export types for backward compatibility
export type {
  DimensionScore,
  SuggestedComp,
  CompsGeneratorResponse,
} from '@kstorybridge/tools';

// Re-export utility functions (no supabase needed)
export {
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName,
  getDimensionWeight,
};

// =====================================================================
// BOUND SERVICE FUNCTIONS (dashboard's supabase client)
// =====================================================================

/**
 * Generate comps for a title using AI analysis
 */
export async function generateComps(
  titleId: string,
  userEmail: string,
  mode: 'rich' | 'limited' | 'auto' = 'auto'
) {
  return _generateComps(supabase, titleId, userEmail, mode);
}

/**
 * Save selected comps to a title's comps array
 */
export async function saveCompsToTitle(titleId: string, comps: string[]) {
  return _saveCompsToTitle(supabase, titleId, comps);
}

/**
 * Save selected comps AND their full analysis to a title
 */
export async function saveCompsWithAnalysis(
  titleId: string,
  selectedCompTitles: string[],
  allComps: import('@kstorybridge/tools').SuggestedComp[]
) {
  return _saveCompsWithAnalysis(supabase, titleId, selectedCompTitles, allComps);
}

/**
 * Append comps to existing comps array (deduplicates)
 */
export async function appendCompsToTitle(titleId: string, newComps: string[]) {
  return _appendCompsToTitle(supabase, titleId, newComps);
}

/**
 * Get current comps for a title
 */
export async function getCurrentComps(titleId: string) {
  return _getCurrentComps(supabase, titleId);
}

/**
 * Get comps with full analysis for a title
 */
export async function getCompsWithAnalysis(titleId: string) {
  return _getCompsWithAnalysis(supabase, titleId);
}

/**
 * Clear all comps from a title
 */
export async function clearComps(titleId: string) {
  return _clearComps(supabase, titleId);
}

// =====================================================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// =====================================================================

export const compsGeneratorService = {
  generateComps,
  saveCompsToTitle,
  saveCompsWithAnalysis,
  appendCompsToTitle,
  getCurrentComps,
  getCompsWithAnalysis,
  clearComps,
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName,
  getDimensionWeight,
};

export default compsGeneratorService;
