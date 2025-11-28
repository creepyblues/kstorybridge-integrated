/**
 * Kakao Page Scraper
 *
 * Purpose: Scrape popularity metrics and metadata from Kakao Page
 *
 * Data Collected:
 * - views: Total view count (viewCount from serviceProperty)
 * - rating: Average rating (ratingSum / ratingCount)
 * - subscribers: Comment count as proxy
 * - chapters: Number of episodes (freeSlideCount + paid)
 * - completed: Is series completed (onIssue === 'End')
 * - platform_url: Direct URL to content
 * - last_updated: Last slide added date
 * - genre: Category + subcategory
 * - author: Author names
 * - synopsis_kr: Korean synopsis
 * - age_rating: Age rating
 *
 * Strategy (Updated 2024-11):
 * 1. PRIORITY: Extract __NEXT_DATA__ JSON from HTML (contains all SSR data)
 *    - This is the most reliable method as Kakao pre-renders data for SEO
 *    - Contains viewCount, ratingSum, ratingCount, authors, description, etc.
 * 2. FALLBACK: Extract og:meta tags (limited data)
 *
 * Rate Limiting: Caller must implement 3-second delay between requests
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
    seriesId: string | null
    title_ko: string | null
    title_en: string | null
    views: number | null
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
    category: string | null
    subcategory: string | null
    comment_count: number | null
  }
  metadata: {
    search_query: string
    scraping_method: string
    response_status: number | null
    error: string | null
  }
}

/**
 * Main scraper function for Kakao Page
 * Accepts either a seriesId or full URL
 */
