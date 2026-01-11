import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrialActivityPayload {
  session_id: string
  action: 'init' | 'search' | 'view'
  tool?: 'comps' | 'mandates' | 'chat'
  query_data?: {
    comps_query?: string[]
    mandate_query?: string
    chat_query?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const payload: TrialActivityPayload = await req.json()
    const { session_id, action, tool, query_data } = payload

    // Validate required fields
    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    if (action === 'init') {
      // Initialize new trial session or return existing
      const { data: existing } = await supabaseAdmin
        .from('trial_sessions')
        .select('id, session_id')
        .eq('session_id', session_id)
        .single()

      if (existing) {
        // Session already exists, update last activity
        await supabaseAdmin
          .from('trial_sessions')
          .update({ last_activity_at: now })
          .eq('session_id', session_id)

        return new Response(
          JSON.stringify({ success: true, action: 'existing', session_id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create new session
      const { error: insertError } = await supabaseAdmin
        .from('trial_sessions')
        .insert({
          session_id,
          first_visit_at: now,
          last_activity_at: now,
          tools_used: [],
          total_searches: 0,
          comps_searches: 0,
          mandate_searches: 0,
          chat_messages: 0,
          titles_viewed: 0
        })

      if (insertError) {
        console.error('Error creating trial session:', insertError)
        throw insertError
      }

      return new Response(
        JSON.stringify({ success: true, action: 'created', session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'search') {
      if (!tool) {
        return new Response(
          JSON.stringify({ success: false, error: 'tool is required for search action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get current session data
      const { data: session, error: fetchError } = await supabaseAdmin
        .from('trial_sessions')
        .select('*')
        .eq('session_id', session_id)
        .single()

      if (fetchError || !session) {
        // Session doesn't exist, create it first
        await supabaseAdmin
          .from('trial_sessions')
          .insert({
            session_id,
            first_visit_at: now,
            last_activity_at: now,
            tools_used: [tool],
            total_searches: 1,
            comps_searches: tool === 'comps' ? 1 : 0,
            mandate_searches: tool === 'mandates' ? 1 : 0,
            chat_messages: tool === 'chat' ? 1 : 0,
            titles_viewed: 0,
            last_comps_query: tool === 'comps' ? query_data?.comps_query : null,
            last_mandate_query: tool === 'mandates' ? query_data?.mandate_query : null,
            last_chat_query: tool === 'chat' ? query_data?.chat_query : null
          })

        return new Response(
          JSON.stringify({ success: true, action: 'search_recorded', session_id, tool }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update existing session
      const toolsUsed = session.tools_used || []
      if (!toolsUsed.includes(tool)) {
        toolsUsed.push(tool)
      }

      const updateData: Record<string, unknown> = {
        last_activity_at: now,
        tools_used: toolsUsed,
        total_searches: (session.total_searches || 0) + 1
      }

      // Increment tool-specific counter and update last query
      if (tool === 'comps') {
        updateData.comps_searches = (session.comps_searches || 0) + 1
        if (query_data?.comps_query) {
          updateData.last_comps_query = query_data.comps_query
        }
      } else if (tool === 'mandates') {
        updateData.mandate_searches = (session.mandate_searches || 0) + 1
        if (query_data?.mandate_query) {
          updateData.last_mandate_query = query_data.mandate_query
        }
      } else if (tool === 'chat') {
        updateData.chat_messages = (session.chat_messages || 0) + 1
        if (query_data?.chat_query) {
          updateData.last_chat_query = query_data.chat_query
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('trial_sessions')
        .update(updateData)
        .eq('session_id', session_id)

      if (updateError) {
        console.error('Error updating trial session:', updateError)
        throw updateError
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'search_recorded',
          session_id,
          tool,
          total_searches: updateData.total_searches
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'view') {
      // Increment titles viewed counter
      const { data: session } = await supabaseAdmin
        .from('trial_sessions')
        .select('titles_viewed')
        .eq('session_id', session_id)
        .single()

      const titlesViewed = (session?.titles_viewed || 0) + 1

      await supabaseAdmin
        .from('trial_sessions')
        .update({
          titles_viewed: titlesViewed,
          last_activity_at: now
        })
        .eq('session_id', session_id)

      return new Response(
        JSON.stringify({ success: true, action: 'view_recorded', session_id, titles_viewed: titlesViewed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use: init, search, or view' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in trial-activity function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
