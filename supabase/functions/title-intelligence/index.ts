/**
 * Title Intelligence Edge Function
 *
 * Purpose: Orchestrates data collection from multiple sources (Naver, Kakao, Reddit, AO3)
 *
 * Flow:
 * 1. Receive request with title name and sources
 * 2. Create intelligence record in database (status: in_progress)
 * 3. Call scraper modules sequentially with rate limiting
 * 4. Aggregate results and update database record
 * 5. Return collection results
 *
 * Rate Limiting:
 * - 1 request per 3 seconds for Naver/Kakao (avoid detection)
 * - No rate limit for Reddit API
 * - No rate limit for AO3 (community scraping)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import scraper modules
import { scrapeNaver } from './scrapers/naver.ts'
import { scrapeKakao } from './scrapers/kakao.ts'
import { scrapeReddit } from './scrapers/reddit.ts'
import { scrapeAO3 } from './scrapers/ao3.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntelligenceRequest {
  titleNameInput: string
  sources: string[]  // e.g., ['naver', 'kakao', 'reddit', 'ao3']
  collectedBy: string  // Admin email
  titleId?: string  // Optional: link to existing title
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin')
      .select('email, active')
      .eq('email', user.email.toLowerCase())
      .eq('active', true)
      .single()

    if (adminError || !adminProfile) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const body: IntelligenceRequest = await req.json()
    const { titleNameInput, sources, collectedBy, titleId } = body

    if (!titleNameInput || !sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: titleNameInput, sources' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create intelligence record
    const { data: intelligenceRecord, error: createError } = await supabase
      .from('title_intelligence_data')
      .insert({
        title_name_input: titleNameInput,
        title_id: titleId || null,
        collected_by: collectedBy,
        sources_requested: sources,
        collection_status: 'in_progress',
        raw_data: {},
        collection_errors: {}
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create intelligence record:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create intelligence record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Collect data from each source
    const rawData: Record<string, any> = {}
    const collectionErrors: Record<string, string> = {}
    let hasErrors = false

    for (const source of sources) {
      try {
        console.log(`Collecting data from ${source}...`)

        let data = null

        switch (source) {
          case 'naver':
            data = await scrapeNaver(titleNameInput)
            // Rate limit: wait 3 seconds before next request
            if (sources.indexOf(source) < sources.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
            break

          case 'kakao':
            data = await scrapeKakao(titleNameInput)
            // Rate limit: wait 3 seconds before next request
            if (sources.indexOf(source) < sources.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
            break

          case 'reddit':
            data = await scrapeReddit(titleNameInput)
            break

          case 'ao3':
            data = await scrapeAO3(titleNameInput)
            break

          default:
            console.warn(`Unknown source: ${source}`)
            collectionErrors[source] = 'Unknown source'
            hasErrors = true
            continue
        }

        if (data) {
          rawData[source] = data
        } else {
          collectionErrors[source] = 'No data returned'
          hasErrors = true
        }

      } catch (error) {
        console.error(`Error scraping ${source}:`, error)
        collectionErrors[source] = error.message || 'Unknown error'
        hasErrors = true
      }
    }

    // Determine final status
    const finalStatus = hasErrors
      ? (Object.keys(rawData).length > 0 ? 'partial_failure' : 'failed')
      : 'completed'

    // Update intelligence record with results
    const { error: updateError } = await supabase
      .from('title_intelligence_data')
      .update({
        raw_data: rawData,
        collection_errors: collectionErrors,
        collection_status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', intelligenceRecord.id)

    if (updateError) {
      console.error('Failed to update intelligence record:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        intelligenceId: intelligenceRecord.id,
        status: finalStatus,
        sourcesCollected: Object.keys(rawData),
        errors: collectionErrors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
