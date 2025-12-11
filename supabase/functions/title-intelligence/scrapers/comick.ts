/**
 * Comick.live Scraper
 *
 * Purpose: Scrape fan engagement data from Comick.live (fan translation aggregator)
 *
 * Data Collected:
 * - comic_id: Unique ID on Comick
 * - title: Comic title
 * - slug: URL slug
 * - author: Author/artist name
 * - synopsis: Description
 * - genres: Genre tags
 * - themes: Theme tags
 * - origin: manhwa | manga | manhua
 * - status: completed | ongoing
 * - translation_status: Translation progress
 * - chapter_count: Number of chapters
 * - ranking: Site ranking (lower = more popular)
 * - followers: User follow count
 * - rating: Bayesian rating
 * - content_rating: safe | suggestive | etc.
 * - thumbnail: Cover image URL
 * - platform_url: Direct URL
 *
 * Strategy:
 * 1. Convert title to slug format
 * 2. Try multiple slug variations (with/without "-official")
 * 3. Fetch HTML and parse embedded JSON
 * 4. Extract og:meta tags as fallback
 *
 * Rate Limiting: Caller must implement delay between requests
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

interface ComickScraperResult {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    comic_id: number | null
    title: string | null
    slug: string | null
    author: string | null
    synopsis: string | null
    genres: string[]
    themes: string[]
    origin: string | null
    status: string | null
    translation_status: string | null
    chapter_count: number | null
    ranking: number | null
    followers: number | null
    rating: number | null
    content_rating: string | null
    thumbnail: string | null
    platform_url: string | null
    last_chapter_date: string | null
    // Engagement metrics
    engagement_score: number | null
  }
  metadata: {
    search_query: string
    scraping_method: string
    slugs_tried: string[]
    error: string | null
  }
}

/**
 * Main scraper function for Comick.live
 * Searches by title name using API, then fetches comic page for details
 */
export async function scrapeComick(titleName: string): Promise<ComickScraperResult> {
  console.log(`[Comick] Scraping for: ${titleName}`)

  const result: ComickScraperResult = {
    source: 'comick',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      comic_id: null,
      title: null,
      slug: null,
      author: null,
      synopsis: null,
      genres: [],
      themes: [],
      origin: null,
      status: null,
      translation_status: null,
      chapter_count: null,
      ranking: null,
      followers: null,
      rating: null,
      content_rating: null,
      thumbnail: null,
      platform_url: null,
      last_chapter_date: null,
      engagement_score: null,
    },
    metadata: {
      search_query: titleName,
      scraping_method: 'unknown',
      slugs_tried: [],
      error: null
    }
  }

  try {
    // Strategy 1: Use Comick API to search (works with Korean titles)
    console.log(`[Comick] Trying API search for: ${titleName}`)
    const apiResult = await searchViaApi(titleName, result)
    if (apiResult) {
      return result
    }

    // Strategy 2: Fall back to slug-based search (for English titles)
    console.log(`[Comick] API search failed, trying slug variations`)
    const slugs = generateSlugVariations(titleName)
    result.metadata.slugs_tried = slugs

    // Try each slug until we find a match
    for (const slug of slugs) {
      console.log(`[Comick] Trying slug: ${slug}`)

      const url = `https://comick.live/comic/${slug}`

      try {
        const response = await fetch(url, {
          headers: HEADERS,
          redirect: 'follow'
        })

        if (response.ok) {
          const html = await response.text()

          // Check if we got a valid comic page (not 404 page)
          if (html.includes('"comic"') || html.includes('comic_id') || html.includes('og:title')) {
            console.log(`[Comick] Found comic at slug: ${slug}`)
            result.data.platform_url = url
            result.data.slug = slug

            // Extract data from the page
            const extracted = extractFromHtml(html, result)
            if (extracted) {
              result.title_found = true
              result.metadata.scraping_method = 'html_json'

              // Calculate engagement score
              calculateEngagementScore(result)

              console.log(`[Comick] Successfully extracted data:`, {
                title: result.data.title,
                ranking: result.data.ranking,
                followers: result.data.followers,
                chapters: result.data.chapter_count
              })

              return result
            }
          }
        } else if (response.status === 404) {
          console.log(`[Comick] 404 for slug: ${slug}`)
          continue
        } else {
          console.log(`[Comick] HTTP ${response.status} for slug: ${slug}`)
        }
      } catch (fetchError) {
        console.log(`[Comick] Fetch error for ${slug}:`, fetchError.message)
        continue
      }
    }

    // No match found
    result.metadata.error = `No comic found for "${titleName}". Tried API search and slugs: ${slugs.join(', ')}`
    console.log(`[Comick] ${result.metadata.error}`)

  } catch (error) {
    console.error('[Comick] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
  }

  return result
}

