import assert from 'node:assert/strict'
import test from 'node:test'

import {
  previousReportingWindow,
  reportingWindow,
} from './reporting-window.ts'

test('reporting window covers complete Pacific calendar days', () => {
  const window = reportingWindow(7, new Date('2026-07-13T20:00:00.000Z'))

  assert.equal(window.startDate, '2026-07-06')
  assert.equal(window.endDate, '2026-07-12')
  assert.equal(window.start.toISOString(), '2026-07-06T07:00:00.000Z')
  assert.equal(window.endExclusive.toISOString(), '2026-07-13T07:00:00.000Z')
})

test('spring daylight-saving transition preserves calendar boundaries', () => {
  const window = reportingWindow(7, new Date('2026-03-11T20:00:00.000Z'))

  assert.equal(window.start.toISOString(), '2026-03-04T08:00:00.000Z')
  assert.equal(window.endExclusive.toISOString(), '2026-03-11T07:00:00.000Z')
})

test('fall daylight-saving transition preserves calendar boundaries', () => {
  const window = reportingWindow(7, new Date('2026-11-04T20:00:00.000Z'))

  assert.equal(window.start.toISOString(), '2026-10-28T07:00:00.000Z')
  assert.equal(window.endExclusive.toISOString(), '2026-11-04T08:00:00.000Z')
})

test('reporting window rejects invalid day counts', () => {
  assert.throws(() => reportingWindow(0), /positive integer/)
  assert.throws(() => reportingWindow(1.5), /positive integer/)
})

test('previous window is contiguous across a daylight-saving boundary', () => {
  const current = reportingWindow(7, new Date('2026-03-11T20:00:00.000Z'))
  const previous = previousReportingWindow(7, current)

  assert.equal(previous.startDate, '2026-02-25')
  assert.equal(previous.endDate, '2026-03-03')
  assert.equal(previous.endExclusive.toISOString(), current.start.toISOString())
})
