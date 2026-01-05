/**
 * Comps Generator Service (Creator App)
 *
 * Thin wrapper around @kstorybridge/tools that binds the creator's Supabase client.
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

// Re-export types for convenience
export type {
  CompsGeneratorResponse,
  SuggestedComp,
  DimensionScore,
} from '@kstorybridge/tools';

// Re-export utility functions (no supabase needed)
export {
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName,
  getDimensionWeight,
};

// =====================================================================
// BOUND SERVICE FUNCTIONS (creator's supabase client)
// =====================================================================

/**
 * Generate comps for a title
 */
export async function generateComps(
  titleId: string,
  userEmail: string,
  mode: 'rich' | 'limited' | 'auto' = 'auto'
) {
  return _generateComps(supabase, titleId, userEmail, mode);
}

/**
 * Save comp titles only
 */
export async function saveCompsToTitle(titleId: string, compTitles: string[]) {
  return _saveCompsToTitle(supabase, titleId, compTitles);
}

/**
 * Save comps with full analysis
 */
export async function saveCompsWithAnalysis(
  titleId: string,
  compTitles: string[],
  suggestedComps: import('@kstorybridge/tools').SuggestedComp[]
) {
  return _saveCompsWithAnalysis(supabase, titleId, compTitles, suggestedComps);
}

/**
 * Append comps to existing
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
 * Get comps with analysis data
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
// EXPORT SERVICE OBJECT (for convenience)
// =====================================================================

export const compsGeneratorService = {
  // Analysis
  generateComps,
  saveCompsToTitle,
  saveCompsWithAnalysis,
  appendCompsToTitle,
  getCurrentComps,
  getCompsWithAnalysis,
  clearComps,
  // Utilities
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName,
  getDimensionWeight,
};

export default compsGeneratorService;
