import type { AnalyticsAppBreakdownRow } from './analytics-app-breakdown.ts'

interface TrafficTotals {
  newUsers: number
}

export interface WeeklyOperatingScorecardInput {
  currentTraffic: TrafficTotals
  previousTraffic: TrafficTotals
  currentApps: AnalyticsAppBreakdownRow[]
  previousApps: AnalyticsAppBreakdownRow[]
  buyerProfiles: number
  creatorProfiles: number
  creatorTitleSubmissions: number
  buyerInterests: number
  checkoutStartedEvents: number
  subscriptionStartedEvents: number
  canonicalProductEvents: number
  productInstrumentationLive: boolean
  commercialInstrumentationLive: boolean
}

export interface WeeklyOperatingScorecardRow {
  layer: 'Acquisition' | 'Buyer activation' | 'Creator activation' | 'Engagement' | 'Retention' | 'Commercial outcomes'
  current: string
  previous: string
  measurementState: string
}

const wholeCount = (value: number): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('invalid_operating_scorecard_count')
  }
  return value
}

const appRow = (
  rows: AnalyticsAppBreakdownRow[],
  app: AnalyticsAppBreakdownRow['app']
): AnalyticsAppBreakdownRow => {
  const matches = rows.filter(row => row.app === app)
  if (matches.length !== 1) throw new Error('invalid_operating_scorecard_app_rows')
  return matches[0]
}

const engagementSummary = (rows: AnalyticsAppBreakdownRow[]): string => {
  const buyer = appRow(rows, 'dashboard')
  const creator = appRow(rows, 'creator')
  for (const row of [buyer, creator]) {
    if (!Number.isFinite(row.engagementRate) || row.engagementRate < 0 || row.engagementRate > 1) {
      throw new Error('invalid_operating_scorecard_engagement_rate')
    }
  }
  return `Buyer dashboard: ${wholeCount(buyer.sessions)} sessions / ${(buyer.engagementRate * 100).toFixed(1)}% engaged; creator app: ${wholeCount(creator.sessions)} sessions / ${(creator.engagementRate * 100).toFixed(1)}% engaged`
}

export function weeklyOperatingScorecardRows(
  input: WeeklyOperatingScorecardInput
): WeeklyOperatingScorecardRow[] {
  const currentNewUsers = wholeCount(input.currentTraffic.newUsers)
  const previousNewUsers = wholeCount(input.previousTraffic.newUsers)
  const buyerProfiles = wholeCount(input.buyerProfiles)
  const creatorProfiles = wholeCount(input.creatorProfiles)
  const creatorTitleSubmissions = wholeCount(input.creatorTitleSubmissions)
  const buyerInterests = wholeCount(input.buyerInterests)
  const checkoutStartedEvents = wholeCount(input.checkoutStartedEvents)
  const subscriptionStartedEvents = wholeCount(input.subscriptionStartedEvents)
  const canonicalProductEvents = wholeCount(input.canonicalProductEvents)

  return [
    {
      layer: 'Acquisition',
      current: `${currentNewUsers} clean external new users`,
      previous: `${previousNewUsers} clean external new users`,
      measurementState: `Measured with the production-host, scanner, and active-admin exclusions currently available; ${buyerProfiles} new buyer profiles and ${creatorProfiles} new creator profiles are reconciled below.`,
    },
    {
      layer: 'Buyer activation',
      current: 'Not reported',
      previous: 'Not reported',
      measurementState: 'Founder definition and immutable first-shortlist fact pending under AR-002, AR-203, and AR-305. Favorite activity must not be mislabeled as durable activation.',
    },
    {
      layer: 'Creator activation',
      current: 'Not reported',
      previous: 'Not reported',
      measurementState: `${creatorTitleSubmissions} title submissions are supply throughput, not a cohort activation rate. Founder approval and cohort logic remain pending under AR-003, AR-204, and AR-305.`,
    },
    {
      layer: 'Engagement',
      current: engagementSummary(input.currentApps),
      previous: engagementSummary(input.previousApps),
      measurementState: input.productInstrumentationLive
        ? `${canonicalProductEvents} canonical buyer-product events were recorded. Sessions and engagement rate describe activity, not retention.`
        : 'The canonical product contract was not live for the full window. App sessions remain directional and must not be converted into activation or retention.',
    },
    {
      layer: 'Retention',
      current: 'Not reported',
      previous: 'Not reported',
      measurementState: 'Founder-approved buyer/creator cadence and meaningful return actions remain pending under AR-004 and AR-306. Returning sessions alone are not retention.',
    },
    {
      layer: 'Commercial outcomes',
      current: input.commercialInstrumentationLive
        ? `${buyerInterests} authoritative buyer-interest pairs; ${checkoutStartedEvents} checkout-start events; ${subscriptionStartedEvents} subscription confirmations`
        : `${buyerInterests} authoritative buyer-interest pairs; checkout/subscription instrumentation pending`,
      previous: 'Not yet compared',
      measurementState: 'Buyer interest is authoritative in Supabase. Introduction and complete subscription reconciliation remain explicit source-model/release gaps under AR-304.',
    },
  ]
}

export function renderWeeklyOperatingScorecard(
  input: WeeklyOperatingScorecardInput
): string {
  const rows = weeklyOperatingScorecardRows(input)
  return `## Weekly Operating Scorecard

| Layer | Current window | Previous window | Measurement state |
|-------|----------------|-----------------|-------------------|
${rows.map(row => `| ${row.layer} | ${row.current} | ${row.previous} | ${row.measurementState} |`).join('\n')}

Unavailable activation and retention values are deliberately shown as **Not reported**, never as zero. This keeps unapproved definitions and incomplete instrumentation from becoming executive KPIs.`
}
