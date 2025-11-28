/**
 * Archive of Our Own (AO3) Scraper
 *
 * Searches AO3 for fanfiction works related to a title
 * Category: Fanfiction
 *
 * URL Pattern: https://archiveofourown.org/tags/{tag}/works
 *
 * TODO: Implement AO3 search and scraping logic
 */

import { BaseScraper, ScrapeResult } from './base'

export class AO3Scraper extends BaseScraper {
  readonly name = 'AO3'
  readonly domain = 'archiveofourown.org'
  readonly category = 'fanfiction' as const

  async scrape(url: string): Promise<ScrapeResult | null> {
    // TODO: Implement AO3 search and scraping
    // 1. Search for title as a tag or fandom
    // 2. Extract: work count, kudos, bookmarks, popular ships/pairings
    // 3. Return normalized result with fanfiction metrics

    console.warn(`[${this.name}] AO3 scraping not yet implemented for: ${url}`)
    return null
  }
}
