// Edge Function: vector-search
// Version: 1.0
// Created: 2025-11-28
// Description: Semantic vector search for titles using OpenAI embeddings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface VectorSearchRequest {
  query: string;
  match_threshold?: number;
  match_count?: number;
}

interface VectorSearchResult {
  title_id: string;
  title_name_en?: string;
  title_name_kr?: string;
  synopsis?: string;
  description?: string;
  genre?: string[];
  tone?: string;
  content_format?: string;
  title_image?: string;
  similarity: number;
}

interface VectorSearchResponse {
  results: VectorSearchResult[];
  query: string;
  count: number;
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
    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const {
      query,
      match_threshold = 0.4,
      match_count = 30
    }: VectorSearchRequest = await req.json();

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`🔍 Vector search for: "${query.substring(0, 100)}..."`);

    // Step 1: Generate embedding for query using OpenAI
    console.log("📊 Generating embedding...");
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-ada-002",
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

    // Step 2: Vector search using RPC function
    console.log(`🔍 Searching with threshold=${match_threshold}, limit=${match_count}...`);
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "match_titles_by_embedding",
      {
        query_embedding: embedding,
        match_threshold: match_threshold,
        match_count: match_count,
      }
    );

    if (searchError) {
      throw new Error(`Vector search error: ${searchError.message}`);
    }

    const results: VectorSearchResult[] = searchResults || [];
    const processingTime = Date.now() - startTime;

    console.log(`✅ Vector search complete: ${results.length} results in ${processingTime}ms`);
    console.log(`💰 Cost: $${embeddingCost.toFixed(6)}`);

    if (results.length > 0) {
      console.log(`📊 Similarity range: ${results[0]?.similarity?.toFixed(3)} to ${results[results.length - 1]?.similarity?.toFixed(3)}`);
    }

    const response: VectorSearchResponse = {
      results,
      query,
      count: results.length,
      processing_time_ms: processingTime,
      cost_estimate: embeddingCost,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Vector search error after ${processingTime}ms:`, error);

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
