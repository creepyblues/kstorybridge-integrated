import { execFile } from 'node:child_process'
import https from 'node:https'
import tls from 'node:tls'
import { promisify } from 'node:util'

const WWW_HOST = 'www.kstorybridge.com'
const CANONICAL_HOST = 'kstorybridge.com'
const CHECK_PATH = '/__analytics-progress-check?utm_source=analytics_progress'
const DEFAULT_PROBE_COUNT = 5
const DEFAULT_TIMEOUT_MS = 5_000
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_REPOSITORY = 'creepyblues/kstorybridge-integrated'
const RELEASE_PR_NUMBER = 141
const BILLING_LOCK_MESSAGE = 'The job was not started because your account is locked due to a billing issue.'
const execFileAsync = promisify(execFile)

let localGithubTokenPromise

async function resolveGithubToken(explicitToken) {
  if (explicitToken !== undefined) return explicitToken
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN

  localGithubTokenPromise ??= (async () => {
    for (const binary of ['/opt/homebrew/bin/gh', '/usr/local/bin/gh', 'gh']) {
      try {
        const { stdout } = await execFileAsync(binary, ['auth', 'token'], {
          encoding: 'utf8',
          timeout: DEFAULT_TIMEOUT_MS,
          maxBuffer: 16_384,
        })
        const token = stdout.trim()
        if (token) return token
      } catch {
        // Try the next known CLI location; an unavailable token is handled below.
      }
    }
    return ''
  })()

  return localGithubTokenPromise
}

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

async function githubRequest(path, {
  fetchImpl = fetch,
  githubToken,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  try {
    const resolvedGithubToken = await resolveGithubToken(githubToken)
    const response = await fetchImpl(`${GITHUB_API_URL}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'kstorybridge-analytics-progress',
        ...(resolvedGithubToken ? { Authorization: `Bearer ${resolvedGithubToken}` } : {}),
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(timeoutMs),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      data = null
    }
    return { status: response.status, data }
  } catch {
    return { status: 0, data: null }
  }
}

export function summarizeDefaultBranchWorkflow(status) {
  if (status === 200) {
    return {
      id: 'AR-014',
      name: 'default-branch progress workflow',
      status: 'HEALTHY',
      summary: 'analytics-progress.yml is present on main',
      alert: null,
    }
  }
  if (status === 404) {
    return {
      id: 'AR-014',
      name: 'default-branch progress workflow',
      status: 'PENDING',
      summary: 'workflow is not present on main; local cron remains authoritative',
      alert: 'AR-014 repository progress schedule is not active on main; local cron fallback remains required',
    }
  }
  return {
    id: 'AR-014',
    name: 'default-branch progress workflow',
    status: 'UNAVAILABLE',
    summary: 'GitHub workflow state could not be verified',
    alert: 'AR-014 GitHub default-branch workflow check was unavailable; verify repository access and API health',
  }
}

export async function checkDefaultBranchWorkflow(options = {}) {
  const result = await githubRequest(
    `/repos/${GITHUB_REPOSITORY}/contents/.github/workflows/analytics-progress.yml?ref=main`,
    options
  )
  return summarizeDefaultBranchWorkflow(result.status)
}

const FAILURE_CONCLUSIONS = new Set([
  'action_required',
  'cancelled',
  'failure',
  'startup_failure',
  'stale',
  'timed_out',
])

export function summarizeReleasePrGate({ pr, checkRuns, annotationsById = new Map() }) {
  if (!pr || !Array.isArray(checkRuns)) {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: 'UNAVAILABLE',
      summary: 'PR or GitHub Actions state could not be verified',
      alert: 'AR-016 release CI state was unavailable; verify GitHub API access',
    }
  }

  const githubActions = checkRuns.filter(check => check?.app?.slug === 'github-actions')
  const failures = githubActions.filter(check => FAILURE_CONCLUSIONS.has(check.conclusion))
  const pending = githubActions.filter(check => check.status !== 'completed' || check.conclusion === null)
  const successes = githubActions.filter(check => check.conclusion === 'success')
  const billingLocked = failures.filter(check => {
    const annotations = annotationsById.get(check.id) || []
    return annotations.some(annotation => annotation.message === BILLING_LOCK_MESSAGE)
  })
  const prState = `${pr.draft ? 'draft/' : ''}${String(pr.state || 'unknown').toLowerCase()}`

  if (pr.merged_at) {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: failures.length === 0 && pending.length === 0 ? 'HEALTHY' : 'MERGED_UNVERIFIED',
      summary: `PR merged; ${successes.length} passed, ${failures.length} failed, ${pending.length} pending GitHub Actions checks`,
      alert: failures.length === 0 && pending.length === 0
        ? null
        : 'AR-016 PR #141 merged without a fully green verified GitHub Actions state',
    }
  }

  if (pr.state !== 'open') {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: 'CLOSED',
      summary: `PR is ${prState} and was not merged`,
      alert: 'AR-016 analytics release PR #141 is closed without merge; choose a new production release path',
    }
  }

  if (failures.length > 0 && billingLocked.length === failures.length) {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: 'BILLING_LOCKED',
      summary: `${prState}; ${failures.length} failed checks ran zero steps because the account is billing locked`,
      alert: `AR-016 GitHub Actions billing lock still blocks all ${failures.length} failed checks on PR #141; restore billing before rerunning`,
    }
  }

  if (failures.length > 0) {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: 'FAILED',
      summary: `${prState}; ${failures.length} failed and ${pending.length} pending GitHub Actions checks`,
      alert: `AR-016 PR #141 has ${failures.length} actionable or unclassified GitHub Actions failures; inspect logs before proposing a fix`,
    }
  }

  if (pending.length > 0 || successes.length === 0) {
    return {
      id: 'AR-016',
      name: 'analytics release PR #141 CI',
      status: 'PENDING',
      summary: `${prState}; ${successes.length} passed and ${pending.length} pending GitHub Actions checks`,
      alert: `AR-016 PR #141 CI is pending: ${successes.length} passed and ${pending.length} still running or queued`,
    }
  }

  return {
    id: 'AR-016',
    name: 'analytics release PR #141 CI',
    status: 'HEALTHY',
    summary: `${prState}; ${successes.length} GitHub Actions checks passed with no failures or pending checks`,
    alert: null,
  }
}

