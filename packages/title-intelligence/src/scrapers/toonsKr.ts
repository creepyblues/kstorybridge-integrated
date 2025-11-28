/**
 * Toons.kr Scraper
 *
 * Scrapes metadata from toons.kr (Korean metadata aggregator)
 * Category: Metadata Database
 *
 * TODO: Implement HTML parsing logic once URL patterns are confirmed
 */

import { BaseScraper, ScrapeResult } from './base'

export class ToonsKrScraper extends BaseScraper {
  readonly name = 'Toons_KR'
  readonly domain = 'toons.kr'
  readonly category = 'metadata_db' as const

  async scrape(url: string): Promise<ScrapeResult | null> {
    // TODO: Implement static HTML scraping
    console.warn(`[${this.name}] HTML scraping not yet implemented for: ${url}`)
    return null
  }
}
