/**
 * Search Cache Utilities
 *
 * Provides semantic caching for AI search features to reduce latency and API costs.
 *
 * Features:
 * - Semantic query cache: Finds cached results for similar queries (embedding similarity)
 * - LLM reranking cache: Exact match cache for Comps Navigator re-ranking results
 * - Cache hit tracking and statistics
 *
 * Expected performance:
 * - Cache hit: 50-100ms (vs 2-10s for full search)
 * - Hit rates: Mandate 40-60%, Comps 20-40%
 * - Cost savings: 40-70% reduction in OpenAI API costs
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

// Cache configuration
const SEMANTIC_SIMILARITY_THRESHOLD = 0.92; // High threshold for quality
const CACHE_TTL_DAYS = 7;
const MAX_CACHE_SIZE_PER_FEATURE = 10000;

export type FeatureType = 'comps' | 'mandate' | 'chat';

export interface CachedQueryResult {
  id: string;
  query_text: string;
  response_data: any;
  similarity: number;
  hit_count: number;
  created_at: string;
}

export interface CachedRerankingResult {
  id: string;
  reranking_results: any;
  hit_count: number;
  created_at: string;
}

export interface CacheStats {
  cache_type: string;
  feature_type: string;
  total_entries: number;
  total_hits: number;
  hit_rate_pct: number;
}

/**
 * Generate MD5 hash for cache key
 */
export function generateQueryHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = new Uint8Array(16);

  // Simple hash for cache key (not cryptographic)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate cache key for LLM reranking (Comps Navigator)
 */
export function generateRerankingCacheKey(
  compTitles: string[],
  refinementText: string | undefined,
  candidateIds: string[]
): string {
  const sortedTitles = [...compTitles].sort().join('|').toLowerCase();
  const refinement = (refinementText || '').toLowerCase().trim();
  const sortedCandidates = [...candidateIds].sort().join('|');

  const combined = `${sortedTitles}::${refinement}::${sortedCandidates}`;
  return generateQueryHash(combined);
}

/**
 * Check semantic cache for similar query
 *
 * @param supabase - Supabase client
 * @param queryEmbedding - Query embedding vector (1536 dims)
 * @param featureType - Feature type ('comps', 'mandate', 'chat')
 * @param similarityThreshold - Minimum similarity for cache hit (default 0.92)
 * @returns Cached result or null if no match
 */
