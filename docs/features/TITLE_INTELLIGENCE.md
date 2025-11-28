# Title Intelligence System

**Last Updated:** 2025-11-27
**Status:** Production Ready (Staging)
**Location:** Creator App → Tools → Title Investigator

## Overview

The Title Intelligence System is an admin-only tool for collecting metadata and popularity signals from multiple platforms for Korean webtoons and web novels. It enables field-level data verification before ingesting into the production titles database.

## Key Features

- **Multi-platform scraping:** Naver Webtoon, Naver Series, Kakao Page, Kakao Webtoon, Manta
- **Fan engagement tracking:** Reddit discussions, AO3 fanfiction counts
- **URL-based collection:** Direct platform URLs for reliable data fetching
- **Field-level ingestion:** Cherry-pick specific fields from different sources
- **Audit trail:** All ingestion operations logged permanently

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Creator App (Frontend)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ TitleInvestigator│  │InvestigationDetail│  │  ToolsIndex    │  │
│  │   (URL Input)    │  │ (Source Compare) │  │  (Dashboard)   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────────┘  │
│           │                     │                                │
│           ▼                     ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              intelligenceService.ts                          ││
│  │  - collectIntelligenceByUrls()                               ││
│  │  - getIntelligenceTitleWithSources()                         ││
│  │  - executeIngestion()                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Function (Backend)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              title-intelligence/index.ts                     ││
│  │  - URL-based collection handler                              ││
│  │  - Legacy name-based collection handler                      ││
│  │  - Retry logic with exponential backoff                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐  │
│  │  naver.ts │naver-     │ kakao.ts  │kakao-     │ manta.ts  │  │
│  │           │series.ts  │           │webtoon.ts │           │  │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘  │
│  ┌───────────────────────┬───────────────────────┐              │
│  │      reddit.ts        │       ao3.ts          │              │
│  └───────────────────────┴───────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ intelligence_titles    │ Main title records                  ││
│  │ intelligence_sources   │ Platform URLs + raw scraped data    ││
│  │ intelligence_metrics   │ Time-series metric snapshots        ││
│  │ intelligence_aliases   │ Alternative title names             ││
│  │ intelligence_ingestion_requests │ Pending ingestion queue    ││
│  │ intelligence_ingestion_log      │ Audit trail               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

#### intelligence_titles
Primary table for discovered titles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| original_title_ko | text | Korean title |
| original_title_en | text | English title |
| slug | text | URL-friendly identifier |
| type | enum | webtoon, webnovel, light_novel, manga, mixed |
| original_language | text | ko, en, jp, etc. |
| primary_genres | text[] | Genre array |
| demographic | text | Target demographic |
| has_webnovel | boolean | Has web novel adaptation |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

#### intelligence_sources
Platform-specific source records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| intelligence_title_id | uuid | FK to intelligence_titles |
| domain | text | Platform domain (e.g., comic.naver.com) |
| category | enum | official_platform, official_platform_en, fandom_forum, fanfiction, etc. |
| url | text | Source URL |
| region | text | Geographic region |
| language | text | Content language |
| raw_meta | jsonb | Full scraped data (preserved) |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

#### intelligence_metrics
Time-series metric snapshots.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| intelligence_title_id | uuid | FK to intelligence_titles |
| source_id | uuid | FK to intelligence_sources |
| snapshot_time | timestamptz | When metrics were captured |
| views | bigint | View count |
| subscribers | integer | Subscriber/follower count |
| rating_score | numeric | Rating (0-10) |
| rating_votes | integer | Number of ratings |
| favorites | integer | Favorite/bookmark count |
| episode_count | integer | Number of episodes/chapters |
| status | enum | ongoing, completed, hiatus, cancelled, upcoming |
| age_rating | text | Content rating |
| raw | jsonb | Additional raw metrics |

