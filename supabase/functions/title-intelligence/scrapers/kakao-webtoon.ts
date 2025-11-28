/**
 * Kakao Webtoon Scraper (webtoon.kakao.com)
 *
 * Purpose: Scrape popularity metrics and metadata from Kakao Webtoon
 * Note: This is a DIFFERENT site from page.kakao.com
 *
 * Data Collected:
 * - views: Total view count (viewCount)
 * - likes: Total like count (likeCount)
 * - genre: Genre category
 * - author: Author names
 * - synopsis_kr: Korean synopsis
 * - thumbnail: Image URL
 *
 * Strategy:
 * 1. Fetch HTML from webtoon.kakao.com
 * 2. Extract __NEXT_DATA__ JSON
 * 3. Parse contentMap from initialState.content
 *
 * URL Format: https://webtoon.kakao.com/content/{slug}/{id}
 */

// Headers that mimic a Korean browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
}

interface KakaoWebtoonData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    contentId: string | null
    title_ko: string | null
    title_en: string | null
    views: number | null
    likes: number | null
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
  }
  metadata: {
    search_query: string
    scraping_method: string
    response_status: number | null
    error: string | null
  }
}

/**
 * Main scraper function for Kakao Webtoon (webtoon.kakao.com)
 * Accepts a content ID
 */
export async function scrapeKakaoWebtoon(contentId: string): Promise<KakaoWebtoonData> {
  console.log(`[KakaoWebtoon] Scraping for contentId: ${contentId}`)

  const result: KakaoWebtoonData = {
    source: 'kakao_webtoon',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      contentId: contentId,
      title_ko: null,
      title_en: null,
      views: null,
      likes: null,
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
      tags: []
    },
    metadata: {
      search_query: contentId,
      scraping_method: 'next_data',
      response_status: null,
      error: null
    }
  }

  try {
    // We need to fetch the page with the slug, but we only have the ID
    // Try fetching with a placeholder slug - it redirects to correct URL
    const url = `https://webtoon.kakao.com/content/_/${contentId}`
    console.log(`[KakaoWebtoon] Fetching: ${url}`)

    const response = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow'
    })

    if (!response.ok) {
      console.error(`[KakaoWebtoon] HTTP error: ${response.status}`)
      result.metadata.error = `HTTP error: ${response.status}`
      result.metadata.response_status = response.status
      return result
    }

    result.metadata.response_status = response.status
    result.data.platform_url = response.url

    const html = await response.text()
    console.log(`[KakaoWebtoon] HTML length: ${html.length}`)

    // Extract __NEXT_DATA__ JSON
    const startMarker = '<script id="__NEXT_DATA__" type="application/json">'
    const endMarker = '</script>'

    const startIndex = html.indexOf(startMarker)
    if (startIndex === -1) {
      console.log(`[KakaoWebtoon] __NEXT_DATA__ not found`)
      result.metadata.error = '__NEXT_DATA__ not found'
      result.metadata.scraping_method = 'failed'
      return result
    }

    const jsonStart = startIndex + startMarker.length
    const jsonEnd = html.indexOf(endMarker, jsonStart)
    if (jsonEnd === -1) {
      console.log(`[KakaoWebtoon] __NEXT_DATA__ end marker not found`)
      result.metadata.error = '__NEXT_DATA__ end marker not found'
      result.metadata.scraping_method = 'failed'
      return result
    }

    const jsonString = html.substring(jsonStart, jsonEnd)
    console.log(`[KakaoWebtoon] JSON length: ${jsonString.length}`)

    const nextData = JSON.parse(jsonString)

    // Extract content from initialState.content.contentMap
    const contentMap = nextData?.props?.initialState?.content?.contentMap
    if (!contentMap) {
      console.log(`[KakaoWebtoon] contentMap not found`)
      result.metadata.error = 'contentMap not found in __NEXT_DATA__'
      return result
    }

    // Find content by ID (contentMap keys are string IDs)
    const content = contentMap[contentId] || contentMap[String(contentId)]
    if (!content) {
      console.log(`[KakaoWebtoon] Content not found for ID: ${contentId}`)
      result.metadata.error = `Content not found for ID: ${contentId}`
      return result
    }

    // Extract data from content object
    result.title_found = true
    result.data.title_ko = content.title || null
    result.data.synopsis_kr = content.synopsis || null
    result.data.author = content.authors || null
    result.data.views = content.viewCount || null
    result.data.likes = content.likeCount || null

    // Genre
    if (content.genre) {
      result.data.genre = [content.genre]
    }

    // Thumbnail
    if (content.mainImg) {
      result.data.thumbnail = content.mainImg.startsWith('//')
        ? `https:${content.mainImg}`
        : content.mainImg
    } else if (content.shareImg) {
      result.data.thumbnail = content.shareImg.startsWith('//')
        ? `https:${content.shareImg}`
        : content.shareImg
    }

    // Platform URL from response or construct it
    if (!result.data.platform_url && content.sid) {
      result.data.platform_url = `https://webtoon.kakao.com/content/${encodeURIComponent(content.sid)}/${contentId}`
    }

    // Completion status
    result.data.completed = content.isStopContent || false

    // Author details (more structured)
    if (content.authorDetails && Array.isArray(content.authorDetails)) {
      const authorEntry = content.authorDetails.find((a: any) => a.type === 'author')
      const illustratorEntry = content.authorDetails.find((a: any) => a.type === 'illustrator')

      if (authorEntry?.names?.length > 0) {
        result.data.author = authorEntry.names.join(', ')
      }
      if (illustratorEntry?.names?.length > 0) {
        result.data.artist = illustratorEntry.names.join(', ')
      }
    }

    console.log(`[KakaoWebtoon] Extracted:`, {
      title: result.data.title_ko,
      views: result.data.views,
      likes: result.data.likes,
      genre: result.data.genre,
      author: result.data.author
    })

    return result

  } catch (error) {
    console.error('[KakaoWebtoon] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
    return result
  }
}

/**
 * Extract content ID from webtoon.kakao.com URL
 * URL format: https://webtoon.kakao.com/content/{slug}/{id}
 */
export function extractKakaoWebtoonId(url: string): string | null {
  const match = url.match(/webtoon\.kakao\.com\/content\/[^/]+\/(\d+)/)
  return match ? match[1] : null
}
