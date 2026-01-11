import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsReportPayload {
  reportType: 'daily' | 'weekly' | 'funnel' | 'sources' | 'realtime'
  reportDate: string
  reportMarkdown: string
  alerts?: string[]
  sendSlack?: boolean
}

interface AdminRecord {
  email: string
  full_name: string
}

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

    // Parse request body
    const payload: AnalyticsReportPayload = await req.json()
    const { reportType, reportDate, reportMarkdown, alerts, sendSlack = true } = payload

    if (!reportType || !reportDate || !reportMarkdown) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: reportType, reportDate, reportMarkdown' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[send-analytics-report] Processing ${reportType} report for ${reportDate}`)

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
      console.error('[send-analytics-report] Error fetching admins:', adminError)
      results.errors.push(`Failed to fetch admins: ${adminError.message}`)
    }

    // Convert markdown to HTML
    const reportHtml = markdownToHtml(reportMarkdown)

    // Send emails to all active admins
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey && admins && admins.length > 0) {
      const emailHtml = generateEmailHtml({
        reportType,
        reportDate,
        reportHtml,
        alerts,
      })
      const emailText = generateEmailText({
        reportType,
        reportDate,
        reportMarkdown,
        alerts,
      })
      const subject = getEmailSubject(reportType, reportDate)

      for (let i = 0; i < admins.length; i++) {
        const admin = admins[i]
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

          if (emailResponse.ok) {
            console.log(`[send-analytics-report] Email sent to: ${admin.email}`)
            results.emailsSent++
          } else {
            const errorText = await emailResponse.text()
            console.error(`[send-analytics-report] Email failed for ${admin.email}:`, errorText)
            results.emailsFailed++
            results.errors.push(`Email to ${admin.email} failed: ${errorText}`)
          }
        } catch (emailError) {
          console.error(`[send-analytics-report] Email error for ${admin.email}:`, emailError)
          results.emailsFailed++
          results.errors.push(`Email to ${admin.email} error: ${emailError}`)
        }

        // Add 500ms delay between emails to avoid Resend rate limit (2 req/sec)
        if (i < admins.length - 1) {
          await delay(500)
        }
      }
    } else if (!resendApiKey) {
      console.warn('[send-analytics-report] RESEND_API_KEY not configured')
      results.errors.push('Email service not configured')
    } else if (!admins || admins.length === 0) {
      console.warn('[send-analytics-report] No active admins found')
      results.errors.push('No active admins found')
    }

    // Send Slack notification
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (sendSlack && slackWebhookUrl) {
      try {
        const summary = extractSummary(reportMarkdown)
        const slackMessage = generateSlackMessage({
          reportType,
          reportDate,
          alerts,
          summary,
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
          console.log('[send-analytics-report] Slack notification sent')
          results.slackSent = true
        } else {
          const errorText = await slackResponse.text()
          console.error('[send-analytics-report] Slack notification failed:', errorText)
          results.errors.push(`Slack notification failed: ${errorText}`)
        }
      } catch (slackError) {
        console.error('[send-analytics-report] Slack error:', slackError)
        results.errors.push(`Slack error: ${slackError}`)
      }
    } else if (sendSlack && !slackWebhookUrl) {
      console.warn('[send-analytics-report] SLACK_WEBHOOK_URL not configured')
      results.errors.push('Slack service not configured')
    }

    console.log('[send-analytics-report] Report delivery complete:', results)

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
    console.error('[send-analytics-report] Unexpected error:', error)
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
