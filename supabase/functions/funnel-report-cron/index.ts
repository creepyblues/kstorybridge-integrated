import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildCleanProductionFilter,
  buildProductionHostFilter,
} from '../_shared/analytics-filters.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// GA4 Property Configuration
const GA4_PROPERTY_ID = '496541587'

// Funnel event names
const FUNNEL_EVENTS = [
  'first_visit',
  'email_landing_engaged',
  'trial_page_view',
  'trial_tool_selected',
  'trial_comps_search',
  'trial_mandate_search',
  'trial_chat_message_sent',
  'trial_search_completed',
  'trial_limit_reached',
  'trial_signup_cta_clicked',
  'signup_completed',
]

const PAGE_PATHS = [
  '/trial',
  '/signup',
  '/auth/callback',
  '/buyers/home',
  '/buyers/chat',
  '/',
  '/producers',
  '/signin',
]

interface GA4Row {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

interface GA4Response {
  rows?: GA4Row[]
  rowCount?: number
}

interface FunnelMetrics {
  [eventName: string]: { eventCount: number; totalUsers: number }
}

interface PageMetrics {
  [pagePath: string]: {
    activeUsers: number
    sessions: number
    bounceRate: number
    engagementRate: number
  }
}

interface LandingPageMetrics {
  landingPage: string
  sessions: number
  newUsers: number
  engagementRate: number
  bounceRate: number
}

interface SourceMetrics {
  source: string
  newUsers: number
  sessions: number
  engagementRate: number
}

interface TrafficSummary {
  activeUsers: number
  newUsers: number
  sessions: number
  engagedSessions: number
}

// Generate JWT for Google API authentication
async function generateGoogleJWT(serviceAccount: {
  client_email: string
  private_key: string
}): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Import private key
  const privateKeyPem = serviceAccount.private_key
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${unsignedToken}.${signatureB64}`
}

// Get access token from Google
async function getAccessToken(serviceAccount: {
  client_email: string
  private_key: string
}): Promise<string> {
  const jwt = await generateGoogleJWT(serviceAccount)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Run GA4 report
async function runGA4Report(
  accessToken: string,
  request: {
    dateRanges: { startDate: string; endDate: string; name?: string }[]
    dimensions: string[]
    metrics: string[]
    dimensionFilter?: object
    orderBys?: object[]
    limit?: number
  }
): Promise<GA4Response> {
  const body: Record<string, unknown> = {
    dateRanges: request.dateRanges,
    dimensions: request.dimensions.map(name => ({ name })),
    metrics: request.metrics.map(name => ({ name })),
  }

  if (request.dimensionFilter) {
    body.dimensionFilter = request.dimensionFilter
  }

  if (request.orderBys) {
    body.orderBys = request.orderBys
  }

  if (request.limit) {
    body.limit = request.limit
  }

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GA4 API error: ${error}`)
  }

  return await response.json()
}

// Parse funnel events response
function parseFunnelEvents(response: GA4Response): FunnelMetrics {
  const metrics: FunnelMetrics = {}

  if (response.rows) {
    for (const row of response.rows) {
      const eventName = row.dimensionValues[0].value
      metrics[eventName] = {
        eventCount: parseInt(row.metricValues[0].value, 10),
        totalUsers: parseInt(row.metricValues[1].value, 10),
      }
    }
  }

  return metrics
}

// Parse page performance response
function parsePagePerformance(response: GA4Response): PageMetrics {
  const metrics: PageMetrics = {}

  if (response.rows) {
    for (const row of response.rows) {
      const pagePath = row.dimensionValues[0].value
      metrics[pagePath] = {
        activeUsers: parseInt(row.metricValues[0].value, 10),
        sessions: parseInt(row.metricValues[1].value, 10),
        bounceRate: parseFloat(row.metricValues[2].value),
        engagementRate: parseFloat(row.metricValues[3].value),
      }
    }
  }

  return metrics
}

