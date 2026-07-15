const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function progressTriggerKind(env = process.env) {
  return env.GITHUB_ACTIONS === 'true' ? 'github_progress' : 'local_progress'
}

export function progressInvocationKey(triggerKind, date) {
  if (!['local_progress', 'github_progress'].includes(triggerKind)) {
    throw new Error('Invalid progress trigger kind')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid progress invocation date')
  }
  return `analytics-progress:${triggerKind}:${date}:v1`
}

export async function detectAnalyticsAuditLedger({
  fetchImpl = fetch,
  supabaseUrl,
  anonKey,
}) {
  const response = await fetchImpl(
    `${supabaseUrl}/rest/v1/rpc/get_analytics_report_delivery_status`,
    {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_per_trigger_limit: 1 }),
    }
  )

  if (response.ok) return true
  if (response.status === 404) return false
  throw new Error(`Analytics audit ledger probe failed (${response.status})`)
}

export async function claimProgressReportRun({
  fetchImpl = fetch,
  supabaseUrl,
  serviceRoleKey,
  invocationKey,
  triggerKind,
}) {
  const response = await fetchImpl(
    `${supabaseUrl}/rest/v1/rpc/claim_analytics_report_run`,
    {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_invocation_key: invocationKey,
        p_report_type: 'progress',
        p_trigger_kind: triggerKind,
        p_window_start: null,
        p_window_end: null,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Analytics progress run claim failed (${response.status})`)
  }
  const rows = await response.json()
  if (!Array.isArray(rows) || !rows[0]?.report_run_id) {
    throw new Error('Analytics progress run claim returned no run')
  }
  return rows[0]
}
