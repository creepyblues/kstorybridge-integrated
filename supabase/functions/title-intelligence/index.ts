/**
 * Title Intelligence Edge Function
 *
 * Purpose: Orchestrates data collection from multiple sources (Naver, Kakao, Reddit, AO3)
 *
 * Flow:
 * 1. Receive request with title name and sources
 * 2. Create or find intelligence_titles record
 * 3. Call scraper modules sequentially with rate limiting
 * 4. Store results in normalized schema:
 *    - intelligence_sources (one per platform)
 *    - intelligence_metrics (time-series snapshot)
 * 5. Return collection results
 *
 * Rate Limiting:
 * - 1 request per 3 seconds for Naver/Kakao (avoid detection)
 * - No rate limit for Reddit API
 * - No rate limit for AO3 (community scraping)
 *
 * Schema: Uses normalized intelligence_* tables (NOT legacy title_intelligence_data)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import scraper modules
import { scrapeNaver } from './scrapers/naver.ts'
import { scrapeNaverSeries } from './scrapers/naver-series.ts'
import { scrapeKakao } from './scrapers/kakao.ts'
import { scrapeKakaoWebtoon } from './scrapers/kakao-webtoon.ts'
import { scrapeManta } from './scrapers/manta.ts'
import { scrapeRidibooks } from './scrapers/ridibooks.ts'
import { scrapeBomtoon } from './scrapers/bomtoon.ts'
import { scrapeLezhin } from './scrapers/lezhin.ts'
import { scrapeReddit } from './scrapers/reddit.ts'
import { scrapeAO3 } from './scrapers/ao3.ts'
import { scrapeComick } from './scrapers/comick.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Legacy request format (title name search)
interface LegacyIntelligenceRequest {
  titleNameInput: string
  titleNameEn?: string  // Optional English title
  sources: string[]  // e.g., ['naver', 'kakao', 'reddit', 'ao3']
  collectedBy: string  // Admin email
  contentType?: string  // webtoon | webnovel | light_novel | manga | mixed
}

// New URL-based request format (can include fan engagement sources)
interface UrlBasedRequest {
  urls: Array<{
    platform: 'naver_webtoon' | 'naver_series' | 'kakao' | 'kakao_webtoon' | 'manta' | 'ridibooks' | 'bomtoon' | 'lezhin'
    platformId: string
    originalUrl: string
    // Naver Series ships comics and novels on the same productNo namespace
    // but different paths. Default 'comic' when omitted (backward compat).
    subKind?: 'comic' | 'novel'
  }>
  collectedBy: string
  contentType?: string
  // Optional: Fan engagement sources (searched by title name)
  fanEngagement?: {
    titleName: string
    sources: string[]  // ['reddit', 'ao3']
  }
}

type IntelligenceRequest = LegacyIntelligenceRequest | UrlBasedRequest

function isUrlBasedRequest(body: any): body is UrlBasedRequest {
  return Array.isArray(body.urls) && body.urls.length > 0
}

/**
 * Map titles.content_format values (snake_case, e.g. 'web_novel') to the
 * intelligence_titles.type CHECK constraint set ('webtoon', 'webnovel',
 * 'light_novel', 'manga', 'mixed'). Values outside the constraint fall
 * back to 'mixed' so the INSERT never trips the check.
 */
const INTELLIGENCE_TYPE_MAP: Record<string, string> = {
  webtoon: 'webtoon',
  web_novel: 'webnovel',
  webnovel: 'webnovel',
  light_novel: 'light_novel',
  manga: 'manga',
  mixed: 'mixed',
}
function normalizeContentType(input: string | undefined | null): string {
  if (!input) return 'webtoon'
  return INTELLIGENCE_TYPE_MAP[input] || 'mixed'
}

// Source category mapping
const SOURCE_CATEGORIES: Record<string, string> = {
  'naver': 'official_platform',
  'naver_webtoon': 'official_platform',
  'naver_series': 'official_platform',
  'kakao': 'official_platform',
  'kakao_webtoon': 'official_platform',
  'ridibooks': 'official_platform',
  'bomtoon': 'official_platform',
  'manta': 'official_platform_en',
  'lezhin': 'official_platform_en',
  'webtoons': 'official_platform_en',
  'reddit': 'fandom_forum',
  'ao3': 'fanfiction',
  'comick': 'unofficial_aggregator',
}

