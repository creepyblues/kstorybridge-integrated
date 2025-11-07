// Edge Function: generate-asset
// Feature: Creative Asset Generation System - Image Generation
// Purpose: Generate images from asset prompts using DALL-E 3
// Design: ISOLATED - Only queries/updates title_marketing_assets table

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import type {
  GenerateAssetRequest,
  GenerateAssetResult,
  GenerateAssetResponse,
  GenerateAssetError,
  AssetRecord,
  AssetUpdatePayload,
} from './types.ts';

import {
  isAuthorizedAdmin,
  mapFormatToSize,
  calculateDallE3Cost,
  DEFAULT_CONFIG,
  ERROR_CODES,
  canGenerateAsset,
} from './types.ts';

import { generateAndDownloadImage } from './dalle-client.ts';
import { uploadImageToStorage, validateBlob } from './storage-client.ts';

// Security utilities
import { getRequiredEnv, validateEnvironment, logEnvironmentConfig } from '../_shared/env-validator.ts';
import { getCorsHeaders, handleCorsPrelight, validateOrigin, logCorsConfig } from '../_shared/cors-handler.ts';
import { validatePrompt, sanitizePrompt, logSanitization } from '../_shared/prompt-sanitizer.ts';

// ============================================================================
// ENVIRONMENT VARIABLES (with validation)
// ============================================================================

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = getRequiredEnv('OPENAI_API_KEY');

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Log function invocation
  console.log('[generate-asset] Edge function handler invoked');
  console.log(`[generate-asset] Environment check: SUPABASE_URL=${!!SUPABASE_URL}, SERVICE_ROLE=${!!SUPABASE_SERVICE_ROLE_KEY}, OPENAI=${!!OPENAI_API_KEY}`);

  // CORS preflight with origin validation
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  // Validate origin for actual requests
  const originValidation = validateOrigin(req);
  if (!originValidation.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: originValidation.error,
      },
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(req.headers.get('origin')),
      },
    });
  }

  try {
    // Parse request body
    const requestBody = await req.json() as GenerateAssetRequest;

    console.log(`[generate-asset] Processing asset: ${requestBody.asset_id}`);
    console.log(`[generate-asset] Admin: ${requestBody.admin_email}`);
    console.log(`[generate-asset] Custom prompt: ${requestBody.custom_prompt ? 'Yes' : 'No'}`);
    console.log(`[generate-asset] Use HD: ${requestBody.use_hd ? 'Yes' : 'No'}`);

    // Validate request
    const validationError = validateRequest(requestBody);
    if (validationError) {
      return errorResponse(validationError.code, validationError.message, 400, req);
    }

    // Sanitize custom prompt if provided
    if (requestBody.custom_prompt) {
      const promptValidation = validatePrompt(requestBody.custom_prompt);

      if (!promptValidation.valid) {
        console.error(`[generate-asset] Custom prompt failed validation: ${promptValidation.error}`);
        return errorResponse(
          ERROR_CODES.INVALID_INPUT,
          `Invalid custom prompt: ${promptValidation.error}`,
          400,
          req
        );
      }

      // Use sanitized prompt
      requestBody.custom_prompt = promptValidation.sanitized;

      // Log sanitization warnings if any
      if (promptValidation.warnings && promptValidation.warnings.length > 0) {
        console.warn(`[generate-asset] Prompt sanitization warnings:`, promptValidation.warnings);
        logSanitization(
          {
            sanitized: promptValidation.sanitized!,
            warnings: promptValidation.warnings,
            originalLength: requestBody.custom_prompt.length,
            sanitizedLength: promptValidation.sanitized!.length,
          },
          { assetId: requestBody.asset_id }
        );
      }
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch asset record from database
    const asset = await fetchAssetRecord(supabase, requestBody.asset_id);
    if (!asset.success || !asset.data) {
      return errorResponse(
        asset.error?.code || ERROR_CODES.ASSET_NOT_FOUND,
        asset.error?.message || 'Asset not found',
        404
      );
    }

    const assetRecord = asset.data;

    // Check if asset can be generated
    if (!canGenerateAsset(assetRecord.status)) {
      if (assetRecord.status === 'completed' && assetRecord.image_url) {
        return errorResponse(
          ERROR_CODES.ASSET_ALREADY_GENERATED,
          `Asset already generated. Image URL: ${assetRecord.image_url}`,
          400,
          req
        );
      }
      if (assetRecord.status === 'generating') {
        return errorResponse(
          ERROR_CODES.ASSET_ALREADY_GENERATED,
          'Asset is currently being generated',
          400,
          req
        );
      }
    }

    // Update status to 'generating' with optimistic locking
    const startTime = Date.now();
    const statusUpdateResult = await updateAssetStatusWithLock(
      supabase,
      requestBody.asset_id,
      assetRecord.updated_at, // Use current updated_at as version check
      {
        status: 'generating',
        generation_attempts: assetRecord.generation_attempts + 1,
      }
    );

    // Check if update succeeded (race condition check)
    if (!statusUpdateResult.success) {
      if (statusUpdateResult.conflict) {
        return errorResponse(
          ERROR_CODES.ASSET_ALREADY_GENERATED,
          'Asset is being modified by another process. Please try again.',
          409, // 409 Conflict
          req
        );
      }
      return errorResponse(
        ERROR_CODES.DATABASE_ERROR,
        statusUpdateResult.error || 'Failed to update asset status',
        500,
        req
      );
    }

    console.log(`[generate-asset] Starting generation for asset: ${assetRecord.asset_type}`);

    // Determine prompt to use
    const prompt = requestBody.custom_prompt || assetRecord.prompt_template;
    const promptUsed = requestBody.custom_prompt ? requestBody.custom_prompt : assetRecord.prompt_template;

    // Map asset format to DALL-E size
    const dalleSize = mapFormatToSize(assetRecord.asset_format);
    const dalleQuality = requestBody.use_hd ? 'hd' : 'standard';

    console.log(`[generate-asset] DALL-E size: ${dalleSize}, quality: ${dalleQuality}`);

    // Generate and download image
    const imageResult = await generateAndDownloadImage(
      prompt,
      dalleSize,
      dalleQuality,
      DEFAULT_CONFIG
    );

    if (!imageResult.success || !imageResult.blob) {
      // Generation failed - update asset status
      await updateAssetStatus(supabase, requestBody.asset_id, {
        status: 'failed',
        error_message: imageResult.error || 'Image generation failed',
      });

      return errorResponse(
        ERROR_CODES.DALLE_API_ERROR,
        imageResult.error || 'Failed to generate image',
        500,
        req
      );
    }

    console.log(`[generate-asset] Image generated, downloading...`);

    // Validate blob before upload
    const blobValidation = validateBlob(imageResult.blob);
    if (!blobValidation.valid) {
      await updateAssetStatus(supabase, requestBody.asset_id, {
        status: 'failed',
        error_message: blobValidation.error || 'Invalid image blob',
      });

      return errorResponse(
        ERROR_CODES.IMAGE_DOWNLOAD_ERROR,
        blobValidation.error || 'Invalid image',
        500,
        req
      );
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const uploadResult = await uploadImageToStorage(
      imageResult.blob,
      assetRecord.title_id,
      assetRecord.asset_type,
      timestamp
    );

    if (!uploadResult.success || !uploadResult.public_url) {
      // Upload failed - update asset status
      await updateAssetStatus(supabase, requestBody.asset_id, {
        status: 'failed',
        error_message: uploadResult.error || 'Storage upload failed',
      });

      return errorResponse(
        ERROR_CODES.STORAGE_UPLOAD_ERROR,
        uploadResult.error || 'Failed to upload image to storage',
        500,
        req
      );
    }

    console.log(`[generate-asset] Image uploaded to storage: ${uploadResult.storage_path}`);

    // Calculate actual cost
    const actualCost = calculateDallE3Cost(dalleSize, dalleQuality);
    const duration = Date.now() - startTime;

    // Update asset record with success
    await updateAssetStatus(supabase, requestBody.asset_id, {
      status: 'completed',
      image_url: uploadResult.public_url,
      prompt_used: promptUsed,
      generation_cost: actualCost,
      generation_model: requestBody.use_hd ? 'dall-e-3-hd' : 'dall-e-3',
      error_message: null,
    });

    console.log(`[generate-asset] Asset generation complete`);
    console.log(`[generate-asset] Cost: $${actualCost.toFixed(4)}`);
    console.log(`[generate-asset] Duration: ${duration}ms`);

    // Build success response
    const response: GenerateAssetResponse = {
      success: true,
      data: {
        asset_id: requestBody.asset_id,
        image_url: uploadResult.public_url,
        signed_url: uploadResult.signed_url || uploadResult.public_url,
        storage_path: uploadResult.storage_path!,
        generation_cost: actualCost,
        generation_model: requestBody.use_hd ? 'dall-e-3-hd' : 'dall-e-3',
        generation_duration_ms: duration,
        generation_attempts: assetRecord.generation_attempts + 1,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(req.headers.get('origin')),
      },
    });
  } catch (error) {
    console.error('[generate-asset] Unexpected error:', error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      req
    );
  }
});

