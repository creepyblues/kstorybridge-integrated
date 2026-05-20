/**
 * VectorSearchService Unit Tests
 *
 * Tests for the semantic vector search service that uses OpenAI embeddings
 * via the vector-search edge function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { vectorSearchService, VectorSearchResult } from './vectorSearchService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('VectorSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('vectorSearch', () => {
    const mockSearchResults: VectorSearchResult[] = [
      {
        title_id: 'title-1',
        title_name_en: 'Romance in Seoul',
        title_name_kr: '서울의 로맨스',
        synopsis: 'A romantic story set in Seoul',
        genre: ['romance', 'drama'],
        tone: 'light',
        content_format: 'webtoon',
        similarity: 0.89,
      },
      {
        title_id: 'title-2',
        title_name_en: 'Love Story',
        synopsis: 'A beautiful love story',
        genre: ['romance'],
        similarity: 0.75,
      },
    ];

    it('should return search results with default options', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: mockSearchResults,
          query: 'romantic comedy',
          count: 2,
          processing_time_ms: 150,
          cost_estimate: 0.0001,
        },
        error: null,
      });

      const results = await vectorSearchService.vectorSearch('romantic comedy');

      expect(results).toEqual(mockSearchResults);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('vector-search', {
        body: {
          query: 'romantic comedy',
          match_threshold: 0.4, // Default threshold
          match_count: 30, // Default limit
        },
      });
    });

    it('should use custom options when provided', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: mockSearchResults,
          query: 'action thriller',
          count: 2,
          processing_time_ms: 120,
          cost_estimate: 0.0001,
        },
        error: null,
      });

      const results = await vectorSearchService.vectorSearch('action thriller', {
        threshold: 0.7,
        limit: 10,
      });

      expect(results).toEqual(mockSearchResults);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('vector-search', {
        body: {
          query: 'action thriller',
          match_threshold: 0.7,
          match_count: 10,
        },
      });
    });

    it('should return empty array when no results found', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          results: [],
          query: 'unique query',
          count: 0,
          processing_time_ms: 100,
          cost_estimate: 0.0001,
        },
        error: null,
      });

      const results = await vectorSearchService.vectorSearch('unique query');

      expect(results).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: null,
      });

      const results = await vectorSearchService.vectorSearch('test query');

      expect(results).toEqual([]);
    });

    it('should throw error when edge function returns error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Function invocation failed' },
      });

      // Error gets caught and transformed to user-friendly message
      await expect(vectorSearchService.vectorSearch('test query')).rejects.toThrow(
        'Search failed. Please try again.'
      );
    });

    it('should throw error when response contains error field', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          error: 'Invalid query format',
          results: [],
          query: 'test',
          count: 0,
          processing_time_ms: 0,
          cost_estimate: 0,
        },
        error: null,
      });

      // Error gets caught and transformed to user-friendly message
      await expect(vectorSearchService.vectorSearch('test query')).rejects.toThrow(
        'Search failed. Please try again.'
      );
    });

    it('should provide user-friendly message for OpenAI errors', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('OpenAI API error: insufficient quota')
      );

      await expect(vectorSearchService.vectorSearch('test')).rejects.toThrow(
        'Search service unavailable. Please try again later.'
      );
    });

    it('should provide user-friendly message for quota errors', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('quota exceeded for this project')
      );

      await expect(vectorSearchService.vectorSearch('test')).rejects.toThrow(
        'Search quota exceeded. Please try again later.'
      );
    });

    it('should provide user-friendly message for rate limit errors', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('rate_limit reached')
      );

      await expect(vectorSearchService.vectorSearch('test')).rejects.toThrow(
        'Too many searches. Please wait a moment and try again.'
      );
    });

    it('should provide generic message for unknown errors', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error('Unknown network error')
      );

      await expect(vectorSearchService.vectorSearch('test')).rejects.toThrow(
        'Search failed. Please try again.'
      );
    });
  });

  describe('findSimilarTitles', () => {
    const mockReferenceTitle = {
      combined_embedding: [0.1, 0.2, 0.3], // Simplified embedding
      title_name_en: 'Reference Title',
    };

    const mockSimilarTitles: VectorSearchResult[] = [
      {
        title_id: 'reference-id',
        title_name_en: 'Reference Title',
        similarity: 1.0,
      },
      {
        title_id: 'similar-1',
        title_name_en: 'Similar Title 1',
        similarity: 0.85,
      },
      {
        title_id: 'similar-2',
        title_name_en: 'Similar Title 2',
        similarity: 0.72,
      },
    ];

    it('should find similar titles excluding the reference', async () => {
      // Reference lookup mock: from('titles').select(...).eq().single()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockReferenceTitle,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      // Priority filter mock (added by the buyer-visibility filter):
      // from('titles').select('title_id').in('title_id', ids).in('priority', [...])
      // It awaits to { data, error }, so the inner .in() must be a thenable.
      const mockPriorityIn = vi.fn().mockResolvedValue({
        data: mockSimilarTitles
          .filter((r) => r.title_id !== 'reference-id')
          .map((r) => ({ title_id: r.title_id })),
        error: null,
      });
      const mockTitleIdsIn = vi.fn().mockReturnValue({ in: mockPriorityIn });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, in: mockTitleIdsIn });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      // Mock the RPC call
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockSimilarTitles,
        error: null,
      } as any);

      const results = await vectorSearchService.findSimilarTitles('reference-id', 5);

      // Should exclude the reference title itself
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.title_id)).not.toContain('reference-id');
      expect(results[0].title_id).toBe('similar-1');
      expect(results[1].title_id).toBe('similar-2');

      // Priority filter must have been applied with the buyer-visible set
      expect(mockPriorityIn).toHaveBeenCalledWith('priority', ['1', '2']);

      // Verify RPC was called with correct params
      expect(supabase.rpc).toHaveBeenCalledWith('match_titles_by_embedding', {
        query_embedding: mockReferenceTitle.combined_embedding,
        match_threshold: 0.5,
        match_count: 6, // limit + 1 to exclude reference
      });
    });

    it('should use default limit of 10', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockReferenceTitle,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      await vectorSearchService.findSimilarTitles('some-id');

      expect(supabase.rpc).toHaveBeenCalledWith('match_titles_by_embedding', {
        query_embedding: mockReferenceTitle.combined_embedding,
        match_threshold: 0.5,
        match_count: 11, // Default 10 + 1
      });
    });

    it('should throw error when reference title not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Title not found' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await expect(vectorSearchService.findSimilarTitles('invalid-id')).rejects.toThrow(
        'Reference title not found or has no embedding'
      );
    });

    it('should throw error when reference title has no embedding', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { title_name_en: 'Title Without Embedding', combined_embedding: null },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      await expect(vectorSearchService.findSimilarTitles('no-embedding-id')).rejects.toThrow(
        'Reference title not found or has no embedding'
      );
    });

    it('should throw error when RPC call fails', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockReferenceTitle,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC function error' },
      } as any);

      await expect(vectorSearchService.findSimilarTitles('valid-id')).rejects.toThrow(
        'Failed to find similar titles: RPC function error'
      );
    });

    it('should handle empty results from RPC', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockReferenceTitle,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const results = await vectorSearchService.findSimilarTitles('lonely-title');

      expect(results).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const manyResults = Array.from({ length: 15 }, (_, i) => ({
        title_id: `title-${i}`,
        title_name_en: `Title ${i}`,
        similarity: 0.9 - i * 0.05,
      }));

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockReferenceTitle,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      // Priority filter returns all manyResults as published (test focuses on limit).
      const mockPriorityIn = vi.fn().mockResolvedValue({
        data: manyResults.map((r) => ({ title_id: r.title_id })),
        error: null,
      });
      const mockTitleIdsIn = vi.fn().mockReturnValue({ in: mockPriorityIn });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, in: mockTitleIdsIn });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: manyResults,
        error: null,
      } as any);

      const results = await vectorSearchService.findSimilarTitles('some-id', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getDefaultOptions', () => {
    it('should return default options', () => {
      const options = vectorSearchService.getDefaultOptions();

      expect(options).toEqual({
        threshold: 0.4,
        limit: 30,
      });
    });
  });
});
