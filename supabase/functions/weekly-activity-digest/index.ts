import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getGA4AccessToken,
  parseServiceAccount,
  runGA4Report,
} from '../_shared/ga4-client.ts'
import { buildCleanProductionFilter } from '../_shared/analytics-filters.ts'
import { reportingWindow, REPORT_TIME_ZONE } from '../_shared/reporting-window.ts'
import {
  authorizeFunnelReportRequest,
  validateInvocationKey,
} from '../_shared/analytics-report-auth.ts'
import {
  buildActivityDigest,
  parseTopPages,
  renderActivityDigestMarkdown,
  type AuthUserRecord,
  type ProfileRecord,
} from '../_shared/weekly-activity-digest.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-analytics-cron-secret',
}

interface RequestBody {
  days?: number
  invocationKey?: string
}

async function listAllAuthUsers(
  admin: ReturnType<typeof createClient>
): Promise<AuthUserRecord[]> {
  const users: AuthUserRecord[] = []
  const perPage = 200
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`auth_list_users_failed: ${error.message}`)
    const batch = data?.users ?? []
    for (const u of batch) {
      users.push({
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })
    }
    if (batch.length < perPage) break
  }
  return users
}

async function loadProfiles(
  admin: ReturnType<typeof createClient>
): Promise<Map<string, ProfileRecord>> {
  const map = new Map<string, ProfileRecord>()

  const { data: buyers } = await admin
    .from('user_buyers')
    .select('email, full_name, buyer_company, tier')
  for (const b of buyers ?? []) {
    if (!b.email) continue
    map.set(String(b.email).toLowerCase(), {
      full_name: b.full_name ?? null,
      company: b.buyer_company ?? null,
      tier: b.tier ?? null,
      account_type: 'buyer',
    })
  }

  const { data: creators } = await admin
    .from('user_creators')
    .select('email, full_name, pen_name, invitation_status')
  for (const c of creators ?? []) {
    if (!c.email) continue
    const email = String(c.email).toLowerCase()
    if (map.has(email)) continue // a buyer profile takes precedence if both exist
    map.set(email, {
      full_name: c.full_name ?? c.pen_name ?? null,
      company: c.pen_name ?? null,
      tier: c.invitation_status ?? null,
      account_type: 'creator',
    })
  }

  return map
}

async function fetchTopPages(startDate: string, endDate: string) {
  const serviceAccount = parseServiceAccount(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON'))
  const accessToken = await getGA4AccessToken(serviceAccount)
  const response = await runGA4Report(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: ['pagePath'],
    metrics: ['screenPageViews', 'averageSessionDuration'],
    dimensionFilter: buildCleanProductionFilter(),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 12,
  })
  return parseTopPages(response)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const cronSecret = Deno.env.get('ANALYTICS_FUNNEL_CRON_SECRET')

  const authorization = authorizeFunnelReportRequest({
    authorization: req.headers.get('Authorization'),
    cronSecretHeader: req.headers.get('X-Analytics-Cron-Secret'),
    serviceRoleKey: supabaseServiceRoleKey,
    cronSecret,
  })

  if (!authorization.authorized) {
    const status = !supabaseServiceRoleKey || !cronSecret ? 500 : 403
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    let body: RequestBody = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    if (body.invocationKey !== undefined && validateInvocationKey(body.invocationKey) === null) {
      return new Response(JSON.stringify({ error: 'invalid_invocation_key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const days = Number.isInteger(body.days) && (body.days as number) > 0 ? (body.days as number) : 7
    const window = reportingWindow(days)

    const admin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const [users, profilesByEmail, topPages] = await Promise.all([
      listAllAuthUsers(admin),
      loadProfiles(admin),
      fetchTopPages(window.startDate, window.endDate).catch(err => {
        console.error('[weekly-activity-digest] GA4 fetch failed:', err.message)
        return [] // degrade gracefully — Supabase named sections still ship
      }),
    ])

    const digest = buildActivityDigest({
      users,
      profilesByEmail,
      windowStartMs: window.start.getTime(),
      windowEndMs: window.endExclusive.getTime(),
      topPages,
    })

    const markdown = renderActivityDigestMarkdown(digest, {
      startDate: window.startDate,
      endDate: window.endDate,
    })

    const reportDate = new Intl.DateTimeFormat('en-US', {
      timeZone: REPORT_TIME_ZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())

    const alerts: string[] = []
    if (digest.signups.length === 0 && digest.returns.length === 0) {
      alerts.push('No external signups or returns this week')
    }

    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-analytics-report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'weekly',
        reportDate,
        reportMarkdown: markdown,
        alerts: alerts.length > 0 ? alerts : undefined,
        sendSlack: true,
      }),
    })

    if (!sendResponse.ok) throw new Error('report_delivery_request_failed')
    const sendResult = await sendResponse.json()

    return new Response(
      JSON.stringify({
        success: sendResult.success === true,
        message: `${days}-day activity digest generated and sent`,
        triggerKind: authorization.triggerKind,
        reportDate,
        signups: digest.signups.length,
        returns: digest.returns.length,
        pages: digest.topPages.length,
        delivery: sendResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[weekly-activity-digest] Request failed:', (err as Error).message)
    return new Response(JSON.stringify({ error: 'Failed to generate activity digest' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
