/**
 * Bomtoon Scraper
 *
 * Purpose: Scrape popularity metrics and metadata from Bomtoon
 *
 * Data Collected:
 * - title_ko: Korean title
 * - author: Author/creator name
 * - artist: Artist name (same as author for this platform)
 * - synopsis_kr: Korean synopsis/description
 * - thumbnail: Cover image URL
 * - genre: Categories/genres
 * - views: View count
 * - likes: Like count
 * - chapters: Episode count
 * - completed: Series completion status
 * - tags: Keywords (판타지, 드라마, 공포·스릴러, etc.)
 * - platform_url: Direct URL to content
 *
 * Strategy:
 * 1. Fetch HTML and extract embedded JSON data
 * 2. Parse JSON for structured data
 * 3. Extract from og:meta tags as supplement
 *
 * Rate Limiting: Caller must implement 3-second delay between requests
 */

// Headers that mimic a Korean browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

interface BomtoonData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    slug: string | null
    title_ko: string | null
    title_en: string | null
    views: number | null
    likes: number | null
    rating: number | null
    rating_count: number | null
    subscribers: number | null
    chapters: number | null
    completed: boolean | null
    platform_url: string | null
    last_updated: string | null
    genre: string[] | null
    author: string | null
    artist: string | null
    synopsis_kr: string | null
    age_rating: string | null
    thumbnail: string | null
    tags: string[]
  }
  metadata: {
    search_query: string
    scraping_method: string
    response_status: number | null
    error: string | null
  }
}

/**
 * Main scraper function for Bomtoon
 * Accepts a slug or full URL
 */
