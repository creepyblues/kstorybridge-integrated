/**
 * Naver Series Scraper
 *
 * Purpose: Scrape popularity metrics and metadata from Naver Series (comic/novel platform)
 *
 * Data Collected:
 * - views: Not directly available (using downloads/favorites as proxy)
 * - rating: Average rating (from score_area)
 * - subscribers: Download/favorite count (btn_download)
 * - chapters: Number of episodes (end_total_episode)
 * - completed: Is series completed (완결 in status or og:description)
 * - platform_url: Direct URL to content
 * - genre: Genre from info section
 * - author: Writer/Artist from info section
 * - synopsis_kr: Korean synopsis
 * - age_rating: Age rating
 * - comment_count: Comment count
 *
 * Strategy:
 * 1. PRIORITY: Extract from HTML structure (server-side rendered)
 *    - score_area for rating
 *    - end_total_episode for chapter count
 *    - btn_download for favorites/downloads
 *    - commentCount for comments
 *    - end_info for metadata (genre, author, age rating)
 * 2. FALLBACK: og:meta tags
 *
 * Rate Limiting: Caller must implement 3-second delay between requests
 */

// Headers that mimic a Korean browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cookie': 'NNB=1', // Minimal cookie to avoid blocking
}

interface NaverSeriesData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    productNo: string | null
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
    publisher: string | null
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
 * Main scraper function for Naver Series
 * Accepts either a productNo or full URL, plus an optional subKind
 * ('comic' | 'novel') that selects the path on series.naver.com.
 * Defaults to 'comic' for backward compatibility — webtoons are the
 * historically supported case.
 */
