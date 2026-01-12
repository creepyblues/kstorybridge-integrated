/**
 * OMDB Service
 *
 * Shared service for title search and verification using the OMDB API.
 * Returns IMDB-verified movie and TV show data for autocomplete suggestions.
 *
 * API Documentation: https://www.omdbapi.com/
 * Free tier: 1,000 requests/day
 */

import type { OMDBSearchResult, OMDBSearchResponse, SuggestedComp } from '../types';

/**
 * Search for movies and TV shows by title
 * @param query - Search query (minimum 2 characters recommended)
 * @param apiKey - OMDB API key (optional, falls back gracefully if not provided)
 * @returns Array of matching titles with IMDB metadata
 */
export async function searchOMDBTitles(
  query: string,
  apiKey?: string
): Promise<OMDBSearchResult[]> {
  if (!apiKey) {
    console.warn('[OMDB] API key not provided - falling back to manual entry');
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query.trim())}`
    );

    if (!response.ok) {
      console.error('[OMDB] API request failed:', response.status);
      return [];
    }

    const data: OMDBSearchResponse = await response.json();

    if (data.Response === 'False') {
      // "Movie not found!" is a normal response for no matches
      if (data.Error !== 'Movie not found!') {
        console.warn('[OMDB] API error:', data.Error);
      }
      return [];
    }

    return data.Search || [];
  } catch (error) {
    console.error('[OMDB] Search error:', error);
    return [];
  }
}

/**
 * Get IMDB URL for a title
 * @param imdbID - IMDB ID (e.g., "tt0903747")
 * @returns Full IMDB URL
 */
export function getIMDBUrl(imdbID: string): string {
  return `https://www.imdb.com/title/${imdbID}`;
}

/**
 * Convert OMDB search result to SuggestedComp format for manual additions
 * @param result - OMDB search result
 * @returns SuggestedComp with manual source marker
 */
export function createManualComp(result: OMDBSearchResult): SuggestedComp {
  const compType = result.Type === 'movie' ? 'Film' :
                   result.Type === 'series' ? 'TV Series' :
                   result.Type;

  return {
    comp_title: result.Title,
    comp_year: result.Year ? parseInt(result.Year, 10) || undefined : undefined,
    comp_type: compType,
    overall_match_score: 0, // User-selected, no AI scoring
    dimension_scores: [], // Empty for manual comps
    explanation: 'Manually added by user',
    match_reasons: [], // Empty for manual comps
    imdb_id: result.imdbID,
    imdb_url: getIMDBUrl(result.imdbID),
    poster_url: result.Poster !== 'N/A' ? result.Poster : undefined,
    source: 'manual',
  };
}

/**
 * Factory function to create an OMDB service instance with a bound API key
 * @param apiKey - OMDB API key
 * @returns Service object with bound API key
 */
export function createOMDBService(apiKey?: string) {
  return {
    searchTitles: (query: string) => searchOMDBTitles(query, apiKey),
    getIMDBUrl,
    createManualComp,
  };
}
