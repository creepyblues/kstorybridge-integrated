import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildCleanProductionFilter,
  buildProductionHostFilter,
} from '../_shared/analytics-filters.ts'
import {
  authenticatedBuyerEngagementRows,
  SCHEDULED_REPORT_EVENTS,
} from '../_shared/analytics-report-events.ts'
import {
  parseAnalyticsAppBreakdown,
  type AnalyticsAppBreakdownRow,
} from '../_shared/analytics-app-breakdown.ts'
import { renderWeeklyOperatingScorecard } from '../_shared/analytics-operating-scorecard.ts'
import {
  acquisitionDeclineAlerts,
  missingProductEventAlerts,
  percentageChange,
} from '../_shared/analytics-alerts.ts'
import {
  isInstrumentationLiveForWindow,
  parseSignupUsersByHost,
  reconcileSignupCounts,
  type SignupCounts,
  type SignupReconciliationRow,
} from '../_shared/signup-reconciliation.ts'
import {
  previousReportingWindow,
  REPORT_TIME_ZONE,
  reportingWindow,
  type ReportingWindow,
} from '../_shared/reporting-window.ts'
import {
  TITLE_WORKFLOW_EVENTS,
  parseTitleWorkflowEvents,
  reconcileTitleWorkflow,
  type TitleWorkflowCounts,
  type TitleWorkflowReconciliationRow,
} from '../_shared/title-workflow-reconciliation.ts'
import {
  parseOutcomeEventCount,
  reconcileOutcome,
  type OutcomeReconciliationRow,
} from '../_shared/outcome-reconciliation.ts'
import {
  authorizeFunnelReportRequest,
  scheduledFunnelInvocationKey,
  validateInvocationKey,
} from '../_shared/analytics-report-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-analytics-cron-secret, content-type',
}

// GA4 Property Configuration
const GA4_PROPERTY_ID = '496541587'

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

interface AuditRpcClient {
  rpc: (
    functionName: string,
    parameters?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>
}

interface ReportRunClaim {
  report_run_id: string
  should_execute: boolean
  run_status: string
}

async function getAuthoritativeSignupCounts(
  supabaseUrl: string,
  serviceRoleKey: string,
  window: ReportingWindow
): Promise<SignupCounts> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: admins, error: adminError } = await supabase
    .from('admin')
    .select('email')
    .eq('active', true)

  if (adminError) throw new Error(`Failed to load active admins: ${adminError.message}`)
  const adminEmails = (admins ?? [])
    .map(admin => admin.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email))

  const countExternalProfiles = async (
    table: 'user_buyers' | 'user_creators'
  ): Promise<number> => {
    const baseQuery = () => supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', window.start.toISOString())
      .lt('created_at', window.endExclusive.toISOString())

    const [allResult, adminResult] = await Promise.all([
      baseQuery(),
      adminEmails.length > 0
        ? baseQuery().in('email', adminEmails)
        : Promise.resolve({ count: 0, error: null }),
    ])
    if (allResult.error) throw new Error(`Failed to count ${table}: ${allResult.error.message}`)
    if (adminResult.error) {
      throw new Error(`Failed to exclude active admins from ${table}: ${adminResult.error.message}`)
    }
    return Math.max((allResult.count ?? 0) - (adminResult.count ?? 0), 0)
  }

  const [buyer, creator] = await Promise.all([
    countExternalProfiles('user_buyers'),
    countExternalProfiles('user_creators'),
  ])

  return { buyer, creator }
}

