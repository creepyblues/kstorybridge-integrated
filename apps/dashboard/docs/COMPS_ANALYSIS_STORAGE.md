# Comps Analysis Storage Implementation

**Created**: 2025-12-10
**Status**: Implementation in Progress

## Overview

This document describes the implementation for storing full AI-generated comps analysis (match scores, dimension breakdowns, explanations) in the database and displaying it in both buyer and admin views.

## Requirements

- **Storage**: JSONB column `comps_analysis` on `titles` table
- **Buyer view**: Full details (match scores, dimension breakdown, explanations)
- **Admin view**: Full details in TitleEditModal
- **Metadata**: Just the results array, no who/when tracking

## Data Structure

### Stored in `titles.comps_analysis` (JSONB)

```typescript
// Array of SuggestedComp objects
interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;  // "TV Series" | "Film" | "Anime"
  overall_match_score: number;  // 0-100
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];
}

interface DimensionScore {
  dimension: string;  // e.g., "genre_blueprint", "tone_mood"
  score: number;  // 0-100
  reason: string;
}
```

### 8 Dimensions Scored

| Dimension | Weight | Description |
|-----------|--------|-------------|
| genre_blueprint | 20% | Save the Cat genre taxonomy |
| tone_mood | 15% | Emotional register & atmosphere |
| character_archetypes | 15% | Hero type, antagonist pattern |
| plot_structure | 15% | Narrative arc & pacing |
| setting_world | 10% | Time, place, worldbuilding |
| themes | 10% | Core messages |
| target_audience | 10% | Demographics |
| format_style | 5% | Narrative style |

## Implementation

### Database Migration

```sql
-- /supabase/migrations/YYYYMMDD_add_comps_analysis_column.sql
ALTER TABLE titles ADD COLUMN IF NOT EXISTS comps_analysis JSONB;
```

### Service Layer

`saveCompsWithAnalysis()` function in `compsGeneratorService.ts`:
- Filters `allComps` to only include selected ones
- Saves both `comps` (string[]) and `comps_analysis` (JSONB)

### Display Components

1. **CompsAnalysisCard** (`/src/components/title-detail/CompsAnalysisCard.tsx`)
   - Reusable component for both buyer and admin views
   - Match score badges with color coding
   - Collapsible dimension breakdown

2. **OverviewTab** - Buyer title detail page
   - Shows `CompsAnalysisCard` if analysis exists
   - Falls back to simple badges for old titles

3. **TitleEditModal** - Admin view
   - Shows saved analysis after comps input field

## Files Modified

| File | Change |
|------|--------|
| `/supabase/migrations/YYYYMMDD_add_comps_analysis_column.sql` | New migration |
| `/apps/dashboard/src/services/compsGeneratorService.ts` | Add `saveCompsWithAnalysis()` |
| `/apps/dashboard/src/components/title-detail/CompsAnalysisCard.tsx` | New component |
| `/apps/dashboard/src/components/title-detail/index.ts` | Export new component |
| `/apps/dashboard/src/components/admin/CompsGeneratorModal.tsx` | Update save logic |
| `/apps/dashboard/src/components/title-detail/OverviewTab.tsx` | Display analysis |
| `/apps/dashboard/src/components/admin/TitleEditModal.tsx` | Display saved analysis |

## Score Color Coding

| Score | Color | Label |
|-------|-------|-------|
| ≥ 85 | Green | Excellent Match |
| ≥ 70 | Blue | Strong Match |
| ≥ 55 | Yellow | Moderate Match |
| < 55 | Gray | Weak Match |

## Backward Compatibility

Titles with only `comps[]` (no analysis) continue to display as simple badges. The new display is only shown when `comps_analysis` is populated.
