# Title Intelligence System: Implementation Plan

**Created**: 2025-11-22
**Status**: Planning Phase
**Owner**: Engineering Team
**Estimated Timeline**: 8 weeks
**Estimated Cost**: ~$633/month operational + development resources

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Research Findings](#research-findings)
4. [Architecture Design](#architecture-design)
5. [Database Schema](#database-schema)
6. [Legal & Ethical Considerations](#legal--ethical-considerations)
7. [Cost Analysis](#cost-analysis)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Specifications](#technical-specifications)
10. [Risk Assessment](#risk-assessment)
11. [Success Metrics](#success-metrics)
12. [Appendix](#appendix)

---

## Executive Summary

### Problem Statement
Currently, KStoryBridge provides basic title metadata (title name, synopsis, genre) but lacks:
- **Real-time popularity metrics** (views, ratings, engagement)
- **Fan community signals** (Reddit discussions, fanfiction presence)
- **Trend analysis** (growth trajectories, virality indicators)
- **Multi-source validation** (cross-platform data comparison)

These gaps limit buyers' ability to assess market potential and cultural impact of titles.

### Proposed Solution
Build a **Title Intelligence System** that automatically:
1. **Identifies sources** - Maps titles to platform URLs and community spaces
2. **Extracts metadata** - Scrapes comprehensive title information
3. **Tracks popularity** - Monitors engagement metrics across platforms
4. **Analyzes trends** - Calculates growth rates and virality scores
5. **Surfaces insights** - Presents actionable data to buyers

### Key Findings

**✅ Safe & Legal Sources**:
- Reddit API (official, free tier available)
- Archive of Our Own (community-accepted scraping)
- Twitter API (public data, $100/mo for basic tier)

**⚠️ High-Risk Sources**:
- Korean platforms (Naver, Kakao) - **No public APIs**, aggressive anti-piracy enforcement
- 240M+ illegal content removals by Kakao in H2 2024
- AI-powered scraping detection (Naver's "Toon Radar")

**Recommendation**: Start with low-risk sources (Reddit, AO3, Twitter), defer Korean platform scraping pending legal review.

### Resource Requirements
- **Development**: 8 weeks (full-time engineer)
- **Operating Cost**: ~$633/month
  - Twitter API: $100/mo
  - Proxy services: $500/mo
  - Infrastructure: $30/mo
- **Database**: 3 new tables, ~5GB additional storage

---

## System Overview

### Input
- Title name (Korean: "나 혼자만 레벨업" or English: "Solo Leveling")
- Optional: Platform URLs, alternative names

### Output

**1. Comprehensive Metadata** (Story Understanding):
```json
{
  "basic_info": {
    "title_name_kr": "나 혼자만 레벨업",
    "title_name_en": "Solo Leveling",
    "alternative_names": ["俺だけレベルアップな件", "Only I Level Up"],
    "synopsis": "...",
    "genre": ["Action", "Fantasy", "Supernatural"],
    "content_format": "manhwa"
  },
  "story_elements": {
    "themes": ["Power progression", "Underdog story", "Gate/dungeon"],
    "character_archetypes": ["OP protagonist", "System/game mechanics"],
    "tone": ["Dark", "Action-packed", "Redemption"]
  }
}
```

**2. Popularity Signals**:
```json
{
  "platform_metrics": {
    "naver": {
      "views": 4500000000,
      "subscribers": 2800000,
      "rating": 9.95,
      "rating_count": 156000,
      "comments_count": 89000
    },
    "reddit": {
      "subreddit": "r/sololeveling",
      "subscribers": 185000,
      "posts_30d": 847,
      "top_post_upvotes": 12500
    },
    "ao3": {
      "fanfic_count": 3421,
      "total_kudos": 156789,
      "recent_growth": "+15% (30d)"
    }
  },
  "trends": {
    "view_growth_30d": "+12.5%",
    "comment_velocity": 234.5,  // comments/day
    "virality_score": 87,        // 0-100
    "trending_rank": 3           // within platform
  },
  "sentiment": {
    "overall_score": 0.82,       // -1 to 1
    "fan_reception": "Overwhelmingly positive",
    "controversy_level": "Low"
  }
}
```

### System Components

```
┌─────────────────────────────────────────────────────────┐
│              Title Intelligence Orchestrator            │
│          (Supabase Edge Function / Node.js API)         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌─────▼─────┐      ┌─────▼─────┐
   │ Platform│        │  Fansite  │      │  Social   │
   │ Metrics │        │  Community│      │   Media   │
   │ Scraper │        │  Scraper  │      │  Monitor  │
   └────┬────┘        └─────┬─────┘      └─────┬─────┘
        │                   │                   │
   ┌────▼────────────┬──────▼──────┬───────────▼─────┐
   │ Naver/Kakao    │ Reddit API   │ Twitter API     │
   │ (Playwright)   │ (OAuth 2.0)  │ (API v2 Basic)  │
   │ Cheerio Parser │ AO3 Scraper  │ OpenAI Sent.    │
   └────────────────┴──────────────┴─────────────────┘
                            │
                ┌───────────▼────────────┐
                │   PostgreSQL Tables    │
                │ - popularity_metrics   │
                │ - fan_signals          │
                │ - trend_snapshots      │
                │ - scraping_jobs        │
                └────────────────────────┘
```

---

## Research Findings

### Platform Landscape Analysis

#### Korean Content Platforms

| Platform | MAU | Content Type | API Available | Scraping Risk |
|----------|-----|--------------|---------------|---------------|
| **Naver Webtoon** | 156M+ | Webtoons | ❌ No | ⚠️ High |
| **Kakao Page/Entertainment** | N/A | Webtoons, Novels | ❌ No | ⚠️ High |
| **Ridibooks** | N/A | Novels, Webtoons | ❌ No | ⚠️ Medium |
| **Lezhin** | N/A | Mature webtoons | ❌ No | ⚠️ Medium |
| **Tappytoon** | N/A | Licensed EN | ❌ No | ⚠️ Medium |

**Key Findings**:
- **No public APIs** - All major Korean platforms lack official developer APIs
- **Anti-piracy enforcement** - Aggressive legal action against unauthorized scrapers
  - Kakao: 240M illegal content removals (H2 2024)
  - Naver: 150+ illegal sites shut down (2024-2025)
  - AI-powered monitoring (Naver's "Toon Radar")
- **Legal precedent** - Multiple cease-and-desist orders issued in 2025
  - ReaperScans shut down (May 2025)
  - EnryuManga forced to remove Naver content (June 2025)

#### English Translation Platforms

| Platform | Content Focus | API | Data Quality |
|----------|---------------|-----|--------------|
| **Tapas** | Original + licensed | ❌ | High |
| **Webtoon (EN)** | Naver EN versions | ❌ | High |
| **Webnovel** | Chinese novels | ❌ | Medium |
| **Wuxiaworld** | Chinese translations | ❌ | Medium |

**Finding**: Limited Korean title coverage, primarily Chinese content.

#### Fan Community Platforms

| Platform | API Status | Rate Limits | Data Available | Legal Risk |
|----------|-----------|-------------|----------------|------------|
| **Reddit** | ✅ Official API | 60 req/min | Subreddit stats, posts, comments | ✅ Low |
| **Archive of Our Own (AO3)** | ⚠️ Unofficial scrapers | N/A | Fanfic count, kudos, hits | ✅ Low |
| **Twitter/X** | ✅ API v2 Basic | 10K tweets/mo | Mentions, sentiment | ✅ Low |
| **MyDramaList** | ❌ No | N/A | Ratings, reviews | ⚠️ Grey area |
| **Goodreads** | ⚠️ Deprecated | N/A | Novel ratings | ⚠️ Grey area |

**Recommendation**: Focus on Reddit, AO3, Twitter for Phase 1.

### Available Data Types by Source

#### Naver Webtoon (if legally approved)
```javascript
{
  title_name_kr: "나 혼자만 레벨업",
  title_name_en: "Solo Leveling",
  title_image: "https://...",
  genre: ["액션", "판타지"],
  author: "추공",
  artist: "장성락",
  views: 4500000000,        // 4.5B views
  subscribers: 2800000,
  rating: 9.95,
  rating_count: 156000,
  comments_count: 89000,
  chapters: 179,
  status: "completed",
  serialization_start: "2018-03-04",
  serialization_end: "2021-12-29"
}
```

#### Reddit
```javascript
{
  subreddit: "r/sololeveling",
  subscribers: 185000,
  active_users: 3421,       // currently online
  posts_30d: 847,
  comments_30d: 12453,
  top_posts: [
    {
      title: "Solo Leveling Season 2 anime announced!",
      upvotes: 12500,
      comments: 456,
      created: "2025-11-15"
    }
  ],
  sentiment_keywords: ["amazing", "hype", "masterpiece"]
}
```

#### Archive of Our Own
```javascript
{
  tag: "Solo Leveling (Manhwa)",
  fanfic_count: 3421,
  total_works: 3421,
  total_kudos: 156789,      // AO3's "like" metric
  total_hits: 8234567,
  bookmarks: 45678,
  recent_works_30d: 127,    // New fics last 30 days
  top_pairings: [
    "Sung Jin-Woo/Cha Hae-In",
    "Sung Jin-Woo/Yoo Jin-Ho"
  ],
  rating_distribution: {
    "General Audiences": 1234,
    "Teen And Up": 1567,
    "Mature": 456,
    "Explicit": 164
  }
}
```

#### Twitter/X
```javascript
{
  mention_count_7d: 8934,
  mention_count_30d: 34567,
  sentiment_distribution: {
    positive: 0.72,
    neutral: 0.21,
    negative: 0.07
  },
  trending_hashtags: [
    "#SoloLeveling",
    "#SungJinWoo",
    "#나혼렙"
  ],
  influencer_mentions: 23,   // Accounts with 10K+ followers
  viral_tweets: [
    {
      text: "Solo Leveling anime season 2...",
      likes: 45678,
      retweets: 12345
    }
  ]
}
```

### Technology Stack Research

#### Web Scraping Libraries (2025 Best Practices)

**1. Playwright** - Recommended for dynamic content
- ✅ Cross-browser support (Chrome, Firefox, Safari)
- ✅ Built-in stealth mode
- ✅ Network interception
- ✅ TypeScript support
- ⚠️ Higher resource usage (~100MB RAM per browser instance)

**2. Cheerio** - Recommended for static HTML
- ✅ Fast parsing (jQuery-like syntax)
- ✅ Low memory footprint
- ✅ Perfect for structured data extraction
- ❌ No JavaScript execution

**3. Puppeteer** - Alternative to Playwright
- ✅ Chrome-focused, well-documented
- ✅ Active maintenance
- ❌ Chrome/Chromium only
- Note: Existing codebase already uses Puppeteer

**Recommendation**: Use **Playwright** for Korean platforms (needs stealth), **Cheerio** for Reddit/AO3 (static HTML).

#### Anti-Detection Techniques

**Rate Limiting**:
```javascript
const rateLimiter = {
  naver: 1 request / 2 seconds,
  kakao: 1 request / 2 seconds,
  reddit: 60 requests / minute (API limit),
  ao3: 1 request / 1 second (community best practice)
}
```

**Proxy Rotation**:
- **BrightData** (formerly Luminati): $500/mo for 10GB
- **Oxylabs**: Similar pricing
- **ScraperAPI**: $49/mo for 100K requests (may not suffice)

**Stealth Techniques**:
```javascript
// Playwright stealth configuration
await page.addInitScript(() => {
  delete navigator.webdriver;
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5]
  });
});
```

**User Agent Rotation**:
```javascript
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (X11; Linux x86_64)...'
];
```

---

## Architecture Design

### System Components

#### 1. Title Intelligence Orchestrator
**Technology**: Supabase Edge Function (Deno) or Node.js service
**Responsibilities**:
- Job scheduling and prioritization
- Multi-source coordination
- Data aggregation and normalization
- Error handling and retry logic
- Rate limiting enforcement

**API Endpoints**:
```typescript
// Trigger intelligence gathering for a title
POST /api/title-intelligence/analyze
{
  title_id: "uuid",
  priority: "high" | "medium" | "low",
  sources: ["naver", "reddit", "ao3", "twitter"] // optional
}

// Get intelligence data
GET /api/title-intelligence/:title_id
Response: {
  platform_metrics: {...},
  fan_signals: {...},
  trends: {...},
  last_updated: "2025-11-22T10:30:00Z"
}

// Get scraping job status
GET /api/title-intelligence/jobs/:job_id
Response: {
  status: "completed",
  results: {...},
  errors: []
}
```

#### 2. Platform Metrics Scraper
**Technology**: Playwright + Cheerio
**Platforms**: Naver, Kakao, Tapas, Webtoon EN

**Service Interface**:
```typescript
interface PlatformScraper {
  platform: 'naver' | 'kakao' | 'tapas' | 'webtoon';

  // Find title URL from title name
  searchTitle(titleName: string): Promise<string | null>;

  // Extract metrics from platform
  scrapeMetrics(url: string): Promise<PlatformMetrics>;

  // Validate URL format
  isValidUrl(url: string): boolean;
}

interface PlatformMetrics {
  views: number;
  subscribers: number;
  rating: number;
  rating_count: number;
  comments_count: number;
  chapters: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  last_update: Date;
  scraped_at: Date;
}
```

**Implementation Example (Naver)**:
```typescript
class NaverWebtoonScraper implements PlatformScraper {
  platform = 'naver';

  async scrapeMetrics(url: string): Promise<PlatformMetrics> {
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for metrics to load
    await page.waitForSelector('.view_count');

    const metrics = await page.evaluate(() => {
      return {
        views: parseInt(document.querySelector('.view_count')?.textContent || '0'),
        subscribers: parseInt(document.querySelector('.subscriber_count')?.textContent || '0'),
        rating: parseFloat(document.querySelector('.rating_score')?.textContent || '0'),
        // ... more selectors
      };
    });

    await browser.close();
    return metrics;
  }
}
```

#### 3. Fansite Community Scraper
**Technology**: Reddit API (OAuth), AO3 Python library (ao3-api)

**Reddit Integration**:
```typescript
class RedditScraper {
  private client: RedditClient;

  async getFanSignals(titleName: string): Promise<RedditSignals> {
    // 1. Search for related subreddits
    const subreddits = await this.searchSubreddits(titleName);

    // 2. Get subreddit stats
    const stats = await this.getSubredditStats(subreddits[0]);

    // 3. Get recent posts
    const posts = await this.getRecentPosts(subreddits[0], 30); // last 30 days

    // 4. Analyze engagement
    return {
      subreddit_name: subreddits[0],
      subscribers: stats.subscribers,
      active_users: stats.active_users,
      posts_30d: posts.length,
      avg_upvotes: posts.reduce((sum, p) => sum + p.upvotes, 0) / posts.length,
      top_posts: posts.slice(0, 5)
    };
  }
}
```

**AO3 Integration**:
```python
# Using ao3-api library (Python)
import ao3

class AO3Scraper:
    def get_fan_signals(self, title_tag: str) -> dict:
        # Search for works with tag
        works = ao3.search.Search(tag=title_tag)

        total_kudos = 0
        total_hits = 0
        fanfic_count = 0

        for work in works:
            total_kudos += work.kudos
            total_hits += work.hits
            fanfic_count += 1

        return {
            'fanfic_count': fanfic_count,
            'total_kudos': total_kudos,
            'total_hits': total_hits,
            'avg_kudos_per_fic': total_kudos / fanfic_count if fanfic_count > 0 else 0
        }
```

#### 4. Social Media Monitor
**Technology**: Twitter API v2, OpenAI for sentiment analysis

**Twitter Integration**:
```typescript
class TwitterMonitor {
  private client: TwitterAPI;

  async analyzeMentions(titleName: string, days: number = 7): Promise<TwitterSignals> {
    // 1. Search recent tweets
    const tweets = await this.client.search({
      query: `"${titleName}" OR #${titleName.replace(/\s/g, '')}`,
      max_results: 100,
      start_time: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    });

    // 2. Sentiment analysis
    const sentiments = await this.analyzeSentiment(tweets);

    // 3. Aggregate metrics
    return {
      mention_count: tweets.length,
      sentiment_score: sentiments.average,
      sentiment_distribution: sentiments.distribution,
      top_tweets: tweets.slice(0, 5),
      influencer_mentions: tweets.filter(t => t.author.followers > 10000).length
    };
  }

  async analyzeSentiment(tweets: Tweet[]): Promise<SentimentResult> {
    const openai = new OpenAI();

    const prompt = `Analyze sentiment of these tweets about a Korean title:
    ${tweets.map(t => t.text).join('\n---\n')}

    Return JSON: { "average": -1 to 1, "distribution": {"positive": 0-1, "neutral": 0-1, "negative": 0-1} }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

#### 5. Trend Analysis Engine
**Technology**: PostgreSQL time-series queries, Node.js calculations

**Trend Calculation**:
```typescript
class TrendAnalyzer {
  async calculateTrends(titleId: string): Promise<TrendData> {
    // 1. Get historical snapshots (last 30 days)
    const snapshots = await this.getSnapshots(titleId, 30);

    // 2. Calculate growth rates
    const viewGrowth = this.calculateGrowthRate(
      snapshots.map(s => s.view_count)
    );

    const subscriberGrowth = this.calculateGrowthRate(
      snapshots.map(s => s.subscriber_count)
    );

    // 3. Calculate comment velocity (comments per day)
    const commentVelocity = this.calculateVelocity(
      snapshots.map(s => s.comments_count)
    );

    // 4. Calculate virality score (composite metric)
    const viralityScore = this.calculateViralityScore({
      viewGrowth,
      subscriberGrowth,
      commentVelocity,
      fanSignals: await this.getFanSignals(titleId)
    });

    return {
      view_growth_30d: viewGrowth,
      subscriber_growth_30d: subscriberGrowth,
      comment_velocity: commentVelocity,
      virality_score: viralityScore,
      trending_rank: await this.getTrendingRank(titleId)
    };
  }

  private calculateViralityScore(metrics: any): number {
    // Weighted composite score (0-100)
    const weights = {
      viewGrowth: 0.25,
      subscriberGrowth: 0.25,
      commentVelocity: 0.20,
      redditActivity: 0.15,
      ao3Presence: 0.10,
      twitterMentions: 0.05
    };

    return (
      metrics.viewGrowth * weights.viewGrowth +
      metrics.subscriberGrowth * weights.subscriberGrowth +
      metrics.commentVelocity * weights.commentVelocity +
      (metrics.fanSignals.reddit_posts_30d / 100) * weights.redditActivity +
      (metrics.fanSignals.ao3_recent_works / 50) * weights.ao3Presence +
      (metrics.fanSignals.twitter_mentions_7d / 1000) * weights.twitterMentions
    ) * 100;
  }
}
```

### Data Flow

```
┌──────────────┐
│ Admin Panel  │ Trigger scraping job
│ / Scheduler  │────────────────────────┐
└──────────────┘                        │
                                        ▼
                            ┌───────────────────────┐
                            │ Orchestrator Service  │
                            │ - Job queue manager   │
                            │ - Rate limiter        │
                            │ - Error handler       │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
            │ Platform       │  │ Fansite        │  │ Social      │
            │ Scraper        │  │ Scraper        │  │ Monitor     │
            │ (Playwright)   │  │ (APIs/Scraper) │  │ (APIs)      │
            └───────┬────────┘  └───────┬────────┘  └──────┬──────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                                ┌───────▼────────┐
                                │ Data Normalizer│
                                │ - Deduplication│
                                │ - Validation   │
                                │ - Enrichment   │
                                └───────┬────────┘
                                        │
                                ┌───────▼────────┐
                                │ PostgreSQL DB  │
                                │ - Insert/Update│
                                │ - Snapshots    │
                                └───────┬────────┘
                                        │
                                ┌───────▼────────┐
                                │ API Response   │
                                │ to Dashboard   │
                                └────────────────┘
```

---

## Database Schema

### New Tables

#### 1. title_popularity_metrics
Stores platform-specific popularity data with update timestamps.

```sql
CREATE TABLE title_popularity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('naver', 'kakao', 'tapas', 'webtoon', 'ridibooks', 'lezhin', 'other')),

  -- Core metrics
  views bigint DEFAULT 0,
  subscribers bigint DEFAULT 0,
  rating numeric(3,2),  -- 0.00 to 10.00
  rating_count bigint DEFAULT 0,
  comments_count bigint DEFAULT 0,

  -- Additional data
  chapters integer,
  status text CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  serialization_start date,
  serialization_end date,

  -- Metadata
  platform_url text,  -- Direct link to title on platform
  last_scraped_at timestamp with time zone DEFAULT now(),
  scrape_success boolean DEFAULT true,
  scrape_error text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Constraints
  UNIQUE(title_id, platform)
);

-- Indexes
CREATE INDEX idx_popularity_metrics_title_id ON title_popularity_metrics(title_id);
CREATE INDEX idx_popularity_metrics_platform ON title_popularity_metrics(platform);
CREATE INDEX idx_popularity_metrics_last_scraped ON title_popularity_metrics(last_scraped_at);

-- RLS Policies (read-only for buyers, full access for admins)
ALTER TABLE title_popularity_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view popularity metrics"
  ON title_popularity_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage popularity metrics"
  ON title_popularity_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );
```

**Example Row**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "platform": "naver",
  "views": 4500000000,
  "subscribers": 2800000,
  "rating": 9.95,
  "rating_count": 156000,
  "comments_count": 89000,
  "chapters": 179,
  "status": "completed",
  "platform_url": "https://comic.naver.com/webtoon/list?titleId=183559",
  "last_scraped_at": "2025-11-22T10:30:00Z"
}
```

#### 2. title_fan_signals
Stores fan community activity from Reddit, AO3, Twitter, etc.

```sql
CREATE TABLE title_fan_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('reddit', 'ao3', 'twitter', 'mydramalist', 'goodreads', 'other')),

  -- Reddit data
  subreddit_name text,
  subreddit_subscribers bigint,
  subreddit_active_users integer,
  reddit_posts_30d integer,
  reddit_comments_30d integer,
  reddit_avg_upvotes numeric,

  -- AO3 data
  ao3_tag text,
  ao3_fanfic_count integer,
  ao3_total_kudos bigint,
  ao3_total_hits bigint,
  ao3_bookmarks integer,
  ao3_recent_works_30d integer,

  -- Twitter data
  twitter_mentions_7d integer,
  twitter_mentions_30d integer,
  twitter_sentiment_score numeric(3,2),  -- -1.00 to 1.00
  twitter_sentiment_positive numeric(3,2),
  twitter_sentiment_neutral numeric(3,2),
  twitter_sentiment_negative numeric(3,2),
  twitter_influencer_mentions integer,

  -- MyDramaList data
  mdl_rating numeric(3,2),
  mdl_rating_count integer,
  mdl_watchers integer,

  -- Goodreads data (for novel adaptations)
  gr_rating numeric(3,2),
  gr_rating_count integer,
  gr_shelves integer,

  -- Metadata
  source_url text,
  last_scraped_at timestamp with time zone DEFAULT now(),
  scrape_success boolean DEFAULT true,
  scrape_error text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Constraints
  UNIQUE(title_id, source)
);

-- Indexes
CREATE INDEX idx_fan_signals_title_id ON title_fan_signals(title_id);
CREATE INDEX idx_fan_signals_source ON title_fan_signals(source);
CREATE INDEX idx_fan_signals_last_scraped ON title_fan_signals(last_scraped_at);

-- RLS Policies
ALTER TABLE title_fan_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view fan signals"
  ON title_fan_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fan signals"
  ON title_fan_signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );
```

**Example Row (Reddit)**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "source": "reddit",
  "subreddit_name": "r/sololeveling",
  "subreddit_subscribers": 185000,
  "subreddit_active_users": 3421,
  "reddit_posts_30d": 847,
  "reddit_comments_30d": 12453,
  "reddit_avg_upvotes": 234.5,
  "last_scraped_at": "2025-11-22T11:00:00Z"
}
```

**Example Row (AO3)**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "source": "ao3",
  "ao3_tag": "Solo Leveling (Manhwa)",
  "ao3_fanfic_count": 3421,
  "ao3_total_kudos": 156789,
  "ao3_total_hits": 8234567,
  "ao3_bookmarks": 45678,
  "ao3_recent_works_30d": 127,
  "last_scraped_at": "2025-11-22T11:15:00Z"
}
```

#### 3. title_trend_snapshots
Daily/weekly snapshots for time-series trend analysis.

```sql
CREATE TABLE title_trend_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  snapshot_type text DEFAULT 'daily' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),

  -- Platform metrics (aggregated from all platforms)
  total_views bigint DEFAULT 0,
  total_subscribers bigint DEFAULT 0,
  avg_rating numeric(3,2),
  total_comments bigint DEFAULT 0,

  -- Growth metrics (calculated from previous snapshot)
  view_growth_rate numeric(5,2),      -- % change
  subscriber_growth_rate numeric(5,2),
  comment_velocity numeric(8,2),      -- Comments per day

  -- Fan community metrics
  reddit_activity_score numeric(8,2),
  ao3_activity_score numeric(8,2),
  twitter_activity_score numeric(8,2),

  -- Composite scores (0-100)
  engagement_score numeric(5,2),
  virality_score numeric(5,2),
  fan_passion_score numeric(5,2),
  overall_popularity_score numeric(5,2),

  -- Trending indicators
  trending_rank integer,              -- Rank within platform/category
  trending_rank_change integer,       -- Change from previous snapshot

  -- Metadata
  data_sources text[],                -- Sources used: ['naver', 'reddit', 'ao3']
  calculation_timestamp timestamp with time zone DEFAULT now(),

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),

  -- Constraints
  UNIQUE(title_id, snapshot_date, snapshot_type)
);

-- Indexes
CREATE INDEX idx_trend_snapshots_title_id ON title_trend_snapshots(title_id);
CREATE INDEX idx_trend_snapshots_date ON title_trend_snapshots(snapshot_date DESC);
CREATE INDEX idx_trend_snapshots_title_date ON title_trend_snapshots(title_id, snapshot_date DESC);
CREATE INDEX idx_trend_snapshots_virality ON title_trend_snapshots(virality_score DESC);

-- RLS Policies
ALTER TABLE title_trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view trend snapshots"
  ON title_trend_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert trend snapshots"
  ON title_trend_snapshots FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Example Row**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "snapshot_date": "2025-11-22",
  "snapshot_type": "daily",
  "total_views": 4500000000,
  "total_subscribers": 2800000,
  "view_growth_rate": 12.5,
  "subscriber_growth_rate": 3.2,
  "comment_velocity": 234.5,
  "engagement_score": 87.3,
  "virality_score": 78.5,
  "trending_rank": 3,
  "trending_rank_change": 2,
  "data_sources": ["naver", "reddit", "ao3", "twitter"]
}
```

#### 4. scraping_jobs
Job queue and status tracking for scraping tasks.

```sql
CREATE TABLE scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Job configuration
  job_type text NOT NULL CHECK (job_type IN ('platform_metrics', 'fan_signals', 'trends', 'full_intelligence')),
  sources text[] NOT NULL,            -- ['naver', 'reddit', 'ao3', 'twitter']
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),  -- 1 = highest, 10 = lowest

  -- Job status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Timing
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_ms integer,

  -- Results
  results jsonb,                      -- Scraped data
  errors jsonb,                       -- Error details
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,

  -- Metadata
  triggered_by text,                  -- 'admin', 'scheduler', 'api'
  triggered_by_user_id uuid REFERENCES auth.users(id),

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scraping_jobs_title_id ON scraping_jobs(title_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_scheduled ON scraping_jobs(scheduled_at);
CREATE INDEX idx_scraping_jobs_priority ON scraping_jobs(priority, scheduled_at);

-- RLS Policies
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all jobs"
  ON scraping_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

CREATE POLICY "Admins can create jobs"
  ON scraping_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

CREATE POLICY "System can update jobs"
  ON scraping_jobs FOR UPDATE
  TO service_role
  USING (true);
```

**Example Row**:
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "job_type": "full_intelligence",
  "sources": ["naver", "reddit", "ao3", "twitter"],
  "priority": 1,
  "status": "completed",
  "progress": 100,
  "scheduled_at": "2025-11-22T09:00:00Z",
  "started_at": "2025-11-22T09:00:05Z",
  "completed_at": "2025-11-22T09:02:34Z",
  "duration_ms": 149000,
  "results": {
    "naver": { "success": true, "views": 4500000000 },
    "reddit": { "success": true, "subscribers": 185000 },
    "ao3": { "success": true, "fanfic_count": 3421 },
    "twitter": { "success": true, "mentions_7d": 8934 }
  },
  "errors": null,
  "triggered_by": "scheduler"
}
```

### Migration Script

```sql
-- Migration: 20251122000000_add_title_intelligence_tables.sql
-- Description: Add tables for Title Intelligence System
-- Author: Engineering Team
-- Date: 2025-11-22

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create title_popularity_metrics table
CREATE TABLE IF NOT EXISTS title_popularity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('naver', 'kakao', 'tapas', 'webtoon', 'ridibooks', 'lezhin', 'other')),
  views bigint DEFAULT 0,
  subscribers bigint DEFAULT 0,
  rating numeric(3,2),
  rating_count bigint DEFAULT 0,
  comments_count bigint DEFAULT 0,
  chapters integer,
  status text CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  serialization_start date,
  serialization_end date,
  platform_url text,
  last_scraped_at timestamp with time zone DEFAULT now(),
  scrape_success boolean DEFAULT true,
  scrape_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(title_id, platform)
);

CREATE INDEX idx_popularity_metrics_title_id ON title_popularity_metrics(title_id);
CREATE INDEX idx_popularity_metrics_platform ON title_popularity_metrics(platform);
CREATE INDEX idx_popularity_metrics_last_scraped ON title_popularity_metrics(last_scraped_at);

ALTER TABLE title_popularity_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view popularity metrics"
  ON title_popularity_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage popularity metrics"
  ON title_popularity_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

-- 2. Create title_fan_signals table
CREATE TABLE IF NOT EXISTS title_fan_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('reddit', 'ao3', 'twitter', 'mydramalist', 'goodreads', 'other')),
  subreddit_name text,
  subreddit_subscribers bigint,
  subreddit_active_users integer,
  reddit_posts_30d integer,
  reddit_comments_30d integer,
  reddit_avg_upvotes numeric,
  ao3_tag text,
  ao3_fanfic_count integer,
  ao3_total_kudos bigint,
  ao3_total_hits bigint,
  ao3_bookmarks integer,
  ao3_recent_works_30d integer,
  twitter_mentions_7d integer,
  twitter_mentions_30d integer,
  twitter_sentiment_score numeric(3,2),
  twitter_sentiment_positive numeric(3,2),
  twitter_sentiment_neutral numeric(3,2),
  twitter_sentiment_negative numeric(3,2),
  twitter_influencer_mentions integer,
  mdl_rating numeric(3,2),
  mdl_rating_count integer,
  mdl_watchers integer,
  gr_rating numeric(3,2),
  gr_rating_count integer,
  gr_shelves integer,
  source_url text,
  last_scraped_at timestamp with time zone DEFAULT now(),
  scrape_success boolean DEFAULT true,
  scrape_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(title_id, source)
);