async function getAuthoritativeTitleWorkflowCounts(
  supabaseUrl: string,
  serviceRoleKey: string,
  window: ReportingWindow
): Promise<TitleWorkflowCounts> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: admins, error: adminError } = await supabase
    .from('admin')
    .select('email')
    .eq('active', true)
  if (adminError) throw new Error(`Failed to load active admins: ${adminError.message}`)

  const adminEmails = (admins ?? [])
    .map(admin => admin.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email))
  const { data: adminCreators, error: creatorError } = adminEmails.length > 0
    ? await supabase.from('user_creators').select('id').in('email', adminEmails)
    : { data: [], error: null }
  if (creatorError) throw new Error(`Failed to resolve admin creator IDs: ${creatorError.message}`)
  const adminCreatorIds = (adminCreators ?? []).map(creator => creator.id)

  const countExternalOutcomes = async (
    table: 'title_drafts' | 'titles',
    timestamp: 'created_at' | 'submitted_at' | 'approved_at',
    linkedOnly = false
  ): Promise<number> => {
    const baseQuery = () => {
      let query = supabase
        .from(table)
        .select(table === 'titles' ? 'title_id' : 'id', { count: 'exact', head: true })
        .gte(timestamp, window.start.toISOString())
        .lt(timestamp, window.endExclusive.toISOString())
      if (linkedOnly && table === 'title_drafts') {
        query = query.not('published_title_id', 'is', null)
      }
      return query
    }

    const [allResult, adminResult] = await Promise.all([
      baseQuery(),
      adminCreatorIds.length > 0
        ? baseQuery().in('creator_id', adminCreatorIds)
        : Promise.resolve({ count: 0, error: null }),
    ])
    if (allResult.error) {
      throw new Error(`Failed to count ${table}.${timestamp}: ${allResult.error.message}`)
    }
    if (adminResult.error) {
      throw new Error(`Failed to exclude admins from ${table}.${timestamp}: ${adminResult.error.message}`)
    }
    return Math.max((allResult.count ?? 0) - (adminResult.count ?? 0), 0)
  }

  const [draftCreated, submitted, approved, published] = await Promise.all([
    countExternalOutcomes('title_drafts', 'created_at'),
    countExternalOutcomes('title_drafts', 'submitted_at'),
    countExternalOutcomes('title_drafts', 'approved_at'),
    countExternalOutcomes('title_drafts', 'approved_at', true),
  ])

  return {
    draft_created: draftCreated,
    submitted,
    approved,
    published,
  }
}

async function getAuthoritativeInterestCount(
  supabaseUrl: string,
  serviceRoleKey: string,
  window: ReportingWindow
): Promise<number> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: admins, error: adminError } = await supabase
    .from('admin')
    .select('email')
    .eq('active', true)
  if (adminError) throw new Error(`Failed to load active admins: ${adminError.message}`)

  const adminEmails = (admins ?? [])
    .map(admin => admin.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email))
  const baseQuery = () => supabase
    .from('title_interests')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', window.start.toISOString())
    .lt('created_at', window.endExclusive.toISOString())
  const [allResult, adminResult] = await Promise.all([
    baseQuery(),
    adminEmails.length > 0
      ? baseQuery().in('buyer_email', adminEmails)
      : Promise.resolve({ count: 0, error: null }),
  ])

  if (allResult.error) {
    throw new Error(`Failed to count title interests: ${allResult.error.message}`)
  }
  if (adminResult.error) {
    throw new Error(`Failed to exclude admins from title interests: ${adminResult.error.message}`)
  }
  return Math.max((allResult.count ?? 0) - (adminResult.count ?? 0), 0)
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
  const boundedPercentage = Math.max(0, Math.min(percentage, 100))
  const filled = Math.round(boundedPercentage / 5)
  const empty = 20 - filled
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
}

// Format percentage
function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatReconciliationStatus(status: SignupReconciliationRow['status']): string {
  const labels: Record<SignupReconciliationRow['status'], string> = {
    matched: 'Matched',
    drift: 'Drift detected',
    instrumentation_pending: 'Instrumentation pending',
    no_activity: 'No signup activity',
  }
  return labels[status]
}

function formatTitleWorkflowStatus(status: TitleWorkflowReconciliationRow['status']): string {
  const labels: Record<TitleWorkflowReconciliationRow['status'], string> = {
    matched: 'Matched',
    drift: 'Drift detected',
    no_activity: 'No activity',
    instrumentation_pending: 'Client instrumentation pending',
    server_event_pending: 'Server event pending',
    linkage_pending: 'Draft-to-title linkage pending',
  }
  return labels[status]
}

