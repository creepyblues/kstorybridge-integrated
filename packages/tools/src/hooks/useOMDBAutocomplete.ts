/**
 * useOMDBAutocomplete Hook
 *
 * Shared hook for OMDB movie/TV show autocomplete functionality.
 *
 * Features:
 * - Debounced search (300ms)
 * - AbortController for request cancellation
 * - Deduplication of results by imdbID
 * - Outside click detection
 * - Escape key handling
 * - Keyboard navigation (arrow keys)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { OMDBSearchResult } from '../types';
import { searchOMDBTitles } from '../services/omdbService';

// Constants
const AUTOCOMPLETE_DEBOUNCE_MS = 300;
const DEFAULT_MAX_RESULTS = 5;

export interface UseOMDBAutocompleteOptions {
  /** OMDB API key */
  apiKey?: string;
  /** Maximum number of suggestions to show (default: 5) */
  maxResults?: number;
  /** Whether autocomplete is enabled (default: true) */
  enabled?: boolean;
  /** Minimum characters to trigger search (default: 2) */
  minChars?: number;
}

export interface UseOMDBAutocompleteReturn {
  /** Current search suggestions */
  suggestions: OMDBSearchResult[];
  /** Whether suggestions are loading */
  isLoading: boolean;
  /** Whether dropdown should be shown */
  showDropdown: boolean;
  /** Set dropdown visibility */
  setShowDropdown: (show: boolean) => void;
  /** Ref to attach to dropdown container for outside click detection */
  dropdownRef: React.RefObject<HTMLDivElement>;
  /** Currently focused suggestion index for keyboard navigation */
  focusedIndex: number;
  /** Set focused index */
  setFocusedIndex: (index: number) => void;
  /** Handle keyboard events (attach to input) */
  handleKeyDown: (e: React.KeyboardEvent, onSelect: (result: OMDBSearchResult) => void) => void;
  /** Clear suggestions and reset state */
  clearSuggestions: () => void;
}

export function useOMDBAutocomplete(
  query: string,
  options: UseOMDBAutocompleteOptions = {}
): UseOMDBAutocompleteReturn {
  const {
    apiKey,
    maxResults = DEFAULT_MAX_RESULTS,
    enabled = true,
    minChars = 2,
  } = options;

  const [suggestions, setSuggestions] = useState<OMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear suggestions helper
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowDropdown(false);
    setFocusedIndex(-1);
  }, []);

  // Debounced search effect with AbortController
  useEffect(() => {
    if (!enabled || !apiKey) {
      clearSuggestions();
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < minChars) {
      clearSuggestions();
      return;
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const currentController = abortControllerRef.current;

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const results = await searchOMDBTitles(trimmed, apiKey);

        // Check if this request was aborted
        if (currentController.signal.aborted) {
          return;
        }

        // Deduplicate by imdbID using Set for O(n) performance
        const seen = new Set<string>();
        const uniqueResults = results.filter(result => {
          if (seen.has(result.imdbID)) return false;
          seen.add(result.imdbID);
          return true;
        });

        setSuggestions(uniqueResults.slice(0, maxResults));
        setShowDropdown(uniqueResults.length > 0);
        setFocusedIndex(-1);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('[useOMDBAutocomplete] Search error:', error);
        clearSuggestions();
      } finally {
        if (!currentController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      currentController.abort();
    };
  }, [query, enabled, apiKey, maxResults, minChars, clearSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, onSelect: (result: OMDBSearchResult) => void) => {
      if (!showDropdown || suggestions.length === 0) {
        if (e.key === 'Enter') {
          // Let parent handle Enter when no dropdown
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
            onSelect(suggestions[focusedIndex]);
          } else if (suggestions.length > 0) {
            // Select first result if none focused
            onSelect(suggestions[0]);
          }
          break;
        case 'Tab':
          // Close dropdown on Tab
          setShowDropdown(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [showDropdown, suggestions, focusedIndex]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    clearSuggestions,
  };
}
