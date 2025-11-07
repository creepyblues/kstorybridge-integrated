/**
 * Unit Tests: Asset Generation Hooks
 * Tests React Query hooks for asset generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useTitlesWithPitch,
  useAssetsByTitle,
  useAnalyzePitch,
  useGenerateAsset,
  useUpdateAssetApproval,
  useDeleteAsset,
} from '../useAssetGeneration';
import * as assetService from '@/services/assetGenerationService';

// Mock services
vi.mock('@/services/assetGenerationService');

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAssetGeneration hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTitlesWithPitch', () => {
    it('should fetch titles with pitch data', async () => {
      const mockTitles = [
        {
          title_id: 'title-1',
          title_name_en: 'Test Title',
          title_name_kr: '테스트',
          views: 1000,
          pitch: 'https://example.com/pitch.pdf',
        },
      ];

      vi.mocked(assetService.getTitlesWithPitch).mockResolvedValue(mockTitles);

      const { result } = renderHook(() => useTitlesWithPitch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTitles);
      expect(assetService.getTitlesWithPitch).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockError = new Error('Fetch failed');
      vi.mocked(assetService.getTitlesWithPitch).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTitlesWithPitch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useAssetsByTitle', () => {
    it('should fetch assets for a title', async () => {
      const titleId = 'title-123';
      const mockAssets = [
        {
          id: 'asset-1',
          title_id: titleId,
          title_name: 'Test Title',
          asset_category: 'social_media' as const,
          asset_type: 'instagram_story',
          asset_format: '1080x1920',
          description: 'Test asset',
          prompt_template: 'Test prompt',
          prompt_used: null,
          image_url: null,
          video_url: null,
          generation_api: 'dall-e-3',
          generation_model: 'dall-e-3',
          generation_cost: 0,
          generation_attempts: 0,
          error_message: null,
          status: 'pending' as const,
          approved: false,
          approved_by_email: null,
          approved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(assetService.getAssetsByTitle).mockResolvedValue(mockAssets);

      const { result } = renderHook(() => useAssetsByTitle(titleId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAssets);
      expect(assetService.getAssetsByTitle).toHaveBeenCalledWith(titleId);
    });

    it('should not fetch when titleId is null', async () => {
      const { result } = renderHook(() => useAssetsByTitle(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(assetService.getAssetsByTitle).not.toHaveBeenCalled();
    });
  });

  describe('useAnalyzePitch', () => {
    it('should call analyze service on mutation', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          title_id: 'title-123',
          title_name: 'Test Title',
          assets_created: 12,
          asset_ideas: [],
          analysis_metadata: {
            gpt4_cost: 0.05,
            total_cost: 0.05,
            analysis_duration_ms: 3000,
            model_used: 'gpt-4-turbo-preview',
            tokens_used: { prompt: 1000, completion: 500, total: 1500 },
            pitch_analysis_used: false,
            ideas_generated: 12,
          },
        },
      };

      vi.mocked(assetService.analyzePitchForAssets).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAnalyzePitch(), {
        wrapper: createWrapper(),
      });

      const request = {
        title_id: 'title-123',
        title_name: 'Test Title',
        pitch_deck_url: 'https://example.com/pitch.pdf',
        admin_email: 'sungho@dadble.com',
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(assetService.analyzePitchForAssets).toHaveBeenCalledWith(request);
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useGenerateAsset', () => {
    it('should call generate service on mutation', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          asset_id: 'asset-123',
          image_url: 'https://example.com/image.png',
          signed_url: 'https://example.com/signed.png',
          storage_path: 'title-123/image.png',
          generation_cost: 0.04,
          generation_model: 'dall-e-3',
          generation_duration_ms: 15000,
          generation_attempts: 1,
        },
      };

      vi.mocked(assetService.generateAsset).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateAsset(), {
        wrapper: createWrapper(),
      });

      const request = {
        asset_id: 'asset-123',
        admin_email: 'sungho@dadble.com',
        use_hd: false,
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(assetService.generateAsset).toHaveBeenCalledWith(request);
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useUpdateAssetApproval', () => {
    it('should call update service on mutation', async () => {
      vi.mocked(assetService.updateAssetApproval).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateAssetApproval(), {
        wrapper: createWrapper(),
      });

      const params = {
        assetId: 'asset-123',
        approved: true,
        adminEmail: 'sungho@dadble.com',
      };

      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(assetService.updateAssetApproval).toHaveBeenCalledWith(
        params.assetId,
        params.approved,
        params.adminEmail
      );
    });
  });

  describe('useDeleteAsset', () => {
    it('should call delete service on mutation', async () => {
      vi.mocked(assetService.deleteAsset).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAsset(), {
        wrapper: createWrapper(),
      });

      const assetId = 'asset-123';

      result.current.mutate(assetId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(assetService.deleteAsset).toHaveBeenCalledWith(assetId);
    });
  });
});
