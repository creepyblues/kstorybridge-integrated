# Format Fit Analyzer

**Last Updated**: 2025-12-16

AI-powered format fit analysis that evaluates Korean webtoons/webnovels for adaptation suitability across 5 content formats.

---

## Overview

The Format Fit Analyzer uses GPT-4o to deconstruct stories and score their adaptation potential for:

| Format | Description | Duration |
|--------|-------------|----------|
| **Film** | Feature film adaptation | 90-150 min |
| **TV Series** | Episodic series | 8-16 episodes |
| **Animation** | Animated series/film | Variable |
| **Microdrama** | Vertical short-form (ReelShort, DramaBox) | 60-120s × 70-100+ episodes |
| **Audio Drama** | Podcast/audio fiction | Variable |

---

## Architecture

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Edge Function** | `supabase/functions/format-fit-engine/index.ts` | GPT-4o analysis engine |
| **Service** | `apps/dashboard/src/services/formatFitService.ts` | Frontend API wrapper |
| **Generator Modal** | `apps/dashboard/src/components/format-fit/FormatFitGeneratorModal.tsx` | Admin trigger UI |
| **Display Card** | `apps/dashboard/src/components/format-fit/FormatFitCard.tsx` | Score display (3 variants) |
| **Detail Panel** | `apps/dashboard/src/components/format-fit/FormatFitDetailPanel.tsx` | Full analysis view |

### Database

**Table**: `title_format_fit`

```sql
-- Scores (0-100)
film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score

-- Detailed Analysis (JSONB)
film_analysis, tv_series_analysis, animation_analysis, microdrama_analysis, audio_drama_analysis

-- Shared Analysis
story_deconstruction JSONB  -- Save the Cat genre, archetypes, themes, etc.

-- Metadata
data_completeness INTEGER   -- 0-100%
mode_used TEXT              -- 'rich' or 'limited'
analysis_version TEXT
processing_time_ms INTEGER
cost_estimate NUMERIC
```

**Note**: Format fit data is stored in a **separate table** (not in `titles`), linked via `title_id` foreign key.

---

## Discover Titles Format Filtering

The Discover Titles page (`/buyers/titles`) allows filtering by best format.

### UI

```
Best for: [All Formats] [Film] [TV Series] [Animation] [Microdrama] [Audio Drama]  [Score 50+]
```

When a format filter is selected, only titles with score ≥ 50 for that format are shown.

### Flow

```
1. User clicks format button (e.g., "Microdrama")
   ↓
2. Titles.tsx calls formatFitService.getTitlesForFormat('microdrama', 50, 100)
   ↓
3. Service queries title_format_fit table
   ↓
4. Filters: microdrama_score >= 50
   ↓
5. Sorts by score DESC, limits to 100
   ↓
6. Returns Set of title_ids
   ↓
7. Fetches those titles and displays in grid
```

### Code Reference

**Titles.tsx** (lines 46-65):
```typescript
useEffect(() => {
  const fetchFormatFilteredIds = async () => {
    if (!formatFilter) {
      setFormatFilteredTitleIds(null);
      return;
    }

    const results = await formatFitService.getTitlesForFormat(formatFilter, 50, 100);
    const ids = new Set(results.map((r) => r.title_id));
    setFormatFilteredTitleIds(ids);
  };

  fetchFormatFilteredIds();
}, [formatFilter]);
```

**formatFitService.ts** (lines 336-364):
```typescript
export async function getTitlesForFormat(
  format: FormatType,
  minScore: number = 60,
  limit: number = 30
): Promise<{ title_id: string; score: number }[]> {
  const { data } = await supabase
    .from('title_format_fit')
    .select('title_id, film_score, tv_series_score, animation_score, microdrama_score, audio_drama_score');

  // Filter: {format}_score >= minScore
  // Sort by score DESC
  // Return top {limit} title_ids
}
```

### Key Behaviors

| Behavior | Value |
|----------|-------|
| Minimum score threshold | **50** |
| Maximum results | **100 titles** |
| Titles without format fit data | **Not shown** when filter active |
| UI indicator | "Score 50+" badge appears when filter selected |

---

## Admin Integration

### TitleEditModal

The "Format Fit" button in admin title edit modal triggers analysis:

- **Location**: `apps/dashboard/src/components/admin/TitleEditModal.tsx`
- **Button Style**: Highlights blue when analysis exists
- **Processing Time**: 15-20 seconds
- **Cost**: ~$0.003 per analysis

