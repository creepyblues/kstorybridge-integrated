import assert from 'node:assert/strict'
import test from 'node:test'

import {
  claimProgressReportRun,
  detectAnalyticsAuditLedger,
  progressInvocationKey,
  progressTriggerKind,
} from './analytics-report-audit-client.mjs'

const response = (status, body = []) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

test('distinguishes local and GitHub progress triggers', () => {
  assert.equal(progressTriggerKind({}), 'local_progress')
  assert.equal(progressTriggerKind({ GITHUB_ACTIONS: 'true' }), 'github_progress')
  assert.equal(
    progressInvocationKey('local_progress', '2026-07-13'),
    'analytics-progress:local_progress:2026-07-13:v1'
  )
  assert.throws(() => progressInvocationKey('scheduled', '2026-07-13'))
  assert.throws(() => progressInvocationKey('local_progress', 'July 13'))
})

test('treats only a missing safe RPC as a pre-cutover ledger', async () => {
  assert.equal(await detectAnalyticsAuditLedger({
    supabaseUrl: 'https://example.invalid',
    anonKey: 'anon',
    fetchImpl: async () => response(200),
  }), true)
  assert.equal(await detectAnalyticsAuditLedger({
    supabaseUrl: 'https://example.invalid',
    anonKey: 'anon',
    fetchImpl: async () => response(404),
  }), false)
  await assert.rejects(() => detectAnalyticsAuditLedger({
    supabaseUrl: 'https://example.invalid',
    anonKey: 'anon',
    fetchImpl: async () => response(503),
  }), /probe failed/)
})

test('claims a privacy-safe progress run with exact service credentials', async () => {
  let request
  const claim = await claimProgressReportRun({
    supabaseUrl: 'https://example.invalid',
    serviceRoleKey: 'service-secret',
    invocationKey: 'analytics-progress:github_progress:2026-07-13:v1',
    triggerKind: 'github_progress',
    fetchImpl: async (_url, options) => {
      request = options
      return response(200, [{
        report_run_id: '81000000-0000-4000-8000-000000000099',
        should_execute: true,
      }])
    },
  })

  assert.equal(claim.should_execute, true)
  assert.equal(request.headers.Authorization, 'Bearer service-secret')
  assert.deepEqual(JSON.parse(request.body), {
    p_invocation_key: 'analytics-progress:github_progress:2026-07-13:v1',
    p_report_type: 'progress',
    p_trigger_kind: 'github_progress',
    p_window_start: null,
    p_window_end: null,
  })
})

test('fails closed on missing or rejected run claims', async () => {
  await assert.rejects(() => claimProgressReportRun({
    supabaseUrl: 'https://example.invalid',
    serviceRoleKey: 'service-secret',
    invocationKey: 'analytics-progress:local_progress:2026-07-13:v1',
    triggerKind: 'local_progress',
    fetchImpl: async () => response(403),
  }), /claim failed/)

  await assert.rejects(() => claimProgressReportRun({
    supabaseUrl: 'https://example.invalid',
    serviceRoleKey: 'service-secret',
    invocationKey: 'analytics-progress:local_progress:2026-07-13:v1',
    triggerKind: 'local_progress',
    fetchImpl: async () => response(200, []),
  }), /returned no run/)
})
