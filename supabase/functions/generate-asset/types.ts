// TypeScript Types for generate-asset Edge Function
// Feature: Creative Asset Generation System - Image Generation
// Design: DALL-E 3 integration with Supabase Storage upload

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Main request payload for generating an asset image
 */
export interface GenerateAssetRequest {
  asset_id: string;              // UUID of asset from title_marketing_assets table
  custom_prompt?: string;        // Optional: Override the prompt_template
  use_hd?: boolean;             // Optional: Use DALL-E 3 HD quality ($0.08 vs $0.04)
  admin_email: string;          // Authorized admin email
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Success response with generated asset details
 */
export interface GenerateAssetResponse {
  success: true;
  data: {
    asset_id: string;
    image_url: string;              // Permanent Supabase Storage URL
    signed_url: string;             // 24-hour preview URL
    storage_path: string;           // Path in bucket: {title_id}/{asset_type}-{timestamp}.png
    generation_cost: number;        // Actual cost in USD
    generation_model: string;       // 'dall-e-3' or 'dall-e-3-hd'
    generation_duration_ms: number; // Time taken
    generation_attempts: number;    // Number of attempts made
  };
}

/**
 * Error response
 */
export interface GenerateAssetError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type for response
 */
export type GenerateAssetResult = GenerateAssetResponse | GenerateAssetError;

// ============================================================================
// DATABASE TYPES (from title_marketing_assets table)
// ============================================================================

/**
 * Asset record from database
 */
export interface AssetRecord {
  id: string;
  title_id: string;
  title_name: string;
  asset_category: string;
  asset_type: string;
  asset_format: string;
  description: string;
  prompt_template: string;
  prompt_used: string | null;
  image_url: string | null;
  video_url: string | null;
  generation_api: string;
  generation_model: string;
  generation_cost: number;
  generation_attempts: number;
  error_message: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  approved: boolean;
  approved_by_email: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database update payload for asset generation
 */
export interface AssetUpdatePayload {
  status: 'generating' | 'completed' | 'failed';
  image_url?: string;
  prompt_used?: string;
  generation_cost?: number;
  generation_model?: string;
  generation_attempts?: number;
  error_message?: string | null;
  updated_at?: string;
}

// ============================================================================
// DALL-E 3 API TYPES
// ============================================================================

/**
 * DALL-E 3 API request payload
 */
export interface DallE3Request {
  model: 'dall-e-3';
  prompt: string;
  n: 1;                          // DALL-E 3 only supports n=1
  size: '1024x1024' | '1024x1792' | '1792x1024';
  quality: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
}

/**
 * DALL-E 3 API response
 */
export interface DallE3Response {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Storage upload result
 */
export interface StorageUploadResult {
  success: boolean;
  storage_path?: string;         // e.g., "title-123/instagram_story-1699564800000.png"
  public_url?: string;           // Permanent URL
  signed_url?: string;           // 24-hour preview URL
  error?: string;
}

/**
 * Image download result
 */
export interface ImageDownloadResult {
  success: boolean;
  blob?: Blob;
  size?: number;
  error?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Type guard: Check if response is success
 */
export function isSuccessResponse(
  result: GenerateAssetResult
): result is GenerateAssetResponse {
  return result.success === true;
}

/**
 * Type guard: Check if response is error
 */
export function isErrorResponse(
  result: GenerateAssetResult
): result is GenerateAssetError {
  return result.success === false;
}

/**
 * Validate asset status allows generation
 */
export function canGenerateAsset(status: AssetRecord['status']): boolean {
  return status === 'pending' || status === 'failed';
}

/**
 * Validate asset format maps to DALL-E size
 */
export function mapFormatToSize(format: string): DallE3Request['size'] {
  // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024

  // Vertical formats (stories, character cards, posters)
  if (format === '1080x1920' || format === '1080x1350') {
    return '1024x1792';
  }

  // Horizontal formats (ads, thumbnails, banners)
  if (format === '1920x1080' || format === '1280x720' || format === '1200x628' ||
      format === '1200x675' || format === '728x90') {
    return '1792x1024';
  }

  // Square formats (Instagram posts, profile pics)
  // Default for any unrecognized format
  return '1024x1024';
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * DALL-E 3 pricing (as of 2025-11-06)
 */
export const DALLE3_PRICING = {
  standard: {
    '1024x1024': 0.040,
    '1024x1792': 0.080,
    '1792x1024': 0.080,
  },
  hd: {
    '1024x1024': 0.080,
    '1024x1792': 0.120,
    '1792x1024': 0.120,
  },
};

/**
 * Calculate cost for DALL-E 3 generation
 */
export function calculateDallE3Cost(
  size: DallE3Request['size'],
  quality: DallE3Request['quality']
): number {
  return DALLE3_PRICING[quality][size];
}

/**
 * Estimate cost before generation
 */
export function estimateGenerationCost(
  format: string,
  use_hd: boolean = false
): number {
  const size = mapFormatToSize(format);
  const quality = use_hd ? 'hd' : 'standard';
  return calculateDallE3Cost(size, quality);
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_ALREADY_GENERATED: 'ASSET_ALREADY_GENERATED',
  DALLE_API_ERROR: 'DALLE_API_ERROR',
  IMAGE_DOWNLOAD_ERROR: 'IMAGE_DOWNLOAD_ERROR',
  STORAGE_UPLOAD_ERROR: 'STORAGE_UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Generation configuration
 */
export interface GenerationConfig {
  max_retry_attempts: number;      // Maximum retries for DALL-E API
  retry_delay_ms: number;          // Initial retry delay (exponential backoff)
  image_download_timeout_ms: number; // Timeout for downloading image
  signed_url_expiry_seconds: number; // Signed URL expiry (24 hours)
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: GenerationConfig = {
  max_retry_attempts: 3,
  retry_delay_ms: 1000,            // 1s, 2s, 4s with exponential backoff
  image_download_timeout_ms: 30000, // 30 seconds
  signed_url_expiry_seconds: 86400, // 24 hours
};

// ============================================================================
// AUTHORIZED ADMINS
// ============================================================================

/**
 * List of authorized admin emails
 * Must match the list in analyze-pitch-for-assets function
 */
export const AUTHORIZED_ADMINS = [
  'sungho@kstorybridge.com',
  'kevin@sandstoneartists.com',
];

/**
 * Check if email is authorized
 */
export function isAuthorizedAdmin(email: string): boolean {
  return AUTHORIZED_ADMINS.includes(email.toLowerCase());
}
