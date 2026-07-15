import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  isServiceRoleRequest,
  validateInvocationKey,
} from '../_shared/analytics-report-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface AnalyticsReportPayload {
  reportType: 'daily' | 'weekly' | 'funnel' | 'sources' | 'realtime'
  reportDate: string
  reportMarkdown: string
  reportRunId?: string
  auditReportType?: 'daily' | 'weekly' | 'funnel' | 'sources' | 'realtime' | 'progress'
  invocationKey?: string
  alerts?: string[]
  sendSlack?: boolean
}

interface AdminRecord {
  id: string
  email: string
  full_name: string
}

interface DeliveryRecord {
  admin_id: string | null
  channel: 'email' | 'slack'
  status: 'pending' | 'sent' | 'failed'
}

type DeliveryErrorCode =
  | 'resend_http_error'
  | 'resend_network_error'
  | 'resend_not_configured'
  | 'admin_recipient_missing'
  | 'slack_http_error'
  | 'slack_network_error'
  | 'slack_not_configured'

// Helper function to add delay between API calls
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Get report title based on type
function getReportTitle(reportType: string): string {
  const titles: Record<string, string> = {
    daily: 'Daily Analytics Report',
    weekly: 'Weekly Analytics Report',
    funnel: 'Funnel Analysis Report',
    sources: 'Traffic Sources Report',
    realtime: 'Realtime Analytics Report',
  }
  return titles[reportType] || 'Analytics Report'
}

// Get email subject based on type
function getEmailSubject(reportType: string, reportDate: string): string {
  const prefixes: Record<string, string> = {
    daily: 'Daily Report',
    weekly: 'Weekly Report',
    funnel: 'Funnel Analysis',
    sources: 'Traffic Sources',
    realtime: 'Realtime Report',
  }
  return `[Analytics] ${prefixes[reportType] || 'Report'} - ${reportDate}`
}

// Convert markdown tables to HTML tables
function markdownTableToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  let html = ''
  let inTable = false
  let isHeaderRow = true

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check if this is a table row (starts and ends with |)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Skip separator rows (|---|---|)
      if (line.match(/^\|[\s\-:|]+\|$/)) {
        isHeaderRow = false
        continue
      }

      if (!inTable) {
        html += '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">\n'
        inTable = true
      }

      const cells = line.split('|').filter(cell => cell.trim() !== '')
      const cellTag = isHeaderRow ? 'th' : 'td'
      const cellStyle = isHeaderRow
        ? 'background: #F3F4F6; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #374151;'
        : 'padding: 12px; border-bottom: 1px solid #E5E7EB; color: #111827;'

      html += '<tr>'
      for (const cell of cells) {
        let cellContent = cell.trim()
        // Color negative changes red, positive green
        if (cellContent.match(/^-\d+%?$/) || cellContent.includes('-') && cellContent.includes('%')) {
          cellContent = `<span style="color: #EF4444; font-weight: 600;">${cellContent}</span>`
        } else if (cellContent.match(/^\+?\d+%$/) && !cellContent.startsWith('-')) {
          cellContent = `<span style="color: #10B981; font-weight: 600;">${cellContent}</span>`
        }
        // Bold **text**
        cellContent = cellContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Code `text`
        cellContent = cellContent.replace(/`([^`]+)`/g, '<code style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-size: 12px;">$1</code>')
        html += `<${cellTag} style="${cellStyle}">${cellContent}</${cellTag}>`
      }
      html += '</tr>\n'
    } else {
      if (inTable) {
        html += '</table>\n'
        inTable = false
        isHeaderRow = true
      }
    }
  }

  if (inTable) {
    html += '</table>\n'
  }

  return html
}

// Convert full markdown to HTML
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '')  // Remove main title (we use header instead)

  // Convert bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Convert code blocks
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/g, '').trim()
    return `<pre style="background: #F3F4F6; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5;"><code>${code}</code></pre>`
  })

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">$1</code>')

  // Convert bullet lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 4px 0; color: #374151;">$1</li>')
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="margin: 12px 0; padding-left: 24px;">$&</ul>')

  // Convert numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin: 4px 0; color: #374151;">$1</li>')

  // Convert horizontal rules
  html = html.replace(/^---+$/gm, '<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">')

  // Convert tables
  html = markdownTableToHtml(html)

  // Convert paragraphs (lines that aren't already HTML)
  html = html.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('<') && !trimmed.startsWith('|')) {
      return `<p style="margin: 8px 0; color: #374151; line-height: 1.6;">${trimmed}</p>`
    }
    return line
  }).join('\n')

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '')

  return html
}

// Generate HTML email template
function generateEmailHtml(data: {
  reportType: string
  reportDate: string
  reportHtml: string
  alerts?: string[]
}): string {
  const title = getReportTitle(data.reportType)
  const hasAlerts = data.alerts && data.alerts.length > 0

  const alertsHtml = hasAlerts ? `
    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; color: #92400E; font-size: 14px; font-weight: 600;">
        Alerts Triggered
      </h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${data.alerts!.map(alert => `<li style="color: #92400E; margin: 4px 0;">${alert}</li>`).join('')}
      </ul>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4C9C9B 0%, #3a7a79 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${title}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${data.reportDate}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${alertsHtml}

              <!-- Report Content -->
              <div style="font-size: 14px;">
                ${data.reportHtml}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://analytics.google.com/analytics/web/#/p496541587/reports/intelligenthome"
                   style="display: inline-block; background: linear-gradient(135deg, #4C9C9B 0%, #3a7a79 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  View in GA4
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated analytics report from KStoryBridge.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">
                Generated by /analytics skill
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
  reportType: string
  reportDate: string
  reportMarkdown: string
  alerts?: string[]
}): string {
  const title = getReportTitle(data.reportType)
  const hasAlerts = data.alerts && data.alerts.length > 0

  let text = `${title}\n${'='.repeat(title.length)}\n\n`
  text += `Report Date: ${data.reportDate}\n\n`

  if (hasAlerts) {
    text += `ALERTS:\n`
    data.alerts!.forEach(alert => {
      text += `  - ${alert}\n`
    })
    text += '\n'
  }

  text += data.reportMarkdown
  text += '\n\n---\n'
  text += 'View in GA4: https://analytics.google.com/analytics/web/#/p496541587/reports/intelligenthome\n'
  text += '\nThis is an automated analytics report from KStoryBridge.'

  return text
}

