// DALL-E 3 API Client with Retry Logic
// Feature: Creative Asset Generation System
// Purpose: Generate images using OpenAI's DALL-E 3 API

import type {
  DallE3Request,
  DallE3Response,
  ImageDownloadResult,
  GenerationConfig,
} from './types.ts';

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// ============================================================================
// DALL-E 3 CLIENT
// ============================================================================

/**
 * Generate image using DALL-E 3 API with retry logic
 */
export async function generateImage(
  prompt: string,
  size: DallE3Request['size'],
  quality: DallE3Request['quality'],
  config: GenerationConfig,
  retryCount = 0
): Promise<DallE3Response> {
  try {
    console.log(`[DALL-E 3] Generating image (attempt ${retryCount + 1}/${config.max_retry_attempts + 1})`);
    console.log(`[DALL-E 3] Size: ${size}, Quality: ${quality}`);
    console.log(`[DALL-E 3] Prompt length: ${prompt.length} characters`);

    const requestBody: DallE3Request = {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'url',  // Get URL instead of base64
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DALL-E 3 API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as DallE3Response;

    // Validate response structure
    if (!data.data || data.data.length === 0 || !data.data[0].url) {
      throw new Error('DALL-E 3 API returned invalid response structure');
    }

    console.log(`[DALL-E 3] Image generated successfully`);
    if (data.data[0].revised_prompt) {
      console.log(`[DALL-E 3] Revised prompt: ${data.data[0].revised_prompt.substring(0, 100)}...`);
    }

    return data;
  } catch (error) {
    console.error(`[DALL-E 3] Generation failed (attempt ${retryCount + 1}):`, error);

    // Retry logic
    if (retryCount < config.max_retry_attempts) {
      const backoffMs = config.retry_delay_ms * Math.pow(2, retryCount);
      console.log(`[DALL-E 3] Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return generateImage(prompt, size, quality, config, retryCount + 1);
    }

    // Max retries exceeded
    throw error;
  }
}

/**
 * Download image from DALL-E URL
 */
export async function downloadImage(
  imageUrl: string,
  timeoutMs: number
): Promise<ImageDownloadResult> {
  try {
    console.log(`[Image Download] Downloading from: ${imageUrl.substring(0, 50)}...`);

    const response = await fetch(imageUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download image: ${response.status} ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    const size = blob.size;

    console.log(`[Image Download] Downloaded ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);

    return {
      success: true,
      blob,
      size,
    };
  } catch (error) {
    console.error('[Image Download] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown download error',
    };
  }
}

/**
 * Validate prompt meets DALL-E 3 requirements
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  // DALL-E 3 has a max prompt length of ~4000 characters
  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 4000) {
    return { valid: false, error: 'Prompt exceeds 4000 character limit' };
  }

  // Check for banned content patterns (very basic)
  const bannedPatterns = [
    /\b(nude|naked|nsfw)\b/i,
    /\b(violence|blood|gore)\b/i,
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        error: 'Prompt contains potentially inappropriate content',
      };
    }
  }

  return { valid: true };
}

/**
 * Generate and download image in one operation
 *
 * This is the main entry point for image generation
 */
export async function generateAndDownloadImage(
  prompt: string,
  size: DallE3Request['size'],
  quality: DallE3Request['quality'],
  config: GenerationConfig
): Promise<{
  success: boolean;
  blob?: Blob;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
}> {
  try {
    // Validate prompt
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate image with DALL-E 3
    const dalleResponse = await generateImage(prompt, size, quality, config);

    if (!dalleResponse.data[0].url) {
      return {
        success: false,
        error: 'DALL-E 3 did not return an image URL',
      };
    }

    const imageUrl = dalleResponse.data[0].url;
    const revisedPrompt = dalleResponse.data[0].revised_prompt;

    // Download the generated image
    const downloadResult = await downloadImage(imageUrl, config.image_download_timeout_ms);

    if (!downloadResult.success || !downloadResult.blob) {
      return {
        success: false,
        error: downloadResult.error || 'Failed to download image',
      };
    }

    console.log('[DALL-E Client] Image generation and download complete');

    return {
      success: true,
      blob: downloadResult.blob,
      imageUrl,
      revisedPrompt,
    };
  } catch (error) {
    console.error('[DALL-E Client] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Estimate generation time based on size and quality
 * (For display purposes only - actual times vary)
 */
export function estimateGenerationTime(
  size: DallE3Request['size'],
  quality: DallE3Request['quality']
): number {
  // Base time in seconds
  let baseTime = 10;

  // Larger sizes take longer
  if (size !== '1024x1024') {
    baseTime += 5;
  }

  // HD quality takes longer
  if (quality === 'hd') {
    baseTime += 10;
  }

  return baseTime * 1000; // Convert to milliseconds
}
