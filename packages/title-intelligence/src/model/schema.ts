/**
 * Title Intelligence Data Model
 *
 * Defines TypeScript interfaces for the intelligence system schema.
 * These map to the database tables defined in the migration.
 */

/**
 * Intelligence Title - Discovered/scraped title (separate from creator-submitted titles)
 */
export interface IntelligenceTitle {
  id: string
  original_title_ko: string | null
  original_title_en: string | null
  slug: string  // URL-friendly identifier (e.g., "sajangnim-eun-two-time")
  type: 'webtoon' | 'webnovel' | 'light_novel' | 'manga' | 'mixed' | null
  original_language: string | null  // ISO 639-1 code (ko, en, ja, zh)
  primary_genres: string[] | null  // JSONB array
  demographic: string | null  // shounen, shoujo, seinen, josei, general
  has_webnovel: boolean
  created_at: string
  updated_at: string
}

/**
 * Alternative titles and aliases
 */
export interface IntelligenceAlias {
  id: string
  intelligence_title_id: string
  alias: string
  language: string  // ko, en, ja, zh, romanization
  kind: 'en_official' | 'en_fan' | 'romanization' | 'ko_variant' | 'other'
  created_at: string
}

/**
 * Source URL for a title (one row per discovered source)
 */
export interface IntelligenceSource {
  id: string
  intelligence_title_id: string
  domain: string  // page.kakao.com, series.naver.com, webtoons.com, etc.
  category: SourceCategory
  url: string
  region: string | null  // KR, Global, US, etc.
  language: string | null  // ko, en, ja, etc.
  raw_meta: Record<string, any>  // Full scrape result JSONB
  created_at: string
  updated_at: string
}

/**
 * Source categories
 */
export type SourceCategory =
  | 'official_platform'        // Kakao, Naver, Lezhin, etc. (Korean)
  | 'official_platform_en'     // WEBTOON EN, Tapas, etc.
  | 'metadata_db'              // WebtoonGuide, Toons.kr, etc.
  | 'fandom_forum'             // Reddit, Discord, etc.
  | 'unofficial_aggregator'    // Bato.to, MangaPark (metadata only, NO piracy)
  | 'fanfiction'               // AO3, FFN
  | 'news_media'               // K-media, press releases

/**
 * Time-series metrics snapshot
 */
export interface IntelligenceMetric {
  id: string
  intelligence_title_id: string
  source_id: string
  snapshot_time: string  // timestamptz
  views: number | null
  subscribers: number | null
  rating_score: number | null  // 0-10 scale
  rating_votes: number | null
  favorites: number | null
  episode_count: number | null
  status: SeriesStatus | null
  age_rating: string | null
  raw: Record<string, any>  // Extra metrics per site
}

/**
 * Series status
 */
export type SeriesStatus =
  | 'ongoing'
  | 'completed'
  | 'hiatus'
  | 'cancelled'
  | 'upcoming'

/**
 * Bridge table: Links creator-submitted titles ↔ intelligence titles
 */
export interface TitleIntelligenceMapping {
  id: string
  title_id: string  // FK to titles.title_id (creator-submitted)
  intelligence_title_id: string  // FK to intelligence_titles.id
  mapped_by: string  // Admin email
  mapped_at: string
  mapping_confidence: 'manual' | 'auto_high' | 'auto_low'
}

/**
 * Payload for creating/updating an intelligence title
 */
export interface UpsertIntelligenceTitlePayload {
  title: {
    original_title_ko?: string
    original_title_en?: string
    slug: string
    type?: 'webtoon' | 'webnovel' | 'light_novel' | 'manga' | 'mixed'
    original_language?: string
    primary_genres?: string[]
    demographic?: string
    has_webnovel?: boolean
  }
  aliases?: Array<{
    alias: string
    language: string
    kind: 'en_official' | 'en_fan' | 'romanization' | 'ko_variant' | 'other'
  }>
  sources: Array<{
    domain: string
    category: SourceCategory
    url: string
    region?: string
    language?: string
    raw_meta: Record<string, any>
  }>
  metrics: Array<{
    source_url: string  // Match to source
    views?: number
    subscribers?: number
    rating_score?: number
    rating_votes?: number
    favorites?: number
    episode_count?: number
    status?: SeriesStatus
    age_rating?: string
    raw?: Record<string, any>
  }>
}

/**
 * Query result: Title with all related data
 */
export interface IntelligenceTitleWithRelations {
  title: IntelligenceTitle
  aliases: IntelligenceAlias[]
  sources: IntelligenceSource[]
  latestMetrics: IntelligenceMetric[]  // One per source (most recent)
  metricsHistory?: IntelligenceMetric[]  // All snapshots (optional)
}
