/**
 * Lezhin Comics Scraper (lezhinus.com)
 *
 * Purpose: Scrape metadata from Lezhin Comics English site
 *
 * Data Collected:
 * - title_en: display.title
 * - synopsis_en: display.synopsis
 * - views: properties.viewCount
 * - likes: properties.subscriptions (subscriber count)
 * - genre: genres[]
 * - tags: properties.tags
 * - author/artist: artists[] by role (writer vs illustrator)
 * - chapters: episode count from dehydrated ["episode", alias] query
 * - completed: state === 'completed'
 * - age_rating: 'Adult (18+)' when isAdult
 * - thumbnail: og:image
 *
 * Strategy:
 * 1. Fetch HTML from lezhinus.com/en/comic/{alias} with browser UA
 *    (+ optional LEZHIN_COOKIE secret for adult-gated titles)
 * 2. Extract Next.js App Router flight data (self.__next_f.push chunks),
 *    JS-unescape, locate the "content":{...} object via brace balancing
 * 3. Fall back to og: meta tags if flight data parsing fails
 *
 * Adult-gated titles redirect to /login without a valid session cookie.
 * Set the LEZHIN_COOKIE secret to the Cookie header of a logged-in
 * lezhinus.com session (with content mode "all") to collect them.
 *
 * URL Format: https://www.lezhinus.com/en/comic/{alias}
 */

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

interface LezhinData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    alias: string | null
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
 * Unescape a JS string literal body (the "..." inside self.__next_f.push([1,"..."]))
 */
function unescapeJsString(s: string): string {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

/**
 * Slice a balanced JSON object starting at the first '{' at/after `from`
 */
function sliceBalancedObject(text: string, from: number): string | null {
  const start = text.indexOf('{', from)
  if (start === -1) return null
  let depth = 0
  let inString = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.substring(start, i + 1)
    }
  }
  return null
}

/**
 * Main scraper function for Lezhin Comics
 * Accepts the comic alias (e.g. "my_own")
 */
