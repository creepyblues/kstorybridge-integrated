/**
 * Unit Tests: Asset Generation Service
 * Tests API service layer for edge function calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetService from '../assetGenerationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('assetGenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTitlesWithPitch', () => {
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

      const mockSelect = vi.fn().mockReturnThis();
      const mockNot = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockTitles, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        not: mockNot,
      });

      mockNot.mockReturnValue({
        order: mockOrder,
      });

      const result = await assetService.getTitlesWithPitch();

      expect(supabase.from).toHaveBeenCalledWith('titles');
      expect(mockSelect).toHaveBeenCalledWith('title_id, title_name_en, title_name_kr, views, pitch');
      expect(mockNot).toHaveBeenCalledWith('pitch', 'is', null);
      expect(mockOrder).toHaveBeenCalledWith('title_name_en');
      expect(result).toEqual(mockTitles);
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database error');

      const mockSelect = vi.fn().mockReturnThis();
      const mockNot = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        not: mockNot,
      });

      mockNot.mockReturnValue({
        order: mockOrder,
      });

      await expect(assetService.getTitlesWithPitch()).rejects.toThrow('Database error');
    });
  });

  describe('getAssetsByTitle', () => {
    it('should fetch assets for a specific title', async () => {
      const titleId = 'title-123';
      const mockAssets = [
        {
          id: 'asset-1',
          title_id: titleId,
          asset_category: 'social_media',
          status: 'pending',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockAssets, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await assetService.getAssetsByTitle(titleId);

      expect(supabase.from).toHaveBeenCalledWith('title_marketing_assets');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('title_id', titleId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockAssets);
    });
  });

  describe('analyzePitchForAssets', () => {
    it('should call edge function with correct parameters', async () => {
      const request = {
        title_id: 'title-123',
        title_name: 'Test Title',
        pitch_deck_url: 'https://example.com/pitch.pdf',
        admin_email: 'sungho@kstorybridge.com',
      };

      const mockResponse = {
        success: true,
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

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await assetService.analyzePitchForAssets(request);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-pitch-for-assets', {
        body: request,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when edge function fails', async () => {
      const request = {
        title_id: 'title-123',
        title_name: 'Test Title',
        pitch_deck_url: 'https://example.com/pitch.pdf',
        admin_email: 'sungho@kstorybridge.com',
      };

      const mockError = new Error('Edge function error');

      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(assetService.analyzePitchForAssets(request)).rejects.toThrow('Edge function error');
    });

    it('should throw error when response indicates failure', async () => {
      const request = {
        title_id: 'title-123',
        title_name: 'Test Title',
        pitch_deck_url: 'https://example.com/pitch.pdf',
        admin_email: 'sungho@kstorybridge.com',
      };

      const mockResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin email not authorized',
        },
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      await expect(assetService.analyzePitchForAssets(request)).rejects.toThrow('Admin email not authorized');
    });
  });

  describe('generateAsset', () => {
    it('should call edge function with correct parameters', async () => {
      const request = {
        asset_id: 'asset-123',
        admin_email: 'sungho@kstorybridge.com',
        use_hd: false,
      };

      const mockResponse = {
        success: true,
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

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await assetService.generateAsset(request);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-asset', {
        body: request,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateAssetApproval', () => {
    it('should update asset approval status', async () => {
      const assetId = 'asset-123';
      const approved = true;
      const adminEmail = 'sungho@kstorybridge.com';

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await assetService.updateAssetApproval(assetId, approved, adminEmail);

      expect(supabase.from).toHaveBeenCalledWith('title_marketing_assets');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          approved,
          approved_by_email: adminEmail,
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', assetId);
    });

    it('should clear approval data when unapproving', async () => {
      const assetId = 'asset-123';
      const approved = false;
      const adminEmail = 'sungho@kstorybridge.com';

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await assetService.updateAssetApproval(assetId, approved, adminEmail);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          approved: false,
          approved_by_email: null,
          approved_at: null,
        })
      );
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset from database', async () => {
      const assetId = 'asset-123';

      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      await assetService.deleteAsset(assetId);

      expect(supabase.from).toHaveBeenCalledWith('title_marketing_assets');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', assetId);
    });

    it('should throw error on deletion failure', async () => {
      const assetId = 'asset-123';
      const mockError = new Error('Delete failed');

      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: mockError });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      await expect(assetService.deleteAsset(assetId)).rejects.toThrow('Delete failed');
    });
  });
});