#### intelligence_ingestion_log
Permanent audit trail of all ingestion operations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| ingestion_request_id | uuid | FK to ingestion request (nullable) |
| intelligence_title_id | uuid | Source intelligence title |
| target_title_id | uuid | Target production title |
| ingested_fields | jsonb | Map of field → {old_value, new_value, source} |
| ingested_by | text | Admin email |
| ingested_at | timestamptz | Timestamp |
| notes | text | Optional notes |

---

## Supported Platforms

### Korean Platforms (URL-based)

| Platform | Domain | URL Pattern | Data Collected |
|----------|--------|-------------|----------------|
| Naver Webtoon | comic.naver.com | `/webtoon/list?titleId=XXX` | views, subscribers, rating, episodes, genre, author, synopsis |
| Naver Series | series.naver.com | `/comic/detail.series?productNo=XXX` | views, subscribers, rating, episodes, genre, author, tags |
| Kakao Page | page.kakao.com | `/content/XXX` | views, likes, rating, episodes, genre, synopsis |
| Kakao Webtoon | webtoon.kakao.com | `/content/{slug}/{id}` | views, likes, rating, episodes, genre |

### English Platforms (URL-based)

| Platform | Domain | URL Pattern | Data Collected |
|----------|--------|-------------|----------------|
| Manta | manta.net | `/en/series/{slug}?seriesId=XXX` | title_en, synopsis_en, genres, completion status, thumbnail |

### Fan Engagement (Title Name Search)

| Platform | Domain | Search Method | Data Collected |
|----------|--------|---------------|----------------|
| Reddit | reddit.com | Title name search | post count, subreddit mentions, engagement metrics |
| AO3 | archiveofourown.org | Works search | fanfiction count, popular tags, pairings |

---

## Frontend Components

### TitleInvestigator.tsx
**Location:** `apps/creator/src/pages/tools/TitleInvestigator.tsx`

Main entry point for intelligence collection.

**Features:**
- Multi-line URL input with real-time validation
- Platform auto-detection from URL
- Content type selector (webtoon, webnovel, etc.)
- Fan engagement source toggles (Reddit, AO3)
- Collection progress feedback
- Admin-only access with redirect for non-admins

**Security:**
- Uses `useAdminAuth` hook for access control
- Redirects non-admins to `/home` with toast notification
- Shows loading state while verifying admin status

### InvestigationDetail.tsx
**Location:** `apps/creator/src/pages/tools/InvestigationDetail.tsx`

Source comparison and ingestion workflow.

**Features:**
- Side-by-side source comparison cards
- Field-level checkbox selection for ingestion
- Target title search for ingestion
- Raw JSON data viewer (collapsible)
- Ingestion wizard with field mapping preview

**Ingestible Fields:**
- Views → `views`
- Subscribers → `likes`
- Rating → `rating`
- Episodes → `chapters`
- Author → `story_author`
- Genre → `genre`
- Age Rating → `age_rating`
- Tags → `keywords`

### ToolsIndex.tsx
**Location:** `apps/creator/src/pages/tools/ToolsIndex.tsx`

Admin tools dashboard with recent collections.

---

## Backend Edge Function

### title-intelligence/index.ts
**Location:** `supabase/functions/title-intelligence/index.ts`

**Endpoints:**
- POST `/functions/v1/title-intelligence`

**Request Formats:**

1. **URL-based (recommended):**
```json
{
  "urls": [
    {
      "platform": "naver_webtoon",
      "platformId": "842977",
      "originalUrl": "https://comic.naver.com/webtoon/list?titleId=842977"
    }
  ],
  "collectedBy": "admin@example.com",
  "contentType": "webtoon",
  "fanEngagement": {
    "titleName": "전지적 독자 시점",
    "sources": ["reddit", "ao3"]
  }
}
```

2. **Legacy name-based:**
```json
{
  "titleNameInput": "전지적 독자 시점",
  "sources": ["naver", "kakao", "reddit", "ao3"],
  "collectedBy": "admin@example.com",
  "contentType": "webtoon"
}
```