export async function checkSemanticCache(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  featureType: FeatureType,
  similarityThreshold: number = SEMANTIC_SIMILARITY_THRESHOLD
): Promise<CachedQueryResult | null> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc('find_similar_cached_query', {
      p_query_embedding: queryEmbedding,
      p_feature_type: featureType,
      p_similarity_threshold: similarityThreshold,
      p_limit: 1
    });

    if (error) {
      console.warn(`[CACHE] Semantic cache lookup error:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      const cached = data[0];
      const lookupTime = Date.now() - startTime;

      console.log(`[CACHE] ✅ Semantic cache HIT for ${featureType}`, {
        similarity: cached.similarity.toFixed(4),
        hit_count: cached.hit_count + 1,
        lookup_time_ms: lookupTime
      });

      // Update hit count asynchronously (fire-and-forget)
      supabase.rpc('update_cache_hit', {
        p_cache_id: cached.id,
        p_cache_type: 'query'
      }).catch(err => console.warn('[CACHE] Failed to update hit count:', err));

      return cached;
    }

    console.log(`[CACHE] ❌ Semantic cache MISS for ${featureType}`, {
      lookup_time_ms: Date.now() - startTime
    });

    return null;
  } catch (error) {
    console.error(`[CACHE] Semantic cache error:`, error);
    return null;
  }
}

/**
 * Check exact match cache (by query hash)
 */
export async function checkExactCache(
  supabase: SupabaseClient,
  queryText: string,
  featureType: FeatureType
): Promise<CachedQueryResult | null> {
  const queryHash = generateQueryHash(queryText);

  try {
    const { data, error } = await supabase
      .from('search_query_cache')
      .select('id, query_text, response_data, hit_count, created_at')
      .eq('query_hash', queryHash)
      .eq('feature_type', featureType)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    console.log(`[CACHE] ✅ Exact cache HIT for ${featureType}`);

    // Update hit count asynchronously
    supabase.rpc('update_cache_hit', {
      p_cache_id: data.id,
      p_cache_type: 'query'
    }).catch(err => console.warn('[CACHE] Failed to update hit count:', err));

    return { ...data, similarity: 1.0 };
  } catch (error) {
    return null;
  }
}

/**
 * Store query result in semantic cache
 */
export async function storeInSemanticCache(
  supabase: SupabaseClient,
  featureType: FeatureType,
  queryText: string,
  queryEmbedding: number[],
  responseData: any,
  options?: {
    compTitles?: string[];
    refinementText?: string;
    resultCount?: number;
    avgMatchScore?: number;
  }
): Promise<string | null> {
  const queryHash = generateQueryHash(queryText);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  try {
    const { data, error } = await supabase
      .from('search_query_cache')
      .upsert({
        query_hash: queryHash,
        feature_type: featureType,
        query_text: queryText,
        query_embedding: queryEmbedding,
        response_data: responseData,
        comp_titles: options?.compTitles,
        refinement_text: options?.refinementText,
        result_count: options?.resultCount || 0,
        avg_match_score: options?.avgMatchScore,
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      }, {
        onConflict: 'query_hash,feature_type'
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`[CACHE] Failed to store in cache:`, error.message);
      return null;
    }

    console.log(`[CACHE] 💾 Stored in semantic cache for ${featureType}`, {
      query_length: queryText.length,
      result_count: options?.resultCount
    });

    return data?.id || null;
  } catch (error) {
    console.error(`[CACHE] Store error:`, error);
    return null;
  }
}

/**
 * Check LLM reranking cache (Comps Navigator)
 */
export async function checkRerankingCache(
  supabase: SupabaseClient,
  compTitles: string[],
  refinementText: string | undefined,
  candidateIds: string[]
): Promise<CachedRerankingResult | null> {
  const cacheKey = generateRerankingCacheKey(compTitles, refinementText, candidateIds);

  try {
    const { data, error } = await supabase
      .from('llm_reranking_cache')
      .select('id, reranking_results, hit_count, created_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.log(`[CACHE] ❌ Reranking cache MISS`);
      return null;
    }

    console.log(`[CACHE] ✅ Reranking cache HIT`, {
      hit_count: data.hit_count + 1,
      comp_titles: compTitles.join(', ')
    });

    // Update hit count asynchronously
    supabase.rpc('update_cache_hit', {
      p_cache_id: data.id,
      p_cache_type: 'reranking'
    }).catch(err => console.warn('[CACHE] Failed to update hit count:', err));

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Store LLM reranking result in cache
 */
export async function storeRerankingResult(
  supabase: SupabaseClient,
  compTitles: string[],
  refinementText: string | undefined,
  candidateIds: string[],
  rerankingResults: any,
  options?: {
    modelUsed?: string;
    tokensUsed?: number;
    estimatedCost?: number;
  }
): Promise<string | null> {
  const cacheKey = generateRerankingCacheKey(compTitles, refinementText, candidateIds);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  try {
    const { data, error } = await supabase
      .from('llm_reranking_cache')
      .upsert({
        cache_key: cacheKey,
        comp_titles: compTitles,
        refinement_text: refinementText,
        candidate_ids: candidateIds,
        reranking_results: rerankingResults,
        model_used: options?.modelUsed || 'gpt-4o-mini',
        tokens_used: options?.tokensUsed,
        estimated_cost: options?.estimatedCost,
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      }, {
        onConflict: 'cache_key'
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`[CACHE] Failed to store reranking result:`, error.message);
      return null;
    }

    console.log(`[CACHE] 💾 Stored reranking result`, {
      comp_titles: compTitles.join(', '),
      candidates: candidateIds.length
    });

    return data?.id || null;
  } catch (error) {
    console.error(`[CACHE] Store reranking error:`, error);
    return null;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(
  supabase: SupabaseClient
): Promise<CacheStats[]> {
  try {
    const { data, error } = await supabase
      .from('cache_statistics')
      .select('*');

    if (error) {
      console.warn(`[CACHE] Failed to get stats:`, error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Log cache performance metrics
 */
export function logCacheMetrics(
  featureType: FeatureType,
  isHit: boolean,
  lookupTimeMs: number,
  similarity?: number
): void {
  console.log(`[CACHE_METRICS]`, {
    feature: featureType,
    hit: isHit,
    lookup_ms: lookupTimeMs,
    similarity: similarity?.toFixed(4),
    timestamp: new Date().toISOString()
  });
}
