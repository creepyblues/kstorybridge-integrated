/**
 * Intelligence Service
 *
 * Purpose: Frontend service for Title Intelligence System
 *
 * Features:
 * - Trigger intelligence collection
 * - Fetch intelligence records (normalized schema)
 * - Manage ingestion requests
 * - View audit logs
 *
 * Schema: Uses normalized intelligence_* tables
 * - intelligence_titles: Discovered title records
 * - intelligence_sources: Platform URLs + raw data
 * - intelligence_metrics: Time-series snapshots
 * - intelligence_ingestion_requests: Admin ingestion requests
 * - intelligence_ingestion_log: Permanent audit trail
 */

import { supabase } from '@/lib/supabase'

// ============================================================================
// Types: Intelligence Schema
// ============================================================================

export interface IntelligenceTitle {
  id: string
  original_title_ko: string | null
  original_title_en: string | null
  slug: string
  type: 'webtoon' | 'webnovel' | 'light_novel' | 'manga' | 'mixed'
  original_language: string | null
  primary_genres: string[]
  demographic: string | null
  has_webnovel: boolean
  created_at: string
  updated_at: string
}

export interface IntelligenceSource {
  id: string
  intelligence_title_id: string
  domain: string
  category: 'official_platform' | 'official_platform_en' | 'metadata_db' | 'fandom_forum' | 'unofficial_aggregator' | 'fanfiction' | 'news_media'
  url: string
  region: string | null
  language: string | null
  raw_meta: Record<string, any>
  created_at: string
  updated_at: string
}

export interface IntelligenceMetrics {
  id: string
  intelligence_title_id: string
  source_id: string
  snapshot_time: string
  views: number | null
  subscribers: number | null
  rating_score: number | null
  rating_votes: number | null
  favorites: number | null
  episode_count: number | null
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'upcoming' | null
  age_rating: string | null
  raw: Record<string, any>
}

export interface IntelligenceAlias {
  id: string
  intelligence_title_id: string
  alias: string
  language: string
  kind: 'en_official' | 'en_fan' | 'romanization' | 'ko_variant' | 'other'
  created_at: string
}

// Full intelligence title with related data
export interface IntelligenceTitleWithSources extends IntelligenceTitle {
  sources: IntelligenceSource[]
  metrics: IntelligenceMetrics[]
  aliases: IntelligenceAlias[]
}

// ============================================================================
// Types: Ingestion Schema
// ============================================================================

export interface FieldSelection {
  source_id: string
  value: any
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'latest'
}

export interface IngestionRequest {
  id: string
  intelligence_title_id: string
  target_title_id: string
  field_selections: Record<string, FieldSelection>
  requested_by: string
  requested_at: string
  request_notes: string | null
  status: 'pending' | 'completed' | 'failed'
  executed_at: string | null
  executed_by: string | null
  execution_result: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface IngestedField {
  old_value: any
  new_value: any
  source: string
  source_id: string
}

export interface IngestionLog {
  id: string
  ingestion_request_id: string | null
  intelligence_title_id: string
  target_title_id: string
  ingested_fields: Record<string, IngestedField>
  ingested_by: string
  ingested_at: string
  notes: string | null
}

// ============================================================================
// Types: Request/Response
// ============================================================================

export interface CollectIntelligenceRequest {
  titleNameInput: string
  titleNameEn?: string
  sources: string[]
  contentType?: string
}

export interface CollectIntelligenceResponse {
  success: boolean
  intelligenceTitleId: string
  status: string
  sourcesCollected: string[]
  errors: Record<string, string>
}

// ============================================================================
// Types: URL-based Collection
// ============================================================================

export type SupportedPlatform = 'naver_webtoon' | 'naver_series' | 'kakao' | 'kakao_webtoon' | 'manta' | 'unknown';

export interface ParsedUrl {
  platform: SupportedPlatform
  platformId: string | null
  originalUrl: string
  valid: boolean
  error?: string
}

export interface CollectIntelligenceByUrlsRequest {
  urls: ParsedUrl[]
  contentType?: string
  // Optional: Fan engagement sources (searched by title name)
  fanEngagement?: {
    titleName: string
    sources: string[]  // ['reddit', 'ao3']
  }
}

export interface CollectIntelligenceByUrlsResponse {
  success: boolean
  intelligenceTitleId: string
  status: string
  sourcesCollected: string[]
  errors: Record<string, string>
}

// ============================================================================
// Collection Functions
// ============================================================================

/**
 * Trigger intelligence collection for a title (legacy - by name)
 */
export async function collectIntelligence(
  request: CollectIntelligenceRequest,
  userEmail: string
): Promise<CollectIntelligenceResponse> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        titleNameInput: request.titleNameInput,
        titleNameEn: request.titleNameEn,
        sources: request.sources,
        collectedBy: userEmail,
        contentType: request.contentType
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to collect intelligence')
  }

  return await response.json()
}

