// Edge Function: mandate-matcher
// Version: 2.0
// Created: 2025-11-21
// Updated: 2025-12-14
// Description: Matches producer mandates to titles using vector similarity search + AI explanations

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

// Generate AI explanations for mandate matches using GPT-4o-mini
async function generateAIExplanations(
  mandateText: string,
  matches: TitleMatch[]
): Promise<AIExplanation[]> {
  if (!OPENAI_API_KEY || matches.length === 0) {
    return [];
  }

  try {
    const titlesContext = matches.map((m, i) => `
${i + 1}. "${m.title_name_en}" (ID: ${m.title_id}, ${m.match_score}% match)
   Synopsis: ${(m.synopsis || '').slice(0, 250)}${(m.synopsis || '').length > 250 ? '...' : ''}
   Genre: ${m.genre?.join(', ') || 'N/A'}
   Tone: ${m.tone || 'N/A'}
   Format: ${m.content_format || 'N/A'}`).join('\n');

    const prompt = `You are a Hollywood development executive analyzing Korean IP for media buyers.

BUYER'S MANDATE: "${mandateText}"

Analyze why each Korean title below matches this mandate. Focus on:
- Specific narrative or thematic connections to what the buyer is seeking
- Story elements, characters, or themes that align with their criteria
- What makes this title suitable for their development needs

TITLES TO ANALYZE:
${titlesContext}

For EACH title, provide:
1. "explanation": Exactly 2 sentences explaining WHY this matches the mandate. Be specific - reference actual story elements, not just genre keywords.
2. "highlights": Exactly 3 brief bullet points (3-6 words each) of key match reasons.

Return valid JSON:
{
  "results": [
    { "title_id": "uuid-here", "explanation": "Two sentences here.", "highlights": ["Point 1", "Point 2", "Point 3"] }
  ]
}`;

    console.log("🤖 Generating AI explanations for", matches.length, "titles...");

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
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ AI explanation API error:", error);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ Empty AI response");
      return [];
    }

    const parsed = JSON.parse(content);
    const results = parsed.results || [];

    console.log(`✅ AI explanations generated for ${results.length} titles`);

    // Calculate GPT-4o-mini cost (~$0.15/1M input, ~$0.60/1M output)
    const usage = data.usage || {};
    const aiCost = ((usage.prompt_tokens || 0) * 0.00000015) + ((usage.completion_tokens || 0) * 0.0000006);
    console.log(`💰 AI explanation cost: $${aiCost.toFixed(6)}`);

    return results;
  } catch (error) {
    console.error("❌ AI explanation generation failed:", error);
    return [];
  }
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

    // Step 5: Generate AI explanations for matches
    const aiExplanations = await generateAIExplanations(mandate_text, initialResults);

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

    // Step 6: Save search to database (only if save_search is true)
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
