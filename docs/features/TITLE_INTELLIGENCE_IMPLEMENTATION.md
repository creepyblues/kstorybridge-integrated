# Title Intelligence System - Implementation Documentation

**Status**: ✅ COMPLETED - Phase 4 (Frontend UI Complete)
**Date**: 2025-11-23
**Environment**: Production database + Deployed edge function + Creator app UI

---

## Overview

The Title Intelligence System allows admin users to collect popularity signals and metadata from multiple sources (Naver, Kakao, Reddit, AO3) for any title. The system provides:

- One-title-at-a-time intelligence collection
- Multi-source data aggregation with flexible JSON storage
- Field-level verification workflow
- Permanent raw data retention
- Admin-only access control

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Creator App (Admin UI)                   │
│                                                                   │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐ │
│  │ Tools Index  │──▶│ Title           │──▶│ Investigation    │ │
│  │ Dashboard    │   │ Investigator    │   │ Detail           │ │
│  └──────────────┘   └─────────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  intelligenceService  │
                    └───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Edge Function (title-intelligence)         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Orchestrator (index.ts)                      │   │
│  │  - Admin auth verification                                │   │
│  │  - Database record creation                               │   │
│  │  - Sequential scraper execution                           │   │
│  │  - Rate limiting (3s between Naver/Kakao)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                │                                  │
│       ┌────────────────────────┼────────────────────────┐        │
│       ▼                        ▼                        ▼        │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐       │
│  │  Naver  │   │  Kakao   │   │  Reddit  │   │   AO3   │       │
│  │ Scraper │   │ Scraper  │   │ Scraper  │   │ Scraper │       │
│  └─────────┘   └──────────┘   └──────────┘   └─────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                  ┌─────────────────────────────┐
                  │  Supabase Database          │
                  │  - title_intelligence_data  │
                  │  - RLS: Admin-only          │
                  └─────────────────────────────┘
