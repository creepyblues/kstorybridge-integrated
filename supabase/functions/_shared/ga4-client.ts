// Shared GA4 Data API client for scheduled analytics reports.
//
// Extracted so multiple edge functions (funnel-report-cron,
// weekly-activity-digest, ...) can run reports without duplicating the
// service-account JWT exchange. Deno-native (Web Crypto, no npm).

export const GA4_PROPERTY_ID = '496541587'

export interface GA4Row {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

export interface GA4Response {
  rows?: GA4Row[]
  rowCount?: number
}

export interface GA4ServiceAccount {
  client_email: string
  private_key: string
}

export interface GA4ReportRequest {
  dateRanges: { startDate: string; endDate: string; name?: string }[]
  dimensions: string[]
  metrics: string[]
  dimensionFilter?: object
  orderBys?: object[]
  limit?: number
}

function base64Url(input: string): string {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function generateGoogleJWT(serviceAccount: GA4ServiceAccount): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encoder = new TextEncoder()
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`

  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${unsignedToken}.${signatureB64}`
}

export async function getGA4AccessToken(serviceAccount: GA4ServiceAccount): Promise<string> {
  const jwt = await generateGoogleJWT(serviceAccount)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`)
  }
  const data = await response.json()
  return data.access_token
}

export async function runGA4Report(
  accessToken: string,
  request: GA4ReportRequest,
  propertyId: string = GA4_PROPERTY_ID
): Promise<GA4Response> {
  const body: Record<string, unknown> = {
    dateRanges: request.dateRanges,
    dimensions: request.dimensions.map(name => ({ name })),
    metrics: request.metrics.map(name => ({ name })),
  }
  if (request.dimensionFilter) body.dimensionFilter = request.dimensionFilter
  if (request.orderBys) body.orderBys = request.orderBys
  if (request.limit) body.limit = request.limit

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!response.ok) {
    throw new Error(`GA4 API error: ${await response.text()}`)
  }
  return await response.json()
}

// Parse the GOOGLE_SERVICE_ACCOUNT_JSON secret into a validated account.
export function parseServiceAccount(raw: string | undefined): GA4ServiceAccount {
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret not configured')
  const parsed = JSON.parse(raw)
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON missing client_email/private_key')
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key }
}