/**
 * Search via Comick API (api.comick.io)
 * This handles Korean and other non-English titles
 */
async function searchViaApi(titleName: string, result: ComickScraperResult): Promise<boolean> {
  try {
    // Comick API endpoint for search
    const searchUrl = `https://api.comick.io/v1.0/search?q=${encodeURIComponent(titleName)}&limit=5&page=1`
    console.log(`[Comick] API search URL: ${searchUrl}`)

    const response = await fetch(searchUrl, {
      headers: {
        ...HEADERS,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.log(`[Comick] API search returned ${response.status}`)
      return false
    }

    const data = await response.json()
    console.log(`[Comick] API search returned ${data?.length || 0} results`)

    if (!data || !Array.isArray(data) || data.length === 0) {
      return false
    }

    // Get the best match (first result)
    const comic = data[0]
    console.log(`[Comick] Best match: ${comic.title} (slug: ${comic.slug})`)

    // Extract data from API response
    result.data.comic_id = comic.id || null
    result.data.title = comic.title || null
    result.data.slug = comic.slug || null
    result.data.synopsis = comic.desc || null
    result.data.status = comic.status === 1 ? 'ongoing' : comic.status === 2 ? 'completed' : null
    result.data.content_rating = comic.content_rating || null
    result.data.chapter_count = comic.last_chapter || null
    result.data.followers = comic.follow_count || comic.user_follow_count || null
    result.data.rating = comic.rating || comic.bayesian_rating || null
    result.data.ranking = comic.rank || null

    // Extract origin/country
    if (comic.country) {
      result.data.origin = comic.country === 'kr' ? 'manhwa' :
                           comic.country === 'jp' ? 'manga' :
                           comic.country === 'cn' ? 'manhua' : comic.country
    }

    // Extract genres
    if (comic.genres && Array.isArray(comic.genres)) {
      result.data.genres = comic.genres.map((g: any) => g.name || g).filter(Boolean)
    }
    if (comic.md_genres && Array.isArray(comic.md_genres)) {
      const genres = comic.md_genres.map((g: any) => g.name || g.md_genres?.name || g).filter(Boolean)
      result.data.genres = [...new Set([...result.data.genres, ...genres])]
    }

    // Extract thumbnail
    if (comic.md_covers && comic.md_covers.length > 0) {
      const cover = comic.md_covers[0]
      if (cover.b2key) {
        result.data.thumbnail = `https://meo.comick.pictures/${cover.b2key}`
      }
    } else if (comic.cover_url) {
      result.data.thumbnail = comic.cover_url.startsWith('http') ? comic.cover_url : `https://meo.comick.pictures/${comic.cover_url}`
    }

    // Extract authors
    if (comic.authors && Array.isArray(comic.authors) && comic.authors.length > 0) {
      result.data.author = comic.authors.map((a: any) => a.name || a).join(', ')
    } else if (comic.md_comic_md_authors && Array.isArray(comic.md_comic_md_authors) && comic.md_comic_md_authors.length > 0) {
      result.data.author = comic.md_comic_md_authors.map((a: any) => a.md_authors?.name || a.name || a).filter(Boolean).join(', ')
    }

    // Set platform URL
    result.data.platform_url = `https://comick.live/comic/${comic.slug}`

    result.title_found = true
    result.metadata.scraping_method = 'api_search'

    // Calculate engagement score
    calculateEngagementScore(result)

    console.log(`[Comick] API extraction successful:`, {
      title: result.data.title,
      slug: result.data.slug,
      ranking: result.data.ranking,
      followers: result.data.followers,
      chapters: result.data.chapter_count
    })

    return true

  } catch (error) {
    console.log(`[Comick] API search error:`, error.message)
    return false
  }
}

/**
 * Generate slug variations from a title
 * Example: "Does Love Need a Translator?" ->
 *   ["does-love-need-a-translator", "does-love-need-a-translator-official", ...]
 */
function generateSlugVariations(title: string): string[] {
  const slugs: string[] = []

  // Clean the title
  let base = title
    .toLowerCase()
    .replace(/['"'"]/g, '')           // Remove quotes
    .replace(/[?!.,;:()[\]{}]/g, '')  // Remove punctuation
    .replace(/&/g, 'and')             // Replace & with and
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-|-$/g, '')            // Trim leading/trailing hyphens

  slugs.push(base)

  // Try with "-official" suffix (common for licensed works)
  slugs.push(`${base}-official`)

  // Try without "the" prefix
  if (base.startsWith('the-')) {
    slugs.push(base.substring(4))
    slugs.push(`${base.substring(4)}-official`)
  }

  // Try with common Korean romanization variations
  // "ae" vs "e", "oo" vs "u", etc.
  if (base.includes('ae')) {
    slugs.push(base.replace(/ae/g, 'e'))
  }

  return [...new Set(slugs)] // Remove duplicates
}

/**
 * Extract data from HTML page
 */
function extractFromHtml(html: string, result: ComickScraperResult): boolean {
  let extracted = false

  // Try to extract from embedded JSON first (most reliable)
  extracted = extractFromEmbeddedJson(html, result) || extracted

  // Extract from og:meta tags as supplement
  extractFromOgMeta(html, result)

  // Extract from visible HTML patterns
  extractFromHtmlPatterns(html, result)

  return extracted || !!(result.data.title)
}

/**
 * Extract from embedded JSON in the page
 * Comick embeds comic data in script tags or data attributes
 */
function extractFromEmbeddedJson(html: string, result: ComickScraperResult): boolean {
  let extracted = false

  // Look for JSON patterns in the HTML
  // Pattern: "id":101380 or "comic_id":101380
  const idMatch = html.match(/"(?:id|comic_id)":\s*(\d+)/)
  if (idMatch) {
    result.data.comic_id = parseInt(idMatch[1], 10)
    extracted = true
  }

  // Title pattern
  const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
  if (titleMatch && !result.data.title) {
    result.data.title = decodeUnicode(titleMatch[1])
    extracted = true
  }

  // Slug pattern
  const slugMatch = html.match(/"slug"\s*:\s*"([^"]+)"/)
  if (slugMatch && !result.data.slug) {
    result.data.slug = slugMatch[1]
  }

  // Author/creators pattern
  const creatorsMatch = html.match(/"(?:authors?|creators?|artist)"\s*:\s*"([^"]+)"/)
  if (creatorsMatch) {
    result.data.author = decodeUnicode(creatorsMatch[1])
    extracted = true
  }

  // Synopsis/description pattern
  const descMatch = html.match(/"(?:desc|description|synopsis)"\s*:\s*"([^"]{10,})"/)
  if (descMatch) {
    let desc = descMatch[1]
    desc = desc.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    result.data.synopsis = decodeUnicode(desc)
    extracted = true
  }

  // Status pattern
  const statusMatch = html.match(/"status"\s*:\s*(\d+)/)
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10)
    // 1 = ongoing, 2 = completed, 3 = cancelled, 4 = hiatus
    result.data.status = statusCode === 2 ? 'completed' : statusCode === 1 ? 'ongoing' : 'other'
    extracted = true
  }

  // Translation status pattern
  const translationMatch = html.match(/"translation_status"\s*:\s*"([^"]+)"/) ||
                           html.match(/"trans(?:lation)?_status"\s*:\s*(\d+)/)
  if (translationMatch) {
    result.data.translation_status = translationMatch[1]
  }

  // Chapter count
  const chapterMatch = html.match(/"(?:chapter_count|total_chapters|last_chapter)"\s*:\s*(\d+)/)
  if (chapterMatch) {
    result.data.chapter_count = parseInt(chapterMatch[1], 10)
    extracted = true
  }

  // Ranking
  const rankMatch = html.match(/"(?:rank|ranking|bayesian_rank)"\s*:\s*(\d+)/)
  if (rankMatch) {
    result.data.ranking = parseInt(rankMatch[1], 10)
    extracted = true
  }

  // Followers
  const followMatch = html.match(/"(?:follow(?:er)?s?|user_follow(?:er)?s?)"\s*:\s*(\d+)/)
  if (followMatch) {
    result.data.followers = parseInt(followMatch[1], 10)
    extracted = true
  }

  // Rating
  const ratingMatch = html.match(/"(?:rating|bayesian_rating|score)"\s*:\s*([\d.]+)/)
  if (ratingMatch) {
    result.data.rating = parseFloat(ratingMatch[1])
    extracted = true
  }

  // Content rating
  const contentRatingMatch = html.match(/"content_rating"\s*:\s*"([^"]+)"/)
  if (contentRatingMatch) {
    result.data.content_rating = contentRatingMatch[1]
  }

  // Origin (country)
  const originMatch = html.match(/"(?:country|origin)"\s*:\s*"([^"]+)"/)
  if (originMatch) {
    const origin = originMatch[1].toLowerCase()
    result.data.origin = origin === 'kr' ? 'manhwa' : origin === 'jp' ? 'manga' : origin === 'cn' ? 'manhua' : origin
  }

  // Genres - look for genres array
  const genresMatch = html.match(/"genres"\s*:\s*\[([^\]]+)\]/)
  if (genresMatch) {
    const genresStr = genresMatch[1]
    const genreNames = genresStr.matchAll(/"(?:name|group)"\s*:\s*"([^"]+)"/g)
    for (const match of genreNames) {
      const genre = match[1]
      if (genre && !result.data.genres.includes(genre)) {
        result.data.genres.push(genre)
      }
    }
    if (result.data.genres.length > 0) extracted = true
  }

  // Cover/thumbnail
  const coverMatch = html.match(/"(?:cover|cover_url|md_covers)"[^}]*"b2key"\s*:\s*"([^"]+)"/) ||
                     html.match(/"cover(?:_url)?"\s*:\s*"([^"]+)"/)
  if (coverMatch) {
    let cover = coverMatch[1]
    if (!cover.startsWith('http')) {
      // Comick uses meo.comick.pictures for images
      cover = `https://meo.comick.pictures/${cover}`
    }
    result.data.thumbnail = cover
  }

  return extracted
}

