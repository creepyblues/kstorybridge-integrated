import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOMDBAutocomplete } from './useOMDBAutocomplete';

// Note: These tests focus on synchronous behavior and state management
// Async behavior (debouncing, API calls) is tested through integration tests

describe('useOMDBAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty suggestions', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.showDropdown).toBe(false);
      expect(result.current.focusedIndex).toBe(-1);
    });

    it('should provide setShowDropdown function', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(typeof result.current.setShowDropdown).toBe('function');
    });

    it('should provide clearSuggestions function', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(typeof result.current.clearSuggestions).toBe('function');
    });

    it('should provide handleKeyDown function', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(typeof result.current.handleKeyDown).toBe('function');
    });

    it('should provide dropdownRef', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(result.current.dropdownRef).toBeDefined();
      expect(result.current.dropdownRef.current).toBe(null);
    });
  });

  describe('options', () => {
    it('should accept maxResults option', () => {
      const { result } = renderHook(() => useOMDBAutocomplete('test', { maxResults: 5 }));

      // Hook should initialize without errors
      expect(result.current.suggestions).toEqual([]);
    });

    it('should accept minChars option', () => {
      const { result } = renderHook(() => useOMDBAutocomplete('test', { minChars: 3 }));

      // Hook should initialize without errors
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('setShowDropdown', () => {
    it('should update showDropdown state', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      expect(result.current.showDropdown).toBe(false);

      act(() => {
        result.current.setShowDropdown(true);
      });

      expect(result.current.showDropdown).toBe(true);

      act(() => {
        result.current.setShowDropdown(false);
      });

      expect(result.current.showDropdown).toBe(false);
    });
  });

  describe('clearSuggestions', () => {
    it('should clear suggestions and close dropdown', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      // First open dropdown
      act(() => {
        result.current.setShowDropdown(true);
      });

      expect(result.current.showDropdown).toBe(true);

      // Clear suggestions
      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.showDropdown).toBe(false);
    });
  });

  describe('Escape key handling', () => {
    it('should close dropdown on Escape key via document listener', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      act(() => {
        result.current.setShowDropdown(true);
      });

      expect(result.current.showDropdown).toBe(true);

      // Escape key is handled via document event listener, not handleKeyDown
      act(() => {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
      });

      expect(result.current.showDropdown).toBe(false);
    });

    it('handleKeyDown should not close dropdown on Escape when no suggestions (handled by document listener)', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      act(() => {
        result.current.setShowDropdown(true);
      });

      const mockEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const onSelect = vi.fn();

      // handleKeyDown returns early when no suggestions
      act(() => {
        result.current.handleKeyDown(mockEvent, onSelect);
      });

      // showDropdown is still true because handleKeyDown exits early
      // The actual Escape handling is done via document event listener
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('handleKeyDown - navigation without suggestions', () => {
    it('should not crash when pressing ArrowDown with no suggestions', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      const mockEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const onSelect = vi.fn();

      // Should not throw
      act(() => {
        result.current.handleKeyDown(mockEvent, onSelect);
      });

      expect(result.current.focusedIndex).toBe(-1);
    });

    it('should not crash when pressing Enter with no focused item', () => {
      const { result } = renderHook(() => useOMDBAutocomplete(''));

      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const onSelect = vi.fn();

      // Should not throw
      act(() => {
        result.current.handleKeyDown(mockEvent, onSelect);
      });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('return type structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useOMDBAutocomplete('test'));

      expect(result.current).toHaveProperty('suggestions');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('showDropdown');
      expect(result.current).toHaveProperty('setShowDropdown');
      expect(result.current).toHaveProperty('dropdownRef');
      expect(result.current).toHaveProperty('focusedIndex');
      expect(result.current).toHaveProperty('setFocusedIndex');
      expect(result.current).toHaveProperty('handleKeyDown');
      expect(result.current).toHaveProperty('clearSuggestions');
    });

    it('should have correct types for all properties', () => {
      const { result } = renderHook(() => useOMDBAutocomplete('test'));

      expect(Array.isArray(result.current.suggestions)).toBe(true);
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.showDropdown).toBe('boolean');
      expect(typeof result.current.setShowDropdown).toBe('function');
      expect(typeof result.current.focusedIndex).toBe('number');
      expect(typeof result.current.setFocusedIndex).toBe('function');
      expect(typeof result.current.handleKeyDown).toBe('function');
      expect(typeof result.current.clearSuggestions).toBe('function');
    });
  });
});
