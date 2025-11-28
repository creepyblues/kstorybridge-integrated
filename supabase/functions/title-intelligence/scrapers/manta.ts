/**
 * Manta Scraper (manta.net)
 *
 * Purpose: Scrape metadata from Manta Comics (English webtoon platform)
 *
 * Data Collected:
 * - title: Title from og:title
 * - synopsis: Synopsis from og:description
 * - thumbnail: Cover image URL
 * - genre: Extracted from metaKeywords
 * - completed: Completion status from metaKeywords
 *
 * Strategy:
 * 1. Fetch HTML from manta.net/en/series/{slug}?seriesId={id}
 * 2. Extract __NEXT_DATA__ JSON for structured data
 * 3. Parse headData from pageProps
 *
 * URL Format: https://manta.net/en/series/{slug}?seriesId={id}
 */

// Headers that mimic a browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

interface MantaData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    seriesId: string | null
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
    synopsis_en: string | null
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
 * Main scraper function for Manta
 * Accepts a series ID (numeric string)
 */
export async function scrapeManta(seriesId: string): Promise<MantaData> {
  console.log(`[Manta] Scraping for seriesId: ${seriesId}`)

  const result: MantaData = {
    source: 'manta',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      seriesId: seriesId,
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
      synopsis_en: null,
      age_rating: null,
      thumbnail: null,
      tags: []
    },
    metadata: {
      search_query: seriesId,
      scraping_method: 'next_data',
      response_status: null,
      error: null
    }
  }

  try {
    // Manta uses a URL pattern with seriesId as query param
    // We'll fetch with a placeholder slug that redirects to correct URL
    const url = `https://manta.net/en/series/_?seriesId=${seriesId}`
    console.log(`[Manta] Fetching: ${url}`)

    const response = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow'
    })

    if (!response.ok) {
      console.error(`[Manta] HTTP error: ${response.status}`)
      result.metadata.error = `HTTP error: ${response.status}`
      result.metadata.response_status = response.status
      return result
    }

    result.metadata.response_status = response.status
    result.data.platform_url = response.url

    const html = await response.text()
    console.log(`[Manta] HTML length: ${html.length}`)

    // Extract __NEXT_DATA__ JSON
    const startMarker = '<script id="__NEXT_DATA__" type="application/json"'
    const endMarker = '</script>'

    const startIndex = html.indexOf(startMarker)
    if (startIndex === -1) {
      console.log(`[Manta] __NEXT_DATA__ not found`)
      result.metadata.error = '__NEXT_DATA__ not found'
      result.metadata.scraping_method = 'failed'
      return result
    }

    // Find the > after the tag attributes
    const tagClose = html.indexOf('>', startIndex)
    if (tagClose === -1) {
      result.metadata.error = 'Invalid __NEXT_DATA__ tag'
      return result
    }

    const jsonStart = tagClose + 1
    const jsonEnd = html.indexOf(endMarker, jsonStart)
    if (jsonEnd === -1) {
      console.log(`[Manta] __NEXT_DATA__ end marker not found`)
      result.metadata.error = '__NEXT_DATA__ end marker not found'
      result.metadata.scraping_method = 'failed'
      return result
    }

    const jsonString = html.substring(jsonStart, jsonEnd)
    console.log(`[Manta] JSON length: ${jsonString.length}`)

    const nextData = JSON.parse(jsonString)

    // Extract from pageProps.headData
    const headData = nextData?.props?.pageProps?.headData
    if (!headData) {
      console.log(`[Manta] headData not found`)
      result.metadata.error = 'headData not found in __NEXT_DATA__'
      return result
    }

    result.title_found = true

    // Title (from og:title, remove " - Manhwa/Webcomic - Manta" suffix)
    if (headData.title) {
      const titleMatch = headData.title.match(/^(.+?)\s*-\s*Manhwa\/Webcomic\s*-\s*Manta$/i)
      result.data.title_en = titleMatch ? titleMatch[1].trim() : headData.title
    }

    // Synopsis
    if (headData.description) {
      // Remove the "Read the latest, legitimate English translation of..." prefix
      const synopsisMatch = headData.description.match(/^Read the latest.*?\.\s*(.+)$/s)
      result.data.synopsis_en = synopsisMatch ? synopsisMatch[1].trim() : headData.description
    }

    // Thumbnail
    if (headData.image) {
      result.data.thumbnail = headData.image
    }

    // Extract genres and status from metaKeywords
    if (headData.metaKeywords) {
      const keywords = headData.metaKeywords.split(',').map((k: string) => k.trim())

      // Filter out the title, "manta comics", "webtoons"
      const excluded = ['manta comics', 'webtoons', result.data.title_en?.toLowerCase()]
      const genres: string[] = []

      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase()

        // Check for completion status
        if (lowerKeyword === 'completed') {
          result.data.completed = true
          continue
        }
        if (lowerKeyword === 'ongoing') {
          result.data.completed = false
          continue
        }

        // Skip excluded keywords
        if (excluded.some(e => e && lowerKeyword.includes(e))) {
          continue
        }

        // Add as genre/tag
        if (keyword && keyword.length > 1) {
          genres.push(keyword)
        }
      }

      if (genres.length > 0) {
        result.data.genre = genres
        result.data.tags = genres
      }
    }

    // Platform URL from canonical or response URL
    if (headData.canonical?.href) {
      result.data.platform_url = headData.canonical.href
    }

    // Also try to extract og:meta tags as fallback
    if (!result.data.title_en || !result.data.synopsis_en) {
      const ogTitleMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/i) ||
                          html.match(/content="([^"]+)"[^>]*property="og:title"/i)
      const ogDescMatch = html.match(/property="og:description"[^>]*content="([^"]+)"/i) ||
                         html.match(/content="([^"]+)"[^>]*property="og:description"/i)
      const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/content="([^"]+)"[^>]*property="og:image"/i)

      if (ogTitleMatch && !result.data.title_en) {
        const titleMatch = ogTitleMatch[1].match(/^(.+?)\s*-\s*Manhwa\/Webcomic\s*-\s*Manta$/i)
        result.data.title_en = titleMatch ? titleMatch[1].trim() : ogTitleMatch[1]
      }
      if (ogDescMatch && !result.data.synopsis_en) {
        result.data.synopsis_en = ogDescMatch[1]
      }
      if (ogImageMatch && !result.data.thumbnail) {
        result.data.thumbnail = ogImageMatch[1]
      }
    }

    console.log(`[Manta] Extracted:`, {
      title: result.data.title_en,
      genres: result.data.genre,
      completed: result.data.completed,
      hasThumb: !!result.data.thumbnail
    })

    return result

  } catch (error) {
    console.error('[Manta] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
    return result
  }
}

/**
 * Extract series ID from manta.net URL
 * URL format: https://manta.net/en/series/{slug}?seriesId={id}
 */
export function extractMantaId(url: string): string | null {
  // Try query param first
  const urlObj = new URL(url)
  const seriesIdParam = urlObj.searchParams.get('seriesId')
  if (seriesIdParam) {
    return seriesIdParam
  }

  // Fallback: try to extract from path if no query param
  // Some URLs might be: /en/series/1173 (numeric slug)
  const pathMatch = url.match(/manta\.net\/[a-z]{2}\/series\/(\d+)/)
  if (pathMatch) {
    return pathMatch[1]
  }

  return null
}
