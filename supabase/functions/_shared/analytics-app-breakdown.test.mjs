import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ANALYTICS_APP_HOSTS,
  parseAnalyticsAppBreakdown,
} from './analytics-app-breakdown.ts'

const row = (hostName, activeUsers, newUsers, sessions, engagedSessions) => ({
  dimensionValues: [{ value: hostName }],
  metricValues: [activeUsers, newUsers, sessions, engagedSessions]
    .map(value => ({ value: String(value) })),
})

test('returns one stable row for each KStoryBridge production app', () => {
  const result = parseAnalyticsAppBreakdown([
    row(ANALYTICS_APP_HOSTS.dashboard, 4, 2, 10, 7),
    row(ANALYTICS_APP_HOSTS.website, 8, 6, 12, 5),
    row(ANALYTICS_APP_HOSTS.creator, 3, 1, 4, 3),
  ])

  assert.deepEqual(result.map(item => item.app), [
    'website',
    'dashboard',
    'creator',
  ])
  assert.equal(result[0].engagementRate, 5 / 12)
  assert.equal(result[1].engagementRate, 0.7)
  assert.equal(result[2].engagementRate, 0.75)
})

test('ignores unknown hosts and zero-fills missing apps', () => {
  const result = parseAnalyticsAppBreakdown([
    row(ANALYTICS_APP_HOSTS.dashboard, 3, 1, 5, 3),
    row('dashboard-staging.kstorybridge.com', 500, 500, 500, 500),
    row('(not set)', 400, 400, 400, 400),
  ])

  assert.deepEqual(result[0], {
    app: 'website',
    hostName: ANALYTICS_APP_HOSTS.website,
    activeUsers: 0,
    newUsers: 0,
    sessions: 0,
    engagedSessions: 0,
    engagementRate: 0,
  })
  assert.deepEqual(result[1], {
    app: 'dashboard',
    hostName: ANALYTICS_APP_HOSTS.dashboard,
    activeUsers: 3,
    newUsers: 1,
    sessions: 5,
    engagedSessions: 3,
    engagementRate: 0.6,
  })
  assert.equal(result[2].sessions, 0)
})

test('rejects duplicate or malformed production-host rows', () => {
  assert.throws(
    () => parseAnalyticsAppBreakdown([
      row(ANALYTICS_APP_HOSTS.dashboard, 2, 1, 3, 2),
      row(ANALYTICS_APP_HOSTS.dashboard, 1, 0, 2, 1),
    ]),
    /duplicate_app_breakdown_host/
  )
  assert.throws(
    () => parseAnalyticsAppBreakdown([{
      dimensionValues: [{ value: ANALYTICS_APP_HOSTS.creator }],
      metricValues: [
        { value: 'not-a-number' },
        { value: '1' },
        { value: '2' },
        { value: '1' },
      ],
    }]),
    /invalid_app_breakdown_metric/
  )
})
