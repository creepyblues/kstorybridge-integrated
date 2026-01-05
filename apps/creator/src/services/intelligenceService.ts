/**
 * Intelligence Service (Creator App)
 *
 * Thin wrapper around @kstorybridge/tools that binds the creator's Supabase client.
 * Also includes creator-specific functionality for ingestion requests and audit logs.
 *
 * Schema: Uses normalized intelligence_* tables
 * - intelligence_titles: Discovered title records
 * - intelligence_sources: Platform URLs + raw data
 * - intelligence_metrics: Time-series snapshots
 * - intelligence_ingestion_requests: Admin ingestion requests
 * - intelligence_ingestion_log: Permanent audit trail
 */

import { supabase } from '@/lib/supabase';
import {
  // Service functions (with dependency injection)
  collectIntelligenceByUrls as _collectIntelligenceByUrls,
  getIntelligenceTitleWithSources as _getIntelligenceTitleWithSources,
  directIngestToTitle as _directIngestToTitle,
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

// ============================================================================
// BOUND SERVICE FUNCTIONS (creator's supabase client)
// ============================================================================

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
 */
export async function directIngestToTitle(
  titleId: string,
  fields: Partial<import('@kstorybridge/tools').ExtractedIntelligenceData>
) {
  return _directIngestToTitle(supabase, titleId, fields);
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

// ============================================================================
// CREATOR-SPECIFIC TYPES (not in shared package)
// ============================================================================

export interface FieldSelection {
  source_id: string;
  value: unknown;
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'latest';
}

export interface IngestionRequest {
  id: string;
  intelligence_title_id: string;
  target_title_id: string;
  field_selections: Record<string, FieldSelection>;
  requested_by: string;
  requested_at: string;
  request_notes: string | null;
  status: 'pending' | 'completed' | 'failed';
  executed_at: string | null;
  executed_by: string | null;
  execution_result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface IngestedField {
  old_value: unknown;
  new_value: unknown;
  source: string;
  source_id: string;
}

export interface IngestionLog {
  id: string;
  ingestion_request_id: string | null;
  intelligence_title_id: string;
  target_title_id: string;
  ingested_fields: Record<string, IngestedField>;
  ingested_by: string;
  ingested_at: string;
  notes: string | null;
}

// Legacy request type (for backward compatibility)
export interface CollectIntelligenceRequest {
  titleNameInput: string;
  titleNameEn?: string;
  sources: string[];
  contentType?: string;
}

export interface CollectIntelligenceResponse {
  success: boolean;
  intelligenceTitleId: string;
  status: string;
  sourcesCollected: string[];
  errors: Record<string, string>;
}

// ============================================================================
// CREATOR-SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Trigger intelligence collection for a title (legacy - by name)
 * @deprecated Use collectIntelligenceByUrls() instead
 */
export async function collectIntelligence(
  request: CollectIntelligenceRequest,
  userEmail: string
): Promise<CollectIntelligenceResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        titleNameInput: request.titleNameInput,
        titleNameEn: request.titleNameEn,
        sources: request.sources,
        collectedBy: userEmail,
        contentType: request.contentType,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to collect intelligence');
  }

  return await response.json();
}

/**
 * Fetch all intelligence titles (admin only)
 */
export async function getIntelligenceTitles(): Promise<import('@kstorybridge/tools').IntelligenceTitle[]> {
  const { data, error } = await supabase
    .from('intelligence_titles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch intelligence titles: ${error.message}`);
  }

  return data as import('@kstorybridge/tools').IntelligenceTitle[];
}

/**
 * Delete intelligence title (admin only)
 */
export async function deleteIntelligenceTitle(id: string): Promise<void> {
  const { error } = await supabase
    .from('intelligence_titles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete intelligence title: ${error.message}`);
  }
}

// ============================================================================
// INGESTION FUNCTIONS (Creator-specific)
// ============================================================================

/**
 * Create ingestion request (prepare for admin review)
 */
export async function createIngestionRequest(
  intelligenceTitleId: string,
  targetTitleId: string,
  fieldSelections: Record<string, FieldSelection>,
  requestedBy: string,
  notes?: string
): Promise<IngestionRequest> {
  const { data, error } = await supabase
    .from('intelligence_ingestion_requests')
    .insert({
      intelligence_title_id: intelligenceTitleId,
      target_title_id: targetTitleId,
      field_selections: fieldSelections,
      requested_by: requestedBy,
      request_notes: notes || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ingestion request: ${error.message}`);
  }

  return data as IngestionRequest;
}

/**
 * Get pending ingestion requests
 */
export async function getPendingIngestionRequests(): Promise<IngestionRequest[]> {
  const { data, error } = await supabase
    .from('intelligence_ingestion_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch ingestion requests: ${error.message}`);
  }

  return data as IngestionRequest[];
}

/**
 * Map intelligence field names to titles table columns
 */
function mapIntelligenceFieldToTitle(fieldName: string): string | null {
  const mapping: Record<string, string> = {
    views: 'views',
    subscribers: 'likes', // Map subscribers to likes field
    likes: 'likes',
    rating: 'rating',
    rating_score: 'rating',
    rating_count: 'rating_count', // Number of ratings
    chapters: 'chapters',
    episode_count: 'chapters',
    completed: 'completed',
    status: 'completed', // Will need conversion: 'completed' -> true
    synopsis: 'synopsis',
    synopsis_kr: 'synopsis_kr', // Korean synopsis maps to synopsis_kr
    genre: 'genre',
    author: 'story_author',
    story_author: 'story_author',
    age_rating: 'age_rating',
    thumbnail: 'title_image', // Thumbnail maps to title_image
    title_image: 'title_image',
    tags: 'keywords', // Map tags to keywords array
    keywords: 'keywords',
  };

  return mapping[fieldName] || null;
}

/**
 * Execute ingestion - Update target title with selected fields
 */
export async function executeIngestion(
  requestId: string,
  executedBy: string
): Promise<void> {
  // Fetch the request
  const { data: request, error: fetchError } = await supabase
    .from('intelligence_ingestion_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error(`Failed to fetch ingestion request: ${fetchError?.message}`);
  }

  // Fetch current title values for audit log
  const { data: currentTitle, error: titleError } = await supabase
    .from('titles')
    .select('*')
    .eq('title_id', request.target_title_id)
    .single();

  if (titleError || !currentTitle) {
    throw new Error(`Target title not found: ${titleError?.message}`);
  }

  // Prepare update data and audit log
  const updateData: Record<string, unknown> = {};
  const ingestedFields: Record<string, IngestedField> = {};

  for (const [fieldName, selection] of Object.entries(
    request.field_selections as Record<string, FieldSelection>
  )) {
    // Map intelligence field to titles table field
    const titleField = mapIntelligenceFieldToTitle(fieldName);
    if (titleField) {
      updateData[titleField] = selection.value;
      ingestedFields[fieldName] = {
        old_value: currentTitle[titleField],
        new_value: selection.value,
        source: fieldName.split('.')[0] || 'unknown',
        source_id: selection.source_id,
      };
    }
  }

  // Update titles table
  const { error: updateError } = await supabase
    .from('titles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('title_id', request.target_title_id);

  if (updateError) {
    // Mark request as failed
    await supabase
      .from('intelligence_ingestion_requests')
      .update({
        status: 'failed',
        executed_at: new Date().toISOString(),
        executed_by: executedBy,
        execution_result: { error: updateError.message },
      })
      .eq('id', requestId);

    throw new Error(`Failed to update title: ${updateError.message}`);
  }

  // Create audit log entry
  const { error: logError } = await supabase
    .from('intelligence_ingestion_log')
    .insert({
      ingestion_request_id: requestId,
      intelligence_title_id: request.intelligence_title_id,
      target_title_id: request.target_title_id,
      ingested_fields: ingestedFields,
      ingested_by: executedBy,
      notes: request.request_notes,
    });

  if (logError) {
    console.error('Failed to create audit log:', logError);
    // Non-fatal: ingestion succeeded
  }

  // Mark request as completed
  await supabase
    .from('intelligence_ingestion_requests')
    .update({
      status: 'completed',
      executed_at: new Date().toISOString(),
      executed_by: executedBy,
      execution_result: { success: true, fields_updated: Object.keys(updateData) },
    })
    .eq('id', requestId);
}

/**
 * Get ingestion history for a title
 */
export async function getIngestionHistory(targetTitleId: string): Promise<IngestionLog[]> {
  const { data, error } = await supabase
    .from('intelligence_ingestion_log')
    .select('*')
    .eq('target_title_id', targetTitleId)
    .order('ingested_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch ingestion history: ${error.message}`);
  }

  return data as IngestionLog[];
}

/**
 * Search existing titles for matching (for ingestion target selection)
 */
export async function searchTitlesForIngestion(
  query: string
): Promise<
  Array<{
    title_id: string;
    title_name_kr: string;
    title_name_en: string | null;
    creator_id: string | null;
  }>
> {
  const { data, error } = await supabase
    .from('titles')
    .select('title_id, title_name_kr, title_name_en, creator_id')
    .or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%`)
    .limit(20);

  if (error) {
    throw new Error(`Failed to search titles: ${error.message}`);
  }

  return data;
}

// ============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getIntelligenceTitles() instead
 */
export async function getIntelligenceRecords(): Promise<import('@kstorybridge/tools').IntelligenceTitle[]> {
  console.warn('getIntelligenceRecords() is deprecated. Use getIntelligenceTitles() instead.');
  return getIntelligenceTitles();
}

/**
 * @deprecated Use getIntelligenceTitleWithSources() instead
 */
export async function getIntelligenceRecord(id: string): Promise<import('@kstorybridge/tools').IntelligenceTitleWithSources> {
  console.warn(
    'getIntelligenceRecord() is deprecated. Use getIntelligenceTitleWithSources() instead.'
  );
  return getIntelligenceTitleWithSources(id);
}

// =====================================================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// =====================================================================

export const intelligenceService = {
  // Core Collection (from shared package)
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  directIngestToTitle,
  collectFanEngagement,
  // Creator-specific Collection
  collectIntelligence,
  getIntelligenceTitles,
  deleteIntelligenceTitle,
  // Ingestion Management
  createIngestionRequest,
  getPendingIngestionRequests,
  executeIngestion,
  getIngestionHistory,
  searchTitlesForIngestion,
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
