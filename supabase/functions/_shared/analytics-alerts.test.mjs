import assert from 'node:assert/strict'
import test from 'node:test'

import {
  acquisitionDeclineAlerts,
  missingProductEventAlerts,
  percentageChange,
} from './analytics-alerts.ts'

const traffic = (newUsers, sessions = 20) => ({
  activeUsers: newUsers,
  newUsers,
  sessions,
  engagedSessions: Math.floor(sessions / 2),
})

test('percentage change is honest when no prior baseline exists', () => {
  assert.equal(percentageChange(4, 0), null)
  assert.equal(percentageChange(8, 10), -0.2)
  assert.throws(() => percentageChange(-1, 3), /invalid_analytics_comparison_count/)
})

test('acquisition decline alert uses the skill threshold with a low-volume guard', () => {
  assert.equal(acquisitionDeclineAlerts(traffic(7), traffic(10)).length, 1)
  assert.match(acquisitionDeclineAlerts(traffic(7), traffic(10))[0], /30\.0%/)
  assert.equal(acquisitionDeclineAlerts(traffic(8), traffic(10)).length, 1)
  assert.equal(acquisitionDeclineAlerts(traffic(9), traffic(10)).length, 0)
  assert.equal(acquisitionDeclineAlerts(traffic(0), traffic(4)).length, 0)
  assert.equal(acquisitionDeclineAlerts(traffic(4), traffic(0)).length, 0)
})

test('missing product events alert only after full contract-live coverage', () => {
  const eventMetrics = {
    title_detail_viewed: { eventCount: 0, totalUsers: 0 },
  }
  assert.equal(missingProductEventAlerts({
    contractLive: false,
    dashboardSessions: 10,
    eventMetrics,
  }).length, 0)
  assert.equal(missingProductEventAlerts({
    contractLive: true,
    dashboardSessions: 2,
    eventMetrics,
  }).length, 0)
  assert.equal(missingProductEventAlerts({
    contractLive: true,
    dashboardSessions: 3,
    eventMetrics,
  }).length, 1)
  assert.equal(missingProductEventAlerts({
    contractLive: true,
    dashboardSessions: 3,
    eventMetrics: {
      title_detail_viewed: { eventCount: 1, totalUsers: 1 },
    },
  }).length, 0)
})
