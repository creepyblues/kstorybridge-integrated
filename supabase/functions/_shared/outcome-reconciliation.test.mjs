import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseOutcomeEventCount,
  reconcileOutcome,
} from './outcome-reconciliation.ts'

test('parses event counts and ignores unrelated outcomes', () => {
  const count = parseOutcomeEventCount([
    { dimensionValues: [{ value: 'interest_submitted' }], metricValues: [{ value: '2' }] },
    { dimensionValues: [{ value: 'interest_submitted' }], metricValues: [{ value: '1' }] },
    { dimensionValues: [{ value: 'signup_completed' }], metricValues: [{ value: '8' }] },
  ], 'interest_submitted')

  assert.equal(count, 3)
})

test('reconciliation suppresses conclusions before instrumentation is live', () => {
  const row = reconcileOutcome('interest_submitted', 2, 0, false)
  assert.equal(row.status, 'instrumentation_pending')
  assert.equal(row.variance, -2)
})

test('live reconciliation uses the five-percent tolerance', () => {
  assert.equal(reconcileOutcome('interest_submitted', 20, 19, true).status, 'matched')
  assert.equal(reconcileOutcome('interest_submitted', 4, 3, true).status, 'drift')
  assert.equal(reconcileOutcome('interest_submitted', 0, 0, true).status, 'no_activity')
})
