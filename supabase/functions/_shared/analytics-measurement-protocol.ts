export interface AnalyticsOutboxRow {
  id: string
  event_name: string
  user_id: string
  event_params: Record<string, unknown>
  occurred_at: string
  attempt_count: number
}

export interface MeasurementProtocolPayload {
  client_id: string
  user_id: string
  timestamp_micros: number
  events: Array<{
    name: string
    params: Record<string, string | number>
  }>
}

const SUBSCRIPTION_PARAM_KEYS = [
  'account_type',
  'app_section',
  'traffic_type',
  'plan_type',
  'billing_period',
  'currency',
  'value',
] as const

const TITLE_APPROVED_PARAM_KEYS = [
  'app_section',
  'traffic_type',
  'draft_id',
] as const

const TITLE_PUBLISHED_PARAM_KEYS = [
  ...TITLE_APPROVED_PARAM_KEYS,
  'title_id',
] as const

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireExactKeys(
  params: Record<string, unknown>,
  expectedKeys: readonly string[]
): void {
  const actual = Object.keys(params).sort().join(',')
  const expected = [...expectedKeys].sort().join(',')
  if (actual !== expected) throw new Error('invalid_outbox_param_shape')
}

function requireTrafficType(value: unknown): asserts value is 'external' | 'internal' {
  if (value !== 'external' && value !== 'internal') {
    throw new Error('invalid_outbox_traffic_type')
  }
}

export function buildMeasurementProtocolPayload(row: AnalyticsOutboxRow): MeasurementProtocolPayload {
  if (!UUID_PATTERN.test(row.user_id)) {
    throw new Error('invalid_outbox_identity_or_event')
  }

  const occurredAtMs = Date.parse(row.occurred_at)
  if (!Number.isFinite(occurredAtMs)) {
    throw new Error('invalid_outbox_timestamp')
  }

  let pageLocation: string
  let eventParams: Record<string, string | number>

  if (row.event_name === 'subscription_started') {
    requireExactKeys(row.event_params, SUBSCRIPTION_PARAM_KEYS)
    const accountType = row.event_params.account_type
    const appSection = row.event_params.app_section
    const trafficType = row.event_params.traffic_type
    const planType = row.event_params.plan_type
    const billingPeriod = row.event_params.billing_period
    const currency = row.event_params.currency
    const value = row.event_params.value

    if (accountType !== 'buyer' && accountType !== 'creator') {
      throw new Error('invalid_outbox_account_type')
    }
    if (appSection !== 'dashboard' && appSection !== 'creator') {
      throw new Error('invalid_outbox_app_section')
    }
    if ((accountType === 'buyer' && appSection !== 'dashboard') ||
        (accountType === 'creator' && appSection !== 'creator')) {
      throw new Error('invalid_outbox_app_section')
    }
    requireTrafficType(trafficType)
    if (planType !== 'pro' && planType !== 'suite' &&
        planType !== 'packaging' && planType !== 'premium') {
      throw new Error('invalid_outbox_plan_type')
    }
    if ((accountType === 'buyer' && planType !== 'pro' && planType !== 'suite') ||
        (accountType === 'creator' && planType !== 'packaging' && planType !== 'premium')) {
      throw new Error('invalid_outbox_plan_type')
    }
    if (billingPeriod !== 'monthly' && billingPeriod !== 'yearly') {
      throw new Error('invalid_outbox_billing_period')
    }
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
      throw new Error('invalid_outbox_currency')
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('invalid_outbox_value')
    }

    pageLocation = accountType === 'buyer'
      ? 'https://dashboard.kstorybridge.com/'
      : 'https://creator.kstorybridge.com/'
    eventParams = {
      account_type: accountType,
      app_section: appSection,
      traffic_type: trafficType,
      plan_type: planType,
      billing_period: billingPeriod,
      currency,
      value,
    }
  } else if (row.event_name === 'title_approved' || row.event_name === 'title_published') {
    requireExactKeys(
      row.event_params,
      row.event_name === 'title_approved'
        ? TITLE_APPROVED_PARAM_KEYS
        : TITLE_PUBLISHED_PARAM_KEYS
    )
    const appSection = row.event_params.app_section
    const trafficType = row.event_params.traffic_type
    const draftId = row.event_params.draft_id
    const titleId = row.event_params.title_id
    if (appSection !== 'creator') throw new Error('invalid_outbox_app_section')
    requireTrafficType(trafficType)
    if (typeof draftId !== 'string' || !UUID_PATTERN.test(draftId)) {
      throw new Error('invalid_outbox_draft_id')
    }
    if (row.event_name === 'title_published' &&
        (typeof titleId !== 'string' || !UUID_PATTERN.test(titleId))) {
      throw new Error('invalid_outbox_title_id')
    }

    pageLocation = 'https://creator.kstorybridge.com/'
    eventParams = {
      app_section: appSection,
      traffic_type: trafficType,
      draft_id: draftId,
      ...(row.event_name === 'title_published' ? { title_id: titleId as string } : {}),
    }
  } else {
    throw new Error('invalid_outbox_identity_or_event')
  }

  return {
    // Server outcomes have no browser cookie available. The Supabase UUID is the
    // same non-PII identifier already configured as GA user_id in both clients.
    client_id: row.user_id,
    user_id: row.user_id,
    timestamp_micros: Math.round(occurredAtMs * 1000),
    events: [{
      name: row.event_name,
      params: {
        // A fixed production origin makes the server event visible to the same
        // GA hostName filter as browser events without accepting a user URL.
        page_location: pageLocation,
        ...eventParams,
      },
    }],
  }
}

export function retryDelaySeconds(attemptCount: number): number {
  const exponent = Math.max(0, Math.min(attemptCount - 1, 10))
  return Math.min(60 * (2 ** exponent), 86400)
}
