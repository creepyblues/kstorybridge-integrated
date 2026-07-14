import { createSign } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import {
  BREVO_SCANNER_SOURCE_MEDIUMS,
  NON_PRODUCTION_REFERRER_PATTERNS,
  PRODUCTION_ANALYTICS_HOSTS,
} from '../supabase/functions/_shared/analytics-filter-values.mjs'

export const CLEAN_WINDOW_REQUIRED_DAYS = 7
const GA4_PROPERTY_ID = '496541587'
const REPORT_LIMIT = 10_000
const TIME_ZONE = 'America/Los_Angeles'
const DAY_MS = 86_400_000

const dateInPacific = date => new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

const addCalendarDays = (dateString, days) => {
  const date = new Date(`${dateString}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function cleanWindowProgress(
  now = new Date(),
  liveAt = process.env.ANALYTICS_CLEAN_FILTER_LIVE_AT
) {
  const liveAtDate = liveAt ? new Date(liveAt) : null
  if (!liveAtDate || !Number.isFinite(liveAtDate.getTime())) {
    return {
      configured: false,
      today: dateInPacific(now),
      completeDays: 0,
      startDate: null,
      endDate: null,
      earliestCloseDate: null,
    }
  }
  const startDate = addCalendarDays(dateInPacific(liveAtDate), 1)
  const today = dateInPacific(now)
  const elapsed = Math.floor(
    (Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${startDate}T00:00:00.000Z`))
      / DAY_MS
  )
  const completeDays = Math.max(0, Math.min(CLEAN_WINDOW_REQUIRED_DAYS, elapsed))
  return {
    configured: true,
    today,
    completeDays,
    startDate,
    endDate: completeDays > 0
      ? addCalendarDays(startDate, completeDays - 1)
      : null,
    earliestCloseDate: addCalendarDays(startDate, CLEAN_WINDOW_REQUIRED_DAYS),
  }
}

const cleanProductionFilter = () => ({
  andGroup: {
    expressions: [
      {
        filter: {
          fieldName: 'hostName',
          inListFilter: {
            values: [...PRODUCTION_ANALYTICS_HOSTS],
            caseSensitive: false,
          },
        },
      },
      {
        notExpression: {
          orGroup: {
            expressions: BREVO_SCANNER_SOURCE_MEDIUMS.map(value => ({
              filter: {
                fieldName: 'sessionSourceMedium',
                stringFilter: {
                  matchType: 'EXACT',
                  value,
                  caseSensitive: false,
                },
              },
            })),
          },
        },
      },
      {
        notExpression: {
          orGroup: {
            expressions: NON_PRODUCTION_REFERRER_PATTERNS.map(value => ({
              filter: {
                fieldName: 'sessionSourceMedium',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value,
                  caseSensitive: false,
                },
              },
            })),
          },
        },
      },
    ],
  },
})

const base64Url = value => Buffer.from(value).toString('base64url')

async function readServiceAccount({ credentialsJson, credentialsPath }) {
  let value = credentialsJson
  if (!value && credentialsPath) value = await readFile(credentialsPath, 'utf8')
  if (!value) throw new Error('ga_clean_window_missing_credentials')

  let credentials
  try {
    credentials = JSON.parse(value)
  } catch {
    throw new Error('ga_clean_window_invalid_credentials')
  }
  if (
    typeof credentials.client_email !== 'string'
    || typeof credentials.private_key !== 'string'
  ) {
    throw new Error('ga_clean_window_invalid_credentials')
  }
  return credentials
}

export async function googleAnalyticsReadToken({
  credentialsJson = process.env.GA4_SERVICE_ACCOUNT_JSON,
  credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  const credentials = await readServiceAccount({ credentialsJson, credentialsPath })
  const issuedAt = Math.floor(now.getTime() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  }))
  const signingInput = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(signingInput)
  signer.end()
  const assertion = `${signingInput}.${signer.sign(credentials.private_key).toString('base64url')}`
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error('ga_clean_window_token_unavailable')
  const body = await response.json()
  if (typeof body.access_token !== 'string' || !body.access_token) {
    throw new Error('ga_clean_window_token_unavailable')
  }
  return body.access_token
}

const parseMetric = value => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error('ga_clean_window_invalid_metric')
  }
  const count = Number(value)
  if (!Number.isSafeInteger(count)) throw new Error('ga_clean_window_invalid_metric')
  return count
}

