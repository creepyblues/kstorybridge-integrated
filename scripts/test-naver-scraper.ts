/**
 * Test script for Naver scraper (Updated for SPA approach)
 * Run with: npx ts-node scripts/test-naver-scraper.ts
 */

const NOMAD_API_BASE = 'https://webtoon-crawler.nomadcoders.workers.dev'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
}

interface NaverWebtoonData {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    titleId: string | null
    title_ko: string | null
    synopsis_kr: string | null
    genre: string[] | null
    age_rating: string | null
    thumbnail: string | null
    platform_url: string | null
    chapters: number | null
  }
  metadata: {
    search_query: string
    error: string | null
  }
}

/**
 * Find titleId by searching through today's webtoons
 */
async function findTitleIdByName(titleName: string): Promise<string | null> {
  console.log(`[Naver] Searching for: ${titleName}`)

  const normalizedSearch = titleName.toLowerCase().trim().replace(/\s+/g, '')

  try {
    const response = await fetch(`${NOMAD_API_BASE}/today`)
    if (!response.ok) {
      console.error(`[Naver] Failed to fetch today's list: ${response.status}`)
      return null
    }

    const webtoons: Array<{ id: string; title: string }> = await response.json()
    console.log(`[Naver] Loaded ${webtoons.length} webtoons from today's list`)

    // Try exact match
    for (const webtoon of webtoons) {
      const normalizedTitle = webtoon.title.toLowerCase().trim().replace(/\s+/g, '')
      if (normalizedTitle === normalizedSearch) {
        console.log(`[Naver] Exact match: ${webtoon.title} (${webtoon.id})`)
        return webtoon.id
      }
    }

    // Try partial match
    for (const webtoon of webtoons) {
      const normalizedTitle = webtoon.title.toLowerCase().trim().replace(/\s+/g, '')
      if (normalizedTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedTitle)) {
        console.log(`[Naver] Partial match: ${webtoon.title} (${webtoon.id})`)
        return webtoon.id
      }
    }

    // Direct titleId input
    if (/^\d{6,7}$/.test(titleName)) {
      return titleName
    }

    return null
  } catch (error) {
    console.error('[Naver] Search error:', error)
    return null
  }
}

/**
 * Fetch data from unofficial API
 */
async function fetchFromApi(titleId: string): Promise<any> {
  const response = await fetch(`${NOMAD_API_BASE}/${titleId}`)
  if (!response.ok) return null
  return response.json()
}

/**
 * Fetch og:meta tags
 */
async function fetchOgMeta(titleId: string): Promise<{ title?: string; description?: string; image?: string } | null> {
  try {
    const url = `https://comic.naver.com/webtoon/list?titleId=${titleId}`
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return null

    const html = await response.text()

    const result: { title?: string; description?: string; image?: string } = {}

    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    if (titleMatch) result.title = titleMatch[1]

    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    if (descMatch) result.description = descMatch[1]

    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (imageMatch) result.image = imageMatch[1]

    return result
  } catch {
    return null
  }
}

/**
 * Fetch episode count
 */
async function fetchEpisodes(titleId: string): Promise<number | null> {
  try {
    const response = await fetch(`${NOMAD_API_BASE}/${titleId}/episodes`)
    if (!response.ok) return null
    const episodes = await response.json()
    return Array.isArray(episodes) ? episodes.length : null
  } catch {
    return null
  }
}

/**
 * Main scraper function
 */
async function scrapeNaver(titleName: string): Promise<NaverWebtoonData> {
  console.log(`\n=== Scraping: ${titleName} ===`)

  const result: NaverWebtoonData = {
    source: 'naver',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      titleId: null,
      title_ko: null,
      synopsis_kr: null,
      genre: null,
      age_rating: null,
      thumbnail: null,
      platform_url: null,
      chapters: null,
    },
    metadata: {
      search_query: titleName,
      error: null
    }
  }

  // Step 1: Find titleId
  const titleId = await findTitleIdByName(titleName)
  if (!titleId) {
    result.metadata.error = 'Title not found'
    console.log('❌ Title not found')
    return result
  }

  result.data.titleId = titleId
  result.data.platform_url = `https://comic.naver.com/webtoon/list?titleId=${titleId}`

  // Step 2: Fetch API data
  const apiData = await fetchFromApi(titleId)
  if (apiData) {
    result.title_found = true
    result.data.title_ko = apiData.title || null
    result.data.synopsis_kr = apiData.about || null
    result.data.genre = apiData.genre ? apiData.genre.split(', ') : null
    result.data.age_rating = apiData.age || null
    result.data.thumbnail = apiData.thumb || null
  }

  // Step 3: Fetch og:meta
  const metaData = await fetchOgMeta(titleId)
  if (metaData) {
    result.data.title_ko = metaData.title || result.data.title_ko
    result.data.synopsis_kr = metaData.description || result.data.synopsis_kr
    result.title_found = true
  }

  // Step 4: Fetch episodes
  result.data.chapters = await fetchEpisodes(titleId)

  return result
}

// Test
async function main() {
  console.log('=== Naver Webtoon Scraper Test ===\n')

  // Test with titleId directly (known working title)
  console.log('Test 1: Direct titleId (747269 - 전지적 독자 시점)')
  const test1 = await scrapeNaver('747269')
  console.log('Result:', JSON.stringify(test1, null, 2))

  await new Promise(r => setTimeout(r, 1000))

  // Test with title from today's list
  console.log('\n\nTest 2: Search from today\'s webtoons (쿠베라)')
  const test2 = await scrapeNaver('쿠베라')
  console.log('Result:', JSON.stringify(test2, null, 2))

  await new Promise(r => setTimeout(r, 1000))

  // Test with title NOT in today's list (should fail)
  console.log('\n\nTest 3: Title not in today\'s list (신의 탑)')
  const test3 = await scrapeNaver('신의 탑')
  console.log('Result:', JSON.stringify(test3, null, 2))
}

main().catch(console.error)