export async function checkReleasePrGate(options = {}) {
  const prResult = await githubRequest(
    `/repos/${GITHUB_REPOSITORY}/pulls/${RELEASE_PR_NUMBER}`,
    options
  )
  if (prResult.status !== 200 || !prResult.data?.head?.sha) {
    return summarizeReleasePrGate({ pr: null, checkRuns: null })
  }

  const checksResult = await githubRequest(
    `/repos/${GITHUB_REPOSITORY}/commits/${prResult.data.head.sha}/check-runs?per_page=100`,
    options
  )
  if (checksResult.status !== 200 || !Array.isArray(checksResult.data?.check_runs)) {
    return summarizeReleasePrGate({ pr: null, checkRuns: null })
  }

  const failures = checksResult.data.check_runs.filter(check =>
    check?.app?.slug === 'github-actions' && FAILURE_CONCLUSIONS.has(check.conclusion)
  )
  const annotationEntries = await Promise.all(failures.map(async check => {
    const annotations = await githubRequest(
      `/repos/${GITHUB_REPOSITORY}/check-runs/${check.id}/annotations?per_page=100`,
      options
    )
    return [check.id, annotations.status === 200 && Array.isArray(annotations.data) ? annotations.data : []]
  }))

  return summarizeReleasePrGate({
    pr: prResult.data,
    checkRuns: checksResult.data.check_runs,
    annotationsById: new Map(annotationEntries),
  })
}

export async function checkAnalyticsExternalGates(options = {}) {
  const checks = await Promise.allSettled([
    checkWwwCanonicalGate(options.www ?? options),
    checkDefaultBranchWorkflow(options.github ?? options),
    checkReleasePrGate(options.github ?? options),
  ])
  const fallbacks = [
    summarizeWwwCanonicalGate([], []),
    summarizeDefaultBranchWorkflow(0),
    summarizeReleasePrGate({ pr: null, checkRuns: null }),
  ]

  return checks.map((result, index) =>
    result.status === 'fulfilled' ? result.value : fallbacks[index]
  )
}
