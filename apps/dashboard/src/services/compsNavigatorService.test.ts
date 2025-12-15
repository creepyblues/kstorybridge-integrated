/**
 * Unit Tests for Comps Navigator Service
 *
 * Tests cover:
 * - Service method validation
 * - Error handling
 * - Type safety
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing the service
// Create a chainable mock that handles multiple .eq() calls
const createChainableMock = () => {
  const mock: any = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return mock;
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => createChainableMock()),
  },
}));

import { compsNavigatorService, TitleMatch } from './compsNavigatorService';
import { supabase } from '@/lib/supabase';

describe('compsNavigatorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchComps', () => {
    it('should throw error when no comp titles provided', async () => {
      await expect(
        compsNavigatorService.searchComps([], undefined, 'test@example.com')
      ).rejects.toThrow('Must provide 1-3 comparable titles');
    });

    it('should throw error when more than 3 comp titles provided', async () => {
      await expect(
        compsNavigatorService.searchComps(
          ['Title 1', 'Title 2', 'Title 3', 'Title 4'],
          undefined,
          'test@example.com'
        )
      ).rejects.toThrow('Must provide 1-3 comparable titles');
    });

    it('should throw error when email missing and saving search', async () => {
      await expect(
        compsNavigatorService.searchComps(['The Bear'], undefined, undefined, true)
      ).rejects.toThrow('User email is required when saving search');
    });

    it('should allow search without email when not saving', async () => {
      const mockResponse = {
        results: [],
        processing_time_ms: 1000,
        cost_estimate: 0.01,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await compsNavigatorService.searchComps(
        ['The Bear'],
        undefined,
        undefined,
        false // saveSearch = false
      );

      expect(result).toEqual(mockResponse);
    });

    it('should call edge function with correct parameters', async () => {
      const mockResponse = {
        results: [
          {
            title_id: 'uuid-123',
            title_name_en: 'Test Title',
            title_name_kr: '테스트',
            match_score: 85,
            explanation: 'Great match',
            synopsis: 'A story',
            genre: ['Drama'],
            tone: 'Dark',
          },
        ],
        search_id: 'search-123',
        processing_time_ms: 3000,
        cost_estimate: 0.015,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await compsNavigatorService.searchComps(
        ['The Bear', 'Succession'],
        'dark comedy',
        'test@example.com',
        true,
        'My Saved Search'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('comp-navigator', {
        body: {
          action: 'search',
          comp_titles: ['The Bear', 'Succession'],
          refinement_text: 'dark comedy',
          user_email: 'test@example.com',
          save_search: true,
          search_name: 'My Saved Search',
        },
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].match_score).toBe(85);
    });

    it('should handle edge function errors', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Internal server error' } as any,
      });

      await expect(
        compsNavigatorService.searchComps(['The Bear'], undefined, 'test@example.com')
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('getRecentSearches', () => {
    it('should return empty array when no searches found', async () => {
      const result = await compsNavigatorService.getRecentSearches('test@example.com');
      expect(result).toEqual([]);
    });
  });

  describe('getBookmarkedSearches', () => {
    it('should return empty array when no bookmarked searches', async () => {
      const result = await compsNavigatorService.getBookmarkedSearches('test@example.com');
      expect(result).toEqual([]);
    });
  });
});

describe('TitleMatch interface', () => {
  it('should have required fields', () => {
    const titleMatch: TitleMatch = {
      title_id: 'uuid-123',
      title_name_en: 'English Title',
      title_name_kr: '한국어 제목',
      match_score: 85,
      explanation: 'This matches because...',
      synopsis: 'A story about...',
      genre: ['Drama', 'Thriller'],
      tone: 'Dark',
    };

    expect(titleMatch.title_id).toBeDefined();
    expect(titleMatch.match_score).toBeGreaterThanOrEqual(0);
    expect(titleMatch.match_score).toBeLessThanOrEqual(100);
    expect(Array.isArray(titleMatch.genre)).toBe(true);
  });

  it('should allow optional title_image', () => {
    const titleMatch: TitleMatch = {
      title_id: 'uuid-123',
      title_name_en: 'Title',
      title_name_kr: '제목',
      match_score: 75,
      explanation: 'Match',
      synopsis: 'Story',
      genre: ['Drama'],
      tone: 'Light',
      title_image: 'https://example.com/image.jpg',
    };

    expect(titleMatch.title_image).toBe('https://example.com/image.jpg');
  });
});