**Response:**
```json
{
  "success": true,
  "intelligenceTitleId": "uuid",
  "status": "collected",
  "sourcesCollected": ["naver_webtoon", "reddit", "ao3"],
  "errors": {
    "kakao": "Title not found"
  }
}
```

### Retry Logic

All scraper calls use exponential backoff retry:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number      // Default: 2
    baseDelayMs?: number     // Default: 1000
    operationName?: string   // For logging
  }
): Promise<T>
```

**Platform-specific delays:**
- Korean platforms (Naver, Kakao): 2s base delay, 3s rate limit between requests
- Manta: 1s base delay
- Reddit: 1s base delay
- AO3: 1.5s base delay (community-run, be respectful)

### Scrapers

| File | Platform | Method |
|------|----------|--------|
| `naver.ts` | Naver Webtoon | Nomad API + og:meta fallback |
| `naver-series.ts` | Naver Series | HTML parsing + meta tags |
| `kakao.ts` | Kakao Page | `__NEXT_DATA__` extraction |
| `kakao-webtoon.ts` | Kakao Webtoon | API + HTML fallback |
| `manta.ts` | Manta | `__NEXT_DATA__` → headData |
| `reddit.ts` | Reddit | Public API search |
| `ao3.ts` | AO3 | Works search HTML parsing |

---

## Service Layer

### intelligenceService.ts
**Location:** `apps/creator/src/services/intelligenceService.ts`

**Key Functions:**

```typescript
// Trigger collection
collectIntelligenceByUrls(request, userEmail): Promise<CollectIntelligenceByUrlsResponse>

// Fetch data
getIntelligenceTitles(): Promise<IntelligenceTitle[]>
getIntelligenceTitleWithSources(id): Promise<IntelligenceTitleWithSources>

// Ingestion workflow
createIngestionRequest(intelligenceTitleId, targetTitleId, fieldSelections, requestedBy): Promise<IngestionRequest>
executeIngestion(requestId, executedBy): Promise<void>
getIngestionHistory(targetTitleId): Promise<IngestionLog[]>

// Search
searchTitlesForIngestion(query): Promise<Array<{title_id, title_name_kr, title_name_en}>>
```

**Field Mapping:**
```typescript
const mapping: Record<string, string> = {
  'views': 'views',
  'subscribers': 'likes',
  'likes': 'likes',
  'rating': 'rating',
  'rating_score': 'rating',
  'chapters': 'chapters',
  'episode_count': 'chapters',
  'completed': 'completed',
  'status': 'completed',
  'synopsis': 'synopsis',
  'synopsis_kr': 'description_kr',
  'genre': 'genre',
  'author': 'story_author',
  'age_rating': 'age_rating',
  'tags': 'keywords',
  'keywords': 'keywords',
}
```

---

## User Workflow

### 1. Collect Intelligence

1. Navigate to **Tools → Title Investigator**
2. Enter platform URLs (one per line)
3. Select content type (webtoon, webnovel, etc.)
4. Optionally enable fan engagement sources:
   - Enter title name (Korean or English)
   - Toggle Reddit and/or AO3
5. Click **Collect Intelligence**
6. Wait for collection to complete (shows progress)
7. Automatically navigates to detail page

### 2. Review Sources

1. View **Source Comparison** cards
2. Each source shows:
   - Platform badge and link
   - Metrics (views, subscribers, rating, etc.)
   - Genres and tags
   - Author/artist info
   - Snapshot timestamp
3. Expand **Raw Data (JSON)** for full scraped data

### 3. Ingest to Production

1. Click **Start Ingestion Wizard**
2. Search for target title in production database
3. For each source card:
   - Check fields to ingest
   - Preview values with → arrows showing field mapping
4. Review selected fields summary at bottom
5. Click **Execute Ingestion**
6. View ingestion history on title detail page

---

## Error Handling

### Frontend Toast Messages

| Scenario | Toast Title | Message |
|----------|-------------|---------|
| Full success | Collection complete | Successfully collected from N source(s) |
| Partial success | Partial Success | Collected from N source(s). Failed: source1, source2 |
| All failed | Collection failed | source1: error1; source2: error2 |
| Exception | Collection failed | Error message |

### Backend Error Tracking

Errors are collected in `collectionErrors` object and returned in response:

```typescript
{
  "errors": {
    "naver_webtoon": "HTTP 404: Title not found",
    "reddit": "Rate limit exceeded"
  }
}
```

### Retry Behavior

- First attempt: Immediate
- First retry: After `baseDelayMs` (1-2s)
- Second retry: After `baseDelayMs * 2` (2-4s)
- Third retry: After `baseDelayMs * 4` (4-8s)
- Failure: Error added to `collectionErrors`

---

## Security

### Admin-Only Access

The Title Investigator is restricted to admin users:

```typescript
// TitleInvestigator.tsx
const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();