// ============================================================================
// VALIDATION
// ============================================================================

function validateRequest(
  request: GenerateAssetRequest
): { code: string; message: string } | null {
  if (!request.asset_id || typeof request.asset_id !== 'string') {
    return { code: ERROR_CODES.INVALID_INPUT, message: 'Missing or invalid asset_id' };
  }

  if (!request.admin_email || typeof request.admin_email !== 'string') {
    return { code: ERROR_CODES.INVALID_INPUT, message: 'Missing or invalid admin_email' };
  }

  // Validate admin email is authorized
  if (!isAuthorizedAdmin(request.admin_email)) {
    return { code: ERROR_CODES.UNAUTHORIZED, message: 'Admin email not authorized' };
  }

  return null;
}

// ============================================================================
// DATABASE OPERATIONS (ISOLATED - ONLY title_marketing_assets TABLE)
// ============================================================================

/**
 * Fetch asset record from database
 */
async function fetchAssetRecord(
  supabase: ReturnType<typeof createClient>,
  assetId: string
): Promise<{
  success: boolean;
  data?: AssetRecord;
  error?: { code: string; message: string };
}> {
  try {
    const { data, error } = await supabase
      .from('title_marketing_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('[Database] Failed to fetch asset:', error);
      return {
        success: false,
        error: {
          code: ERROR_CODES.ASSET_NOT_FOUND,
          message: `Asset not found: ${error.message}`,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.ASSET_NOT_FOUND,
          message: 'Asset not found',
        },
      };
    }

    return { success: true, data: data as AssetRecord };
  } catch (error) {
    console.error('[Database] Error fetching asset:', error);
    return {
      success: false,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: error instanceof Error ? error.message : 'Database error',
      },
    };
  }
}

