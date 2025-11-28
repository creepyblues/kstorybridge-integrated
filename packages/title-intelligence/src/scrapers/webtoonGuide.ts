/**
 * WebtoonGuide Scraper
 *
 * Scrapes metadata from webtoonguide.com
 * Category: Metadata Database
 *
 * URL Pattern: https://www.webtoonguide.com/.../content-info/{id}
 *
 * TODO: Implement actual HTML parsing logic once we have sample pages
 * This is a placeholder implementation with the correct structure.
 */

import { load } from 'cheerio'
import fetch from 'node-fetch'
import { BaseScraper, ScrapeResult, NetworkError, ParseError, NotFoundError } from './base'

export class WebtoonGuideScraper extends BaseScraper {
  readonly name = 'WebtoonGuide'
  readonly domain = 'www.webtoonguide.com'
  readonly category = 'metadata_db' as const

  async scrape(url: string): Promise<ScrapeResult | null> {
    try {
      // Fetch HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })

      if (response.status === 404) {
        throw new NotFoundError(this.name, url)
      }

      if (!response.ok) {
        throw new NetworkError(this.name, url)
      }

      const html = await response.text()
      const $ = load(html)

      // TODO: Implement actual parsing logic based on WebtoonGuide HTML structure
      // Below is a TEMPLATE - update selectors based on actual page structure

      const title_ko = $('.title-korean')?.text()?.trim() || null
      const title_en = $('.title-english')?.text()?.trim() || null
      const genres = $('.genre-tag').map((_, el) => $(el).text().trim()).get()
      const synopsis = $('.synopsis')?.text()?.trim() || null
      const author = $('.author-name')?.text()?.trim() || null
      const artist = $('.artist-name')?.text()?.trim() || null
      const publisher = $('.publisher')?.text()?.trim() || null
      const statusText = $('.status')?.text()?.trim() || null
      const ratingText = $('.rating-score')?.text()?.trim() || null
      const tagsText = $('.tags .tag').map((_, el) => $(el).text().trim()).get()

      // Normalize rating (if found)
      const rating_score = ratingText ? this.normalizeRating(parseFloat(ratingText), 10) : null

      // Normalize status
      let status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | null = null
      if (statusText) {
        if (statusText.toLowerCase().includes('ongoing')) status = 'ongoing'
        else if (statusText.toLowerCase().includes('completed')) status = 'completed'
        else if (statusText.toLowerCase().includes('hiatus')) status = 'hiatus'
      }

      return {
        sourceMeta: {
          domain: this.domain,
          category: this.category,
          url,
          language: 'en',
          region: 'Global'
        },
        normalized: {
          title: {
            ko: title_ko || undefined,
            en_official: title_en || undefined,
            primary_genres: genres.length > 0 ? genres : undefined
          },
          metadata: {
            synopsis: synopsis || undefined,
            author: author || undefined,
            artist: artist || undefined,
            publisher: publisher || undefined,
            tags: tagsText.length > 0 ? tagsText : undefined
          },
          metrics: {
            rating_score: rating_score !== null ? rating_score : undefined,
            status: status || undefined
          }
        },
        raw: {
          html_title_ko: title_ko,
          html_title_en: title_en,
          html_genres: genres,
          html_synopsis: synopsis,
          html_author: author,
          html_artist: artist,
          html_publisher: publisher,
          html_status: statusText,
          html_rating: ratingText,
          html_tags: tagsText,
          scraped_at: new Date().toISOString(),
          url
        }
      }

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      if (error instanceof NetworkError) {
        throw error
      }
      throw new ParseError(this.name, url, error as Error)
    }
  }
}