useEffect(() => {
  if (!isAdminLoading && !isAdmin) {
    toast({ title: 'Access Denied', variant: 'destructive' });
    navigate('/home');
  }
}, [isAdmin, isAdminLoading]);
```

### Database Access

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Frontend uses `VITE_SUPABASE_ANON_KEY` with RLS policies
- Admin verification via `admin` table query

---

## File Structure

```
apps/creator/src/
├── pages/tools/
│   ├── TitleInvestigator.tsx    # URL input & collection trigger
│   ├── InvestigationDetail.tsx  # Source comparison & ingestion
│   └── ToolsIndex.tsx           # Admin tools dashboard
├── services/
│   └── intelligenceService.ts   # API calls & data transformations
└── hooks/
    └── useAdminAuth.tsx         # Admin access verification

supabase/functions/title-intelligence/
├── index.ts                     # Main handler & orchestration
└── scrapers/
    ├── naver.ts                 # Naver Webtoon scraper
    ├── naver-series.ts          # Naver Series scraper
    ├── kakao.ts                 # Kakao Page scraper
    ├── kakao-webtoon.ts         # Kakao Webtoon scraper
    ├── manta.ts                 # Manta scraper
    ├── reddit.ts                # Reddit API scraper
    └── ao3.ts                   # AO3 scraper

supabase/migrations/
├── 20251124000000_add_intelligence_schema.sql
└── 20251127000000_add_ingestion_tables.sql
```

---

## Configuration

### Environment Variables

**Frontend (Vercel):**
```
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Edge Function (Supabase):**
```
SUPABASE_URL (automatic)
SUPABASE_SERVICE_ROLE_KEY (automatic)
```

### Rate Limiting

| Platform | Request Delay | Retry Base Delay |
|----------|---------------|------------------|
| Naver | 3s between | 2s |
| Kakao | 3s between | 2s |
| Manta | 3s between | 1s |
| Reddit | None | 1s |
| AO3 | None | 1.5s |

---

## Future Improvements

### Planned
- [ ] Bulk intelligence collection (batch processing)
- [ ] Scheduled refresh of metrics
- [ ] WebSocket progress updates during collection
- [ ] Email notifications for completed collections

### Potential
- [ ] Additional platforms (Webtoons.com, Tapas, Tappytoon)
- [ ] Metric trend analysis
- [ ] Automated ingestion rules
- [ ] ML-based title matching

---

## Changelog

### 2025-11-27
- Added Manta platform support
- Fixed AO3 search (title cleaning for Korean suffixes)
- Added retry logic with exponential backoff
- Added admin access verification
- Improved error handling (partial success)
- Fixed type safety issues (removed `as any` casts)
- Added Subscribers → Likes field mapping
- Added Tags → Keywords field mapping

### 2025-11-26
- Added Kakao Webtoon support
- Combined Reddit + AO3 into single fan engagement request
- Fixed Reddit/AO3 collection workflow

### 2025-11-24
- Initial release with normalized schema
- URL-based collection for Korean platforms
- Fan engagement tracking (Reddit, AO3)
- Ingestion wizard with field selection