/**
 * Trigger intelligence collection by platform URLs
 * New URL-based approach for more reliable data fetching
 */
export async function collectIntelligenceByUrls(
  request: CollectIntelligenceByUrlsRequest,
  userEmail: string
): Promise<CollectIntelligenceByUrlsResponse> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        urls: request.urls.map(u => ({
          platform: u.platform,
          platformId: u.platformId,
          originalUrl: u.originalUrl,
        })),
        collectedBy: userEmail,
        contentType: request.contentType,
        // Include fan engagement sources if provided
        fanEngagement: request.fanEngagement
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to collect intelligence')
  }

  return await response.json()
}

// ============================================================================
// Intelligence Titles Functions
// ============================================================================

/**
 * Fetch all intelligence titles (admin only)
 */
export async function getIntelligenceTitles(): Promise<IntelligenceTitle[]> {
  const { data, error } = await supabase
    .from('intelligence_titles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch intelligence titles: ${error.message}`)
  }

  return data as IntelligenceTitle[]
}

/**
 * Fetch single intelligence title with all related data
 */
export async function getIntelligenceTitleWithSources(id: string): Promise<IntelligenceTitleWithSources> {
  // Fetch title
  const { data: title, error: titleError } = await supabase
    .from('intelligence_titles')
    .select('*')
    .eq('id', id)
    .single()

  if (titleError) {
    throw new Error(`Failed to fetch intelligence title: ${titleError.message}`)
  }

  // Fetch sources
  const { data: sources, error: sourcesError } = await supabase
    .from('intelligence_sources')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('created_at', { ascending: false })

  if (sourcesError) {
    throw new Error(`Failed to fetch sources: ${sourcesError.message}`)
  }

  // Fetch latest metrics for each source
  const { data: metrics, error: metricsError } = await supabase
    .from('intelligence_metrics')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('snapshot_time', { ascending: false })

  if (metricsError) {
    throw new Error(`Failed to fetch metrics: ${metricsError.message}`)
  }

  // Fetch aliases
  const { data: aliases, error: aliasesError } = await supabase
    .from('intelligence_aliases')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('created_at', { ascending: false })

  if (aliasesError) {
    throw new Error(`Failed to fetch aliases: ${aliasesError.message}`)
  }

  return {
    ...(title as IntelligenceTitle),
    sources: sources as IntelligenceSource[],
    metrics: metrics as IntelligenceMetrics[],
    aliases: aliases as IntelligenceAlias[]
  }
}

/**
 * Delete intelligence title (admin only)
 */
export async function deleteIntelligenceTitle(id: string): Promise<void> {
  const { error } = await supabase
    .from('intelligence_titles')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete intelligence title: ${error.message}`)
  }
}

// ============================================================================
// Ingestion Functions
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
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create ingestion request: ${error.message}`)
  }

  return data as IngestionRequest
}

/**
 * Get pending ingestion requests
 */
