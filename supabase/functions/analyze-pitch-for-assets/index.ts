// Edge Function: analyze-pitch-for-assets
// Feature: Creative Asset Generation System
// Purpose: Analyze pitch deck and generate marketing asset ideas using GPT-4
// Design: ISOLATED - accepts all data as parameters, NO queries to existing tables

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import type {
  AnalyzePitchRequest,
  AnalyzePitchResult,
  AnalyzePitchResponse,
  AnalyzePitchError,
  AssetIdea,
  MarketingAssetInsert,
  AssetGenerationConfig,
  AnalysisMetadata,
} from './types.ts';

import {
  buildOpenAIMessages,
  parseGPT4Response,
  estimateAnalysisCost,
} from './prompt-builder.ts';

import {
  calculateGPT4Cost,
  estimateAssetCost,
  DEFAULT_CONFIG,
} from './types.ts';

// Security utilities
import { getRequiredEnv, validateEnvironment, logEnvironmentConfig } from '../_shared/env-validator.ts';
import { getCorsHeaders, handleCorsPrelight, validateOrigin, logCorsConfig } from '../_shared/cors-handler.ts';

// ============================================================================
// ENVIRONMENT VARIABLES (with validation)
// ============================================================================

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = getRequiredEnv('OPENAI_API_KEY');

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GPT4_MODEL = 'gpt-4-turbo-preview';
const MAX_RETRIES = 2;
const TIMEOUT_MS = 60000; // 60 seconds

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Log function initialization (only on first request)
  console.log('[analyze-pitch-for-assets] Edge function handler invoked');
  console.log(`[analyze-pitch-for-assets] Environment check: SUPABASE_URL=${!!SUPABASE_URL}, SERVICE_ROLE=${!!SUPABASE_SERVICE_ROLE_KEY}, OPENAI=${!!OPENAI_API_KEY}`);

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
    const requestBody = await req.json() as AnalyzePitchRequest;

    console.log(`[analyze-pitch-for-assets] Starting analysis for title: ${requestBody.title_name} (${requestBody.title_id})`);

    // Validate request
    const validationError = validateRequest(requestBody);
    if (validationError) {
      return errorResponse(validationError.code, validationError.message, 400, req);
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use default config (can be extended to accept custom config in request)
    const config: AssetGenerationConfig = DEFAULT_CONFIG;

    // Estimate cost before making API call
    const estimatedCost = estimateAnalysisCost(requestBody, config);
    console.log(`[analyze-pitch-for-assets] Estimated cost: $${estimatedCost.toFixed(4)}`);

    if (estimatedCost > config.max_cost_usd) {
      return errorResponse(
        'COST_LIMIT_EXCEEDED',
        `Estimated cost ($${estimatedCost.toFixed(4)}) exceeds limit ($${config.max_cost_usd.toFixed(4)})`,
        400,
        req
      );
    }

    // Call GPT-4 to analyze pitch and generate asset ideas
    const startTime = Date.now();
    const gpt4Response = await callGPT4WithRetry(requestBody, config);
    const analysisTimeMs = Date.now() - startTime;

    console.log(`[analyze-pitch-for-assets] GPT-4 analysis completed in ${analysisTimeMs}ms`);
    console.log(`[analyze-pitch-for-assets] Tokens used: ${gpt4Response.usage.total_tokens} (prompt: ${gpt4Response.usage.prompt_tokens}, completion: ${gpt4Response.usage.completion_tokens})`);

    // Parse response
    const parsedResponse = parseGPT4Response(gpt4Response.choices[0].message.content);
    console.log(`[analyze-pitch-for-assets] Generated ${parsedResponse.asset_ideas.length} asset ideas`);

    // Transform GPT-4 ideas to database inserts
    const assetIdeas = transformToAssetIdeas(parsedResponse.asset_ideas, requestBody);

    // Insert into database (title_marketing_assets table ONLY)
    const insertResult = await insertAssetIdeas(supabase, assetIdeas, requestBody);

    if (!insertResult.success) {
      return errorResponse('DATABASE_ERROR', insertResult.error || 'Failed to insert asset ideas', 500, req);
    }

    // Calculate actual cost
    const actualCost = calculateGPT4Cost(
      GPT4_MODEL,
      gpt4Response.usage.prompt_tokens,
      gpt4Response.usage.completion_tokens
    );

    // Build metadata
    const metadata: AnalysisMetadata = {
      gpt4_cost: actualCost,
      total_cost: actualCost,
      analysis_duration_ms: analysisTimeMs,
      model_used: gpt4Response.model,
      tokens_used: {
        prompt: gpt4Response.usage.prompt_tokens,
        completion: gpt4Response.usage.completion_tokens,
        total: gpt4Response.usage.total_tokens,
      },
      pitch_analysis_used: !!requestBody.pitch_analysis,
      ideas_generated: parsedResponse.asset_ideas.length,
    };

    // Build success response
    const response: AnalyzePitchResponse = {
      success: true,
      data: {
        title_id: requestBody.title_id,
        title_name: requestBody.title_name,
        assets_created: insertResult.count,
        asset_ideas: assetIdeas,
        analysis_metadata: metadata,
      },
    };

    console.log(`[analyze-pitch-for-assets] Successfully created ${insertResult.count} asset ideas`);
    console.log(`[analyze-pitch-for-assets] Total cost: $${actualCost.toFixed(4)}`);

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(req.headers.get('origin')),
      },
    });
  } catch (error) {
    console.error('[analyze-pitch-for-assets] Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      req
    );
  }
});