function formatOutcomeStatus(status: OutcomeReconciliationRow['status']): string {
  const labels: Record<OutcomeReconciliationRow['status'], string> = {
    matched: 'Matched',
    drift: 'Drift detected',
    no_activity: 'No activity',
    instrumentation_pending: 'Instrumentation pending',
  }
  return labels[status]
}

// Generate funnel report markdown
function generateFunnelReport(
  funnel: FunnelMetrics,
  pages: PageMetrics,
  landingPages: LandingPageMetrics[],
  sources: SourceMetrics[],
  rawTraffic: TrafficSummary,
  cleanTraffic: TrafficSummary,
  previousCleanTraffic: TrafficSummary,
  appBreakdown: AnalyticsAppBreakdownRow[],
  previousAppBreakdown: AnalyticsAppBreakdownRow[],
  signupReconciliation: SignupReconciliationRow[],
  instrumentationLive: boolean,
  titleWorkflowReconciliation: TitleWorkflowReconciliationRow[],
  titleClientInstrumentationLive: boolean,
  titleServerInstrumentationLive: boolean,
  interestReconciliation: OutcomeReconciliationRow,
  interestInstrumentationLive: boolean,
  productInstrumentationLive: boolean,
  commercialInstrumentationLive: boolean,
  window: ReportingWindow,
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
  const signinComplete = funnel['signin_completed'] || { eventCount: 0, totalUsers: 0 }
  const emailLandingEngaged = funnel['email_landing_engaged'] || { eventCount: 0, totalUsers: 0 }
  const checkoutStarted = funnel['checkout_started'] || { eventCount: 0, totalUsers: 0 }
  const subscriptionStarted = funnel['subscription_started'] || { eventCount: 0, totalUsers: 0 }

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
  const newUserChange = percentageChange(cleanTraffic.newUsers, previousCleanTraffic.newUsers)
  const sessionChange = percentageChange(cleanTraffic.sessions, previousCleanTraffic.sessions)
  const canonicalProductEvents = authenticatedBuyerEngagementRows(funnel)
    .reduce((total, row) => total + row.eventCount, 0)
  const buyerProfiles = signupReconciliation
    .find(row => row.accountType === 'buyer')?.authoritativeProfiles || 0
  const creatorProfiles = signupReconciliation
    .find(row => row.accountType === 'creator')?.authoritativeProfiles || 0
  const creatorTitleSubmissions = titleWorkflowReconciliation
    .find(row => row.stage === 'submitted')?.authoritativeOutcomes || 0
  const operatingScorecard = renderWeeklyOperatingScorecard({
    currentTraffic: cleanTraffic,
    previousTraffic: previousCleanTraffic,
    currentApps: appBreakdown,
    previousApps: previousAppBreakdown,
    buyerProfiles,
    creatorProfiles,
    creatorTitleSubmissions,
    buyerInterests: interestReconciliation.authoritativeCount,
    checkoutStartedEvents: checkoutStarted.eventCount,
    subscriptionStartedEvents: subscriptionStarted.eventCount,
    canonicalProductEvents,
    productInstrumentationLive,
    commercialInstrumentationLive,
  })

  // Check for alerts
  if (instrumentationLive && firstVisit.totalUsers > 0 && overallRate < 0.01) {
    alerts.push('Conversion: overall first-visit to completed-signup rate is below 1%. Owner: Growth. Action: inspect the trial step table and authoritative signup reconciliation before changing the funnel.')
  }
  if (instrumentationLive && ctaClicked.totalUsers > 0 && signupComplete.totalUsers === 0) {
    alerts.push('Conversion: signup CTA clicks produced zero completed signups. Owner: Product Engineering. Action: verify auth errors and profile writes before interpreting this as user abandonment.')
  }
  if (firstVisit.totalUsers > 0 && trialRate < 0.05) {
    alerts.push('Acquisition journey: fewer than 5% of first visitors reached the trial. Owner: Growth. Action: review landing pages and trial entry points.')
  }
  if (instrumentationLive) {
    for (const row of signupReconciliation.filter(row => row.status === 'drift')) {
      alerts.push(
        `Reconciliation drift: ${row.accountType} signup tracking differs from the authoritative profile count by ${row.variance}. Owner: Engineering. Action: inspect the auth contract live-at boundary and failed profile/event paths.`
      )
    }
  }
  for (const row of titleWorkflowReconciliation.filter(row => row.status === 'drift')) {
    alerts.push(
      `Reconciliation drift: creator title ${row.stage} tracking differs from the authoritative count by ${row.variance}. Owner: Engineering. Action: compare the workflow timestamp and server/client event path.`
    )
  }
  if (interestReconciliation.status === 'drift') {
    alerts.push(
      `Reconciliation drift: buyer interest tracking differs from authoritative interest rows by ${interestReconciliation.variance}. Owner: Engineering. Action: inspect express-interest dedupe responses and dashboard event delivery.`
    )
  }
  if (excludedSessionRate > 0.1) {
    alerts.push(`Scanner share: ${formatPct(excludedSessionRate)} of production-host sessions were excluded as known scanner traffic. Owner: Analytics Operations. Action: inspect source rows for a new redirect domain before changing the exclusion list.`)
  }
  alerts.push(...acquisitionDeclineAlerts(cleanTraffic, previousCleanTraffic))
  alerts.push(...missingProductEventAlerts({
    contractLive: productInstrumentationLive,
    dashboardSessions: appBreakdown.find(row => row.app === 'dashboard')?.sessions || 0,
    eventMetrics: funnel,
  }))

  // Check landing page bounce rates
  for (const lp of landingPages.slice(0, 5)) {
    if (lp.bounceRate > 0.6) {
      alerts.push(`Landing page: ${lp.landingPage} has ${formatPct(lp.bounceRate)} bounce rate. Owner: Growth. Action: review source quality and page-message alignment.`)
    }
  }

  const endDate = new Date(`${window.endDate}T12:00:00.000Z`)
  const startDate = new Date(`${window.startDate}T12:00:00.000Z`)

  const dateFormat = (d: Date) => d.toLocaleDateString('en-US', {
    timeZone: REPORT_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  let markdown = `# KStoryBridge Weekly Operating Report

**Period**: ${dateFormat(startDate)} - ${dateFormat(endDate)} (${days} days)

---

${operatingScorecard}

---

## Data Quality Guardrail

| Metric | Raw production hosts | Clean external estimate | Excluded |
|--------|---------------------:|------------------------:|---------:|
| Sessions | ${rawTraffic.sessions} | ${cleanTraffic.sessions} | ${excludedSessions} (${formatPct(excludedSessionRate)}) |
| Active Users | ${rawTraffic.activeUsers} | ${cleanTraffic.activeUsers} | ${Math.max(rawTraffic.activeUsers - cleanTraffic.activeUsers, 0)} |
| New Users | ${rawTraffic.newUsers} | ${cleanTraffic.newUsers} | ${Math.max(rawTraffic.newUsers - cleanTraffic.newUsers, 0)} |
| Engaged Sessions | ${rawTraffic.engagedSessions} | ${cleanTraffic.engagedSessions} | ${Math.max(rawTraffic.engagedSessions - cleanTraffic.engagedSessions, 0)} |

The clean estimate includes only the three production hosts and excludes all observed Brevo/Sendinblue scanner referral domains. Legitimate email engagement is reconciled separately with Brevo campaign data.

### Clean external activity by app

| App | Production host | Active users | New users | Sessions | Engaged sessions | Engagement rate |
|-----|-----------------|-------------:|----------:|---------:|-----------------:|----------------:|
${appBreakdown.map(row => `| ${row.app === 'website' ? 'Website' : row.app === 'dashboard' ? 'Buyer dashboard' : 'Creator app'} | ${row.hostName} | ${row.activeUsers} | ${row.newUsers} | ${row.sessions} | ${row.engagedSessions} | ${formatPct(row.engagementRate)} |`).join('\n')}

The rows use the same production-host and scanner exclusions as the clean KPI total. Active-user rows must not be added together as a cross-app unique-user total because the same person may use more than one app.

### Acquisition trend versus previous comparable window

| Clean external metric | Current | Previous | Change |
|-----------------------|--------:|---------:|-------:|
| New users | ${cleanTraffic.newUsers} | ${previousCleanTraffic.newUsers} | ${newUserChange === null ? 'New baseline' : formatPct(newUserChange)} |
| Sessions | ${cleanTraffic.sessions} | ${previousCleanTraffic.sessions} | ${sessionChange === null ? 'New baseline' : formatPct(sessionChange)} |

Acquisition decline alerts use clean external new users, a 20% decline threshold, and a minimum previous-window baseline of five users. Owner: Growth. The low-volume gate prevents a one-person change from becoming an executive alert.

### Authoritative signup reconciliation

| Account type | Supabase profiles | GA completed users | Variance | Status |
|--------------|------------------:|-------------------:|---------:|--------|
${signupReconciliation.map(row => `| ${row.accountType === 'buyer' ? 'Buyer' : 'Creator'} | ${row.authoritativeProfiles} | ${row.gaCompletedUsers} | ${row.variance > 0 ? '+' : ''}${row.variance} | ${formatReconciliationStatus(row.status)} |`).join('\n')}

Supabase profile creation is the signup source of truth. GA4 counts are used to validate behavioral instrumentation, not to determine how many accounts exist. Active admin accounts are excluded from the profile totals. Additional staff classification remains pending, so these totals are an external-user estimate.

${instrumentationLive
  ? 'The canonical auth event contract was live before this full reporting window, so differences are treated as tracking drift.'
  : 'The canonical auth event contract was not live for this full reporting window. GA zeros are therefore **not** interpreted as zero signups, conversion alerts that depend on `signup_completed` are suppressed, and the comparison is informational only.'}

### Creator title workflow reconciliation

| Workflow stage | Authoritative outcomes | GA events | Variance | Status |
|----------------|-----------------------:|----------:|---------:|--------|
${titleWorkflowReconciliation.map(row => `| ${row.stage === 'draft_created' ? 'Draft created' : row.stage.charAt(0).toUpperCase() + row.stage.slice(1)} | ${row.authoritativeOutcomes} | ${row.gaEvents} | ${row.variance > 0 ? '+' : ''}${row.variance} | ${formatTitleWorkflowStatus(row.status)} |`).join('\n')}

Draft creation, submission, and approval use \`title_drafts.created_at\`, \`submitted_at\`, and \`approved_at\` as their authoritative timestamps. GA event counts—not user counts—are compared because one creator may submit multiple titles. Active admin creators are excluded.

${titleClientInstrumentationLive
  ? 'The creator draft/submission contract was live before this full window, so client-event differences are enforceable.'
  : 'The creator draft/submission contract was not live for this full window; those comparisons are informational and cannot be interpreted as creator inactivity.'}
${titleServerInstrumentationLive
  ? 'Approval and publication server events were live before this full window.'
  : 'Approval and publication server events are not yet live, so authoritative database outcomes remain the only valid counts.'}

Publication currently shows all external-creator catalog rows created in the window as an **unlinked proxy**, not a reconciled conversion. \`title_drafts\` has no \`published_title_id\`, so the report cannot prove which approved draft created which title. This stage remains \`Draft-to-title linkage pending\` regardless of matching totals.

### Commercial outcome reconciliation

| Outcome | Authoritative count | GA events | Variance | Status |
|---------|--------------------:|----------:|---------:|--------|
| Buyer interest submitted | ${interestReconciliation.authoritativeCount} | ${interestReconciliation.gaEventCount} | ${interestReconciliation.variance > 0 ? '+' : ''}${interestReconciliation.variance} | ${formatOutcomeStatus(interestReconciliation.status)} |

\`title_interests.created_at\` is the source of truth for a newly created buyer-interest outcome. Active admin buyers are excluded. A duplicate submission can refresh its note but does not create another outcome, team notification, or GA event.

${interestInstrumentationLive
  ? 'The canonical buyer-interest event was live before this full window, so differences are treated as tracking drift.'
  : 'The canonical buyer-interest event was not live for this full window. GA zeros are not interpreted as zero buyer interest.'}

| Outcome currently unavailable for reconciliation | Reason |
|--------------------------------------------------|--------|
| Introduction requested | No authoritative introduction table or timestamp exists. |
| Introduction completed | No authoritative introduction workflow exists. |
| Buyer subscription started | Stripe is authoritative; the prepared local outbox timestamp is not available until its migration and webhook path are production-live. |
| Buyer payment completed | No local buyer payment ledger exists; Stripe event time is external-only. |

These rows are product/data-model gaps, not zero conversions. Creator subscriptions have a reliable local creation record. Privacy-safe server emission and a stable Supabase-user reconciliation identity are prepared on \`v2\`, but remain unavailable here until the outbox migration, webhooks, worker, secret, and schedule are production-validated.

### Canonical commercial behavior signals

| Outcome | Users | Events |
|---------|------:|-------:|
| Checkout started after server session creation | ${checkoutStarted.totalUsers} | ${checkoutStarted.eventCount} |
| Active subscription confirmed by Stripe webhook | ${subscriptionStarted.totalUsers} | ${subscriptionStarted.eventCount} |

${commercialInstrumentationLive
  ? 'The canonical commercial contract was live before this full window. These GA behavior signals may be evaluated alongside their authoritative reconciliation rows.'
  : 'The canonical commercial contract was not live for this full window. These values are informational and must not be interpreted as complete conversion totals.'}

### Authenticated product engagement

| Auth outcome across buyer and creator apps | Users | Events |
|--------------------------------------------|------:|-------:|
| Signup completed | ${signupComplete.totalUsers} | ${signupComplete.eventCount} |
| Sign-in completed | ${signinComplete.totalUsers} | ${signinComplete.eventCount} |

The sign-in row uses only \`signin_completed\`; views, attempts, failures, and the obsolete aggregate \`signin\` event are not combined with it.

| Canonical buyer-product outcome | Users | Events |
|---------------------------------|------:|-------:|
${authenticatedBuyerEngagementRows(funnel).map(row => {
  return `| ${row.label} | ${row.totalUsers} | ${row.eventCount} |`
}).join('\n')}

${productInstrumentationLive
  ? 'The canonical authenticated buyer-product contract was live before this full window. Legacy aliases are not queried or combined with these outcomes.'
  : 'The canonical authenticated buyer-product contract was not live for this full window. Legacy aliases are deliberately not added to these values, so zeros or partial counts are instrumentation-pending rather than evidence of no engagement.'}

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

  let claimedRunId: string | null = null
  let deliveryStarted = false
  let auditClient: AuditRpcClient | null = null

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const cronSecret = Deno.env.get('ANALYTICS_FUNNEL_CRON_SECRET')
    if (!supabaseUrl || !supabaseServiceRoleKey || !cronSecret) {
      console.error('[funnel-report-cron] Required server configuration is missing')
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const authorization = authorizeFunnelReportRequest({
      authorization: req.headers.get('Authorization'),
      cronSecretHeader: req.headers.get('X-Analytics-Cron-Secret'),
      serviceRoleKey: supabaseServiceRoleKey,
      cronSecret,
    })
    if (!authorization.authorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[funnel-report-cron] Starting ${authorization.triggerKind} funnel report`)

    // Parse request for optional days parameter (default 7)
    let days = 7
    let requestedInvocationKey: string | null = null
    try {
      const body = await req.json()
      if (Number.isInteger(body.days) && body.days >= 1 && body.days <= 90) {
        days = body.days
      }
      requestedInvocationKey = validateInvocationKey(body.invocationKey)
    } catch {
      // No body or invalid JSON, use default
    }

    const window = reportingWindow(days)
    const previousWindow = previousReportingWindow(days, window)
    const startDate = window.startDate
    const endDate = window.endDate
    const invocationKey = authorization.triggerKind === 'scheduled'
      ? scheduledFunnelInvocationKey(startDate, endDate)
      : requestedInvocationKey ?? `manual-funnel:${endDate}:${crypto.randomUUID()}`

    auditClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }) as unknown as AuditRpcClient
    const { data: rawClaimRows, error: claimError } = await auditClient.rpc(
      'claim_analytics_report_run',
      {
        p_invocation_key: invocationKey,
        p_report_type: 'funnel',
        p_trigger_kind: authorization.triggerKind,
        p_window_start: startDate,
        p_window_end: endDate,
      }
    )
    const claimRows = rawClaimRows as ReportRunClaim[] | null
    if (claimError || !claimRows?.[0]) throw new Error('report_run_claim_failed')
    claimedRunId = claimRows[0].report_run_id

    if (!claimRows[0].should_execute) {
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          reportRunId: claimedRunId,
          status: claimRows[0].run_status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
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

    // Run all queries in parallel
    console.log('[funnel-report-cron] Fetching GA4 data...')

    const [
      funnelResponse,
      pagesResponse,
      landingResponse,
      sourcesResponse,
      rawTrafficResponse,
      cleanTrafficResponse,
      previousCleanTrafficResponse,
      appBreakdownResponse,
      previousAppBreakdownResponse,
      signupByHostResponse,
      titleWorkflowResponse,
      interestResponse,
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
              values: [...SCHEDULED_REPORT_EVENTS],
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

      // Query 7: Previous clean external window for acquisition comparison
      runGA4Report(accessToken, {
        dateRanges: [{
          startDate: previousWindow.startDate,
          endDate: previousWindow.endDate,
        }],
        dimensions: [],
        metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions'],
        dimensionFilter: buildCleanProductionFilter(),
      }),

      // Query 8: Clean external traffic split across the three production apps
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['hostName'],
        metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions'],
        dimensionFilter: buildCleanProductionFilter(),
      }),

      // Query 9: Previous clean external app split for engagement comparison
      runGA4Report(accessToken, {
        dateRanges: [{
          startDate: previousWindow.startDate,
          endDate: previousWindow.endDate,
        }],
        dimensions: ['hostName'],
        metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions'],
        dimensionFilter: buildCleanProductionFilter(),
      }),

      // Query 10: Canonical completed signups split into buyer and creator apps
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['hostName'],
        metrics: ['totalUsers'],
        dimensionFilter: buildCleanProductionFilter([{
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: 'signup_completed',
              matchType: 'EXACT',
              caseSensitive: true,
            },
          },
        }]),
      }),

      // Query 11: Canonical creator title workflow outcomes
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['eventName'],
        metrics: ['eventCount'],
        dimensionFilter: buildCleanProductionFilter([
          {
            filter: {
              fieldName: 'hostName',
              stringFilter: {
                value: 'creator.kstorybridge.com',
                matchType: 'EXACT',
                caseSensitive: true,
              },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: TITLE_WORKFLOW_EVENTS,
                caseSensitive: true,
              },
            },
          },
        ]),
      }),

      // Query 12: Canonical buyer-interest outcomes
      runGA4Report(accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: ['eventName'],
        metrics: ['eventCount'],
        dimensionFilter: buildCleanProductionFilter([
          {
            filter: {
              fieldName: 'hostName',
              stringFilter: {
                value: 'dashboard.kstorybridge.com',
                matchType: 'EXACT',
                caseSensitive: true,
              },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'interest_submitted',
                matchType: 'EXACT',
                caseSensitive: true,
              },
            },
          },
        ]),
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
    const previousCleanTraffic = parseTrafficSummary(previousCleanTrafficResponse)
    const appBreakdown = parseAnalyticsAppBreakdown(appBreakdownResponse.rows)
    const previousAppBreakdown = parseAnalyticsAppBreakdown(previousAppBreakdownResponse.rows)
    const gaSignupCounts = parseSignupUsersByHost(signupByHostResponse.rows)
    const gaTitleWorkflowCounts = parseTitleWorkflowEvents(titleWorkflowResponse.rows)
    const gaInterestCount = parseOutcomeEventCount(
      interestResponse.rows,
      'interest_submitted'
    )

    const authoritativeSignupCounts = await getAuthoritativeSignupCounts(
      supabaseUrl,
      supabaseServiceRoleKey,
      window
    )
    const instrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_AUTH_CONTRACT_LIVE_AT'),
      window.start
    )
    const signupReconciliation = reconcileSignupCounts(
      authoritativeSignupCounts,
      gaSignupCounts,
      instrumentationLive
    )
    const authoritativeTitleWorkflowCounts = await getAuthoritativeTitleWorkflowCounts(
      supabaseUrl,
      supabaseServiceRoleKey,
      window
    )
    const titleClientInstrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_TITLE_CLIENT_CONTRACT_LIVE_AT'),
      window.start
    )
    const titleServerInstrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_TITLE_SERVER_CONTRACT_LIVE_AT'),
      window.start
    )
    const titleWorkflowReconciliation = reconcileTitleWorkflow(
      authoritativeTitleWorkflowCounts,
      gaTitleWorkflowCounts,
      titleClientInstrumentationLive,
      titleServerInstrumentationLive,
      titleServerInstrumentationLive
    )
    const authoritativeInterestCount = await getAuthoritativeInterestCount(
      supabaseUrl,
      supabaseServiceRoleKey,
      window
    )
    const interestInstrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_INTEREST_CONTRACT_LIVE_AT'),
      window.start
    )
    const interestReconciliation = reconcileOutcome(
      'interest_submitted',
      authoritativeInterestCount,
      gaInterestCount,
      interestInstrumentationLive
    )
    const productInstrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_PRODUCT_CONTRACT_LIVE_AT'),
      window.start
    )
    const commercialInstrumentationLive = isInstrumentationLiveForWindow(
      Deno.env.get('ANALYTICS_COMMERCIAL_CONTRACT_LIVE_AT'),
      window.start
    )

    // Generate report
    console.log('[funnel-report-cron] Generating funnel report...')
    const { markdown, alerts } = generateFunnelReport(
      funnelMetrics,
      pageMetrics,
      landingPages,
      trafficSources,
      rawTraffic,
      cleanTraffic,
      previousCleanTraffic,
      appBreakdown,
      previousAppBreakdown,
      signupReconciliation,
      instrumentationLive,
      titleWorkflowReconciliation,
      titleClientInstrumentationLive,
      titleServerInstrumentationLive,
      interestReconciliation,
      interestInstrumentationLive,
      productInstrumentationLive,
      commercialInstrumentationLive,
      window,
      days
    )

    // Get today's date for report
    const reportDate = new Date().toLocaleDateString('en-US', {
      timeZone: REPORT_TIME_ZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Send report via send-analytics-report function
    console.log('[funnel-report-cron] Sending report to admins...')

    deliveryStarted = true
    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-analytics-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'funnel',
        reportDate,
        reportMarkdown: markdown,
        reportRunId: claimedRunId,
        alerts: alerts.length > 0 ? alerts : undefined,
        sendSlack: true,
      }),
    })

    if (!sendResponse.ok) throw new Error('report_delivery_request_failed')
    const sendResult = await sendResponse.json()
    console.log(`[funnel-report-cron] Report delivery status: ${sendResult.status ?? 'unknown'}`)

    return new Response(
      JSON.stringify({
        success: sendResult.success === true,
        message: `${days}-day funnel report generated and sent`,
        reportRunId: claimedRunId,
        triggerKind: authorization.triggerKind,
        reportDate,
        alertsTriggered: alerts.length,
        delivery: sendResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch {
    if (claimedRunId && auditClient) {
      await auditClient.rpc('fail_analytics_report_run', {
        p_report_run_id: claimedRunId,
        p_error_code: deliveryStarted
          ? 'report_delivery_request_failed'
          : 'report_generation_failed',
      })
    }
    console.error('[funnel-report-cron] Request failed with a controlled internal error')
    return new Response(
      JSON.stringify({
        error: 'Failed to generate funnel report',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
