/**
 * Pipeline Orchestration
 *
 * Main pipeline that orchestrates:
 * 1. URL discovery
 * 2. Scraping from multiple sources
 * 3. Data normalization and merging
 * 4. Database upsert
 */

import { resolveTitle, generateSlug } from '../search/titleResolver'
import { findScraperForUrl } from '../scrapers'
import { upsertIntelligenceTitle } from '../db/operations'
import { UpsertIntelligenceTitlePayload, SourceCategory } from '../model/schema'
import { ScrapeResult } from '../scrapers/base'

export interface PipelineResult {
  success: boolean
  titleId?: string
  sourcesScraped: number
  sourcesFound: number
  errors: Array<{
    url: string
    error: string
  }>
  summary: {
    title?: {
      ko?: string
      en?: string
    }
    slug: string
    sources: string[]
    metrics: Record<string, any>
  }
}

/**
 * Run full intelligence pipeline for a title
 */
export async function runPipeline(
  titleName: string,
  options?: {
    sources?: string[]  // Filter to specific sources (domains)
    skipUrlDiscovery?: boolean  // Use provided URLs only
    providedUrls?: string[]  // Manual URL list
  }
): Promise<PipelineResult> {
  const errors: Array<{ url: string; error: string }> = []
  const scrapeResults: ScrapeResult[] = []

  console.log(`[Pipeline] Starting for title: "${titleName}"`)

  // Step 1: Resolve URLs
  let candidateUrls: string[] = []

  if (options?.skipUrlDiscovery && options?.providedUrls) {
    candidateUrls = options.providedUrls
    console.log(`[Pipeline] Using ${candidateUrls.length} provided URLs`)
  } else {
    console.log('[Pipeline] Discovering URLs...')
    const resolved = await resolveTitle(titleName)
    candidateUrls = resolved.candidateUrls

    // Add manual URLs if provided
    if (options?.providedUrls) {
      candidateUrls.push(...options.providedUrls)
    }

    console.log(`[Pipeline] Found ${candidateUrls.length} candidate URLs`)
  }

  // Filter by source domains if specified
  if (options?.sources && options.sources.length > 0) {
    candidateUrls = candidateUrls.filter(url => {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '')
        return options.sources!.includes(domain)
      } catch {
        return false
      }
    })
    console.log(`[Pipeline] Filtered to ${candidateUrls.length} URLs matching sources`)
  }

  // Step 2: Scrape each URL
  console.log('[Pipeline] Scraping sources...')
  const sourcesFound = candidateUrls.length
  let sourcesScraped = 0

  for (const url of candidateUrls) {
    try {
      const scraper = findScraperForUrl(url)

      if (!scraper) {
        errors.push({
          url,
          error: 'No scraper available for this URL'
        })
        console.warn(`[Pipeline] No scraper for: ${url}`)
        continue
      }

      console.log(`[Pipeline] Scraping ${scraper.name}: ${url}`)

      const result = await scraper.scrape(url)

      if (result) {
        scrapeResults.push(result)
        sourcesScraped++
        console.log(`[Pipeline] ✓ Successfully scraped ${scraper.name}`)
      } else {
        errors.push({
          url,
          error: 'Scraper returned null (not implemented or failed)'
        })
        console.warn(`[Pipeline] Scraper returned null for: ${url}`)
      }

      // Rate limiting: wait 3 seconds between Korean platform scrapes
      if (scraper.category === 'official_platform') {
        console.log('[Pipeline] Rate limiting: waiting 3s...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push({ url, error: message })
      console.error(`[Pipeline] Error scraping ${url}:`, message)
    }
  }

  console.log(`[Pipeline] Scraped ${sourcesScraped}/${sourcesFound} sources`)

  // Step 3: Merge results
  if (scrapeResults.length === 0) {
    console.error('[Pipeline] No data collected from any source')
    return {
      success: false,
      sourcesScraped: 0,
      sourcesFound,
      errors,
      summary: {
        slug: generateSlug(titleName),
        sources: [],
        metrics: {}
      }
    }
  }

  console.log('[Pipeline] Merging normalized data...')
  const merged = mergeResults(titleName, scrapeResults)

  // Step 4: Upsert to database
  console.log('[Pipeline] Upserting to database...')
  try {
    const titleId = await upsertIntelligenceTitle(merged)
    console.log(`[Pipeline] ✓ Successfully upserted title: ${titleId}`)

    return {
      success: true,
      titleId,
      sourcesScraped,
      sourcesFound,
      errors,
      summary: {
        title: {
          ko: merged.title.original_title_ko,
          en: merged.title.original_title_en
        },
        slug: merged.title.slug,
        sources: merged.sources.map(s => s.domain),
        metrics: summarizeMetrics(merged.metrics)
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Pipeline] Database upsert failed:', message)

    return {
      success: false,
      sourcesScraped,
      sourcesFound,
      errors: [...errors, { url: 'database', error: message }],
      summary: {
        slug: merged.title.slug,
        sources: merged.sources.map(s => s.domain),
        metrics: {}
      }
    }
  }
}

/**
 * Merge scrape results into a single payload
 */
function mergeResults(
  inputTitle: string,
  results: ScrapeResult[]
): UpsertIntelligenceTitlePayload {
  // Prefer official sources for canonical titles
  const officialResults = results.filter(r =>
    r.sourceMeta.category === 'official_platform' ||
    r.sourceMeta.category === 'official_platform_en'
  )

  const primaryResult = officialResults[0] || results[0]

  // Determine canonical titles (prefer official sources)
  let title_ko: string | undefined
  let title_en: string | undefined

  for (const result of officialResults) {
    if (!title_ko && result.normalized.title?.ko) {
      title_ko = result.normalized.title.ko
    }
    if (!title_en && result.normalized.title?.en_official) {
      title_en = result.normalized.title.en_official
    }
  }

  // Fallback to any result
  if (!title_ko && !title_en) {
    for (const result of results) {
      if (!title_ko && result.normalized.title?.ko) {
        title_ko = result.normalized.title.ko
      }
      if (!title_en && result.normalized.title?.en_official) {
        title_en = result.normalized.title.en_official
      }
    }
  }

  // Generate slug
  const slug = generateSlug(title_en || title_ko || inputTitle)

  // Merge genres (union of all)
  const allGenres = new Set<string>()
  for (const result of results) {
    if (result.normalized.title?.primary_genres) {
      result.normalized.title.primary_genres.forEach(g => allGenres.add(g))
    }
  }

  // Collect all aliases
  const aliasesSet = new Set<string>()
  for (const result of results) {
    if (result.normalized.title?.ko) aliasesSet.add(result.normalized.title.ko)
    if (result.normalized.title?.en_official) aliasesSet.add(result.normalized.title.en_official)
    if (result.normalized.title?.en_fan) aliasesSet.add(result.normalized.title.en_fan)
    if (result.normalized.title?.alt) {
      result.normalized.title.alt.forEach(a => aliasesSet.add(a))
    }
  }

  const aliases = Array.from(aliasesSet).map(alias => ({
    alias,
    language: /[가-힣]/.test(alias) ? 'ko' : 'en',
    kind: 'other' as const  // TODO: Determine kind more intelligently
  }))

  // Build payload
  const payload: UpsertIntelligenceTitlePayload = {
    title: {
      original_title_ko: title_ko,
      original_title_en: title_en,
      slug,
      type: primaryResult.normalized.title?.has_webnovel ? 'webnovel' : 'webtoon',
      original_language: primaryResult.normalized.title?.original_language || 'ko',
      primary_genres: allGenres.size > 0 ? Array.from(allGenres) : undefined,
      demographic: primaryResult.normalized.title?.demographic
    },
    aliases,
    sources: results.map(result => ({
      domain: result.sourceMeta.domain,
      category: result.sourceMeta.category,
      url: result.sourceMeta.url,
      region: result.sourceMeta.region,
      language: result.sourceMeta.language,
      raw_meta: result.raw
    })),
    metrics: results
      .filter(r => r.normalized.metrics)
      .map(result => ({
        source_url: result.sourceMeta.url,
        views: result.normalized.metrics?.views,
        subscribers: result.normalized.metrics?.subscribers,
        rating_score: result.normalized.metrics?.rating_score,
        rating_votes: result.normalized.metrics?.rating_votes,
        favorites: result.normalized.metrics?.favorites,
        episode_count: result.normalized.metrics?.episode_count,
        status: result.normalized.metrics?.status,
        age_rating: result.normalized.metrics?.age_rating,
        raw: result.raw
      }))
  }

  return payload
}

/**
 * Summarize metrics for CLI output
 */
function summarizeMetrics(metrics: UpsertIntelligenceTitlePayload['metrics']): Record<string, any> {
  if (metrics.length === 0) return {}

  const summary: Record<string, any> = {}

  // Aggregate metrics across sources
  const totalViews = metrics.reduce((sum, m) => sum + (m.views || 0), 0)
  const totalSubscribers = metrics.reduce((sum, m) => sum + (m.subscribers || 0), 0)
  const avgRating = metrics
    .filter(m => m.rating_score)
    .reduce((sum, m, _, arr) => sum + (m.rating_score || 0) / arr.length, 0)

  if (totalViews > 0) summary.total_views = totalViews
  if (totalSubscribers > 0) summary.total_subscribers = totalSubscribers
  if (avgRating > 0) summary.avg_rating = Math.round(avgRating * 10) / 10

  return summary
}
