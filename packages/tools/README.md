# @kstorybridge/tools

Shared AI tools and services for KStoryBridge apps (Dashboard and Creator).

## Features

- **Comps Generator** - AI-powered Hollywood comparable title generation
- **Format Fit Analyzer** - Content format suitability analysis
- **OMDB Service** - IMDB title search via OMDB API
- **OMDB Autocomplete Hook** - React hook for IMDB title autocomplete

## Installation

This package is part of the KStoryBridge monorepo. It's automatically available to apps via workspace references.

```json
{
  "dependencies": {
    "@kstorybridge/tools": "workspace:*"
  }
}
```

## Usage

### Comps Generator Service

```typescript
import { compsGeneratorService, type SuggestedComp } from '@kstorybridge/tools';

// Generate comps for a title
const response = await compsGeneratorService.generateComps(titleId, userEmail, 'auto');

// Save selected comps
await compsGeneratorService.saveCompsWithAnalysis(titleId, selectedTitles, allComps);

// Format dimension names for display
const formatted = compsGeneratorService.formatDimensionName('narrative_structure');
// Returns: "Narrative Structure"
```

### OMDB Service (Manual Comp Search)

```typescript
import {
  searchOMDBTitles,
  getIMDBUrl,
  createManualComp,
  type OMDBSearchResult,
} from '@kstorybridge/tools';

// Search OMDB for titles
const results = await searchOMDBTitles('Squid Game', apiKey);

// Get IMDB URL for a title
const url = getIMDBUrl('tt10919420'); // https://www.imdb.com/title/tt10919420

// Convert OMDB result to SuggestedComp format
const comp = createManualComp(result);
// Returns SuggestedComp with source: 'manual'
```

### OMDB Autocomplete Hook

```typescript
import { useOMDBAutocomplete, type OMDBSearchResult } from '@kstorybridge/tools';

function ManualCompSearch({ onAdd }) {
  const [query, setQuery] = useState('');
  const apiKey = import.meta.env.VITE_OMDB_API_KEY;

  const {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    focusedIndex,
    handleKeyDown,
    clearSuggestions,
  } = useOMDBAutocomplete(query, {
    apiKey,
    maxResults: 6,
    enabled: !!apiKey,
  });

  const handleSelect = (result: OMDBSearchResult) => {
    const comp = createManualComp(result);
    onAdd(comp);
    setQuery('');
    clearSuggestions();
  };

  return (
    <div ref={dropdownRef}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, handleSelect)}
      />
      {showDropdown && suggestions.map((result) => (
        <button key={result.imdbID} onClick={() => handleSelect(result)}>
          {result.Title} ({result.Year})
        </button>
      ))}
    </div>
  );
}
```

## Types

### SuggestedComp

```typescript
interface SuggestedComp {
  comp_title: string;
  comp_year?: number;
  comp_type: string;
  overall_match_score: number;
  dimension_scores: DimensionScore[];
  explanation: string;
  match_reasons: string[];
  imdb_id?: string;
  imdb_url?: string;
  poster_url?: string;
  source?: 'ai' | 'manual';  // Track origin of comp
}
```

### OMDBSearchResult

```typescript
interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}
```

### UseOMDBAutocompleteOptions

```typescript
interface UseOMDBAutocompleteOptions {
  apiKey?: string;        // OMDB API key (required)
  maxResults?: number;    // Max suggestions (default: 5)
  enabled?: boolean;      // Enable/disable (default: true)
  minChars?: number;      // Min chars to trigger (default: 2)
}
```

## Environment Variables

Apps using OMDB features need:

```bash
VITE_OMDB_API_KEY=your_omdb_api_key
```

Get an API key at: https://www.omdbapi.com/apikey.aspx

## Hook Features

The `useOMDBAutocomplete` hook provides:

- **Debounced search** (300ms) - Prevents excessive API calls
- **AbortController** - Cancels pending requests on new input
- **Deduplication** - Removes duplicate results by imdbID
- **Keyboard navigation** - Arrow keys, Enter, Escape support
- **Outside click detection** - Closes dropdown when clicking outside
- **Loading state** - Track when search is in progress

## Directory Structure

```
packages/tools/
├── src/
│   ├── index.ts              # Main exports
│   ├── types/
│   │   └── index.ts          # Type definitions (SuggestedComp, OMDB types)
│   ├── services/
│   │   ├── index.ts          # Service exports
│   │   ├── compsGeneratorService.ts
│   │   ├── formatFitService.ts
│   │   └── omdbService.ts    # OMDB API service
│   └── hooks/
│       ├── index.ts          # Hook exports
│       └── useOMDBAutocomplete.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Related Documentation

- [Dashboard CLAUDE.md](../../apps/dashboard/CLAUDE.md) - Dashboard app documentation
- [Creator CLAUDE.md](../../apps/creator/CLAUDE.md) - Creator app documentation
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo documentation