export async function scrapeBomtoon(slugOrUrl: string): Promise<BomtoonData> {
  console.log(`[Bomtoon] Scraping for: ${slugOrUrl}`)

  const result: BomtoonData = {
    source: 'bomtoon',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      slug: null,
      title_ko: null,
      title_en: null,
      views: null,
      likes: null,
      rating: null,
      rating_count: null,
      subscribers: null,
      chapters: null,
      completed: null,
      platform_url: null,
      last_updated: null,
      genre: null,
      author: null,
      artist: null,
      synopsis_kr: null,
      age_rating: null,
      thumbnail: null,
      tags: [],
    },
    metadata: {
      search_query: slugOrUrl,
      scraping_method: 'unknown',
      response_status: null,
      error: null
    }
  }

  try {
    // Extract slug from input
    const slug = extractSlug(slugOrUrl)

    if (!slug) {
      console.log(`[Bomtoon] Could not extract slug from: ${slugOrUrl}`)
      result.metadata.error = 'Could not determine slug. Please provide a valid Bomtoon URL or slug.'
      return result
    }

    console.log(`[Bomtoon] Using slug: ${slug}`)
    result.data.slug = slug
    result.data.platform_url = `https://www.bomtoon.com/detail/${slug}`

    // Fetch HTML — /detail/ is the current canonical path. The legacy
    // /comic/ep_list/{slug} URL still resolves to the same SPA shell, but
    // /detail/ is what bomtoon.com currently redirects users to.
    const url = `https://www.bomtoon.com/detail/${slug}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Bomtoon] HTML fetch failed: ${response.status}`)
      result.metadata.response_status = response.status
      result.metadata.error = `HTTP ${response.status}`
      return result
    }

    result.metadata.response_status = 200
    const html = await response.text()
    console.log(`[Bomtoon] HTML length: ${html.length}`)

    // Extract data using multiple methods
    let dataExtracted = false

    // Method 1: Extract from embedded JSON data (most reliable)
    dataExtracted = extractFromEmbeddedJson(html, result)
    if (dataExtracted) {
      result.metadata.scraping_method = 'embedded_json'
      console.log(`[Bomtoon] Extracted from embedded JSON`)
    }

    // Method 2: Try HTML parsing for views/likes
    extractFromHtmlContent(html, result)

    // Method 3: Try og:meta tags to supplement
    extractFromOgMeta(html, result)

    // Check if we got any meaningful data
    result.title_found = !!(result.data.title_ko || result.data.synopsis_kr || result.data.thumbnail)

    if (!result.title_found) {
      result.metadata.error = 'Could not extract content data from Bomtoon page'
      result.metadata.scraping_method = 'failed'
    }

    console.log(`[Bomtoon] Extraction result:`, {
      title: result.data.title_ko,
      author: result.data.author,
      views: result.data.views,
      likes: result.data.likes,
      chapters: result.data.chapters,
      completed: result.data.completed,
      hasSynopsis: !!result.data.synopsis_kr,
      hasThumbnail: !!result.data.thumbnail,
      tagsCount: result.data.tags.length,
      method: result.metadata.scraping_method
    })

  } catch (error) {
    console.error('[Bomtoon] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Extract slug from various input formats
 */
function extractSlug(input: string): string | null {
  const trimmed = input.trim()

  // Direct slug (no slashes, no URL)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed
  }

  // bomtoon.com URL — accept both current /detail/{slug} and legacy
  // /comic/ep_list/{slug} paths. Query strings (e.g. ?porch=tw1386) are
  // ignored since they're tracking-only and don't affect content lookup.
  const bomtoonMatch = trimmed.match(/bomtoon\.com\/(?:detail|comic\/ep_list)\/([^/?#]+)/)
  if (bomtoonMatch) {
    return bomtoonMatch[1]
  }

  return null
}

/**
 * Extract data from Bomtoon's embedded __NEXT_DATA__.
 *
 * Bomtoon's /detail/ pages are a Next.js SPA shell; the only server-side
 * payload with real content data is __NEXT_DATA__.props.pageProps.openGraphData,
 * which carries title / synopsis / creators / tags / isAdult / etc.
 *
 * (Prior implementation scraped these via raw regex over the HTML; that was
 * brittle because string values containing escaped quotes or commas could
 * break the patterns. Parsing the JSON properly is more reliable.)
 */
function extractFromEmbeddedJson(html: string, result: BomtoonData): boolean {
  let extracted = false

  const startMarker = '<script id="__NEXT_DATA__" type="application/json">'
  const endMarker = '</script>'
  const startIdx = html.indexOf(startMarker)
  if (startIdx === -1) {
    console.log(`[Bomtoon] __NEXT_DATA__ not found`)
    return false
  }
  const jsonStart = startIdx + startMarker.length
  const jsonEnd = html.indexOf(endMarker, jsonStart)
  if (jsonEnd === -1) return false

  let nextData: any
  try {
    nextData = JSON.parse(html.substring(jsonStart, jsonEnd))
  } catch (err) {
    console.log(`[Bomtoon] __NEXT_DATA__ parse error:`, err)
    return false
  }

  const pageProps = nextData?.props?.pageProps
  if (!pageProps) return false

  const og = pageProps.openGraphData || {}

  // Title — strip "(완결)" suffix and use it as a completion signal.
  const rawTitle: string | undefined = og.title || pageProps.title
  if (rawTitle && typeof rawTitle === 'string') {
    let title = rawTitle
    if (title.includes('(완결)')) {
      result.data.completed = true
      title = title.replace('(완결)', '').trim()
    }
    result.data.title_ko = title
    extracted = true
  }

  // Creators string — comma-separated for multi-author works (e.g.
  // "징망츄, 사앙"). First entry → author, second → artist.
  if (typeof og.creators === 'string' && og.creators.trim()) {
    const names = og.creators
      .split(',')
      .map((n: string) => n.trim())
      .filter((n: string) => n.length > 0)
    if (names[0]) {
      result.data.author = names[0]
      extracted = true
    }
    if (names[1]) {
      result.data.artist = names[1]
      extracted = true
    } else if (names[0]) {
      // Single creator — mirror to artist (same person does both, common
      // on this platform).
      result.data.artist = names[0]
    }
  }

  // Synopsis — comes from openGraphData.synopsis (NOT the og:description
  // meta tag, which is a generic platform tagline).
  if (typeof og.synopsis === 'string' && og.synopsis.trim()) {
    result.data.synopsis_kr = og.synopsis
    extracted = true
  }

  // Tags / genre — comma-separated list, first 3 entries form the genre
  // hint (e.g. "BL,현대물,캠퍼스물").
  if (typeof og.tags === 'string' && og.tags.trim()) {
    const tags = og.tags
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
    if (tags.length > 0) {
      result.data.tags = tags
      result.data.genre = tags.slice(0, 3)
      extracted = true
    }
  }

  // Age rating — isAdult flag → 19세이용가.
  if (og.isAdult === true) {
    result.data.age_rating = '19세이용가'
    extracted = true
  }

  // Thumbnail — when openGraphData.thumbnail is populated, prefer it
  // (more specific than og:image meta which often falls back to a generic
  // platform banner on this site).
  if (typeof og.thumbnail === 'string' && og.thumbnail.trim()) {
    let image = og.thumbnail.trim()
    if (image.startsWith('//')) image = `https:${image}`
    // Remove size suffix (^m, ^s, etc.) for full size when present
    image = image.replace(/\^[a-z]\./, '.')
    result.data.thumbnail = image
    extracted = true
  }

  // Free episode count is exposed at the top level on /detail/ pages; we
  // store it as chapters when no better total is available.
  const freeCount =
    typeof pageProps.countOfFreeEpisodes === 'number' ? pageProps.countOfFreeEpisodes :
    typeof og.countOfFreeEpisodes === 'number' ? og.countOfFreeEpisodes : null
  if (freeCount !== null && freeCount > 0 && !result.data.chapters) {
    result.data.chapters = freeCount
    extracted = true
  }

  return extracted
}

/**
 * Extract data from HTML content using patterns
 */
function extractFromHtmlContent(html: string, result: BomtoonData): boolean {
  let extracted = false

  // Views: "조회수 13,000" or "13000회" or "조회 13000"
  if (!result.data.views) {
    const viewsMatch = html.match(/조회(?:수)?\s*[:\s]*(\d[\d,]+)/) ||
                       html.match(/(\d[\d,]+)\s*회\s*조회/) ||
                       html.match(/>(\d[\d,]+)<\/[^>]+>\s*조회/)
    if (viewsMatch) {
      const views = parseInt(viewsMatch[1].replace(/,/g, ''), 10)
      if (!isNaN(views)) {
        result.data.views = views
        extracted = true
      }
    }
  }

  // Likes: "좋아요 130" or heart icon count
  if (!result.data.likes) {
    const likesMatch = html.match(/좋아요\s*[:\s]*(\d[\d,]+)/) ||
                       html.match(/>(\d[\d,]+)<\/[^>]+>\s*(?:좋아요|♥|❤)/)
    if (likesMatch) {
      const likes = parseInt(likesMatch[1].replace(/,/g, ''), 10)
      if (!isNaN(likes)) {
        result.data.likes = likes
        extracted = true
      }
    }
  }

  // Chapters: "총 XX화" or "전XX화"
  if (!result.data.chapters) {
    const chaptersMatch = html.match(/총\s*(\d+)\s*화/) ||
                          html.match(/전\s*(\d+)\s*화/) ||
                          html.match(/(\d+)\s*화\s*(?:완결|연재)/)
    if (chaptersMatch) {
      const chapters = parseInt(chaptersMatch[1], 10)
      if (!isNaN(chapters)) {
        result.data.chapters = chapters
        extracted = true
      }
    }
  }

  // Completed status if not already set
  if (result.data.completed === null) {
    if (html.includes('완결') || html.includes('완결작')) {
      result.data.completed = true
    } else if (html.includes('연재중') || html.includes('연재 중')) {
      result.data.completed = false
    }
  }

  return extracted
}

/**
 * Extract data from Open Graph meta tags
 */
function extractFromOgMeta(html: string, result: BomtoonData): boolean {
  let extracted = false

  // og:title - only if not already set
  if (!result.data.title_ko) {
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i)
    if (titleMatch) {
      let title = decodeHTMLEntities(titleMatch[1])
      // Clean up platform suffix
      title = title.replace(/\s*[-|]\s*봄툰.*$/i, '').trim()
      if (title) {
        result.data.title_ko = title
        extracted = true
      }
    }
  }

  // og:description - only if not already set, and only if it looks
  // content-specific. Bomtoon's static <meta og:description> is the
  // generic platform tagline (e.g. "순정, 로맨스, BL 장르가 가득한 여성
  // 독자를 위한 프리미엄 웹툰") — storing that as synopsis would be wrong.
  if (!result.data.synopsis_kr) {
    const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/i)
    if (descMatch) {
      const desc = decodeHTMLEntities(descMatch[1])
      const isGenericTagline = desc.includes('프리미엄 웹툰') || desc.includes('여성 독자')
      if (desc && !isGenericTagline) {
        result.data.synopsis_kr = desc
        extracted = true
      }
    }
  }

  // og:image - only if not already set, and only if it's not the generic
  // platform banner (meta-image.jpg). Bomtoon's per-title cover lives in
  // openGraphData.thumbnail when populated; the meta tag is shared fallback.
  if (!result.data.thumbnail) {
    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i)
    if (imageMatch) {
      let image = imageMatch[1]
      if (image.includes('meta-image') || image.includes('common/')) {
        // generic platform banner — skip
      } else {
        if (image.startsWith('//')) image = `https:${image}`
        result.data.thumbnail = image
        extracted = true
      }
    }
  }

  return extracted
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  if (!text) return ''

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim()
}
