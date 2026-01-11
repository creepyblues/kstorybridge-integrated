/**
 * Intelligence Service Types
 *
 * Types for the Title Intelligence collection and ingestion system.
 * Used for collecting platform data from Naver, Kakao, Manta, etc.
 */

// =====================================================================
// PLATFORM TYPES
// =====================================================================

export type SupportedPlatform =
  | 'naver_webtoon'
  | 'naver_series'
  | 'kakao'
  | 'kakao_webtoon'
  | 'manta'
  | 'ridibooks'
  | 'bomtoon'
  | 'unknown';

export interface ParsedUrl {
  platform: SupportedPlatform;
  platformId: string | null;
  originalUrl: string;
  valid: boolean;
  error?: string;
}

// =====================================================================
// REQUEST/RESPONSE TYPES
// =====================================================================

export interface CollectIntelligenceByUrlsRequest {
  urls: ParsedUrl[];
  contentType?: string;
  // Optional: Fan engagement sources (searched by title name)
  fanEngagement?: {
    titleName: string;
    sources: string[]; // ['reddit', 'ao3']
  };
}

export interface CollectIntelligenceByUrlsResponse {
  success: boolean;
  intelligenceTitleId: string;
  status: string;
  sourcesCollected: string[];
  errors: Record<string, string>;
}

// =====================================================================
// DATABASE ENTITY TYPES
// =====================================================================

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_meta: Record<string, any>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>;
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

// =====================================================================
// EXTRACTED DATA TYPES (for ingestion)
// =====================================================================

export interface ExtractedIntelligenceData {
  views?: number;
  likes?: number;
  rating?: number;
  rating_count?: number;
  chapters?: number;
  synopsis_kr?: string;
  genre?: string[];
  story_author?: string;
  title_image?: string;
  keywords?: string[];
  age_rating?: string;
  completed?: boolean;
}

// =====================================================================
// COLLECTIBLE FIELDS CONFIGURATION
// =====================================================================

export type FieldCategory = 'metrics' | 'content' | 'metadata';

export interface CollectibleField {
  key: keyof ExtractedIntelligenceData;
  label: string;
  category: FieldCategory;
  dbField: string;
}

// =====================================================================
// FAN ENGAGEMENT TYPES
// =====================================================================

export type FanEngagementSource = 'reddit' | 'ao3' | 'comick';

export interface FanEngagementRequest {
  titleName: string;
  sources: FanEngagementSource[];
}

export interface RedditPost {
  title: string;
  score: number;
  comments: number;
  subreddit: string;
  url: string;
  created_at?: string;
}

export interface RedditSubreddit {
  name: string;
  post_count: number;
  subscribers: number;
}

export interface RedditData {
  posts: number;
  total_upvotes: number;
  total_comments: number;
  avg_upvotes: number | null;
  avg_comments: number | null;
  engagement_score: number | null;
  top_posts: RedditPost[];
  subreddits: RedditSubreddit[];
  related_subreddit_subscribers: number;
}

export interface AO3Work {
  id: string;
  title: string;
  kudos: number;
  bookmarks: number;
  comments: number;
  url: string;
  authors: string[];
}

export interface AO3Tag {
  tag: string;
  count: number;
}

export interface AO3Data {
  works: number;
  total_kudos: number;
  total_bookmarks: number;
  total_comments: number;
  avg_kudos: number | null;
  avg_bookmarks: number | null;
  engagement_score: number | null;
  top_works: AO3Work[];
  popular_relationships: AO3Tag[];
  popular_characters: AO3Tag[];
  popular_freeform_tags: AO3Tag[];
  fandoms: string[];
}

export interface ComickData {
  comic_id: number | null;
  title: string | null;
  slug: string | null;
  author: string | null;
  synopsis: string | null;
  genres: string[];
  themes: string[];
  origin: string | null;
  status: string | null;
  translation_status: string | null;
  chapter_count: number | null;
  ranking: number | null;
  followers: number | null;
  rating: number | null;
  content_rating: string | null;
  thumbnail: string | null;
  platform_url: string | null;
  last_chapter_date: string | null;
  engagement_score: number | null;
}

export interface FanSignalData {
  titleName: string;
  collectedAt: string;
  intelligenceTitleId?: string;
  reddit?: RedditData;
  ao3?: AO3Data;
  comick?: ComickData;
  errors: Record<string, string>;
}

// =====================================================================
// AUDIT/INGESTION LOG TYPES
// =====================================================================

/**
 * Represents a single field change during ingestion
 * Used for audit logging in intelligence_ingestion_log table
 */
export interface IngestedField {
  old_value: unknown;
  new_value: unknown;
  source: string;  // 'intelligence' | 'admin' | 'creator' | 'ai'
  source_id: string;  // intelligence_title_id, admin email, etc.
}

/**
 * Options for audited ingestion
 */
export interface IngestToTitleOptions {
  intelligenceTitleId: string;
  ingestedBy: string;  // email of user performing ingestion
  notes?: string;
}
