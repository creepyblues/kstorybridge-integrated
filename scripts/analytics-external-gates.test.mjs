import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkWwwCanonicalGate,
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
