/**
 * Bato.to Scraper
 *
 * Scrapes METADATA ONLY from bato.to (aggregator)
 * Category: Unofficial Aggregator
 *
 * IMPORTANT: This scraper extracts metadata and stats only (favorites, follows, ratings).
 * We do NOT scrape chapter content (anti-piracy policy).
 *
 * URL Pattern: https://bato.to/series/{id}
 *
 * TODO: Implement HTML parsing logic
 */

import { BaseScraper, ScrapeResult } from './base'

export class BatoToScraper extends BaseScraper {
  readonly name = 'Bato_To'
  readonly domain = 'bato.to'
  readonly category = 'unofficial_aggregator' as const

  async scrape(url: string): Promise<ScrapeResult | null> {
    // TODO: Implement static HTML scraping for metadata only
    // Extract: title variants, genres, rating, favorites, follows, status
    console.warn(`[${this.name}] Metadata scraping not yet implemented for: ${url}`)
    return null
  }
}