```

---

## Database Schema

### Table: `title_intelligence_data`

**Core Fields:**
- `id` (uuid, PK) - Unique intelligence record ID
- `title_name_input` (text) - Title name as entered by admin
- `title_id` (uuid, FK, nullable) - Optional link to existing title

**Collection Fields:**
- `collected_by` (text) - Admin email who triggered collection
- `collected_at` (timestamptz) - Collection timestamp
- `sources_requested` (text[]) - Array of sources (e.g., ['naver', 'kakao'])
- `collection_status` (text) - pending | in_progress | completed | partial_failure | failed
- `collection_errors` (jsonb) - Source-specific error messages

**Data Storage:**
- `raw_data` (jsonb) - Flexible JSON storage for all source data
  ```json
  {
    "naver": { "views": 1500000, "rating": 9.8, ... },
    "kakao": { "views": 800000, "likes": 50000, ... },
    "reddit": { "posts": 250, "avg_upvotes": 450, ... },
    "ao3": { "works": 1200, "kudos": 18000, ... }
  }
  ```

**Verification Fields:**
- `verified_fields` (jsonb) - Field-level approval tracking
  ```json
  {
    "naver.views": {
      "approved": true,
      "verified_by": "admin@example.com",
      "verified_at": "2025-11-23T10:00:00Z"
    },
    "naver.rating": {
      "approved": false,
      "rejected_reason": "Inaccurate data",
      "verified_by": "admin@example.com",
      "verified_at": "2025-11-23T10:01:00Z"
    }
  }
  ```
- `verification_status` (text) - pending | in_progress | completed | skipped
- `verified_by` (text) - Admin email who verified
- `verified_at` (timestamptz) - Verification timestamp

**Ingestion Fields:**
- `ingested` (boolean) - Whether data was ingested into titles table
- `ingested_by` (text) - Admin email who performed ingestion
- `ingested_at` (timestamptz) - Ingestion timestamp
- `ingested_to_title_id` (uuid, FK) - Title where data was ingested
- `ingestion_notes` (text) - Optional notes about ingestion

**System Fields:**
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp (auto-updated)

**Indexes:**
- `idx_title_intelligence_title_name_input` - Search by title name
- `idx_title_intelligence_title_id` - Filter by linked title
- `idx_title_intelligence_verification_status` - Filter by verification status
- `idx_title_intelligence_collection_status` - Filter by collection status
- `idx_title_intelligence_created_at` - Recent collections listing
- `idx_title_intelligence_collected_by` - Filter by collector

**RLS Policies:**
- All operations (SELECT, INSERT, UPDATE, DELETE) restricted to active admins
- Admin check: `EXISTS (SELECT 1 FROM admin WHERE admin.email = auth.jwt() ->> 'email' AND admin.active = true)`

---

## Edge Function: `title-intelligence`

**URL**: `https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/title-intelligence`

**Authentication**: Bearer token (admin JWT)

**Request Body:**
```json
{
  "titleNameInput": "Solo Leveling",
  "sources": ["naver", "kakao", "reddit", "ao3"],
  "collectedBy": "admin@example.com",
  "titleId": "optional-uuid-if-linking-to-existing-title"
}
```

**Response (Success):**
```json
{
  "success": true,
  "intelligenceId": "uuid-of-created-record",
  "status": "completed",
  "sourcesCollected": ["naver", "kakao"],
  "errors": {
    "reddit": "API rate limited",
    "ao3": "No data returned"
  }
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

**Flow:**
1. Verify admin access via JWT
2. Create intelligence record in database (status: in_progress)
3. Execute scrapers sequentially:
   - Naver scraper → Wait 3 seconds
   - Kakao scraper → Wait 3 seconds
   - Reddit scraper (no delay)
   - AO3 scraper (no delay)
4. Aggregate results into `raw_data` and `collection_errors`
5. Update record with final status (completed | partial_failure | failed)
6. Return intelligence ID to frontend

**Error Handling:**
- Individual scraper failures don't stop the process
- Partial success: Some sources succeed, some fail (status: partial_failure)
- Complete failure: All sources fail (status: failed)
- Errors stored per-source in `collection_errors`

---

## Frontend Service: `intelligenceService.ts`

**Location**: `apps/creator/src/services/intelligenceService.ts`

**Functions:**

### `collectIntelligence(request, userEmail)`
Triggers intelligence collection by calling edge function.

**Parameters:**
- `titleNameInput` (string) - Title name to search
- `sources` (string[]) - Array of source IDs
- `titleId` (string, optional) - Link to existing title

**Returns:** `CollectIntelligenceResponse`

### `getIntelligenceRecords()`
Fetches all intelligence records (admin only), sorted by creation date descending.

**Returns:** `IntelligenceRecord[]`

### `getIntelligenceRecord(id)`
Fetches single intelligence record by ID.

**Returns:** `IntelligenceRecord`

### `verifyField(intelligenceId, fieldPath, approved, verifiedBy, rejectedReason?)`
Updates verification status for a specific field.

**Parameters:**
- `intelligenceId` - Record ID
- `fieldPath` - Field path (e.g., "naver.views")
- `approved` - true/false
- `verifiedBy` - Admin email
- `rejectedReason` - Optional reason if rejected

### `completeVerification(intelligenceId, verifiedBy)`
Marks entire record as verified.

### `ingestIntelligence(intelligenceId, titleId, ingestedBy, notes?)`
Ingests approved fields into titles table.

**Note:** Extracts only approved fields from `verified_fields` and updates corresponding title.

### `deleteIntelligenceRecord(id)`
Deletes intelligence record (rarely used - we keep raw data permanently).

---

## Admin UI Pages

### 1. Tools Index (`/tools`)

**Features:**
- Tool cards with descriptions and features
- Recent intelligence collections list (5 most recent)
- Status badges (completed, partial, failed, in_progress)
- Quick navigation to Title Investigator

**Access Control:**
- Protected by `AdminProtectedRoute`
- Only visible to admins with "⚡ Tools" menu item in sidebar

### 2. Title Investigator (`/tools/title-investigator`)

**Features:**
- Title name input field
- Source selection checkboxes:
  - Naver Webtoon (default checked)
  - Kakao Page (default checked)
  - Reddit
  - Archive of Our Own (AO3)
- "Collect Intelligence" button with loading state
- "How it works" information card
- Auto-navigation to results page after collection

**Validation:**
- Title name required
- At least one source required
- User must be authenticated

### 3. Investigation Detail (`/tools/intelligence/:id`)

**Features:**
- Collection metadata display (collector, status, dates, ingestion)
- Status badge with icon
- Raw data viewer (JSON formatted) per source
- Collection errors display (if any)
- "Mark as Verified" button (if status is pending)
- Future enhancement notes

**Coming Soon Section:**
- Field-level verification UI
- Automatic ingestion workflow
- Field mapping configuration

---

## Admin Access Control

### Hook: `useAdminAuth`

**Location**: `apps/creator/src/hooks/useAdminAuth.tsx`

**Returns:**
```typescript
{
  isAdmin: boolean
  isLoading: boolean
  adminProfile: AdminProfile | null
  error: Error | null
}
```

**Implementation:**
- Queries `admin` table by user email
- Checks `active = true` flag
- 5-minute cache using TanStack Query
- Used in sidebar and protected routes

### Component: `AdminProtectedRoute`

**Location**: `apps/creator/src/components/AdminProtectedRoute.tsx`

**Behavior:**
- Shows loading spinner while checking admin status
- Redirects non-admins to `/home`
- Renders children for admin users

**Usage:**
```tsx
<Route path="/tools/*" element={
  <AdminProtectedRoute>
    <ToolsRouter />
  </AdminProtectedRoute>
} />
```

### Sidebar Integration

**Modified**: `apps/creator/src/components/layout/CMSSidebar.tsx`

- Conditionally shows "⚡ Tools" menu item
- Only visible when `isAdmin === true`
- Links to `/tools`

---

## Scraper Modules (Placeholder Implementation)

All scrapers return mock data structures. Production implementation requires:

### Naver Scraper (`scrapers/naver.ts`)
- **Method**: Playwright web scraping
- **Rate Limit**: 1 request per 3 seconds
- **Data**: views, rating, subscribers, chapters, platform_url, genre, author, synopsis
- **Helper**: `parseKoreanNumber()` for "1.5만" → 15000 conversion

### Kakao Scraper (`scrapers/kakao.ts`)
- **Method**: Playwright web scraping
- **Rate Limit**: 1 request per 3 seconds
- **Data**: views, rating, likes, chapters, platform_url, genre, age_rating
- **Helper**: `parseKoreanNumber()` for Korean number formats

### Reddit Scraper (`scrapers/reddit.ts`)
- **Method**: Reddit API (requires OAuth credentials)
- **Rate Limit**: 60 requests per minute (unauthenticated)
- **Data**: posts, avg_upvotes, avg_comments, top_posts, subreddits, sentiment
- **Helper**: `fetchRedditPosts()` for public API access

### AO3 Scraper (`scrapers/ao3.ts`)
- **Method**: Web scraping (no official API)
- **Rate Limit**: 1 request per 5 seconds (respectful scraping)
- **Data**: works, bookmarks, kudos, comments, top_works, popular_ships, popular_tags
- **Note**: AO3 allows scraping but requires courtesy (robots.txt compliance)

---

## Deployment Status

### ✅ Production Database
- Migration `20251123000000_add_title_intelligence_data.sql` applied
- Table created with all fields, indexes, RLS policies, triggers

### ✅ Edge Function Deployed
- Function: `title-intelligence`
- Project: `dlrnrgcoguxlkkcitlpd`
- All scraper modules uploaded
- Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

### ✅ Creator App
- Dev server running on http://localhost:8084
- All UI pages implemented
- Intelligence service integrated
- Admin access control active

---

## Testing Checklist

### Local Testing
- [ ] Sign in as admin user
- [ ] Verify "⚡ Tools" menu appears in sidebar
- [ ] Navigate to Tools dashboard
- [ ] Click "Title Investigator"
- [ ] Enter a title name (e.g., "Solo Leveling")
- [ ] Select sources (Naver, Kakao)
- [ ] Click "Collect Intelligence"
- [ ] Verify redirect to detail page
- [ ] Check raw data display
- [ ] Click "Mark as Verified"
- [ ] Verify status update

### Production Testing
- [ ] Deploy creator app to production
- [ ] Sign in as admin on production
- [ ] Test intelligence collection
- [ ] Verify edge function executes
- [ ] Check database records created
- [ ] Test verification workflow

---

## Future Enhancements

### Phase 5: Real Scraping Implementation
1. **Naver**: Implement Playwright scraping
   - Search: `comic.naver.com`
   - Extract: views, rating, subscribers, chapters
   - Handle Korean number formats

2. **Kakao**: Implement Playwright scraping
   - Search: `page.kakao.com`
   - Extract: views, likes, rating, chapters
   - Handle dynamic content loading

3. **Reddit**: Implement API integration
   - OAuth: Client ID/Secret required
   - Search: `/search.json?q={title}`
   - Extract: posts, upvotes, comments, sentiment

4. **AO3**: Implement web scraping
   - Search: `archiveofourown.org/works/search`
   - Extract: works, kudos, bookmarks, tags
   - Respect rate limits (1 req / 5 sec)

### Phase 6: Advanced Features
1. **Field-level Verification UI**
   - Display fields in table format
   - Approve/reject buttons per field
   - Rejection reason input
   - Visual indicators for verified fields

2. **Automatic Ingestion**
   - Field mapping configuration
   - Title selection or creation
   - Conflict resolution (which source to prefer)
   - Preview before ingestion

3. **Batch Processing**
   - Queue multiple titles
   - Overnight processing
   - Email notifications
   - Priority queue

4. **Analytics Dashboard**
   - Collection success rate
   - Source reliability metrics
   - Processing time statistics
   - Error rate tracking

---

## Troubleshooting

### Edge Function Not Found
```bash
npx supabase functions deploy title-intelligence
```

### Admin Not Recognized
Check `admin` table:
```sql
SELECT * FROM admin WHERE email = 'your-email@example.com';
-- Ensure active = true
```

### CORS Errors
Edge function already includes CORS headers:
```typescript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}
```

### RLS Policy Blocking
Verify admin check in RLS:
```sql
-- Test query
SELECT EXISTS (
  SELECT 1 FROM admin
  WHERE admin.email = auth.jwt() ->> 'email'
  AND admin.active = true
);
```

---

## Related Documentation

- [TITLE_INTELLIGENCE_SYSTEM.md](./TITLE_INTELLIGENCE_SYSTEM.md) - Original system design
- [Creator App CLAUDE.md](../../apps/creator/CLAUDE.md) - Creator app documentation
- [Database Schema](../active/DATABASE_SCHEMA.md) - Complete database reference

---

**Last Updated**: 2025-11-23
**Status**: ✅ PRODUCTION READY (Placeholder Scrapers)
**Next Phase**: Phase 5 - Real Scraping Implementation
