import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkWwwCanonicalGate,
  summarizeDefaultBranchWorkflow,
  summarizeReleasePrGate,
  summarizeWwwCanonicalGate,
} from './analytics-external-gates.mjs'

const ok = { ok: true }
const failed = { ok: false }

test('marks the www gate healthy only when every TLS and redirect probe passes', () => {
  assert.deepEqual(
    summarizeWwwCanonicalGate([ok, ok, ok], [ok, ok, ok]),
    {
      id: 'AR-115',
      name: 'www TLS and canonical redirect',
      status: 'HEALTHY',
      summary: '3/3 valid TLS; 3/3 canonical redirects',
      alert: null,
    }
  )
})

test('marks intermittent expired-certificate results degraded', () => {
  const result = summarizeWwwCanonicalGate(
    [ok, failed, ok, failed],
    [ok, failed, ok, failed]
  )

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '2/4 valid TLS; 2/4 canonical redirects')
  assert.match(result.alert, /entry point is degraded/)
})

test('marks a valid certificate with a wrong redirect degraded', () => {
  const result = summarizeWwwCanonicalGate([ok, ok], [failed, failed])

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '2/2 valid TLS; 0/2 canonical redirects')
})

test('marks a completely unreachable entry point unavailable', () => {
  const result = summarizeWwwCanonicalGate([failed, failed], [failed, failed])

  assert.equal(result.status, 'UNAVAILABLE')
  assert.match(result.alert, /entry point is unavailable/)
})

test('converts rejected probes into a non-throwing degraded result', async () => {
  const result = await checkWwwCanonicalGate({
    probeCount: 2,
    tlsProbe: async () => {
      throw new Error('network detail must not enter the report')
    },
    redirectProbe: async () => ok,
  })

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '0/2 valid TLS; 2/2 canonical redirects')
  assert.doesNotMatch(result.alert, /network detail/)
})

test('classifies default-branch workflow presence, absence, and unavailable state', () => {
  assert.equal(summarizeDefaultBranchWorkflow(200).status, 'HEALTHY')
  assert.equal(summarizeDefaultBranchWorkflow(404).status, 'PENDING')
  assert.equal(summarizeDefaultBranchWorkflow(503).status, 'UNAVAILABLE')
})

const actionCheck = (id, conclusion, status = 'completed') => ({
  id,
  status,
  conclusion,
  app: { slug: 'github-actions' },
})

const openPr = { state: 'open', draft: true, merged_at: null }

test('distinguishes an account billing lock from a code failure', () => {
  const lockedChecks = [actionCheck(1, 'failure'), actionCheck(2, 'failure')]
  const annotations = new Map([
    [1, [{ message: 'The job was not started because your account is locked due to a billing issue.' }]],
    [2, [{ message: 'The job was not started because your account is locked due to a billing issue.' }]],
  ])
  const locked = summarizeReleasePrGate({
    pr: openPr,
    checkRuns: lockedChecks,
    annotationsById: annotations,
  })
  assert.equal(locked.status, 'BILLING_LOCKED')
  assert.match(locked.summary, /ran zero steps/)

  const failed = summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(3, 'failure')],
    annotationsById: new Map([[3, [{ message: 'TypeScript compilation failed' }]]]),
  })
  assert.equal(failed.status, 'FAILED')
  assert.doesNotMatch(failed.alert, /TypeScript compilation failed/)
})

test('reports healthy, pending, and unavailable release CI without counting external checks', () => {
  const vercelCheck = {
    id: 99,
    status: 'completed',
    conclusion: 'success',
    app: { slug: 'vercel' },
  }
  assert.equal(summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(1, 'success'), vercelCheck],
  }).status, 'HEALTHY')

  assert.equal(summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(2, null, 'in_progress'), vercelCheck],
  }).status, 'PENDING')

  assert.equal(summarizeReleasePrGate({
    pr: null,
    checkRuns: null,
  }).status, 'UNAVAILABLE')
})

test('reports a closed unmerged release PR as a release-path failure', () => {
  const result = summarizeReleasePrGate({
    pr: { state: 'closed', draft: false, merged_at: null },
    checkRuns: [],
  })
  assert.equal(result.status, 'CLOSED')
  assert.match(result.alert, /closed without merge/)
})
