/**
 * Intelligence Service
 *
 * Collects platform data from Naver, Kakao, Manta, etc. and allows
 * immediate ingestion into the titles table.
 *
 * This is a shared service - apps must provide their own Supabase client.
 */

import type {
  SupabaseClientType,
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
  FanEngagementRequest,
  FanSignalData,
  RedditPost,
  RedditSubreddit,
  AO3Work,
  AO3Tag,
  IngestedField,
} from '../types';

// =====================================================================
// CONSTANTS
// =====================================================================

/**
 * All collectible fields with their labels and categories
 */
export const COLLECTIBLE_FIELDS: CollectibleField[] = [
  // Metrics
  { key: 'views', label: 'Views', category: 'metrics', dbField: 'views' },
  { key: 'likes', label: 'Likes/Subscribers', category: 'metrics', dbField: 'likes' },
  { key: 'rating', label: 'Rating', category: 'metrics', dbField: 'rating' },
  { key: 'rating_count', label: 'Rating Count', category: 'metrics', dbField: 'rating_count' },
  { key: 'chapters', label: 'Chapters', category: 'metrics', dbField: 'chapters' },
  // Content
  { key: 'synopsis_kr', label: 'Synopsis (Korean)', category: 'content', dbField: 'synopsis_kr' },
  { key: 'genre', label: 'Genre', category: 'content', dbField: 'genre' },
  { key: 'keywords', label: 'Tags/Keywords', category: 'content', dbField: 'keywords' },
  // Metadata
  { key: 'story_author', label: 'Author', category: 'metadata', dbField: 'story_author' },
  { key: 'title_image', label: 'Cover Image', category: 'metadata', dbField: 'title_image' },
  { key: 'age_rating', label: 'Age Rating', category: 'metadata', dbField: 'age_rating' },
  { key: 'completed', label: 'Completed Status', category: 'metadata', dbField: 'completed' },
];

/**
 * Platform URL patterns for parsing
 */
const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp> = {
  // Naver Webtoon - supports /webtoon/, /challenge/, /bestChallenge/ sections
  naver_webtoon: /comic\.naver\.com\/(?:webtoon|challenge|bestChallenge)\/list\?titleId=(\d+)/,
  naver_series: /series\.naver\.com\/(?:comic|novel)\/detail\.series\?productNo=(\d+)/,
  kakao: /page\.kakao\.com\/content\/(\d+)|page\.kakao\.com\/.*seriesId=(\d+)/,
  kakao_webtoon: /webtoon\.kakao\.com\/content\/[^/]+\/(\d+)/,
  manta: /manta\.net\/.*seriesId=(\d+)/,
  ridibooks: /ridibooks\.com\/books\/(\d+)/,
  // Bomtoon canonical detail path is /detail/{slug}; older /comic/ep_list/{slug}
  // URLs still resolve to the same SPA shell so we accept both.
  bomtoon: /bomtoon\.com\/(?:detail|comic\/ep_list)\/([A-Za-z0-9_-]+)/,
  unknown: /^$/,
};

/**
 * Platform display names
 */
export const PLATFORM_DISPLAY_NAMES: Record<SupportedPlatform, string> = {
  naver_webtoon: 'Naver Webtoon',
  naver_series: 'Naver Series',
  kakao: 'Kakao Page',
  kakao_webtoon: 'Kakao Webtoon',
  manta: 'Manta',
  ridibooks: 'Ridibooks',
  bomtoon: 'Bomtoon',
  unknown: 'Unknown',
};

// =====================================================================
// URL PARSING (no supabase needed)
// =====================================================================

/**
 * Parse a URL to detect platform and extract platform ID
 */
export function parseUrl(url: string): ParsedUrl {
  const trimmedUrl = url.trim();

  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === 'unknown') continue;

    const match = trimmedUrl.match(pattern);
    if (match) {
      // Find the first non-undefined capture group
      const platformId = match.slice(1).find((g) => g !== undefined) || null;
      const parsed: ParsedUrl = {
        platform: platform as SupportedPlatform,
        platformId,
        originalUrl: trimmedUrl,
        valid: true,
      };
      // Naver Series serves /comic/ and /novel/ off the same productNo
      // namespace but with different DOMs. Capture which path it is so the
      // scraper builds the right fetch URL.
      if (platform === 'naver_series') {
        const subKindMatch = trimmedUrl.match(/series\.naver\.com\/(comic|novel)\//);
        if (subKindMatch) {
          parsed.subKind = subKindMatch[1] as 'comic' | 'novel';
        }
      }
      return parsed;
    }
  }

  return {
    platform: 'unknown',
    platformId: null,
    originalUrl: trimmedUrl,
    valid: false,
    error: 'Unsupported platform. Supported: Naver Webtoon, Naver Series, Kakao Page, Kakao Webtoon, Manta, Ridibooks',
  };
}

