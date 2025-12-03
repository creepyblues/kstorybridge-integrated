/**
 * Intelligence Service for Dashboard
 *
 * Calls the shared title-intelligence edge function to collect
 * platform data and allows immediate ingestion into titles table.
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type SupportedPlatform =
  | 'naver_webtoon'
  | 'naver_series'
  | 'kakao'
  | 'kakao_webtoon'
  | 'manta'
  | 'ridibooks'
  | 'unknown';

export interface ParsedUrl {
  platform: SupportedPlatform;
  platformId: string | null;
  originalUrl: string;
  valid: boolean;
  error?: string;
}

export interface CollectIntelligenceByUrlsRequest {
  urls: ParsedUrl[];
  contentType?: string;
}

export interface CollectIntelligenceByUrlsResponse {
  success: boolean;
  intelligenceTitleId: string;
  status: string;
  sourcesCollected: string[];
  errors: Record<string, string>;
}

export interface IntelligenceTitle {
  id: string;
  original_title_ko: string | null;
  original_title_en: string | null;
  slug: string;
  type: 'webtoon' | 'webnovel' | 'light_novel' | 'manga' | 'mixed';
  original_language: string | null;
  primary_genres: string[];
  demographic: string | null;
  has_webnovel: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceSource {
  id: string;
  intelligence_title_id: string;
  domain: string;
  category:
    | 'official_platform'
    | 'official_platform_en'
    | 'metadata_db'
    | 'fandom_forum'
    | 'unofficial_aggregator'
    | 'fanfiction'
    | 'news_media';
  url: string;
  region: string | null;
  language: string | null;
  raw_meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceMetrics {
  id: string;
  intelligence_title_id: string;
  source_id: string;
  snapshot_time: string;
  views: number | null;
  subscribers: number | null;
  rating_score: number | null;
  rating_votes: number | null;
  favorites: number | null;
  episode_count: number | null;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'upcoming' | null;
  age_rating: string | null;
  raw: Record<string, unknown>;
}

export interface IntelligenceAlias {
  id: string;
  intelligence_title_id: string;
  alias: string;
  language: string;
  kind: 'en_official' | 'en_fan' | 'romanization' | 'ko_variant' | 'other';
  created_at: string;
}

export interface IntelligenceTitleWithSources extends IntelligenceTitle {
  sources: IntelligenceSource[];
  metrics: IntelligenceMetrics[];
  aliases: IntelligenceAlias[];
}

// Extracted data ready for ingestion
export interface ExtractedIntelligenceData {
  views?: number;
  likes?: number;
  rating?: number;
  rating_count?: number;
  chapters?: number;
  description_kr?: string;
  genre?: string[];
  story_author?: string;
  title_image?: string;
  keywords?: string[];
  age_rating?: string;
  completed?: boolean;
}

// ============================================================================
// URL Parsing
// ============================================================================

const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp> = {
  // Naver Webtoon - supports /webtoon/, /challenge/, /bestChallenge/ sections
  naver_webtoon: /comic\.naver\.com\/(?:webtoon|challenge|bestChallenge)\/list\?titleId=(\d+)/,
  naver_series: /series\.naver\.com\/comic\/detail\.series\?productNo=(\d+)/,
  kakao: /page\.kakao\.com\/content\/(\d+)|page\.kakao\.com\/.*seriesId=(\d+)/,
  kakao_webtoon: /webtoon\.kakao\.com\/content\/[^/]+\/(\d+)/,
  manta: /manta\.net\/.*seriesId=(\d+)/,
  ridibooks: /ridibooks\.com\/books\/(\d+)/,
  unknown: /^$/,
};

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
      return {
        platform: platform as SupportedPlatform,
        platformId,
        originalUrl: trimmedUrl,
        valid: true,
      };
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
  const names: Record<SupportedPlatform, string> = {
    naver_webtoon: 'Naver Webtoon',
    naver_series: 'Naver Series',
    kakao: 'Kakao Page',
    kakao_webtoon: 'Kakao Webtoon',
    manta: 'Manta',
    ridibooks: 'Ridibooks',
    unknown: 'Unknown',
  };
  return names[platform];
}

// ============================================================================
// Collection Functions
// ============================================================================

/**
 * Trigger intelligence collection by platform URLs
 */
export async function collectIntelligenceByUrls(
  request: CollectIntelligenceByUrlsRequest,
  userEmail: string
): Promise<CollectIntelligenceByUrlsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        urls: request.urls.map((u) => ({
          platform: u.platform,
          platformId: u.platformId,
          originalUrl: u.originalUrl,
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
 */
export async function getIntelligenceTitleWithSources(
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

// ============================================================================
// Data Extraction
// ============================================================================

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
        extracted.description_kr = raw.synopsis_kr;
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
    if (!extracted.description_kr && data.synopsis_kr && typeof data.synopsis_kr === 'string') {
      extracted.description_kr = data.synopsis_kr;
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

// ============================================================================
// Ingestion Functions
// ============================================================================

/**
 * Directly ingest selected fields into a title
 * No approval workflow - immediate update
 */
export async function directIngestToTitle(
  titleId: string,
  fields: Partial<ExtractedIntelligenceData>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...fields,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('titles')
    .update(updateData)
    .eq('title_id', titleId);

  if (error) {
    throw new Error(`Failed to update title: ${error.message}`);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

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
    description_kr: 'Synopsis (Korean)',
    genre: 'Genre',
    story_author: 'Author',
    title_image: 'Thumbnail',
    keywords: 'Tags/Keywords',
    age_rating: 'Age Rating',
    completed: 'Completed Status',
  };
  return labels[field] || field;
}
