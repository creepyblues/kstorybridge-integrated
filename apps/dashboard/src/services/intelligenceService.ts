/**
 * Intelligence Service (Dashboard)
 *
 * Thin wrapper around @kstorybridge/tools that binds the dashboard's Supabase client.
 * This maintains backward compatibility with existing component imports.
 */

import { supabase } from '@/lib/supabase';
import {
  // Service functions (with dependency injection)
  collectIntelligenceByUrls as _collectIntelligenceByUrls,
  getIntelligenceTitleWithSources as _getIntelligenceTitleWithSources,
  directIngestToTitle as _directIngestToTitle,
  ingestToTitleWithAudit as _ingestToTitleWithAudit,
  collectFanEngagement as _collectFanEngagement,
  // Utility functions (no supabase needed)
  parseUrl,
  getPlatformDisplayName,
  extractIntelligenceData,
  formatNumber,
  getFieldLabel,
  formatFieldValue,
  getFieldsByCategory,
  // Constants
  COLLECTIBLE_FIELDS,
  PLATFORM_DISPLAY_NAMES,
} from '@kstorybridge/tools';

// Re-export types for backward compatibility
export type {
  SupportedPlatform,
  ParsedUrl,
  CollectIntelligenceByUrlsRequest,
  CollectIntelligenceByUrlsResponse,
  IntelligenceTitle,
  IntelligenceSource,
  IntelligenceMetrics,
  IntelligenceAlias,
  IntelligenceTitleWithSources,
  ExtractedIntelligenceData,
  CollectibleField,
  FieldCategory,
  FanEngagementSource,
  FanEngagementRequest,
  RedditPost,
  RedditSubreddit,
  RedditData,
  AO3Work,
  AO3Tag,
  AO3Data,
  ComickData,
  FanSignalData,
} from '@kstorybridge/tools';

// Re-export utility functions (no supabase needed)
export {
  parseUrl,
  getPlatformDisplayName,
  extractIntelligenceData,
  formatNumber,
  getFieldLabel,
  formatFieldValue,
  getFieldsByCategory,
  COLLECTIBLE_FIELDS,
  PLATFORM_DISPLAY_NAMES,
};

// =====================================================================
// BOUND SERVICE FUNCTIONS (dashboard's supabase client)
// =====================================================================

/**
 * Trigger intelligence collection by platform URLs
 */
export async function collectIntelligenceByUrls(
  request: import('@kstorybridge/tools').CollectIntelligenceByUrlsRequest,
  userEmail: string
) {
  return _collectIntelligenceByUrls(supabase, request, userEmail);
}

/**
 * Fetch intelligence title with all related data
 */
export async function getIntelligenceTitleWithSources(id: string) {
  return _getIntelligenceTitleWithSources(supabase, id);
}

/**
 * Directly ingest selected fields into a title
 * @deprecated Use ingestToTitleWithAudit for proper audit logging
 */
export async function directIngestToTitle(
  titleId: string,
  fields: Partial<import('@kstorybridge/tools').ExtractedIntelligenceData>
) {
  return _directIngestToTitle(supabase, titleId, fields);
}

/**
 * Ingest fields into a title WITH full audit logging
 * Captures old values, updates title, and logs to intelligence_ingestion_log
 */
export async function ingestToTitleWithAudit(
  titleId: string,
  fields: Partial<import('@kstorybridge/tools').ExtractedIntelligenceData>,
  intelligenceTitleId: string,
  ingestedBy: string,
  notes?: string
) {
  return _ingestToTitleWithAudit(supabase, titleId, fields, intelligenceTitleId, ingestedBy, notes);
}

/**
 * Collect fan engagement data from Reddit, AO3, and Comick
 */
export async function collectFanEngagement(
  request: import('@kstorybridge/tools').FanEngagementRequest,
  userEmail: string
) {
  return _collectFanEngagement(supabase, request, userEmail);
}

// =====================================================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// =====================================================================

export const intelligenceService = {
  // Collection
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  collectFanEngagement,
  // Ingestion
  directIngestToTitle, // deprecated - use ingestToTitleWithAudit
  ingestToTitleWithAudit,
  // Utilities
  parseUrl,
  getPlatformDisplayName,
  extractIntelligenceData,
  formatNumber,
  getFieldLabel,
  formatFieldValue,
  getFieldsByCategory,
  // Constants
  COLLECTIBLE_FIELDS,
  PLATFORM_DISPLAY_NAMES,
};

export default intelligenceService;