/**
 * Get human-readable platform name
 */
export function getPlatformDisplayName(platform: SupportedPlatform): string {
  return PLATFORM_DISPLAY_NAMES[platform];
}

// =====================================================================
// COLLECTION FUNCTIONS (with dependency injection)
// =====================================================================

/**
 * Trigger intelligence collection by platform URLs
 *
 * @param supabase - Supabase client instance
 * @param request - URLs to collect from
 * @param userEmail - Email of the user requesting collection
 * @returns Collection response with intelligence title ID
 */
export async function collectIntelligenceByUrls(
  supabase: SupabaseClientType,
  request: CollectIntelligenceByUrlsRequest,
  userEmail: string
): Promise<CollectIntelligenceByUrlsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Get Supabase URL from the client
  // @ts-expect-error - accessing internal supabaseUrl property
  const supabaseUrl = supabase.supabaseUrl || supabase.rest?.url?.replace('/rest/v1', '');

  const response = await fetch(
    `${supabaseUrl}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        urls: request.urls.map((u) => ({
          platform: u.platform,
          platformId: u.platformId,
          originalUrl: u.originalUrl,
          ...(u.subKind ? { subKind: u.subKind } : {}),
        })),
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
 * Fetch intelligence title with all related data
 *
 * @param supabase - Supabase client instance
 * @param id - Intelligence title ID
 * @returns Intelligence title with sources, metrics, and aliases
 */
export async function getIntelligenceTitleWithSources(
  supabase: SupabaseClientType,
  id: string
): Promise<IntelligenceTitleWithSources> {
  // Fetch title
  const { data: title, error: titleError } = await supabase
    .from('intelligence_titles')
    .select('*')
    .eq('id', id)
    .single();

  if (titleError) {
    throw new Error(`Failed to fetch intelligence title: ${titleError.message}`);
  }

  // Fetch sources
  const { data: sources, error: sourcesError } = await supabase
    .from('intelligence_sources')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('created_at', { ascending: false });

  if (sourcesError) {
    throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
  }

  // Fetch metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('intelligence_metrics')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('snapshot_time', { ascending: false });

  if (metricsError) {
    throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
  }

  // Fetch aliases
  const { data: aliases, error: aliasesError } = await supabase
    .from('intelligence_aliases')
    .select('*')
    .eq('intelligence_title_id', id)
    .order('created_at', { ascending: false });

  if (aliasesError) {
    throw new Error(`Failed to fetch aliases: ${aliasesError.message}`);
  }

  return {
    ...(title as IntelligenceTitle),
    sources: (sources as IntelligenceSource[]) || [],
    metrics: (metrics as IntelligenceMetrics[]) || [],
    aliases: (aliases as IntelligenceAlias[]) || [],
  };
}

// =====================================================================
// DATA EXTRACTION (no supabase needed)
// =====================================================================

/**
 * Extract usable data from intelligence results for ingestion
 * Looks at both metrics and raw_meta from sources
 */
export function extractIntelligenceData(
  result: IntelligenceTitleWithSources
): ExtractedIntelligenceData {
  const extracted: ExtractedIntelligenceData = {};

  // Get the latest metrics (usually just one per source)
  const latestMetrics = result.metrics[0];

  if (latestMetrics) {
    if (latestMetrics.views != null) extracted.views = latestMetrics.views;
    if (latestMetrics.subscribers != null) extracted.likes = latestMetrics.subscribers;
    if (latestMetrics.rating_score != null) extracted.rating = latestMetrics.rating_score;
    if (latestMetrics.rating_votes != null) extracted.rating_count = latestMetrics.rating_votes;
    if (latestMetrics.episode_count != null) extracted.chapters = latestMetrics.episode_count;
    if (latestMetrics.age_rating != null) extracted.age_rating = latestMetrics.age_rating;
    if (latestMetrics.status != null) {
      extracted.completed = latestMetrics.status === 'completed';
    }

    // Check raw data for additional fields
    const raw = latestMetrics.raw as Record<string, unknown> | undefined;
    if (raw) {
      if (raw.synopsis_kr && typeof raw.synopsis_kr === 'string') {
        extracted.synopsis_kr = raw.synopsis_kr;
      }
      if (raw.genre && Array.isArray(raw.genre)) {
        extracted.genre = raw.genre as string[];
      }
      if (raw.author && typeof raw.author === 'string') {
        extracted.story_author = raw.author;
      }
      if (raw.thumbnail && typeof raw.thumbnail === 'string') {
        extracted.title_image = raw.thumbnail;
      }
      if (raw.tags && Array.isArray(raw.tags)) {
        extracted.keywords = raw.tags as string[];
      }
    }
  }

  // Also check source raw_meta for additional data
  for (const source of result.sources) {
    const rawMeta = source.raw_meta as Record<string, unknown> | undefined;
    if (!rawMeta?.data) continue;

    const data = rawMeta.data as Record<string, unknown>;

    // Fill in any missing fields from source raw_meta
    if (!extracted.synopsis_kr && data.synopsis_kr && typeof data.synopsis_kr === 'string') {
      extracted.synopsis_kr = data.synopsis_kr;
    }
    if (!extracted.genre && data.genre && Array.isArray(data.genre)) {
      extracted.genre = data.genre as string[];
    }
    if (!extracted.story_author && data.author && typeof data.author === 'string') {
      extracted.story_author = data.author;
    }
    if (!extracted.title_image && data.thumbnail && typeof data.thumbnail === 'string') {
      extracted.title_image = data.thumbnail;
    }
    if (!extracted.keywords && data.tags && Array.isArray(data.tags)) {
      extracted.keywords = data.tags as string[];
    }
    if (!extracted.views && data.views && typeof data.views === 'number') {
      extracted.views = data.views;
    }
    if (!extracted.rating && data.rating && typeof data.rating === 'number') {
      extracted.rating = data.rating;
    }
    if (!extracted.rating_count && data.rating_count && typeof data.rating_count === 'number') {
      extracted.rating_count = data.rating_count;
    }
    if (!extracted.chapters && data.chapters && typeof data.chapters === 'number') {
      extracted.chapters = data.chapters;
    }
    if (!extracted.likes && data.subscribers && typeof data.subscribers === 'number') {
      extracted.likes = data.subscribers;
    }
  }

  return extracted;
}

// =====================================================================
// INGESTION FUNCTIONS (with dependency injection)
// =====================================================================

/**
 * Directly ingest selected fields into a title
 * No approval workflow - immediate update
 *
 * @deprecated Use `ingestToTitleWithAudit()` instead for proper audit logging.
 * This function bypasses the intelligence_ingestion_log table and does not
 * track field changes for data governance. Only use this for legacy code
 * that cannot provide intelligenceTitleId and ingestedBy parameters.
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title to update
 * @param fields - Fields to ingest
 */
export async function directIngestToTitle(
  supabase: SupabaseClientType,
  titleId: string,
  fields: Partial<ExtractedIntelligenceData>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...fields,
    updated_at: new Date().toISOString(),
    // Provenance tracking - use 'system' as source since we don't have user context
    last_modified_source: 'system',
  };

  const { error } = await supabase
    .from('titles')
    .update(updateData)
    .eq('title_id', titleId);

  if (error) {
    throw new Error(`Failed to update title: ${error.message}`);
  }
}

/**
 * Ingest fields into a title WITH full audit logging
 *
 * This function captures old values, updates the title, and creates
 * an audit record in intelligence_ingestion_log for data governance.
 *
 * @param supabase - Supabase client instance
 * @param titleId - UUID of the title to update
 * @param fields - Fields to ingest from intelligence data
 * @param intelligenceTitleId - UUID of the source intelligence_title
 * @param ingestedBy - Email of user performing the ingestion
 * @param notes - Optional notes about the ingestion
 */
export async function ingestToTitleWithAudit(
  supabase: SupabaseClientType,
  titleId: string,
  fields: Partial<ExtractedIntelligenceData>,
  intelligenceTitleId: string,
  ingestedBy: string,
  notes?: string
): Promise<void> {
  // 1. Fetch current title for old values (needed for audit)
  const { data: currentTitle, error: fetchError } = await supabase
    .from('titles')
    .select('*')
    .eq('title_id', titleId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current title: ${fetchError.message}`);
  }

  // 2. Build audit record with old/new values
  const ingestedFields: Record<string, IngestedField> = {};
  for (const [key, newValue] of Object.entries(fields)) {
    // Only log fields that are actually changing
    const oldValue = currentTitle?.[key] ?? null;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      ingestedFields[key] = {
        old_value: oldValue,
        new_value: newValue,
        source: 'intelligence',
        source_id: intelligenceTitleId,
      };
    }
  }

  // Skip if no fields actually changed
  if (Object.keys(ingestedFields).length === 0) {
    return;
  }

  // 3. Update title with provenance tracking
  const updateData: Record<string, unknown> = {
    ...fields,
    updated_at: new Date().toISOString(),
    last_modified_by: ingestedBy,
    last_modified_source: 'intelligence',
  };

  const { error: updateError } = await supabase
    .from('titles')
    .update(updateData)
    .eq('title_id', titleId);

  if (updateError) {
    throw new Error(`Failed to update title: ${updateError.message}`);
  }

  // 4. Create audit log entry
  const { error: auditError } = await supabase
    .from('intelligence_ingestion_log')
    .insert({
      intelligence_title_id: intelligenceTitleId,
      target_title_id: titleId,
      ingested_fields: ingestedFields,
      ingested_by: ingestedBy,
      notes: notes || null,
    });

  if (auditError) {
    // Log but don't fail the operation - audit is secondary to data update
    console.error('Failed to create audit log:', auditError.message);
  }
}