export function evaluateCleanWindowRows(rows, { startDate, endDate, rowCount }) {
  if (!Array.isArray(rows) || !Number.isSafeInteger(rowCount) || rowCount !== rows.length) {
    throw new Error('ga_clean_window_incomplete_rows')
  }
  const expectedDates = new Set()
  for (let date = startDate; date <= endDate; date = addCalendarDays(date, 1)) {
    expectedDates.add(date.replaceAll('-', ''))
  }
  const productionHosts = new Set(PRODUCTION_ANALYTICS_HOSTS.map(value => value.toLowerCase()))
  const scannerSources = new Set(BREVO_SCANNER_SOURCE_MEDIUMS.map(value => value.toLowerCase()))
  const developmentPatterns = NON_PRODUCTION_REFERRER_PATTERNS.map(value => value.toLowerCase())
  const seen = new Set()
  let sessions = 0
  let leakedRows = 0

  for (const row of rows) {
    const date = row?.dimensionValues?.[0]?.value
    const host = row?.dimensionValues?.[1]?.value
    const sourceMedium = row?.dimensionValues?.[2]?.value
    if (
      typeof date !== 'string'
      || typeof host !== 'string'
      || typeof sourceMedium !== 'string'
      || !expectedDates.has(date)
    ) {
      throw new Error('ga_clean_window_invalid_dimension')
    }
    const key = `${date}\u0000${host}\u0000${sourceMedium}`
    if (seen.has(key)) throw new Error('ga_clean_window_duplicate_row')
    seen.add(key)

    const normalizedHost = host.toLowerCase()
    const normalizedSource = sourceMedium.toLowerCase()
    if (
      !productionHosts.has(normalizedHost)
      || scannerSources.has(normalizedSource)
      || developmentPatterns.some(pattern => normalizedSource.includes(pattern))
    ) {
      leakedRows += 1
    }
    sessions += parseMetric(row?.metricValues?.[0]?.value)
    if (!Number.isSafeInteger(sessions)) throw new Error('ga_clean_window_invalid_metric')
  }

  return { sessions, leakedRows, rowCount }
}

export function summarizeCleanWindowGate(progress, evidence) {
  if (!progress.configured) {
    return {
      id: 'AR-106',
      name: 'seven-day clean production window',
      status: 'PENDING',
      summary: 'clean-filter production cutover is not recorded; observation has not started',
      alert: 'AR-106 observation has not started because ANALYTICS_CLEAN_FILTER_LIVE_AT is unset; deploy and validate the complete filter before recording the real cutover',
    }
  }
  if (progress.completeDays === 0) {
    return {
      id: 'AR-106',
      name: 'seven-day clean production window',
      status: 'PENDING',
      summary: `0/7 complete Pacific days available; observation starts ${progress.startDate}`,
      alert: null,
    }
  }
  if (!evidence) {
    return {
      id: 'AR-106',
      name: 'seven-day clean production window',
      status: 'UNAVAILABLE',
      summary: `${progress.completeDays}/7 complete days elapsed; GA evidence could not be verified`,
      alert: 'AR-106 clean-window evidence is unavailable; restore Analytics read credentials or Data API access before accepting the observation window',
    }
  }
  if (evidence.leakedRows > 0) {
    return {
      id: 'AR-106',
      name: 'seven-day clean production window',
      status: 'DEGRADED',
      summary: `${progress.completeDays}/7 days audited; ${evidence.leakedRows} excluded-source or nonproduction-host rows leaked into the clean query`,
      alert: `AR-106 clean reporting is degraded: ${evidence.leakedRows} excluded rows leaked through the production filter`,
    }
  }
  const complete = progress.completeDays === CLEAN_WINDOW_REQUIRED_DAYS
  return {
    id: 'AR-106',
    name: 'seven-day clean production window',
    status: complete ? 'HEALTHY' : 'PENDING',
    summary: `${progress.completeDays}/7 complete days audited; ${evidence.sessions} clean sessions and zero excluded-row leakage`,
    alert: null,
  }
}

export async function checkCleanWindowGate({
  now = new Date(),
  liveAt = process.env.ANALYTICS_CLEAN_FILTER_LIVE_AT,
  accessTokenProvider = googleAnalyticsReadToken,
  fetchImpl = fetch,
} = {}) {
  const progress = cleanWindowProgress(now, liveAt)
  if (progress.completeDays === 0) return summarizeCleanWindowGate(progress, null)

  try {
    const accessToken = await accessTokenProvider({ fetchImpl, now })
    const response = await fetchImpl(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: progress.startDate, endDate: progress.endDate }],
          dimensions: [
            { name: 'date' },
            { name: 'hostName' },
            { name: 'sessionSourceMedium' },
          ],
          metrics: [{ name: 'sessions' }],
          dimensionFilter: cleanProductionFilter(),
          limit: String(REPORT_LIMIT),
        }),
        signal: AbortSignal.timeout(15_000),
      }
    )
    if (!response.ok) return summarizeCleanWindowGate(progress, null)
    const report = await response.json()
    const evidence = evaluateCleanWindowRows(report.rows ?? [], {
      startDate: progress.startDate,
      endDate: progress.endDate,
      rowCount: Number(report.rowCount ?? 0),
    })
    return summarizeCleanWindowGate(progress, evidence)
  } catch {
    return summarizeCleanWindowGate(progress, null)
  }
}