export async function scrapeLezhin(alias: string): Promise<LezhinData> {
  console.log(`[Lezhin] Scraping for alias: ${alias}`)

  const result: LezhinData = {
    source: 'lezhin',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      alias: alias,
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
      search_query: alias,
      scraping_method: 'next_flight_data',
      response_status: null,
      error: null
    }
  }

  try {
    const url = `https://www.lezhinus.com/en/comic/${alias}`
    console.log(`[Lezhin] Fetching: ${url}`)

    const headers = { ...HEADERS }
    const cookie = Deno.env.get('LEZHIN_COOKIE')
    if (cookie) {
      headers['Cookie'] = cookie
    }

    const response = await fetch(url, { headers, redirect: 'follow' })

    result.metadata.response_status = response.status

    if (!response.ok) {
      console.error(`[Lezhin] HTTP error: ${response.status}`)
      result.metadata.error = `HTTP error: ${response.status}`
      return result
    }

    result.data.platform_url = url

    const html = await response.text()
    console.log(`[Lezhin] HTML length: ${html.length}, final URL: ${response.url}`)

    // Adult-gated titles redirect to the login page without a valid session
    if (response.url.includes('/login') || html.includes('<title>Login - Lezhin')) {
      result.metadata.error = cookie
        ? 'Lezhin session cookie expired — refresh the LEZHIN_COOKIE secret (npx supabase secrets set LEZHIN_COOKIE=...)'
        : 'Adult-gated title requires Lezhin login — set the LEZHIN_COOKIE secret (npx supabase secrets set LEZHIN_COOKIE=...)'
      return result
    }

    // Collect and unescape all flight-data chunks
    const chunks: string[] = []
    const flightRegex = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
    let m: RegExpExecArray | null
    while ((m = flightRegex.exec(html)) !== null) {
      chunks.push(unescapeJsString(m[1]))
    }
    console.log(`[Lezhin] Flight data chunks: ${chunks.length}`)

    // The comic object lives in the React Query dehydrated state: "content":{...}
    const flightData = chunks.join('')
    const contentIdx = flightData.indexOf('"content":{')
    if (contentIdx !== -1) {
      const objText = sliceBalancedObject(flightData, contentIdx)
      if (objText) {
        try {
          const content = JSON.parse(objText)

          result.title_found = true
          result.data.title_en = content.display?.title || null
          result.data.synopsis_en = content.display?.synopsis || null
          result.data.views = content.properties?.viewCount ?? null
          result.data.subscribers = content.properties?.subscriptions ?? null
          result.data.likes = content.properties?.subscriptions ?? null

          if (Array.isArray(content.genres) && content.genres.length > 0) {
            result.data.genre = content.genres
          }
          if (Array.isArray(content.properties?.tags)) {
            result.data.tags = content.properties.tags
          }

          // Artists: role is 'writer' | 'illustrator' | 'scripter' etc.
          if (Array.isArray(content.artists)) {
            const writers = content.artists
              .filter((a: any) => a.role === 'writer' || a.role === 'scripter')
              .map((a: any) => a.name)
            const illustrators = content.artists
              .filter((a: any) => a.role === 'illustrator' || a.role === 'artist' || a.role === 'painter')
              .map((a: any) => a.name)
            const all = content.artists.map((a: any) => a.name)
            result.data.author = writers.length > 0 ? writers.join(', ') : (all.join(', ') || null)
            result.data.artist = illustrators.length > 0 ? illustrators.join(', ') : (all.join(', ') || null)
          }

          result.data.completed =
            content.state === 'completed' ||
            content.display?.schedule === 'COMPLETED'

          if (content.isAdult === true) {
            result.data.age_rating = 'Adult (18+)'
          }

          if (content.updatedAt) {
            result.data.last_updated = new Date(content.updatedAt).toISOString()
          }
        } catch (parseError) {
          console.error('[Lezhin] Failed to parse content JSON:', parseError)
          result.metadata.error = `Content JSON parse error: ${parseError.message}`
        }
      }
    } else {
      console.log('[Lezhin] "content" object not found in flight data')
      result.metadata.scraping_method = 'og_meta_fallback'
    }

    // Episode count: the dehydrated ["episode", alias] query embeds the episode
    // list; each episode has a "name":"<number>" entry.
    const episodeQueryIdx = flightData.indexOf(`"queryKey":["episode","${alias}"`)
    if (episodeQueryIdx !== -1) {
      // Episode list is in the same dehydrated state blob, before the queryKey
      const episodeNames = flightData.match(/"name":"\d+"/g)
      if (episodeNames && episodeNames.length > 0) {
        result.data.chapters = episodeNames.length
      }
    }

    // og: meta tags (thumbnail always; title/synopsis as fallback)
    const ogTitleMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/i) ||
                        html.match(/content="([^"]+)"[^>]*property="og:title"/i)
    const ogDescMatch = html.match(/property="og:description"[^>]*content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"[^>]*property="og:description"/i)
    const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                        html.match(/content="([^"]+)"[^>]*property="og:image"/i)

    if (ogImageMatch) {
      result.data.thumbnail = ogImageMatch[1]
    }
    if (!result.data.title_en && ogTitleMatch) {
      // og:title format: "{Title} - {Artists} - Webtoons - Lezhin Comics"
      result.data.title_en = ogTitleMatch[1].split(' - ')[0].trim()
      result.title_found = true
    }
    if (!result.data.synopsis_en && ogDescMatch) {
      result.data.synopsis_en = ogDescMatch[1]
    }

    console.log(`[Lezhin] Extracted:`, {
      title: result.data.title_en,
      views: result.data.views,
      subscribers: result.data.subscribers,
      chapters: result.data.chapters,
      genres: result.data.genre,
      completed: result.data.completed,
      author: result.data.author,
      hasThumb: !!result.data.thumbnail,
    })

    return result

  } catch (error) {
    console.error('[Lezhin] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
    return result
  }
}
