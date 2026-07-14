import assert from 'node:assert/strict'
import test from 'node:test'

import {
  authorizeFunnelReportRequest,
  bearerToken,
  isServiceRoleRequest,
  progressInvocationKey,
  scheduledFunnelInvocationKey,
  validateInvocationKey,
} from './analytics-report-auth.ts'

const serviceRoleKey = 'service-role-secret-value'
const cronSecret = 'cron-secret-value'

test('accepts only an exact Bearer service-role token', () => {
  assert.equal(isServiceRoleRequest(`Bearer ${serviceRoleKey}`, serviceRoleKey), true)
  assert.equal(isServiceRoleRequest(`bearer ${serviceRoleKey}`, serviceRoleKey), false)
  assert.equal(isServiceRoleRequest(`Bearer ${serviceRoleKey} extra`, serviceRoleKey), false)
  assert.equal(isServiceRoleRequest('Bearer anon-key', serviceRoleKey), false)
  assert.equal(isServiceRoleRequest(null, serviceRoleKey), false)
  assert.equal(bearerToken(`Bearer ${serviceRoleKey}`), serviceRoleKey)
})

test('derives scheduled identity only from the exact cron secret', () => {
  assert.deepEqual(authorizeFunnelReportRequest({
    authorization: null,
    cronSecretHeader: cronSecret,
    serviceRoleKey,
    cronSecret,
  }), { authorized: true, triggerKind: 'scheduled' })

  assert.deepEqual(authorizeFunnelReportRequest({
    authorization: `Bearer ${serviceRoleKey}`,
    cronSecretHeader: null,
    serviceRoleKey,
    cronSecret,
  }), { authorized: true, triggerKind: 'manual' })

  assert.deepEqual(authorizeFunnelReportRequest({
    authorization: `Bearer ${serviceRoleKey}`,
    cronSecretHeader: 'wrong-secret',
    serviceRoleKey,
    cronSecret,
  }), { authorized: true, triggerKind: 'manual' })
})

test('rejects anon, authenticated-user, missing, and malformed credentials', () => {
  for (const authorization of [null, 'Bearer anon-key', 'Bearer user-jwt', 'Basic value']) {
    assert.equal(authorizeFunnelReportRequest({
      authorization,
      cronSecretHeader: null,
      serviceRoleKey,
      cronSecret,
    }).authorized, false)
  }

  assert.deepEqual(authorizeFunnelReportRequest({
    authorization: `Bearer ${serviceRoleKey}`,
    cronSecretHeader: null,
    serviceRoleKey: undefined,
    cronSecret,
  }), { authorized: false, reason: 'missing_configuration' })
})

test('builds controlled idempotency keys and rejects unsafe caller keys', () => {
  assert.equal(
    scheduledFunnelInvocationKey('2026-07-06', '2026-07-12'),
    'weekly-funnel:2026-07-06:2026-07-12:v1'
  )
  assert.equal(
    progressInvocationKey('local_progress', '2026-07-13', '43482439 dirty!'),
    'analytics-progress:local_progress:2026-07-13:43482439dirty'
  )
  assert.equal(validateInvocationKey('manual-funnel:2026-07-13:abc'), 'manual-funnel:2026-07-13:abc')
  assert.equal(validateInvocationKey('contains spaces'), null)
  assert.equal(validateInvocationKey('short'), null)
  assert.equal(validateInvocationKey('x'.repeat(161)), null)
})