CREATE INDEX idx_fan_signals_title_id ON title_fan_signals(title_id);
CREATE INDEX idx_fan_signals_source ON title_fan_signals(source);
CREATE INDEX idx_fan_signals_last_scraped ON title_fan_signals(last_scraped_at);

ALTER TABLE title_fan_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view fan signals"
  ON title_fan_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fan signals"
  ON title_fan_signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

-- 3. Create title_trend_snapshots table
CREATE TABLE IF NOT EXISTS title_trend_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  snapshot_type text DEFAULT 'daily' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
  total_views bigint DEFAULT 0,
  total_subscribers bigint DEFAULT 0,
  avg_rating numeric(3,2),
  total_comments bigint DEFAULT 0,
  view_growth_rate numeric(5,2),
  subscriber_growth_rate numeric(5,2),
  comment_velocity numeric(8,2),
  reddit_activity_score numeric(8,2),
  ao3_activity_score numeric(8,2),
  twitter_activity_score numeric(8,2),
  engagement_score numeric(5,2),
  virality_score numeric(5,2),
  fan_passion_score numeric(5,2),
  overall_popularity_score numeric(5,2),
  trending_rank integer,
  trending_rank_change integer,
  data_sources text[],
  calculation_timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(title_id, snapshot_date, snapshot_type)
);