// Domain mapping
const SOURCE_DOMAINS: Record<string, string> = {
  'naver': 'comic.naver.com',
  'naver_webtoon': 'comic.naver.com',
  'naver_series': 'series.naver.com',
  'kakao': 'page.kakao.com',
  'kakao_webtoon': 'webtoon.kakao.com',
  'ridibooks': 'ridibooks.com',
  'bomtoon': 'bomtoon.com',
  'manta': 'manta.net',
  'lezhin': 'lezhinus.com',
  'webtoons': 'webtoons.com',
  'reddit': 'reddit.com',
  'ao3': 'archiveofourown.org',
  'comick': 'comick.live',
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(titleKo: string, titleEn?: string): string {
  const base = titleEn || titleKo
  if (!base) return `untitled-${Date.now()}`

  return base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

/**
 * Clean Korean title for fan engagement searches (Reddit, AO3)
 * Removes platform-specific suffixes that don't appear in fan communities
 */
function cleanTitleForFanSearch(title: string): string {
  if (!title) return title

  // Remove common Korean platform suffixes in brackets
  // [독점] = exclusive, [단독] = solo/exclusive, [독점연재] = exclusive serialization
  // [시즌N] = season N, [완결] = completed, [연재중] = ongoing
  let cleaned = title
    .replace(/\s*\[독점\]\s*/g, ' ')
    .replace(/\s*\[단독\]\s*/g, ' ')
    .replace(/\s*\[독점연재\]\s*/g, ' ')
    .replace(/\s*\[시즌\d+\]\s*/g, ' ')
    .replace(/\s*\[완결\]\s*/g, ' ')
    .replace(/\s*\[연재중\]\s*/g, ' ')
    .replace(/\s*\[무료\]\s*/g, ' ')
    .replace(/\s*\[특별판\]\s*/g, ' ')
    .replace(/\s*\[외전\]\s*/g, ' ')
    // Remove other common bracket suffixes
    .replace(/\s*\[[^\]]+\]\s*$/g, ' ')  // Any remaining [...] at end
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim()

  console.log(`[cleanTitleForFanSearch] "${title}" -> "${cleaned}"`)
  return cleaned
}

/**
 * Retry wrapper with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 2)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @returns Result of the function or throws after all retries exhausted
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelayMs?: number
    operationName?: string
  } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000, operationName = 'operation' } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) // Exponential backoff: 1s, 2s, 4s
        console.log(`[Retry] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
        console.log(`[Retry] Error: ${lastError.message}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`[Retry] ${operationName} failed after ${maxRetries + 1} attempts`)
  throw lastError
}

/**
 * Handle URL-based collection (new approach)
 */
async function handleUrlBasedCollection(supabase: any, body: UrlBasedRequest) {
  const { urls, collectedBy, contentType } = body

  if (!urls || urls.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No valid URLs provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[URL-based] Processing ${urls.length} URL(s)`)

  // Step 1: Create intelligence_titles record
  // Use the first URL's platform ID as a temporary identifier
  const firstUrl = urls[0]
  const tempSlug = `${firstUrl.platform}-${firstUrl.platformId}-${Date.now()}`

  const { data: newTitle, error: createTitleError } = await supabase
    .from('intelligence_titles')
    .insert({
      original_title_ko: null,  // Will be populated from scraper results
      original_title_en: null,
      slug: tempSlug,
      type: normalizeContentType(contentType),
      original_language: 'ko',
      primary_genres: [],
    })
    .select()
    .single()

  if (createTitleError) {
    console.error('Failed to create intelligence title:', createTitleError)
    return new Response(
      JSON.stringify({ error: 'Failed to create intelligence title' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const intelligenceTitleId = newTitle.id
  console.log(`[URL-based] Created intelligence title: ${tempSlug}`)

  // Step 2: Collect data from each URL
  const sourcesCreated: string[] = []
  const collectionErrors: Record<string, string> = {}
  let hasErrors = false
  let firstTitle: string | null = null

  for (let i = 0; i < urls.length; i++) {
    const urlInfo = urls[i]
    const sourceKey = `${urlInfo.platform}:${urlInfo.platformId}`

    try {
      console.log(`[URL-based] Processing ${urlInfo.platform} - ID: ${urlInfo.platformId}`)

      let scraperResult = null

      switch (urlInfo.platform) {
        case 'naver_webtoon':
          // Use titleId directly with Naver scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeNaver(urlInfo.platformId),
            { operationName: `Naver Webtoon scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        case 'naver_series':
          // Use productNo directly with Naver Series scraper (with retry).
          // subKind tells the scraper whether to fetch /comic/ or /novel/.
          scraperResult = await withRetry(
            () => scrapeNaverSeries(urlInfo.platformId, urlInfo.subKind || 'comic'),
            { operationName: `Naver Series scrape (${urlInfo.subKind || 'comic'}/${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        case 'kakao':
          // Use contentId directly with the full Kakao scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeKakao(urlInfo.platformId),
            { operationName: `Kakao Page scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        case 'kakao_webtoon':
          // Use contentId with Kakao Webtoon scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeKakaoWebtoon(urlInfo.platformId),
            { operationName: `Kakao Webtoon scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        case 'manta':
          // Use seriesId with Manta scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeManta(urlInfo.platformId),
            { operationName: `Manta scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 1000 }
          )
          break

        case 'ridibooks':
          // Use bookId with Ridibooks scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeRidibooks(urlInfo.platformId),
            { operationName: `Ridibooks scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        case 'lezhin':
          // Use comic alias with Lezhin scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeLezhin(urlInfo.platformId),
            { operationName: `Lezhin scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 1000 }
          )
          break

        case 'bomtoon':
          // Use slug with Bomtoon scraper (with retry)
          scraperResult = await withRetry(
            () => scrapeBomtoon(urlInfo.platformId),
            { operationName: `Bomtoon scrape (${urlInfo.platformId})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        default:
          console.warn(`Unknown platform: ${urlInfo.platform}`)
          collectionErrors[sourceKey] = 'Unknown platform'
          hasErrors = true
          continue
      }

      // Rate limit: wait 3 seconds before next request
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      if (!scraperResult) {
        collectionErrors[sourceKey] = 'No data returned'
        hasErrors = true
        continue
      }

      // Capture first title for updating the intelligence_titles record
      // Try Korean title first, then English title (for platforms like Manta)
      if (!firstTitle && (scraperResult.data?.title_ko || scraperResult.data?.title_en)) {
        firstTitle = scraperResult.data.title_ko || scraperResult.data.title_en
      }

      // Step 3: Create or update intelligence_sources record
      const sourceUrl = urlInfo.originalUrl.startsWith('http')
        ? urlInfo.originalUrl
        : `https://${urlInfo.originalUrl}`

      // Determine region/language based on platform
      const isEnglishPlatform = urlInfo.platform === 'manta' || urlInfo.platform === 'lezhin'
      const region = isEnglishPlatform ? 'Global' : 'KR'
      const language = isEnglishPlatform ? 'en' : 'ko'

      const { data: sourceRecord, error: sourceError } = await supabase
        .from('intelligence_sources')
        .upsert({
          intelligence_title_id: intelligenceTitleId,
          domain: SOURCE_DOMAINS[urlInfo.platform] || urlInfo.platform,
          category: SOURCE_CATEGORIES[urlInfo.platform] || 'official_platform',
          url: sourceUrl,
          region: region,
          language: language,
          raw_meta: scraperResult,
        }, {
          onConflict: 'intelligence_title_id,url'
        })
        .select()
        .single()

      if (sourceError) {
        console.error(`[URL-based] Failed to create source record:`, sourceError)
        collectionErrors[sourceKey] = `Database error: ${sourceError.message}`
        hasErrors = true
        continue
      }

      // Step 4: Create intelligence_metrics snapshot
      const { error: metricsError } = await supabase
        .from('intelligence_metrics')
        .insert({
          intelligence_title_id: intelligenceTitleId,
          source_id: sourceRecord.id,
          snapshot_time: new Date().toISOString(),
          views: scraperResult.data?.views || null,
          subscribers: scraperResult.data?.subscribers || null,
          rating_score: scraperResult.data?.rating || null,
          rating_votes: null,
          favorites: scraperResult.data?.likes || null,
          episode_count: scraperResult.data?.chapters || null,
          status: scraperResult.data?.completed ? 'completed' : 'ongoing',
          age_rating: scraperResult.data?.age_rating || null,
          raw: scraperResult.data || {},
        })

      if (metricsError) {
        console.error(`[URL-based] Failed to create metrics:`, metricsError)
        // Non-fatal: source was created, just metrics failed
      }

      sourcesCreated.push(sourceKey)

    } catch (error) {
      console.error(`[URL-based] Error processing ${sourceKey}:`, error)
      collectionErrors[sourceKey] = error.message || 'Unknown error'
      hasErrors = true
    }
  }

  // Update intelligence title with discovered title name
  if (firstTitle) {
    await supabase
      .from('intelligence_titles')
      .update({ original_title_ko: firstTitle })
      .eq('id', intelligenceTitleId)
  }

  // Step 5: Process fan engagement sources (Reddit, AO3) if provided
  const fanEngagement = body.fanEngagement
  if (fanEngagement && fanEngagement.titleName && fanEngagement.sources?.length > 0) {
    console.log(`[URL-based] Processing fan engagement sources for: ${fanEngagement.titleName}`)

    // Use the discovered title or the provided title name for fan searches
    // Clean the title by removing Korean platform-specific suffixes that break search
    const rawTitle = firstTitle || fanEngagement.titleName
    const searchTitle = cleanTitleForFanSearch(rawTitle)

    for (const source of fanEngagement.sources) {
      try {
        console.log(`[Fan] Collecting from ${source} for: ${searchTitle}`)

        let scraperResult = null

        switch (source) {
          case 'reddit':
            // Reddit API has better rate limits, shorter retry delay
            scraperResult = await withRetry(
              () => scrapeReddit(searchTitle),
              { operationName: `Reddit scrape (${searchTitle})`, maxRetries: 2, baseDelayMs: 1000 }
            )
            break

          case 'ao3':
            // AO3 is community-run, be respectful with retry delays
            scraperResult = await withRetry(
              () => scrapeAO3(searchTitle),
              { operationName: `AO3 scrape (${searchTitle})`, maxRetries: 2, baseDelayMs: 1500 }
            )
            break

          case 'comick':
            // Comick.live fan translation aggregator
            scraperResult = await withRetry(
              () => scrapeComick(searchTitle),
              { operationName: `Comick scrape (${searchTitle})`, maxRetries: 2, baseDelayMs: 2000 }
            )
            break

          default:
            console.warn(`Unknown fan engagement source: ${source}`)
            collectionErrors[source] = 'Unknown source'
            hasErrors = true
            continue
        }

        if (!scraperResult) {
          collectionErrors[source] = 'No data returned'
          hasErrors = true
          continue
        }

        // Create source record for fan engagement
        const sourceUrl = `https://${SOURCE_DOMAINS[source]}/search?q=${encodeURIComponent(searchTitle)}`

        const { data: sourceRecord, error: sourceError } = await supabase
          .from('intelligence_sources')
          .upsert({
            intelligence_title_id: intelligenceTitleId,
            domain: SOURCE_DOMAINS[source] || source,
            category: SOURCE_CATEGORIES[source] || 'fandom_forum',
            url: sourceUrl,
            region: 'Global',
            language: 'en',
            raw_meta: scraperResult,
          }, {
            onConflict: 'intelligence_title_id,url'
          })
          .select()
          .single()

        if (sourceError) {
          console.error(`[Fan] Failed to create source record for ${source}:`, sourceError)
          collectionErrors[source] = `Database error: ${sourceError.message}`
          hasErrors = true
          continue
        }

        // Create metrics snapshot for fan engagement
        const { error: metricsError } = await supabase
          .from('intelligence_metrics')
          .insert({
            intelligence_title_id: intelligenceTitleId,
            source_id: sourceRecord.id,
            snapshot_time: new Date().toISOString(),
            views: scraperResult.data?.posts || scraperResult.data?.works || null,
            subscribers: scraperResult.data?.related_subreddit_subscribers || null,
            rating_score: scraperResult.data?.engagement_score || null,
            rating_votes: null,
            favorites: scraperResult.data?.total_kudos || scraperResult.data?.total_upvotes || null,
            episode_count: null,
            status: null,
            age_rating: null,
            raw: scraperResult.data || {},
          })

        if (metricsError) {
          console.error(`[Fan] Failed to create metrics for ${source}:`, metricsError)
          // Non-fatal
        }

        sourcesCreated.push(source)
        console.log(`[Fan] Successfully collected from ${source}`)

      } catch (error) {
        console.error(`[Fan] Error scraping ${source}:`, error)
        collectionErrors[source] = error.message || 'Unknown error'
        hasErrors = true
      }
    }
  }

  // Determine final status
  const finalStatus = hasErrors
    ? (sourcesCreated.length > 0 ? 'partial_success' : 'failed')
    : 'completed'

  return new Response(
    JSON.stringify({
      success: sourcesCreated.length > 0,
      intelligenceTitleId: intelligenceTitleId,
      status: finalStatus,
      sourcesCollected: sourcesCreated,
      errors: collectionErrors
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Note: scrapeNaverSeriesByUrl has been replaced by the imported scrapeNaverSeries

// Note: scrapeKakaoByUrl has been replaced by the imported scrapeKakao

/**
 * Handle legacy title name-based collection
 */
async function handleLegacyCollection(supabase: any, body: LegacyIntelligenceRequest) {
  const { titleNameInput, titleNameEn, sources, collectedBy, contentType } = body

  if (!titleNameInput || !sources || sources.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: titleNameInput, sources' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Step 1: Create or find intelligence_titles record
  const slug = generateSlug(titleNameInput, titleNameEn)

  // Check if title with similar slug exists
  const { data: existingTitle } = await supabase
    .from('intelligence_titles')
    .select('id, slug')
    .eq('slug', slug)
    .single()

  let intelligenceTitleId: string

  if (existingTitle) {
    // Use existing title
    intelligenceTitleId = existingTitle.id
    console.log(`Found existing intelligence title: ${existingTitle.slug}`)
  } else {
    // Create new intelligence title
    const { data: newTitle, error: createTitleError } = await supabase
      .from('intelligence_titles')
      .insert({
        original_title_ko: titleNameInput,
        original_title_en: titleNameEn || null,
        slug: slug + '-' + Date.now(),  // Ensure unique slug
        type: normalizeContentType(contentType),
        original_language: 'ko',
        primary_genres: [],
      })
      .select()
      .single()

    if (createTitleError) {
      console.error('Failed to create intelligence title:', createTitleError)
      return new Response(
        JSON.stringify({ error: 'Failed to create intelligence title' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    intelligenceTitleId = newTitle.id
    console.log(`Created new intelligence title: ${newTitle.slug}`)
  }

  // Step 2: Collect data from each source
  const sourcesCreated: string[] = []
  const collectionErrors: Record<string, string> = {}
  let hasErrors = false

  for (const source of sources) {
    try {
      console.log(`Collecting data from ${source}...`)

      let scraperResult = null

      switch (source) {
        case 'naver':
          scraperResult = await withRetry(
            () => scrapeNaver(titleNameInput),
            { operationName: `Naver legacy scrape (${titleNameInput})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          // Rate limit: wait 3 seconds before next request
          if (sources.indexOf(source) < sources.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
          break

        case 'kakao':
          scraperResult = await withRetry(
            () => scrapeKakao(titleNameInput),
            { operationName: `Kakao legacy scrape (${titleNameInput})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          // Rate limit: wait 3 seconds before next request
          if (sources.indexOf(source) < sources.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
          break

        case 'reddit':
          scraperResult = await withRetry(
            () => scrapeReddit(titleNameInput),
            { operationName: `Reddit legacy scrape (${titleNameInput})`, maxRetries: 2, baseDelayMs: 1000 }
          )
          break

        case 'ao3':
          scraperResult = await withRetry(
            () => scrapeAO3(titleNameInput),
            { operationName: `AO3 legacy scrape (${titleNameInput})`, maxRetries: 2, baseDelayMs: 1500 }
          )
          break

        case 'comick':
          scraperResult = await withRetry(
            () => scrapeComick(titleNameInput),
            { operationName: `Comick legacy scrape (${titleNameInput})`, maxRetries: 2, baseDelayMs: 2000 }
          )
          break

        default:
          console.warn(`Unknown source: ${source}`)
          collectionErrors[source] = 'Unknown source'
          hasErrors = true
          continue
      }

      if (!scraperResult) {
        collectionErrors[source] = 'No data returned'
        hasErrors = true
        continue
      }

      // Step 3: Create or update intelligence_sources record
      const sourceUrl = scraperResult.data?.platform_url || `https://${SOURCE_DOMAINS[source]}/search?q=${encodeURIComponent(titleNameInput)}`

      const { data: sourceRecord, error: sourceError } = await supabase
        .from('intelligence_sources')
        .upsert({
          intelligence_title_id: intelligenceTitleId,
          domain: SOURCE_DOMAINS[source] || source,
          category: SOURCE_CATEGORIES[source] || 'metadata_db',
          url: sourceUrl,
          region: source === 'naver' || source === 'kakao' ? 'KR' : 'Global',
          language: source === 'naver' || source === 'kakao' ? 'ko' : 'en',
          raw_meta: scraperResult,
        }, {
          onConflict: 'intelligence_title_id,url'
        })
        .select()
        .single()

      if (sourceError) {
        console.error(`Failed to create source record for ${source}:`, sourceError)
        collectionErrors[source] = `Database error: ${sourceError.message}`
        hasErrors = true
        continue
      }

      // Step 4: Create intelligence_metrics snapshot
      const { error: metricsError } = await supabase
        .from('intelligence_metrics')
        .insert({
          intelligence_title_id: intelligenceTitleId,
          source_id: sourceRecord.id,
          snapshot_time: new Date().toISOString(),
          views: scraperResult.data?.views || null,
          subscribers: scraperResult.data?.subscribers || null,
          rating_score: scraperResult.data?.rating || null,
          rating_votes: null,
          favorites: scraperResult.data?.likes || null,
          episode_count: scraperResult.data?.chapters || null,
          status: scraperResult.data?.completed ? 'completed' : 'ongoing',
          age_rating: scraperResult.data?.age_rating || null,
          raw: scraperResult.data || {},
        })

      if (metricsError) {
        console.error(`Failed to create metrics for ${source}:`, metricsError)
        // Non-fatal: source was created, just metrics failed
      }

      sourcesCreated.push(source)

    } catch (error) {
      console.error(`Error scraping ${source}:`, error)
      collectionErrors[source] = error.message || 'Unknown error'
      hasErrors = true
    }
  }

  // Determine final status
  const finalStatus = hasErrors
    ? (sourcesCreated.length > 0 ? 'partial_success' : 'failed')
    : 'completed'

  return new Response(
    JSON.stringify({
      success: sourcesCreated.length > 0,
      intelligenceTitleId: intelligenceTitleId,
      status: finalStatus,
      sourcesCollected: sourcesCreated,
      errors: collectionErrors
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin')
      .select('email, active')
      .eq('email', user.email.toLowerCase())
      .eq('active', true)
      .single()

    if (adminError || !adminProfile) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const body = await req.json()

    // Determine request type and process accordingly
    if (isUrlBasedRequest(body)) {
      // NEW: URL-based collection
      return await handleUrlBasedCollection(supabase, body)
    } else {
      // LEGACY: Title name-based collection
      return await handleLegacyCollection(supabase, body as LegacyIntelligenceRequest)
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
