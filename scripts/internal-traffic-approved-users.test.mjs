import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseApprovedUserIds,
  reconcileApprovedInternalUsers,
} from './internal-traffic-approved-users.mjs'

const idOne = '81e1f29a-da1e-4a1d-8ffe-fd9b4ebc1237'
const idTwo = '17e1f29a-da1e-4a1d-8ffe-fd9b4ebc4567'

test('accepts only deduplicated UUIDs and rejects emails or empty input', () => {
  assert.deepEqual(parseApprovedUserIds(`${idOne}, ${idOne.toUpperCase()},${idTwo}`), [idOne, idTwo])
  assert.throws(() => parseApprovedUserIds(''), /missing/)
  assert.throws(() => parseApprovedUserIds('buyer@example.com'), /invalid/)
})

test('reconciliation rejects unvalidated or duplicate identifiers', async () => {
  await assert.rejects(
    reconcileApprovedInternalUsers({
      userIds: ['buyer@example.com'],
      requestUserImpl: async () => ({ app_metadata: {} }),
    }),
    /invalid/
  )
  await assert.rejects(
    reconcileApprovedInternalUsers({
      userIds: [idOne, idOne],
      requestUserImpl: async () => ({ app_metadata: {} }),
    }),
    /invalid/
  )
})

test('dry run returns only aggregate classification evidence', async () => {
  const users = new Map([
    [idOne, { id: idOne, email: 'must-not-leak@example.com', app_metadata: { account_type: 'buyer' } }],
    [idTwo, { id: idTwo, email: 'also-private@example.com', app_metadata: { internal_traffic: true } }],
  ])
  const result = await reconcileApprovedInternalUsers({
    userIds: [idOne, idTwo],
    requestUserImpl: async ({ userId }) => users.get(userId) ?? null,
  })

  assert.deepEqual(result, {
    approvedCount: 2,
    matchedCount: 2,
    missingCount: 0,
    alreadyInternalCount: 1,
    updatedCount: 0,
    allInternal: false,
  })
  assert.doesNotMatch(JSON.stringify(result), /81e1|17e1|example\.com/)
})

test('apply preserves metadata, updates only external users, and verifies all users', async () => {
  const users = new Map([
    [idOne, { id: idOne, app_metadata: { account_type: 'buyer', provider: 'email' } }],
    [idTwo, { id: idTwo, app_metadata: { internal_traffic: true, account_type: 'creator' } }],
  ])
  const writes = []
  const result = await reconcileApprovedInternalUsers({
    userIds: [idOne, idTwo],
    apply: true,
    requestUserImpl: async ({ userId, method = 'GET', body }) => {
      if (method === 'PUT') {
        writes.push({ userId, body })
        users.set(userId, { ...users.get(userId), ...body })
      }
      return users.get(userId) ?? null
    },
  })

  assert.equal(writes.length, 1)
  assert.equal(writes[0].userId, idOne)
  assert.deepEqual(writes[0].body.app_metadata, {
    account_type: 'buyer',
    provider: 'email',
    internal_traffic: true,
  })
  assert.equal(result.updatedCount, 1)
  assert.equal(result.allInternal, true)
})

test('refuses a partial apply before writing when any approved UUID is missing', async () => {
  let writes = 0
  await assert.rejects(
    reconcileApprovedInternalUsers({
      userIds: [idOne, idTwo],
      apply: true,
      requestUserImpl: async ({ userId, method = 'GET' }) => {
        if (method === 'PUT') writes += 1
        return userId === idOne ? { app_metadata: {} } : null
      },
    }),
    /refuse_partial_apply/
  )
  assert.equal(writes, 0)
})
