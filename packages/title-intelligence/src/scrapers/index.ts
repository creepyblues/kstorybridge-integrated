/**
 * Scraper Registry
 *
 * Central registry of all available scrapers.
 * Provides utilities to find the right scraper for a given URL.
 */

import { IScraper } from './base'

// Import all scrapers (will be implemented progressively)
import { KakaoPageScraper } from './kakao'
import { NaverSeriesScraper } from './naver'
import { WebtoonEnScraper } from './webtoonEn'
import { WebtoonGuideScraper } from './webtoonGuide'
import { ToonsKrScraper } from './toonsKr'
import { BatoToScraper } from './batoTo'
import { RedditScraper } from './reddit'
import { AO3Scraper } from './ao3'

/**
 * All registered scrapers
 */
export const SCRAPERS: IScraper[] = [
  new KakaoPageScraper(),
  new NaverSeriesScraper(),
  new WebtoonEnScraper(),
  new WebtoonGuideScraper(),
  new ToonsKrScraper(),
  new BatoToScraper(),
  new RedditScraper(),
  new AO3Scraper()
]

/**
 * Find scraper that can handle the given URL
 */
export function findScraperForUrl(url: string): IScraper | null {
  return SCRAPERS.find(scraper => scraper.canHandle(url)) || null
}

/**
 * Get all scrapers by category
 */
export function getScrapersByCategory(category: string): IScraper[] {
  return SCRAPERS.filter(scraper => scraper.category === category)
}

/**
 * Get scraper by name
 */
export function getScraperByName(name: string): IScraper | null {
  return SCRAPERS.find(scraper => scraper.name === name) || null
}

/**
 * Get all scraper domains
 */
export function getAllDomains(): string[] {
  return SCRAPERS.map(scraper => scraper.domain)
}

/**
 * Check if URL is supported
 */
export function isUrlSupported(url: string): boolean {
  return findScraperForUrl(url) !== null
}

// Re-export base types
export * from './base'