export async function scrapeKakao(titleNameOrId: string): Promise<KakaoWebtoonData> {
  console.log(`[Kakao] Scraping for: ${titleNameOrId}`)

  const result: KakaoWebtoonData = {
    source: 'kakao',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      seriesId: null,
      title_ko: null,
      title_en: null,
      views: null,
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
      category: null,
      subcategory: null,
      comment_count: null
    },
    metadata: {
      search_query: titleNameOrId,
      scraping_method: 'next_data',
      response_status: null,
      error: null
    }
  }

  try {
    // Determine if input is a seriesId (numeric) or title name
    const seriesId = extractSeriesId(titleNameOrId)

    if (!seriesId) {
      console.log(`[Kakao] Could not extract seriesId from: ${titleNameOrId}`)
      result.metadata.error = 'Could not determine seriesId. Please provide a valid Kakao Page URL or numeric ID.'
      return result
    }

    console.log(`[Kakao] Using seriesId: ${seriesId}`)
    result.data.seriesId = seriesId
    result.data.platform_url = `https://page.kakao.com/content/${seriesId}`

    // Fetch HTML and extract __NEXT_DATA__
    const nextData = await fetchNextData(seriesId)

    if (nextData) {
      result.title_found = true
      result.metadata.response_status = 200
      result.metadata.scraping_method = 'next_data'

      // Extract metaInfo (basic info)
      const metaInfo = nextData.initialProps?.metaInfo
      if (metaInfo) {
        result.data.title_ko = metaInfo.ogTitle || metaInfo.title?.replace(' - 웹툰', '') || null
        result.data.synopsis_kr = metaInfo.description || null
        result.data.author = metaInfo.author || null

        // Extract thumbnail with proper URL
        if (metaInfo.image) {
          result.data.thumbnail = metaInfo.image.startsWith('//')
            ? `https:${metaInfo.image}`
            : metaInfo.image
        }
      }

      // Extract content data from dehydratedState queries
      const queries = nextData.initialProps?.dehydratedState?.queries
      if (queries && queries.length > 0) {
        // Find the contentHomeOverview query
        for (const query of queries) {
          const contentOverview = query.state?.data?.contentHomeOverview
          if (contentOverview) {
            const content = contentOverview.content
            if (content) {
              // Basic info
              result.data.title_ko = content.title || result.data.title_ko
              result.data.synopsis_kr = content.description || result.data.synopsis_kr
              result.data.author = content.authors || result.data.author
              result.data.category = content.category || null
              result.data.subcategory = content.subcategory || null

              // Genres array from category + subcategory
              const genres = []
              if (content.category) genres.push(content.category)
              if (content.subcategory) genres.push(content.subcategory)
              if (genres.length > 0) result.data.genre = genres

              // Age rating
              result.data.age_rating = content.ageGrade ? mapAgeGrade(content.ageGrade) : null

              // Completion status
              result.data.completed = content.onIssue === 'End'

              // Last updated
              if (content.lastSlideAddedDate) {
                result.data.last_updated = content.lastSlideAddedDate.split('T')[0]
              }

              // Chapters (freeSlideCount is visible, total might be more)
              if (content.freeSlideCount) {
                result.data.chapters = content.freeSlideCount
              }

              // Thumbnail
              if (content.landThumbnail || content.thumbnail) {
                const thumb = content.landThumbnail || content.thumbnail
                result.data.thumbnail = thumb.startsWith('//') ? `https:${thumb}` : thumb
              }

              // Service property metrics (views, rating, comments)
              const serviceProperty = content.serviceProperty
              if (serviceProperty) {
                // Views
                result.data.views = serviceProperty.viewCount || null

                // Rating calculation
                if (serviceProperty.ratingSum && serviceProperty.ratingCount) {
                  result.data.rating = Math.round((serviceProperty.ratingSum / serviceProperty.ratingCount) * 100) / 100
                  result.data.rating_count = serviceProperty.ratingCount
                }

                // Comment count as engagement metric
                result.data.comment_count = serviceProperty.commentCount || null
              }
            }
            break // Found contentHomeOverview, no need to continue
          }
        }
      }

      console.log(`[Kakao] __NEXT_DATA__ extraction successful:`, {
        title: result.data.title_ko,
        views: result.data.views,
        rating: result.data.rating,
        chapters: result.data.chapters,
        completed: result.data.completed
      })

      return result
    }

    // Fallback: Try og:meta tags from HTML
    console.log(`[Kakao] __NEXT_DATA__ extraction failed, trying og:meta fallback`)
    const metaData = await fetchOgMetaTags(seriesId)

    if (metaData && (metaData.title || metaData.description)) {
      result.title_found = true
      result.data.title_ko = metaData.title || null
      result.data.synopsis_kr = metaData.description || null
      result.data.thumbnail = metaData.image || null
      result.metadata.scraping_method = 'og_meta_tags'
      result.metadata.response_status = 200
    } else {
      result.metadata.error = 'Could not fetch content data from Kakao Page.'
      result.metadata.scraping_method = 'failed'
    }

  } catch (error) {
    console.error('[Kakao] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Extract seriesId from various input formats:
 * - Direct numeric ID: "63062046" or "4463"
 * - page.kakao.com URL: "https://page.kakao.com/content/63062046"
 * - webtoon.kakao.com URL: "https://webtoon.kakao.com/content/연습생/4463"
 * - URL with params: "https://page.kakao.com/content/63062046?tab=info"
 */
function extractSeriesId(input: string): string | null {
  const trimmed = input.trim()

  // Direct numeric ID (3-9 digits to support both platforms)
  if (/^\d{3,9}$/.test(trimmed)) {
    return trimmed
  }

  // page.kakao.com URL pattern: /content/63062046
  const pageKakaoMatch = trimmed.match(/page\.kakao\.com\/content\/(\d+)/)
  if (pageKakaoMatch) {
    return pageKakaoMatch[1]
  }

  // webtoon.kakao.com URL pattern: /content/{slug}/{id}
  // Example: /content/연습생/4463 or /content/%EC%97%B0%EC%8A%B5%EC%83%9D/4463
  const webtoonKakaoMatch = trimmed.match(/webtoon\.kakao\.com\/content\/[^/]+\/(\d+)/)
  if (webtoonKakaoMatch) {
    return webtoonKakaoMatch[1]
  }

  return null
}

/**
 * Fetch and parse __NEXT_DATA__ from the HTML page
 * This contains all the SSR data including metrics
 */
async function fetchNextData(seriesId: string): Promise<any | null> {
  console.log(`[Kakao] Fetching __NEXT_DATA__ for: ${seriesId}`)

  try {
    const url = `https://page.kakao.com/content/${seriesId}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Kakao] HTML fetch failed: ${response.status}`)
      return null
    }

    const html = await response.text()
    console.log(`[Kakao] HTML length: ${html.length}`)

    // Extract __NEXT_DATA__ JSON - use more robust extraction
    // Find the start and end of the script tag
    const startMarker = '<script id="__NEXT_DATA__" type="application/json">'
    const endMarker = '</script>'

    const startIndex = html.indexOf(startMarker)
    if (startIndex === -1) {
      console.log(`[Kakao] __NEXT_DATA__ start marker not found`)
      return null
    }

    const jsonStart = startIndex + startMarker.length
    const jsonEnd = html.indexOf(endMarker, jsonStart)
    if (jsonEnd === -1) {
      console.log(`[Kakao] __NEXT_DATA__ end marker not found`)
      return null
    }

    const jsonString = html.substring(jsonStart, jsonEnd)
    console.log(`[Kakao] __NEXT_DATA__ JSON length: ${jsonString.length}`)

    try {
      const nextData = JSON.parse(jsonString)
      const pageProps = nextData?.props?.pageProps

      if (pageProps) {
        console.log(`[Kakao] __NEXT_DATA__ parsed successfully`)

        // Log what we found for debugging
        const queries = pageProps.initialProps?.dehydratedState?.queries || []
        console.log(`[Kakao] Found ${queries.length} queries in dehydratedState`)

        return pageProps
      }

      console.log(`[Kakao] pageProps not found in __NEXT_DATA__`)
      return null
    } catch (parseError) {
      console.error(`[Kakao] Failed to parse __NEXT_DATA__:`, parseError)
      // Log first 500 chars of JSON for debugging
      console.log(`[Kakao] JSON preview: ${jsonString.substring(0, 500)}`)
      return null
    }

  } catch (error) {
    console.error('[Kakao] fetchNextData error:', error)
    return null
  }
}

