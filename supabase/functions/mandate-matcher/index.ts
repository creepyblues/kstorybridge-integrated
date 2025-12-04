// Edge Function: mandate-matcher
// Version: 1.0
// Created: 2025-11-21
// Description: Matches producer mandates to titles using vector similarity search

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MandateMatchRequest {
  mandate_text: string;
  user_email: string;
  limit?: number;
  save_search?: boolean; // Whether to save to history (default true)
}

interface TitleMatch {
  title_id: string;
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
}

interface MandateMatchResponse {
  results: TitleMatch[];
  search_id: string;
  processing_time_ms: number;
  cost_estimate: number;
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
    const { mandate_text, user_email, limit = 15, save_search = true }: MandateMatchRequest = await req.json();

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

    console.log(`✅ Embedding generated (${tokens} tokens, $${embeddingCost.toFixed(6)})`);

    // Step 2: Vector search using existing RPC function
    console.log(`🔍 Searching for top ${limit} matching titles...`);
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "match_titles_by_embedding_optimized",
      {
        query_embedding: embedding,
        match_threshold: 0.3,  // Lowered from 0.5 to get more results (30% minimum similarity)
        match_count: limit,
      }
    );

    if (searchError) {
      throw new Error(`Vector search error: ${searchError.message}`);
    }

    console.log(`✅ Found ${searchResults?.length || 0} matching titles`);

    // Step 3: Format results
    const results: TitleMatch[] = (searchResults || []).map((result: any) => ({
      title_id: result.title_id,
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
    }));

    const avg_match_score = results.length > 0
      ? results.reduce((sum, r) => sum + r.match_score, 0) / results.length
      : 0;

    // Step 4: Save search to database (only if save_search is true)
    let savedSearch: any = null;
    if (save_search && user_email) {
      console.log("💾 Saving mandate search to database...");
      const { data, error: saveError } = await supabase
        .from("mandate_searches")
        .insert({
          user_email,
          mandate_text,
          search_results: results,
          result_count: results.length,
          avg_match_score: Math.round(avg_match_score * 100) / 100,
        })
        .select()
        .single();

      if (saveError) {
        console.error("⚠️ Failed to save search:", saveError);
        // Don't throw - we can still return results
      } else {
        savedSearch = data;
      }
    } else {
      console.log("⏭️ Skipping save (trial mode)");
    }

    const processingTime = Date.now() - startTime;

    const response: MandateMatchResponse = {
      results,
      search_id: savedSearch?.id || "",
      processing_time_ms: processingTime,
      cost_estimate: embeddingCost,
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
