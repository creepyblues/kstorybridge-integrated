// Express Interest edge function
// A logged-in buyer signals licensing interest in a title. Inserts a
// title_interests row (deduped per buyer+title), notifies the team via
// Slack, and emails the team. Team-mediated: no creator contact info is
// exposed to the buyer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpressInterestPayload {
  title_id: string
  note?: string
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Identify the caller from their JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await anonClient.auth.getUser()

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: ExpressInterestPayload = await req.json()
    if (!payload.title_id) {
      return new Response(JSON.stringify({ success: false, error: 'title_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const note = (payload.note ?? '').slice(0, 2000)
    const buyerEmail = user.email.toLowerCase()
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Look up title + buyer profile for the notification
    const [{ data: title, error: titleError }, { data: buyer }] = await Promise.all([
      admin
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, slug')
        .eq('title_id', payload.title_id)
        .single(),
      admin
        .from('user_buyers')
        .select('full_name, buyer_company, tier')
        .eq('email', buyerEmail)
        .maybeSingle(),
    ])

    if (titleError || !title) {
      return new Response(JSON.stringify({ success: false, error: 'Title not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const interestRecord = {
      title_id: payload.title_id,
      buyer_email: buyerEmail,
      buyer_name: buyer?.full_name ?? null,
      buyer_company: buyer?.buyer_company ?? null,
      note: note || null,
    }

    // Insert first so the unique constraint remains the authoritative dedupe gate.
    const { error: insertError } = await admin
      .from('title_interests')
      .insert(interestRecord)

    if (insertError) {
      if (insertError.code === '23505') {
        // Preserve the prior product behavior of refreshing the note, but do not
        // create another business outcome, notification, or analytics event.
        const { error: updateError } = await admin
          .from('title_interests')
          .update({
            buyer_name: interestRecord.buyer_name,
            buyer_company: interestRecord.buyer_company,
            note: interestRecord.note,
          })
          .eq('title_id', payload.title_id)
          .eq('buyer_email', buyerEmail)

        if (updateError) {
          console.error('[express-interest] duplicate refresh failed:', updateError)
          return new Response(JSON.stringify({ success: false, error: 'Failed to refresh interest' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ success: true, created: false }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.error('[express-interest] insert failed:', insertError)
      return new Response(JSON.stringify({ success: false, error: 'Failed to record interest' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const titleName = title.title_name_en || title.title_name_kr || title.title_id
    const titleUrl = `https://dashboard.kstorybridge.com/buyers/titles/${title.slug ?? title.title_id}`

    // Slack notification (non-blocking)
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (slackWebhookUrl) {
      const slackMessage = {
        text: `💰 Buyer interest: ${titleName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:moneybag: *Buyer expressed interest in a title*\n<${titleUrl}|${titleName}>`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Buyer:*\n${buyer?.full_name ?? 'Unknown'} (${buyerEmail})` },
              { type: 'mrkdwn', text: `*Company:*\n${buyer?.buyer_company ?? 'N/A'}` },
              { type: 'mrkdwn', text: `*Tier:*\n${buyer?.tier ?? 'unknown'}` },
              { type: 'mrkdwn', text: `*Note:*\n${note || '—'}` },
            ],
          },
        ],
      }
      fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      }).catch((err) => console.error('[express-interest] Slack notify failed:', err))
    }

    // Team email via Resend (non-blocking)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const teamEmail = Deno.env.get('TEAM_NOTIFICATION_EMAIL') ?? 'info@kstorybridge.com'
    if (resendApiKey) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'KStoryBridge <noreply@kstorybridge.com>',
          to: [teamEmail],
          subject: `Buyer interest: ${titleName}`,
          html: `
            <h2>A buyer expressed interest in a title</h2>
            <p><strong>Title:</strong> <a href="${escapeHtml(titleUrl)}">${escapeHtml(titleName)}</a></p>
            <p><strong>Buyer:</strong> ${escapeHtml(buyer?.full_name ?? 'Unknown')} (${escapeHtml(buyerEmail)})</p>
            <p><strong>Company:</strong> ${escapeHtml(buyer?.buyer_company ?? 'N/A')} &middot; <strong>Tier:</strong> ${escapeHtml(buyer?.tier ?? 'unknown')}</p>
            <p><strong>Note:</strong> ${escapeHtml(note || '—').replace(/\n/g, '<br>')}</p>
          `,
        }),
      }).catch((err) => console.error('[express-interest] team email failed:', err))
    }

    return new Response(JSON.stringify({ success: true, created: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[express-interest] unexpected error:', error)
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