### Trigger Flow

1. Admin clicks "Format Fit" button
2. `FormatFitGeneratorModal` opens
3. Modal auto-triggers analysis on open
4. Shows loading phases
5. Displays results with all 5 formats
6. Best format highlighted
7. Results saved to database automatically

---

## Analysis Engine

### 5-Phase Process

| Phase | Description | Duration |
|-------|-------------|----------|
| **1. Data Collection** | Fetch title, content analysis, pitch docs | ~500ms |
| **2. Data Completeness** | Score data quality (0-100%), determine mode | ~50ms |
| **3. Story Deconstruction** | GPT-4o extracts archetypes, structure, themes | ~5-8s |
| **4. Format Scoring** | GPT-4o scores all 5 formats | ~8-12s |
| **5. Database Save** | Upsert to title_format_fit | ~200ms |

### Data Completeness Scoring

```
Core Fields:
- Synopsis (>50 chars): +10
- Genre (non-empty): +10
- Tone: +10

Rich Data:
- Character details: +15
- Story structure: +10
- Setting description: +5
- Important issues: +5
- World/lore: +5
- Inspiration: +5
- Audience: +5

Content Analysis:
- Plot elements: +10
- Semantic tags: +5
- Character types: +5
- Pitch analysis: +10

Bonus:
- Pitch deck uploaded: +10
```

**Mode Selection**:
- Score ≥ 50% → `rich` mode (more detailed prompts)
- Score < 50% → `limited` mode (basic prompts)

### 7 Scoring Dimensions

Each format is evaluated on these dimensions (0-100):

1. **narrative_structure** - How well does the story arc fit?
2. **character_suitability** - Do characters work for this format?
3. **visual_requirements** - Can visual demands be met?
4. **pacing_fit** - Does pacing match format expectations?
5. **production_feasibility** - Is production realistic?
6. **audience_alignment** - Does target audience match?
7. **genre_fit** - How well does genre work?

Dimensions are weighted differently per format (see `FORMAT_DIMENSION_WEIGHTS` in shared types).

### Output Structure

```typescript
interface FormatAnalysis {
  format: 'film' | 'tv_series' | 'animation' | 'microdrama' | 'audio_drama';
  overall_score: number;  // 0-100
  fit_level: 'excellent' | 'good' | 'moderate' | 'poor';
  summary: string;
  dimensions: DimensionScore[];
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  format_specific?: MicrodramaSpecificInsights;  // Only for microdrama
}
```

### Microdrama-Specific Insights

Microdrama format includes additional analysis:

```typescript
interface MicrodramaSpecificInsights {
  cliffhanger_potential: number;      // 0-100
  trope_alignment: string[];          // e.g., ['secret_billionaire', 'revenge']
  episode_structure_fit: number;      // 0-100
  vertical_filming_compatibility: number;  // 0-100
  target_platform_fit: string[];      // e.g., ['ReelShort', 'DramaBox']
}
```

---

## Display Components

### FormatFitCard Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| **compact** | Best format badge | Title cards |
| **mini** | Icon + score only | Compact lists |
| **bars** | All 5 formats as mini bars | Overview displays |

### Fit Level Thresholds

| Score | Fit Level | Color |
|-------|-----------|-------|
| 80-100 | Excellent | Green |
| 60-79 | Good | Blue |
| 40-59 | Moderate | Yellow |
| 0-39 | Poor | Red |

---

## Related Tables

| Table | Relationship |
|-------|--------------|
| `titles` | Parent table (linked via `title_id` FK) |
| `title_content_analysis` | Used as input data for richer analysis |
| `title_documents` | Checked for pitch deck bonus |

---

## Cost & Performance

| Metric | Value |
|--------|-------|
| Processing time | 15-20 seconds |
| Estimated cost | ~$0.003 per analysis |
| Model used | GPT-4o |
| API calls | 2 (deconstruction + format scoring) |

---

## Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/functions/format-fit-engine/index.ts` | Full | Edge function |
| `supabase/functions/_shared/format-fit-types.ts` | Full | Shared types & constants |
| `apps/dashboard/src/services/formatFitService.ts` | 336-364 | `getTitlesForFormat()` |
| `apps/dashboard/src/pages/buyers/Titles.tsx` | 46-65, 96-106 | Format filtering logic |
| `supabase/migrations/20251211100000_add_format_fit_table.sql` | Full | Database schema |