/**
 * Extract from og:meta tags
 */
function extractFromOgMeta(html: string, result: ComickScraperResult): boolean {
  let extracted = false

  // og:title
  if (!result.data.title) {
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i)
    if (titleMatch) {
      let title = decodeHTMLEntities(titleMatch[1])
      // Clean up - remove suffix like " - Comick"
      title = title.replace(/\s*[-|]\s*Comick.*$/i, '').trim()
      if (title) {
        result.data.title = title
        extracted = true
      }
    }
  }

  // og:description
  if (!result.data.synopsis) {
    const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/i)
    if (descMatch) {
      result.data.synopsis = decodeHTMLEntities(descMatch[1])
      extracted = true
    }
  }

  // og:image
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
 * Extract from visible HTML patterns
 */
function extractFromHtmlPatterns(html: string, result: ComickScraperResult): void {
  // Ranking: "#5655" pattern
  if (!result.data.ranking) {
    const rankMatch = html.match(/#(\d{1,6})(?:\s|<|$)/)
    if (rankMatch) {
      result.data.ranking = parseInt(rankMatch[1], 10)
    }
  }

  // Chapter count: "65 Chapters" or "Ch. 65"
  if (!result.data.chapter_count) {
    const chapterMatch = html.match(/(\d+)\s*(?:chapters?|ch\.)/i) ||
                         html.match(/Ch\.\s*(\d+)/i)
    if (chapterMatch) {
      result.data.chapter_count = parseInt(chapterMatch[1], 10)
    }
  }

  // Status indicators
  if (!result.data.status) {
    if (html.includes('📗') || html.match(/status.*completed/i)) {
      result.data.status = 'completed'
    } else if (html.includes('📖') || html.match(/status.*ongoing/i)) {
      result.data.status = 'ongoing'
    }
  }
}

/**
 * Calculate engagement score based on available metrics
 */
function calculateEngagementScore(result: ComickScraperResult): void {
  let score = 0
  let factors = 0

  // Ranking contribution (inverse - lower rank = higher score)
  if (result.data.ranking) {
    // Rank 1 = 100 points, rank 10000 = ~10 points
    const rankScore = Math.max(0, 100 - Math.log10(result.data.ranking) * 25)
    score += rankScore
    factors++
  }

  // Followers contribution
  if (result.data.followers) {
    const followerScore = Math.log10(result.data.followers + 1) * 15
    score += followerScore
    factors++
  }

  // Chapter count contribution (more chapters = more engagement opportunity)
  if (result.data.chapter_count) {
    const chapterScore = Math.min(30, result.data.chapter_count * 0.5)
    score += chapterScore
    factors++
  }

  // Rating contribution
  if (result.data.rating && result.data.rating > 0) {
    const ratingScore = result.data.rating * 10
    score += ratingScore
    factors++
  }

  if (factors > 0) {
    result.data.engagement_score = Math.round((score / factors) * 100) / 100
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

/**
 * Decode Unicode escape sequences
 */
function decodeUnicode(text: string): string {
  if (!text) return ''
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  )
}