// Parse landing pages response
function parseLandingPages(response: GA4Response): LandingPageMetrics[] {
  const metrics: LandingPageMetrics[] = []

  if (response.rows) {
    for (const row of response.rows) {
      metrics.push({
        landingPage: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value, 10),
        newUsers: parseInt(row.metricValues[1].value, 10),
        engagementRate: parseFloat(row.metricValues[2].value),
        bounceRate: parseFloat(row.metricValues[3].value),
      })
    }
  }

  return metrics
}

// Parse traffic sources response
function parseTrafficSources(response: GA4Response): SourceMetrics[] {
  const metrics: SourceMetrics[] = []

  if (response.rows) {
    for (const row of response.rows) {
      metrics.push({
        source: row.dimensionValues[0].value,
        newUsers: parseInt(row.metricValues[0].value, 10),
        sessions: parseInt(row.metricValues[1].value, 10),
        engagementRate: parseFloat(row.metricValues[2].value),
      })
    }
  }

  return metrics
}

function parseTrafficSummary(response: GA4Response): TrafficSummary {
  const values = response.rows?.[0]?.metricValues || []

  return {
    activeUsers: parseInt(values[0]?.value || '0', 10),
    newUsers: parseInt(values[1]?.value || '0', 10),
    sessions: parseInt(values[2]?.value || '0', 10),
    engagedSessions: parseInt(values[3]?.value || '0', 10),
  }
}

// Generate progress bar
function progressBar(percentage: number): string {
  const filled = Math.round(percentage / 5)
  const empty = 20 - filled
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
}

// Format percentage
function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

