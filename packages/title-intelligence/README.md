# Title Intelligence System

**Version**: 1.0.0
**Status**: Foundation Complete, Scrapers In Progress

Automated data collection and normalization system for Korean webtoons, webnovels, and related IPs across multiple platforms.

---

## Overview

The Title Intelligence System discovers, scrapes, and normalizes metadata for Korean content from official platforms, metadata databases, fandom communities, and aggregators. It provides:

- **Automated URL discovery** - Find title pages across 8+ platforms
- **Multi-source scraping** - Kakao, Naver, WEBTOON EN, WebtoonGuide, Reddit, AO3, etc.
- **Normalized schema** - Consistent data model across varying source formats
- **Time-series metrics** - Track views, ratings, subscribers over time
- **Separate intelligence schema** - Independent from creator-submitted titles
- **CLI & programmatic API** - Use as command-line tool or import as package

---

## Quick Start

### Installation

```bash
cd /Users/sungholee/code/kstorybridge
cd packages/title-intelligence
pnpm install
```

### Environment Setup

Create `.env` file:

```bash
# Required
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (for Reddit scraper)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Optional (for web search)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
```

### Run Database Migration

```bash
cd /Users/sungholee/code/kstorybridge
npx supabase db push
```

This creates the intelligence schema tables:
- `intelligence_titles`
- `intelligence_aliases`
- `intelligence_sources`
- `intelligence_metrics`
- `title_intelligence_mapping`

### CLI Usage

```bash
# Extract title data from all sources
pnpm extract "사장님은 투타임"

# Extract from specific sources only
pnpm extract "Double-Binded By Love" --sources=webtoons.com,reddit.com

# Output as JSON
pnpm extract "백합 하우스" --json > output.json
```

### Programmatic Usage

```typescript
import { runPipeline, initializeDatabase } from '@kstorybridge/title-intelligence'

// Initialize database connection
initializeDatabase()

// Run pipeline
const result = await runPipeline("사장님은 투타임")

if (result.success) {
  console.log(`Title ID: ${result.titleId}`)
  console.log(`Scraped: ${result.sourcesScraped}/${result.sourcesFound} sources`)
  console.log(`Slug: ${result.summary.slug}`)
}
```

---

## Architecture

### Data Flow

```
Input: Title Name
    ↓
1. URL Discovery (titleResolver)
   - Database lookup (existing intelligence_titles)
   - Pattern matching (common URL structures)
   - Web search (TODO: Google Custom Search API)
    ↓
2. Scraping (8 scrapers)
   - Find matching scraper for each URL
   - Execute scrape (static HTML or Playwright)
   - Normalize to ScrapeResult schema
    ↓
3. Data Merging (pipeline)
   - Prefer official sources for canonical fields
   - Aggregate metrics from all sources
   - Union of genres, aliases
    ↓
4. Database Upsert
   - Upsert intelligence_titles (by slug)
   - Insert intelligence_aliases
   - Upsert intelligence_sources (by URL)
   - Insert intelligence_metrics (new snapshot)
    ↓
Output: IntelligenceTitleWithRelations
```

### Project Structure

```
packages/title-intelligence/
├── src/
│   ├── model/
│   │   └── schema.ts              # TypeScript interfaces
│   ├── db/
│   │   ├── client.ts              # Supabase client wrapper
│   │   └── operations.ts          # CRUD operations
│   ├── search/
│   │   └── titleResolver.ts       # URL discovery logic
│   ├── scrapers/
│   │   ├── base.ts                # Base scraper interface
│   │   ├── index.ts               # Scraper registry
│   │   ├── kakao.ts               # Kakao Page (Playwright) 🚧
│   │   ├── naver.ts               # Naver Series (Playwright) 🚧
│   │   ├── webtoonEn.ts           # WEBTOON EN (static HTML) ✅
│   │   ├── webtoonGuide.ts        # WebtoonGuide (static HTML) ✅
│   │   ├── toonsKr.ts             # Toons.kr (static HTML) 🚧
│   │   ├── batoTo.ts              # Bato.to metadata (static HTML) 🚧
│   │   ├── reddit.ts              # Reddit API integration 🚧
│   │   └── ao3.ts                 # AO3 search (static HTML) 🚧
│   ├── pipeline/
│   │   └── runPipeline.ts         # Main orchestration
│   ├── cli.ts                     # CLI entry point
│   └── index.ts                   # Public API exports
├── package.json
├── tsconfig.json
└── README.md (this file)
```

**Legend**:
- ✅ = Structure implemented (TODO: update selectors)
- 🚧 = Stub implementation (TODO: implement scraping logic)

---

## Database Schema

### intelligence_titles

