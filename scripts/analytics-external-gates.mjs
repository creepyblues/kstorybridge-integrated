import https from 'node:https'
import tls from 'node:tls'

const WWW_HOST = 'www.kstorybridge.com'
const CANONICAL_HOST = 'kstorybridge.com'
const CHECK_PATH = '/__analytics-progress-check?utm_source=analytics_progress'
const DEFAULT_PROBE_COUNT = 5
const DEFAULT_TIMEOUT_MS = 5_000

const failedProbe = () => ({ ok: false })

export function probeTlsCertificate({
  host = WWW_HOST,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  now = Date.now(),
} = {}) {
  return new Promise(resolve => {
    let settled = false
    const finish = result => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const socket = tls.connect({
      host,
      port: 443,
      servername: host,
      rejectUnauthorized: false,
    })

    socket.setTimeout(timeoutMs)
    socket.once('secureConnect', () => {
      const certificate = socket.getPeerCertificate()
      const validTo = Date.parse(certificate.valid_to || '')
      const ok = socket.authorized && Number.isFinite(validTo) && validTo > now
      socket.end()
      finish({ ok, validTo: Number.isFinite(validTo) ? validTo : null })
    })
    socket.once('timeout', () => {
      socket.destroy()
      finish(failedProbe())
    })
    socket.once('error', () => finish(failedProbe()))
  })
}

export function probeCanonicalRedirect({
  host = WWW_HOST,
  canonicalHost = CANONICAL_HOST,
  path = CHECK_PATH,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  return new Promise(resolve => {
    let settled = false
    const finish = result => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const request = https.request({
      host,
      port: 443,
      path,
      method: 'HEAD',
      rejectUnauthorized: true,
      timeout: timeoutMs,
    }, response => {
      response.resume()
      const location = response.headers.location
      let correctLocation = false

      try {
        const destination = new URL(location)
        correctLocation = destination.protocol === 'https:' &&
          destination.hostname === canonicalHost &&
          `${destination.pathname}${destination.search}` === path
      } catch {
        correctLocation = false
      }

      finish({
        ok: response.statusCode === 308 && correctLocation,
        statusCode: response.statusCode ?? null,
      })
    })

    request.once('timeout', () => {
      request.destroy()
      finish(failedProbe())
    })
    request.once('error', () => finish(failedProbe()))
    request.end()
  })
}

export function summarizeWwwCanonicalGate(tlsResults, redirectResults) {
  const total = Math.max(tlsResults.length, redirectResults.length)
  const validTls = tlsResults.filter(result => result.ok).length
  const validRedirects = redirectResults.filter(result => result.ok).length
  const healthy = total > 0 && validTls === total && validRedirects === total
  const unavailable = validTls === 0 && validRedirects === 0

  return {
    id: 'AR-115',
    name: 'www TLS and canonical redirect',
    status: healthy ? 'HEALTHY' : unavailable ? 'UNAVAILABLE' : 'DEGRADED',
    summary: `${validTls}/${total} valid TLS; ${validRedirects}/${total} canonical redirects`,
    alert: healthy
      ? null
      : `AR-115 www entry point is ${unavailable ? 'unavailable' : 'degraded'}: ${validTls}/${total} TLS and ${validRedirects}/${total} redirect probes passed`,
  }
}

export async function checkWwwCanonicalGate({
  probeCount = DEFAULT_PROBE_COUNT,
  tlsProbe = probeTlsCertificate,
  redirectProbe = probeCanonicalRedirect,
} = {}) {
  const tlsResults = []
  const redirectResults = []

  for (let index = 0; index < probeCount; index += 1) {
    const [tlsResult, redirectResult] = await Promise.all([
      Promise.resolve().then(() => tlsProbe()).catch(failedProbe),
      Promise.resolve().then(() => redirectProbe()).catch(failedProbe),
    ])
    tlsResults.push(tlsResult)
    redirectResults.push(redirectResult)
  }

  return summarizeWwwCanonicalGate(tlsResults, redirectResults)
}

export async function checkAnalyticsExternalGates(options = {}) {
  try {
    return [await checkWwwCanonicalGate(options)]
  } catch {
    return [summarizeWwwCanonicalGate([], [])]
  }
}
