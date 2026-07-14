import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isInstrumentationLiveForWindow,
  parseSignupUsersByHost,
  reconcileSignupCounts,
} from './signup-reconciliation.ts'

test('signup users are assigned by production app hostname', () => {
  const counts = parseSignupUsersByHost([
    {
      dimensionValues: [{ value: 'dashboard.kstorybridge.com' }],
      metricValues: [{ value: '4' }],
    },
    {
      dimensionValues: [{ value: 'creator.kstorybridge.com' }],
      metricValues: [{ value: '2' }],
    },
    {
      dimensionValues: [{ value: 'localhost' }],
      metricValues: [{ value: '99' }],
    },
  ])

  assert.deepEqual(counts, { buyer: 4, creator: 2 })
})

test('reconciliation distinguishes pending instrumentation, matches, and drift', () => {
  const pending = reconcileSignupCounts(
    { buyer: 3, creator: 1 },
    { buyer: 0, creator: 0 },
    false
  )
  assert.ok(pending.every(row => row.status === 'instrumentation_pending'))

  const live = reconcileSignupCounts(
    { buyer: 3, creator: 0 },
    { buyer: 3, creator: 1 },
    true
  )
  assert.equal(live[0].status, 'matched')
  assert.equal(live[0].variance, 0)
  assert.equal(live[1].status, 'drift')
  assert.equal(live[1].variance, 1)

  const withinTolerance = reconcileSignupCounts(
    { buyer: 20, creator: 0 },
    { buyer: 19, creator: 0 },
    true
  )
  assert.equal(withinTolerance[0].status, 'matched')
  assert.equal(withinTolerance[0].varianceRate, 0.05)
})

test('an empty live reporting window is no activity, not a tracking failure', () => {
  const rows = reconcileSignupCounts(
    { buyer: 0, creator: 0 },
    { buyer: 0, creator: 0 },
    true
  )

  assert.ok(rows.every(row => row.status === 'no_activity'))
})

test('instrumentation is live only when its timestamp predates the full window', () => {
  const windowStart = new Date('2026-07-06T07:00:00.000Z')

  assert.equal(isInstrumentationLiveForWindow(undefined, windowStart), false)
  assert.equal(isInstrumentationLiveForWindow('not-a-date', windowStart), false)
  assert.equal(isInstrumentationLiveForWindow('2026-07-06T07:00:00.000Z', windowStart), true)
  assert.equal(isInstrumentationLiveForWindow('2026-07-07T07:00:00.000Z', windowStart), false)
})