Main table for discovered titles (separate from creator-submitted `titles` table).

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `original_title_ko` | text | Korean title |
| `original_title_en` | text | English title |
| `slug` | text | URL-friendly identifier (unique) |
| `type` | text | webtoon \| webnovel \| light_novel \| manga \| mixed |
| `original_language` | text | ISO 639-1 code (ko, en, ja) |
| `primary_genres` | jsonb | Array of genre strings |
| `demographic` | text | shounen \| shoujo \| seinen \| josei \| general |
| `has_webnovel` | boolean | Whether IP has underlying web novel |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### intelligence_aliases

Alternative titles and translations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `intelligence_title_id` | uuid | FK → intelligence_titles.id |
| `alias` | text | Alternative title |
| `language` | text | ko \| en \| ja \| romanization |
| `kind` | text | en_official \| en_fan \| romanization \| ko_variant |

### intelligence_sources

One row per discovered source URL.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `intelligence_title_id` | uuid | FK → intelligence_titles.id |
| `domain` | text | page.kakao.com, series.naver.com, etc. |
| `category` | text | Source category (see below) |
| `url` | text | Source URL |
| `region` | text | KR \| Global \| US, etc. |
| `language` | text | ko \| en \| ja, etc. |
| `raw_meta` | jsonb | Full raw scrape result |
| `created_at` | timestamptz | First discovery |
| `updated_at` | timestamptz | Last scrape |

**Source Categories**:
- `official_platform` - Kakao, Naver, Lezhin (Korean)
- `official_platform_en` - WEBTOON EN, Tapas, etc.
- `metadata_db` - WebtoonGuide, Toons.kr
- `fandom_forum` - Reddit, Discord
- `unofficial_aggregator` - Bato.to (metadata only)
- `fanfiction` - AO3, FFN

### intelligence_metrics

Time-series metrics (one snapshot per scrape).

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `intelligence_title_id` | uuid | FK → intelligence_titles.id |
| `source_id` | uuid | FK → intelligence_sources.id |
| `snapshot_time` | timestamptz | When this data was scraped |
| `views` | bigint | Total views |
| `subscribers` | bigint | Subscriber count |
| `rating_score` | numeric | Rating (0-10 scale, normalized) |
| `rating_votes` | integer | Number of ratings |
| `favorites` | bigint | Favorites/bookmarks |
| `episode_count` | integer | Number of episodes/chapters |
| `status` | text | ongoing \| completed \| hiatus \| cancelled |
| `age_rating` | text | Age rating |
| `raw` | jsonb | Extra platform-specific metrics |

### title_intelligence_mapping

Bridge table linking creator-submitted `titles` ↔ `intelligence_titles`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title_id` | uuid | FK → titles.title_id (creator-submitted) |
| `intelligence_title_id` | uuid | FK → intelligence_titles.id |
| `mapped_by` | text | Admin email |
| `mapped_at` | timestamptz | Mapping timestamp |
| `mapping_confidence` | text | manual \| auto_high \| auto_low |

---

## Scrapers

### Implemented Scrapers

| Scraper | Domain | Category | Status | Notes |
|---------|--------|----------|--------|-------|
| **WebtoonGuide** | www.webtoonguide.com | metadata_db | ✅ Structure | TODO: Update selectors |
| **WEBTOON EN** | www.webtoons.com | official_platform_en | ✅ Structure | TODO: Update selectors |
| **Kakao Page** | page.kakao.com | official_platform | 🚧 Stub | Requires Playwright |
| **Naver Series** | series.naver.com | official_platform | 🚧 Stub | Requires Playwright |
| **Toons.kr** | toons.kr | metadata_db | 🚧 Stub | Static HTML |
| **Bato.to** | bato.to | unofficial_aggregator | 🚧 Stub | Metadata only |
| **Reddit** | reddit.com | fandom_forum | 🚧 Stub | Requires API keys |
| **AO3** | archiveofourown.org | fanfiction | 🚧 Stub | Static HTML |

### Scraper Interface

All scrapers implement this interface:

```typescript
interface IScraper {
  name: string
  domain: string
  category: SourceCategory

  canHandle(url: string): boolean
  scrape(url: string): Promise<ScrapeResult | null>
}