/**
 * Fetch og:meta tags from the content page (fallback)
 */
async function fetchOgMetaTags(seriesId: string): Promise<{
  title?: string
  description?: string
  image?: string
} | null> {
  console.log(`[Kakao] Fetching og:meta tags for: ${seriesId}`)

  try {
    const url = `https://page.kakao.com/content/${seriesId}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Kakao] HTML fetch failed: ${response.status}`)
      return null
    }

    const html = await response.text()

    const result: { title?: string; description?: string; image?: string } = {}

    // Extract og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    if (titleMatch) {
      const title = decodeHTMLEntities(titleMatch[1])
      // Only use if it's content-specific (not generic "카카오페이지")
      if (title && title !== '카카오페이지' && !title.includes('콘텐츠홈')) {
        result.title = title
      }
    }

    // Extract og:description
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    if (descMatch) {
      const desc = decodeHTMLEntities(descMatch[1])
      // Only use if it's content-specific
      if (desc && !desc.includes('오리지널 독점 웹툰')) {
        result.description = desc
      }
    }

    // Extract og:image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (imageMatch) {
      let image = imageMatch[1]
      // Only use if it's content-specific (not generic ogImage.png)
      if (image && !image.includes('ogImage.png')) {
        // Ensure https prefix
        if (image.startsWith('//')) {
          image = `https:${image}`
        }
        result.image = image
      }
    }

    console.log(`[Kakao] Extracted og:meta:`, result)
    return Object.keys(result).length > 0 ? result : null

  } catch (error) {
    console.error('[Kakao] og:meta fetch error:', error)
    return null
  }
}

/**
 * Map Kakao age grade to readable format
 */
function mapAgeGrade(ageGrade: string): string {
  const mapping: Record<string, string> = {
    'All': '전체이용가',
    'ALL': '전체이용가',
    'Twelve': '12세이용가',
    'TWELVE': '12세이용가',
    'Fifteen': '15세이용가',
    'FIFTEEN': '15세이용가',
    'Eighteen': '18세이용가',
    'EIGHTEEN': '18세이용가',
    'Nineteen': '19세이용가',
    'NINETEEN': '19세이용가',
  }
  return mapping[ageGrade] || ageGrade
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

/**
 * Helper: Parse Korean number format
 * Examples:
 * - "1.5만" -> 15000
 * - "50만" -> 500000
 * - "1.2억" -> 120000000
 * - "120" -> 120
 */
export function parseKoreanNumber(text: string): number | null {
  if (!text) return null

  try {
    // Remove commas and spaces
    text = text.replace(/[,\s]/g, '')

    // Handle 억 (100,000,000) suffix
    if (text.includes('억')) {
      const num = parseFloat(text.replace('억', ''))
      return Math.round(num * 100000000)
    }

    // Handle 만 (10,000) suffix
    if (text.includes('만')) {
      const num = parseFloat(text.replace('만', ''))
      return Math.round(num * 10000)
    }

    // Plain number
    return parseInt(text, 10)

  } catch (error) {
    console.error('Failed to parse Korean number:', text, error)
    return null
  }
}
