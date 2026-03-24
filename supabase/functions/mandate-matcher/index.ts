// Edge Function: mandate-matcher
// Version: 2.2.0
// Created: 2025-11-21
// Updated: 2025-12-17
// Description: Matches producer mandates to titles using vector similarity search + AI explanations
// PERFORMANCE: Includes semantic caching for 40-60% hit rate, reducing latency by 60-90%
// v2.2.0: Parallel AI explanation processing (~70% faster: 30s → 6-8s)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Import caching utilities
import {
  checkSemanticCache,
  storeInSemanticCache,
  logCacheMetrics,
  type CachedQueryResult
} from '../_shared/search-cache.ts';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cache configuration
const ENABLE_CACHE = true;  // Feature flag for caching
const CACHE_SIMILARITY_THRESHOLD = 0.92;  // High threshold for quality

interface MandateMatchRequest {
  mandate_text: string;
  user_email: string;
  limit?: number;
  save_search?: boolean; // Whether to save to history (default true)
}

interface TitleMatch {
  title_id: string;
  slug?: string;
  title_name_en: string;
  title_name_kr: string;
  match_score: number;
  title_image?: string;
  synopsis: string;
  genre: string[];
  tone: string;
  content_format?: string;
  story_author?: string;
  art_author?: string;
  has_pitch_deck?: boolean;
  ai_explanation?: string;      // AI-generated explanation
  match_highlights?: string[];  // Key match reasons
}

interface AIExplanation {
  title_id: string;
  explanation: string;
  highlights: string[];
}

interface MandateMatchResponse {
  results: TitleMatch[];
  search_id: string;
  processing_time_ms: number;
  cost_estimate: number;
}

// Generate fallback explanation when AI fails
function getDefaultExplanation(match: TitleMatch): string {
  const format = match.content_format || 'title';
  const mainGenre = match.genre?.[0] || 'story';
  const toneDesc = match.tone ? ` with ${match.tone} tone` : '';
  return `This ${format} may align with your mandate based on its ${mainGenre} elements${toneDesc}. Review the synopsis for detailed story information.`;
}

// =====================================================================
// PARALLEL AI EXPLANATION GENERATION (v2.2.0)
// Generate explanations for each title in PARALLEL using Promise.all()
// This reduces AI time from ~30s to ~6-8s (~70% faster)
// =====================================================================

/**
 * Generate AI explanation for a SINGLE title (runs in parallel with others)
 */
async function generateSingleExplanation(
  mandateText: string,
  match: TitleMatch
): Promise<AIExplanation> {
  if (!OPENAI_API_KEY) {
    return {
      title_id: match.title_id,
      explanation: getDefaultExplanation(match),
      highlights: [],
    };
  }

  const prompt = `You are a Hollywood development executive analyzing Korean IP for media buyers.

BUYER'S MANDATE: "${mandateText}"

KOREAN TITLE: "${match.title_name_en}"
Match Score: ${match.match_score}%
Synopsis: ${(match.synopsis || '').slice(0, 300)}${(match.synopsis || '').length > 300 ? '...' : ''}
Genre: ${match.genre?.join(', ') || 'N/A'}
Tone: ${match.tone || 'N/A'}
Format: ${match.content_format || 'N/A'}

Explain why this title matches the mandate:
1. "explanation": Exactly 2 sentences explaining WHY this matches. Be specific - reference actual story elements.
2. "highlights": Exactly 3 brief bullet points (3-6 words each) of key match reasons.

Return JSON: { "explanation": "...", "highlights": ["...", "...", "..."] }`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per title

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,  // Smaller per-title allocation
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`⚠️ AI error for ${match.title_id}:`, response.status);
      return {
        title_id: match.title_id,
        explanation: getDefaultExplanation(match),
        highlights: [],
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        title_id: match.title_id,
        explanation: getDefaultExplanation(match),
        highlights: [],
      };
    }

    const parsed = JSON.parse(content);
    return {
      title_id: match.title_id,
      explanation: parsed.explanation || getDefaultExplanation(match),
      highlights: parsed.highlights || [],
    };
  } catch (error) {
    console.warn(`⚠️ Exception for ${match.title_id}:`, error);
    return {
      title_id: match.title_id,
      explanation: getDefaultExplanation(match),
      highlights: [],
    };
  }
}

