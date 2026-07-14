export const WEBSITE_ACQUISITION_EVENTS = [
  'audience_path_selected',
  'feature_promo_selected',
  'trial_cta_clicked',
  'signup_cta_clicked',
  'signin_cta_clicked',
  'creator_inquiry_started',
  'creator_inquiry_submitted',
  'creator_inquiry_failed',
] as const

export type WebsiteAcquisitionEvent = (typeof WEBSITE_ACQUISITION_EVENTS)[number]

export interface WebsiteAcquisitionMetric {
  eventCount: number
  totalUsers: number
}

export type WebsiteAcquisitionMetrics = Record<
  WebsiteAcquisitionEvent,
  WebsiteAcquisitionMetric
>

export interface GA4WebsiteAcquisitionRow {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

export function websiteAcquisitionDimensionFilters(): GA4FilterExpression[] {
  return [
    {
      filter: {
        fieldName: 'hostName',
        stringFilter: {
          value: 'kstorybridge.com',
          matchType: 'EXACT',
          caseSensitive: true,
        },
      },
    },
    {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: [...WEBSITE_ACQUISITION_EVENTS],
          caseSensitive: true,
        },
      },
    },
  ]
}

const EVENT_LABELS: Record<WebsiteAcquisitionEvent, string> = {
  audience_path_selected: 'Creator or buyer path selected',
  feature_promo_selected: 'Buyer feature promo selected',
  trial_cta_clicked: 'Buyer trial handoff clicked',
  signup_cta_clicked: 'Buyer signup handoff clicked',
  signin_cta_clicked: 'Creator or buyer sign-in clicked',
  creator_inquiry_started: 'Creator inquiry started',
  creator_inquiry_submitted: 'Creator inquiry delivered',
  creator_inquiry_failed: 'Creator inquiry delivery failed',
}

const zeroMetrics = (): WebsiteAcquisitionMetrics => Object.fromEntries(
  WEBSITE_ACQUISITION_EVENTS.map(eventName => [
    eventName,
    { eventCount: 0, totalUsers: 0 },
  ])
) as WebsiteAcquisitionMetrics

const parseCount = (value: string | undefined): number => {
  if (value === undefined || !/^\d+$/.test(value)) {
    throw new Error('invalid_website_acquisition_metric')
  }
  const count = Number(value)
  if (!Number.isSafeInteger(count)) throw new Error('invalid_website_acquisition_metric')
  return count
}

const assertValidMetrics = (metrics: WebsiteAcquisitionMetrics): void => {
  for (const eventName of WEBSITE_ACQUISITION_EVENTS) {
    const metric = metrics[eventName]
    if (
      !metric
      || !Number.isSafeInteger(metric.eventCount)
      || metric.eventCount < 0
      || !Number.isSafeInteger(metric.totalUsers)
      || metric.totalUsers < 0
    ) {
      throw new Error('invalid_website_acquisition_metric')
    }
  }
}

export function parseWebsiteAcquisitionEvents(
  rows: GA4WebsiteAcquisitionRow[] = []
): WebsiteAcquisitionMetrics {
  const metrics = zeroMetrics()
  const seen = new Set<WebsiteAcquisitionEvent>()

  for (const row of rows) {
    const eventName = row.dimensionValues[0]?.value as WebsiteAcquisitionEvent | undefined
    if (!eventName || !WEBSITE_ACQUISITION_EVENTS.includes(eventName)) continue
    if (seen.has(eventName)) throw new Error('duplicate_website_acquisition_event')

    metrics[eventName] = {
      eventCount: parseCount(row.metricValues[0]?.value),
      totalUsers: parseCount(row.metricValues[1]?.value),
    }
    seen.add(eventName)
  }

  return metrics
}

export function renderWebsiteAcquisitionSection(
  metrics: WebsiteAcquisitionMetrics,
  instrumentationLive: boolean
): string {
  if (!instrumentationLive) {
    return `### Website acquisition handoffs

**Instrumentation pending.** The canonical website acquisition contract was not live before this complete reporting window. Missing events are not rendered as zero behavior, and no conversion rate is calculated.`
  }

  assertValidMetrics(metrics)
  const rows = WEBSITE_ACQUISITION_EVENTS.map(eventName => {
    const metric = metrics[eventName]
    return `| ${EVENT_LABELS[eventName]} | ${metric.totalUsers} | ${metric.eventCount} |`
  })

  return `### Website acquisition handoffs

| Intent or delivery boundary | Users | Events |
|-----------------------------|------:|-------:|
${rows.join('\n')}

These are event-level leading signals, not a closed cohort funnel. Users may take multiple paths, and CTA clicks are not destination completions. Segmenting by audience, CTA position, feature, device, and controlled source remains pending approved GA definitions and the post-registration processing window under \`AR-208\`.`
}

export function missingWebsiteAcquisitionAlerts(input: {
  contractLive: boolean
  websiteSessions: number
  metrics: WebsiteAcquisitionMetrics
}): string[] {
  if (!input.contractLive) return []
  if (!Number.isSafeInteger(input.websiteSessions) || input.websiteSessions < 0) {
    throw new Error('invalid_website_acquisition_session_count')
  }
  assertValidMetrics(input.metrics)
  if (input.websiteSessions < 3) return []

  const trackedEvents = WEBSITE_ACQUISITION_EVENTS.reduce(
    (total, eventName) => total + input.metrics[eventName].eventCount,
    0
  )
  if (trackedEvents > 0) return []

  return [
    `Missing website acquisition events: ${input.websiteSessions} clean website sessions produced zero canonical handoff events after the contract-live gate. Owner: Growth and Engineering. Action: sample homepage and audience-path CTAs in DebugView before treating this as user rejection.`,
  ]
}
import type { GA4FilterExpression } from './analytics-filters.ts'
