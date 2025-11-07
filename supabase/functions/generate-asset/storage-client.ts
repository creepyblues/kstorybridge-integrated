// Supabase Storage Client for Image Uploads
// Feature: Creative Asset Generation System
// Purpose: Upload generated images to Supabase Storage and create signed URLs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { StorageUploadResult } from './types.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STORAGE_BUCKET = 'marketing-assets';

// ============================================================================
// STORAGE CLIENT
// ============================================================================

/**
 * Upload image blob to Supabase Storage
 *
 * @param blob - Image blob from DALL-E
 * @param titleId - Title ID for folder organization
 * @param assetType - Asset type (e.g., 'instagram_story', 'poster')
 * @param timestamp - Timestamp for unique filename
 * @returns Storage upload result with URLs
 */
export async function uploadImageToStorage(
  blob: Blob,
  titleId: string,
  assetType: string,
  timestamp: number
): Promise<StorageUploadResult> {
  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Construct storage path: {title_id}/{asset_type}-{timestamp}.png
    const filename = `${assetType}-${timestamp}.png`;
    const storagePath = `${titleId}/${filename}`;

    console.log(`[Storage] Uploading to: ${STORAGE_BUCKET}/${storagePath}`);
    console.log(`[Storage] File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Convert blob to ArrayBuffer for upload
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',  // Cache for 1 hour
        upsert: false,         // Don't overwrite existing files
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return {
        success: false,
        error: `Storage upload failed: ${error.message}`,
      };
    }

    console.log(`[Storage] Upload successful: ${data.path}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Create signed URL (24-hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 86400); // 24 hours

    if (signedUrlError) {
      console.warn('[Storage] Failed to create signed URL:', signedUrlError);
      // Continue without signed URL - not critical
    }

    const signedUrl = signedUrlData?.signedUrl || publicUrl;

    console.log(`[Storage] Public URL: ${publicUrl}`);
    console.log(`[Storage] Signed URL: ${signedUrl}`);

    return {
      success: true,
      storage_path: storagePath,
      public_url: publicUrl,
      signed_url: signedUrl,
    };
  } catch (error) {
    console.error('[Storage] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }
}

/**
 * Create a new signed URL for an existing file
 *
 * @param storagePath - Path in storage bucket
 * @param expirySeconds - URL expiry time in seconds (default: 24 hours)
 * @returns Signed URL or error
 */
export async function createSignedUrl(
  storagePath: string,
  expirySeconds: number = 86400
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expirySeconds);

    if (error) {
      return {
        success: false,
        error: `Failed to create signed URL: ${error.message}`,
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete file from storage (used for cleanup/retry)
 *
 * @param storagePath - Path in storage bucket
 * @returns Success status
 */
export async function deleteFileFromStorage(
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`,
      };
    }

    console.log(`[Storage] Deleted file: ${storagePath}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if file exists in storage
 *
 * @param storagePath - Path in storage bucket
 * @returns True if file exists
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(storagePath.split('/')[0], {
        search: storagePath.split('/')[1],
      });

    if (error) {
      console.error('[Storage] Error checking file existence:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[Storage] Error checking file existence:', error);
    return false;
  }
}

/**
 * Get storage bucket info
 *
 * @returns Bucket configuration
 */
export async function getBucketInfo(): Promise<{
  success: boolean;
  bucket?: {
    id: string;
    name: string;
    public: boolean;
    file_size_limit: number;
    allowed_mime_types: string[];
  };
  error?: string;
}> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);

    if (error) {
      return {
        success: false,
        error: `Failed to get bucket info: ${error.message}`,
      };
    }

    return {
      success: true,
      bucket: data as any,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate blob before upload
 *
 * @param blob - Image blob
 * @returns Validation result
 */
export function validateBlob(blob: Blob): { valid: boolean; error?: string } {
  // Check size (10MB limit from bucket config)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (blob.size > maxSize) {
    return {
      valid: false,
      error: `Image size (${(blob.size / 1024 / 1024).toFixed(2)} MB) exceeds 10MB limit`,
    };
  }

  // Check minimum size (1KB)
  if (blob.size < 1024) {
    return {
      valid: false,
      error: 'Image size is too small (< 1KB)',
    };
  }

  // Check type
  if (!blob.type.startsWith('image/')) {
    return {
      valid: false,
      error: `Invalid blob type: ${blob.type} (expected image/*)`,
    };
  }

  return { valid: true };
}

/**
 * Generate storage path for asset
 *
 * @param titleId - Title ID
 * @param assetType - Asset type
 * @param timestamp - Optional timestamp (defaults to now)
 * @returns Storage path
 */
export function generateStoragePath(
  titleId: string,
  assetType: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const filename = `${assetType}-${ts}.png`;
  return `${titleId}/${filename}`;
}
