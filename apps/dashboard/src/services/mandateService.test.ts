/**
 * MandateService Unit Tests
 *
 * Tests for the mandate-based title recommendations service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mandateService, TitleMatch, MandateSearch } from './mandateService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('MandateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchMandates', () => {
    const mockResults: TitleMatch[] = [
      {
        title_id: 'title-1',
        title_name_en: 'Romance in Seoul',
        title_name_kr: '서울의 로맨스',
        match_score: 0.89,
        synopsis: 'A romantic story set in Seoul',
        genre: ['romance', 'drama'],
        tone: 'light',
        content_format: 'webtoon',
      },
      {
        title_id: 'title-2',
        title_name_en: 'Love Story',
        title_name_kr: '사랑 이야기',
        match_score: 0.75,
        synopsis: 'A beautiful love story',
        genre: ['romance'],
        tone: 'emotional',
      },
    ];

    it('should search mandates with valid email', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: mockResults,
          search_id: 'search-123',
          processing_time_ms: 150,
          cost_estimate: 0.0015,
        },
        error: null,
      });

      const response = await mandateService.searchMandates(
        'Looking for romantic comedy webtoons',
        'test@example.com'
      );

      expect(response.results).toEqual(mockResults);
      expect(response.search_id).toBe('search-123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('mandate-matcher', {
        body: {
          mandate_text: 'Looking for romantic comedy webtoons',
          user_email: 'test@example.com',
          limit: 15,
          save_search: true,
        },
      });
    });

    it('should use custom limit when provided', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: mockResults.slice(0, 1),
          search_id: 'search-456',
          processing_time_ms: 100,
          cost_estimate: 0.001,
        },
        error: null,
      });

      await mandateService.searchMandates(
        'Action thriller',
        'test@example.com',
        5
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('mandate-matcher', {
        body: {
          mandate_text: 'Action thriller',
          user_email: 'test@example.com',
          limit: 5,
          save_search: true,
        },
      });
    });

    it('should allow search without email when not saving', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: mockResults,
          search_id: 'trial-search',
          processing_time_ms: 120,
          cost_estimate: 0.001,
        },
        error: null,
      });

      const response = await mandateService.searchMandates(
        'Fantasy adventure',
        undefined,
        15,
        false // Don't save search (trial mode)
      );

      expect(response.results).toEqual(mockResults);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('mandate-matcher', {
        body: {
          mandate_text: 'Fantasy adventure',
          user_email: 'trial@kstorybridge.com',
          limit: 15,
          save_search: false,
        },
      });
    });

    it('should throw error when saving search without email', async () => {
      await expect(
        mandateService.searchMandates('Test mandate', undefined, 15, true)
      ).rejects.toThrow('User email is required when saving search');
    });

    it('should handle edge function errors', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Edge function timeout' },
      });

      await expect(
        mandateService.searchMandates('Test', 'test@example.com')
      ).rejects.toThrow('Edge function timeout');
    });

    it('should handle response error field', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { error: 'Invalid mandate format' },
        error: null,
      });

      await expect(
        mandateService.searchMandates('Test', 'test@example.com')
      ).rejects.toThrow('Invalid mandate format');
    });
  });

  describe('getRecentMandates', () => {
    const mockMandateSearches: MandateSearch[] = [
      {
        id: 'mandate-1',
        user_email: 'test@example.com',
        mandate_text: 'Looking for romantic comedies',
        search_results: [],
        created_at: '2025-12-14T10:00:00Z',
        result_count: 10,
        avg_match_score: 0.85,
      },
      {
        id: 'mandate-2',
        user_email: 'test@example.com',
        mandate_text: 'Action thrillers with strong leads',
        search_results: [],
        created_at: '2025-12-13T10:00:00Z',
        result_count: 8,
        avg_match_score: 0.78,
      },
    ];

    it('should fetch recent mandates for user', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockMandateSearches,
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const results = await mandateService.getRecentMandates('test@example.com');

      expect(results).toEqual(mockMandateSearches);
      expect(supabase.from).toHaveBeenCalledWith('mandate_searches');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_email', 'test@example.com');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should use custom limit', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockMandateSearches.slice(0, 1),
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await mandateService.getRecentMandates('test@example.com', 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should handle database errors', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await expect(
        mandateService.getRecentMandates('test@example.com')
      ).rejects.toEqual({ message: 'Database connection failed' });
    });
  });

  describe('getMandateById', () => {
    const mockMandate: MandateSearch = {
      id: 'mandate-123',
      user_email: 'test@example.com',
      mandate_text: 'Looking for mystery thrillers',
      search_results: [],
      created_at: '2025-12-14T10:00:00Z',
      result_count: 5,
      avg_match_score: 0.82,
    };

    it('should fetch mandate by ID', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockMandate,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const result = await mandateService.getMandateById('mandate-123');

      expect(result).toEqual(mockMandate);
      expect(supabase.from).toHaveBeenCalledWith('mandate_searches');
      expect(mockEq).toHaveBeenCalledWith('id', 'mandate-123');
    });

    it('should handle not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await expect(mandateService.getMandateById('invalid-id')).rejects.toEqual({
        message: 'Row not found',
        code: 'PGRST116',
      });
    });
  });

  describe('deleteMandate', () => {
    it('should delete mandate by ID', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await mandateService.deleteMandate('mandate-123');

      expect(supabase.from).toHaveBeenCalledWith('mandate_searches');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'mandate-123');
    });

    it('should handle delete errors', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Delete permission denied' },
      });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      await expect(mandateService.deleteMandate('mandate-123')).rejects.toEqual({
        message: 'Delete permission denied',
      });
    });
  });

  describe('getMandateCount', () => {
    it('should return mandate count for user', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        count: 15,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const count = await mandateService.getMandateCount('test@example.com');

      expect(count).toBe(15);
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('user_email', 'test@example.com');
    });

    it('should return 0 on error', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        count: null,
        error: { message: 'Query failed' },
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const count = await mandateService.getMandateCount('test@example.com');

      expect(count).toBe(0);
    });

    it('should return 0 when count is null', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        count: null,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const count = await mandateService.getMandateCount('test@example.com');

      expect(count).toBe(0);
    });
  });
});