// Generate funnel report markdown
function generateFunnelReport(
  funnel: FunnelMetrics,
  pages: PageMetrics,
  landingPages: LandingPageMetrics[],
  sources: SourceMetrics[],
  rawTraffic: TrafficSummary,
  cleanTraffic: TrafficSummary,
  days: number
): { markdown: string; alerts: string[] } {
  const alerts: string[] = []

  // Get funnel stage values
  const firstVisit = funnel['first_visit'] || { eventCount: 0, totalUsers: 0 }
  const trialPage = funnel['trial_page_view'] || { eventCount: 0, totalUsers: 0 }
  const toolSelected = funnel['trial_tool_selected'] || { eventCount: 0, totalUsers: 0 }
  const searchCompleted = funnel['trial_search_completed'] || { eventCount: 0, totalUsers: 0 }
  const ctaClicked = funnel['trial_signup_cta_clicked'] || { eventCount: 0, totalUsers: 0 }
  const signupComplete = funnel['signup_completed'] || { eventCount: 0, totalUsers: 0 }
  const emailLandingEngaged = funnel['email_landing_engaged'] || { eventCount: 0, totalUsers: 0 }

  // Tool breakdown
  const compsSearch = funnel['trial_comps_search'] || { eventCount: 0, totalUsers: 0 }
  const mandateSearch = funnel['trial_mandate_search'] || { eventCount: 0, totalUsers: 0 }
  const chatMessage = funnel['trial_chat_message_sent'] || { eventCount: 0, totalUsers: 0 }

  // Calculate conversion rates
  const trialRate = firstVisit.totalUsers > 0 ? (trialPage.totalUsers / firstVisit.totalUsers) : 0
  const toolRate = trialPage.totalUsers > 0 ? (toolSelected.totalUsers / trialPage.totalUsers) : 0
  const searchRate = toolSelected.totalUsers > 0 ? (searchCompleted.totalUsers / toolSelected.totalUsers) : 0
  const ctaRate = searchCompleted.totalUsers > 0 ? (ctaClicked.totalUsers / searchCompleted.totalUsers) : 0
  const signupRate = ctaClicked.totalUsers > 0 ? (signupComplete.totalUsers / ctaClicked.totalUsers) : 0
  const overallRate = firstVisit.totalUsers > 0 ? (signupComplete.totalUsers / firstVisit.totalUsers) : 0
  const excludedSessions = Math.max(rawTraffic.sessions - cleanTraffic.sessions, 0)
  const excludedSessionRate = rawTraffic.sessions > 0 ? excludedSessions / rawTraffic.sessions : 0

  // Check for alerts
  if (overallRate < 0.01) {
    alerts.push('Critical: Overall conversion rate <1%')
  }
  if (ctaClicked.totalUsers > 0 && signupComplete.totalUsers === 0) {
    alerts.push('Critical: Signup CTA clicks but 0% completion rate')
  }
  if (trialRate < 0.05) {
    alerts.push('Warning: First Visit to Trial rate <5%')
  }
  if (excludedSessionRate > 0.1) {
    alerts.push(`Data quality: ${formatPct(excludedSessionRate)} of production-host sessions excluded as known scanner traffic`)
  }

  // Check landing page bounce rates
  for (const lp of landingPages.slice(0, 5)) {
    if (lp.bounceRate > 0.6) {
      alerts.push(`Warning: Landing page ${lp.landingPage} has ${formatPct(lp.bounceRate)} bounce rate`)
    }
  }

  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const dateFormat = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  let markdown = `# KStoryBridge Signup Funnel Analysis

**Period**: ${dateFormat(startDate)} - ${dateFormat(endDate)} (${days} days)

---

## Data Quality Guardrail

| Metric | Raw production hosts | Clean external estimate | Excluded |
|--------|---------------------:|------------------------:|---------:|
| Sessions | ${rawTraffic.sessions} | ${cleanTraffic.sessions} | ${excludedSessions} (${formatPct(excludedSessionRate)}) |
| Active Users | ${rawTraffic.activeUsers} | ${cleanTraffic.activeUsers} | ${Math.max(rawTraffic.activeUsers - cleanTraffic.activeUsers, 0)} |
| New Users | ${rawTraffic.newUsers} | ${cleanTraffic.newUsers} | ${Math.max(rawTraffic.newUsers - cleanTraffic.newUsers, 0)} |
| Engaged Sessions | ${rawTraffic.engagedSessions} | ${cleanTraffic.engagedSessions} | ${Math.max(rawTraffic.engagedSessions - cleanTraffic.engagedSessions, 0)} |

The clean estimate includes only the three production hosts and excludes all observed Brevo/Sendinblue scanner referral domains. Legitimate email engagement is reconciled separately with Brevo campaign data.

### Human email engagement

| Signal | Users | Events |
|--------|------:|-------:|
| Trusted interaction after an email-attributed landing | ${emailLandingEngaged.totalUsers} | ${emailLandingEngaged.eventCount} |

This is a conservative on-site signal: a tagged email landing must receive a trusted pointer, keyboard, or scroll interaction. A scanner page load alone does not count. Compare this total with Brevo's delivered and unique human-click totals; it is not a replacement for campaign-provider reporting.

---

## Funnel Visualization

\`\`\`
Step 1: First Visit                    [${firstVisit.eventCount} events / ${firstVisit.totalUsers} users] ${progressBar(100)} 100%
           \u2193 (${formatPct(trialRate)} proceed to trial)
Step 2: Trial Page View                [${trialPage.eventCount} events / ${trialPage.totalUsers} users] ${progressBar(trialRate * 100)} ${formatPct(trialRate)}
           \u2193 (${formatPct(toolRate)} select a tool)
Step 3: Trial Tool Selected            [${toolSelected.eventCount} events / ${toolSelected.totalUsers} users] ${progressBar(trialRate * toolRate * 100)} ${formatPct(trialRate * toolRate)}
           \u2193 (${formatPct(searchRate)} complete search)
Step 4: Trial Search Completed         [${searchCompleted.eventCount} events / ${searchCompleted.totalUsers} users] ${progressBar(trialRate * toolRate * searchRate * 100)} ${formatPct(trialRate * toolRate * searchRate)}
           \u2193 (${formatPct(ctaRate)} click signup CTA)
Step 5: Trial Signup CTA Clicked       [${ctaClicked.eventCount} events / ${ctaClicked.totalUsers} users] ${progressBar(trialRate * toolRate * searchRate * ctaRate * 100)} ${formatPct(trialRate * toolRate * searchRate * ctaRate)}
           \u2193 (${formatPct(signupRate)} complete signup)
Step 6: Signup Completed               [${signupComplete.eventCount} events / ${signupComplete.totalUsers} users] ${progressBar(overallRate * 100)} ${formatPct(overallRate)}
\`\`\`

---

## Funnel Metrics

| Stage | Users | Events | Step Conversion | Overall Rate |
|-------|-------|--------|-----------------|--------------|
| First Visit | ${firstVisit.totalUsers} | ${firstVisit.eventCount} | - | 100% |
| Trial Page View | ${trialPage.totalUsers} | ${trialPage.eventCount} | ${formatPct(trialRate)} | ${formatPct(trialRate)} |
| Tool Selected | ${toolSelected.totalUsers} | ${toolSelected.eventCount} | ${formatPct(toolRate)} | ${formatPct(trialRate * toolRate)} |
| Search Completed | ${searchCompleted.totalUsers} | ${searchCompleted.eventCount} | ${formatPct(searchRate)} | ${formatPct(trialRate * toolRate * searchRate)} |
| Signup CTA Click | ${ctaClicked.totalUsers} | ${ctaClicked.eventCount} | ${formatPct(ctaRate)} | ${formatPct(trialRate * toolRate * searchRate * ctaRate)} |
| Signup Complete | ${signupComplete.totalUsers} | ${signupComplete.eventCount} | ${formatPct(signupRate)} | ${formatPct(overallRate)} |

---

## Tool Usage Breakdown

| Tool | Trial Searches | Users |
|------|----------------|-------|
| Comps Navigator | ${compsSearch.eventCount} | ${compsSearch.totalUsers} |
| Mandate Matcher | ${mandateSearch.eventCount} | ${mandateSearch.totalUsers} |
| AI Chat | ${chatMessage.eventCount} | ${chatMessage.totalUsers} |

---

## Page Performance

| Page | Sessions | Users | Engagement | Bounce |
|------|----------|-------|------------|--------|`

  for (const path of PAGE_PATHS) {
    const p = pages[path]
    if (p) {
      markdown += `\n| \`${path}\` | ${p.sessions} | ${p.activeUsers} | ${formatPct(p.engagementRate)} | ${formatPct(p.bounceRate)} |`
    }
  }

  markdown += `

---

## Landing Page Analysis

| Landing Page | Sessions | New Users | Engagement | Bounce |
|--------------|----------|-----------|------------|--------|`

  for (const lp of landingPages.slice(0, 10)) {
    markdown += `\n| ${lp.landingPage} | ${lp.sessions} | ${lp.newUsers} | ${formatPct(lp.engagementRate)} | ${formatPct(lp.bounceRate)} |`
  }

  markdown += `

---

## Traffic Sources

| Source | New Users | Sessions | Engagement |
|--------|-----------|----------|------------|`

  for (const src of sources.slice(0, 10)) {
    markdown += `\n| ${src.source} | ${src.newUsers} | ${src.sessions} | ${formatPct(src.engagementRate)} |`
  }

  markdown += `

---

## Funnel Benchmarks vs Actuals

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| First Visit \u2192 Trial | >10% | ${formatPct(trialRate)} | ${trialRate >= 0.1 ? 'On target' : 'Below target'} |
| Trial \u2192 Tool Select | >70% | ${formatPct(toolRate)} | ${toolRate >= 0.7 ? 'On target' : 'Below target'} |
| Tool \u2192 Search | >80% | ${formatPct(searchRate)} | ${searchRate >= 0.8 ? 'On target' : 'Below target'} |
| Search \u2192 CTA Click | >30% | ${formatPct(ctaRate)} | ${ctaRate >= 0.3 ? 'On target' : 'Below target'} |
| CTA \u2192 Signup | >50% | ${formatPct(signupRate)} | ${signupRate >= 0.5 ? 'On target' : 'Below target'} |
| Overall Conversion | >5% | ${formatPct(overallRate)} | ${overallRate >= 0.05 ? 'On target' : 'Below target'} |

---

*Report generated automatically by KStoryBridge Analytics Cron*
`

  return { markdown, alerts }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[funnel-report-cron] Starting scheduled funnel report')

    // Parse request for optional days parameter (default 7)
    let days = 7
    try {
      const body = await req.json()
      if (body.days && typeof body.days === 'number') {
        days = body.days
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Get Google service account credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    console.log('[funnel-report-cron] Authenticating with Google API...')

    // Get access token
    const accessToken = await getAccessToken(serviceAccount)
    console.log('[funnel-report-cron] Authentication successful')

    // Calculate date range
    const startDate = `${days}daysAgo`
    const endDate = 'yesterday'

    // Run all queries in parallel
    console.log('[funnel-report-cron] Fetching GA4 data...')

    const [
      funnelResponse,
      pagesResponse,
      landingResponse,
      sourcesResponse,
      rawTrafficResponse,
      cleanTrafficResponse,
    ] = await Promise.all([
      // Query 1: Funnel events
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['eventName'],
        metrics: ['eventCount', 'totalUsers'],
        dimensionFilter: buildCleanProductionFilter([{
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: FUNNEL_EVENTS,
              caseSensitive: true,
            },
          },
        }]),
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),

      // Query 2: Page performance
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['pagePath'],
        metrics: ['activeUsers', 'sessions', 'bounceRate', 'engagementRate'],
        dimensionFilter: buildCleanProductionFilter([{
          filter: {
            fieldName: 'pagePath',
            inListFilter: {
              values: PAGE_PATHS,
              caseSensitive: false,
            },
          },
        }]),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),

      // Query 3: Landing pages
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['landingPage'],
        metrics: ['sessions', 'newUsers', 'engagementRate', 'bounceRate'],
        dimensionFilter: buildCleanProductionFilter(),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),

      // Query 4: Traffic sources
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['sessionSourceMedium'],
        metrics: ['newUsers', 'sessions', 'engagementRate'],
        dimensionFilter: buildCleanProductionFilter(),
        orderBys: [{ metric: { metricName: 'newUsers' }, desc: true }],
        limit: 10,
      }),

      // Query 5: Raw traffic on production hosts, retained only for visibility
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [],
        metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions'],
        dimensionFilter: buildProductionHostFilter(),
      }),

      // Query 6: Clean production traffic used by customer KPIs
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [],
        metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions'],
        dimensionFilter: buildCleanProductionFilter(),
      }),
    ])

    console.log('[funnel-report-cron] Parsing GA4 data...')

    // Parse responses
    const funnelMetrics = parseFunnelEvents(funnelResponse)
    const pageMetrics = parsePagePerformance(pagesResponse)
    const landingPages = parseLandingPages(landingResponse)
    const trafficSources = parseTrafficSources(sourcesResponse)
    const rawTraffic = parseTrafficSummary(rawTrafficResponse)
    const cleanTraffic = parseTrafficSummary(cleanTrafficResponse)

    // Generate report
    console.log('[funnel-report-cron] Generating funnel report...')
    const { markdown, alerts } = generateFunnelReport(
      funnelMetrics,
      pageMetrics,
      landingPages,
      trafficSources,
      rawTraffic,
      cleanTraffic,
      days
    )

    // Get today's date for report
    const reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Send report via send-analytics-report function
    console.log('[funnel-report-cron] Sending report to admins...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-analytics-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'funnel',
        reportDate,
        reportMarkdown: markdown,
        alerts: alerts.length > 0 ? alerts : undefined,
        sendSlack: true,
      }),
    })

    const sendResult = await sendResponse.json()
    console.log('[funnel-report-cron] Report delivery result:', sendResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${days}-day funnel report generated and sent`,
        reportDate,
        alertsTriggered: alerts.length,
        delivery: sendResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[funnel-report-cron] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate funnel report',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
