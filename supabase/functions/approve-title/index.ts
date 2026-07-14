import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApprovePayload {
  draftId: string
  adminUserId: string
}

interface DraftData {
  // Basic Info
  title_name_kr?: string
  title_name_en?: string
  is_official_english_title?: boolean
  tagline?: string
  tagline_kr?: string
  synopsis?: string
  synopsis_kr?: string
  genre?: string[]
  genre_kr?: string[]
  content_format?: string
  tone?: string
  audience?: string
  age_rating?: string

  // Authors
  story_author?: string
  story_author_kr?: string
  art_author?: string
  art_author_kr?: string
  original_author?: string
  original_author_kr?: string
  script_title_kr?: string
  script_title_en?: string
  art_title_kr?: string
  art_title_en?: string
  underlying_novel_kr?: string
  underlying_novel_en?: string

  // Story Details
  inspiration?: string
  important_issues?: string
  setting_description?: string
  world_lore?: string
  supernatural_concepts?: string
  character_details?: Record<string, unknown>
  story_structure?: string
  planned_ending?: string
  narrative_arc?: string

  // Rights & Business
  rights?: string
  rights_holder_name?: string
  rights_holder_company?: string
  cp?: string
  keywords?: string[]
  comps?: string[]
  perfect_for?: string

  // Achievements & Metrics
  awards?: string[]
  sales_records?: string
  merchandise_deals?: string
  print_editions?: boolean
  print_edition_details?: string
  media_coverage?: string
  celebrity_endorsements?: string
  creator_achievements?: Record<string, unknown>
  views?: number
  likes?: number
  rating?: number
  rating_count?: number
  chapters?: number
  completed?: string

  // Media
  title_image?: string
  title_url?: string

  // Notes
  note?: string
  note_kr?: string
  priority?: string
  verified?: boolean
}

