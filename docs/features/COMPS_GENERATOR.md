# Comps Generator Engine

**Created**: 2025-12-10
**Status**: Implementation in Progress
**Location**: `supabase/functions/comps-generator/`

## Overview

The Comps Generator is an AI-powered engine that analyzes Korean titles in the database and suggests Hollywood/global comparable titles (comps) with detailed explanations of why each comp is relevant.

## Key Features

1. **Two Operating Modes**:
   - **Rich Mode**: Full 8-dimension analysis for titles with pitch deck, questionnaire data, content analysis
   - **Limited Mode**: 4-dimension analysis for titles with minimal data

2. **8-Dimension Story Deconstruction**:
   | Dimension | Weight | Description |
   |-----------|--------|-------------|
   | Genre Blueprint | 20% | Save the Cat genre taxonomy |
   | Tone & Mood | 15% | Emotional register |
   | Character Archetypes | 15% | Hero type, antagonist pattern |
   | Plot Structure | 15% | Narrative arc type |
   | Setting & World | 10% | Time, place, worldbuilding |
   | Themes | 10% | Core messages |
   | Target Audience | 10% | Demographics |
   | Format Style | 5% | Pacing, structure |

3. **Explicit Match Explanations**: Each suggested comp includes per-dimension scores and reasons

## Architecture

### Edge Function

**Location**: `supabase/functions/comps-generator/index.ts`

**Request**:
```typescript
interface CompsGeneratorRequest {
  title_id: string;
  mode?: 'rich' | 'limited' | 'auto';  // Default: auto
  user_email: string;
}
```

**Response**:
```typescript
interface CompsGeneratorResponse {
  title_id: string;
  title_name: string;
  mode_used: 'rich' | 'limited';
  data_completeness: number;  // 0-100
  suggested_comps: SuggestedComp[];
  analysis_summary: string;
  processing_time_ms: number;
  cost_estimate: number;
}

interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;  // "TV Series" | "Film" | "Anime"
  overall_match_score: number;  // 0-100
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];
}
```

### Service Layer

**Location**: `apps/dashboard/src/services/compsGeneratorService.ts`

```typescript
// Generate comps for a title
generateComps(titleId: string, userEmail: string): Promise<CompsGeneratorResponse>

// Save selected comps to title
saveCompsToTitle(titleId: string, comps: string[]): Promise<void>
```

### Frontend Component

**Location**: `apps/dashboard/src/components/admin/CompsGeneratorModal.tsx`

- Displays loading state with progress
- Shows each suggested comp as a card with:
  - Match score badge (color-coded)
  - Expandable dimension breakdown
  - Detailed explanation
- Checkbox selection for saving
- Integrates with TitleEditModal

## Processing Pipeline

```
1. DATA COLLECTION
   ├── Fetch title from `titles` table
   ├── Fetch `title_content_analysis`
   └── Check for pitch deck in `title_documents`

2. DATA COMPLETENESS SCORING
   └── Calculate score → Determine mode (rich/limited)

3. STORY DECONSTRUCTION (GPT-4)
   └── Analyze title across 8 dimensions

4. COMP GENERATION (GPT-4)
   ├── Generate 8 candidate comps
   ├── Score each on all dimensions
   └── Return top 5 ranked comps
```

## Data Completeness Scoring

| Field | Points |
|-------|--------|
| synopsis (>50 chars) | 10 |
| genre (array) | 10 |
| tone | 10 |
| character_details (JSONB) | 15 |
| story_structure | 10 |
| plot_elements (analysis) | 10 |
| semantic_tags (analysis) | 10 |
| pitch_analysis (analysis) | 15 |
| setting_description | 5 |
| important_issues | 5 |
| pitch deck document | 10 |

**Mode Selection**:
- Score ≥ 50 → Rich Mode
- Score < 50 → Limited Mode

## Save the Cat Genre Taxonomy

The 10 genres used for classification:

1. **Monster in the House** - A threat in a confined space
2. **Golden Fleece** - A quest or journey
3. **Out of the Bottle** - Magic or wish fulfillment
4. **Dude with a Problem** - Ordinary person, extraordinary situation
5. **Rites of Passage** - Life transition or coming-of-age
6. **Buddy Love** - Relationship between two people
7. **Whydunit** - Mystery or detective story
8. **Fool Triumphant** - Underdog success story
9. **Institutionalized** - Group dynamics within a system
10. **Superhero** - Special powers against evil

## Cost Estimation

| Operation | Cost |
|-----------|------|
| Story deconstruction (GPT-4o) | ~$0.03 |
| Comp generation (GPT-4o) | ~$0.05 |
| **Total per generation** | **~$0.08** |

## Usage

### Admin Dashboard

1. Navigate to Admin → Titles
2. Click on a title to open TitleEditModal
3. Click "Generate Comps" button in header
4. Review suggested comps with explanations
5. Select comps to save → Updates `titles.comps` array

### Programmatic (Service)

```typescript
import { compsGeneratorService } from '@/services/compsGeneratorService';

// Generate comps
const result = await compsGeneratorService.generateComps(titleId, userEmail);

// Save selected comps
await compsGeneratorService.saveCompsToTitle(titleId, ['Squid Game', 'Parasite']);
```

## Cross-App Usage

The service is designed to be reusable across:
- **Dashboard Admin**: Primary use case
- **Buyer Dashboard**: Future integration for title pages
- **Creator App**: Help creators understand their comp positioning

## Research References

- [Save the Cat Beat Sheet](https://savethecat.com/beat-sheets) - Genre taxonomy
- [9 Tips for Choosing Comps](https://www.nofilmschoolnotrustfundnoproblem.com/blog/9-tips-on-choosing-comps-for-your-pitch-deck) - Best practices
- [Studio Binder Story Structure](https://www.studiobinder.com/blog/save-the-cat-beat-sheet/) - Beat sheet methodology

## Files

| File | Purpose |
|------|---------|
| `supabase/functions/comps-generator/index.ts` | Edge function |
| `apps/dashboard/src/services/compsGeneratorService.ts` | Service layer |
| `apps/dashboard/src/components/admin/CompsGeneratorModal.tsx` | UI component |
| `apps/dashboard/src/components/admin/TitleEditModal.tsx` | Integration point |

## Future Enhancements

1. **Batch generation** - Process multiple titles at once
2. **OMDB/TMDB validation** - Verify comp titles exist
3. **Admin feedback learning** - Track which comps get saved vs rejected
4. **Regional comps** - Asian cinema comps for specific markets
5. **Comp confidence scoring** - Higher confidence for well-known matches
