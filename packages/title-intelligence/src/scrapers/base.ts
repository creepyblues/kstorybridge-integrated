/**
 * Base Scraper Interface
 *
 * All scrapers must implement this interface to be registered in the system.
 */

import { SourceCategory, SeriesStatus } from '../model/schema'

/**
 * Normalized scrape result that all scrapers must return
 */
export interface ScrapeResult {
  /**
   * Source metadata (where this data came from)
   */
  sourceMeta: {
    domain: string
    category: SourceCategory
    url: string
    language?: string
    region?: string
  }

  /**
   * Normalized data (mapped to our schema)
   */
  normalized: {
    /**
     * Title information
     */
    title?: {
      ko?: string  // Korean title
      en_official?: string  // Official English title
      en_fan?: string  // Fan-translated English title
      alt?: string[]  // Alternative titles
      original_language?: string  // ISO 639-1 code
      primary_genres?: string[]
      demographic?: string
      has_webnovel?: boolean
    }

    /**
     * Metrics/stats from this source
     */
    metrics?: {
      views?: number
      subscribers?: number
      rating_score?: number  // Normalized to 0-10 scale
      rating_votes?: number
      favorites?: number
      episode_count?: number
      status?: SeriesStatus
      age_rating?: string
    }

    /**
     * Additional structured data
     */
    metadata?: {
      synopsis?: string
      author?: string
      artist?: string
      publisher?: string
      release_year?: number
      tags?: string[]
    }
  }

  /**
   * Raw data from the source (for storage and debugging)
   * This should be the complete scraped data before normalization
   */
  raw: Record<string, any>
}

/**
 * Base scraper interface that all scrapers must implement
 */
export interface IScraper {
  /**
   * Scraper name (for logging and registry)
   */
  readonly name: string

  /**
   * Domain this scraper handles (e.g., "page.kakao.com")
   */
  readonly domain: string

  /**
   * Source category
   */
  readonly category: SourceCategory

  /**
   * Check if this scraper can handle the given URL
   */
  canHandle(url: string): boolean

  /**
   * Scrape the URL and return normalized result
   * Returns null if scraping failed or URL is invalid
   */
  scrape(url: string): Promise<ScrapeResult | null>
}

/**
 * Base scraper class with common utilities
 */
export abstract class BaseScraper implements IScraper {
  abstract readonly name: string
  abstract readonly domain: string
  abstract readonly category: SourceCategory

  /**
   * Default canHandle implementation checks domain
   */
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === this.domain ||
             urlObj.hostname === `www.${this.domain}`
    } catch {
      return false
    }
  }

  /**
   * Abstract scrape method - must be implemented by each scraper
   */
  abstract scrape(url: string): Promise<ScrapeResult | null>

  /**
   * Normalize rating to 0-10 scale
   */
  protected normalizeRating(score: number, maxScore: number): number {
    return Math.round((score / maxScore) * 10 * 10) / 10  // Round to 1 decimal
  }

  /**
   * Parse number from text (removes commas, converts Korean 만/억)
   */
  protected parseNumber(text: string): number | null {
    if (!text) return null

    // Remove whitespace
    text = text.trim()

    // Handle Korean number formats
    // 1.5만 = 15,000
    // 150만 = 1,500,000
    // 1억 = 100,000,000
    const koreanMatch = text.match(/^([\d.]+)\s*(만|억)$/)
    if (koreanMatch) {
      const num = parseFloat(koreanMatch[1])
      const unit = koreanMatch[2]
      if (unit === '만') return Math.floor(num * 10000)
      if (unit === '억') return Math.floor(num * 100000000)
    }

    // Remove commas and parse
    const cleaned = text.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Extract domain from URL
   */
  protected extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  }
}

/**
 * Scraper error types
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly scraper: string,
    public readonly url: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'ScraperError'
  }
}

export class NetworkError extends ScraperError {
  constructor(scraper: string, url: string, cause?: Error) {
    super('Network request failed', scraper, url, cause)
    this.name = 'NetworkError'
  }
}

export class ParseError extends ScraperError {
  constructor(scraper: string, url: string, cause?: Error) {
    super('Failed to parse HTML/JSON', scraper, url, cause)
    this.name = 'ParseError'
  }
}

export class NotFoundError extends ScraperError {
  constructor(scraper: string, url: string) {
    super('Title not found (404)', scraper, url)
    this.name = 'NotFoundError'
  }
}
