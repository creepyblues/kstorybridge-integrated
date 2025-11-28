/**
 * Archive of Our Own (AO3) Scraper
 *
 * Purpose: Collect fanfiction data to measure fan engagement
 *
 * Data Collected:
 * - works: Total number of fanfiction works
 * - total_kudos: Aggregated kudos across visible works
 * - total_bookmarks: Aggregated bookmarks across visible works
 * - total_comments: Aggregated comments across visible works
 * - top_works: Top 5 works by kudos
 * - popular_relationships: Most common relationship tags
 * - popular_characters: Most common character tags
 * - popular_freeform_tags: Most common freeform tags
 * - fandoms: Related fandom tags
 *
 * API: AO3 has no public API, so we use HTML scraping
 * Rate Limiting: AO3 requests 1 request per 5 seconds (we use 3 seconds)
 *
 * Note: AO3 allows scraping but requires respectful rate limiting
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; KStoryBridge/1.0; +https://kstorybridge.com)'

interface AO3Work {
  id: string
  title: string
  authors: string[]
  fandoms: string[]
  kudos: number
  bookmarks: number
  comments: number
  chapters: string
  url: string
  relationships: string[]
  characters: string[]
  freeform_tags: string[]
  rating: string
}

interface AO3ScraperResult {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    works: number
    total_kudos: number
    total_bookmarks: number
    total_comments: number
    avg_kudos: number | null
    avg_bookmarks: number | null
    top_works: Array<{
      id: string
      title: string
      kudos: number
      bookmarks: number
      comments: number
      url: string
      authors: string[]
    }>
    popular_relationships: Array<{ tag: string; count: number }>
    popular_characters: Array<{ tag: string; count: number }>
    popular_freeform_tags: Array<{ tag: string; count: number }>
    fandoms: string[]
    engagement_score: number | null
  }
  metadata: {
    search_query: string
    scraping_method: string
    works_analyzed: number
    error: string | null
  }
}

/**
 * Main scraper function for AO3
 * Searches for fanfiction works and aggregates metrics
 */
export async function scrapeAO3(titleName: string): Promise<AO3ScraperResult> {
  console.log(`[AO3] Scraping for: ${titleName}`)

  const result: AO3ScraperResult = {
    source: 'ao3',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      works: 0,
      total_kudos: 0,
      total_bookmarks: 0,
      total_comments: 0,
      avg_kudos: null,
      avg_bookmarks: null,
      top_works: [],
      popular_relationships: [],
      popular_characters: [],
      popular_freeform_tags: [],
      fandoms: [],
      engagement_score: null
    },
    metadata: {
      search_query: titleName,
      scraping_method: 'ao3_html_scraping',
      works_analyzed: 0,
      error: null
    }
  }

  try {
    // Fetch search results page
    const html = await fetchAO3Search(titleName)

    if (!html) {
      result.metadata.error = 'Failed to fetch AO3 search results'
      return result
    }

    // Extract total work count from header
    const totalWorksMatch = html.match(/<h3 class="heading">\s*([\d,]+)\s*Found/i)
    if (totalWorksMatch) {
      result.data.works = parseInt(totalWorksMatch[1].replace(/,/g, ''), 10)
      result.title_found = true
      console.log(`[AO3] Found ${result.data.works} total works`)
    }

    if (!result.title_found) {
      // Check for "No results found" message
      if (html.includes('No results found') || html.includes('0 Found')) {
        result.metadata.error = 'No fanfiction works found for this title'
      } else {
        result.metadata.error = 'Could not parse AO3 search results'
      }
      return result
    }

    // Parse individual works from the page
    const works = parseWorksFromHtml(html)
    result.metadata.works_analyzed = works.length

    console.log(`[AO3] Parsed ${works.length} works from search results`)

    // Aggregate statistics
    let totalKudos = 0
    let totalBookmarks = 0
    let totalComments = 0
    const relationshipCounts = new Map<string, number>()
    const characterCounts = new Map<string, number>()
    const freeformCounts = new Map<string, number>()
    const fandomSet = new Set<string>()

    for (const work of works) {
      totalKudos += work.kudos
      totalBookmarks += work.bookmarks
      totalComments += work.comments

      // Count relationships
      for (const rel of work.relationships) {
        relationshipCounts.set(rel, (relationshipCounts.get(rel) || 0) + 1)
      }

      // Count characters
      for (const char of work.characters) {
        characterCounts.set(char, (characterCounts.get(char) || 0) + 1)
      }

      // Count freeform tags
      for (const tag of work.freeform_tags) {
        freeformCounts.set(tag, (freeformCounts.get(tag) || 0) + 1)
      }

      // Collect fandoms
      for (const fandom of work.fandoms) {
        fandomSet.add(fandom)
      }
    }

    // Set aggregated data
    result.data.total_kudos = totalKudos
    result.data.total_bookmarks = totalBookmarks
    result.data.total_comments = totalComments

    if (works.length > 0) {
      result.data.avg_kudos = Math.round(totalKudos / works.length)
      result.data.avg_bookmarks = Math.round(totalBookmarks / works.length)
    }

    // Get top 5 works by kudos
    const sortedWorks = [...works].sort((a, b) => b.kudos - a.kudos)
    result.data.top_works = sortedWorks.slice(0, 5).map(work => ({
      id: work.id,
      title: work.title,
      kudos: work.kudos,
      bookmarks: work.bookmarks,
      comments: work.comments,
      url: work.url,
      authors: work.authors
    }))

    // Get top 10 of each tag type
    result.data.popular_relationships = getTopTags(relationshipCounts, 10)
    result.data.popular_characters = getTopTags(characterCounts, 10)
    result.data.popular_freeform_tags = getTopTags(freeformCounts, 10)
    result.data.fandoms = Array.from(fandomSet).slice(0, 10)

    // Calculate engagement score
    // Formula: log10(works) * 3 + log10(kudos + 1) * 2 + log10(bookmarks + 1) * 2
    const engagementScore =
      Math.log10(result.data.works + 1) * 3 +
      Math.log10(totalKudos + 1) * 2 +
      Math.log10(totalBookmarks + 1) * 2
    result.data.engagement_score = Math.round(engagementScore * 100) / 100

    console.log(`[AO3] Aggregated: ${totalKudos} kudos, ${totalBookmarks} bookmarks, ${totalComments} comments`)

    return result

  } catch (error) {
    console.error('[AO3] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
    return result
  }
}

