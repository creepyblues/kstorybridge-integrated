import assert from 'node:assert/strict'
import test from 'node:test'

import { auditIntroductionSources } from './introduction-source-audit.mjs'

const schemaResponse = properties => new Response(JSON.stringify({
  definitions: properties ? { request: { properties } } : {},
}), {
  status: 200,
  headers: { 'content-type': 'application/json' },
})

const rowsResponse = rows => new Response(JSON.stringify(rows), {
  status: 200,
  headers: {
    'content-type': 'application/json',
    'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0',
  },
})

const expectedProperties = Object.fromEntries(
  ['id', 'user_id', 'title_id', 'type', 'created_at'].map(field => [field, {}])
)

test('reports only privacy-safe aggregate introduction-source evidence', async () => {
  const calls = []
  const responses = [
    schemaResponse(expectedProperties),
    rowsResponse([
      { type: 'contact', created_at: '2025-10-09T14:25:43.229Z', user_id: 'must-not-leak' },
      { type: 'pitch', created_at: '2025-09-24T04:48:47.032Z', title_id: 'must-not-leak' },
      { type: 'unexpected-private-value', created_at: 'invalid' },
    ]),
  ]
  const result = await auditIntroductionSources({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'server-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return responses.shift()
    },
  })

  assert.deepEqual(result, {
    tablePresent: true,
    exactRecordCount: 3,
    contactRecords: 1,
    pitchRecords: 1,
    otherRecords: 1,
    expectedFieldsPresent: ['id', 'user_id', 'title_id', 'type', 'created_at'],
    missingExpectedFields: [],
    earliestCreatedAt: '2025-09-24T04:48:47.032Z',
    latestCreatedAt: '2025-10-09T14:25:43.229Z',
    hasHistoricalContactEvidence: true,
    supportsCompletedIntroduction: false,
  })
  assert.equal(calls.length, 2)
  assert.match(calls[1].url, /select=type,created_at/)
  assert.doesNotMatch(JSON.stringify(result), /must-not-leak|unexpected-private-value|server-secret/)
})

test('reports a missing request definition without querying rows', async () => {
  let calls = 0
  const result = await auditIntroductionSources({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'server-secret',
    fetchImpl: async () => {
      calls += 1
      return schemaResponse(null)
    },
  })

  assert.equal(calls, 1)
  assert.equal(result.tablePresent, false)
  assert.equal(result.hasHistoricalContactEvidence, false)
})

test('fails closed when the exact count proves the row sample is incomplete', async () => {
  const responses = [
    schemaResponse(expectedProperties),
    new Response(JSON.stringify([{ type: 'contact', created_at: '2025-10-09T14:25:43.229Z' }]), {
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': '0-0/2' },
    }),
  ]

  await assert.rejects(
    auditIntroductionSources({
      supabaseUrl: 'https://example.supabase.co',
      serviceRoleKey: 'server-secret',
      fetchImpl: async () => responses.shift(),
    }),
    /introduction_audit_incomplete_rows/
  )
})
