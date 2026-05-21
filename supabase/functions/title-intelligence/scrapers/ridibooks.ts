/**
 * Ridibooks Scraper
 *
 * Purpose: Scrape popularity metrics and metadata from Ridibooks
 *
 * Data Collected:
 * - title_ko: Korean title
 * - author: Author name (글)
 * - artist: Artist name (그림)
 * - synopsis_kr: Korean synopsis/description
 * - thumbnail: Cover image URL
 * - genre: Categories/genres (웹툰 > 로맨스)
 * - rating: Star rating (0-5 scale, converted to 0-10)
 * - rating_count: Number of ratings
 * - subscribers: 관심 count
 * - chapters: Episode count (총 XX화)
 * - completed: Series completion status (완결 badge)
 * - publisher: Publisher name (출판)
 * - platform_url: Direct URL to content
 *
 * Strategy:
 * 1. Fetch HTML and parse directly using regex patterns
 * 2. Extract from og:meta tags as supplement
 * 3. Extract from <title> tag as fallback
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

interface RidibooksData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    bookId: string | null
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
    publisher: string | null
    price: string | null
    series_id: string | null
  }
  metadata: {
    search_query: string
    scraping_method: string
    response_status: number | null
    error: string | null
  }
}

/**
 * Main scraper function for Ridibooks
 * Accepts a bookId or full URL
 */
