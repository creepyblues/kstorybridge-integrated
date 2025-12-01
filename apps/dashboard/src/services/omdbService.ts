/**
 * OMDB Service
 *
 * Handles title search and verification using the OMDB API (Open Movie Database).
 * Returns IMDB-verified movie and TV show data for autocomplete suggestions.
 *
 * API Documentation: https://www.omdbapi.com/
 * Free tier: 1,000 requests/day
 */

export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

interface OMDBSearchResponse {
  Search?: OMDBSearchResult[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export const omdbService = {
  /**
   * Search for movies and TV shows by title
   * @param query - Search query (minimum 2 characters recommended)
   * @returns Array of matching titles with IMDB metadata
   */
  async searchTitles(query: string): Promise<OMDBSearchResult[]> {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;

    if (!apiKey) {
      console.warn('[OMDB] API key not configured - falling back to manual entry');
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
  },

  /**
   * Get IMDB URL for a title
   * @param imdbID - IMDB ID (e.g., "tt0903747")
   * @returns Full IMDB URL
   */
  getIMDBUrl(imdbID: string): string {
    return `https://www.imdb.com/title/${imdbID}`;
  }
};
