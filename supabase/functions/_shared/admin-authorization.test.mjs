import assert from 'node:assert/strict'
import test from 'node:test'

import { authorizeActiveAdminRequest } from './admin-authorization.ts'

const adminUserId = '123e4567-e89b-42d3-a456-426614174000'

function authorize(overrides = {}) {
  return authorizeActiveAdminRequest({
    authorization: 'Bearer authenticated-jwt',
    claimedAdminUserId: adminUserId,
    getAuthenticatedUserId: async token => token === 'authenticated-jwt' ? adminUserId : null,
    isActiveAdmin: async userId => userId === adminUserId,
    ...overrides,
  })
}

test('derives approval authority from an exact bearer token and active admin row', async () => {
  assert.deepEqual(await authorize(), { authorized: true, adminUserId })
})

test('rejects missing, malformed, and invalid credentials before the admin lookup', async () => {
  for (const authorization of [null, 'Basic value', 'bearer authenticated-jwt', 'Bearer token extra']) {
    let adminLookupCalled = false
    const result = await authorize({
      authorization,
      isActiveAdmin: async () => {
        adminLookupCalled = true
        return true
      },
    })
    assert.deepEqual(result, { authorized: false, status: 401, error: 'Unauthorized' })
    assert.equal(adminLookupCalled, false)
  }

  assert.deepEqual(await authorize({
    getAuthenticatedUserId: async () => null,
  }), { authorized: false, status: 401, error: 'Unauthorized' })
})

test('rejects a spoofed admin id and an inactive admin', async () => {
  let adminLookupCalled = false
  assert.deepEqual(await authorize({
    claimedAdminUserId: '223e4567-e89b-42d3-a456-426614174001',
    isActiveAdmin: async () => {
      adminLookupCalled = true
      return true
    },
  }), { authorized: false, status: 403, error: 'Admin access required' })
  assert.equal(adminLookupCalled, false)

  assert.deepEqual(await authorize({
    isActiveAdmin: async () => false,
  }), { authorized: false, status: 403, error: 'Admin access required' })
})
