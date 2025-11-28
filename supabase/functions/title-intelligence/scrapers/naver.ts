/**
 * Naver Webtoon Scraper
 *
 * Purpose: Scrape popularity metrics and metadata from Naver Webtoon
 *
 * Data Collected:
 * - views: Total view count (not available via API)
 * - rating: Average rating (calculated from episode ratings)
 * - subscribers: Subscriber/favorite count (favoriteCount)
 * - chapters: Number of episodes (totalCount)
 * - completed: Is series completed (finished)
 * - platform_url: Direct URL to webtoon
 * - last_updated: Last episode publication date
 *
 * Strategy (Updated 2024-11):
 * 1. PRIORITY: Use official Naver API endpoints (works for ALL webtoons including challenge)
 *    - /api/article/list/info - Title metadata, favorite count, author, genres
 *    - /api/article/list - Episode list with ratings and counts
 * 2. FALLBACK: og:meta tags extraction
 *
 * Rate Limiting: Caller must implement 3-second delay between requests
 *
 * Note: Naver APIs work for both official webtoons and challenge/best challenge webtoons
 */

// Official Naver API endpoints
const NAVER_API_BASE = 'https://comic.naver.com/api'

// Unofficial API for search (finding titleId by name)
const NOMAD_API_BASE = 'https://webtoon-crawler.nomadcoders.workers.dev'

// User agent that mimics a Korean browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
}

interface NaverWebtoonData {
  source: string
  scraped_at: string
  title_found: boolean
  search_results_count: number
  data: {
    titleId: string | null
    title_ko: string | null
    title_en: string | null
    views: number | null
    rating: number | null
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
    webtoon_type: string | null  // 'WEBTOON' | 'BEST_CHALLENGE' | 'CHALLENGE'
  }
  metadata: {
    search_query: string
    scraping_method: string
    response_status: number | null
    error: string | null
  }
}

/**
 * Main scraper function
 */
