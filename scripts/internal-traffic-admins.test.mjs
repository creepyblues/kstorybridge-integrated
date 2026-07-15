import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAdminCandidates,
  maskEmail,
  normalizeEmail,
} from './internal-traffic-admins.mjs'

test('normalizes and masks email without exposing the local part', () => {
  assert.equal(normalizeEmail(' Admin@KStoryBridge.com '), 'admin@kstorybridge.com')
  assert.equal(maskEmail('Admin@KStoryBridge.com'), 'a***@kstorybridge.com')
})

test('matches active admin records to auth users case-insensitively', () => {
  const candidates = buildAdminCandidates(
    [{ email: 'Admin@KStoryBridge.com' }],
    [{
      id: 'user-1',
      email: 'admin@kstorybridge.com',
      app_metadata: { account_type: 'buyer' },
    }]
  )

  assert.deepEqual(candidates, [{
    email: 'admin@kstorybridge.com',
    maskedEmail: 'a***@kstorybridge.com',
    authUserId: 'user-1',
    currentlyInternal: false,
    appMetadata: { account_type: 'buyer' },
  }])
})

test('detects existing internal metadata and missing auth users', () => {
  const candidates = buildAdminCandidates(
    [{ email: 'one@example.com' }, { email: 'missing@example.com' }],
    [{
      id: 'user-1',
      email: 'one@example.com',
      app_metadata: { internal_traffic: true },
    }]
  )

  assert.equal(candidates[0].currentlyInternal, true)
  assert.equal(candidates[1].authUserId, null)
})
