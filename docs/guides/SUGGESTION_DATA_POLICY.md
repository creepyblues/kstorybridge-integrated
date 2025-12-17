# Suggestion Data Policy

**Last Updated**: 2025-12-17
**Status**: Active Policy
**Applies To**: Dashboard App (`apps/dashboard/`)

---

## Overview

This document establishes the policy for managing suggestion data across the KStoryBridge dashboard application. All suggestion examples (comps, mandates, chatbot queries) must be sourced from a single canonical file to ensure consistency, maintainability, and data quality.

---

## Single Source of Truth

### The Canonical File

**File**: `apps/dashboard/src/data/examplesData.ts`

This file is the **ONLY** authorized source for all suggestion data in the dashboard. It contains:

| Data Type | Export | Description |
|-----------|--------|-------------|
| Comp Examples | `COMP_EXAMPLES` | 36 curated comp title combinations |
| Mandate Examples | `MANDATE_EXAMPLES` | 24 curated mandate descriptions |
| Chatbot Queries | `CHATBOT_QUERIES` | Genre, tone, feature, and discovery prompts |
| Hero Samples | `HERO_SAMPLES` | Homepage quick-start samples |

### Utility Functions

The file provides helper functions for common operations:

```typescript
// Comps
getExamplesByCategory(category)    // Filter by genre/tone/theme/etc.
getRandomExamples(count)           // Random selection
searchExamples(query)              // Keyword search
getRandomCompSuggestions(count)    // Random "Show A + Show B" suggestions

// Mandates
getMandatesByCategory(category)    // Filter by streaming/broadcast/film/etc.
getRandomMandates(count)           // Random selection

// Chatbot
getAllChatbotQueries()             // All queries as flat array
getRandomChatbotQueries(count)     // Random selection
getChatbotQueriesByCategory(cat)   // By genre/tone/feature/discovery

// Shows (individual titles)
getRandomShowSuggestions(count)    // Random show names (e.g., "The Bear", "Squid Game")

// Hero
getRandomShowCompSample()          // Random comp for homepage
getRandomMandateSample()           // Random mandate for homepage
```

---

## Policy Requirements

### DO: Required Practices

1. **Import from examplesData.ts** for any suggestion display
2. **Use utility functions** rather than filtering manually
3. **Update the canonical file** when adding/modifying examples
4. **Document changes** with date in the file header
5. **Test with build** (`npm run build`) after changes

### DON'T: Prohibited Practices

1. **NEVER hardcode** suggestion arrays in components
2. **NEVER duplicate** data from examplesData.ts
3. **NEVER create** separate example files per component
4. **NEVER inline** example strings in JSX/TSX

---

## Component Compliance

### Compliant Components

| Component | Import | Status |
|-----------|--------|--------|
| `ExamplesSection.tsx` | `COMP_EXAMPLES`, `EXAMPLE_CATEGORIES`, `getExamplesByCategory` | ✅ |
| `ExampleCard.tsx` | `CompExample` (type) | ✅ |
| `MandateExamples.tsx` | `MANDATE_CATEGORIES`, `getMandatesByCategory` | ✅ |
| `MandateSearchInput.tsx` | `getRandomMandates` | ✅ |
| `HeroSection.tsx` | `HERO_SAMPLES` | ✅ |
| `TrialChatSection.tsx` | `getRandomChatbotQueries` | ✅ |
| `CompsNavigatorInput.tsx` | `getRandomCompSuggestions` | ✅ |
| `ShowCompSearch.tsx` | `getRandomShowSuggestions` | ✅ |
| `chatOrchestratorService.ts` | `getAllChatbotQueries` | ✅ |
| `chatConfig.ts` | `getRandomChatbotQueries` (deprecated) | ✅ |

### Props-Based Components (No Direct Data)

These components receive suggestions as props and don't need direct imports:

- `SuggestedQueries.tsx` - receives `queries: string[]`
- `ChatEmptyState.tsx` - receives `suggestedQueries: string[]`

The parent components are responsible for sourcing data from `examplesData.ts`.

---

## Adding New Examples

### Process

1. Edit `apps/dashboard/src/data/examplesData.ts`
2. Add to the appropriate array (`COMP_EXAMPLES`, `MANDATE_EXAMPLES`, etc.)
3. Follow the existing structure/interface
4. Update the "Last Updated" date in the file header
5. Run `npm run build` to verify no TypeScript errors
6. Update documentation if categories change

### Example: Adding a New Comp Example

```typescript
// In examplesData.ts, add to COMP_EXAMPLES array:
{
  id: 'genre-9',  // Increment ID within category
  category: 'genre',
  title: 'Murder Mystery Romance',
  comps: ['Knives Out', 'The Proposal'],
  description: 'Whodunit mystery with romantic subplot',
  breakdown: [
    'Knives Out: Ensemble murder mystery',
    'The Proposal: Romantic comedy elements'
  ],
  refinementTips: ['cozy mystery', 'amateur detective', 'small town'],
  icon: '🎭'
}
```

### Example: Adding a New Mandate Example

```typescript
// In examplesData.ts, add to MANDATE_EXAMPLES array:
{
  id: 'streaming-6',
  category: 'Streaming',
  title: 'Cozy Mystery Series',
  mandateText: 'Looking for cozy mystery with amateur detective, small-town setting, light tone with romantic subplot. For streaming limited series.',
  breakdown: [
    'Genre: Cozy mystery',
    'Protagonist: Amateur detective',
    'Setting: Small town',
    'Tone: Light/cozy',
    'Format: Limited series'
  ]
}
```

---

## Rationale

### Why Single Source of Truth?

1. **Consistency**: All users see the same curated examples
2. **Maintainability**: One place to update, test, and review
3. **Quality Control**: Easier to audit and improve examples
4. **Performance**: No duplicate data in bundle
5. **Documentation**: Easy to reference and understand

### Why This File?

- Central location in `src/data/` directory
- TypeScript interfaces for type safety
- Organized by use case category
- Utility functions for common operations
- Well-documented with JSDoc comments

---

## Enforcement

### Code Review Checklist

When reviewing PRs that touch suggestion-related components:

- [ ] No hardcoded suggestion arrays in component files
- [ ] Imports from `@/data/examplesData`
- [ ] Uses appropriate utility functions
- [ ] Changes to examples are made in examplesData.ts only
- [ ] File header date updated if examples changed

### Lint Rules (Future)

Consider adding ESLint rules to detect:
- Direct string arrays matching known patterns
- Imports of suggestion-like data from non-canonical sources

---

## Related Documentation

- **[COMPS_NAVIGATOR_SAMPLES.md](../features/COMPS_NAVIGATOR_SAMPLES.md)** - Full documentation of 37 comp combinations and 35 mandate samples
- **[Dashboard CLAUDE.md](../../apps/dashboard/CLAUDE.md)** - Dashboard app documentation
- **[INDEX.md](../INDEX.md)** - Documentation index

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-17 | Initial policy document created |
| 2025-12-17 | Consolidated all suggestion data into examplesData.ts |
| 2025-12-17 | Updated MandateExamples, HeroSection, chatOrchestratorService |
| 2025-12-17 | Added MandateSearchInput, TrialChatSection, CompsNavigatorInput, ShowCompSearch compliance |
| 2025-12-17 | Added getRandomCompSuggestions, getRandomShowSuggestions helper functions |
| 2025-12-17 | Deprecated DEFAULT_SUGGESTED_QUERIES in chatConfig.ts |
