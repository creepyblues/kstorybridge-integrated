/**
 * TitlesService Unit Tests
 *
 * Tests for title CRUD operations, favorites, filtering, and search.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { titlesService, Title, TitleFilters } from './titlesService';
import { supabase } from '@/lib/supabase';
import { vectorSearchService } from './vectorSearchService';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock vectorSearchService
vi.mock('./vectorSearchService', () => ({
  vectorSearchService: {
    vectorSearch: vi.fn(),
  },
}));

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Helper to create mock query builder
function createMockQueryBuilder(returnValue: { data?: unknown; error?: unknown; count?: number | null } = { data: [], error: null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
    single: vi.fn().mockResolvedValue(returnValue),
    then: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
  };

  // Make builder thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
    configurable: true,
  });

  return builder;
}

describe('TitlesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTitles: Title[] = [
    {
      title_id: 'title-1',
      title_name_en: 'Romance in Seoul',
      title_name_kr: '서울의 로맨스',
      synopsis: 'A romantic story set in Seoul',
      genre: ['romance', 'drama'],
      content_format: 'webtoon',
      rating: 4.5,
      completed: true,
      created_at: '2024-01-01',
    },
    {
      title_id: 'title-2',
      title_name_en: 'Action Hero',
      title_name_kr: '액션 히어로',
      synopsis: 'An action-packed adventure',
      genre: ['action', 'fantasy'],
      content_format: 'webnovel',
      rating: 4.0,
      completed: false,
      created_at: '2024-01-02',
    },
  ];

  describe('getTitles', () => {
    it('should fetch all titles without filters', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitles();

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockBuilder.select).toHaveBeenCalledWith('*');
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockTitles);
    });

    it('should apply genre filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockTitles[0]], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const filters: TitleFilters = { genre: 'romance' };
      await titlesService.getTitles(filters);

      expect(mockBuilder.contains).toHaveBeenCalledWith('genre', ['romance']);
    });

    it('should apply format filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockTitles[0]], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const filters: TitleFilters = { format: 'webtoon' };
      await titlesService.getTitles(filters);

      expect(mockBuilder.eq).toHaveBeenCalledWith('content_format', 'webtoon');
    });

    it('should apply search filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const filters: TitleFilters = { search: 'Seoul' };
      await titlesService.getTitles(filters);

      expect(mockBuilder.or).toHaveBeenCalled();
    });

    it('should apply minRating filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockTitles[0]], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const filters: TitleFilters = { minRating: 4.5 };
      await titlesService.getTitles(filters);

      expect(mockBuilder.gte).toHaveBeenCalledWith('rating', 4.5);
    });

    it('should apply completed filter', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockTitles[0]], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const filters: TitleFilters = { completed: true };
      await titlesService.getTitles(filters);

      expect(mockBuilder.eq).toHaveBeenCalledWith('completed', true);
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Database connection failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.getTitles()).rejects.toThrow('Failed to fetch titles: Database connection failed');
    });

    it('should return empty array when no data', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitles();
      expect(result).toEqual([]);
    });
  });

  describe('getTitlesPaginated', () => {
    it('should fetch paginated titles', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null, count: 50 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitlesPaginated(undefined, 0, 12);

      expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockBuilder.range).toHaveBeenCalledWith(0, 11);
      expect(result.data).toEqual(mockTitles);
      expect(result.hasMore).toBe(true);
    });

    it('should return hasMore as false when at end', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null, count: 2 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitlesPaginated(undefined, 0, 12);

      expect(result.hasMore).toBe(false);
    });

    it('should apply offset and limit correctly', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null, count: 100 });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await titlesService.getTitlesPaginated(undefined, 24, 12);

      expect(mockBuilder.range).toHaveBeenCalledWith(24, 35);
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.getTitlesPaginated()).rejects.toThrow('Failed to fetch titles: Query failed');
    });
  });

  describe('getTitlesByIds', () => {
    it('should fetch titles by IDs', async () => {
      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitlesByIds(['title-1', 'title-2']);

      expect(mockBuilder.in).toHaveBeenCalledWith('title_id', ['title-1', 'title-2']);
      expect(result).toEqual(mockTitles);
    });

    it('should return empty array for empty input', async () => {
      const result = await titlesService.getTitlesByIds([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should preserve order of input IDs', async () => {
      const reversedTitles = [...mockTitles].reverse();
      const mockBuilder = createMockQueryBuilder({ data: reversedTitles, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitlesByIds(['title-1', 'title-2']);

      expect(result[0].title_id).toBe('title-1');
      expect(result[1].title_id).toBe('title-2');
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.getTitlesByIds(['title-1'])).rejects.toThrow('Failed to fetch titles: Fetch failed');
    });
  });

  describe('getTitleById', () => {
    it('should fetch a single title with related data', async () => {
      const mockTitle = { ...mockTitles[0], title_content_analysis: null };

      // Create mock for main title query
      const mainBuilder = createMockQueryBuilder({ data: mockTitle, error: null });

      // Create mock for analysis query
      const analysisBuilder = createMockQueryBuilder({ data: null, error: null });

      // Create mock for platforms query
      const platformsBuilder = createMockQueryBuilder({ data: [], error: null });

      // Create mock for documents query
      const documentsBuilder = createMockQueryBuilder({ data: [], error: null });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'titles') return mainBuilder as any;
        if (table === 'title_content_analysis') return analysisBuilder as any;
        if (table === 'title_platforms') return platformsBuilder as any;
        if (table === 'title_documents') return documentsBuilder as any;
        return mainBuilder as any;
      });

      const result = await titlesService.getTitleById('title-1');

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(result?.title_id).toBe('title-1');
    });

    it('should return null when title not found', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getTitleById('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Title fetch failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.getTitleById('title-1')).rejects.toThrow('Failed to fetch title: Title fetch failed');
    });
  });

  describe('isFavorited', () => {
    it('should return true when title is favorited', async () => {
      const mockBuilder = createMockQueryBuilder({ data: { id: 'fav-1' }, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.isFavorited('title-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockBuilder.eq).toHaveBeenCalledWith('title_id', 'title-1');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false when not favorited', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.isFavorited('title-1', 'user-1');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.isFavorited('title-1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('addFavorite', () => {
    it('should add a favorite successfully', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await titlesService.addFavorite('title-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockBuilder.insert).toHaveBeenCalledWith({
        title_id: 'title-1',
        user_id: 'user-1',
      });
    });

    it('should ignore duplicate key error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { code: '23505', message: 'Duplicate key' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      // Should not throw
      await expect(titlesService.addFavorite('title-1', 'user-1')).resolves.toBeUndefined();
    });

    it('should throw on other errors', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { code: '42P01', message: 'Table not found' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.addFavorite('title-1', 'user-1')).rejects.toThrow('Failed to add favorite: Table not found');
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite successfully', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await titlesService.removeFavorite('title-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('title_id', 'title-1');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should throw on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.removeFavorite('title-1', 'user-1')).rejects.toThrow('Failed to remove favorite: Delete failed');
    });
  });

  describe('getFavorites', () => {
    it('should fetch user favorites', async () => {
      const mockFavorites = [
        { title: mockTitles[0] },
        { title: mockTitles[1] },
      ];
      const mockBuilder = createMockQueryBuilder({ data: mockFavorites, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getFavorites('user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockTitles);
    });

    it('should return empty array when no favorites', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getFavorites('user-1');
      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.getFavorites('user-1')).rejects.toThrow('Failed to fetch favorites: Fetch failed');
    });
  });

  describe('getGenres', () => {
    it('should return unique genres', async () => {
      const mockData = [
        { genre: 'romance,drama' },
        { genre: 'action,fantasy' },
        { genre: 'romance' },
      ];
      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getGenres();

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockBuilder.select).toHaveBeenCalledWith('genre');
      expect(mockBuilder.not).toHaveBeenCalledWith('genre', 'is', null);
      expect(result).toContain('Romance');
      expect(result).toContain('Drama');
      expect(result).toContain('Action');
      expect(result).toContain('Fantasy');
    });

    it('should return empty array on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getGenres();
      expect(result).toEqual([]);
    });

    it('should return sorted genres', async () => {
      const mockData = [
        { genre: 'romance' },
        { genre: 'action' },
        { genre: 'drama' },
      ];
      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getGenres();

      expect(result[0]).toBe('Action');
      expect(result[1]).toBe('Drama');
      expect(result[2]).toBe('Romance');
    });
  });

  describe('getFormats', () => {
    it('should return unique formats', async () => {
      const mockData = [
        { content_format: 'webtoon' },
        { content_format: 'webnovel' },
        { content_format: 'webtoon' },
      ];
      const mockBuilder = createMockQueryBuilder({ data: mockData, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getFormats();

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockBuilder.select).toHaveBeenCalledWith('content_format');
      expect(result).toContain('Webtoon');
      expect(result).toContain('Webnovel');
    });

    it('should return empty array on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.getFormats();
      expect(result).toEqual([]);
    });
  });

  describe('searchTitlesVector', () => {
    it('should perform vector search and return titles', async () => {
      const vectorResults = [
        { title_id: 'title-1', similarity: 0.9 },
        { title_id: 'title-2', similarity: 0.8 },
      ];
      vi.mocked(vectorSearchService.vectorSearch).mockResolvedValue(vectorResults);

      const mockBuilder = createMockQueryBuilder({ data: mockTitles, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await titlesService.searchTitlesVector('romantic comedy');

      expect(vectorSearchService.vectorSearch).toHaveBeenCalledWith('romantic comedy', {
        limit: 30,
        threshold: 0.4,
      });
      expect(result).toEqual(mockTitles);
    });

    it('should return empty array when no vector results', async () => {
      vi.mocked(vectorSearchService.vectorSearch).mockResolvedValue([]);

      const result = await titlesService.searchTitlesVector('nonexistent query');

      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should use custom limit', async () => {
      vi.mocked(vectorSearchService.vectorSearch).mockResolvedValue([]);

      await titlesService.searchTitlesVector('query', 10);

      expect(vectorSearchService.vectorSearch).toHaveBeenCalledWith('query', {
        limit: 10,
        threshold: 0.4,
      });
    });

    it('should re-throw OpenAI errors as-is', async () => {
      const openaiError = new Error('OpenAI quota exceeded');
      vi.mocked(vectorSearchService.vectorSearch).mockRejectedValue(openaiError);

      await expect(titlesService.searchTitlesVector('query')).rejects.toThrow('OpenAI quota exceeded');
    });

    it('should wrap other errors in user-friendly message', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(vectorSearchService.vectorSearch).mockRejectedValue(dbError);

      await expect(titlesService.searchTitlesVector('query')).rejects.toThrow('Search failed. Please try again.');
    });
  });

  describe('updateTitle', () => {
    it('should update a title', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [mockTitles[0]], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await titlesService.updateTitle('title-1', { title_name_en: 'Updated Title' });

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockBuilder.update).toHaveBeenCalledWith({ title_name_en: 'Updated Title' });
      expect(mockBuilder.eq).toHaveBeenCalledWith('title_id', 'title-1');
    });

    it('should throw on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.updateTitle('title-1', {})).rejects.toThrow('Failed to update title: Update failed');
    });
  });

  describe('deleteTitle', () => {
    it('should delete a title', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await titlesService.deleteTitle('title-1');

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('title_id', 'title-1');
    });

    it('should throw on error', async () => {
      const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(titlesService.deleteTitle('title-1')).rejects.toThrow('Failed to delete title: Delete failed');
    });
  });

  describe('formatNumber', () => {
    it('should format millions', () => {
      expect(titlesService.formatNumber(1500000)).toBe('1.5M');
      expect(titlesService.formatNumber(1000000)).toBe('1.0M');
      expect(titlesService.formatNumber(10000000)).toBe('10.0M');
    });

    it('should format thousands', () => {
      expect(titlesService.formatNumber(1500)).toBe('1.5K');
      expect(titlesService.formatNumber(1000)).toBe('1.0K');
      expect(titlesService.formatNumber(999000)).toBe('999.0K');
    });

    it('should return plain number for small values', () => {
      expect(titlesService.formatNumber(999)).toBe('999');
      expect(titlesService.formatNumber(1)).toBe('1');
    });

    it('should return 0 for undefined/null', () => {
      expect(titlesService.formatNumber(undefined)).toBe('0');
      expect(titlesService.formatNumber(0)).toBe('0');
    });
  });
});