// Generate Slack message
function generateSlackMessage(data: {
  reportType: string
  reportDate: string
  alerts?: string[]
  summary?: string
}): string {
  const title = getReportTitle(data.reportType)
  const hasAlerts = data.alerts && data.alerts.length > 0
  const emoji = hasAlerts ? ':warning:' : ':chart_with_upwards_trend:'

  let message = `${emoji} *${title}*\n`
  message += `_${data.reportDate}_\n\n`

  if (hasAlerts) {
    message += `*Alerts:*\n`
    data.alerts!.forEach(alert => {
      message += `  :red_circle: ${alert}\n`
    })
    message += '\n'
  }

  if (data.summary) {
    message += data.summary + '\n\n'
  }

  message += `<https://analytics.google.com/analytics/web/#/p496541587/reports/intelligenthome|View in GA4>`

  return message
}

// Extract summary from markdown (first few key metrics)
function extractSummary(markdown: string): string {
  const lines = markdown.split('\n')
  const summaryLines: string[] = []

  // Look for Traffic Overview section and extract key metrics
  let inOverview = false
  for (const line of lines) {
    if (line.includes('Traffic Overview') || line.includes('## Traffic')) {
      inOverview = true
      continue
    }
    if (inOverview && line.startsWith('##')) {
      break
    }
    if (inOverview && line.includes('|') && !line.includes('---')) {
      // Extract metrics from table
      const cells = line.split('|').map(c => c.trim()).filter(c => c)
      if (cells.length >= 2 && !cells[0].toLowerCase().includes('metric')) {
        summaryLines.push(`• ${cells[0]}: ${cells[1]}`)
      }
    }
  }

  return summaryLines.slice(0, 4).join('\n')
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[send-analytics-report] Required server configuration is missing')
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!isServiceRoleRequest(req.headers.get('Authorization'), serviceRoleKey)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const payload: AnalyticsReportPayload = await req.json()
    const {
      reportType,
      reportDate,
      reportMarkdown,
      reportRunId: requestedReportRunId,
      auditReportType = reportType,
      invocationKey: requestedInvocationKey,
      alerts,
      sendSlack = true,
    } = payload

    if (
      !reportType
      || !reportDate
      || !reportMarkdown
      || !['daily', 'weekly', 'funnel', 'sources', 'realtime'].includes(reportType)
      || !['daily', 'weekly', 'funnel', 'sources', 'realtime', 'progress'].includes(auditReportType)
      || (requestedReportRunId !== undefined
        && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedReportRunId))
      || (requestedInvocationKey !== undefined && !validateInvocationKey(requestedInvocationKey))
      || (requestedReportRunId !== undefined && requestedInvocationKey !== undefined)
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid report delivery fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[send-analytics-report] Processing ${reportType} report for ${reportDate}`)

    // Create a server-only Supabase client after exact credential validation.
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let reportRunId = requestedReportRunId
    if (!reportRunId) {
      const invocationKey = validateInvocationKey(requestedInvocationKey)
        ?? `manual-${auditReportType}:${new Date().toISOString().slice(0, 10)}:${crypto.randomUUID()}`
      const { data: claimRows, error: claimError } = await supabaseAdmin.rpc(
        'claim_analytics_report_run',
        {
          p_invocation_key: invocationKey,
          p_report_type: auditReportType,
          p_trigger_kind: 'manual',
          p_window_start: null,
          p_window_end: null,
        }
      )
      if (claimError || !claimRows?.[0]?.report_run_id) {
        throw new Error('manual_report_run_claim_failed')
      }
      reportRunId = claimRows[0].report_run_id
      if (!claimRows[0].should_execute) {
        return new Response(
          JSON.stringify({
            success: claimRows[0].run_status === 'succeeded',
            duplicate: true,
            reportRunId,
            status: claimRows[0].run_status,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const { data: reportRun, error: reportRunError } = await supabaseAdmin
      .from('analytics_report_runs')
      .select('report_type, status, expected_email_count, emails_sent, emails_failed, slack_sent')
      .eq('id', reportRunId)
      .single()
    if (reportRunError || !reportRun || reportRun.report_type !== auditReportType) {
      return new Response(
        JSON.stringify({ error: 'Report run does not match payload' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    if (reportRun.status === 'succeeded') {
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          reportRunId,
          status: reportRun.status,
          results: {
            emailsSent: reportRun.emails_sent,
            emailsFailed: reportRun.emails_failed,
            slackSent: reportRun.slack_sent,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    if (reportRun.status !== 'generating') {
      return new Response(
        JSON.stringify({
          error: 'Report run must be claimed before delivery',
          reportRunId,
          status: reportRun.status,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: activeAdmins, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, email, full_name')
      .eq('active', true) as { data: AdminRecord[] | null; error: Error | null }

    if (adminError) {
      await supabaseAdmin.rpc('fail_analytics_report_run', {
        p_report_run_id: reportRunId,
        p_error_code: 'report_delivery_request_failed',
      })
      throw new Error('active_admin_query_failed')
    }

    const { error: prepareError } = await supabaseAdmin.rpc(
      'prepare_analytics_report_deliveries',
      {
        p_report_run_id: reportRunId,
        p_admin_ids: (activeAdmins ?? []).map(admin => admin.id),
        p_send_slack: sendSlack,
      }
    )
    if (prepareError) throw new Error('delivery_prepare_failed')

    const { data: deliveryRows, error: deliveryRowsError } = await supabaseAdmin
      .from('analytics_report_recipient_deliveries')
      .select('admin_id, channel, status')
      .eq('report_run_id', reportRunId) as {
        data: DeliveryRecord[] | null
        error: Error | null
      }
    if (deliveryRowsError) throw new Error('delivery_state_query_failed')

    const emailAdminIds = (deliveryRows ?? [])
      .filter(delivery => delivery.channel === 'email' && delivery.admin_id)
      .map(delivery => delivery.admin_id as string)

    let recipientAdmins: AdminRecord[] = []
    if (emailAdminIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('admin')
        .select('id, email, full_name')
        .in('id', emailAdminIds) as { data: AdminRecord[] | null; error: Error | null }
      if (error) throw new Error('recipient_admin_query_failed')
      recipientAdmins = data ?? []
    }
    const adminsById = new Map(recipientAdmins.map(admin => [admin.id, admin]))

    const recordDelivery = async (
      adminId: string | null,
      channel: 'email' | 'slack',
      status: 'sent' | 'failed',
      errorCode: DeliveryErrorCode | null
    ) => {
      const { error } = await supabaseAdmin.rpc('record_analytics_report_delivery', {
        p_report_run_id: reportRunId,
        p_admin_id: adminId,
        p_channel: channel,
        p_status: status,
        p_error_code: errorCode,
      })
      if (error) throw new Error('delivery_result_record_failed')
    }

    const claimDelivery = async (
      adminId: string | null,
      channel: 'email' | 'slack'
    ): Promise<boolean> => {
      const { data, error } = await supabaseAdmin.rpc('claim_analytics_report_delivery', {
        p_report_run_id: reportRunId,
        p_admin_id: adminId,
        p_channel: channel,
      })
      if (error) throw new Error('delivery_claim_failed')
      return data?.[0]?.should_send === true
    }

    const reportHtml = markdownToHtml(reportMarkdown)
    const emailHtml = generateEmailHtml({ reportType, reportDate, reportHtml, alerts })
    const emailText = generateEmailText({ reportType, reportDate, reportMarkdown, alerts })
    const subject = getEmailSubject(reportType, reportDate)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    let attemptedEmailCount = 0

    for (const delivery of (deliveryRows ?? []).filter(row => row.channel === 'email')) {
      if (!delivery.admin_id || !(await claimDelivery(delivery.admin_id, 'email'))) continue
      if (attemptedEmailCount > 0) await delay(500)
      attemptedEmailCount += 1

      const admin = adminsById.get(delivery.admin_id)
      if (!admin) {
        await recordDelivery(delivery.admin_id, 'email', 'failed', 'admin_recipient_missing')
        continue
      }
      if (!resendApiKey) {
        await recordDelivery(delivery.admin_id, 'email', 'failed', 'resend_not_configured')
        continue
      }

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'KStoryBridge Analytics <noreply@kstorybridge.com>',
            to: admin.email,
            subject,
            html: emailHtml,
            text: emailText,
          }),
        })
        await recordDelivery(
          delivery.admin_id,
          'email',
          emailResponse.ok ? 'sent' : 'failed',
          emailResponse.ok ? null : 'resend_http_error'
        )
      } catch {
        await recordDelivery(delivery.admin_id, 'email', 'failed', 'resend_network_error')
      }
    }

    const slackDelivery = (deliveryRows ?? []).find(row => row.channel === 'slack')
    if (slackDelivery && await claimDelivery(null, 'slack')) {
      const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
      if (!slackWebhookUrl) {
        await recordDelivery(null, 'slack', 'failed', 'slack_not_configured')
      } else {
        try {
          const slackResponse = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: generateSlackMessage({
                reportType,
                reportDate,
                alerts,
                summary: extractSummary(reportMarkdown),
              }),
            }),
          })
          await recordDelivery(
            null,
            'slack',
            slackResponse.ok ? 'sent' : 'failed',
            slackResponse.ok ? null : 'slack_http_error'
          )
        } catch {
          await recordDelivery(null, 'slack', 'failed', 'slack_network_error')
        }
      }
    }

    const { data: finalizedRows, error: finalizeError } = await supabaseAdmin.rpc(
      'finalize_analytics_report_run',
      { p_report_run_id: reportRunId }
    )
    if (finalizeError || !finalizedRows?.[0]) throw new Error('delivery_finalize_failed')
    const finalized = finalizedRows[0]

    console.log(`[send-analytics-report] Delivery finalized with status ${finalized.run_status}`)
    return new Response(
      JSON.stringify({
        success: finalized.run_status === 'succeeded',
        reportRunId,
        status: finalized.run_status,
        results: {
          emailsSent: finalized.emails_sent,
          emailsFailed: finalized.emails_failed,
          slackSent: finalized.slack_sent,
        },
        warnings: finalized.error_codes?.length > 0 ? finalized.error_codes : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch {
    console.error('[send-analytics-report] Request failed with a controlled internal error')
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