CREATE INDEX idx_trend_snapshots_title_id ON title_trend_snapshots(title_id);
CREATE INDEX idx_trend_snapshots_date ON title_trend_snapshots(snapshot_date DESC);
CREATE INDEX idx_trend_snapshots_title_date ON title_trend_snapshots(title_id, snapshot_date DESC);
CREATE INDEX idx_trend_snapshots_virality ON title_trend_snapshots(virality_score DESC);

ALTER TABLE title_trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view trend snapshots"
  ON title_trend_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert trend snapshots"
  ON title_trend_snapshots FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Create scraping_jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid REFERENCES titles(title_id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('platform_metrics', 'fan_signals', 'trends', 'full_intelligence')),
  sources text[] NOT NULL,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_ms integer,
  results jsonb,
  errors jsonb,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  triggered_by text,
  triggered_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_scraping_jobs_title_id ON scraping_jobs(title_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_scheduled ON scraping_jobs(scheduled_at);
CREATE INDEX idx_scraping_jobs_priority ON scraping_jobs(priority, scheduled_at);

ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all jobs"
  ON scraping_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

CREATE POLICY "Admins can create jobs"
  ON scraping_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin
      WHERE admin.id = auth.uid() AND admin.active = true
    )
  );

CREATE POLICY "System can update jobs"
  ON scraping_jobs FOR UPDATE
  TO service_role
  USING (true);

