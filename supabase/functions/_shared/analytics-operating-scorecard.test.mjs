import assert from 'node:assert/strict'
import test from 'node:test'

import {
  renderWeeklyOperatingScorecard,
  weeklyOperatingScorecardRows,
} from './analytics-operating-scorecard.ts'

const app = (name, sessions, engagedSessions) => ({
  app: name,
  hostName: name === 'website'
    ? 'kstorybridge.com'
    : `${name}.kstorybridge.com`,
  activeUsers: 2,
  newUsers: 1,
  sessions,
  engagedSessions,
  engagementRate: sessions > 0 ? engagedSessions / sessions : 0,
})

const input = {
  currentTraffic: { newUsers: 12 },
  previousTraffic: { newUsers: 15 },
  currentApps: [app('website', 20, 10), app('dashboard', 8, 5), app('creator', 4, 3)],
  previousApps: [app('website', 18, 9), app('dashboard', 6, 3), app('creator', 2, 1)],
  buyerProfiles: 3,
  creatorProfiles: 2,
  creatorTitleSubmissions: 1,
  buyerInterests: 2,
  checkoutStartedEvents: 4,
  subscriptionStartedEvents: 1,
  canonicalProductEvents: 9,
  productInstrumentationLive: false,
  commercialInstrumentationLive: false,
}

test('renders every weekly operating layer without inventing activation or retention', () => {
  const report = renderWeeklyOperatingScorecard(input)

  for (const layer of [
    'Acquisition',
    'Buyer activation',
    'Creator activation',
    'Engagement',
    'Retention',
    'Commercial outcomes',
  ]) {
    assert.match(report, new RegExp(`\\| ${layer} \\|`))
  }
  assert.match(report, /Buyer dashboard: 8 sessions \/ 62\.5% engaged/)
  assert.match(report, /creator app: 4 sessions \/ 75\.0% engaged/)
  assert.match(report, /Not reported/)
  assert.doesNotMatch(report, /Buyer activation \| 0/)
  assert.doesNotMatch(report, /Retention \| 0/)
  assert.match(report, /checkout\/subscription instrumentation pending/)
})

test('shows canonical product and commercial signals only after their full-window gates', () => {
  const rows = weeklyOperatingScorecardRows({
    ...input,
    productInstrumentationLive: true,
    commercialInstrumentationLive: true,
  })

  assert.match(rows.find(row => row.layer === 'Engagement').measurementState, /9 canonical buyer-product events/)
  assert.equal(
    rows.find(row => row.layer === 'Commercial outcomes').current,
    '2 authoritative buyer-interest pairs; 4 checkout-start events; 1 subscription confirmations'
  )
})

test('fails closed on invalid counts or app rows', () => {
  assert.throws(
    () => weeklyOperatingScorecardRows({ ...input, buyerInterests: -1 }),
    /invalid_operating_scorecard_count/
  )
  assert.throws(
    () => weeklyOperatingScorecardRows({
      ...input,
      currentApps: input.currentApps.filter(row => row.app !== 'creator'),
    }),
    /invalid_operating_scorecard_app_rows/
  )
  assert.throws(
    () => weeklyOperatingScorecardRows({
      ...input,
      currentApps: input.currentApps.map(row => row.app === 'dashboard'
        ? { ...row, engagementRate: Number.NaN }
        : row),
    }),
    /invalid_operating_scorecard_engagement_rate/
  )
})
