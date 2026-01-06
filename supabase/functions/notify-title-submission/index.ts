import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  draftId: string
  submittedAt?: string
}

interface DraftData {
  title_name_kr?: string
  title_name_en?: string
  rights_holder_name?: string
  rights_available?: string[]
}

interface AdminRecord {
  email: string
  full_name: string
}

interface CreatorRecord {
  full_name: string
  pen_name?: string
}

// Format rights array to readable string
function formatRights(rights?: string[]): string {
  if (!rights || rights.length === 0) return 'Not specified'

  const rightsMap: Record<string, string> = {
    film_tv: 'Film & TV',
    animation: 'Animation',
    publication: 'Publication',
    merchandising: 'Merchandising',
    game: 'Game',
    other: 'Other',
  }

  return rights.map(r => rightsMap[r] || r).join(', ')
}

// Format date for display
function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  return new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
}

// Generate HTML email template
function generateEmailHtml(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  creatorEmail: string
  rightsHolder?: string
  rightsAvailable?: string[]
  submittedAt: string
}): string {
  const adminUrl = 'https://dashboard.kstorybridge.com/admin/title-approval'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Title Submitted</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E07856 0%, #D4694A 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                New Title Submitted
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                A creator has submitted a new title for review
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Title Info Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Title (Korean)</span>
                      <div style="color: #111827; font-size: 16px; font-weight: 600; margin-top: 4px;">${data.titleKr || 'Not provided'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Title (English)</span>
                      <div style="color: #111827; font-size: 16px; margin-top: 4px;">${data.titleEn || 'Not provided'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Creator</span>
                      <div style="color: #111827; font-size: 16px; margin-top: 4px;">${data.creatorName}</div>
                      <div style="color: #6b7280; font-size: 14px;">${data.creatorEmail}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Rights Holder</span>
                      <div style="color: #111827; font-size: 16px; margin-top: 4px;">${data.rightsHolder || 'Not specified'}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Rights Available</span>
                      <div style="color: #111827; font-size: 16px; margin-top: 4px;">${formatRights(data.rightsAvailable)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted</span>
                      <div style="color: #111827; font-size: 16px; margin-top: 4px;">${formatDate(data.submittedAt)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${adminUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Review in Admin Panel
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from KStoryBridge.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Generate plain text email
function generateEmailText(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  creatorEmail: string
  rightsHolder?: string
  rightsAvailable?: string[]
  submittedAt: string
}): string {
  return `
New Title Submitted for Review
==============================

Title (Korean): ${data.titleKr || 'Not provided'}
Title (English): ${data.titleEn || 'Not provided'}
Creator: ${data.creatorName} (${data.creatorEmail})
Rights Holder: ${data.rightsHolder || 'Not specified'}
Rights Available: ${formatRights(data.rightsAvailable)}
Submitted: ${formatDate(data.submittedAt)}

Review in Admin Panel:
https://dashboard.kstorybridge.com/admin/title-approval

---
This is an automated notification from KStoryBridge.
  `.trim()
}

// Generate Slack message
function generateSlackMessage(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  creatorEmail: string
  rightsHolder?: string
  rightsAvailable?: string[]
  submittedAt: string
}): string {
  const adminUrl = 'https://dashboard.kstorybridge.com/admin/title-approval'
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  return `:memo: *New Title Submitted for Review*

*Title:* ${titleDisplay}
*Creator:* ${data.creatorName} (${data.creatorEmail})
*Rights Holder:* ${data.rightsHolder || 'Not specified'}
*Rights Available:* ${formatRights(data.rightsAvailable)}
*Submitted:* ${formatDate(data.submittedAt)}

<${adminUrl}|Review in Admin Panel>`
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
    const payload: NotificationPayload = await req.json()
    const { draftId, submittedAt } = payload

    if (!draftId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: draftId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[notify-title-submission] Processing notification for draft: ${draftId}`)

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
      .select('draft_data, creator_id, submitted_at')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      console.error('[notify-title-submission] Draft not found:', draftError)
      return new Response(
        JSON.stringify({ error: 'Draft not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const draftData = draft.draft_data as DraftData

    // Get creator info from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(draft.creator_id)

    if (authError || !authUser?.user) {
      console.error('[notify-title-submission] Auth user not found:', authError)
      return new Response(
        JSON.stringify({ error: 'Creator not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const creatorEmail = authUser.user.email || ''

    // Get creator profile from user_creators
    const { data: creatorProfile } = await supabaseAdmin
      .from('user_creators')
      .select('full_name, pen_name')
      .eq('email', creatorEmail)
      .single() as { data: CreatorRecord | null }

    const creatorName = creatorProfile?.full_name || creatorProfile?.pen_name || creatorEmail

    // Prepare notification data
    const notificationData = {
      titleKr: draftData.title_name_kr || 'Untitled',
      titleEn: draftData.title_name_en,
      creatorName,
      creatorEmail,
      rightsHolder: draftData.rights_holder_name,
      rightsAvailable: draftData.rights_available,
      submittedAt: submittedAt || draft.submitted_at || new Date().toISOString(),
    }

    console.log('[notify-title-submission] Notification data prepared:', {
      title: notificationData.titleKr,
      creator: notificationData.creatorName,
    })

    // Track results
    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      slackSent: false,
      errors: [] as string[],
    }

    // Get active admins
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('email, full_name')
      .eq('active', true) as { data: AdminRecord[] | null; error: Error | null }

    if (adminError) {
      console.error('[notify-title-submission] Error fetching admins:', adminError)
      results.errors.push(`Failed to fetch admins: ${adminError.message}`)
    }

    // Send emails to all active admins
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey && admins && admins.length > 0) {
      const emailHtml = generateEmailHtml(notificationData)
      const emailText = generateEmailText(notificationData)
      const subject = `New Title Submitted - ${notificationData.titleKr}`

      for (const admin of admins) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'KStoryBridge <noreply@kstorybridge.com>',
              to: admin.email,
              subject,
              html: emailHtml,
              text: emailText,
            }),
          })

          if (emailResponse.ok) {
            console.log(`[notify-title-submission] Email sent to: ${admin.email}`)
            results.emailsSent++
          } else {
            const errorText = await emailResponse.text()
            console.error(`[notify-title-submission] Email failed for ${admin.email}:`, errorText)
            results.emailsFailed++
            results.errors.push(`Email to ${admin.email} failed: ${errorText}`)
          }
        } catch (emailError) {
          console.error(`[notify-title-submission] Email error for ${admin.email}:`, emailError)
          results.emailsFailed++
          results.errors.push(`Email to ${admin.email} error: ${emailError}`)
        }
      }
    } else if (!resendApiKey) {
      console.warn('[notify-title-submission] RESEND_API_KEY not configured')
      results.errors.push('Email service not configured')
    } else if (!admins || admins.length === 0) {
      console.warn('[notify-title-submission] No active admins found')
      results.errors.push('No active admins found')
    }

    // Send Slack notification
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (slackWebhookUrl) {
      try {
        const slackMessage = generateSlackMessage(notificationData)
        const slackResponse = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: slackMessage,
          }),
        })

        if (slackResponse.ok) {
          console.log('[notify-title-submission] Slack notification sent')
          results.slackSent = true
        } else {
          const errorText = await slackResponse.text()
          console.error('[notify-title-submission] Slack notification failed:', errorText)
          results.errors.push(`Slack notification failed: ${errorText}`)
        }
      } catch (slackError) {
        console.error('[notify-title-submission] Slack error:', slackError)
        results.errors.push(`Slack error: ${slackError}`)
      }
    } else {
      console.warn('[notify-title-submission] SLACK_WEBHOOK_URL not configured')
      results.errors.push('Slack service not configured')
    }

    console.log('[notify-title-submission] Notification complete:', results)

    // Return success even if some notifications failed
    return new Response(
      JSON.stringify({
        success: true,
        results: {
          emailsSent: results.emailsSent,
          emailsFailed: results.emailsFailed,
          slackSent: results.slackSent,
        },
        warnings: results.errors.length > 0 ? results.errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[notify-title-submission] Unexpected error:', error)
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