async function sendApprovalNotification(draftId: string): Promise<void> {
  try {
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-title-decision`
    const notifyResponse = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ draftId, decision: 'approved' }),
    })

    if (notifyResponse.ok) {
      console.log('[approve-title] Notification sent successfully')
    } else {
      console.warn('[approve-title] Notification failed (non-blocking):', await notifyResponse.text())
    }
  } catch (notifyError) {
    console.warn('[approve-title] Notification error (non-blocking):', notifyError)
  }
}

function approvalSuccessResponse(titleId: string, recovered = false): Response {
  return new Response(
    JSON.stringify({
      success: true,
      titleId,
      recovered,
      message: recovered
        ? 'Title approval recovered successfully'
        : 'Title approved and created successfully',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const payload: ApprovePayload = await req.json()
    const { draftId, adminUserId } = payload

    if (!draftId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: draftId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: adminUserId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[approve-title] Processing approval for draft: ${draftId} by admin: ${adminUserId}`)

    // Create Supabase admin client
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

    // Fetch draft data
    const { data: draft, error: draftError } = await supabaseAdmin
      .from('title_drafts')
      .select('*')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      console.error('[approve-title] Draft not found:', draftError)
      return new Response(
        JSON.stringify({ error: 'Draft not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (draft.status === 'approved' && draft.published_title_id) {
      console.log('[approve-title] Approval already complete:', {
        draftId,
        titleId: draft.published_title_id,
      })
      return approvalSuccessResponse(draft.published_title_id, true)
    }

    // Verify draft is in 'submitted' status
    if (draft.status !== 'submitted') {
      return new Response(
        JSON.stringify({ error: `Draft cannot be approved. Current status: ${draft.status}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const draftData = draft.draft_data as DraftData
    const creatorId = draft.creator_id

    // Recover an approval where the catalog insert succeeded but the draft update failed.
    const { data: previouslyPublished, error: recoveryLookupError } = await supabaseAdmin
      .from('titles')
      .select('title_id')
      .eq('source_draft_id', draftId)
      .maybeSingle()

    if (recoveryLookupError) {
      console.error('[approve-title] Failed to check publication recovery:', recoveryLookupError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify prior publication' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (previouslyPublished) {
      const recoveredAt = new Date().toISOString()
      const { error: recoveryUpdateError } = await supabaseAdmin
        .from('title_drafts')
        .update({
          status: 'approved',
          approved_at: recoveredAt,
          approved_by: adminUserId,
          published_title_id: previouslyPublished.title_id,
          updated_at: recoveredAt,
        })
        .eq('id', draftId)
        .eq('status', 'submitted')
        .select('id')
        .single()

      if (recoveryUpdateError) {
        console.error('[approve-title] Failed to recover draft linkage:', recoveryUpdateError)
        return new Response(
          JSON.stringify({ error: 'Failed to recover draft publication linkage' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      await sendApprovalNotification(draftId)
      return approvalSuccessResponse(previouslyPublished.title_id, true)
    }

    console.log('[approve-title] Draft data:', {
      titleKr: draftData.title_name_kr,
      titleEn: draftData.title_name_en,
      creatorId,
    })

    // Check for duplicate title (same creator with same EN+KR name pair)
    // A creator can have multiple titles with same EN name if KR names differ
    {
      let dupQuery = supabaseAdmin
        .from('titles')
        .select('title_id, title_name_kr, title_name_en')
        .eq('creator_id', creatorId)

      if (draftData.title_name_en?.trim()) {
        dupQuery = dupQuery.ilike('title_name_en', draftData.title_name_en.trim())
      } else {
        dupQuery = dupQuery.or('title_name_en.is.null,title_name_en.eq.')
      }

      if (draftData.title_name_kr?.trim()) {
        dupQuery = dupQuery.eq('title_name_kr', draftData.title_name_kr.trim())
      } else {
        dupQuery = dupQuery.or('title_name_kr.is.null,title_name_kr.eq.')
      }

      const { data: existingTitle } = await dupQuery.maybeSingle()

      if (existingTitle) {
        console.warn('[approve-title] Duplicate title found:', existingTitle.title_id)
        return new Response(
          JSON.stringify({
            error: 'A title with this name already exists for this creator',
            existingTitleId: existingTitle.title_id
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Prepare title data for insertion
    const now = new Date().toISOString()
    const titleData = {
      // Basic Info
      title_name_kr: draftData.title_name_kr || null,
      title_name_en: draftData.title_name_en || null,
      is_official_english_title: draftData.is_official_english_title ?? null,
      tagline: draftData.tagline || null,
      tagline_kr: draftData.tagline_kr || null,
      synopsis: draftData.synopsis || null,
      synopsis_kr: draftData.synopsis_kr || null,
      genre: draftData.genre || null,
      genre_kr: draftData.genre_kr || null,
      content_format: draftData.content_format || null,
      tone: draftData.tone || null,
      audience: draftData.audience || null,
      age_rating: draftData.age_rating || null,

      // Authors
      story_author: draftData.story_author || null,
      story_author_kr: draftData.story_author_kr || null,
      art_author: draftData.art_author || null,
      art_author_kr: draftData.art_author_kr || null,
      original_author: draftData.original_author || null,
      original_author_kr: draftData.original_author_kr || null,
      script_title_kr: draftData.script_title_kr || null,
      script_title_en: draftData.script_title_en || null,
      art_title_kr: draftData.art_title_kr || null,
      art_title_en: draftData.art_title_en || null,
      underlying_novel_kr: draftData.underlying_novel_kr || null,
      underlying_novel_en: draftData.underlying_novel_en || null,

      // Story Details
      inspiration: draftData.inspiration || null,
      important_issues: draftData.important_issues || null,
      setting_description: draftData.setting_description || null,
      world_lore: draftData.world_lore || null,
      supernatural_concepts: draftData.supernatural_concepts || null,
      character_details: draftData.character_details || null,
      story_structure: draftData.story_structure || null,
      planned_ending: draftData.planned_ending || null,
      narrative_arc: draftData.narrative_arc || null,

      // Rights & Business
      rights: draftData.rights || null,
      rights_holder_name: draftData.rights_holder_name || null,
      rights_holder_company: draftData.rights_holder_company || null,
      cp: draftData.cp || null,
      keywords: draftData.keywords || null,
      comps: draftData.comps || null,
      perfect_for: draftData.perfect_for || null,

      // Achievements & Metrics
      awards: draftData.awards || null,
      sales_records: draftData.sales_records || null,
      merchandise_deals: draftData.merchandise_deals || null,
      print_editions: draftData.print_editions ?? null,
      print_edition_details: draftData.print_edition_details || null,
      media_coverage: draftData.media_coverage || null,
      celebrity_endorsements: draftData.celebrity_endorsements || null,
      creator_achievements: draftData.creator_achievements || null,
      views: draftData.views ?? null,
      likes: draftData.likes ?? null,
      rating: draftData.rating ?? null,
      rating_count: draftData.rating_count ?? null,
      chapters: draftData.chapters ?? null,
      completed: draftData.completed || null,

      // Media
      title_image: draftData.title_image || null,
      title_url: draftData.title_url || null,

      // Notes
      note: draftData.note || null,
      note_kr: draftData.note_kr || null,

      // System fields - set defaults for immediate visibility
      creator_id: creatorId,
      source_draft_id: draftId,
      verified: true, // Approved titles are immediately visible
      priority: '2', // Priority: 1=low, 2=medium, 3=high
      created_at: now,
      updated_at: now,
    }

    console.log('[approve-title] Inserting title into titles table...')

    // Insert into titles table
    const { data: newTitle, error: insertError } = await supabaseAdmin
      .from('titles')
      .insert(titleData)
      .select('title_id')
      .single()

    if (insertError) {
      console.error('[approve-title] Failed to insert title:', insertError)
      return new Response(
        JSON.stringify({
          error: 'Failed to create title',
          details: insertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const titleId = newTitle.title_id
    console.log('[approve-title] Title created successfully:', titleId)

    // Update draft status to approved
    const { error: updateError } = await supabaseAdmin
      .from('title_drafts')
      .update({
        status: 'approved',
        approved_at: now,
        approved_by: adminUserId,
        published_title_id: titleId,
        updated_at: now,
      })
      .eq('id', draftId)
      .eq('status', 'submitted')
      .select('id')
      .single()

    if (updateError) {
      console.error('[approve-title] Failed to update draft status:', updateError)
      return new Response(
        JSON.stringify({
          error: 'Title was created but draft linkage failed; retry approval to recover',
          titleId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[approve-title] Draft status updated to approved')

    await sendApprovalNotification(draftId)

    console.log('[approve-title] Approval complete:', {
      draftId,
      titleId,
      adminUserId,
    })

    return approvalSuccessResponse(titleId)

  } catch (error) {
    console.error('[approve-title] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
