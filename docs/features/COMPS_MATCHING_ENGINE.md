# Unified Comps Matching Engine

**Version**: 2.0.0
**Last Updated**: 2025-12-11
**Status**: Live

---

## Overview

The Unified Comps Matching Engine provides consistent 8-dimensional analysis for matching Hollywood/global comparable titles (comps) with Korean content across both:

1. **Comps Generator** (Admin): Korean title → Hollywood comps
2. **Comps Navigator** (Buyer): Hollywood comps → Korean titles

Both features now use the same dimension framework, weights, and scoring logic.

---

## Architecture

```
+-----------------------------------+
|   Unified Comps Matching Engine   |
|   /supabase/functions/_shared/    |
+-----------------------------------+
         |
    +----+----+
    |         |
+---v---+ +---v---+
| FAST  | | DEEP  |
| MODE  | | MODE  |
+-------+ +-------+
Navigator Generator
```

### Shared Components

| File | Purpose |
|------|---------|
| `_shared/comps-types.ts` | Type definitions, constants, interfaces |
| `_shared/comps-utils.ts` | Utility functions, calculations |

---

## 8 Canonical Dimensions

All comp matching uses these 8 weighted dimensions:

| Dimension | Key | Weight | Description |
|-----------|-----|--------|-------------|
| **Genre Blueprint** | `genre_blueprint` | 20% | Save the Cat genre classification |
| **Tone & Mood** | `tone_mood` | 15% | Emotional register and atmosphere |
| **Characters** | `character_archetypes` | 15% | Hero types, antagonist patterns, relationships |
| **Plot Structure** | `plot_structure` | 15% | Narrative arc and pacing |
| **Setting & World** | `setting_world` | 10% | Time, place, worldbuilding |
| **Themes** | `themes` | 10% | Core messages and social commentary |
| **Target Audience** | `target_audience` | 10% | Demographics and appeal factors |
| **Format Style** | `format_style` | 5% | Narrative structure and format |

### Save the Cat Genres

The `genre_blueprint` dimension uses Blake Snyder's genre taxonomy:

- Monster in the House
- Golden Fleece
- Out of the Bottle
- Dude with a Problem
- Rites of Passage
- Buddy Love
- Whydunit
- Fool Triumphant
- Institutionalized
- Superhero

---

## Mode Comparison

| Aspect | Fast Mode (Navigator) | Deep Mode (Generator) |
|--------|----------------------|----------------------|
| **LLM Model** | GPT-4o-mini | GPT-4o |
| **Temperature** | 0.3 | 0.4 |
| **Max Results** | 5 | 8 |
| **Story Deconstruction** | No (uses metadata) | Yes (full analysis) |
| **Target Latency** | 6-12 seconds | 10-15 seconds |
| **Cost per Call** | ~$0.016-0.018 | ~$0.08 |

---

## Response Structure

### DimensionScore

```typescript
interface DimensionScore {
  dimension: DimensionKey;      // e.g., "genre_blueprint"
  score: number;                // 0-100
  reason: string;               // 1-2 sentence explanation
  aligned_comps: string[];      // Which input comps aligned (e.g., ["Squid Game"])
}
```

### TitleMatch (Navigator)

```typescript
interface TitleMatch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;

  // V2.0.0 fields
  overall_match_score: number;      // 0-100, weighted average
  dimension_scores: DimensionScore[];
  match_reasons: string[];          // 4-5 bullet points

  // Legacy (backward compat)
  match_score?: number;             // DEPRECATED
  explanation: string;

  // Metadata
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  has_pitch_deck?: boolean;
}
```

### SuggestedComp (Generator)

```typescript
interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;                // "TV Series" | "Film" | "Anime"

  // V2.0.0 fields
  overall_match_score: number;      // 0-100, weighted average
  dimension_scores: DimensionScore[];
  match_reasons: string[];
  explanation: string;

  // IMDB enrichment
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;
}
```

---

## Score Levels

| Score Range | Level | UI Color |
|-------------|-------|----------|
| ≥ 85 | Excellent | Green (`emerald`) |
| 70-84 | Strong | Blue |
| 55-69 | Moderate | Amber/Yellow |
| < 55 | Weak | Gray |

---

## API Endpoints

### Comps Navigator

**Edge Function**: `/supabase/functions/comp-navigator/`

**Request**:
```typescript
{
  comp_titles: string[];        // 1-3 Hollywood comps
  refinement_text?: string;     // Optional focus text
  user_email: string;
  save_search?: boolean;
  search_name?: string;
}
```

**Response**:
```typescript
{
  results: TitleMatch[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: "2.0.0";
  mode_used: "fast";
}
```

### Comps Generator

**Edge Function**: `/supabase/functions/comps-generator/`

**Request**:
```typescript
{
  title_id: string;
  mode?: 'rich' | 'limited' | 'auto';
  user_email: string;
}
```

**Response**:
```typescript
{
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;
  suggested_comps: SuggestedComp[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: "2.0.0";
}
```

---

## Frontend Integration

### Service Layer

**File**: `apps/dashboard/src/services/compsNavigatorService.ts`

```typescript
import {
  TitleMatch,
  getMatchScore,
  formatDimensionName,
  getDimensionWeightPercent,
  getScoreLevel,
} from '@/services/compsNavigatorService';

// Get effective score (backward compatible)
const score = getMatchScore(match);

// Format dimension for display
const label = formatDimensionName('genre_blueprint'); // "Genre Blueprint"

// Get weight as percentage
const weight = getDimensionWeightPercent('genre_blueprint'); // "20%"

// Get score level
const level = getScoreLevel(85); // "excellent"
```

### UI Components

