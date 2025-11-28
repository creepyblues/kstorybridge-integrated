/**
 * Title Resolver
 *
 * Discovers URLs for a given title across multiple domains.
 * Uses multiple strategies: search engines, pattern matching, database lookup.
 */

import { searchIntelligenceTitles } from '../db/operations'

export interface ResolvedTitle {
  inputTitle: string
  candidateAliases: string[]
  candidateUrls: string[]
}

/**
 * Resolve title to candidate URLs
 */
export async function resolveTitle(titleName: string): Promise<ResolvedTitle> {
  const candidateUrls: string[] = []
  const candidateAliases: string[] = [titleName]

  // Strategy 1: Database lookup (check if we've seen this title before)
  const dbResults = await searchIntelligenceTitles(titleName, 5)
  if (dbResults.length > 0) {
    for (const result of dbResults) {
      // Add known URLs from database
      // TODO: Fetch sources for each result and add to candidateUrls
      if (result.original_title_ko && result.original_title_ko !== titleName) {
        candidateAliases.push(result.original_title_ko)
      }
      if (result.original_title_en && result.original_title_en !== titleName) {
        candidateAliases.push(result.original_title_en)
      }
    }
  }

  // Strategy 2: Generate candidate URLs from known patterns
  candidateUrls.push(...generateCandidateUrls(titleName))

  // Strategy 3: Web search (TODO - implement when ready)
  // const searchResults = await searchWeb(titleName)
  // candidateUrls.push(...searchResults)

  // Remove duplicates
  const uniqueUrls = [...new Set(candidateUrls)]

  return {
    inputTitle: titleName,
    candidateAliases,
    candidateUrls: uniqueUrls
  }
}

/**
 * Generate candidate URLs from known platform patterns
 *
 * TODO: This is a placeholder. In production, this would:
 * 1. Use Google Custom Search API to find actual URLs
 * 2. Use platform-specific search APIs (if available)
 * 3. Use a mapping table of known titles → URLs
 */
function generateCandidateUrls(titleName: string): string[] {
  const urls: string[] = []

  // Pattern templates for common platforms
  // These are PLACEHOLDERS - actual URL discovery needs web search or API calls

  // Korean platforms (would use search: "{title} site:page.kakao.com")
  // urls.push(`https://page.kakao.com/content/{id}`)  // Need actual ID
  // urls.push(`https://series.naver.com/comic/detail.series?productNo={id}`)  // Need actual ID

  // Global platforms (would use search: "{english_title} site:webtoons.com")
  // urls.push(`https://www.webtoons.com/en/{genre}/{slug}/list?title_no={id}`)  // Need actual ID

  // Metadata sites (easier to search)
  // urls.push(`https://www.webtoonguide.com/...`)  // Need actual path

  // For now, return empty array with TODO comment
  // Real implementation will come from web search integration

  return urls
}

/**
 * Web search placeholder
 *
 * TODO: Implement Google Custom Search API integration
 * This would search for "{title} site:{domain}" and extract URLs from results
 */
async function searchWeb(titleName: string): Promise<string[]> {
  // TODO: Implement web search
  // 1. Call Google Custom Search API with queries like:
  //    - `${titleName} site:page.kakao.com`
  //    - `${titleName} site:series.naver.com`
  //    - `${titleName} site:webtoons.com`
  //    - etc.
  // 2. Extract URLs from search results
  // 3. Validate URLs against scraper patterns
  // 4. Return list of candidate URLs

  console.warn('[TitleResolver] Web search not yet implemented')
  return []
}

/**
 * Romanize Korean text (for slug generation and search)
 *
 * TODO: Implement proper Korean romanization
 * This is a simple placeholder
 */
export function romanizeKorean(korean: string): string {
  // TODO: Use proper romanization library (e.g., hangul-romanization)
  // For now, just return lowercase with spaces replaced
  return korean.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')  // Keep Korean chars for now
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 100)  // Limit length
}