// ============================================================================
// VALIDATION
// ============================================================================

function validateRequest(request: AnalyzePitchRequest): { code: string; message: string } | null {
  if (!request.title_id || typeof request.title_id !== 'string') {
    return { code: 'INVALID_INPUT', message: 'Missing or invalid title_id' };
  }

  if (!request.title_name || typeof request.title_name !== 'string') {
    return { code: 'INVALID_INPUT', message: 'Missing or invalid title_name' };
  }

  if (!request.pitch_deck_url || typeof request.pitch_deck_url !== 'string' || request.pitch_deck_url.trim() === '') {
    return { code: 'INVALID_INPUT', message: 'pitch_deck_url is required and must be a non-empty string' };
  }

  if (!request.admin_email || typeof request.admin_email !== 'string') {
    return { code: 'INVALID_INPUT', message: 'Missing or invalid admin_email' };
  }

  // Validate admin email is authorized
  const authorizedAdmins = ['sungho@dadble.com', 'kevin@sandstoneartists.com'];
  if (!authorizedAdmins.includes(request.admin_email.toLowerCase())) {
    return { code: 'UNAUTHORIZED', message: 'Admin email not authorized' };
  }

  return null;
}

// ============================================================================
// GPT-4 API CALL
// ============================================================================

interface GPT4Response {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callGPT4WithRetry(
  request: AnalyzePitchRequest,
  config: AssetGenerationConfig,
  retryCount = 0
): Promise<GPT4Response> {
  try {
    const messages = buildOpenAIMessages(request, config);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.gpt4_model || GPT4_MODEL,
        messages,
        temperature: config.temperature,
        response_format: { type: 'json_object' }, // Force JSON mode
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as GPT4Response;

    // Validate response structure
    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI API returned no choices');
    }

    if (!data.usage) {
      throw new Error('OpenAI API returned no usage data');
    }

    return data;
  } catch (error) {
    console.error(`[analyze-pitch-for-assets] GPT-4 API call failed (attempt ${retryCount + 1}):`, error);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const backoffMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`[analyze-pitch-for-assets] Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return callGPT4WithRetry(request, config, retryCount + 1);
    }

    throw error;
  }
}

// ============================================================================
// TRANSFORM GPT-4 RESPONSE TO ASSET IDEAS
// ============================================================================

function transformToAssetIdeas(
  gpt4Ideas: Array<{
    category: string;
    type: string;
    format: string;
    description: string;
    prompt: string;
    priority?: number;
    notes?: string;
  }>,
  request: AnalyzePitchRequest
): AssetIdea[] {
  return gpt4Ideas.map(idea => {
    // Determine generation API based on asset type
    const generationAPI: 'dall-e-3' | 'openai-video' = idea.type.includes('video') ? 'openai-video' : 'dall-e-3';

    // Determine generation model (default to standard quality)
    const generationModel: 'dall-e-3' | 'dall-e-3-hd' = 'dall-e-3';

    return {
      asset_category: idea.category as AssetIdea['asset_category'],
      asset_type: idea.type as AssetIdea['asset_type'],
      asset_format: idea.format as AssetIdea['asset_format'],
      description: idea.description,
      prompt_template: idea.prompt,
      generation_api: generationAPI,
      generation_model: generationModel,
      priority: idea.priority,
      estimated_cost: estimateAssetCost(generationAPI, generationModel),
    };
  });
}

// ============================================================================
// DATABASE OPERATIONS (ISOLATED - ONLY title_marketing_assets TABLE)
// ============================================================================

async function insertAssetIdeas(
  supabase: ReturnType<typeof createClient>,
  assetIdeas: AssetIdea[],
  request: AnalyzePitchRequest
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Transform to database insert format
    // ISOLATED DESIGN: title_id and title_name passed from request (no DB lookup)
    const inserts: MarketingAssetInsert[] = assetIdeas.map(idea => ({
      title_id: request.title_id,
      title_name: request.title_name,
      asset_category: idea.asset_category,
      asset_type: idea.asset_type,
      asset_format: idea.asset_format,
      description: idea.description,
      prompt_template: idea.prompt_template,
      prompt_used: null,
      image_url: null,
      video_url: null,
      generation_api: idea.generation_api,
      generation_model: idea.generation_model,
      generation_cost: 0,
      generation_attempts: 0,
      error_message: null,
      status: 'pending' as const,
      approved: false,
      approved_by_email: null,
      approved_at: null,
    }));

    // CRITICAL: This is the ONLY database write operation
    // NO queries to titles, admin, or any other existing tables
    const { data, error } = await supabase
      .from('title_marketing_assets')
      .insert(inserts)
      .select();

    if (error) {
      console.error('[analyze-pitch-for-assets] Database insert error:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('[analyze-pitch-for-assets] Database operation error:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// ============================================================================
// ERROR RESPONSE HELPER
// ============================================================================

function errorResponse(code: string, message: string, status: number, req?: Request): Response {
  const errorBody: AnalyzePitchError = {
    success: false,
    error: {
      code,
      message,
    },
  };

  console.error(`[analyze-pitch-for-assets] Error response: ${code} - ${message}`);

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(req?.headers.get('origin') || null),
    },
  });
}

// ============================================================================
// LOGGING HELPER
// ============================================================================

// Note: Initialization logging moved inside serve() handler to avoid boot errors
