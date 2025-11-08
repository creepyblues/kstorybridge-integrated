// Asset Generation Service
// Handles API calls to edge functions

import { supabase } from '@/integrations/supabase/client';
import type {
  MarketingAsset,
  TitleWithPitch,
  AnalyzePitchRequest,
  AnalyzePitchResponse,
  GenerateAssetRequest,
  GenerateAssetResponse,
} from '@/types/asset-generation';

/**
 * Fetch titles that have pitch analysis data
 */
export async function getTitlesWithPitch(): Promise<TitleWithPitch[]> {
  const { data, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, views, pitch')
    .not('pitch', 'is', null)
    .order('title_name_en');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch assets for a specific title
 */
export async function getAssetsByTitle(titleId: string): Promise<MarketingAsset[]> {
  const { data, error } = await supabase
    .from('title_marketing_assets')
    .select('*')
    .eq('title_id', titleId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get count of assets for a specific title
 */
export async function getAssetCountByTitle(titleId: string): Promise<number> {
  const { count, error } = await supabase
    .from('title_marketing_assets')
    .select('*', { count: 'exact', head: true })
    .eq('title_id', titleId);

  if (error) {
    console.error('Error counting assets:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Call analyze-pitch-for-assets edge function
 */
export async function analyzePitchForAssets(
  request: AnalyzePitchRequest
): Promise<AnalyzePitchResponse> {
  const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
    body: request,
  });

  // Enhanced error handling to extract detailed error messages
  if (error) {
    console.error('[assetGenerationService] Edge function error:', error);

    // Try to extract detailed error message from response
    const errorContext = (error as any).context;
    if (errorContext) {
      console.error('[assetGenerationService] Error context:', errorContext);

      // If we have a response body with error details, use that
      if (data && !data.success && data.error?.message) {
        throw new Error(data.error.message);
      }
    }

    // Fall back to SDK error message
    throw new Error(error.message || 'Edge function request failed');
  }

  if (!data.success) throw new Error(data.error?.message || 'Analysis failed');
  return data;
}

/**
 * Call generate-asset edge function
 */
export async function generateAsset(
  request: GenerateAssetRequest
): Promise<GenerateAssetResponse> {
  const { data, error } = await supabase.functions.invoke('generate-asset', {
    body: request,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error?.message || 'Generation failed');
  return data;
}

/**
 * Update asset approval status
 */
export async function updateAssetApproval(
  assetId: string,
  approved: boolean,
  adminEmail: string
): Promise<void> {
  const { error } = await supabase
    .from('title_marketing_assets')
    .update({
      approved,
      approved_by_email: approved ? adminEmail : null,
      approved_at: approved ? new Date().toISOString() : null,
    })
    .eq('id', assetId);

  if (error) throw error;
}

/**
 * Delete asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('title_marketing_assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
}