/**
 * Update asset status and metadata
 */
async function updateAssetStatus(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  updates: AssetUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('title_marketing_assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId);

    if (error) {
      console.error('[Database] Failed to update asset:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Database] Error updating asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update asset status with optimistic locking (race condition prevention)
 * Uses updated_at timestamp to ensure no concurrent modifications
 */
async function updateAssetStatusWithLock(
  supabase: ReturnType<typeof createClient>,
  assetId: string,
  expectedUpdatedAt: string, // The updated_at value from when we fetched the record
  updates: AssetUpdatePayload
): Promise<{ success: boolean; error?: string; conflict?: boolean }> {
  try {
    const newUpdatedAt = new Date().toISOString();

    // Update only if updated_at matches expected value (optimistic lock)
    const { data, error } = await supabase
      .from('title_marketing_assets')
      .update({
        ...updates,
        updated_at: newUpdatedAt,
      })
      .eq('id', assetId)
      .eq('updated_at', expectedUpdatedAt) // Optimistic lock condition
      .select();

    if (error) {
      console.error('[Database] Failed to update asset with lock:', error);
      return { success: false, error: error.message, conflict: false };
    }

    // Check if any rows were updated (0 rows = conflict/race condition)
    if (!data || data.length === 0) {
      console.warn(`[Database] Optimistic lock conflict for asset ${assetId}`);
      console.warn(`[Database] Expected updated_at: ${expectedUpdatedAt}, but record was modified`);
      return {
        success: false,
        conflict: true,
        error: 'Asset was modified by another process',
      };
    }

    console.log(`[Database] Successfully updated asset ${assetId} with optimistic lock`);
    return { success: true };
  } catch (error) {
    console.error('[Database] Error updating asset with lock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conflict: false,
    };
  }
}

// ============================================================================
// ERROR RESPONSE HELPER
// ============================================================================

function errorResponse(code: string, message: string, status: number, req?: Request): Response {
  const errorBody: GenerateAssetError = {
    success: false,
    error: {
      code,
      message,
    },
  };

  console.error(`[generate-asset] Error response: ${code} - ${message}`);

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(req?.headers.get('origin') || null),
    },
  });
}