export async function scrapeNaver(titleName: string): Promise<NaverWebtoonData> {
  console.log(`[Naver] Scraping for: ${titleName}`)

  const result: NaverWebtoonData = {
    source: 'naver',
    scraped_at: new Date().toISOString(),
    title_found: false,
    search_results_count: 0,
    data: {
      titleId: null,
      title_ko: null,
      title_en: null,
      views: null,
      rating: null,
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
      webtoon_type: null
    },
    metadata: {
      search_query: titleName,
      scraping_method: 'naver_official_api',
      response_status: null,
      error: null
    }
  }

  try {
    // Step 1: Get titleId (either direct input or search)
    const titleId = await findTitleIdByName(titleName)

    if (!titleId) {
      console.log(`[Naver] No titleId found for: ${titleName}`)
      result.metadata.error = 'Title not found in Naver Webtoon catalog'
      return result
    }

    console.log(`[Naver] Found titleId: ${titleId}`)
    result.search_results_count = 1
    result.data.titleId = titleId
    result.data.platform_url = `https://comic.naver.com/webtoon/list?titleId=${titleId}`

    // Step 2: Fetch title info from official Naver API
    const titleInfo = await fetchNaverTitleInfo(titleId)

    if (titleInfo) {
      result.title_found = true
      result.metadata.response_status = 200

      // Extract data from title info
      result.data.title_ko = titleInfo.titleName || null
      result.data.synopsis_kr = titleInfo.synopsis || null
      result.data.subscribers = titleInfo.favoriteCount || null
      result.data.completed = titleInfo.finished || false
      result.data.thumbnail = titleInfo.posterThumbnailUrl || titleInfo.thumbnailUrl || null
      result.data.webtoon_type = titleInfo.webtoonLevelCode || null

      // Extract genres
      if (titleInfo.genres && Array.isArray(titleInfo.genres)) {
        result.data.genre = titleInfo.genres.map((g: any) => g.description || g.type)
      }

      // Extract tags (challenge webtoons have challengeTagList)
      if (titleInfo.challengeTagList && Array.isArray(titleInfo.challengeTagList)) {
        result.data.tags = titleInfo.challengeTagList.map((t: string) => t.replace(/^#/, ''))
      }

      // Extract age rating
      if (titleInfo.age) {
        result.data.age_rating = titleInfo.age.description || titleInfo.age.type || null
      }

      // Extract author info
      if (titleInfo.communityArtists && titleInfo.communityArtists.length > 0) {
        result.data.author = titleInfo.communityArtists[0].name || null
        // If multiple artists, could be different roles
        const writers = titleInfo.communityArtists.filter((a: any) =>
          a.artistTypeList?.includes('ARTIST_WRITER'))
        const painters = titleInfo.communityArtists.filter((a: any) =>
          a.artistTypeList?.includes('ARTIST_PAINTER'))

        if (writers.length > 0) {
          result.data.author = writers[0].name
        }
        if (painters.length > 0 && painters[0].name !== result.data.author) {
          result.data.artist = painters[0].name
        }
      }
    }

    // Step 3: Fetch episode list from official Naver API (for episode count and ratings)
    const episodeInfo = await fetchNaverEpisodeList(titleId)

    if (episodeInfo) {
      result.data.chapters = episodeInfo.totalCount || null

      // Calculate average rating from episode ratings
      if (episodeInfo.averageRating !== null) {
        result.data.rating = episodeInfo.averageRating
      }

      // Get last update date from most recent episode
      if (episodeInfo.lastUpdateDate) {
        result.data.last_updated = episodeInfo.lastUpdateDate
      }
    }

    // Fallback: If official API didn't work, try og:meta
    if (!result.title_found) {
      console.log(`[Naver] Official API failed, trying og:meta fallback`)
      const metaData = await fetchOgMetaTags(titleId)
      if (metaData && (metaData.title || metaData.description)) {
        result.data.title_ko = metaData.title || result.data.title_ko
        result.data.synopsis_kr = metaData.description || result.data.synopsis_kr
        result.data.thumbnail = metaData.image || result.data.thumbnail
        result.title_found = true
        result.metadata.scraping_method = 'og_meta_tags'
        result.metadata.response_status = 200
      }
    }

  } catch (error) {
    console.error('[Naver] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Find titleId by searching through the available webtoons
 * Uses fuzzy matching on the today's webtoons list
 */
async function findTitleIdByName(titleName: string): Promise<string | null> {
  console.log(`[Naver] Searching for titleId: ${titleName}`)

  // PRIORITY 1: If input looks like a direct titleId (6-7 digits), use it directly
  // This allows users to bypass search by entering the titleId from the URL
  if (/^\d{6,7}$/.test(titleName.trim())) {
    console.log(`[Naver] Input is a direct titleId, using: ${titleName}`)
    return titleName.trim()
  }

  // Normalize search string for title matching
  const normalizedSearch = titleName.toLowerCase().trim()
    .replace(/\s+/g, '')  // Remove all spaces for Korean matching

  try {
    // PRIORITY 2: Try to find in today's webtoons list (unofficial API)
    const response = await fetch(`${NOMAD_API_BASE}/today`)
    if (!response.ok) {
      console.error(`[Naver] Failed to fetch today's list: ${response.status}`)
      // Don't return null here - fall through to other methods
    } else {
      const webtoons: Array<{ id: string; title: string; thumb: string }> = await response.json()

      // Try exact match first
      for (const webtoon of webtoons) {
        const normalizedTitle = webtoon.title.toLowerCase().trim().replace(/\s+/g, '')
        if (normalizedTitle === normalizedSearch) {
          console.log(`[Naver] Exact match found: ${webtoon.title} (${webtoon.id})`)
          return webtoon.id
        }
      }

      // Try partial match
      for (const webtoon of webtoons) {
        const normalizedTitle = webtoon.title.toLowerCase().trim().replace(/\s+/g, '')
        if (normalizedTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedTitle)) {
          console.log(`[Naver] Partial match found: ${webtoon.title} (${webtoon.id})`)
          return webtoon.id
        }
      }

      console.log(`[Naver] No match found in today's webtoons (${webtoons.length} checked)`)
    }

    // PRIORITY 3: No match found
    console.log(`[Naver] Title not found: ${titleName}`)
    return null

  } catch (error) {
    console.error('[Naver] Search error:', error)
    return null
  }
}

/**
 * Fetch title info from official Naver API
 * Works for ALL webtoon types: official, best challenge, challenge
 */
async function fetchNaverTitleInfo(titleId: string): Promise<any | null> {
  console.log(`[Naver] Fetching title info from official API: ${titleId}`)

  try {
    const url = `${NAVER_API_BASE}/article/list/info?titleId=${titleId}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Naver] Official API failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    console.log(`[Naver] Official API title info:`, {
      titleName: data.titleName,
      webtoonLevelCode: data.webtoonLevelCode,
      favoriteCount: data.favoriteCount,
      finished: data.finished,
      genreCount: data.genres?.length,
      tagsCount: data.challengeTagList?.length
    })

    return data

  } catch (error) {
    console.error('[Naver] Official API error:', error)
    return null
  }
}

/**
 * Fetch episode list from official Naver API
 * Returns episode count and calculated average rating
 */
async function fetchNaverEpisodeList(titleId: string): Promise<{
  totalCount: number
  averageRating: number | null
  lastUpdateDate: string | null
} | null> {
  console.log(`[Naver] Fetching episode list from official API: ${titleId}`)

  try {
    const url = `${NAVER_API_BASE}/article/list?titleId=${titleId}&page=1&sort=DESC`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Naver] Episode list API failed: ${response.status}`)
      return null
    }

    const data = await response.json()

    const result = {
      totalCount: data.totalCount || 0,
      averageRating: null as number | null,
      lastUpdateDate: null as string | null
    }

    // Calculate average rating from all episodes
    if (data.articleList && data.articleList.length > 0) {
      const ratings = data.articleList
        .filter((ep: any) => ep.starScore && ep.starScore > 0)
        .map((ep: any) => ep.starScore)

      if (ratings.length > 0) {
        const sum = ratings.reduce((a: number, b: number) => a + b, 0)
        result.averageRating = Math.round((sum / ratings.length) * 100) / 100
      }

      // Get last update date from most recent episode (sorted DESC, so first item)
      const firstEpisode = data.articleList[0]
      if (firstEpisode?.serviceDateDescription) {
        // Convert "25.11.26" to ISO date
        const dateStr = firstEpisode.serviceDateDescription
        const parts = dateStr.split('.')
        if (parts.length === 3) {
          const year = parseInt(parts[0]) + 2000  // Assuming 20xx
          const month = parts[1].padStart(2, '0')
          const day = parts[2].padStart(2, '0')
          result.lastUpdateDate = `${year}-${month}-${day}`
        }
      }
    }

    console.log(`[Naver] Episode list result:`, result)
    return result

  } catch (error) {
    console.error('[Naver] Episode list API error:', error)
    return null
  }
}

/**
 * Fetch og:meta tags from the detail page (fallback)
 */
async function fetchOgMetaTags(titleId: string): Promise<{
  title?: string
  description?: string
  image?: string
} | null> {
  console.log(`[Naver] Fetching og:meta tags for: ${titleId}`)

  try {
    const url = `https://comic.naver.com/webtoon/list?titleId=${titleId}`
    const response = await fetch(url, {
      headers: {
        ...HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })

    if (!response.ok) {
      console.error(`[Naver] Detail page fetch failed: ${response.status}`)
      return null
    }

    const html = await response.text()

    const result: { title?: string; description?: string; image?: string } = {}

    // Extract og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    if (titleMatch) {
      result.title = decodeHTMLEntities(titleMatch[1])
    }

    // Extract og:description
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    if (descMatch) {
      result.description = decodeHTMLEntities(descMatch[1])
    }

    // Extract og:image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (imageMatch) {
      result.image = imageMatch[1]
    }

    console.log(`[Naver] Extracted og:meta:`, result)
    return result

  } catch (error) {
    console.error('[Naver] og:meta fetch error:', error)
    return null
  }
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
