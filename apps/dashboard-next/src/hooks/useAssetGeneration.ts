// React Query Hook for Asset Generation
// Handles data fetching, caching, and mutations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type {
  AnalyzePitchRequest,
  GenerateAssetRequest,
} from '@/types/asset-generation';
import * as assetService from '@/services/assetGenerationService';

/**
 * Fetch titles with pitch data
 */
export function useTitlesWithPitch() {
  return useQuery({
    queryKey: ['titles-with-pitch'],
    queryFn: assetService.getTitlesWithPitch,
  });
}

/**
 * Fetch assets for a specific title
 */
export function useAssetsByTitle(titleId: string | null) {
  return useQuery({
    queryKey: ['assets', titleId],
    queryFn: () => assetService.getAssetsByTitle(titleId!),
    enabled: !!titleId,
  });
}

/**
 * Analyze pitch and generate asset ideas
 */
export function useAnalyzePitch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AnalyzePitchRequest) => assetService.analyzePitchForAssets(request),
    onSuccess: (data, variables) => {
      toast({
        title: 'Analysis Complete',
        description: `Generated ${data.data.assets_created} asset ideas. Cost: $${data.data.analysis_metadata.total_cost.toFixed(4)}`,
      });
      // Invalidate assets query to refetch
      queryClient.invalidateQueries({ queryKey: ['assets', variables.title_id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Generate image for an asset
 */
export function useGenerateAsset() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateAssetRequest) => assetService.generateAsset(request),
    onSuccess: (data) => {
      toast({
        title: 'Image Generated',
        description: `Cost: $${data.data.generation_cost.toFixed(4)}`,
      });
      // Invalidate assets query to refetch
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update asset approval
 */
export function useUpdateAssetApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, approved, adminEmail }: { assetId: string; approved: boolean; adminEmail: string }) =>
      assetService.updateAssetApproval(assetId, approved, adminEmail),
    onSuccess: (_, variables) => {
      toast({
        title: variables.approved ? 'Asset Approved' : 'Approval Removed',
      });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete asset
 */
export function useDeleteAsset() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => assetService.deleteAsset(assetId),
    onSuccess: () => {
      toast({
        title: 'Asset Deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
