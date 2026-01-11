/**
 * Shared Services for KStoryBridge AI Tools
 */

// Comps Generator Service
export {
  generateComps,
  saveCompsToTitle,
  saveCompsWithAnalysis,
  appendCompsToTitle,
  getCurrentComps,
  getCompsWithAnalysis,
  clearComps,
  getMatchScoreColor,
  getMatchScoreLabel,
  formatDimensionName as formatCompsDimensionName,
  getDimensionWeight,
  createCompsGeneratorService,
} from './compsGeneratorService';

// Format Fit Service
export {
  analyzeFormatFit,
  getFormatFit,
  getFormatFitScores,
  getFormatFitSummariesForFormat,
  getTitlesForFormat,
  saveFormatFitAnalysis,
  deleteFormatFit,
  getFitLevel,
  getFitLevelColor,
  getFitLevelBgColor,
  getFitLevelLabel,
  formatDimensionName as formatFormatFitDimensionName,
  getBestFormat,
  createFormatFitService,
  // Constants
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
  FIT_LEVEL_THRESHOLDS,
  FIT_LEVEL_COLORS,
  FIT_LEVEL_BG_COLORS,
} from './formatFitService';

// Intelligence Service
export {
  // Collection
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  collectFanEngagement,
  // Ingestion
  directIngestToTitle,
  ingestToTitleWithAudit,
  // Utilities
  parseUrl,
  getPlatformDisplayName,
  extractIntelligenceData,
  formatNumber,
  getFieldLabel,
  formatFieldValue,
  getFieldsByCategory,
  // Factory
  createIntelligenceService,
  // Constants
  COLLECTIBLE_FIELDS,
  PLATFORM_DISPLAY_NAMES,
} from './intelligenceService';

// Re-export FormatFitSummary from types for convenience
export type { FormatFitSummary } from '../types';
