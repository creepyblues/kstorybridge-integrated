/**
 * Reddit Scraper
 *
 * Purpose: Collect fan engagement data from Reddit
 *
 * Data Collected:
 * - posts: Number of posts mentioning the title
 * - total_upvotes: Sum of all post upvotes
 * - total_comments: Sum of all comments
 * - avg_upvotes: Average upvotes per post
 * - avg_comments: Average comments per post
 * - top_posts: Top 5 posts by score (title, upvotes, comments, url, subreddit)
 * - subreddits: List of subreddits where title is discussed
 * - related_subreddit_subscribers: Total subscribers from related subreddits
 *
 * API: Uses Reddit's public JSON API (no authentication required for read-only)
 * Rate Limiting: Reddit allows ~60 requests per minute for unauthenticated users
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; KStoryBridge/1.0; +https://kstorybridge.com)'

interface RedditPost {
  title: string
  score: number
  num_comments: number
  subreddit: string
  subreddit_subscribers: number
  permalink: string
  url: string
  created_utc: number
  author: string
  selftext: string
  link_flair_text: string | null
  upvote_ratio: number
  is_video: boolean
}

interface RedditScraperResult {
  source: string
  scraped_at: string
  title_found: boolean
  data: {
    posts: number
    total_upvotes: number
    total_comments: number
    avg_upvotes: number | null
    avg_comments: number | null
    top_posts: Array<{
      title: string
      score: number
      comments: number
      subreddit: string
      url: string
      created_at: string
    }>
    subreddits: Array<{
      name: string
      post_count: number
      subscribers: number
    }>
    related_subreddit_subscribers: number
    engagement_score: number | null
  }
  metadata: {
    search_query: string
    scraping_method: string
    posts_analyzed: number
    error: string | null
  }
}

/**
 * Main scraper function for Reddit
 * Searches for posts mentioning the title and aggregates engagement metrics
 */
export async function scrapeReddit(titleName: string): Promise<RedditScraperResult> {
  console.log(`[Reddit] Scraping for: ${titleName}`)

  const result: RedditScraperResult = {
    source: 'reddit',
    scraped_at: new Date().toISOString(),
    title_found: false,
    data: {
      posts: 0,
      total_upvotes: 0,
      total_comments: 0,
      avg_upvotes: null,
      avg_comments: null,
      top_posts: [],
      subreddits: [],
      related_subreddit_subscribers: 0,
      engagement_score: null
    },
    metadata: {
      search_query: titleName,
      scraping_method: 'reddit_public_api',
      posts_analyzed: 0,
      error: null
    }
  }

  try {
    // Fetch posts from Reddit search API
    const posts = await fetchRedditPosts(titleName, 100)

    if (posts.length === 0) {
      console.log(`[Reddit] No posts found for: ${titleName}`)
      result.metadata.error = 'No posts found for this title'
      return result
    }

    result.title_found = true
    result.metadata.posts_analyzed = posts.length

    // Calculate aggregated metrics
    let totalUpvotes = 0
    let totalComments = 0
    const subredditMap = new Map<string, { count: number; subscribers: number }>()

    for (const post of posts) {
      totalUpvotes += post.score
      totalComments += post.num_comments

      // Track subreddits
      const existing = subredditMap.get(post.subreddit)
      if (existing) {
        existing.count++
        // Keep the highest subscriber count seen for this subreddit
        existing.subscribers = Math.max(existing.subscribers, post.subreddit_subscribers || 0)
      } else {
        subredditMap.set(post.subreddit, {
          count: 1,
          subscribers: post.subreddit_subscribers || 0
        })
      }
    }

    // Set aggregated data
    result.data.posts = posts.length
    result.data.total_upvotes = totalUpvotes
    result.data.total_comments = totalComments
    result.data.avg_upvotes = posts.length > 0 ? Math.round(totalUpvotes / posts.length) : null
    result.data.avg_comments = posts.length > 0 ? Math.round(totalComments / posts.length) : null

    // Get top 5 posts by score
    const sortedPosts = [...posts].sort((a, b) => b.score - a.score)
    result.data.top_posts = sortedPosts.slice(0, 5).map(post => ({
      title: post.title,
      score: post.score,
      comments: post.num_comments,
      subreddit: post.subreddit,
      url: `https://reddit.com${post.permalink}`,
      created_at: new Date(post.created_utc * 1000).toISOString()
    }))

    // Convert subreddit map to sorted array
    const subredditArr = Array.from(subredditMap.entries()).map(([name, data]) => ({
      name,
      post_count: data.count,
      subscribers: data.subscribers
    }))
    result.data.subreddits = subredditArr.sort((a, b) => b.post_count - a.post_count).slice(0, 10)

    // Calculate total related subreddit subscribers
    result.data.related_subreddit_subscribers = subredditArr.reduce(
      (sum, s) => sum + s.subscribers, 0
    )

    // Calculate engagement score (weighted combination of metrics)
    // Formula: log10(upvotes + 1) * 2 + log10(comments + 1) * 3 + log10(posts + 1) * 2
    const engagementScore =
      Math.log10(totalUpvotes + 1) * 2 +
      Math.log10(totalComments + 1) * 3 +
      Math.log10(posts.length + 1) * 2
    result.data.engagement_score = Math.round(engagementScore * 100) / 100

    console.log(`[Reddit] Found ${posts.length} posts, ${totalUpvotes} upvotes, ${totalComments} comments`)
    console.log(`[Reddit] Top subreddits:`, result.data.subreddits.slice(0, 3).map(s => s.name))

    return result

  } catch (error) {
    console.error('[Reddit] Scraping error:', error)
    result.metadata.error = error.message || 'Unknown error'
    return result
  }
}