export async function scrapeNaverSeries(
  productNoOrUrl: string,
  subKind: 'comic' | 'novel' = 'comic',
): Promise<NaverSeriesData> {
  console.log(`[NaverSeries] Scraping for: ${productNoOrUrl} (subKind=${subKind})`)

  const result: NaverSeriesData = {
    source: 'naver_series',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      productNo: null,
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
      publisher: null,
      comment_count: null
    },
    metadata: {
      search_query: productNoOrUrl,
      scraping_method: 'html_parsing',
      response_status: null,
      error: null
    }
  }

  try {
    // Extract productNo from input
    const productNo = extractProductNo(productNoOrUrl)

    if (!productNo) {
      console.log(`[NaverSeries] Could not extract productNo from: ${productNoOrUrl}`)
      result.metadata.error = 'Could not determine productNo. Please provide a valid Naver Series URL or numeric ID.'
      return result
    }

    console.log(`[NaverSeries] Using productNo: ${productNo} (subKind=${subKind})`)
    result.data.productNo = productNo
    result.data.platform_url = `https://series.naver.com/${subKind}/detail.series?productNo=${productNo}`

    // Fetch HTML and parse data
    const htmlData = await fetchAndParseHtml(productNo, subKind)

    if (htmlData) {
      result.title_found = true
      result.metadata.response_status = 200
      result.metadata.scraping_method = 'html_parsing'

      // Merge parsed data
      Object.assign(result.data, htmlData)

      console.log(`[NaverSeries] HTML extraction successful:`, {
        title: result.data.title_ko,
        rating: result.data.rating,
        chapters: result.data.chapters,
        subscribers: result.data.subscribers,
        completed: result.data.completed
      })

      return result
    }

    // If HTML parsing failed completely
    result.metadata.error = 'Could not fetch or parse content from Naver Series.'
    result.metadata.scraping_method = 'failed'

  } catch (error) {
    console.error('[NaverSeries] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Extract productNo from various input formats:
 * - Direct numeric ID: "12828228"
 * - URL: "https://series.naver.com/comic/detail.series?productNo=12828228"
 */
function extractProductNo(input: string): string | null {
  const trimmed = input.trim()

  // Direct numeric ID (6-9 digits)
  if (/^\d{6,9}$/.test(trimmed)) {
    return trimmed
  }

  // URL pattern
  const urlMatch = trimmed.match(/productNo=(\d+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  return null
}

/**
 * Fetch HTML page and extract all available data
 */
async function fetchAndParseHtml(
  productNo: string,
  subKind: 'comic' | 'novel' = 'comic',
): Promise<Partial<NaverSeriesData['data']> | null> {
  console.log(`[NaverSeries] Fetching HTML for: ${productNo} (${subKind})`)

  try {
    const url = `https://series.naver.com/${subKind}/detail.series?productNo=${productNo}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[NaverSeries] HTML fetch failed: ${response.status}`)
      return null
    }

    const html = await response.text()
    console.log(`[NaverSeries] HTML length: ${html.length}`)

    // Check for error pages
    if (html.includes('판매 중지') || html.includes('판매중지')) {
      console.log(`[NaverSeries] Product is discontinued`)
      return null
    }
    if (html.includes('서비스 페이지에 접속할 수 없습니다')) {
      console.log(`[NaverSeries] Service unavailable`)
      return null
    }

    const data: Partial<NaverSeriesData['data']> = {}

    // Extract title from <h2> or og:title
    const titleH2Match = html.match(/<h2>([^<]+)<\/h2>/i)
    if (titleH2Match && !titleH2Match[1].includes('blind') && !titleH2Match[1].includes('주의사항')) {
      data.title_ko = decodeHTMLEntities(titleH2Match[1])
    }
    if (!data.title_ko) {
      const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      if (ogTitleMatch) {
        data.title_ko = decodeHTMLEntities(ogTitleMatch[1])
      }
    }

    // Extract rating from score_area
    // Pattern: <div class="score_area">...<em>7.7</em></div>
    const ratingMatch = html.match(/<div class="score_area">[\s\S]*?<em>([\d.]+)<\/em>/i)
    if (ratingMatch) {
      data.rating = parseFloat(ratingMatch[1])
      console.log(`[NaverSeries] Rating: ${data.rating}`)
    }

    // Extract episode count from end_total_episode
    // Pattern: <h5 class="end_total_episode">총 <strong>39</strong>화</h5>
    const episodeMatch = html.match(/<h5 class="end_total_episode">[\s\S]*?<strong>(\d+)<\/strong>/i)
    if (episodeMatch) {
      data.chapters = parseInt(episodeMatch[1], 10)
      console.log(`[NaverSeries] Episodes: ${data.chapters}`)
    }

    // Extract downloads/favorites from btn_download
    // Pattern: <a class="btn_download"><span>37만</span></a>
    const downloadMatch = html.match(/<a class="btn_download"><span>([^<]+)<\/span>/i)
    if (downloadMatch) {
      data.subscribers = parseKoreanNumber(downloadMatch[1])
      console.log(`[NaverSeries] Subscribers/Downloads: ${data.subscribers}`)
    }

    // Extract comment count
    // Pattern: <span id="commentCount">33</span>
    const commentMatch = html.match(/<span id="commentCount">(\d+)<\/span>/i)
    if (commentMatch) {
      data.comment_count = parseInt(commentMatch[1], 10)
      console.log(`[NaverSeries] Comments: ${data.comment_count}`)
    }

    // Extract completion status from end_info or og:description
    // Pattern: <li><span>완결</span></li> or "XX 화 완결" in description
    data.completed = html.includes('<span>완결</span>') || html.includes('화 완결')
    console.log(`[NaverSeries] Completed: ${data.completed}`)

    // Extract genre from end_info
    // Pattern: <a href="...genreCode=XX">드라마</a>
    const genreMatches = html.matchAll(/<a href="[^"]*genreCode=\d+">([^<]+)<\/a>/gi)
    const genres: string[] = []
    for (const match of genreMatches) {
      const genre = decodeHTMLEntities(match[1])
      if (genre && !genres.includes(genre)) {
        genres.push(genre)
      }
    }
    if (genres.length > 0) {
      data.genre = genres
      console.log(`[NaverSeries] Genres: ${data.genre.join(', ')}`)
    }

    // Extract tags from og:description
    // Pattern: "#COMIC, #드라마, #디스토피아"
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    if (ogDescMatch) {
      const desc = decodeHTMLEntities(ogDescMatch[1])
      const tagMatches = desc.match(/#[^\s,#]+/g)
      if (tagMatches) {
        data.tags = tagMatches.map(t => t.replace(/^#/, ''))
        console.log(`[NaverSeries] Tags: ${data.tags.join(', ')}`)
      }

      // Extract synopsis from og:description (after "줄거리:")
      const synopsisMatch = desc.match(/줄거리:\s*([^,]+)/)
      if (synopsisMatch) {
        data.synopsis_kr = synopsisMatch[1].trim()
      }
    }

    // Extract synopsis from _synopsis div if not found
    if (!data.synopsis_kr) {
      const synopsisMatch = html.match(/<div class="_synopsis">([^<]+)/i)
      if (synopsisMatch) {
        data.synopsis_kr = decodeHTMLEntities(synopsisMatch[1]).replace(/&nbsp;/g, ' ')
      }
    }

    // Extract author/artist from end_info
    // Pattern: <li><span>그림</span><a>꼬마비</a></li>
    const artistMatch = html.match(/<li><span>그림<\/span><a[^>]*>([^<]+)<\/a>/i)
    if (artistMatch) {
      data.artist = decodeHTMLEntities(artistMatch[1])
      console.log(`[NaverSeries] Artist: ${data.artist}`)
    }

    // Pattern: <li><span>글</span><a>작가명</a></li>
    const authorMatch = html.match(/<li><span>글<\/span><a[^>]*>([^<]+)<\/a>/i)
    if (authorMatch) {
      data.author = decodeHTMLEntities(authorMatch[1])
      console.log(`[NaverSeries] Author: ${data.author}`)
    }

    // If artist is found but no author, use artist as author
    if (!data.author && data.artist) {
      data.author = data.artist
    }

    // Extract age rating
    // Pattern: <li>15세 이용가</li>
    const ageMatch = html.match(/<li>(\d+세 이용가|전체이용가)<\/li>/i)
    if (ageMatch) {
      data.age_rating = ageMatch[1]
      console.log(`[NaverSeries] Age rating: ${data.age_rating}`)
    }

    // Extract publisher
    // Pattern: <li><span>출판사</span><a>위즈덤하우스</a></li>
    const publisherMatch = html.match(/<li><span>출판사<\/span><a[^>]*>([^<]+)<\/a>/i)
    if (publisherMatch) {
      data.publisher = decodeHTMLEntities(publisherMatch[1])
      console.log(`[NaverSeries] Publisher: ${data.publisher}`)
    }

    // Extract thumbnail from og:image
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (ogImageMatch) {
      data.thumbnail = ogImageMatch[1]
    }

    return data

  } catch (error) {
    console.error('[NaverSeries] fetchAndParseHtml error:', error)
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
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim()
}

/**
 * Parse Korean number format
 * Examples:
 * - "37만" -> 370000
 * - "1.5만" -> 15000
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
