import {
  AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS,
  type AnalyticsEventMetric,
} from './analytics-report-events.ts'

export interface AnalyticsTrafficTotals {
  activeUsers: number
  newUsers: number
  sessions: number
  engagedSessions: number
}

export function percentageChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || current < 0 ||
      !Number.isFinite(previous) || previous < 0) {
    throw new Error('invalid_analytics_comparison_count')
  }
  return previous === 0 ? null : (current - previous) / previous
}

export function acquisitionDeclineAlerts(
  current: AnalyticsTrafficTotals,
  previous: AnalyticsTrafficTotals
): string[] {
  const newUserChange = percentageChange(current.newUsers, previous.newUsers)
  if (previous.newUsers < 5 || newUserChange === null || newUserChange > -0.2) {
    return []
  }

  return [
    `Acquisition decline: clean external new users fell ${Math.abs(newUserChange * 100).toFixed(1)}% versus the previous comparable window (${previous.newUsers} to ${current.newUsers}). Owner: Growth. Action: review source and landing-page rows before the next campaign.`,
  ]
}

export function missingProductEventAlerts(input: {
  contractLive: boolean
  dashboardSessions: number
  eventMetrics: Record<string, AnalyticsEventMetric>
}): string[] {
  if (!input.contractLive || input.dashboardSessions < 3) return []

  const canonicalEventCount = AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS
    .reduce((total, eventName) => {
      return total + (input.eventMetrics[eventName]?.eventCount || 0)
    }, 0)
  if (canonicalEventCount > 0) return []

  return [
    `Missing events: ${input.dashboardSessions} clean buyer-dashboard sessions produced zero canonical product-engagement events. Owner: Engineering. Action: verify the dashboard analytics bundle, consent state, and GA DebugView before interpreting engagement as zero.`,
  ]
}