/**
 * Fetch Reddit posts using public JSON API
 * No authentication required for read-only access
 */
async function fetchRedditPosts(query: string, limit: number = 100): Promise<RedditPost[]> {
  console.log(`[Reddit] Fetching posts for query: ${query}`)

  try {
    // Clean and encode the search query
    const cleanedQuery = query.trim()
    const encodedQuery = encodeURIComponent(cleanedQuery)

    // Use Reddit's search API
    const url = `https://www.reddit.com/search.json?q=${encodedQuery}&limit=${limit}&sort=relevance&t=all`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`[Reddit] API error: ${response.status}`)

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Reddit rate limit exceeded. Please try again later.')
      }

      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    const children = data?.data?.children || []

    console.log(`[Reddit] API returned ${children.length} posts`)

    // Extract relevant data from each post
    const posts: RedditPost[] = children.map((child: any) => {
      const post = child.data
      return {
        title: post.title || '',
        score: post.score || 0,
        num_comments: post.num_comments || 0,
        subreddit: post.subreddit || '',
        subreddit_subscribers: post.subreddit_subscribers || 0,
        permalink: post.permalink || '',
        url: post.url || '',
        created_utc: post.created_utc || 0,
        author: post.author || '[deleted]',
        selftext: post.selftext || '',
        link_flair_text: post.link_flair_text || null,
        upvote_ratio: post.upvote_ratio || 0,
        is_video: post.is_video || false
      }
    })

    return posts

  } catch (error) {
    console.error('[Reddit] Failed to fetch posts:', error)
    throw error
  }
}

/**
 * Search for specific subreddits related to a title
 * Useful for finding dedicated fan communities
 */
export async function findRelatedSubreddits(titleName: string): Promise<Array<{
  name: string
  subscribers: number
  description: string
}>> {
  console.log(`[Reddit] Searching for subreddits related to: ${titleName}`)

  try {
    const encodedQuery = encodeURIComponent(titleName)
    const url = `https://www.reddit.com/subreddits/search.json?q=${encodedQuery}&limit=10`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`[Reddit] Subreddit search error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const children = data?.data?.children || []

    return children.map((child: any) => ({
      name: child.data.display_name || '',
      subscribers: child.data.subscribers || 0,
      description: child.data.public_description || ''
    }))

  } catch (error) {
    console.error('[Reddit] Subreddit search error:', error)
    return []
  }
}

/**
 * Calculate a normalized popularity score for Reddit engagement
 * Returns a score from 0-100
 */
export function calculateRedditPopularityScore(data: RedditScraperResult['data']): number {
  if (data.posts === 0) return 0

  // Weight factors
  const upvoteWeight = 1
  const commentWeight = 2  // Comments show deeper engagement
  const postWeight = 5     // More posts = more widespread discussion
  const subscriberWeight = 0.0001  // Normalize large subscriber counts

  // Calculate raw score
  const rawScore =
    (data.total_upvotes * upvoteWeight) +
    (data.total_comments * commentWeight) +
    (data.posts * postWeight) +
    (data.related_subreddit_subscribers * subscriberWeight)

  // Apply logarithmic scaling to handle wide range of values
  // This maps most scores to 0-100 range
  const scaledScore = Math.log10(rawScore + 1) * 20

  // Clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(scaledScore)))
}
