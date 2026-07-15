import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseTitleWorkflowEvents,
  reconcileTitleWorkflow,
} from './title-workflow-reconciliation.ts'

const emptyCounts = () => ({ draft_created: 0, submitted: 0, approved: 0, published: 0 })

test('parses event counts because one creator may submit multiple titles', () => {
  const counts = parseTitleWorkflowEvents([
    { dimensionValues: [{ value: 'title_draft_created' }], metricValues: [{ value: '4' }] },
    { dimensionValues: [{ value: 'title_submitted' }], metricValues: [{ value: '3' }] },
    { dimensionValues: [{ value: 'unrelated_event' }], metricValues: [{ value: '99' }] },
  ])

  assert.deepEqual(counts, { draft_created: 4, submitted: 3, approved: 0, published: 0 })
})

test('pre-release client outcomes are instrumentation pending', () => {
  const authoritative = { ...emptyCounts(), draft_created: 2, submitted: 1 }
  const rows = reconcileTitleWorkflow(authoritative, emptyCounts(), false, false, false)

  assert.equal(rows[0].status, 'instrumentation_pending')
  assert.equal(rows[1].status, 'instrumentation_pending')
  assert.equal(rows[2].status, 'server_event_pending')
  assert.equal(rows[3].status, 'linkage_pending')
})

test('live linked outcomes use the five-percent reconciliation tolerance', () => {
  const authoritative = { draft_created: 20, submitted: 4, approved: 2, published: 2 }
  const tracked = { draft_created: 19, submitted: 3, approved: 2, published: 2 }
  const rows = reconcileTitleWorkflow(authoritative, tracked, true, true, true)

  assert.equal(rows[0].status, 'matched')
  assert.equal(rows[1].status, 'drift')
  assert.equal(rows[2].status, 'matched')
  assert.equal(rows[3].status, 'matched')
})

test('an empty fully instrumented stage is no activity', () => {
  const rows = reconcileTitleWorkflow(emptyCounts(), emptyCounts(), true, true, true)
  assert.ok(rows.every(row => row.status === 'no_activity'))
})
