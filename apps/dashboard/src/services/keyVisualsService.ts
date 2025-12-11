/**
 * Key Visuals Service
 *
 * Handles collection, storage, and retrieval of key visual images for titles.
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type ImageType = 'cover' | 'character' | 'scene' | 'promotional' | 'other';

export interface DiscoveredImage {
  url: string;
  thumbnailUrl?: string;
  source: 'platform' | 'search' | 'external';
  sourceDomain: string;
  imageType: ImageType;
  width?: number;
  height?: number;
  title?: string;
}

export interface CollectKeyVisualsRequest {
  titleId?: string;
  titleName?: string;
  titleNameKr?: string;
  titleUrl?: string;
  titleUrlEn?: string;
  collectedBy: string;
  limit?: number;
}

export interface CollectKeyVisualsResponse {
  success: boolean;
  images: DiscoveredImage[];
  totalFound: number;
  errors: Record<string, string>;
}

export interface KeyVisual {
  id: string;
  title_id: string;
  image_type: ImageType;
  original_url: string;
  storage_url: string;
  description?: string;
  display_order: number;
  is_primary: boolean;
  collected_by: string;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveKeyVisualRequest {
  titleId: string;
  originalUrl: string;
  imageType: ImageType;
  description?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  collectedBy: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Collect key visuals from platform URLs and image search
 */
export async function collectKeyVisuals(
  request: CollectKeyVisualsRequest,
  userEmail: string
): Promise<CollectKeyVisualsResponse> {
  console.log('[keyVisualsService] Collecting key visuals:', request);

  const { data, error } = await supabase.functions.invoke('key-visuals-collector', {
    body: {
      ...request,
      collectedBy: userEmail,
    },
  });

  if (error) {
    console.error('[keyVisualsService] Edge function error:', error);
    throw new Error(`Failed to collect key visuals: ${error.message}`);
  }

  return data as CollectKeyVisualsResponse;
}

/**
 * Upload image via edge function proxy (avoids CORS issues)
 * The edge function fetches the image server-side and uploads to Supabase storage
 */
export async function uploadImageViaProxy(
  titleId: string,
  imageUrl: string
): Promise<{ storageUrl: string; filename: string }> {
  console.log('[keyVisualsService] Uploading image via proxy:', imageUrl);

  const { data, error } = await supabase.functions.invoke('key-visuals-collector', {
    body: {
      action: 'proxy-image',
      imageUrl,
      titleId,
    },
  });

  if (error) {
    console.error('[keyVisualsService] Proxy upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to upload image');
  }

  return {
    storageUrl: data.storageUrl,
    filename: data.filename,
  };
}

/**
 * Save key visual record after image has been uploaded
 */
export async function saveKeyVisualRecord(
  request: SaveKeyVisualRequest & { storageUrl: string }
): Promise<KeyVisual> {
  const { titleId, originalUrl, storageUrl, imageType, description, displayOrder = 0, isPrimary = false, collectedBy } = request;

  console.log('[keyVisualsService] Saving key visual record:', { titleId, imageType, storageUrl });

  // If setting as primary, unset other primaries
  if (isPrimary) {
    await supabase
      .from('title_key_visuals')
      .update({ is_primary: false })
      .eq('title_id', titleId)
      .eq('is_primary', true);
  }

  // Save record to database
  const { data: keyVisual, error: dbError } = await supabase
    .from('title_key_visuals')
    .insert({
      title_id: titleId,
      image_type: imageType,
      original_url: originalUrl,
      storage_url: storageUrl,
      description,
      display_order: displayOrder,
      is_primary: isPrimary,
      collected_by: collectedBy,
    })
    .select()
    .single();

  if (dbError) {
    console.error('[keyVisualsService] Database error:', dbError);
    throw new Error(`Failed to save key visual record: ${dbError.message}`);
  }

  return keyVisual;
}

/**
 * Upload image to Supabase storage and save record (combined operation)
 * Uses edge function proxy to avoid CORS issues
 */
export async function saveKeyVisual(
  request: SaveKeyVisualRequest
): Promise<KeyVisual> {
  const { titleId, originalUrl, imageType, description, displayOrder = 0, isPrimary = false, collectedBy } = request;

  // Upload via proxy
  const { storageUrl } = await uploadImageViaProxy(titleId, originalUrl);

  // Save record
  return saveKeyVisualRecord({
    titleId,
    originalUrl,
    storageUrl,
    imageType,
    description,
    displayOrder,
    isPrimary,
    collectedBy,
  });
}

/**
 * Get all key visuals for a title
 */
export async function getKeyVisuals(titleId: string): Promise<KeyVisual[]> {
  const { data, error } = await supabase
    .from('title_key_visuals')
    .select('*')
    .eq('title_id', titleId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[keyVisualsService] Error fetching key visuals:', error);
    throw new Error(`Failed to fetch key visuals: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a key visual
 */
export async function deleteKeyVisual(keyVisualId: string): Promise<void> {
  // Get the record first to get the storage path
  const { data: keyVisual, error: fetchError } = await supabase
    .from('title_key_visuals')
    .select('storage_url')
    .eq('id', keyVisualId)
    .single();

  if (fetchError) {
    console.error('[keyVisualsService] Error fetching key visual:', fetchError);
    throw new Error(`Failed to fetch key visual: ${fetchError.message}`);
  }

  // Extract file path from storage URL
  const storageUrl = keyVisual.storage_url;
  const bucketUrl = supabase.storage.from('title-key-visuals').getPublicUrl('').data.publicUrl;
  const filePath = storageUrl.replace(bucketUrl, '').replace(/^\//, '');

  // Delete from storage
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from('title-key-visuals')
      .remove([filePath]);

    if (storageError) {
      console.error('[keyVisualsService] Storage delete error:', storageError);
      // Continue anyway - database record should still be deleted
    }
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('title_key_visuals')
    .delete()
    .eq('id', keyVisualId);

  if (dbError) {
    console.error('[keyVisualsService] Database delete error:', dbError);
    throw new Error(`Failed to delete key visual: ${dbError.message}`);
  }
}

/**
 * Update key visual metadata
 */
export async function updateKeyVisual(
  keyVisualId: string,
  updates: Partial<Pick<KeyVisual, 'image_type' | 'description' | 'display_order' | 'is_primary'>>
): Promise<KeyVisual> {
  const { data, error } = await supabase
    .from('title_key_visuals')
    .update(updates)
    .eq('id', keyVisualId)
    .select()
    .single();

  if (error) {
    console.error('[keyVisualsService] Update error:', error);
    throw new Error(`Failed to update key visual: ${error.message}`);
  }

  return data;
}

