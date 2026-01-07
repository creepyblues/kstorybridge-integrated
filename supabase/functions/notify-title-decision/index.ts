import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DecisionNotificationPayload {
  draftId: string
  decision: 'approved' | 'rejected'
  rejectionReason?: string
}

interface DraftData {
  title_name_kr?: string
  title_name_en?: string
}

interface CreatorRecord {
  full_name: string
  pen_name?: string
}

// Format date for display
function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  return new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
}

// Generate approval email HTML
function generateApprovalEmailHtml(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  approvedAt: string
}): string {
  const creatorUrl = 'https://creator.kstorybridge.com/titles'
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Title Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Title Approved!
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Great news - your submission has been approved
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${data.creatorName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                We're excited to let you know that your title submission has been reviewed and approved!
              </p>

              <!-- Title Info Card -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Title</span>
                      <div style="color: #14532d; font-size: 18px; font-weight: 600; margin-top: 4px;">${titleDisplay}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</span>
                      <div style="margin-top: 4px;">
                        <span style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">APPROVED</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Approved On</span>
                      <div style="color: #14532d; font-size: 14px; margin-top: 4px;">${formatDate(data.approvedAt)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Your title is now live on KStoryBridge and available for discovery by media buyers looking for Korean content.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${creatorUrl}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  View in Creator Dashboard
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

// Generate rejection email HTML
function generateRejectionEmailHtml(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  rejectionReason: string
  rejectedAt: string
  draftId: string
}): string {
  const editUrl = `https://creator.kstorybridge.com/titles/${data.draftId}/edit`
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback on Your Title Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Feedback on Your Submission
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                We've reviewed your title and have some feedback
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${data.creatorName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for submitting your title to KStoryBridge. After careful review, we have some feedback that we'd like to share with you.
              </p>

              <!-- Title Info Card -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Title</span>
                      <div style="color: #1e3a8a; font-size: 18px; font-weight: 600; margin-top: 4px;">${titleDisplay}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</span>
                      <div style="margin-top: 4px;">
                        <span style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">NEEDS REVISION</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reviewed On</span>
                      <div style="color: #1e3a8a; font-size: 14px; margin-top: 4px;">${formatDate(data.rejectedAt)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Feedback Box -->
              <div style="background-color: #fefce8; border: 1px solid #fef08a; border-left: 4px solid #eab308; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="color: #854d0e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600;">
                  Feedback from our team
                </div>
                <div style="color: #713f12; font-size: 15px; line-height: 1.6;">
                  ${data.rejectionReason}
                </div>
              </div>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                We encourage you to review the feedback and make any necessary updates. Once you've revised your submission, you can resubmit it for review.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${editUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Revise & Resubmit
                </a>
              </div>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Have questions? Feel free to reach out to us at <a href="mailto:support@kstorybridge.com" style="color: #3b82f6;">support@kstorybridge.com</a>
              </p>
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

// Generate plain text emails
function generateApprovalEmailText(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  approvedAt: string
}): string {
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  return `
Title Approved!
===============

Hi ${data.creatorName},

Great news! Your title submission has been reviewed and approved.

Title: ${titleDisplay}
Status: APPROVED
Approved On: ${formatDate(data.approvedAt)}

Your title is now live on KStoryBridge and available for discovery by media buyers looking for Korean content.

View in Creator Dashboard:
https://creator.kstorybridge.com/titles

---
This is an automated notification from KStoryBridge.
  `.trim()
}

function generateRejectionEmailText(data: {
  titleKr: string
  titleEn?: string
  creatorName: string
  rejectionReason: string
  rejectedAt: string
  draftId: string
}): string {
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  return `
Feedback on Your Title Submission
==================================

Hi ${data.creatorName},

Thank you for submitting your title to KStoryBridge. After careful review, we have some feedback that we'd like to share with you.

Title: ${titleDisplay}
Status: NEEDS REVISION
Reviewed On: ${formatDate(data.rejectedAt)}

FEEDBACK FROM OUR TEAM:
${data.rejectionReason}

We encourage you to review the feedback and make any necessary updates. Once you've revised your submission, you can resubmit it for review.

Revise & Resubmit:
https://creator.kstorybridge.com/titles/${data.draftId}/edit

Have questions? Feel free to reach out to us at support@kstorybridge.com

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
  decision: 'approved' | 'rejected'
  rejectionReason?: string
  timestamp: string
}): string {
  const titleDisplay = data.titleEn
    ? `${data.titleKr} / ${data.titleEn}`
    : data.titleKr

  const emoji = data.decision === 'approved' ? ':white_check_mark:' : ':x:'
  const statusText = data.decision === 'approved' ? 'Title Approved' : 'Title Rejected'

  let message = `${emoji} *${statusText}*

*Title:* ${titleDisplay}
*Creator:* ${data.creatorName} (${data.creatorEmail})
*Time:* ${formatDate(data.timestamp)}`

  if (data.decision === 'rejected' && data.rejectionReason) {
    message += `\n*Reason:* ${data.rejectionReason}`
  }

  return message
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
    const payload: DecisionNotificationPayload = await req.json()
    const { draftId, decision, rejectionReason } = payload

    if (!draftId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: draftId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'Invalid decision: must be "approved" or "rejected"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (decision === 'rejected' && !rejectionReason) {
      return new Response(
        JSON.stringify({ error: 'Rejection reason is required when decision is "rejected"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[notify-title-decision] Processing ${decision} notification for draft: ${draftId}`)

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
      .select('draft_data, creator_id, approved_at, rejected_at, rejection_reason')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      console.error('[notify-title-decision] Draft not found:', draftError)
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
      console.error('[notify-title-decision] Auth user not found:', authError)
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

    const creatorName = creatorProfile?.full_name || creatorProfile?.pen_name || 'Creator'

    // Prepare notification data
    const titleKr = draftData.title_name_kr || 'Untitled'
    const titleEn = draftData.title_name_en
    const timestamp = decision === 'approved'
      ? (draft.approved_at || new Date().toISOString())
      : (draft.rejected_at || new Date().toISOString())
    const reason = rejectionReason || draft.rejection_reason || ''

    console.log('[notify-title-decision] Sending notification:', {
      title: titleKr,
      creator: creatorName,
      email: creatorEmail,
      decision,
    })

    // Track results
    const results = {
      emailSent: false,
      slackSent: false,
      errors: [] as string[],
    }

    // Send email to creator
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        let emailHtml: string
        let emailText: string
        let subject: string

        if (decision === 'approved') {
          emailHtml = generateApprovalEmailHtml({
            titleKr,
            titleEn,
            creatorName,
            approvedAt: timestamp,
          })
          emailText = generateApprovalEmailText({
            titleKr,
            titleEn,
            creatorName,
            approvedAt: timestamp,
          })
          subject = `Your title "${titleKr}" has been approved!`
        } else {
          emailHtml = generateRejectionEmailHtml({
            titleKr,
            titleEn,
            creatorName,
            rejectionReason: reason,
            rejectedAt: timestamp,
            draftId,
          })
          emailText = generateRejectionEmailText({
            titleKr,
            titleEn,
            creatorName,
            rejectionReason: reason,
            rejectedAt: timestamp,
            draftId,
          })
          subject = `Feedback on your title "${titleKr}"`
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'KStoryBridge <noreply@kstorybridge.com>',
            to: creatorEmail,
            bcc: 'kstorybridge@gmail.com',
            subject,
            html: emailHtml,
            text: emailText,
          }),
        })

        if (emailResponse.ok) {
          console.log(`[notify-title-decision] Email sent to: ${creatorEmail}`)
          results.emailSent = true
        } else {
          const errorText = await emailResponse.text()
          console.error(`[notify-title-decision] Email failed:`, errorText)
          results.errors.push(`Email failed: ${errorText}`)
        }
      } catch (emailError) {
        console.error(`[notify-title-decision] Email error:`, emailError)
        results.errors.push(`Email error: ${emailError}`)
      }
    } else {
      console.warn('[notify-title-decision] RESEND_API_KEY not configured')
      results.errors.push('Email service not configured')
    }

    // Send Slack notification (for admin visibility)
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (slackWebhookUrl) {
      try {
        const slackMessage = generateSlackMessage({
          titleKr,
          titleEn,
          creatorName,
          creatorEmail,
          decision,
          rejectionReason: reason,
          timestamp,
        })

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
          console.log('[notify-title-decision] Slack notification sent')
          results.slackSent = true
        } else {
          const errorText = await slackResponse.text()
          console.error('[notify-title-decision] Slack notification failed:', errorText)
          results.errors.push(`Slack notification failed: ${errorText}`)
        }
      } catch (slackError) {
        console.error('[notify-title-decision] Slack error:', slackError)
        results.errors.push(`Slack error: ${slackError}`)
      }
    } else {
      console.warn('[notify-title-decision] SLACK_WEBHOOK_URL not configured')
    }

    console.log('[notify-title-decision] Notification complete:', results)

    // Return success even if some notifications failed (fire-and-forget pattern)
    return new Response(
      JSON.stringify({
        success: true,
        results: {
          emailSent: results.emailSent,
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
    console.error('[notify-title-decision] Unexpected error:', error)
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