export async function scrapeRidibooks(bookIdOrUrl: string): Promise<RidibooksData> {
  console.log(`[Ridibooks] Scraping for: ${bookIdOrUrl}`)

  const result: RidibooksData = {
    source: 'ridibooks',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      bookId: null,
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
      publisher: null,
      price: null,
      series_id: null,
    },
    metadata: {
      search_query: bookIdOrUrl,
      scraping_method: 'unknown',
      response_status: null,
      error: null
    }
  }

  try {
    // Extract bookId from input
    const bookId = extractBookId(bookIdOrUrl)

    if (!bookId) {
      console.log(`[Ridibooks] Could not extract bookId from: ${bookIdOrUrl}`)
      result.metadata.error = 'Could not determine bookId. Please provide a valid Ridibooks URL or numeric ID.'
      return result
    }

    console.log(`[Ridibooks] Using bookId: ${bookId}`)
    result.data.bookId = bookId
    result.data.platform_url = `https://ridibooks.com/books/${bookId}`

    // Fetch HTML
    const url = `https://ridibooks.com/books/${bookId}`
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.error(`[Ridibooks] HTML fetch failed: ${response.status}`)
      result.metadata.response_status = response.status
      result.metadata.error = `HTTP ${response.status}`
      return result
    }

    result.metadata.response_status = 200
    const html = await response.text()
    console.log(`[Ridibooks] HTML length: ${html.length}`)

    // Extract data using multiple methods
    let dataExtracted = false

    // Method 1: JSON-LD (schema.org Book) — primary, most reliable.
    // Ridibooks renders most book detail data client-side; the only
    // structured server-side payload is a <script type="application/ld+json">
    // block with name/author/publisher/genre/description/rating/etc.
    const jsonLdExtracted = extractFromJsonLd(html, result)
    if (jsonLdExtracted) {
      result.metadata.scraping_method = 'json_ld'
      dataExtracted = true
      console.log(`[Ridibooks] Extracted from JSON-LD`)
    }

    // Method 2: Direct HTML parsing — supplements (chapters, completed flag,
    // tags from meta keywords). Patterns specific to Ridibooks DOM/meta.
    if (extractFromHtmlContent(html, result) && !dataExtracted) {
      result.metadata.scraping_method = 'html_content'
      dataExtracted = true
      console.log(`[Ridibooks] Extracted from HTML content`)
    }

    // Method 3: og:meta tags as fallback for any remaining gaps
    extractFromOgMeta(html, result)

    // Method 4: __NEXT_DATA__ rarely has book data on this platform but
    // kept as last-resort source for legacy pages.
    extractFromNextData(html, result)

    // Check if we got any meaningful data
    result.title_found = !!(result.data.title_ko || result.data.synopsis_kr || result.data.thumbnail)

    if (!result.title_found) {
      result.metadata.error = 'Could not extract content data from Ridibooks page'
      result.metadata.scraping_method = 'failed'
    }

    console.log(`[Ridibooks] Extraction result:`, {
      title: result.data.title_ko,
      author: result.data.author,
      artist: result.data.artist,
      rating: result.data.rating,
      rating_count: result.data.rating_count,
      subscribers: result.data.subscribers,
      chapters: result.data.chapters,
      completed: result.data.completed,
      publisher: result.data.publisher,
      hasSynopsis: !!result.data.synopsis_kr,
      hasThumbnail: !!result.data.thumbnail,
      method: result.metadata.scraping_method
    })

  } catch (error) {
    console.error('[Ridibooks] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Extract bookId from various input formats
 */
function extractBookId(input: string): string | null {
  const trimmed = input.trim()

  // Direct numeric ID
  if (/^\d{7,15}$/.test(trimmed)) {
    return trimmed
  }

  // ridibooks.com URL pattern: /books/{bookId}
  const ridibooksMatch = trimmed.match(/ridibooks\.com\/books\/(\d+)/)
  if (ridibooksMatch) {
    return ridibooksMatch[1]
  }

  return null
}

/**
 * Extract data from HTML content using patterns specific to Ridibooks
 * Based on observed page structure:
 * - Title: h1 or main title element
 * - Rating: ★ 4.7점 (661)
 * - Subscribers: 관심 2,805
 * - Author/Artist: 해린 글, 그림 | 나야 원작
 * - Publisher: 만화가족 출판
 * - Chapters: 총 70화 완결
 * - Synopsis: Under "작품소개" section
 * - Keywords: Under "이 작품의 키워드" section (tags like #로맨스, #결혼/동거)
 */
function extractFromHtmlContent(html: string, result: RidibooksData): boolean {
  let extracted = false

  // Extract title from <title> tag — used only when JSON-LD didn't already
  // populate title_ko. The <title> contains a suffix like
  // "사탄의 아이들 - 판타지 웹소설 - 리디" that's hard to strip cleanly,
  // so the JSON-LD `name` is preferred when available.
  if (!result.data.title_ko) {
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i)
    if (titleTagMatch) {
      let title = decodeHTMLEntities(titleTagMatch[1])
      // Strip platform / category suffixes
      title = title
        .replace(/\s*-\s*리디.*$/i, '')
        .replace(/\s*\|\s*리디.*$/i, '')
        .replace(/\s*-\s*(웹툰|웹소설|만화|판타지 웹소설|로맨스 웹소설|BL 웹소설|로판 웹소설)\b.*$/i, '')
        .trim()
      if (title && title.length > 0 && title.length < 100) {
        result.data.title_ko = title
        extracted = true
      }
    }
  }

  // Extract rating and rating count
  // Ridibooks uses 5-point scale, but we should NOT convert - just store as-is
  // Pattern: "★4.7점(661)" or "4.7점 (661)"
  const ratingMatch = html.match(/[★☆]\s*(\d+\.?\d*)점\s*[\(（](\d[\d,]*)[\)）]/)
  if (ratingMatch) {
    const rating = parseFloat(ratingMatch[1])
    if (!isNaN(rating) && rating > 0 && rating <= 5) {
      // Store the original 5-point rating (don't convert to 10)
      result.data.rating = rating
      extracted = true
    }
    // Rating count from the parentheses
    if (ratingMatch[2]) {
      const count = parseInt(ratingMatch[2].replace(/,/g, ''), 10)
      if (!isNaN(count)) {
        result.data.rating_count = count
      }
    }
  }

  // Try separate pattern for rating_count if not found above
  if (!result.data.rating_count) {
    // Look for pattern like "(661)" after rating or "661명" or "리뷰 661"
    const ratingCountMatch = html.match(/점\s*[\(（](\d[\d,]*)[\)）]/) ||
                             html.match(/"ratingCount":\s*(\d+)/) ||
                             html.match(/리뷰\s*(\d[\d,]+)/)
    if (ratingCountMatch) {
      const count = parseInt(ratingCountMatch[1].replace(/,/g, ''), 10)
      if (!isNaN(count)) {
        result.data.rating_count = count
      }
    }
  }

  // Extract subscribers (관심): "관심 2,805" or "관심2805"
  const subscribersMatch = html.match(/관심\s*(\d[\d,]+)/) ||
                           html.match(/"subscribers":\s*(\d+)/) ||
                           html.match(/"interestCount":\s*(\d+)/)
  if (subscribersMatch) {
    const subscribers = parseInt(subscribersMatch[1].replace(/,/g, ''), 10)
    if (!isNaN(subscribers)) {
      result.data.subscribers = subscribers
      extracted = true
    }
  }

  // Extract chapters: "총 70화" or "70화" or "전70화"
  const chaptersMatch = html.match(/총\s*(\d+)화/) ||
                        html.match(/전(\d+)화/) ||
                        html.match(/"episodeCount":\s*(\d+)/) ||
                        html.match(/"totalEpisodes":\s*(\d+)/)
  if (chaptersMatch) {
    const chapters = parseInt(chaptersMatch[1], 10)
    if (!isNaN(chapters)) {
      result.data.chapters = chapters
      extracted = true
    }
  }

  // Extract completed status
  if (html.match(/총\s*\d+화\s*완결/) || html.match(/>완결</) || html.match(/완결작/)) {
    result.data.completed = true
  } else if (html.includes('연재중') || html.includes('연재 중')) {
    result.data.completed = false
  }

  // Extract author/artist from JSON-like patterns in the page
  // Look for structured data that might contain author info

  // Try JSON patterns first (more reliable)
  const authorsJsonMatch = html.match(/"authors?":\s*\[([^\]]+)\]/) ||
                           html.match(/"creators?":\s*\[([^\]]+)\]/)
  if (authorsJsonMatch) {
    const authorsStr = authorsJsonMatch[1]
    // Extract names from the array
    const nameMatches = authorsStr.matchAll(/"name":\s*"([^"]+)"/g)
    const roleMatches = authorsStr.matchAll(/"role":\s*"([^"]+)"/g)
    const names = Array.from(nameMatches).map(m => m[1])
    const roles = Array.from(roleMatches).map(m => m[1])

    for (let i = 0; i < names.length && i < roles.length; i++) {
      const role = roles[i].toLowerCase()
      if (role.includes('원작') || role.includes('author') || role.includes('글')) {
        if (!result.data.author) result.data.author = names[i]
      }
      if (role.includes('그림') || role.includes('artist') || role.includes('작화')) {
        if (!result.data.artist) result.data.artist = names[i]
      }
    }
  }

  // Try HTML patterns for author/artist
  // Look for patterns with role indicators after the name
  // IMPORTANT: Check 원작 (original author) FIRST, then 글, 그림 (artist)

  // Original author (원작): "NAME 원작" - this is the story author (e.g., 나야)
  // Check this FIRST before combined patterns
  const originalMatch = html.match(/>([가-힣a-zA-Z0-9]+)<\/[^>]+>\s*원작/) ||
                        html.match(/([가-힣]{2,10})\s*원작(?:<|\s|$)/)
  if (originalMatch) {
    const name = originalMatch[1].trim()
    if (name.length >= 2 && name.length <= 10) {
      result.data.author = name
      extracted = true
    }
  }

  // Combined artist: "NAME 글, 그림" or "NAME글,그림" (e.g., 해린)
  // This person does both writing adaptation and art
  if (!result.data.artist) {
    const combinedMatch = html.match(/>([가-힣a-zA-Z0-9]+)<\/[^>]+>\s*글\s*[,·]\s*그림/) ||
                          html.match(/([가-힣]{2,10})\s*글\s*[,·]\s*그림/)
    if (combinedMatch) {
      const name = combinedMatch[1].trim()
      if (name.length >= 2 && name.length <= 10) {
        result.data.artist = name
        extracted = true
      }
    }
  }

  // Separate 글 (writer) if no author found
  if (!result.data.author) {
    const writerMatch = html.match(/>([가-힣a-zA-Z0-9\s]+)<\/[^>]+>\s*글(?:\s|[,·]|<)/) ||
                        html.match(/"([가-힣]{2,10})"\s*글(?:\s|[,·])/) ||
                        html.match(/([가-힣]{2,10})\s*글(?:\s|[,·]|<)/)
    if (writerMatch) {
      const name = writerMatch[1].trim()
      if (name.length >= 2 && name.length <= 20) {
        result.data.author = name
        extracted = true
      }
    }
  }

  // Separate 그림 (artist) if no artist found
  if (!result.data.artist) {
    const artistMatch = html.match(/>([가-힣a-zA-Z0-9\s]+)<\/[^>]+>\s*그림/) ||
                        html.match(/"([가-힣]{2,10})"\s*그림/) ||
                        html.match(/([가-힣]{2,10})\s*그림(?:<|[^가-힣])/)
    if (artistMatch) {
      const name = artistMatch[1].trim()
      if (name.length >= 2 && name.length <= 20) {
        result.data.artist = name
        extracted = true
      }
    }
  }

  // Extract publisher: "NAME 출판" or from JSON
  if (!result.data.publisher) {
    const publisherJsonMatch = html.match(/"publisher":\s*"([^"]+)"/) ||
                               html.match(/"publisherName":\s*"([^"]+)"/)
    if (publisherJsonMatch) {
      result.data.publisher = publisherJsonMatch[1].trim()
      extracted = true
    }
  }

  if (!result.data.publisher) {
    const publisherMatch = html.match(/>([가-힣a-zA-Z0-9\s]+)<\/[^>]+>\s*출판/) ||
                           html.match(/"([가-힣]{2,20})"\s*출판/) ||
                           html.match(/([가-힣]{2,20})\s*출판(?:<|[^가-힣])/)
    if (publisherMatch) {
      const publisher = publisherMatch[1].trim()
      // Filter out common false positives and ensure reasonable length
      const invalidPublishers = ['서평', '리뷰', '댓글', '신고', '공유']
      if (!invalidPublishers.includes(publisher) && publisher.length >= 2 && publisher.length <= 20) {
        result.data.publisher = publisher
        extracted = true
      }
    }
  }

  // Extract synopsis from "작품소개" section
  // The synopsis typically appears after "작품소개" heading in the page
  if (!result.data.synopsis_kr) {
    // Try to find synopsis in JSON data
    const synopsisJsonMatch = html.match(/"description":\s*"([^"]{10,})"/) ||
                              html.match(/"synopsis":\s*"([^"]{10,})"/) ||
                              html.match(/"introduction":\s*"([^"]{10,})"/)
    if (synopsisJsonMatch) {
      let synopsis = synopsisJsonMatch[1]
      // Unescape JSON string
      synopsis = synopsis.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      result.data.synopsis_kr = decodeHTMLEntities(synopsis)
      extracted = true
    }
  }

  // Try HTML patterns for synopsis - look for text after 작품소개
  if (!result.data.synopsis_kr) {
    // Pattern: Find content between 작품소개 and the next section
    const synopsisMatch = html.match(/작품소개[^>]*>([^<]{20,500})/) ||
                          html.match(/작품\s*소개[^>]*>.*?<[^>]*>([^<]{20,500})/)
    if (synopsisMatch) {
      result.data.synopsis_kr = decodeHTMLEntities(synopsisMatch[1].trim())
      extracted = true
    }
  }

  // Extract keywords/tags from "이 작품의 키워드" section
  // Tags are ONLY Korean hashtags like: #로맨스 #현대배경 #결혼/동거
  // IMPORTANT: Filter out hex codes (#ffffff), CSS values, and other garbage
  const tags: string[] = []

  // Valid Ridibooks tags based on screenshot:
  // 로맨스, 현대배경, 결혼/동거, 연하남, 계략남, 능글남, 다정녀, 순진녀, 소심녀, 기다리면무료, 원작소설有, 완결

  // Only match hashtags that are primarily Korean characters
  // Pattern: # followed by Korean characters, optionally with / or 有
  const hashtagMatches = html.matchAll(/#([가-힣]+(?:[/가-힣有]+)?)/g)
  for (const match of hashtagMatches) {
    const tag = match[1].trim()
    // Must contain at least one Korean character and be reasonable length
    if (tag && /[가-힣]/.test(tag) && tag.length >= 2 && tag.length <= 15 && !tags.includes(tag)) {
      tags.push(tag)
    }
  }

  if (tags.length > 0) {
    result.data.tags = tags
    extracted = true
  }

  // Extract genre from breadcrumb or tags
  if (!result.data.genre || result.data.genre.length === 0) {
    const genreMatch = html.match(/웹툰\s*(?:>|&gt;|›)\s*([가-힣]+)/) ||
                       html.match(/만화\s*(?:>|&gt;|›)\s*([가-힣]+)/) ||
                       html.match(/웹소설\s*(?:>|&gt;|›)\s*([가-힣]+)/) ||
                       html.match(/"genre":\s*"([^"]+)"/) ||
                       html.match(/"category":\s*"([^"]+)"/)
    if (genreMatch) {
      const genre = genreMatch[1].trim()
      result.data.genre = [genre]
      extracted = true
    }
  }

  // Extract age rating
  if (html.match(/19세\s*이용가/) || html.match(/>19</) || html.match(/성인\s*전용/) || html.match(/"ageRating":\s*"?19/)) {
    result.data.age_rating = '19세이용가'
  } else if (html.match(/15세\s*이용가/) || html.match(/"ageRating":\s*"?15/)) {
    result.data.age_rating = '15세이용가'
  } else if (html.match(/12세\s*이용가/) || html.match(/"ageRating":\s*"?12/)) {
    result.data.age_rating = '12세이용가'
  } else if (html.match(/전체\s*이용가/) || html.match(/"ageRating":\s*"?(all|전체)/i)) {
    result.data.age_rating = '전체이용가'
  }

  return extracted
}

/**
 * Extract data from __NEXT_DATA__ script tag (supplementary)
 */
function extractFromNextData(html: string, result: RidibooksData): boolean {
  const startMarker = '<script id="__NEXT_DATA__" type="application/json">'
  const endMarker = '</script>'

  const startIndex = html.indexOf(startMarker)
  if (startIndex === -1) return false

  const jsonStart = startIndex + startMarker.length
  const jsonEnd = html.indexOf(endMarker, jsonStart)
  if (jsonEnd === -1) return false

  try {
    const jsonString = html.substring(jsonStart, jsonEnd)
    const nextData = JSON.parse(jsonString)

    // Try to find and extract any useful data
    const bookData = findBookData(nextData)
    if (bookData) {
      // Only fill in missing fields
      if (!result.data.title_ko && bookData.title) {
        result.data.title_ko = bookData.title
      }
      if (!result.data.synopsis_kr && (bookData.description || bookData.synopsis)) {
        result.data.synopsis_kr = decodeHTMLEntities(bookData.description || bookData.synopsis)
      }
      if (!result.data.thumbnail && (bookData.cover || bookData.thumbnail)) {
        let thumb = bookData.cover || bookData.thumbnail
        if (typeof thumb === 'object') thumb = thumb.url || thumb.src
        if (thumb && thumb.startsWith('//')) thumb = `https:${thumb}`
        result.data.thumbnail = thumb
      }
      return true
    }
  } catch (error) {
    console.log(`[Ridibooks] __NEXT_DATA__ parse error:`, error.message)
  }

  return false
}

/**
 * Recursively search for book-like data structure
 */
function findBookData(obj: any, depth = 0): any {
  if (depth > 8 || !obj || typeof obj !== 'object') return null

  // Check if this object looks like book data
  if (obj.title && (obj.authors || obj.author || obj.description || obj.cover || obj.thumbnail)) {
    return obj
  }

  // Check arrays
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findBookData(item, depth + 1)
      if (found) return found
    }
    return null
  }

  // Check object properties
  for (const key of Object.keys(obj)) {
    const found = findBookData(obj[key], depth + 1)
    if (found) return found
  }

  return null
}

/**
 * Extract data from Open Graph meta tags (supplementary)
 */
function extractFromOgMeta(html: string, result: RidibooksData): boolean {
  let extracted = false

  // og:title - only if not already set
  if (!result.data.title_ko) {
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i)
    if (titleMatch) {
      let title = decodeHTMLEntities(titleMatch[1])
      title = title.replace(/\s*-\s*(웹툰|웹소설|만화|리디).*$/i, '').trim()
      if (title) {
        result.data.title_ko = title
        extracted = true
      }
    }
  }

  // og:description - only if not already set
  if (!result.data.synopsis_kr) {
    const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/i)
    if (descMatch) {
      result.data.synopsis_kr = decodeHTMLEntities(descMatch[1])
      extracted = true
    }
  }

  // og:image - only if not already set
  if (!result.data.thumbnail) {
    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i)
    if (imageMatch) {
      let image = imageMatch[1]
      if (image.startsWith('//')) image = `https:${image}`
      result.data.thumbnail = image
      extracted = true
    }
  }

  return extracted
}