/**
 * Fetch AO3 search results page
 */
async function fetchAO3Search(query: string): Promise<string | null> {
  console.log(`[AO3] Fetching search for: ${query}`)

  try {
    const encodedQuery = encodeURIComponent(query)
    // Sort by kudos to get most popular works first
    const url = `https://archiveofourown.org/works/search?work_search[query]=${encodedQuery}&work_search[sort_column]=kudos_count&work_search[sort_direction]=desc`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) {
      console.error(`[AO3] Search error: ${response.status}`)

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('AO3 rate limit exceeded. Please try again later.')
      }

      throw new Error(`AO3 error: ${response.status}`)
    }

    const html = await response.text()
    console.log(`[AO3] Retrieved ${html.length} characters`)

    return html

  } catch (error) {
    console.error('[AO3] Search fetch error:', error)
    throw error
  }
}

/**
 * Parse work entries from AO3 search results HTML
 */
function parseWorksFromHtml(html: string): AO3Work[] {
  const works: AO3Work[] = []

  // Find all work entries: <li id="work_XXXXX" class="work blurb group"
  const workRegex = /<li id="work_(\d+)" class="work blurb group[^"]*"[^>]*>[\s\S]*?<\/li>\s*(?=<li|<\/ol)/gi
  const workMatches = html.matchAll(workRegex)

  for (const match of workMatches) {
    try {
      const workHtml = match[0]
      const workId = match[1]

      const work: AO3Work = {
        id: workId,
        title: '',
        authors: [],
        fandoms: [],
        kudos: 0,
        bookmarks: 0,
        comments: 0,
        chapters: '',
        url: `https://archiveofourown.org/works/${workId}`,
        relationships: [],
        characters: [],
        freeform_tags: [],
        rating: ''
      }

      // Extract title: <a href="/works/XXXXX">Title Here</a>
      const titleMatch = workHtml.match(/<h4 class="heading">[\s\S]*?<a href="\/works\/\d+">([^<]+)<\/a>/i)
      if (titleMatch) {
        work.title = decodeHTMLEntities(titleMatch[1].trim())
      }

      // Extract authors: <a rel="author" href="...">AuthorName</a>
      const authorMatches = workHtml.matchAll(/<a rel="author"[^>]*>([^<]+)<\/a>/gi)
      for (const authorMatch of authorMatches) {
        work.authors.push(decodeHTMLEntities(authorMatch[1]))
      }

      // Extract fandoms: <a class="tag" href="/tags/.../works">Fandom Name</a>
      const fandomSection = workHtml.match(/<h5 class="fandoms heading">([\s\S]*?)<\/h5>/i)
      if (fandomSection) {
        const fandomMatches = fandomSection[1].matchAll(/<a class="tag"[^>]*>([^<]+)<\/a>/gi)
        for (const fandomMatch of fandomMatches) {
          work.fandoms.push(decodeHTMLEntities(fandomMatch[1]))
        }
      }

      // Extract stats from <dl class="stats">
      // Kudos: <dd class="kudos"><a href="...">46</a></dd> or <dd class="kudos">46</dd>
      const kudosMatch = workHtml.match(/<dd class="kudos">(?:<a[^>]*>)?(\d+)(?:<\/a>)?<\/dd>/i)
      if (kudosMatch) {
        work.kudos = parseInt(kudosMatch[1], 10)
      }

      // Bookmarks: <dd class="bookmarks"><a href="...">13</a></dd>
      const bookmarksMatch = workHtml.match(/<dd class="bookmarks">(?:<a[^>]*>)?(\d+)(?:<\/a>)?<\/dd>/i)
      if (bookmarksMatch) {
        work.bookmarks = parseInt(bookmarksMatch[1], 10)
      }

      // Comments: <dd class="comments"><a href="...">5</a></dd>
      const commentsMatch = workHtml.match(/<dd class="comments">(?:<a[^>]*>)?(\d+)(?:<\/a>)?<\/dd>/i)
      if (commentsMatch) {
        work.comments = parseInt(commentsMatch[1], 10)
      }

      // Chapters: <dd class="chapters">1/?</dd>
      const chaptersMatch = workHtml.match(/<dd class="chapters">(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/dd>/i)
      if (chaptersMatch) {
        work.chapters = chaptersMatch[1].trim()
      }

      // Extract relationships: <li class='relationships'><a class="tag"...>Tag</a></li>
      const relMatches = workHtml.matchAll(/<li class='relationships'><a class="tag"[^>]*>([^<]+)<\/a><\/li>/gi)
      for (const relMatch of relMatches) {
        work.relationships.push(decodeHTMLEntities(relMatch[1]))
      }

      // Extract characters: <li class='characters'><a class="tag"...>Tag</a></li>
      const charMatches = workHtml.matchAll(/<li class='characters'><a class="tag"[^>]*>([^<]+)<\/a><\/li>/gi)
      for (const charMatch of charMatches) {
        work.characters.push(decodeHTMLEntities(charMatch[1]))
      }

      // Extract freeform tags: <li class='freeforms'><a class="tag"...>Tag</a></li>
      const tagMatches = workHtml.matchAll(/<li class='freeforms'><a class="tag"[^>]*>([^<]+)<\/a><\/li>/gi)
      for (const tagMatch of tagMatches) {
        work.freeform_tags.push(decodeHTMLEntities(tagMatch[1]))
      }

      works.push(work)

    } catch (parseError) {
      console.error('[AO3] Error parsing work:', parseError)
      // Continue with next work
    }
  }

  return works
}

/**
 * Get top N tags from a count map
 */
function getTopTags(countMap: Map<string, number>, limit: number): Array<{ tag: string; count: number }> {
  return Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
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
    .replace(/\*a\*/g, '&')  // AO3 uses *a* for &
    .replace(/\*s\*/g, '/')  // AO3 uses *s* for /
    .trim()
}

/**
 * Calculate a normalized popularity score for AO3 engagement
 * Returns a score from 0-100
 */
export function calculateAO3PopularityScore(data: AO3ScraperResult['data']): number {
  if (data.works === 0) return 0

  // Weight factors
  const workWeight = 5       // More works = more fan interest
  const kudosWeight = 1      // Kudos show appreciation
  const bookmarkWeight = 3   // Bookmarks show deeper engagement

  // Calculate raw score
  const rawScore =
    (data.works * workWeight) +
    (data.total_kudos * kudosWeight) +
    (data.total_bookmarks * bookmarkWeight)

  // Apply logarithmic scaling
  const scaledScore = Math.log10(rawScore + 1) * 20

  // Clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(scaledScore)))
}