| Component | Location | Features |
|-----------|----------|----------|
| `TitleMatchCard` | `comps-navigator/TitleMatchCard.tsx` | Collapsible dimension display |
| `MatchDetailModal` | `comps-navigator/MatchDetailModal.tsx` | Full dimension grid |
| `CompsGeneratorModal` | `admin/CompsGeneratorModal.tsx` | Admin comp generation |

---

## Aligned Comps Feature

Each dimension shows which Hollywood comp(s) it aligns with:

```typescript
{
  dimension: "tone_mood",
  score: 85,
  reason: "Dark, suspenseful atmosphere with social commentary",
  aligned_comps: ["Squid Game", "Parasite"]
}
```

This helps buyers understand WHY a Korean title matches their comp combination.

---

## Performance Benchmarks

### Navigator (Fast Mode)

| Phase | Time | Cost |
|-------|------|------|
| Embedding Generation | 500-1000ms | ~$0.0002 |
| Vector Search | 500-1000ms | $0 |
| Smart Prioritization | 50-100ms | $0 |
| LLM Re-ranking | 4-8s (up to 60s on slow responses) | ~$0.014 |
| **Total** | **6-12s** (typical), up to 70s | **~$0.016-0.018** |

> **Note**: OpenAI response times can vary significantly. LLM timeout is set to 90 seconds to handle slow responses.

### Generator (Deep Mode)

| Phase | Time | Cost |
|-------|------|------|
| Data Collection | 100-200ms | $0 |
| Story Deconstruction | 3-5s | ~$0.02 |
| Comp Generation | 3-8s | ~$0.06 |
| IMDB Enrichment | 2-3s | $0 |
| **Total** | **10-15s** | **~$0.08** |

---

## Version History

### 2.0.0 (2025-12-11)

- **Unified Engine**: Both Navigator and Generator use same dimension framework
- **8-Dimensional Scoring**: Navigator now returns full dimension breakdown
- **Aligned Comps**: Each dimension shows which input comp it aligned with
- **Engine Tracking**: All responses include `engine_version` field
- **Shared Types**: Created `/supabase/functions/_shared/comps-types.ts`
- **Utility Functions**: Created `/supabase/functions/_shared/comps-utils.ts`
- **UI Enhancements**: Added collapsible dimension display to cards and modals

### 1.0.0 (2025-11-20)

- Initial implementation
- Navigator: Simple single-score matching
- Generator: 8-dimensional scoring (not shared with Navigator)

---

## Files Reference

### Edge Functions

| File | Lines | Purpose |
|------|-------|---------|
| `_shared/comps-types.ts` | ~280 | Type definitions and constants |
| `_shared/comps-utils.ts` | ~150 | Utility functions |
| `comp-navigator/index.ts` | ~680 | Navigator edge function |
| `comps-generator/index.ts` | ~700 | Generator edge function |

### Frontend

| File | Purpose |
|------|---------|
| `services/compsNavigatorService.ts` | Service layer with types |
| `services/compsGeneratorService.ts` | Generator service |
| `comps-navigator/TitleMatchCard.tsx` | Result card with dimensions |
| `comps-navigator/MatchDetailModal.tsx` | Detail modal with grid |

---

## Database Tables

### comp_searches

Stores Navigator search history.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_email` | text | User identifier |
| `comp_titles` | text[] | 1-3 input comps |
| `refinement_text` | text | Optional focus |
| `search_results` | jsonb | Cached TitleMatch[] |
| `is_bookmarked` | boolean | Saved search flag |

### comp_title_cache

Caches OpenAI embeddings for comps.

| Column | Type | Purpose |
|--------|------|---------|
| `comp_title` | text | Primary key |
| `embedding` | vector(1536) | OpenAI embedding |
| `source` | text | Origin of embedding |

---

## Testing

### Verify Engine Version

```bash
# Navigator
curl -X POST https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/comp-navigator \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"comp_titles":["Squid Game"],"user_email":"test@example.com","save_search":false}'

# Check response includes:
# - engine_version: "2.0.0"
# - results[].dimension_scores (8 items)
# - results[].aligned_comps
```

### Verify Dimension Scores

Each result should have 8 `dimension_scores` with:
- `dimension`: One of the 8 canonical keys
- `score`: 0-100
- `reason`: Explanation string
- `aligned_comps`: Array of comp titles

---

## Troubleshooting

### LLM Timeout Errors

If Navigator returns 400 errors with "Request timed out":

**Root Cause**: OpenAI GPT-4o-mini taking longer than expected for 8-dimensional analysis.

**Timeout Configuration** (`comp-navigator/index.ts`):
| Operation | Timeout | Line |
|-----------|---------|------|
| General fetch | 30,000ms | `REQUEST_TIMEOUT_MS` |
| Embedding generation | 15,000ms | Line ~450 |
| LLM re-ranking | 90,000ms | Line ~698 |

**Fix History**: 2025-12-14 - Increased LLM timeout from 45s to 90s. See `docs/features/comps-navigator/LLM_TIMEOUT_FIX.md`.

### Missing Dimensions

If `dimension_scores` is empty or missing:
1. Check LLM response in edge function logs
2. Verify prompt template is correct
3. Ensure GPT response format is JSON

### Score Calculation

Overall score is calculated as weighted average:

```typescript
const overallScore = dimensions.reduce((sum, dim) => {
  const weight = DIMENSION_WEIGHTS[dim.dimension];
  return sum + (dim.score * weight);
}, 0);
```

### Backward Compatibility

Old responses (v1.x) may not have `dimension_scores`. Use utility function:

```typescript
const score = getMatchScore(match);
// Returns overall_match_score || match_score || 0
```