-- 5. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Add triggers for updated_at
CREATE TRIGGER update_title_popularity_metrics_updated_at
  BEFORE UPDATE ON title_popularity_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_title_fan_signals_updated_at
  BEFORE UPDATE ON title_fan_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at
  BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create helper function to get latest intelligence data
CREATE OR REPLACE FUNCTION get_title_intelligence(p_title_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'platform_metrics', (
      SELECT jsonb_object_agg(platform, row_to_json(pm))
      FROM title_popularity_metrics pm
      WHERE pm.title_id = p_title_id
    ),
    'fan_signals', (
      SELECT jsonb_object_agg(source, row_to_json(fs))
      FROM title_fan_signals fs
      WHERE fs.title_id = p_title_id
    ),
    'latest_trends', (
      SELECT row_to_json(ts)
      FROM title_trend_snapshots ts
      WHERE ts.title_id = p_title_id
      ORDER BY ts.snapshot_date DESC
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_title_intelligence(uuid) IS 'Get all intelligence data for a title';
```

---

## Legal & Ethical Considerations

### Legal Risk Assessment

#### ⚠️ HIGH RISK: Korean Platform Scraping

**Naver Webtoon, Kakao Entertainment**

**Legal Findings**:
- **No public APIs** - No authorized method for programmatic access
- **Aggressive enforcement** - 240M+ content removals by Kakao (H2 2024)
- **AI-powered detection** - Naver's "Toon Radar" monitors scraping in real-time
- **Legal precedent** - Multiple cease-and-desist orders in 2025:
  - ReaperScans shut down (May 2025)
  - EnryuManga forced to remove content (June 2025)
- **Potential violations**:
  - Copyright infringement (if content is scraped)
  - Terms of Service violations
  - Computer Fraud and Abuse Act (CFAA) violations (US)
  - Unauthorized access laws (Korea)

**Risk Factors**:
- **Corporate vs. Individual**: KStoryBridge is a registered business, increasing legal exposure
- **Commercial use**: Data used for commercial platform (not personal/research)
- **Scale**: Automated scraping at scale more likely to trigger detection
- **Jurisdiction**: Korean companies actively pursue international violations

**Mitigation Strategies** (if proceeding):
1. **Legal review** - Consult with international IP/tech attorney
2. **robots.txt compliance** - Respect crawl directives (if any)
3. **Rate limiting** - Minimal request frequency (1 req / 2-3 seconds)
4. **Transparent user agent** - Identify as KStoryBridge bot
5. **Metadata only** - Never scrape copyrighted content (images, chapters)
6. **Manual fallback** - Prioritize manual data entry for high-value titles
7. **Partnership exploration** - Contact platforms for data licensing

**Recommendation**: **Defer Korean platform scraping until legal clearance obtained.**

---

#### ✅ LOW RISK: Official APIs

**Reddit, Twitter**

**Legal Status**:
- **Official APIs** - Authorized programmatic access
- **Clear terms** - Well-defined usage policies
- **Commercial use** - Allowed with API key/OAuth
- **Rate limits** - Enforced by platform (not legal issue)

**Compliance Requirements**:
- **Reddit API**:
  - OAuth 2.0 authentication required
  - Rate limit: 60 requests per minute
  - Attribution: Link back to original posts
  - No redistribution of content verbatim

- **Twitter API v2 Basic**:
  - Developer account required ($100/mo)
  - Rate limit: 10,000 tweets per month
  - Respect user privacy settings
  - Cannot store tweet content >30 days (check current ToS)

**Recommendation**: **Use official APIs for Reddit and Twitter.**

---

#### ⚠️ GREY AREA: Community Scraping

**Archive of Our Own (AO3)**

**Legal Status**:
- **No official API** - But community scraping is tacitly accepted
- **Non-commercial** - AO3 is a non-profit, community-driven platform
- **Public data** - All works are publicly accessible
- **Community tools** - Multiple scraping libraries exist (ao3-api, AO3Scraper)
- **ToS ambiguity** - No explicit prohibition on scraping

**Risk Factors**:
- **Rate limiting** - No official limits, rely on community norms
- **Burden on servers** - Excessive scraping could harm non-profit infrastructure
- **Commercial use** - KStoryBridge's commercial nature may conflict with AO3's ethos

**Mitigation Strategies**:
1. **Respectful crawling** - 1 request per second maximum
2. **User agent identification** - Clearly identify bot
3. **Caching** - Don't re-scrape same data repeatedly
4. **Aggregated metrics only** - Don't republish individual works
5. **Attribution** - Link back to AO3 tags/searches
6. **Monitor community sentiment** - Watch for any negative feedback

**Recommendation**: **Use AO3 scraping with respectful rate limiting and attribution.**

---

**MyDramaList, Goodreads**

**Legal Status**:
- **No official APIs** (Goodreads API deprecated in 2020)
- **Unclear ToS** - Scraping policies not explicitly stated
- **Community data** - User-generated ratings and reviews

**Risk Factors**:
- **ToS violations** - May violate terms even if not explicitly prohibited
- **Captchas/blocks** - Sites may block automated access
- **Data quality** - Ratings may not be reliable/representative

**Mitigation Strategies**:
1. **Manual spot checks** - Use scraping sparingly for validation
2. **Public data only** - Don't scrape user-specific data
3. **Attribution** - Link back to original site
4. **Alternative sources** - Prioritize Reddit/AO3 over these

**Recommendation**: **Use sparingly, prioritize manual entry for critical data.**

---

### Ethical Guidelines

**Data Privacy**:
- ✅ **Public data only** - Never scrape private/gated content
- ✅ **Aggregated metrics** - Don't republish individual user comments verbatim
- ✅ **No PII** - Don't collect personally identifiable information

**Platform Impact**:
- ✅ **Respectful rate limiting** - Don't burden platform infrastructure
- ✅ **Transparent identification** - Use clear user agent strings
- ✅ **robots.txt compliance** - Respect crawl directives

**Fair Use**:
- ✅ **Transformative use** - Aggregate metrics, not content redistribution
- ✅ **Attribution** - Link back to original sources
- ✅ **Commercial balance** - Don't compete with original platforms

**User Consent**:
- ✅ **Public posts only** - Don't scrape content behind login walls
- ✅ **Respect user settings** - Honor privacy preferences where possible

---

### Recommended Approach: Phased Legal Strategy

**Phase 1: Low-Risk Sources (Weeks 1-4)**
- ✅ Implement Reddit API integration
- ✅ Implement AO3 scraping (respectful)
- ✅ Implement Twitter API integration
- ✅ Manual URL database for top 100 titles
- **Legal risk**: Minimal

**Phase 2: Legal Review (Week 5)**
- Consult with international IP/tech attorney
- Get formal opinion on Korean platform scraping
- Explore partnership opportunities with Naver/Kakao
- **Cost**: ~$5,000-$10,000 for legal review

**Phase 3: Conditional Implementation (Weeks 6-8)**
- **If legal clearance obtained**: Implement Korean platform scraping
- **If clearance denied**: Expand manual data entry, explore data licensing
- **If grey area**: Implement with maximum legal safeguards (minimal rate, transparent identification)

---

## Cost Analysis

### Development Costs

**Engineering Resources** (8 weeks, full-time):
- 1 Full-stack Engineer: 8 weeks @ $8,000/week = **$64,000**
- OR 1 Mid-level Engineer: 8 weeks @ $5,000/week = **$40,000**

**Breakdown by Phase**:
| Phase | Duration | Tasks | Est. Hours |
|-------|----------|-------|------------|
| Phase 1: Foundation | 2 weeks | Scraping infrastructure, Reddit API, DB schema | 80 hours |
| Phase 2: Platform Integration | 3 weeks | Multi-platform scrapers, URL mapping | 120 hours |
| Phase 3: Intelligence Layer | 2 weeks | Trend analysis, sentiment analysis | 80 hours |
| Phase 4: Production | 1 week | Monitoring, API integration | 40 hours |
| **Total** | **8 weeks** | | **320 hours** |

---

### Operational Costs (Monthly)

#### APIs & Services

| Service | Tier | Usage | Cost |
|---------|------|-------|------|
| **Reddit API** | Free | 60 req/min | **$0** |
| **Twitter API v2 Basic** | Paid | 10,000 tweets/mo | **$100** |
| **OpenAI API** (Sentiment) | Pay-as-you-go | 1,000 titles × 2 req × $0.0015 | **$3** |
| **BrightData Proxies** | Starter | 10GB bandwidth | **$500** |
| **AWS EC2** (t3.medium) | On-demand | Scraping service | **$30** |
| **Supabase** (Existing) | Pro | Included in current plan | **$0** |
| **Total Monthly** | | | **$633** |

**Annual**: **$7,596**

#### Scaling Scenarios

**100 Titles (Pilot)**:
- Scraping: 1x daily for top titles, 1x weekly for others
- API calls: ~5,000 Reddit requests/mo, 2,000 tweets/mo
- **Cost**: ~$200/mo (no proxies needed at small scale)

**500 Titles (Production)**:
- Scraping: 1x daily for top 100, 1x weekly for rest
- API calls: ~20,000 Reddit requests/mo, 8,000 tweets/mo
- **Cost**: ~$500/mo (proxies needed)

**1,000+ Titles (Scale)**:
- Scraping: Tiered (daily/weekly/monthly)
- API calls: May exceed free tiers
- **Cost**: ~$1,000/mo (higher tier APIs, more proxies)

---

### One-Time Costs

| Item | Purpose | Cost |
|------|---------|------|
| **Legal Review** | Korean platform scraping opinion | **$5,000-$10,000** |
| **Data Backfill** | Manual entry for top 100 titles (if no scraping) | **$5,000** (contractor @ $50/title) |
| **Proxy Setup** | Initial configuration | **$500** |
| **Testing & QA** | Cross-platform validation | **$2,000** |
| **Total One-Time** | | **$12,500-$17,500** |

---

### Total Cost Summary

**Development**: $40,000-$64,000 (8 weeks)
**One-Time Costs**: $12,500-$17,500
**Monthly Operations**: $633
**Annual Operations**: $7,596

**Year 1 Total**: **$60,000-$89,000**
**Year 2+ (Annual)**: **$7,600**

---

### Cost-Benefit Analysis

**Value Proposition**:
- **Enhanced buyer experience** - Popularity signals improve title discovery
- **Market intelligence** - Trend data informs acquisition decisions
- **Competitive advantage** - Unique data not available elsewhere
- **Reduced manual research** - Automates data gathering (saves ~10 hours/week @ $50/hr = $26,000/year)

**ROI Calculation** (assuming 20% improvement in conversion):
- Current buyers: 100 active (hypothetical)
- Conversion to Pro tier: 10% → 12% = +2 buyers/mo
- Pro tier revenue: $50/mo × 2 = $100/mo additional revenue
- Annual additional revenue: $1,200

**Note**: ROI highly dependent on buyer growth and conversion rates. Primary value is qualitative (better product, market intelligence).

---

### Cost Optimization Strategies

**Reduce Development Cost**:
- Start with Phase 1 only (Reddit + AO3): 2 weeks instead of 8 = **$10,000-$16,000**
- Validate value before investing in full system
- Use existing codebase (Puppeteer scraper, embedding service)

**Reduce Operational Cost**:
- **Skip proxies initially**: Test without proxies for low-volume scraping = **-$500/mo**
- **Use free Twitter tier**: Accept 500 tweets/mo limit = **-$100/mo**
- **Manual fallback**: Scrape only when manual data unavailable

**Pilot Program**:
- **Phase 1 only** (Reddit + AO3): **$10,000 dev + $100/mo ops**
- Measure impact on buyer engagement
- Decide whether to proceed with Phases 2-4

---

## Implementation Roadmap

### Overview

**Total Duration**: 8 weeks
**Team Size**: 1 full-time engineer
**Deployment Strategy**: Phased rollout with feature flags

---

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Build core scraping infrastructure and integrate low-risk sources (Reddit, AO3)

#### Week 1: Infrastructure Setup

**Tasks**:
1. **Database Migration** (2 days)
   - Create 4 new tables (popularity_metrics, fan_signals, trend_snapshots, scraping_jobs)
   - Test RLS policies
   - Create helper functions (get_title_intelligence)
   - Seed test data for 10 titles

2. **Scraping Service Skeleton** (2 days)
   - Set up Node.js service (or Supabase Edge Function)
   - Implement job queue manager
   - Add rate limiting middleware
   - Create error handling framework

3. **Reddit API Integration** (1 day)
   - OAuth 2.0 setup
   - Subreddit search implementation
   - Stats extraction (subscribers, posts, comments)
   - Test with 5 known titles (e.g., "Solo Leveling", "Tower of God")

**Deliverables**:
- ✅ Database schema deployed to staging
- ✅ Reddit scraper functional
- ✅ 5 titles with Reddit data populated

**Success Criteria**:
- Reddit API returns data for 80%+ of test titles
- No rate limit errors
- Data persists correctly to database

---

#### Week 2: AO3 Integration & Testing

**Tasks**:
1. **AO3 Scraper Implementation** (2 days)
   - Evaluate Python library (ao3-api) vs. Node.js scraping
   - If Python: Create microservice with Express bridge
   - If Node.js: Implement Cheerio-based scraper
   - Extract fanfic count, kudos, hits, bookmarks

2. **Job Queue System** (1 day)
   - Implement priority queue (1=high, 10=low)
   - Add job status tracking (pending → running → completed/failed)
   - Retry logic (max 3 attempts with exponential backoff)

3. **Testing & Documentation** (2 days)
   - Unit tests for scrapers (80% coverage)
   - Integration tests (end-to-end scraping)
   - API documentation (OpenAPI spec)
   - Admin panel mockups for job management

**Deliverables**:
- ✅ AO3 scraper functional
- ✅ Job queue system working
- ✅ 20 titles with Reddit + AO3 data
- ✅ Test suite passing

**Success Criteria**:
- AO3 scraper returns data for 60%+ of titles (many won't have fanfics)
- Job queue processes 10 jobs in parallel without errors
- Tests achieve 80% code coverage

---

### Phase 2: Platform Integration (Weeks 3-5)

**Goal**: Add platform-specific scrapers (Naver, Kakao, Tapas) and URL mapping

⚠️ **Note**: Contingent on legal review completion. If high-risk platforms are deferred, focus on manual URL database and English platforms only.

#### Week 3: Korean Platform Scraping (Naver)

**Tasks**:
1. **Legal Review Checkpoint** (1 day)
   - Review attorney's opinion on Korean platform scraping
   - Decision: Proceed / Defer / Hybrid approach
   - If deferred: Pivot to manual data entry system

2. **Naver Scraper** (3 days, if approved)
   - Playwright setup with stealth mode
   - Selector engineering (views, rating, subscribers, comments)
   - Test with 10 known titleIds
   - Rate limiting: 1 request / 3 seconds

3. **URL Mapping Service** (1 day)
   - Database for title → platform URLs
   - Admin UI for manual URL entry
   - Auto-search functionality (search Naver for title name)

**Deliverables**:
- ✅ Naver scraper functional (if approved)
- ✅ OR Manual URL database system (if deferred)
- ✅ 30 titles with platform URLs mapped

**Success Criteria**:
- Naver scraper extracts metrics for 90%+ of test titles
- No IP bans or captchas encountered
- Rate limiting prevents detection

---

#### Week 4: Kakao & English Platforms

**Tasks**:
1. **Kakao Scraper** (2 days, if approved)
   - Similar approach to Naver
   - Selector engineering for Kakao Page
   - Rate limiting: 1 request / 3 seconds

2. **English Platform Scrapers** (2 days)
   - Tapas scraper (Cheerio-based)
   - Webtoon EN scraper (Cheerio-based)
   - Lower priority (fewer Korean titles)

3. **Error Handling Enhancement** (1 day)
   - Captcha detection
   - IP ban detection
   - Automatic retry with longer delays
   - Alerting system (email/Slack on failures)

**Deliverables**:
- ✅ Kakao scraper functional (if approved)
- ✅ English platform scrapers functional
- ✅ 50 titles with multi-platform data

**Success Criteria**:
- Kakao scraper achieves 85%+ success rate
- English scrapers cover 30%+ of catalog
- Error handling prevents cascading failures

---

#### Week 5: Twitter Integration & Data Normalization

**Tasks**:
1. **Twitter API Integration** (2 days)
   - Developer account setup
   - Mention search implementation
   - Hashtag tracking
   - Test with 10 popular titles

2. **Sentiment Analysis** (1 day)
   - OpenAI API integration
   - Batch sentiment analysis (GPT-4o-mini)
   - Cost optimization (cache results)

3. **Data Normalization** (2 days)
   - Cross-platform title matching (e.g., "Solo Leveling" = "나 혼자만 레벨업")
   - Duplicate detection
   - Data validation (outlier detection)
   - Confidence scoring (how reliable is this data?)

**Deliverables**:
- ✅ Twitter monitor functional
- ✅ Sentiment analysis working
- ✅ 100 titles with normalized multi-source data

**Success Criteria**:
- Twitter API returns mentions for 70%+ of popular titles
- Sentiment analysis cost < $5 for 100 titles
- Data normalization catches 95%+ of duplicates

---

### Phase 3: Intelligence Layer (Weeks 6-7)

**Goal**: Build trend analysis, composite scoring, and insights generation

#### Week 6: Trend Analysis

**Tasks**:
1. **Snapshot Service** (2 days)
   - Daily job to create trend_snapshots
   - Historical comparison (30-day, 90-day trends)
   - Growth rate calculations (views, subscribers, comments)

2. **Velocity Calculations** (1 day)
   - Comment velocity (comments/day)
   - Fanfic growth rate (new works/week)
   - Twitter mention trends

3. **Virality Scoring** (2 days)
   - Composite score algorithm (0-100)
   - Weighting: platform metrics (50%), fan signals (30%), social (20%)
   - Calibration with known viral titles

**Deliverables**:
- ✅ Daily snapshot job running
- ✅ Trend calculations working
- ✅ Virality scores for 100 titles

**Success Criteria**:
- Snapshots created daily without failures
- Growth rates correlate with real-world trends
- Virality scores distinguish between trending vs. stable titles

---

#### Week 7: Intelligence API & Insights

**Tasks**:
1. **Intelligence API Endpoints** (2 days)
   - GET /api/title-intelligence/:title_id (all data)
   - GET /api/titles/trending (top 20 by virality)
   - GET /api/titles/rising (fastest growth last 30 days)
   - POST /api/title-intelligence/analyze (trigger job)

2. **Buyer Dashboard Integration** (2 days)
   - Add "Popularity" tab to title detail page
   - Show platform metrics, fan signals, trends
   - Visualizations (charts for growth trends)
   - "Trending" badge for high virality scores

3. **Insights Generation** (1 day)
   - Auto-generate text insights (e.g., "Viral on Reddit, +127% mentions this month")
   - Flag anomalies (sudden spikes in activity)
   - Comparable titles ranking (similar virality profiles)

**Deliverables**:
- ✅ Intelligence API deployed
- ✅ Dashboard integration complete
- ✅ Insights visible to buyers

**Success Criteria**:
- API response time < 200ms for cached data
- Dashboard displays insights for 80%+ of titles
- Buyers can see trending titles on homepage

---

### Phase 4: Production & Monitoring (Week 8)

**Goal**: Production deployment, monitoring, and ongoing maintenance setup

#### Week 8: Production Deployment

**Tasks**:
1. **Job Scheduler** (1 day)
   - Cron jobs for daily scraping (high-priority titles)
   - Weekly scraping (medium-priority)
   - Monthly scraping (low-priority)
   - On-demand scraping (new titles, admin requests)

2. **Monitoring Dashboard** (2 days)
   - Admin panel for scraping jobs
   - Success rates by platform
   - Data freshness indicators
   - Error logs and alerts
   - Cost tracking (API usage, proxy bandwidth)

3. **Performance Optimization** (1 day)
   - Database query optimization (indexes)
   - API response caching (Redis)
   - Parallel job processing (worker pool)

4. **Documentation & Handoff** (1 day)
   - System architecture documentation
   - Runbook for common issues
   - Admin user guide
   - Developer API documentation

**Deliverables**:
- ✅ Production deployment complete
- ✅ Monitoring dashboard live
- ✅ Documentation published
- ✅ Handoff to maintenance team

**Success Criteria**:
- 95%+ scraping success rate in production
- Zero downtime during deployment
- All documentation complete and accessible

---

### Rollout Strategy

**Week 8 (End of Development)**:
- ✅ Soft launch to internal team (5 admins)
- ✅ Monitor for 3 days, fix critical bugs

**Week 9 (Post-Development)**:
- ✅ Beta launch to 20 Pro buyers
- ✅ Gather feedback, iterate on UX
- ✅ Monitor API performance and costs

**Week 10**:
- ✅ Full launch to all buyers
- ✅ Announce new feature (email, in-app notification)
- ✅ Monitor engagement metrics

---

### Risk Mitigation

**Risk**: Legal issues with Korean platform scraping
**Mitigation**: Defer to Phase 2, prioritize legal review in Week 3, have manual data entry fallback ready

**Risk**: API rate limits exceeded
**Mitigation**: Implement queue system, respect rate limits, upgrade API tiers if needed

**Risk**: Scraping detection (IP bans, captchas)
**Mitigation**: Use proxies, rotate user agents, implement exponential backoff, have manual fallback

**Risk**: Data quality issues (inaccurate metrics)
**Mitigation**: Implement validation rules, spot-check against known titles, allow admin overrides

**Risk**: Cost overruns
**Mitigation**: Monitor costs weekly, set budget alerts, pause non-critical sources if needed

---

### Success Metrics

**Technical Metrics**:
- ✅ Scraping success rate: >95%
- ✅ API response time: <200ms (p95)
- ✅ Data freshness: <24 hours for high-priority titles
- ✅ Uptime: 99.5%

**Business Metrics**:
- ✅ Coverage: 80%+ of catalog with popularity data
- ✅ Engagement: 30%+ of buyers view intelligence data
- ✅ Time saved: 10 hours/week manual research eliminated

**User Satisfaction**:
- ✅ Buyer feedback: 4+ stars on new feature
- ✅ Feature usage: 50%+ of active buyers use trending/insights

---

## Technical Specifications

### Technology Stack

**Backend**:
- **Language**: TypeScript (Node.js 18+)
- **Runtime**: Supabase Edge Functions (Deno) OR AWS Lambda
- **Database**: PostgreSQL 15 (Supabase)
- **Queue**: pg-boss (PostgreSQL-based job queue) OR BullMQ (Redis)

**Scraping**:
- **Browser Automation**: Playwright 1.40+
- **HTML Parsing**: Cheerio 1.0+
- **Stealth**: playwright-extra-plugin-stealth
- **Proxies**: BrightData SDK

**APIs**:
- **Reddit**: Snoowrap (Reddit API wrapper)
- **Twitter**: twitter-api-v2
- **OpenAI**: openai (official SDK)
- **AO3**: ao3-api (Python) + Express bridge OR custom Node.js scraper

**Monitoring**:
- **Logging**: Supabase Logs / CloudWatch
- **Alerts**: Email / Slack webhooks
- **Metrics**: Custom dashboard (React + Recharts)

---

### API Endpoints Specification

**Base URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1`

#### 1. Trigger Intelligence Gathering

```http
POST /title-intelligence/analyze
Authorization: Bearer {supabase_anon_key}
Content-Type: application/json

{
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "priority": 1,  // 1=high, 5=medium, 10=low
  "sources": ["naver", "reddit", "ao3", "twitter"]  // optional, defaults to all
}

Response 202 Accepted:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_duration_ms": 120000,
  "message": "Intelligence gathering job queued"
}
```

---

#### 2. Get Intelligence Data

```http
GET /title-intelligence/{title_id}
Authorization: Bearer {supabase_anon_key}

Response 200 OK:
{
  "title_id": "123e4567-e89b-12d3-a456-426614174000",
  "last_updated": "2025-11-22T10:30:00Z",
  "data_coverage": {
    "platform_metrics": ["naver", "reddit"],
    "fan_signals": ["reddit", "ao3", "twitter"],
    "trends": true
  },
  "platform_metrics": {
    "naver": {
      "views": 4500000000,
      "subscribers": 2800000,
      "rating": 9.95,
      "rating_count": 156000,
      "comments_count": 89000,
      "chapters": 179,
      "status": "completed",
      "last_scraped_at": "2025-11-22T09:30:00Z"
    }
  },
  "fan_signals": {
    "reddit": {
      "subreddit": "r/sololeveling",
      "subscribers": 185000,
      "active_users": 3421,
      "posts_30d": 847,
      "avg_upvotes": 234.5
    },
    "ao3": {
      "fanfic_count": 3421,
      "total_kudos": 156789,
      "recent_works_30d": 127
    },
    "twitter": {
      "mentions_7d": 8934,
      "sentiment_score": 0.82,
      "sentiment_distribution": {
        "positive": 0.72,
        "neutral": 0.21,
        "negative": 0.07
      }
    }
  },
  "trends": {
    "view_growth_30d": 12.5,
    "subscriber_growth_30d": 3.2,
    "comment_velocity": 234.5,
    "virality_score": 87.3,
    "trending_rank": 3
  },
  "insights": [
    "Viral on Reddit with 847 posts in the last 30 days",
    "Strong fanfiction presence on AO3 (3,421 works)",
    "Overwhelmingly positive sentiment on Twitter (72% positive)"
  ]
}
```

---

#### 3. Get Trending Titles

```http
GET /titles/trending?limit=20&sort=virality_score
Authorization: Bearer {supabase_anon_key}

Response 200 OK:
{
  "trending_titles": [
    {
      "title_id": "123e4567-e89b-12d3-a456-426614174000",
      "title_name_en": "Solo Leveling",
      "title_name_kr": "나 혼자만 레벨업",
      "virality_score": 87.3,
      "trending_rank": 1,
      "rank_change": 0,
      "key_metric": "4.5B views on Naver"
    },
    // ... 19 more
  ]
}
```

---

#### 4. Get Job Status

```http
GET /title-intelligence/jobs/{job_id}
Authorization: Bearer {supabase_anon_key}

Response 200 OK:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "started_at": "2025-11-22T09:00:05Z",
  "completed_at": "2025-11-22T09:02:34Z",
  "duration_ms": 149000,
  "results": {
    "naver": { "success": true, "views": 4500000000 },
    "reddit": { "success": true, "subscribers": 185000 },
    "ao3": { "success": true, "fanfic_count": 3421 },
    "twitter": { "success": true, "mentions_7d": 8934 }
  },
  "errors": null
}
```

---

### Scraper Service Architecture

**Service Structure**:
```
services/title-intelligence/
├── index.ts                    # Main orchestrator
├── config/
│   ├── platforms.ts            # Platform configurations
│   ├── rate-limits.ts          # Rate limiting settings
│   └── selectors.ts            # CSS selectors for scraping
├── scrapers/
│   ├── base-scraper.ts         # Abstract base class
│   ├── naver-scraper.ts        # Naver Webtoon scraper
│   ├── kakao-scraper.ts        # Kakao scraper
│   ├── reddit-scraper.ts       # Reddit API client
│   ├── ao3-scraper.ts          # AO3 scraper
│   └── twitter-scraper.ts      # Twitter API client
├── services/
│   ├── job-queue.ts            # Job queue manager
│   ├── rate-limiter.ts         # Rate limiting middleware
│   ├── proxy-manager.ts        # Proxy rotation
│   ├── trend-analyzer.ts       # Trend calculations
│   └── sentiment-analyzer.ts   # OpenAI sentiment analysis
├── utils/
│   ├── normalizer.ts           # Data normalization
│   ├── validator.ts            # Data validation
│   └── logger.ts               # Logging utility
└── tests/
    ├── unit/                   # Unit tests
    └── integration/            # Integration tests
```

---

### Error Handling Strategy

**Error Categories**:
1. **Network Errors** - Timeout, connection refused, DNS failure
2. **Scraping Errors** - Selector not found, structure changed, captcha
3. **Rate Limit Errors** - 429 Too Many Requests, API quota exceeded
4. **Authentication Errors** - Invalid API key, OAuth token expired
5. **Data Validation Errors** - Unexpected data format, missing required fields

**Retry Logic**:
```typescript
class RetryStrategy {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (this.isRetryable(error) && attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  private isRetryable(error: any): boolean {
    // Retry on network errors, timeouts, 5xx errors
    return (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }
}
```

**Fallback Strategy**:
```typescript
class ScraperWithFallback {
  async scrape(url: string): Promise<Metrics> {
    try {
      // Attempt 1: Playwright (most reliable, slowest)
      return await this.scrapeWithPlaywright(url);
    } catch (error) {
      console.warn('Playwright failed, trying Cheerio', error);

      try {
        // Attempt 2: Cheerio (faster, may miss dynamic content)
        return await this.scrapeWithCheerio(url);
      } catch (error) {
        console.error('All scraping methods failed', error);

        // Fallback: Return cached data if available
        return await this.getCachedData(url);
      }
    }
  }
}
```

---

## Risk Assessment

### Technical Risks

#### 1. Scraping Detection & IP Bans
**Likelihood**: High (for Korean platforms)
**Impact**: High (service disruption)

**Mitigation**:
- ✅ Proxy rotation (BrightData)
- ✅ User agent rotation
- ✅ Rate limiting (1 req / 2-3 seconds)
- ✅ Stealth mode (playwright-extra-plugin-stealth)
- ✅ Manual data entry fallback

**Contingency**: If IP bans occur, pause scraping for 24-48 hours, review detection patterns, adjust stealth tactics.

---

#### 2. Platform Structure Changes
**Likelihood**: Medium
**Impact**: Medium (temporary data loss)

**Mitigation**:
- ✅ Selector versioning (maintain multiple selector sets)
- ✅ Automated tests (detect breakage within 24 hours)
- ✅ Monitoring alerts (Slack notifications on failures)
- ✅ Graceful degradation (show last known data)

**Contingency**: When structure changes detected, pause scraping, update selectors, resume within 2-3 days.

---

#### 3. API Rate Limits & Quota Exhaustion
**Likelihood**: Low (with proper planning)
**Impact**: Medium (temporary service degradation)

**Mitigation**:
- ✅ Rate limiting middleware (built-in)
- ✅ Cost monitoring (daily alerts)
- ✅ Prioritization (high-value titles first)
- ✅ Caching (don't re-scrape same data)

**Contingency**: If quota exceeded, pause low-priority jobs, upgrade API tier if justified.

---

#### 4. Data Quality Issues
**Likelihood**: Medium
**Impact**: Medium (buyer trust erosion)

**Mitigation**:
- ✅ Validation rules (outlier detection)
- ✅ Cross-source verification (compare Naver vs. Reddit)
- ✅ Confidence scoring (flag low-confidence data)
- ✅ Admin review queue (manual verification for anomalies)

**Contingency**: If data quality issues arise, increase validation thresholds, add manual review step.

---

### Legal Risks

#### 1. Cease-and-Desist from Korean Platforms
**Likelihood**: Medium (for aggressive scraping)
**Impact**: High (legal liability, shutdown)

**Mitigation**:
- ✅ Legal review before implementation
- ✅ Minimal rate limiting (respectful crawling)
- ✅ Transparent identification (clear user agent)
- ✅ Metadata only (no copyrighted content)
- ✅ Partnership exploration (data licensing)

**Contingency**: If C&D received, immediately halt scraping, consult attorney, explore licensing deals.

---

#### 2. Terms of Service Violations
**Likelihood**: Medium
**Impact**: Medium (account bans, reputation damage)

**Mitigation**:
- ✅ ToS compliance review
- ✅ Use official APIs where available (Reddit, Twitter)
- ✅ Attribution links (link back to sources)
- ✅ No content redistribution (aggregated metrics only)

**Contingency**: If ToS violations alleged, cease operations, seek legal counsel, negotiate settlement.

---

#### 3. Copyright Infringement Claims
**Likelihood**: Low (if metadata-only)
**Impact**: High (legal costs, damages)

**Mitigation**:
- ✅ **Never scrape copyrighted content** (images, chapter text)
- ✅ Metadata only (titles, view counts, ratings)
- ✅ Fair use analysis (transformative, non-competitive)
- ✅ Legal insurance (E&O policy)

**Contingency**: If infringement claimed, remove disputed content, negotiate licensing, seek dismissal.

---

### Operational Risks

#### 1. Cost Overruns
**Likelihood**: Medium
**Impact**: Low (budget strain)

**Mitigation**:
- ✅ Weekly cost monitoring
- ✅ Budget alerts (Slack notifications at 80% threshold)
- ✅ Optimize API usage (cache aggressively)
- ✅ Downgrade non-critical sources

**Contingency**: If costs exceed budget, pause low-value sources, renegotiate contracts, seek additional funding.

---

#### 2. Maintenance Burden
**Likelihood**: High (scrapers are fragile)
**Impact**: Medium (team distraction)

**Mitigation**:
- ✅ Automated tests (catch breakage early)
- ✅ Good documentation (runbooks, troubleshooting guides)
- ✅ Monitoring dashboard (proactive alerts)
- ✅ Dedicated on-call rotation

**Contingency**: If maintenance burden exceeds capacity, hire contractor, reduce coverage, explore data vendors.

---

### Business Risks

#### 1. Low Buyer Adoption
**Likelihood**: Medium
**Impact**: High (poor ROI)

**Mitigation**:
- ✅ User research (validate demand before building)
- ✅ Beta testing (gather feedback early)
- ✅ Prominent placement (feature on homepage)
- ✅ Onboarding education (show buyers how to use)

**Contingency**: If adoption is low, iterate on UX, add more compelling insights, consider sunsetting if no improvement.

---

#### 2. Competitor Replication
**Likelihood**: Low (high technical barrier)
**Impact**: Medium (loss of competitive advantage)

**Mitigation**:
- ✅ Proprietary algorithms (virality scoring)
- ✅ Unique data sources (partnerships)
- ✅ Fast iteration (continuous improvement)
- ✅ Network effects (more data → better insights)

**Contingency**: If competitors replicate, differentiate on data quality, insights depth, UX simplicity.

---

## Success Metrics

### Technical KPIs

**Reliability**:
- ✅ Uptime: 99.5%+
- ✅ Scraping success rate: 95%+ (all sources combined)
- ✅ Data freshness: <24 hours for high-priority titles, <7 days for all titles
- ✅ API response time: p50 < 100ms, p95 < 200ms, p99 < 500ms

**Coverage**:
- ✅ Platform metrics: 80%+ of catalog (at least Naver OR manual data)
- ✅ Fan signals: 40%+ of catalog (Reddit, AO3, Twitter)
- ✅ Trend data: 60%+ of catalog (historical snapshots)

**Quality**:
- ✅ Data validation pass rate: 98%+
- ✅ Cross-source agreement: 90%+ (when multiple sources available)
- ✅ Error rate: <5% per source

---

### Business KPIs

**Adoption**:
- ✅ Feature usage: 50%+ of active buyers view intelligence data within 30 days
- ✅ Engagement: 30%+ of buyers view trending/insights weekly
- ✅ Session duration: +20% increase on title detail pages with intelligence data

**Value Delivered**:
- ✅ Time saved: 10 hours/week manual research eliminated (measured via buyer surveys)
- ✅ Decision confidence: 70%+ of buyers report higher confidence in title selection (survey)
- ✅ Discovery: 40%+ of buyers discover new titles via trending/insights

**Revenue Impact** (indirect):
- ✅ Conversion: +10% conversion from basic → pro tier (attributed to new feature)
- ✅ Retention: +5% reduction in churn (better product stickiness)
- ✅ NPS: +10 point increase in Net Promoter Score

---

### User Satisfaction

**Qualitative Feedback**:
- ✅ Feature rating: 4+ stars (out of 5) on in-app surveys
- ✅ Buyer testimonials: 3+ positive quotes for marketing
- ✅ Support tickets: <5 tickets/month related to intelligence data

**Usability**:
- ✅ Understanding: 80%+ of buyers understand what virality score means (survey)
- ✅ Trust: 70%+ of buyers trust the data shown (survey)
- ✅ Actionability: 60%+ of buyers say data influenced title selection (survey)

---

## Appendix

### A. Scraper Selector Reference

**Naver Webtoon** (as of 2025-11-22):
```javascript
const naverSelectors = {
  viewCount: '.view_count',
  subscriberCount: '.subscriber_count',
  rating: '.rating_score',
  ratingCount: '.rating_count',
  commentsCount: '.cmt_count',
  titleNameKr: '.detail h2',
  author: '.author',
  genre: '.genre',
  synopsis: '.summary'
};
```

**Kakao Page**:
```javascript
const kakaoSelectors = {
  viewCount: '.count_view',
  likeCount: '.count_like',
  rating: '.rating_average',
  titleNameKr: '.title',
  author: '.author',
  genre: '.category'
};
```

**Note**: Selectors subject to change. Maintain versioned selector sets and automated tests.

---

### B. Sample API Responses

**Reddit API (Subreddit Info)**:
```json
{
  "kind": "t5",
  "data": {
    "display_name": "sololeveling",
    "subscribers": 185432,
    "active_user_count": 3421,
    "public_description": "Solo Leveling (나 혼자만 레벨업) - A subreddit for the Korean webcomic...",
    "created_utc": 1547852400
  }
}
```

**AO3 Scraping (Tag Search)**:
```html
<h2 class="heading">
  <a href="/tags/Solo%20Leveling%20(Manhwa)/works">Solo Leveling (Manhwa)</a>
  <span class="count">(3,421)</span>
</h2>
```

**Twitter API v2 (Recent Search)**:
```json
{
  "data": [
    {
      "id": "1234567890",
      "text": "Solo Leveling season 2 anime announced! Can't wait! #SoloLeveling",
      "created_at": "2025-11-22T10:30:00Z",
      "public_metrics": {
        "like_count": 12500,
        "retweet_count": 3456,
        "reply_count": 567
      },
      "author_id": "987654321"
    }
  ],
  "meta": {
    "result_count": 8934
  }
}
```

---

### C. Database Query Examples

**Get all intelligence data for a title**:
```sql
SELECT * FROM get_title_intelligence('123e4567-e89b-12d3-a456-426614174000');
```

**Get trending titles (top 20 by virality)**:
```sql
SELECT
  t.title_id,
  t.title_name_en,
  t.title_name_kr,
  ts.virality_score,
  ts.trending_rank,
  ts.trending_rank_change
FROM title_trend_snapshots ts
JOIN titles t ON ts.title_id = t.title_id
WHERE ts.snapshot_date = CURRENT_DATE
  AND ts.snapshot_type = 'daily'
ORDER BY ts.virality_score DESC
LIMIT 20;
```

**Get titles with Reddit activity in last 30 days**:
```sql
SELECT
  t.title_id,
  t.title_name_en,
  fs.subreddit_name,
  fs.reddit_posts_30d,
  fs.reddit_avg_upvotes
FROM title_fan_signals fs
JOIN titles t ON fs.title_id = t.title_id
WHERE fs.source = 'reddit'
  AND fs.reddit_posts_30d > 0
ORDER BY fs.reddit_posts_30d DESC;
```

---

### D. Legal Resources

**Recommended Legal Counsel**:
- **Wilson Sonsini Goodrich & Rosati** - Tech/IP specialists
- **Fenwick & West** - Startup-focused
- **Local Korean law firm** - For Korean platform compliance

**Relevant Laws**:
- **US**: Computer Fraud and Abuse Act (CFAA), Digital Millennium Copyright Act (DMCA)
- **Korea**: Act on Promotion of Information and Communications Network Utilization
- **EU**: GDPR (if expanding to EU buyers)

**Precedent Cases**:
- **hiQ Labs v. LinkedIn** (2022) - Affirmed right to scrape public data
- **Ryanair v. PR Aviation** (2015) - Screen scraping ruled legal in EU
- **Craigslist v. 3Taps** (2013) - Scraping after C&D can violate CFAA

---

### E. Glossary

**AO3**: Archive of Our Own - Non-profit fanfiction repository
**Kudos**: AO3's "like" metric for fanfictions
**MAU**: Monthly Active Users
**RLS**: Row-Level Security (PostgreSQL feature)
**ToS**: Terms of Service
**Virality Score**: Composite metric (0-100) measuring title's trending momentum
**Comment Velocity**: Comments per day, indicates active discussion

---

### F. Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-22 | 1.0 | Initial plan document created |

---

**Document End**

---

## Next Steps

1. **Review & Approval** - Stakeholder review of plan (1 week)
2. **Legal Consultation** - Attorney review of scraping legality (1-2 weeks)
3. **Budget Approval** - Secure funding for development + operational costs
4. **Hiring** (if needed) - Recruit engineer or allocate existing resources
5. **Kickoff** - Begin Phase 1 development

**Questions? Contact**: [Engineering Team Lead]
