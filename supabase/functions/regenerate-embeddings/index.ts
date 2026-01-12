import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegenerateRequest {
  limit?: number; // Number of titles to regenerate (default: 50)
  start_index?: number; // Start from this index (for pagination)
  title_id?: string; // Single title mode: regenerate embedding for specific title
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let requestData: RegenerateRequest = {}

    try {
      requestData = await req.json()
    } catch (e) {
      console.log('[REGEN] No request body, using defaults')
    }

    // Single title mode: process specific title by ID
    if (requestData.title_id) {
      console.log('[REGEN] Single title mode:', requestData.title_id)
      return await processSingleTitle(supabaseClient, requestData.title_id, startTime)
    }

    const limit = requestData.limit || 50
    const startIndex = requestData.start_index || 0

    console.log('[REGEN] Starting batch embedding regeneration', {
      limit,
      start_index: startIndex
    })

    // Fetch titles without embeddings, ordered by views (most popular first)
    const { data: titles, error: fetchError } = await supabaseClient
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        synopsis_kr,
        genre,
        tone,
        perfect_for,
        audience,
        views
      `)
      .is('combined_embedding', null)
      .order('views', { ascending: false, nullsLast: true })
      .range(startIndex, startIndex + limit - 1)

    if (fetchError) {
      throw new Error(`Failed to fetch titles: ${fetchError.message}`)
    }

    if (!titles || titles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No titles need regeneration',
          processed: 0,
          total_duration_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[REGEN] Found', titles.length, 'titles to process')

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Process each title
    for (const title of titles) {
      const titleName = title.title_name_en || title.title_name_kr || 'Unknown'
      console.log('[REGEN] Processing:', titleName)

      try {
        // Create embedding text from multiple fields
        const embeddingParts = [
          title.title_name_en || '',
          title.title_name_kr || '',
          title.synopsis || '',
          title.synopsis_kr || '',
          (title.genre || []).join(' '),
          title.tone || '',
          title.perfect_for || '',
          title.audience || ''
        ].filter(Boolean)

        const embeddingText = embeddingParts.join(' ').trim()

        if (!embeddingText) {
          console.log('[REGEN] Skipped (no text):', titleName)
          results.skipped++
          continue
        }

        // Generate embedding using OpenAI
        const embedding = await generateEmbedding(embeddingText.substring(0, 8000))

        if (!embedding) {
          results.failed++
          results.errors.push(`${titleName}: Failed to generate embedding`)
          continue
        }

        // Validate dimension
        if (embedding.length !== 1536) {
          results.failed++
          results.errors.push(`${titleName}: Wrong dimension (${embedding.length})`)
          continue
        }

        // Update database
        const { error: updateError } = await supabaseClient
          .from('titles')
          .update({
            combined_embedding: embedding,
            embedding_model: 'text-embedding-ada-002',
            embedding_updated_at: new Date().toISOString()
          })
          .eq('title_id', title.title_id)

        if (updateError) {
          results.failed++
          results.errors.push(`${titleName}: ${updateError.message}`)
        } else {
          results.success++
          console.log('[REGEN] Success:', titleName)
        }

      } catch (error) {
        results.failed++
        results.errors.push(`${titleName}: ${error.message}`)
      }
    }

    const totalDuration = Date.now() - startTime
    const estimatedCost = results.success * 0.0001

    console.log('[REGEN] Complete', {
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      duration_ms: totalDuration,
      cost: estimatedCost
    })

    return new Response(
      JSON.stringify({
        success: true,
        processed: titles.length,
        results,
        total_duration_ms: totalDuration,
        estimated_cost: estimatedCost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[REGEN] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processSingleTitle(
  supabaseClient: any,
  titleId: string,
  startTime: number
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  try {
    // Fetch single title by ID
    const { data: title, error: fetchError } = await supabaseClient
      .from('titles')
      .select(`
        title_id,
        title_name_en,
        title_name_kr,
        synopsis,
        synopsis_kr,
        genre,
        tone,
        perfect_for,
        audience
      `)
      .eq('title_id', titleId)
      .single()

    if (fetchError) {
      console.error('[REGEN] Failed to fetch title:', fetchError.message)
      return new Response(
        JSON.stringify({ error: `Title not found: ${fetchError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const titleName = title.title_name_en || title.title_name_kr || 'Unknown'
    console.log('[REGEN] Processing single title:', titleName)

    // Create embedding text from multiple fields
    const embeddingParts = [
      title.title_name_en || '',
      title.title_name_kr || '',
      title.synopsis || '',
      title.synopsis_kr || '',
      (title.genre || []).join(' '),
      title.tone || '',
      title.perfect_for || '',
      title.audience || ''
    ].filter(Boolean)

    const embeddingText = embeddingParts.join(' ').trim()

    if (!embeddingText) {
      console.log('[REGEN] Skipped (no text):', titleName)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Title has no text content for embedding',
          title_id: titleId,
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(embeddingText.substring(0, 8000))

    if (!embedding) {
      console.error('[REGEN] Failed to generate embedding for:', titleName)
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate dimension
    if (embedding.length !== 1536) {
      console.error('[REGEN] Wrong dimension:', embedding.length)
      return new Response(
        JSON.stringify({ error: `Wrong embedding dimension: ${embedding.length}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update database
    const { error: updateError } = await supabaseClient
      .from('titles')
      .update({
        combined_embedding: embedding,
        embedding_model: 'text-embedding-ada-002',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', titleId)

    if (updateError) {
      console.error('[REGEN] Failed to update title:', updateError.message)
      return new Response(
        JSON.stringify({ error: `Failed to update: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalDuration = Date.now() - startTime
    console.log('[REGEN] Single title success:', titleName, 'in', totalDuration, 'ms')

    return new Response(
      JSON.stringify({
        success: true,
        title_id: titleId,
        title_name: titleName,
        total_duration_ms: totalDuration,
        estimated_cost: 0.0001
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[REGEN] Single title error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[REGEN] OpenAI API error:', error)
      return null
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('[REGEN] Exception generating embedding:', error)
    return null
  }
}
