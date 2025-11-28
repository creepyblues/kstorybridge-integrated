/**
 * WEBTOON English Scraper
 *
 * Scrapes official English platform data from webtoons.com
 * Category: Official Platform (English)
 *
 * URL Pattern: https://www.webtoons.com/en/{genre}/{title}/list?title_no={id}
 *
 * TODO: Implement actual HTML parsing logic once we have sample pages
 * This is a placeholder implementation with the correct structure.
 */

import { load } from 'cheerio'
import fetch from 'node-fetch'
import { BaseScraper, ScrapeResult, NetworkError, ParseError, NotFoundError } from './base'

export class WebtoonEnScraper extends BaseScraper {
  readonly name = 'WEBTOON_EN'
  readonly domain = 'www.webtoons.com'
  readonly category = 'official_platform_en' as const

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return (urlObj.hostname === this.domain || urlObj.hostname === 'webtoons.com') &&
             urlObj.pathname.includes('/en/')
    } catch {
      return false
    }
  }

  async scrape(url: string): Promise<ScrapeResult | null> {
    try {
      // Fetch HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
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

      // TODO: Update selectors based on actual WEBTOON EN page structure
      // These are PLACEHOLDER selectors - verify against real pages

      const title_en = $('.subj')?.text()?.trim() || null
      const author = $('.author')?.text()?.trim()?.replace(/^author\s*/i, '') || null
      const genre = $('.genre')?.text()?.trim() || null
      const synopsis = $('.summary')?.text()?.trim() || null
      const subscribersText = $('.grade_num')?.text()?.trim() || null
      const ratingText = $('.rating_num')?.text()?.trim() || null
      const episodeCount = $('.detail_lst > li').length || null

      // Parse subscribers (e.g., "12.3M" or "456K")
      let subscribers: number | null = null
      if (subscribersText) {
        const match = subscribersText.match(/([\d.]+)([MK])/)
        if (match) {
          const num = parseFloat(match[1])
          const unit = match[2]
          subscribers = unit === 'M' ? num * 1000000 : num * 1000
        }
      }

      // Parse rating (usually 0-10 scale on WEBTOON)
      const rating_score = ratingText ? this.normalizeRating(parseFloat(ratingText), 10) : null

      // Determine status (check for "COMPLETED" badge or similar)
      let status: 'ongoing' | 'completed' | null = null
      const completedBadge = $('.ico_completed').length > 0
      const ongoingBadge = $('.ico_up').length > 0
      if (completedBadge) status = 'completed'
      else if (ongoingBadge) status = 'ongoing'

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
            en_official: title_en || undefined,
            primary_genres: genre ? [genre] : undefined,
            original_language: 'ko'  // Most WEBTOON EN titles are Korean originals
          },
          metadata: {
            synopsis: synopsis || undefined,
            author: author || undefined
          },
          metrics: {
            subscribers: subscribers !== null ? subscribers : undefined,
            rating_score: rating_score !== null ? rating_score : undefined,
            episode_count: episodeCount > 0 ? episodeCount : undefined,
            status: status || undefined
          }
        },
        raw: {
          html_title_en: title_en,
          html_author: author,
          html_genre: genre,
          html_synopsis: synopsis,
          html_subscribers: subscribersText,
          html_rating: ratingText,
          html_episode_count: episodeCount,
          html_completed_badge: completedBadge,
          html_ongoing_badge: ongoingBadge,
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
