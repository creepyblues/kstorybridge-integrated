/**
 * Title Type Definitions
 *
 * Types for title data used in chat context, including minimal fields
 * needed for matching and display in chat messages.
 */

/**
 * Minimal title data for chat context
 *
 * Lightweight version of full title data, used for title matching
 * and inline display in chat messages.
 */
export interface ChatTitle {
  /** Title ID */
  title_id: string;
  /** Korean title name */
  title_name_kr: string | null;
  /** English title name */
  title_name_en: string | null;
  /** Normalized Korean name (for matching) */
  normalizedKr?: string;
  /** Normalized English name (for matching) */
  normalizedEn?: string;
  /** Whether title has pitch deck */
  pitch: string | null;
  /** Title thumbnail image */
  title_image: string | null;
  /** Genre (for quick preview) */
  genre: string[] | null;
  /** Brief synopsis (for quick preview) */
  synopsis: string | null;
}

/**
 * Title match result
 */
export interface TitleMatch {
  /** Matched title data */
  title: ChatTitle;
  /** Match confidence score (0-1) */
  score: number;
  /** Which field matched (kr/en) */
  matchedField: 'kr' | 'en';
}

/**
 * Title cache entry
 */
export interface TitleCacheEntry {
  /** Title data */
  title: ChatTitle;
  /** When cached */
  cachedAt: Date;
  /** Number of times accessed */
  accessCount: number;
}

/**
 * Title lookup options
 */
export interface TitleLookupOptions {
  /** Similarity threshold (0-1) */
  threshold?: number;
  /** Maximum number of results */
  limit?: number;
  /** Whether to use fuzzy matching */
  fuzzyMatch?: boolean;
  /** Whether to normalize before matching */
  normalize?: boolean;
}

/**
 * Title cache statistics
 */
export interface TitleCacheStats {
  /** Total titles in cache */
  totalCached: number;
  /** Cache hit rate */
  hitRate: number;
  /** Most accessed titles */
  topTitles: Array<{
    titleId: string;
    titleName: string;
    accessCount: number;
  }>;
}
