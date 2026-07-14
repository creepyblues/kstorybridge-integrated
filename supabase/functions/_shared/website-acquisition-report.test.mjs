import assert from 'node:assert/strict'
import test from 'node:test'

import {
  WEBSITE_ACQUISITION_EVENTS,
  missingWebsiteAcquisitionAlerts,
  parseWebsiteAcquisitionEvents,
  renderWebsiteAcquisitionSection,
  websiteAcquisitionDimensionFilters,
} from './website-acquisition-report.ts'

const row = (eventName, eventCount, totalUsers) => ({
  dimensionValues: [{ value: eventName }],
  metricValues: [{ value: String(eventCount) }, { value: String(totalUsers) }],
})

test('uses the exact canonical website acquisition inventory', () => {
  assert.deepEqual(WEBSITE_ACQUISITION_EVENTS, [
    'audience_path_selected',
    'feature_promo_selected',
    'trial_cta_clicked',
    'signup_cta_clicked',
    'signin_cta_clicked',
    'creator_inquiry_started',
    'creator_inquiry_submitted',
    'creator_inquiry_failed',
  ])
})

test('scopes the GA query to the canonical website host and event inventory', () => {
  assert.deepEqual(websiteAcquisitionDimensionFilters(), [
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
  ])
})

test('parses known events and zero-fills missing canonical rows', () => {
  const metrics = parseWebsiteAcquisitionEvents([
    row('audience_path_selected', 7, 5),
    row('trial_cta_clicked', 3, 2),
    row('unknown_future_event', 99, 99),
  ])

  assert.deepEqual(metrics.audience_path_selected, { eventCount: 7, totalUsers: 5 })
  assert.deepEqual(metrics.trial_cta_clicked, { eventCount: 3, totalUsers: 2 })
  assert.deepEqual(metrics.creator_inquiry_submitted, { eventCount: 0, totalUsers: 0 })
  assert.equal(Object.keys(metrics).length, WEBSITE_ACQUISITION_EVENTS.length)
})

test('fails closed on duplicate or malformed GA evidence', () => {
  assert.throws(
    () => parseWebsiteAcquisitionEvents([
      row('signup_cta_clicked', 1, 1),
      row('signup_cta_clicked', 2, 2),
    ]),
    /duplicate_website_acquisition_event/
  )
  assert.throws(
    () => parseWebsiteAcquisitionEvents([row('trial_cta_clicked', '1.5', 1)]),
    /invalid_website_acquisition_metric/
  )
  assert.throws(
    () => parseWebsiteAcquisitionEvents([{
      dimensionValues: [{ value: 'trial_cta_clicked' }],
      metricValues: [{ value: '1' }],
    }]),
    /invalid_website_acquisition_metric/
  )
})

test('renders instrumentation pending without turning missing evidence into zero', () => {
  const report = renderWebsiteAcquisitionSection(
    parseWebsiteAcquisitionEvents([]),
    false
  )

  assert.match(report, /Instrumentation pending/)
  assert.match(report, /Missing events are not rendered as zero behavior/)
  assert.doesNotMatch(report, /\| 0 \| 0 \|/)
})

test('renders fixed event rows only after the full-window live gate', () => {
  const report = renderWebsiteAcquisitionSection(
    parseWebsiteAcquisitionEvents([
      row('audience_path_selected', 7, 5),
      row('creator_inquiry_submitted', 1, 1),
    ]),
    true
  )

  assert.match(report, /Creator or buyer path selected \| 5 \| 7/)
  assert.match(report, /Creator inquiry delivered \| 1 \| 1/)
  assert.match(report, /Buyer signup handoff clicked \| 0 \| 0/)
  assert.match(report, /event-level leading signals, not a closed cohort funnel/)
  assert.match(report, /AR-208/)
})

test('refuses invalid in-memory metrics before rendering', () => {
  const metrics = parseWebsiteAcquisitionEvents([])
  metrics.signin_cta_clicked.eventCount = Number.NaN
  assert.throws(
    () => renderWebsiteAcquisitionSection(metrics, true),
    /invalid_website_acquisition_metric/
  )
})

test('alerts on a live zero-event window only after the session-volume gate', () => {
  const metrics = parseWebsiteAcquisitionEvents([])

  assert.deepEqual(missingWebsiteAcquisitionAlerts({
    contractLive: false,
    websiteSessions: 10,
    metrics,
  }), [])
  assert.deepEqual(missingWebsiteAcquisitionAlerts({
    contractLive: true,
    websiteSessions: 2,
    metrics,
  }), [])

  const alerts = missingWebsiteAcquisitionAlerts({
    contractLive: true,
    websiteSessions: 3,
    metrics,
  })
  assert.equal(alerts.length, 1)
  assert.match(alerts[0], /zero canonical handoff events/)
  assert.match(alerts[0], /sample homepage and audience-path CTAs in DebugView/)
})

test('does not alert when any canonical handoff is observed', () => {
  const metrics = parseWebsiteAcquisitionEvents([
    row('audience_path_selected', 1, 1),
  ])
  assert.deepEqual(missingWebsiteAcquisitionAlerts({
    contractLive: true,
    websiteSessions: 20,
    metrics,
  }), [])
})

test('fails closed on invalid live alert inputs', () => {
  assert.throws(
    () => missingWebsiteAcquisitionAlerts({
      contractLive: true,
      websiteSessions: -1,
      metrics: parseWebsiteAcquisitionEvents([]),
    }),
    /invalid_website_acquisition_session_count/
  )
})