/**
 * Extract data from JSON-LD (schema.org Book) blocks.
 *
 * Ridibooks emits a clean <script type="application/ld+json"> with the
 * book's structured data — name, author, publisher, genre, description,
 * aggregateRating, image, ISBN, etc. This is the only stable
 * server-side payload that survives the page's heavy client-side rendering,
 * so it's the primary extraction path.
 */
function extractFromJsonLd(html: string, result: RidibooksData): boolean {
  let extracted = false

  // Find all JSON-LD blocks (matchAll). There can be several (BreadcrumbList,
  // Book, etc). We pick the first one whose @type is 'Book'.
  const ldBlockRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  const blocks = Array.from(html.matchAll(ldBlockRe))

  for (const match of blocks) {
    const body = match[1].trim()
    if (!body) continue

    let parsed: any
    try {
      parsed = JSON.parse(body)
    } catch (err) {
      console.log(`[Ridibooks] Skipping JSON-LD block (parse error)`)
      continue
    }

    // Some pages use an array of objects; normalize.
    const candidates: any[] = Array.isArray(parsed) ? parsed : [parsed]

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') continue
      const type = candidate['@type']
      if (type !== 'Book' && type !== 'CreativeWork' && type !== 'Article') continue

      // Title
      if (!result.data.title_ko && typeof candidate.name === 'string') {
        result.data.title_ko = decodeHTMLEntities(candidate.name)
        extracted = true
      }

      // Author (single or array). For multi-author works (typical of
      // webtoons listing writer + artist), populate `author` with the first
      // entry and `artist` with the second — JSON-LD doesn't carry role
      // tags so we use position as a best-effort heuristic. Novels have a
      // single author and `artist` stays null.
      const author = candidate.author
      if (author) {
        const toName = (v: any) =>
          typeof v === 'string' ? v : (v && typeof v === 'object' ? v.name : null)
        const names = (Array.isArray(author) ? author : [author])
          .map(toName)
          .filter((n: any): n is string => typeof n === 'string' && n.trim().length > 0)
        if (!result.data.author && names[0]) {
          result.data.author = decodeHTMLEntities(names[0].trim())
          extracted = true
        }
        if (!result.data.artist && names[1]) {
          result.data.artist = decodeHTMLEntities(names[1].trim())
          extracted = true
        }
      }

      // Publisher
      const publisher = candidate.publisher
      if (!result.data.publisher && publisher) {
        const pubName = Array.isArray(publisher)
          ? (publisher[0]?.name || publisher[0])
          : (publisher.name || publisher)
        if (typeof pubName === 'string' && pubName.trim()) {
          result.data.publisher = decodeHTMLEntities(pubName.trim())
          extracted = true
        }
      }

      // Genre — store as single-element array to match schema
      if ((!result.data.genre || result.data.genre.length === 0) && candidate.genre) {
        const g = Array.isArray(candidate.genre) ? candidate.genre[0] : candidate.genre
        if (typeof g === 'string' && g.trim()) {
          result.data.genre = [decodeHTMLEntities(g.trim())]
          extracted = true
        }
      }

      // Description / synopsis
      if (!result.data.synopsis_kr && typeof candidate.description === 'string') {
        result.data.synopsis_kr = decodeHTMLEntities(candidate.description)
        extracted = true
      }

      // Cover image
      if (!result.data.thumbnail && candidate.image) {
        const img = Array.isArray(candidate.image) ? candidate.image[0] : candidate.image
        if (typeof img === 'string' && img.trim()) {
          result.data.thumbnail = img.trim()
          extracted = true
        }
      }

      // Rating (aggregateRating.ratingValue / ratingCount)
      const aggr = candidate.aggregateRating
      if (aggr) {
        if (!result.data.rating && aggr.ratingValue) {
          const v = parseFloat(String(aggr.ratingValue))
          if (!isNaN(v) && v >= 0 && v <= 5) {
            result.data.rating = v
            extracted = true
          }
        }
        if (!result.data.rating_count && aggr.ratingCount) {
          const c = parseInt(String(aggr.ratingCount), 10)
          if (!isNaN(c) && c >= 0) {
            result.data.rating_count = c
            extracted = true
          }
        }
      }

      // First Book candidate wins; stop scanning more blocks.
      if (type === 'Book') return extracted
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