export async function getPendingIngestionRequests(): Promise<IngestionRequest[]> {
  const { data, error } = await supabase
    .from('intelligence_ingestion_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch ingestion requests: ${error.message}`)
  }

  return data as IngestionRequest[]
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
    .single()

  if (fetchError || !request) {
    throw new Error(`Failed to fetch ingestion request: ${fetchError?.message}`)
  }

  // Fetch current title values for audit log
  const { data: currentTitle, error: titleError } = await supabase
    .from('titles')
    .select('*')
    .eq('title_id', request.target_title_id)
    .single()

  if (titleError || !currentTitle) {
    throw new Error(`Target title not found: ${titleError?.message}`)
  }

  // Prepare update data and audit log
  const updateData: Record<string, any> = {}
  const ingestedFields: Record<string, IngestedField> = {}

  for (const [fieldName, selection] of Object.entries(request.field_selections as Record<string, FieldSelection>)) {
    // Map intelligence field to titles table field
    const titleField = mapIntelligenceFieldToTitle(fieldName)
    if (titleField) {
      updateData[titleField] = selection.value
      ingestedFields[fieldName] = {
        old_value: currentTitle[titleField],
        new_value: selection.value,
        source: fieldName.split('.')[0] || 'unknown',
        source_id: selection.source_id
      }
    }
  }

  // Update titles table
  const { error: updateError } = await supabase
    .from('titles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('title_id', request.target_title_id)

  if (updateError) {
    // Mark request as failed
    await supabase
      .from('intelligence_ingestion_requests')
      .update({
        status: 'failed',
        executed_at: new Date().toISOString(),
        executed_by: executedBy,
        execution_result: { error: updateError.message }
      })
      .eq('id', requestId)

    throw new Error(`Failed to update title: ${updateError.message}`)
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
      notes: request.request_notes
    })

  if (logError) {
    console.error('Failed to create audit log:', logError)
    // Non-fatal: ingestion succeeded
  }

  // Mark request as completed
  await supabase
    .from('intelligence_ingestion_requests')
    .update({
      status: 'completed',
      executed_at: new Date().toISOString(),
      executed_by: executedBy,
      execution_result: { success: true, fields_updated: Object.keys(updateData) }
    })
    .eq('id', requestId)
}

/**
 * Get ingestion history for a title
 */
export async function getIngestionHistory(targetTitleId: string): Promise<IngestionLog[]> {
  const { data, error } = await supabase
    .from('intelligence_ingestion_log')
    .select('*')
    .eq('target_title_id', targetTitleId)
    .order('ingested_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch ingestion history: ${error.message}`)
  }

  return data as IngestionLog[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map intelligence field names to titles table columns
 */
function mapIntelligenceFieldToTitle(fieldName: string): string | null {
  const mapping: Record<string, string> = {
    'views': 'views',
    'subscribers': 'likes',  // Map subscribers to likes field
    'likes': 'likes',
    'rating': 'rating',
    'rating_score': 'rating',
    'rating_count': 'rating_count',  // Number of ratings
    'chapters': 'chapters',
    'episode_count': 'chapters',
    'completed': 'completed',
    'status': 'completed',  // Will need conversion: 'completed' -> true
    'synopsis': 'synopsis',
    'synopsis_kr': 'description_kr',  // Korean synopsis maps to description_kr
    'genre': 'genre',
    'author': 'story_author',
    'age_rating': 'age_rating',
    'thumbnail': 'title_image',  // Thumbnail maps to title_image
    'comment_count': 'comment_count',  // Comment count (if field exists in titles)
    'tags': 'keywords',  // Map tags to keywords array
    'keywords': 'keywords',
  }

  return mapping[fieldName] || null
}

/**
 * Search existing titles for matching (for ingestion target selection)
 */
export async function searchTitlesForIngestion(query: string): Promise<Array<{
  title_id: string
  title_name_kr: string
  title_name_en: string | null
  creator_id: string | null
}>> {
  const { data, error } = await supabase
    .from('titles')
    .select('title_id, title_name_kr, title_name_en, creator_id')
    .or(`title_name_kr.ilike.%${query}%,title_name_en.ilike.%${query}%`)
    .limit(20)

  if (error) {
    throw new Error(`Failed to search titles: ${error.message}`)
  }

  return data
}

// ============================================================================
// Legacy Functions (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getIntelligenceTitles() instead
 */
export async function getIntelligenceRecords(): Promise<any[]> {
  console.warn('getIntelligenceRecords() is deprecated. Use getIntelligenceTitles() instead.')
  return getIntelligenceTitles()
}

/**
 * @deprecated Use getIntelligenceTitleWithSources() instead
 */
export async function getIntelligenceRecord(id: string): Promise<any> {
  console.warn('getIntelligenceRecord() is deprecated. Use getIntelligenceTitleWithSources() instead.')
  return getIntelligenceTitleWithSources(id)
}
