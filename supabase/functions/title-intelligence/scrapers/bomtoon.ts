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
    result.data.platform_url = `https://www.bomtoon.com/comic/ep_list/${slug}`

    // Fetch HTML
    const url = `https://www.bomtoon.com/comic/ep_list/${slug}`
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

  // bomtoon.com URL pattern: /comic/ep_list/{slug}
  const bomtoonMatch = trimmed.match(/bomtoon\.com\/comic\/ep_list\/([^/?]+)/)
  if (bomtoonMatch) {
    return bomtoonMatch[1]
  }

  return null
}

/**
 * Extract data from embedded JSON in the page
 * Bomtoon embeds JSON data in the page for SEO/hydration
 */
function extractFromEmbeddedJson(html: string, result: BomtoonData): boolean {
  let extracted = false

  // Look for JSON patterns in the HTML
  // Pattern: "title":"죽은자를 상대하는 방법(완결)"
  const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
  if (titleMatch) {
    let title = titleMatch[1]
    // Check if title indicates completion
    if (title.includes('(완결)')) {
      result.data.completed = true
      title = title.replace('(완결)', '').trim()
    }
    result.data.title_ko = title
    extracted = true
  }

  // Pattern: "creators":"곽병진"
  const creatorsMatch = html.match(/"creators"\s*:\s*"([^"]+)"/)
  if (creatorsMatch) {
    result.data.author = creatorsMatch[1]
    result.data.artist = creatorsMatch[1] // Same person for this platform
    extracted = true
  }

  // Pattern: "synopsis":"잡아 먹히는 공포 속에서..."
  const synopsisMatch = html.match(/"synopsis"\s*:\s*"([^"]+)"/)
  if (synopsisMatch) {
    // Unescape JSON string
    let synopsis = synopsisMatch[1]
    synopsis = synopsis.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    result.data.synopsis_kr = synopsis
    extracted = true
  }

  // Pattern: "tags":"판타지,드라마,공포·스릴러,현대물,피폐물,상처남"
  const tagsMatch = html.match(/"tags"\s*:\s*"([^"]+)"/)
  if (tagsMatch) {
    const tagsStr = tagsMatch[1]
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
    if (tags.length > 0) {
      result.data.tags = tags
      // First tag is usually the main genre
      result.data.genre = tags.slice(0, 3)
      extracted = true
    }
  }

  // Pattern: "imagePath":"https://image.balcony.studio/ko/co_thumbnail/5401/death_man^m.webp"
  const imageMatch = html.match(/"imagePath"\s*:\s*"([^"]+)"/)
  if (imageMatch) {
    let image = imageMatch[1]
    // Remove size suffix (^m, ^s, etc.) for full size
    image = image.replace(/\^[a-z]\./, '.')
    result.data.thumbnail = image
    extracted = true
  }

  // Pattern: "countOfFreeEpisodes":5 or total episodes
  const episodesMatch = html.match(/"(?:countOf(?:Free)?Episodes|totalEpisodes|episodeCount)"\s*:\s*(\d+)/)
  if (episodesMatch) {
    result.data.chapters = parseInt(episodesMatch[1], 10)
    extracted = true
  }

  // Pattern: "viewCount" or "views"
  const viewsMatch = html.match(/"(?:viewCount|views|totalViews)"\s*:\s*(\d+)/)
  if (viewsMatch) {
    result.data.views = parseInt(viewsMatch[1], 10)
    extracted = true
  }

  // Pattern: "likeCount" or "likes"
  const likesMatch = html.match(/"(?:likeCount|likes|totalLikes)"\s*:\s*(\d+)/)
  if (likesMatch) {
    result.data.likes = parseInt(likesMatch[1], 10)
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
