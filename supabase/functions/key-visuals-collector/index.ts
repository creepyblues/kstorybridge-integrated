/**
 * Key Visuals Collector Edge Function
 *
 * Purpose: Collect key visual images from various sources:
 * 1. Platform URLs (from title_url field) - extract cover and promotional images
 * 2. Google Image Search - find character images, scenes, promotional art
 *
 * Flow:
 * 1. Receive request with title ID or search query
 * 2. Scrape images from platform URL (if available)
 * 3. Search for additional images via web search
 * 4. Return list of discovered images for admin selection
 *
 * Note: This function does NOT save images to storage.
 * The frontend handles image selection and storage upload.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KeyVisualsRequest {
  titleId?: string
  titleName?: string
  titleNameKr?: string
  titleUrl?: string
  titleUrlEn?: string
  collectedBy: string
  limit?: number  // Default 20, max 30
}

interface DiscoveredImage {
  url: string
  thumbnailUrl?: string
  source: 'platform' | 'search' | 'external'
  sourceDomain: string
  imageType: 'cover' | 'character' | 'scene' | 'promotional' | 'other'
  width?: number
  height?: number
  title?: string
}

interface KeyVisualsResponse {
  success: boolean
  images: DiscoveredImage[]
  totalFound: number
  errors: Record<string, string>
}

/**
 * Extract images from Naver Webtoon page
 */