// =====================================================================
// FAN ENGAGEMENT FUNCTIONS (with dependency injection)
// =====================================================================

/**
 * Collect fan engagement data from Reddit, AO3, and Comick
 * Uses the legacy title-name-based collection endpoint
 *
 * @param supabase - Supabase client instance
 * @param request - Title name and sources to collect
 * @param userEmail - Email of the user requesting collection
 * @returns Fan signal data with engagement metrics
 */
export async function collectFanEngagement(
  supabase: SupabaseClientType,
  request: FanEngagementRequest,
  userEmail: string
): Promise<FanSignalData> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Get Supabase URL from the client
  // @ts-expect-error - accessing internal supabaseUrl property
  const supabaseUrl = supabase.supabaseUrl || supabase.rest?.url?.replace('/rest/v1', '');

  const response = await fetch(
    `${supabaseUrl}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        titleNameInput: request.titleName,
        sources: request.sources,
        collectedBy: userEmail,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to collect fan engagement data');
  }

  const result = await response.json();

  // Build fan signal data
  const fanSignalData: FanSignalData = {
    titleName: request.titleName,
    collectedAt: new Date().toISOString(),
    intelligenceTitleId: result.intelligenceTitleId,
    errors: result.errors || {},
  };

  // If we have an intelligence title ID, fetch the detailed source data
  if (result.intelligenceTitleId) {
    try {
      const intelligenceData = await getIntelligenceTitleWithSources(supabase, result.intelligenceTitleId);

      // Extract fan engagement data from sources
      for (const source of intelligenceData.sources) {
        const rawMeta = source.raw_meta as { data?: Record<string, unknown> } | undefined;
        const data = rawMeta?.data;

        if (!data) continue;

        if (source.domain === 'reddit.com') {
          fanSignalData.reddit = {
            posts: (data.posts as number) || 0,
            total_upvotes: (data.total_upvotes as number) || 0,
            total_comments: (data.total_comments as number) || 0,
            avg_upvotes: (data.avg_upvotes as number) || null,
            avg_comments: (data.avg_comments as number) || null,
            engagement_score: (data.engagement_score as number) || null,
            top_posts: (data.top_posts as RedditPost[]) || [],
            subreddits: (data.subreddits as RedditSubreddit[]) || [],
            related_subreddit_subscribers: (data.related_subreddit_subscribers as number) || 0,
          };
        } else if (source.domain === 'archiveofourown.org') {
          fanSignalData.ao3 = {
            works: (data.works as number) || 0,
            total_kudos: (data.total_kudos as number) || 0,
            total_bookmarks: (data.total_bookmarks as number) || 0,
            total_comments: (data.total_comments as number) || 0,
            avg_kudos: (data.avg_kudos as number) || null,
            avg_bookmarks: (data.avg_bookmarks as number) || null,
            engagement_score: (data.engagement_score as number) || null,
            top_works: (data.top_works as AO3Work[]) || [],
            popular_relationships: (data.popular_relationships as AO3Tag[]) || [],
            popular_characters: (data.popular_characters as AO3Tag[]) || [],
            popular_freeform_tags: (data.popular_freeform_tags as AO3Tag[]) || [],
            fandoms: (data.fandoms as string[]) || [],
          };
        } else if (source.domain === 'comick.live') {
          fanSignalData.comick = {
            comic_id: (data.comic_id as number) || null,
            title: (data.title as string) || null,
            slug: (data.slug as string) || null,
            author: (data.author as string) || null,
            synopsis: (data.synopsis as string) || null,
            genres: (data.genres as string[]) || [],
            themes: (data.themes as string[]) || [],
            origin: (data.origin as string) || null,
            status: (data.status as string) || null,
            translation_status: (data.translation_status as string) || null,
            chapter_count: (data.chapter_count as number) || null,
            ranking: (data.ranking as number) || null,
            followers: (data.followers as number) || null,
            rating: (data.rating as number) || null,
            content_rating: (data.content_rating as string) || null,
            thumbnail: (data.thumbnail as string) || null,
            platform_url: (data.platform_url as string) || null,
            last_chapter_date: (data.last_chapter_date as string) || null,
            engagement_score: (data.engagement_score as number) || null,
          };
        }
      }
    } catch (fetchError) {
      console.error('[Intelligence] Error fetching intelligence details:', fetchError);
      // Still return partial data
    }
  }

  return fanSignalData;
}

// =====================================================================
// UTILITY FUNCTIONS (no supabase needed)
// =====================================================================

/**
 * Format large numbers for display (e.g., 1.2M, 45K)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Get display label for a field
 */
export function getFieldLabel(field: keyof ExtractedIntelligenceData): string {
  const labels: Record<keyof ExtractedIntelligenceData, string> = {
    views: 'Views',
    likes: 'Likes/Subscribers',
    rating: 'Rating',
    rating_count: 'Rating Count',
    chapters: 'Chapters',
    synopsis_kr: 'Synopsis (Korean)',
    genre: 'Genre',
    story_author: 'Author',
    title_image: 'Thumbnail',
    keywords: 'Tags/Keywords',
    age_rating: 'Age Rating',
    completed: 'Completed Status',
  };
  return labels[field] || field;
}

/**
 * Format a field value for display
 */
export function formatFieldValue(key: string, value: unknown): string {
  if (value == null) return '-';

  // Format numbers
  if (typeof value === 'number') {
    if (key === 'rating') {
      return value.toFixed(1);
    }
    return formatNumber(value);
  }

  // Format arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Truncate long strings
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }

  return String(value);
}

/**
 * Get fields grouped by category
 */
export function getFieldsByCategory() {
  const metrics = COLLECTIBLE_FIELDS.filter(f => f.category === 'metrics');
  const content = COLLECTIBLE_FIELDS.filter(f => f.category === 'content');
  const metadata = COLLECTIBLE_FIELDS.filter(f => f.category === 'metadata');
  return { metrics, content, metadata };
}

// =====================================================================
// FACTORY FUNCTION (creates service bound to specific client)
// =====================================================================

/**
 * Create an intelligence service instance bound to a Supabase client
 */
export function createIntelligenceService(supabase: SupabaseClientType) {
  return {
    // Collection
    collectIntelligenceByUrls: (request: CollectIntelligenceByUrlsRequest, userEmail: string) =>
      collectIntelligenceByUrls(supabase, request, userEmail),
    getIntelligenceTitleWithSources: (id: string) =>
      getIntelligenceTitleWithSources(supabase, id),
    collectFanEngagement: (request: FanEngagementRequest, userEmail: string) =>
      collectFanEngagement(supabase, request, userEmail),
    // Ingestion
    directIngestToTitle: (titleId: string, fields: Partial<ExtractedIntelligenceData>) =>
      directIngestToTitle(supabase, titleId, fields),
    ingestToTitleWithAudit: (
      titleId: string,
      fields: Partial<ExtractedIntelligenceData>,
      intelligenceTitleId: string,
      ingestedBy: string,
      notes?: string
    ) => ingestToTitleWithAudit(supabase, titleId, fields, intelligenceTitleId, ingestedBy, notes),
    // Utilities (no supabase needed)
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
}
