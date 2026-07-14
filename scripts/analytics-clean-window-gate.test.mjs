import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkCleanWindowGate,
  cleanWindowProgress,
  evaluateCleanWindowRows,
  summarizeCleanWindowGate,
} from './analytics-clean-window-gate.mjs'

const gaRow = ({
  date = '20260714',
  host = 'kstorybridge.com',
  source = '(direct) / (none)',
  sessions = '2',
} = {}) => ({
  dimensionValues: [{ value: date }, { value: host }, { value: source }],
  metricValues: [{ value: sessions }],
})

const exampleLiveAt = '2026-07-13T20:00:00.000Z'

test('starts on the first full Pacific day after a real cutover', () => {
  assert.equal(cleanWindowProgress(new Date('2026-07-14T20:00:00Z')).configured, false)
  assert.equal(cleanWindowProgress(new Date('2026-07-14T20:00:00Z'), exampleLiveAt).completeDays, 0)
  assert.equal(cleanWindowProgress(new Date('2026-07-15T08:00:00Z'), exampleLiveAt).completeDays, 1)
  const complete = cleanWindowProgress(new Date('2026-07-21T08:00:00Z'), exampleLiveAt)
  assert.equal(complete.completeDays, 7)
  assert.equal(complete.startDate, '2026-07-14')
  assert.equal(complete.endDate, '2026-07-20')
  assert.equal(complete.earliestCloseDate, '2026-07-21')
})

test('aggregates clean rows and detects every excluded boundary', () => {
  const clean = evaluateCleanWindowRows([
    gaRow(),
    gaRow({ host: 'dashboard.kstorybridge.com', source: 'google / organic', sessions: '3' }),
  ], { startDate: '2026-07-14', endDate: '2026-07-14', rowCount: 2 })
  assert.deepEqual(clean, { sessions: 5, leakedRows: 0, rowCount: 2 })

  for (const row of [
    gaRow({ host: 'localhost' }),
    gaRow({ source: 'lu001.r.sp1-brevo.net / referral' }),
    gaRow({ source: 'localhost:5173 / referral' }),
    gaRow({ source: 'preview.vercel.app / referral' }),
  ]) {
    assert.equal(evaluateCleanWindowRows([row], {
      startDate: '2026-07-14',
      endDate: '2026-07-14',
      rowCount: 1,
    }).leakedRows, 1)
  }
})

test('fails closed on incomplete, duplicate, malformed, or out-of-window GA evidence', () => {
  assert.throws(() => evaluateCleanWindowRows([], {
    startDate: '2026-07-14', endDate: '2026-07-14', rowCount: 1,
  }), /incomplete_rows/)
  assert.throws(() => evaluateCleanWindowRows([gaRow(), gaRow()], {
    startDate: '2026-07-14', endDate: '2026-07-14', rowCount: 2,
  }), /duplicate_row/)
  assert.throws(() => evaluateCleanWindowRows([gaRow({ sessions: '-1' })], {
    startDate: '2026-07-14', endDate: '2026-07-14', rowCount: 1,
  }), /invalid_metric/)
  assert.throws(() => evaluateCleanWindowRows([gaRow({ date: '20260713' })], {
    startDate: '2026-07-14', endDate: '2026-07-14', rowCount: 1,
  }), /invalid_dimension/)
})

test('distinguishes waiting, unavailable, degraded, pending, and healthy gates', () => {
  const unconfigured = cleanWindowProgress(new Date('2026-07-14T20:00:00Z'))
  assert.equal(summarizeCleanWindowGate(unconfigured, null).status, 'PENDING')
  assert.match(summarizeCleanWindowGate(unconfigured, null).summary, /has not started/)

  const waiting = cleanWindowProgress(new Date('2026-07-14T20:00:00Z'), exampleLiveAt)
  assert.equal(summarizeCleanWindowGate(waiting, null).status, 'PENDING')

  const partial = cleanWindowProgress(new Date('2026-07-16T08:00:00Z'), exampleLiveAt)
  assert.equal(summarizeCleanWindowGate(partial, null).status, 'UNAVAILABLE')
  assert.equal(summarizeCleanWindowGate(partial, {
    sessions: 4, leakedRows: 0, rowCount: 2,
  }).status, 'PENDING')
  assert.equal(summarizeCleanWindowGate(partial, {
    sessions: 4, leakedRows: 1, rowCount: 2,
  }).status, 'DEGRADED')

  const complete = cleanWindowProgress(new Date('2026-07-21T08:00:00Z'), exampleLiveAt)
  assert.equal(summarizeCleanWindowGate(complete, {
    sessions: 7, leakedRows: 0, rowCount: 3,
  }).status, 'HEALTHY')
})

test('uses the centralized clean filter in the real GA request', async () => {
  let requestBody
  const gate = await checkCleanWindowGate({
    now: new Date('2026-07-16T08:00:00Z'),
    liveAt: exampleLiveAt,
    accessTokenProvider: async () => 'read-token',
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body)
      return new Response(JSON.stringify({
        rowCount: 1,
        rows: [gaRow()],
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    },
  })

  assert.equal(gate.status, 'PENDING')
  assert.deepEqual(requestBody.dateRanges, [{ startDate: '2026-07-14', endDate: '2026-07-15' }])
  const serialized = JSON.stringify(requestBody.dimensionFilter)
  for (const value of [
    'kstorybridge.com',
    'dashboard.kstorybridge.com',
    'creator.kstorybridge.com',
    'lu001.r.a.d.sendibm1.com / referral',
    'localhost',
    '.vercel.app',
  ]) assert.match(serialized, new RegExp(value.replaceAll('.', '\\.')))
})

test('does not request credentials before cutover or the first complete day', async () => {
  let tokenCalls = 0
  const gate = await checkCleanWindowGate({
    now: new Date('2026-07-14T20:00:00Z'),
    accessTokenProvider: async () => {
      tokenCalls += 1
      throw new Error('must not run')
    },
  })
  assert.equal(gate.status, 'PENDING')
  assert.equal(tokenCalls, 0)

  const configuredGate = await checkCleanWindowGate({
    now: new Date('2026-07-14T20:00:00Z'),
    liveAt: exampleLiveAt,
    accessTokenProvider: async () => {
      tokenCalls += 1
      throw new Error('must not run')
    },
  })
  assert.equal(configuredGate.status, 'PENDING')
  assert.equal(tokenCalls, 0)
})