async function scrapeNaverWebtoonImages(url: string): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = []

  try {
    console.log(`[Naver Webtoon] Scraping images from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      console.error(`[Naver Webtoon] HTTP error: ${response.status}`)
      return images
    }

    const html = await response.text()

    // Extract main cover image
    const coverMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (coverMatch && coverMatch[1]) {
      images.push({
        url: coverMatch[1],
        source: 'platform',
        sourceDomain: 'comic.naver.com',
        imageType: 'cover',
        title: 'Main Cover',
      })
    }

    // Extract thumbnail from page
    const thumbMatch = html.match(/class="[^"]*detail[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i)
    if (thumbMatch && thumbMatch[1] && !thumbMatch[1].includes('default')) {
      const thumbUrl = thumbMatch[1].startsWith('//') ? 'https:' + thumbMatch[1] : thumbMatch[1]
      if (!images.some(img => img.url === thumbUrl)) {
        images.push({
          url: thumbUrl,
          source: 'platform',
          sourceDomain: 'comic.naver.com',
          imageType: 'cover',
          title: 'Thumbnail',
        })
      }
    }

    console.log(`[Naver Webtoon] Found ${images.length} images`)
  } catch (error) {
    console.error('[Naver Webtoon] Scrape error:', error)
  }

  return images
}

/**
 * Extract images from Kakao Page
 */
async function scrapeKakaoImages(url: string): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = []

  try {
    console.log(`[Kakao] Scraping images from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      console.error(`[Kakao] HTTP error: ${response.status}`)
      return images
    }

    const html = await response.text()

    // Extract OG image
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (ogMatch && ogMatch[1]) {
      images.push({
        url: ogMatch[1],
        source: 'platform',
        sourceDomain: 'page.kakao.com',
        imageType: 'cover',
        title: 'Main Cover',
      })
    }

    // Look for additional promotional images in page data
    const imgMatches = html.matchAll(/https:\/\/[^"'\s]+(?:kakaocdn|kakao)[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi)
    for (const match of imgMatches) {
      const imgUrl = match[0]
      if (!images.some(img => img.url === imgUrl) && !imgUrl.includes('icon') && !imgUrl.includes('logo')) {
        images.push({
          url: imgUrl,
          source: 'platform',
          sourceDomain: 'page.kakao.com',
          imageType: 'promotional',
        })
      }
    }

    console.log(`[Kakao] Found ${images.length} images`)
  } catch (error) {
    console.error('[Kakao] Scrape error:', error)
  }

  return images.slice(0, 10)  // Limit platform images
}

/**
 * Extract images from Manta
 */
async function scrapeMantaImages(url: string): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = []

  try {
    console.log(`[Manta] Scraping images from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      console.error(`[Manta] HTTP error: ${response.status}`)
      return images
    }

    const html = await response.text()

    // Extract OG image
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (ogMatch && ogMatch[1]) {
      images.push({
        url: ogMatch[1],
        source: 'platform',
        sourceDomain: 'manta.net',
        imageType: 'cover',
        title: 'Main Cover',
      })
    }

    console.log(`[Manta] Found ${images.length} images`)
  } catch (error) {
    console.error('[Manta] Scrape error:', error)
  }

  return images
}

/**
 * Search for images using Google Custom Search API
 * Searches with both Korean and English title names for better coverage
 */
async function searchImagesWithGoogle(
  titleNameKr: string | undefined,
  titleNameEn: string | undefined,
  limit: number = 15
): Promise<DiscoveredImage[]> {
  const apiKey = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY')
  const searchEngineId = Deno.env.get('GOOGLE_CUSTOM_SEARCH_ENGINE_ID')

  if (!apiKey || !searchEngineId) {
    console.log('[Image Search] Google Custom Search not configured - skipping image search')
    console.log('[Image Search] Set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID secrets')
    return []
  }

  const images: DiscoveredImage[] = []
  const seenUrls = new Set<string>()

  // Helper function to perform a single Google image search
  async function performSearch(query: string, imageType: 'cover' | 'character' | 'scene' | 'promotional' | 'other'): Promise<void> {
    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodedQuery}&searchType=image&num=10&safe=active`

      console.log(`[Image Search] Searching: "${query}"`)

      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Image Search] API error: ${response.status} - ${errorText}`)
        return
      }

      const data = await response.json()

      // Debug: Log full response structure
      console.log(`[Image Search] Response for "${query}": items=${data.items?.length || 0}, error=${JSON.stringify(data.error || null)}`)

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const imageUrl = item.link

          // Skip if already seen or invalid
          if (!imageUrl || seenUrls.has(imageUrl)) continue
          if (imageUrl.includes('icon') || imageUrl.includes('logo') || imageUrl.includes('avatar')) continue

          seenUrls.add(imageUrl)

          images.push({
            url: imageUrl,
            thumbnailUrl: item.image?.thumbnailLink,
            source: 'search',
            sourceDomain: new URL(imageUrl).hostname,
            imageType,
            width: item.image?.width,
            height: item.image?.height,
            title: item.title,
          })
        }
        console.log(`[Image Search] Found ${data.items.length} results for "${query}"`)
      }
    } catch (error) {
      console.error(`[Image Search] Error searching "${query}":`, error)
    }
  }

  // Search with Korean name first (usually more results for Korean content)
  if (titleNameKr) {
    console.log(`[Image Search] Searching with Korean title: ${titleNameKr}`)

    // Korean search queries - 웹툰 prefix for better accuracy
    await performSearch(`웹툰 ${titleNameKr}`, 'cover')
    await performSearch(`웹툰 ${titleNameKr} 표지`, 'cover')
    await performSearch(`웹툰 ${titleNameKr} 캐릭터`, 'character')
    await performSearch(`웹툰 ${titleNameKr} 명장면`, 'scene')

    // If we don't have enough results, try more generic Korean searches
    if (images.length < limit / 2) {
      await performSearch(`${titleNameKr} 웹툰`, 'promotional')
    }
  }

  // Search with English name
  if (titleNameEn && images.length < limit) {
    console.log(`[Image Search] Searching with English title: ${titleNameEn}`)

    // English search queries
    await performSearch(`${titleNameEn} webtoon cover`, 'cover')
    await performSearch(`${titleNameEn} manhwa character`, 'character')
    await performSearch(`${titleNameEn} comic art`, 'promotional')
  }

  console.log(`[Image Search] Total images found: ${images.length}`)

  // Return up to the limit
  return images.slice(0, limit)
}

/**
 * Handle proxy image request - fetch image and upload to Supabase storage
 */
async function handleProxyImage(imageUrl: string, titleId: string): Promise<Response> {
  if (!imageUrl || !titleId) {
    return new Response(
      JSON.stringify({ error: 'imageUrl and titleId are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    console.log(`[Proxy] Fetching image: ${imageUrl}`)

    // Fetch the image from the external URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*',
        'Referer': new URL(imageUrl).origin,
      },
    })

    if (!imageResponse.ok) {
      console.error(`[Proxy] Failed to fetch image: ${imageResponse.status}`)
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${imageResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await imageResponse.arrayBuffer()

    // Generate filename
    const timestamp = Date.now()
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `${titleId}/image-${timestamp}.${extension}`

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: uploadError } = await supabase.storage
      .from('title-key-visuals')
      .upload(filename, imageBuffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error(`[Proxy] Upload error:`, uploadError)
      return new Response(
        JSON.stringify({ error: `Failed to upload: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('title-key-visuals')
      .getPublicUrl(filename)

    console.log(`[Proxy] Image uploaded successfully: ${urlData.publicUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        storageUrl: urlData.publicUrl,
        filename,
        contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Proxy] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): string | null {
  if (!url) return null

  if (url.includes('comic.naver.com')) return 'naver_webtoon'
  if (url.includes('series.naver.com')) return 'naver_series'
  if (url.includes('page.kakao.com')) return 'kakao'
  if (url.includes('webtoon.kakao.com')) return 'kakao_webtoon'
  if (url.includes('manta.net')) return 'manta'
  if (url.includes('webtoons.com')) return 'webtoons'

  return null
}

/**
 * Scrape images from platform URL based on detected platform
 */
async function scrapePlatformImages(url: string): Promise<DiscoveredImage[]> {
  const platform = detectPlatform(url)

  if (!platform) {
    console.log(`[Platform] Unknown platform for URL: ${url}`)
    return []
  }

  switch (platform) {
    case 'naver_webtoon':
    case 'naver_series':
      return scrapeNaverWebtoonImages(url)
    case 'kakao':
    case 'kakao_webtoon':
      return scrapeKakaoImages(url)
    case 'manta':
      return scrapeMantaImages(url)
    default:
      console.log(`[Platform] No scraper for platform: ${platform}`)
      return []
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Check if this is a proxy request to fetch an image
    if (body.action === 'proxy-image') {
      return await handleProxyImage(body.imageUrl, body.titleId)
    }

    // Otherwise, handle as normal key visuals collection request
    const keyVisualsRequest: KeyVisualsRequest = body
    const { titleId, titleName, titleNameKr, titleUrl, titleUrlEn, collectedBy, limit = 20 } = body

    if (!collectedBy) {
      return new Response(
        JSON.stringify({ error: 'collectedBy (admin email) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!titleName && !titleNameKr && !titleUrl) {
      return new Response(
        JSON.stringify({ error: 'Either titleName, titleNameKr, or titleUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Key Visuals] Starting collection for title: ${titleName || titleNameKr}`)
    console.log(`[Key Visuals] URLs: ${titleUrl || 'none'}, ${titleUrlEn || 'none'}`)

    const allImages: DiscoveredImage[] = []
    const errors: Record<string, string> = {}

    // 1. Scrape platform URLs
    if (titleUrl) {
      try {
        const platformImages = await scrapePlatformImages(titleUrl)
        allImages.push(...platformImages)
        console.log(`[Key Visuals] Got ${platformImages.length} images from primary URL`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors['titleUrl'] = message
        console.error(`[Key Visuals] Error scraping titleUrl:`, error)
      }
    }

    if (titleUrlEn) {
      try {
        const platformImages = await scrapePlatformImages(titleUrlEn)
        allImages.push(...platformImages)
        console.log(`[Key Visuals] Got ${platformImages.length} images from English URL`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors['titleUrlEn'] = message
        console.error(`[Key Visuals] Error scraping titleUrlEn:`, error)
      }
    }

    // 2. Search for additional images using Google Custom Search
    // Search with BOTH Korean and English names for better coverage
    if ((titleName || titleNameKr) && allImages.length < limit) {
      try {
        const googleImages = await searchImagesWithGoogle(
          titleNameKr,
          titleName,  // English name
          limit - allImages.length
        )
        allImages.push(...googleImages)
        console.log(`[Key Visuals] Got ${googleImages.length} images from Google search`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors['search'] = message
        console.error(`[Key Visuals] Error searching images:`, error)
      }
    }

    // Deduplicate by URL
    const uniqueImages = allImages.filter((img, index, self) =>
      index === self.findIndex(i => i.url === img.url)
    )

    // Limit results
    const finalImages = uniqueImages.slice(0, Math.min(limit, 30))

    console.log(`[Key Visuals] Collection complete: ${finalImages.length} unique images`)

    const response: KeyVisualsResponse = {
      success: true,
      images: finalImages,
      totalFound: uniqueImages.length,
      errors,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Key Visuals] Fatal error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({ success: false, error: message, images: [], totalFound: 0, errors: {} }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
