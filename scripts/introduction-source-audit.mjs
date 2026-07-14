#!/usr/bin/env node

import { pathToFileURL } from 'node:url'

const REQUEST_LIMIT = 10_000
const EXPECTED_FIELDS = ['id', 'user_id', 'title_id', 'type', 'created_at']

const parseExactCount = value => {
  const match = typeof value === 'string' ? value.match(/\/(\d+)$/) : null
  if (!match) throw new Error('introduction_audit_missing_exact_count')
  const count = Number(match[1])
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('introduction_audit_invalid_exact_count')
  }
  return count
}

const safeIsoBounds = rows => {
  const timestamps = rows
    .map(row => Date.parse(row?.created_at))
    .filter(Number.isFinite)
  return {
    earliestCreatedAt: timestamps.length
      ? new Date(Math.min(...timestamps)).toISOString()
      : null,
    latestCreatedAt: timestamps.length
      ? new Date(Math.max(...timestamps)).toISOString()
      : null,
  }
}

export async function auditIntroductionSources({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = fetch,
} = {}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('introduction_audit_missing_credentials')
  }
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  }
  const schemaResponse = await fetchImpl(`${supabaseUrl}/rest/v1/`, {
    headers: { ...headers, Accept: 'application/openapi+json' },
  })
  if (!schemaResponse.ok) throw new Error('introduction_audit_schema_unavailable')

  const openApi = await schemaResponse.json()
  const properties = openApi?.definitions?.request?.properties
  if (!properties || typeof properties !== 'object') {
    return {
      tablePresent: false,
      exactRecordCount: 0,
      contactRecords: 0,
      pitchRecords: 0,
      otherRecords: 0,
      expectedFieldsPresent: [],
      missingExpectedFields: [...EXPECTED_FIELDS],
      earliestCreatedAt: null,
      latestCreatedAt: null,
      hasHistoricalContactEvidence: false,
      supportsCompletedIntroduction: false,
    }
  }

  const rowsResponse = await fetchImpl(
    `${supabaseUrl}/rest/v1/request?select=type,created_at&limit=${REQUEST_LIMIT}`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  )
  if (!rowsResponse.ok) throw new Error('introduction_audit_rows_unavailable')
  const rows = await rowsResponse.json()
  if (!Array.isArray(rows)) throw new Error('introduction_audit_invalid_rows')
  const exactRecordCount = parseExactCount(rowsResponse.headers.get('content-range'))
  if (rows.length !== exactRecordCount || exactRecordCount >= REQUEST_LIMIT) {
    throw new Error('introduction_audit_incomplete_rows')
  }

  const contactRecords = rows.filter(row => row?.type === 'contact').length
  const pitchRecords = rows.filter(row => row?.type === 'pitch').length
  const fields = new Set(Object.keys(properties))
  const expectedFieldsPresent = EXPECTED_FIELDS.filter(field => fields.has(field))
  const missingExpectedFields = EXPECTED_FIELDS.filter(field => !fields.has(field))

  return {
    tablePresent: true,
    exactRecordCount,
    contactRecords,
    pitchRecords,
    otherRecords: exactRecordCount - contactRecords - pitchRecords,
    expectedFieldsPresent,
    missingExpectedFields,
    ...safeIsoBounds(rows),
    hasHistoricalContactEvidence: contactRecords > 0,
    supportsCompletedIntroduction: fields.has('completed_at') && fields.has('status'),
  }
}

const isCli = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isCli) {
  const result = await auditIntroductionSources({
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
  console.log(JSON.stringify(result, null, 2))
}
