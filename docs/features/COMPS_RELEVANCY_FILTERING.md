# Comps Navigator - Relevancy Filtering Policy

**Version**: 2.1.0
**Last Updated**: 2025-12-12
**Status**: Live

## Overview

The Comps Navigator implements a hybrid relevancy filtering system to hide irrelevant search results and provide helpful suggestions when no matches are found.

## Filtering Logic

### Hybrid Model (OR Logic)

A title is shown if **ANY** of these conditions are met:

1. **Overall Score Threshold**: `overall_match_score >= 55`
   - 55 is the "FAIR" threshold in our scoring system
   - Titles meeting this threshold have moderate overall alignment

2. **Exceptional Dimension Exception**: `overall_match_score >= 40` AND any `dimension_score >= 80`
   - Catches edge cases where a title excels in one dimension
   - Example: A title with 85 in "genre_blueprint" but 45 overall is still valuable for genre-specific searches
   - The 40 minimum prevents truly irrelevant results from sneaking through

### Constants

```typescript
const MIN_OVERALL_SCORE = 55                    // Minimum overall score to show
const MIN_OVERALL_FOR_DIMENSION_EXCEPTION = 40  // Minimum overall when exceptional dimension exists
const EXCEPTIONAL_DIMENSION_SCORE = 80          // Score that qualifies as "exceptional" in one dimension
```

### Rationale

- **55 threshold**: Aligns with existing `SCORE_THRESHOLDS.FAIR` in `scoreStyles.ts`
- **80 exceptional**: Represents truly strong alignment in a single dimension
- **40 minimum floor**: Prevents low-quality matches from appearing even with one good dimension

## Implementation Location

**Server-side (Edge Function)** - Implemented in `supabase/functions/comp-navigator/index.ts`

Benefits of server-side filtering:
- Cleaner API responses
- Search history reflects actual shown results
- "No results" message generated with context
- Consistent behavior across all clients

## API Response Structure

```typescript
interface CompNavigatorResponse {
  results: TitleMatchV2[];
  search_id?: string;
  processing_time_ms: number;
  cost_estimate: number;
  engine_version: string;
  mode_used: 'fast' | 'deep';
  // v2.1.0 - Relevancy filtering fields
  filtered_count?: number;          // How many results were filtered out
  no_results_message?: string;      // Message when no relevant results found
  suggestions?: string[];           // Suggestions when no results
}
```

## No Results Handling

When all results are filtered out (`results.length === 0`), the response includes:

```typescript
{
  results: [],
  filtered_count: originalCount,
  no_results_message: "Unfortunately, we don't have any titles comparable to {comp titles}",
  suggestions: [
    "Try broader genre titles like 'Squid Game' or 'Parasite'",
    "Search for specific genres: thriller, romance, action",
    "Use fewer comp titles for wider matches"
  ]
}
```

## UI Display

When no results are found, the UI displays:
1. A compass icon (visual indicator)
2. The `no_results_message` explaining no matches were found
3. Bulleted list of suggestions
4. "View Example Combinations" button to help users

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/comp-navigator/index.ts` | Added filtering function, constants, Phase 3 processing |
| `supabase/functions/_shared/comps-types.ts` | Added response fields to `CompNavigatorResponse` |
| `apps/dashboard/src/services/compsNavigatorService.ts` | Updated `CompNavigatorResponse` interface |
| `apps/dashboard/src/pages/buyers/CompsNavigator.tsx` | Added empty state UI handling |

## Testing Scenarios

| Input Comps | Expected Behavior |
|-------------|-------------------|
| "Squid Game" | Should return results (popular comp, well-indexed) |
| "Very Obscure 1985 Film" | May return no results with suggestions |
| "Breaking Bad" | Should return results (common comp reference) |
| Mixed high/low dimension scores | Should filter based on hybrid logic |

## Logging

The edge function logs filtering metrics:

```
[COMPS] Phase 3: Applying relevancy filtering
[COMPS] ✅ Relevancy filtering complete {
  pre_filter_count: 5,
  post_filter_count: 3,
  filtered_out: 2,
  threshold_overall: 55,
  threshold_dimension: 80
}
```

## Future Considerations

- Threshold values (55, 40, 80) can be tuned based on user feedback
- Consider adding analytics to track filter rates
- Future: Could make thresholds configurable via admin panel
- Consider A/B testing different threshold values

## Related Documentation

- [COMPS_MATCHING_ENGINE.md](./COMPS_MATCHING_ENGINE.md) - Full comps engine documentation
- [scoreStyles.ts](../../apps/dashboard/src/utils/scoreStyles.ts) - Score threshold constants
- [compsNavigatorService.ts](../../apps/dashboard/src/services/compsNavigatorService.ts) - Client service layer