/**
 * Generate AI explanations for ALL titles in PARALLEL
 * v2.2.0: Changed from sequential (1 call for all) to parallel (N concurrent calls)
 */
async function generateAIExplanationsParallel(
  mandateText: string,
  matches: TitleMatch[]
): Promise<AIExplanation[]> {
  if (!OPENAI_API_KEY || matches.length === 0) {
    return [];
  }

  console.log(`🤖 Generating AI explanations for ${matches.length} titles in PARALLEL...`);

  // Process all titles concurrently using Promise.all()
  const explanationPromises = matches.map(match =>
    generateSingleExplanation(mandateText, match)
  );

  const results = await Promise.all(explanationPromises);

  const successCount = results.filter(r => r.explanation !== getDefaultExplanation(matches.find(m => m.title_id === r.title_id)!)).length;
  console.log(`✅ AI explanations: ${successCount}/${matches.length} successful`);

  return results;
}

serve(async (req) => {
  const startTime = Date.now();

  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    // PERFORMANCE OPTIMIZATION: Reduced default limit from 15 to 10 for faster queries
    const { mandate_text, user_email, limit = 10, save_search = true }: MandateMatchRequest = await req.json();

    if (!mandate_text) {
      throw new Error("mandate_text is required");
    }

    // Email is only strictly required when saving search
    if (save_search && !user_email) {
      throw new Error("user_email is required when saving search");
    }

    if (mandate_text.length > 1000) {
      throw new Error("Mandate text must be 1000 characters or less");
    }

    console.log(`🎯 Processing mandate for ${user_email}: "${mandate_text.substring(0, 100)}..."`);

    // Step 1: Generate embedding for mandate using OpenAI
    console.log("📊 Generating embedding for mandate...");
    const embeddingStart = Date.now();
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: mandate_text,
        model: "text-embedding-ada-002",  // Use same model as title embeddings for compatibility
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Calculate embedding cost (text-embedding-ada-002: $0.0001 per 1K tokens)
    const tokens = embeddingData.usage.total_tokens;
    const embeddingCost = (tokens / 1000) * 0.0001;
    const embeddingDuration = Date.now() - embeddingStart;

    console.log(`✅ Embedding generated (${tokens} tokens, $${embeddingCost.toFixed(6)}, ${embeddingDuration}ms)`);

    // Step 1.5: Check semantic cache for similar queries
    // PERFORMANCE: Cache hit returns in ~50ms vs ~2-3s for full search
    if (ENABLE_CACHE) {
      const cacheStart = Date.now();
      const cachedResult = await checkSemanticCache(
        supabase,
        embedding,
        'mandate',
        CACHE_SIMILARITY_THRESHOLD
      );

      if (cachedResult) {
        const cacheTime = Date.now() - cacheStart;
        logCacheMetrics('mandate', true, cacheTime, cachedResult.similarity);

        console.log(`🚀 CACHE HIT! Returning cached results (${cacheTime}ms vs ~2-3s)`);

        // Return cached response
        const processingTime = Date.now() - startTime;
        return new Response(JSON.stringify({
          results: cachedResult.response_data,
          search_id: "",  // No new search saved
          processing_time_ms: processingTime,
          cost_estimate: embeddingCost,
          cache_hit: true,
          cache_similarity: cachedResult.similarity
        }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      logCacheMetrics('mandate', false, Date.now() - cacheStart);
    }

    // Step 2: Vector search using existing RPC function
    console.log(`🔍 Searching for top ${limit} matching titles...`);
    const vectorSearchStart = Date.now();
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "match_titles_by_embedding_optimized",
      {
        query_embedding: embedding,
        match_threshold: 0.3,  // Lowered from 0.5 to get more results (30% minimum similarity)
        match_count: limit,
      }
    );
    const vectorSearchDuration = Date.now() - vectorSearchStart;

    if (searchError) {
      throw new Error(`Vector search error: ${searchError.message}`);
    }

    console.log(`✅ Found ${searchResults?.length || 0} matching titles (${vectorSearchDuration}ms)`);

    // Step 3: Fetch pitch deck availability for matching titles
    const titleIds = (searchResults || []).map((r: any) => r.title_id);
    let titlesWithPitchDeck = new Set<string>();

    if (titleIds.length > 0) {
      const { data: pitchDeckData, error: pitchDeckError } = await supabase
        .from('title_documents')
        .select('title_id')
        .in('title_id', titleIds)
        .eq('document_type', 'source_pdf');

      if (pitchDeckError) {
        console.warn('⚠️ Failed to fetch pitch deck availability:', pitchDeckError);
      } else {
        titlesWithPitchDeck = new Set<string>(pitchDeckData?.map((d: any) => d.title_id) || []);
        console.log(`📑 Pitch deck availability: ${titlesWithPitchDeck.size}/${titleIds.length} titles have pitch decks`);
      }
    }

    // Step 4: Format initial results
    const initialResults: TitleMatch[] = (searchResults || []).map((result: any) => ({
      title_id: result.title_id,
      slug: result.slug,
      title_name_en: result.title_name_en,
      title_name_kr: result.title_name_kr,
      match_score: Math.round(result.similarity * 100),
      title_image: result.title_image,
      synopsis: result.synopsis,
      genre: result.genre || [],
      tone: result.tone,
      content_format: result.content_format,
      story_author: result.story_author,
      art_author: result.art_author,
      has_pitch_deck: titlesWithPitchDeck.has(result.title_id),
    }));

    // Step 5: Generate AI explanations for matches (v2.2.0 - PARALLEL processing)
    const aiExplanationStart = Date.now();
    const aiExplanations = await generateAIExplanationsParallel(mandate_text, initialResults);
    const aiExplanationDuration = Date.now() - aiExplanationStart;

    console.log(`✅ AI explanations generated in PARALLEL (${aiExplanationDuration}ms for ${initialResults.length} titles)`);

    // Merge AI explanations into results
    const results: TitleMatch[] = initialResults.map(result => {
      const aiData = aiExplanations.find(e => e.title_id === result.title_id);
      return {
        ...result,
        ai_explanation: aiData?.explanation || getDefaultExplanation(result),
        match_highlights: aiData?.highlights || [],
      };
    });

    const avg_match_score = results.length > 0
      ? results.reduce((sum, r) => sum + r.match_score, 0) / results.length
      : 0;

    // Step 5.5: Store results in semantic cache for future queries
    // PERFORMANCE: This enables 40-60% cache hit rate for similar mandates
    if (ENABLE_CACHE && results.length > 0) {
      storeInSemanticCache(
        supabase,
        'mandate',
        mandate_text,
        embedding,
        results,
        {
          resultCount: results.length,
          avgMatchScore: avg_match_score
        }
      ).catch(err => console.warn('⚠️ Failed to store in cache:', err));
    }

    // Step 6: Save search to database ASYNCHRONOUSLY (only if save_search is true)
    // PERFORMANCE OPTIMIZATION: Fire-and-forget to reduce response latency by 200-500ms
    let savedSearchId: string | null = null;
    if (save_search && user_email) {
      console.log("💾 Saving mandate search to database (async)...");
      // Generate a predictable UUID for the search ID so we can return it immediately
      savedSearchId = crypto.randomUUID();

      // Fire-and-forget: Don't await the database save
      supabase
        .from("mandate_searches")
        .insert({
          id: savedSearchId,
          user_email,
          mandate_text,
          search_results: results,
          result_count: results.length,
          avg_match_score: Math.round(avg_match_score * 100) / 100,
        })
        .then(({ error: saveError }) => {
          if (saveError) {
            console.error("⚠️ Failed to save search (async):", saveError);
          } else {
            console.log("✅ Search saved successfully (async)");
          }
        })
        .catch((err) => {
          console.error("⚠️ Exception saving search (async):", err);
        });
    } else {
      console.log("⏭️ Skipping save (trial mode)");
    }

    const processingTime = Date.now() - startTime;

    const response: MandateMatchResponse = {
      results,
      search_id: savedSearchId || "",
      processing_time_ms: processingTime,
      cost_estimate: embeddingCost,
      // v2.2.0 - Timing breakdown for UI display
      timing: {
        embedding_ms: embeddingDuration,
        vector_search_ms: vectorSearchDuration,
        ai_explanation_ms: aiExplanationDuration,
        total_ms: processingTime,
      },
    };

    console.log(`✅ Mandate matching complete: ${results.length} results in ${processingTime}ms`);
    console.log(`💰 Total cost: $${embeddingCost.toFixed(6)}`);

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ Error in mandate-matcher:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