interface ScrapeResult {
  sourceMeta: {
    domain: string
    category: SourceCategory
    url: string
    language?: string
    region?: string
  }
  normalized: {
    title?: { ko, en_official, primary_genres, ... }
    metrics?: { views, rating_score, status, ... }
    metadata?: { synopsis, author, artist, ... }
  }
  raw: Record<string, any>  // Full raw data for storage
}
```

---

## Implementation Status

### ✅ Complete (Foundation)

- [x] Package structure and configuration
- [x] TypeScript schemas and interfaces
- [x] Database migration (intelligence schema)
- [x] Base scraper interface and registry
- [x] Database client wrapper
- [x] Database CRUD operations
- [x] URL discovery system (titleResolver)
- [x] Pipeline orchestration (runPipeline)
- [x] CLI interface
- [x] README documentation

### 🚧 In Progress (Scrapers)

- [ ] Implement WebtoonGuide HTML parsing (update selectors)
- [ ] Implement WEBTOON EN HTML parsing (update selectors)
- [ ] Implement Naver Series (Playwright)
- [ ] Implement Kakao Page (Playwright)
- [ ] Implement Toons.kr scraper
- [ ] Implement Bato.to metadata scraper
- [ ] Implement Reddit API integration
- [ ] Implement AO3 scraper

### 📋 TODO (Future)

- [ ] Web search integration (Google Custom Search API)
- [ ] Auto-mapping algorithm (similarity matching)
- [ ] Creator app UI integration
- [ ] Metrics history charts
- [ ] Field verification workflow
- [ ] Ingestion to `titles` table

---

## Usage Examples

### Example 1: Extract Title Data

```typescript
import { runPipeline } from '@kstorybridge/title-intelligence'

const result = await runPipeline("사장님은 투타임")

console.log(result)
// {
//   success: true,
//   titleId: "abc-123",
//   sourcesScraped: 3,
//   sourcesFound: 5,
//   errors: [],
//   summary: {
//     title: { ko: "사장님은 투타임", en: "Double-Binded By Love" },
//     slug: "double-binded-by-love",
//     sources: ["page.kakao.com", "webtoons.com", "webtoonguide.com"],
//     metrics: { total_views: 1500000, avg_rating: 8.5 }
//   }
//}
```

### Example 2: Query Intelligence Title

```typescript
import { getIntelligenceTitleBySlug } from '@kstorybridge/title-intelligence'

const title = await getIntelligenceTitleBySlug("double-binded-by-love", true)

console.log(title)
// {
//   title: { id, original_title_ko, original_title_en, slug, ... },
//   aliases: [{ alias, language, kind }, ...],
//   sources: [{ domain, url, category, raw_meta }, ...],
//   latestMetrics: [{ views, rating_score, snapshot_time }, ...],
//   metricsHistory: [/* all snapshots */]
// }
```

### Example 3: Use Specific Scrapers

```typescript
import { findScraperForUrl } from '@kstorybridge/title-intelligence'

const url = "https://www.webtoons.com/en/romance/double-binded/list?title_no=12345"
const scraper = findScraperForUrl(url)

if (scraper) {
  const result = await scraper.scrape(url)
  console.log(result.normalized.metrics)
  // { views: 1000000, rating_score: 8.5, status: "ongoing" }
}
```

---

## Development

### Build Package

```bash
pnpm build
```

### Run CLI in Dev Mode

```bash
pnpm extract "사장님은 투타임"
```

### Add New Scraper

1. Create new file in `src/scrapers/` (e.g., `newPlatform.ts`)
2. Extend `BaseScraper` class
3. Implement `scrape(url)` method
4. Add to registry in `src/scrapers/index.ts`

Example:

```typescript
import { BaseScraper, ScrapeResult } from './base'

export class NewPlatformScraper extends BaseScraper {
  readonly name = 'NewPlatform'
  readonly domain = 'newplatform.com'
  readonly category = 'official_platform' as const

  async scrape(url: string): Promise<ScrapeResult | null> {
    // Implement scraping logic
    return { sourceMeta, normalized, raw }
  }
}
```

---

## Integration with Creator App

### Option 1: Direct Import

```typescript
// In creator app
import { runPipeline } from '@kstorybridge/title-intelligence'

async function handleCollect(titleName: string) {
  const result = await runPipeline(titleName)
  // Update UI with result
}
```

### Option 2: Edge Function Wrapper

```typescript
// In Supabase edge function
import { runPipeline } from '@kstorybridge/title-intelligence'

serve(async (req) => {
  const { titleName } = await req.json()
  const result = await runPipeline(titleName)
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Notes

### Rate Limiting

- Korean platforms (Kakao, Naver): 3-second delay between requests
- Other platforms: No delay (be respectful)

### Anti-Piracy Policy

- Bato.to scraper extracts **metadata only** (no chapter content)
- AO3 scraper extracts **fanfic stats only** (no full text)
- We do not scrape or host copyrighted content

### Data Retention

- All raw scrape results are stored in `raw_meta` JSONB field
- Metrics snapshots are never deleted (time-series data)
- Intelligence titles can be deleted manually if needed

---

## Troubleshooting

**Error: "Missing Supabase credentials"**
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables

**Error: "No scraper available for this URL"**
- URL domain not supported yet
- Check `getAllDomains()` for supported domains

**Error: "Scraper returned null"**
- Scraper not implemented yet (stub)
- Check scraper file for TODO comments

**Playwright errors**
- Install Playwright browsers: `npx playwright install`
- Ensure browser dependencies are installed

---

## License

UNLICENSED - Internal use only for KStoryBridge project

---

**Last Updated**: 2025-11-24
**Maintainer**: KStoryBridge Team
