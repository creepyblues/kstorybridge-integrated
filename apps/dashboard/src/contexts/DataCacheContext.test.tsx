import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DataCacheProvider, useDataCache } from './DataCacheContext';
import { ReactNode } from 'react';

// Mock debug utility
vi.mock('@/utils/debug', () => ({
  debug: {
    log: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    getStore: () => store,
    setStore: (newStore: { [key: string]: string }) => { store = newStore; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock Blob for size calculation
vi.mock('blob', () => ({
  Blob: vi.fn((parts: string[]) => ({
    size: parts.join('').length,
  })),
}));

// Global Blob mock
global.Blob = vi.fn((parts: string[]) => ({
  size: parts.join('').length,
})) as any;

// Helper wrapper
function wrapper({ children }: { children: ReactNode }) {
  return <DataCacheProvider>{children}</DataCacheProvider>;
}

// Mock data
const mockTitle = {
  title_id: 'title-1',
  title_name_kr: '테스트 제목',
  title_name_en: 'Test Title',
  genre: ['Action'],
  content_format: 'webtoon',
};

const mockFavorite = {
  id: 'fav-1',
  user_id: 'user-1',
  title_id: 'title-1',
  created_at: '2024-01-01T00:00:00Z',
  titles: mockTitle,
};

describe('DataCacheContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDataCache hook', () => {
    it('should throw error when used outside DataCacheProvider', () => {
      expect(() => {
        renderHook(() => useDataCache());
      }).toThrow('useDataCache must be used within a DataCacheProvider');
    });
  });

  describe('initial state', () => {
    it('should initialize with empty cache when localStorage is empty', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.cache.titles).toEqual([]);
      expect(result.current.cache.favorites).toEqual([]);
      expect(result.current.cache.titleDetails).toEqual({});
      expect(result.current.cache.sessionId).toBeNull();
      expect(result.current.cache.sessionStartTime).toBeNull();
    });

    it('should load valid cache from localStorage', () => {
      const now = Date.now();
      const storedCache = {
        titles: [mockTitle],
        favorites: [mockFavorite],
        titleDetails: { 'title-1': mockTitle },
        sessionId: 'session-123',
        sessionStartTime: now - 30 * 60 * 1000, // 30 minutes ago
        lastUpdated: { titles: now - 30 * 60 * 1000 },
        dbConnectivityStatus: { isConnected: true, lastChecked: now },
      };

      localStorageMock.setItem('kstorybridge-session-cache', JSON.stringify(storedCache));

      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.cache.titles).toEqual([mockTitle]);
      expect(result.current.cache.sessionId).toBe('session-123');
    });

    it('should clear expired cache from localStorage', () => {
      const storedCache = {
        titles: [mockTitle],
        sessionId: 'session-123',
        sessionStartTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago (expired)
        lastUpdated: {},
        dbConnectivityStatus: { isConnected: true, lastChecked: 0 },
      };

      localStorageMock.setItem('kstorybridge-session-cache', JSON.stringify(storedCache));

      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.cache.titles).toEqual([]);
      expect(result.current.cache.sessionId).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kstorybridge-session-cache');
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.setItem('kstorybridge-session-cache', 'invalid-json');

      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.cache.titles).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    it('should initialize a new session', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('new-session-123');
      });

      expect(result.current.cache.sessionId).toBe('new-session-123');
      expect(result.current.cache.sessionStartTime).not.toBeNull();
    });

    it('should clear previous data when initializing new session', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      // Set some data
      act(() => {
        result.current.initializeSession('session-1');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.cache.titles).toEqual([mockTitle]);

      // Initialize new session - should clear data
      act(() => {
        result.current.initializeSession('session-2');
      });

      expect(result.current.cache.titles).toEqual([]);
      expect(result.current.cache.sessionId).toBe('session-2');
    });

    it('should report valid session', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
      });

      expect(result.current.isSessionValid()).toBe(true);
    });

    it('should report invalid session when not initialized', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.isSessionValid()).toBe(false);
    });

    it('should report invalid session after expiry', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
      });

      // Advance time past session expiry (1 hour)
      act(() => {
        vi.advanceTimersByTime(61 * 60 * 1000);
      });

      expect(result.current.isSessionValid()).toBe(false);
    });
  });

  describe('cache operations', () => {
    it('should set and get titles', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.getTitles()).toEqual([mockTitle]);
    });

    it('should set and get favorites', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setFavorites([mockFavorite]);
      });

      expect(result.current.getFavorites()).toEqual([mockFavorite]);
    });

    it('should set and get title detail', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitleDetail('title-1', mockTitle as any);
      });

      expect(result.current.getTitleDetail('title-1')).toEqual(mockTitle);
    });

    it('should return null for non-existent title detail', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      expect(result.current.getTitleDetail('non-existent')).toBeNull();
    });

    it('should update lastUpdated timestamp when setting titles', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const before = Date.now();

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.cache.lastUpdated.titles).toBeGreaterThanOrEqual(before);
    });

    it('should update lastUpdated timestamp when setting favorites', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const before = Date.now();

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setFavorites([mockFavorite]);
      });

      expect(result.current.cache.lastUpdated.favorites).toBeGreaterThanOrEqual(before);
    });

    it('should update lastUpdated for specific title detail', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitleDetail('title-1', mockTitle as any);
      });

      expect(result.current.cache.lastUpdated.titleDetails?.['title-1']).toBeDefined();
    });
  });

  describe('freshness checking', () => {
    it('should report data as fresh when recently updated', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.isFresh('titles')).toBe(true);
    });

    it('should report data as not fresh when not updated', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
      });

      expect(result.current.isFresh('titles')).toBe(false);
    });

    it('should report data as not fresh when session invalid', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      // No session initialized
      expect(result.current.isFresh('titles')).toBe(false);
    });

    it('should check freshness for title details', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitleDetail('title-1', mockTitle as any);
      });

      expect(result.current.isFresh('titleDetail:title-1')).toBe(true);
      expect(result.current.isFresh('titleDetail:non-existent')).toBe(false);
    });

    it('should report data as not fresh after session expiry', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      // Advance past session expiry
      act(() => {
        vi.advanceTimersByTime(61 * 60 * 1000);
      });

      expect(result.current.isFresh('titles')).toBe(false);
    });
  });

  describe('cache clearing', () => {
    it('should clear all cache data', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
        result.current.setFavorites([mockFavorite]);
      });

      expect(result.current.cache.titles).toEqual([mockTitle]);

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.cache.titles).toEqual([]);
      expect(result.current.cache.favorites).toEqual([]);
      expect(result.current.cache.sessionId).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kstorybridge-session-cache');
    });
  });

  describe('DB connectivity status', () => {
    it('should initialize with optimistic connectivity status', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const status = result.current.getDbConnectivityStatus();
      expect(status.isConnected).toBe(true);
    });

    it('should set connectivity status', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.setDbConnectivityStatus({ isConnected: false, error: 'Connection failed' });
      });

      const status = result.current.getDbConnectivityStatus();
      expect(status.isConnected).toBe(false);
      expect(status.error).toBe('Connection failed');
      expect(status.lastChecked).toBeGreaterThan(0);
    });

    it('should update lastChecked timestamp when setting status', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const before = Date.now();

      act(() => {
        result.current.setDbConnectivityStatus({ isConnected: true });
      });

      const status = result.current.getDbConnectivityStatus();
      expect(status.lastChecked).toBeGreaterThanOrEqual(before);
    });

    it('should preserve connectivity status when initializing new session', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.setDbConnectivityStatus({ isConnected: false, error: 'Test error' });
        result.current.initializeSession('session-123');
      });

      const status = result.current.getDbConnectivityStatus();
      expect(status.isConnected).toBe(false);
      expect(status.error).toBe('Test error');
    });
  });

  describe('refreshData', () => {
    it('should invalidate titles data', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.isFresh('titles')).toBe(true);

      act(() => {
        result.current.refreshData('titles');
      });

      expect(result.current.isFresh('titles')).toBe(false);
    });

    it('should invalidate favorites data', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setFavorites([mockFavorite]);
      });

      expect(result.current.isFresh('favorites')).toBe(true);

      act(() => {
        result.current.refreshData('favorites');
      });

      expect(result.current.isFresh('favorites')).toBe(false);
    });

    it('should invalidate specific title detail', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitleDetail('title-1', mockTitle as any);
      });

      expect(result.current.isFresh('titleDetail:title-1')).toBe(true);

      act(() => {
        result.current.refreshData('titleDetail:title-1');
      });

      expect(result.current.isFresh('titleDetail:title-1')).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should save to localStorage when cache changes with valid session', () => {
      const { result, rerender } = renderHook(() => useDataCache(), { wrapper });

      // Clear any initial calls
      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.initializeSession('session-123');
      });

      // Trigger rerender to let effect run
      rerender();

      // After session initialization and data change, localStorage should be updated
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should not save to localStorage without valid session', () => {
      const { result, rerender } = renderHook(() => useDataCache(), { wrapper });

      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.setTitles([mockTitle]);
      });

      rerender();

      // setItem should not be called because there's no valid session
      // The saveToStorage function checks for session validity
      const calls = localStorageMock.setItem.mock.calls;
      const cacheKey = 'kstorybridge-session-cache';
      const cacheCalls = calls.filter((call: string[]) => call[0] === cacheKey);

      // No cache saves should happen without session
      expect(cacheCalls.length).toBe(0);
    });
  });

  describe('session expiry auto-clear', () => {
    it('should clear cache when session expires', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      expect(result.current.cache.titles).toEqual([mockTitle]);

      // Advance past session expiry check interval (5 minutes) and expiry (1 hour)
      act(() => {
        vi.advanceTimersByTime(65 * 60 * 1000); // 65 minutes
      });

      expect(result.current.cache.sessionId).toBeNull();
      expect(result.current.cache.titles).toEqual([]);
    });

    it('should not clear cache before expiry', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      // Advance 30 minutes (before expiry)
      act(() => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(result.current.cache.sessionId).toBe('session-123');
      expect(result.current.cache.titles).toEqual([mockTitle]);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple title details', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const mockTitle2 = { ...mockTitle, title_id: 'title-2', title_name_en: 'Title 2' };

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitleDetail('title-1', mockTitle as any);
        result.current.setTitleDetail('title-2', mockTitle2 as any);
      });

      expect(result.current.getTitleDetail('title-1')).toEqual(mockTitle);
      expect(result.current.getTitleDetail('title-2')).toEqual(mockTitle2);
    });

    it('should handle empty arrays', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([]);
        result.current.setFavorites([]);
      });

      expect(result.current.getTitles()).toEqual([]);
      expect(result.current.getFavorites()).toEqual([]);
    });

    it('should handle updating existing titles', () => {
      const { result } = renderHook(() => useDataCache(), { wrapper });

      const updatedTitle = { ...mockTitle, title_name_en: 'Updated Title' };

      act(() => {
        result.current.initializeSession('session-123');
        result.current.setTitles([mockTitle]);
      });

      act(() => {
        result.current.setTitles([updatedTitle]);
      });

      expect(result.current.getTitles()[0].title_name_en).toBe('Updated Title');
    });
  });
});
