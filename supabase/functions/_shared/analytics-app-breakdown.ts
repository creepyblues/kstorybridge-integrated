export const ANALYTICS_APP_HOSTS = {
  website: 'kstorybridge.com',
  dashboard: 'dashboard.kstorybridge.com',
  creator: 'creator.kstorybridge.com',
} as const

export type AnalyticsApp = keyof typeof ANALYTICS_APP_HOSTS

interface GA4AppRow {
  dimensionValues: Array<{ value: string }>
  metricValues: Array<{ value: string }>
}

export interface AnalyticsAppBreakdownRow {
  app: AnalyticsApp
  hostName: string
  activeUsers: number
  newUsers: number
  sessions: number
  engagedSessions: number
  engagementRate: number
}

const parseCount = (value?: string): number => {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('invalid_app_breakdown_metric')
  }
  return count
}

export function parseAnalyticsAppBreakdown(
  rows?: GA4AppRow[]
): AnalyticsAppBreakdownRow[] {
  const byHost = new Map<string, Omit<AnalyticsAppBreakdownRow, 'app' | 'hostName' | 'engagementRate'>>()

  for (const row of rows || []) {
    const hostName = row.dimensionValues[0]?.value
    if (!Object.values(ANALYTICS_APP_HOSTS).includes(hostName as never)) continue

    if (byHost.has(hostName)) {
      throw new Error('duplicate_app_breakdown_host')
    }
    byHost.set(hostName, {
      activeUsers: parseCount(row.metricValues[0]?.value),
      newUsers: parseCount(row.metricValues[1]?.value),
      sessions: parseCount(row.metricValues[2]?.value),
      engagedSessions: parseCount(row.metricValues[3]?.value),
    })
  }

  return (Object.entries(ANALYTICS_APP_HOSTS) as Array<[AnalyticsApp, string]>)
    .map(([app, hostName]) => {
      const metrics = byHost.get(hostName) || {
        activeUsers: 0,
        newUsers: 0,
        sessions: 0,
        engagedSessions: 0,
      }
      return {
        app,
        hostName,
        ...metrics,
        engagementRate: metrics.sessions > 0
          ? metrics.engagedSessions / metrics.sessions
          : 0,
      }
    })
}
