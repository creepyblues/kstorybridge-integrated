import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import https from 'node:https'
import tls from 'node:tls'
import { promisify } from 'node:util'

import {
  checkCleanWindowGate,
  cleanWindowProgress,
  summarizeCleanWindowGate,
} from './analytics-clean-window-gate.mjs'
import { summarizeBrevoCampaignGate } from './brevo-campaign-evidence.mjs'

const WWW_HOST = 'www.kstorybridge.com'
const CANONICAL_HOST = 'kstorybridge.com'
const CHECK_PATH = '/__analytics-progress-check?utm_source=analytics_progress'
const DEFAULT_PROBE_COUNT = 5
const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_GITHUB_TIMEOUT_MS = 15_000
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_REPOSITORY = 'creepyblues/kstorybridge-integrated'
const RELEASE_PR_NUMBER = 142
const RELEASE_GATE_NAME = `analytics release PR #${RELEASE_PR_NUMBER}`
const RELEASE_PR_LABEL = `PR #${RELEASE_PR_NUMBER}`
const GA_INTERNAL_FILTER_EVIDENCE_URL = new URL(
  '../docs/active/GA4_INTERNAL_TRAFFIC_FILTER_VERIFICATION.md',
  import.meta.url
)
const BREVO_CAMPAIGN_EVIDENCE_URL = new URL(
  '../docs/active/BREVO_CAMPAIGN_AGGREGATE_EVIDENCE.json',
  import.meta.url
)
const RELEASE_RECOVERY_EVIDENCE_URL = new URL(
  '../docs/active/ANALYTICS_MIXED_RELEASE_RECOVERY_2026-07-16.md',
  import.meta.url
)
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
  timeoutMs = DEFAULT_GITHUB_TIMEOUT_MS,
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

async function githubPaginatedArray(path, options = {}) {
  const rows = []
  for (let page = 1; page <= 10; page += 1) {
    const separator = path.includes('?') ? '&' : '?'
    const result = await githubRequest(
      `${path}${separator}per_page=100&page=${page}`,
      options
    )
    if (result.status !== 200 || !Array.isArray(result.data)) return null
    rows.push(...result.data)
    if (result.data.length < 100) return rows
  }
  return null
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

export function summarizeGaInternalFilterGate(evidence) {
  if (typeof evidence !== 'string') {
    return {
      id: 'AR-108',
      name: 'GA internal-traffic filter',
      status: 'UNAVAILABLE',
      summary: 'the GA Admin evidence record is missing or unreadable',
      alert: 'AR-108 GA internal-filter evidence is unavailable; restore the tracked verification record before Wave 1',
    }
  }

  const marker = evidence.match(
    /<!--\s*analytics-ga-internal-filter:status=(UNVERIFIED|TESTING|INACTIVE|ACTIVE)\s*-->/
  )
  if (!marker) {
    return {
      id: 'AR-108',
      name: 'GA internal-traffic filter',
      status: 'UNAVAILABLE',
      summary: 'the GA Admin evidence marker is missing or malformed',
      alert: 'AR-108 GA internal-filter evidence marker is invalid; do not release Wave 1 until the record is repaired and verified',
    }
  }

  if (marker[1] === 'TESTING') {
    return {
      id: 'AR-108',
      name: 'GA internal-traffic filter',
      status: 'HEALTHY',
      summary: 'tracked GA Admin evidence records the filter in Testing mode',
      alert: null,
    }
  }
  if (marker[1] === 'ACTIVE') {
    return {
      id: 'AR-108',
      name: 'GA internal-traffic filter',
      status: 'UNSAFE',
      summary: 'tracked GA Admin evidence records irreversible Active exclusion',
      alert: 'AR-108 internal-traffic filter is recorded Active; pause analytics releases and verify whether incoming data is being permanently excluded',
    }
  }

  return {
    id: 'AR-108',
    name: 'GA internal-traffic filter',
    status: 'PENDING',
    summary: marker[1] === 'INACTIVE'
      ? 'tracked GA Admin evidence records the filter as Inactive; Testing is required'
      : 'signed-in GA Admin verification is still required',
    alert: marker[1] === 'INACTIVE'
      ? 'AR-108 GA internal-traffic filter is Inactive; place it in Testing mode and capture evidence before Wave 1'
      : 'AR-108 GA internal-traffic filter has not been visually verified in Testing mode; Wave 1 remains gated',
  }
}

export async function checkGaInternalFilterGate({
  readFileImpl = readFile,
  evidenceUrl = GA_INTERNAL_FILTER_EVIDENCE_URL,
} = {}) {
  try {
    return summarizeGaInternalFilterGate(await readFileImpl(evidenceUrl, 'utf8'))
  } catch {
    return summarizeGaInternalFilterGate(null)
  }
}

export async function checkBrevoCampaignGate({
  readFileImpl = readFile,
  evidenceUrl = BREVO_CAMPAIGN_EVIDENCE_URL,
} = {}) {
  try {
    return summarizeBrevoCampaignGate(await readFileImpl(evidenceUrl, 'utf8'))
  } catch {
    return summarizeBrevoCampaignGate(null)
  }
}

const FAILURE_CONCLUSIONS = new Set([
  'action_required',
  'cancelled',
  'failure',
  'startup_failure',
  'stale',
  'timed_out',
])

const WAVE_ONE_ALLOWED_RELEASE_PATHS = new Set([
  '.github/workflows/analytics-progress.yml',
  'apps/creator/src/components/tools/CollectButton.tsx',
  'apps/creator/src/components/tools/IntelligenceResultsModal.tsx',
  'apps/creator/src/hooks/useAuth.tsx',
  'apps/creator/src/utils/analytics.ts',
  'apps/creator/src/utils/analyticsEnvironment.test.ts',
  'apps/dashboard/src/hooks/useAuth.test.tsx',
  'apps/dashboard/src/hooks/useAuth.tsx',
  'apps/dashboard/src/utils/analytics.ts',
  'apps/dashboard/src/utils/analyticsEnvironment.test.ts',
  'apps/website/index.html',
  'apps/website/src/components/AnalyticsProvider.tsx',
  'apps/website/src/utils/analytics.ts',
  'apps/website/src/utils/analyticsEnvironment.test.ts',
  'docs/active/ANALYTICS_RELIABILITY_EXECUTION_PLAN.md',
  'package.json',
  'scripts/analytics-progress-report.mjs',
  'scripts/internal-traffic-admins.mjs',
  'scripts/internal-traffic-admins.test.mjs',
  'scripts/run-analytics-progress-cron.zsh',
  'supabase/functions/_shared/analytics-filters.test.mjs',
  'supabase/functions/_shared/analytics-filters.ts',
  'supabase/functions/funnel-report-cron/index.ts',
])

export function summarizeReleasePrGate({
  pr,
  checkRuns,
  files = [],
  annotationsById = new Map(),
}) {
  if (!pr || !Array.isArray(checkRuns) || !Array.isArray(files)) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
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
  const changedFileCount = Number(pr.changed_files)
  if (Number.isInteger(changedFileCount) && changedFileCount !== files.length) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'UNAVAILABLE',
      summary: `PR scope could not be fully verified (${files.length}/${changedFileCount} files loaded)`,
      alert: 'AR-016 release scope inventory is incomplete; do not merge until every changed path is verified',
    }
  }
  const unexpectedPaths = files
    .map(file => file?.filename)
    .filter(path => typeof path !== 'string' || !WAVE_ONE_ALLOWED_RELEASE_PATHS.has(path))
  if (unexpectedPaths.length > 0) {
    const merged = Boolean(pr.merged_at)
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: merged ? 'MERGED_SCOPE_DRIFT' : 'SCOPE_DRIFT',
      summary: `${merged ? 'merged' : prState}; ${unexpectedPaths.length} changed path${unexpectedPaths.length === 1 ? '' : 's'} fall outside the migration-free Wave 1 allowlist`,
      alert: merged
        ? `AR-016 ${RELEASE_PR_LABEL} merged with ${unexpectedPaths.length} path${unexpectedPaths.length === 1 ? '' : 's'} outside the Wave 1 boundary; pause further production mutations and execute the mixed-release recovery audit`
        : `AR-016 ${RELEASE_PR_LABEL} scope drift detected in ${unexpectedPaths.length} path${unexpectedPaths.length === 1 ? '' : 's'}; restore the documented Wave 1 boundary before CI rerun or merge`,
    }
  }

  if (pr.merged_at) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: failures.length === 0 && pending.length === 0 ? 'HEALTHY' : 'MERGED_UNVERIFIED',
      summary: `PR merged; ${successes.length} passed, ${failures.length} failed, ${pending.length} pending GitHub Actions checks`,
      alert: failures.length === 0 && pending.length === 0
        ? null
        : `AR-016 ${RELEASE_PR_LABEL} merged without a fully green verified GitHub Actions state`,
    }
  }

  if (pr.state !== 'open') {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'CLOSED',
      summary: `PR is ${prState} and was not merged`,
      alert: `AR-016 analytics release ${RELEASE_PR_LABEL} is closed without merge; choose a new production release path`,
    }
  }

  if (
    failures.length > 0
    && failures.some(check => !Array.isArray(annotationsById.get(check.id)))
  ) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'UNAVAILABLE',
      summary: `${prState}; failed-check annotations could not be fully verified`,
      alert: `AR-016 failed-check annotations are incomplete; do not classify or rerun ${RELEASE_PR_LABEL} CI until GitHub evidence is available`,
    }
  }

  if (failures.length > 0 && billingLocked.length === failures.length) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'BILLING_LOCKED',
      summary: `${prState}; ${failures.length} failed checks ran zero steps because the account is billing locked`,
      alert: `AR-016 GitHub Actions billing lock still blocks all ${failures.length} failed checks on ${RELEASE_PR_LABEL}; restore billing before rerunning`,
    }
  }

  if (failures.length > 0) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'FAILED',
      summary: `${prState}; ${failures.length} failed and ${pending.length} pending GitHub Actions checks`,
      alert: `AR-016 ${RELEASE_PR_LABEL} has ${failures.length} actionable or unclassified GitHub Actions failures; inspect logs before proposing a fix`,
    }
  }

  if (pending.length > 0 || successes.length === 0) {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'PENDING',
      summary: `${prState}; ${successes.length} passed and ${pending.length} pending GitHub Actions checks`,
      alert: `AR-016 ${RELEASE_PR_LABEL} CI is pending: ${successes.length} passed and ${pending.length} still running or queued`,
    }
  }

  return {
    id: 'AR-016',
    name: RELEASE_GATE_NAME,
    status: 'HEALTHY',
    summary: `${prState}; ${successes.length} GitHub Actions checks passed with no failures or pending checks`,
    alert: null,
  }
}

export function summarizeReleaseRecoveryEvidence(evidence) {
  const marker = typeof evidence === 'string'
    ? evidence.match(/<!--\s*analytics-release-recovery:status=(RECOVERY_REQUIRED|RECOVERED)\s*-->/)
    : null
  if (marker?.[1] === 'RECOVERY_REQUIRED') {
    return {
      id: 'AR-016',
      name: RELEASE_GATE_NAME,
      status: 'MERGED_SCOPE_DRIFT',
      summary: 'tracked evidence records PR #142 merged outside Wave 1; live GitHub verification is unavailable',
      alert: 'AR-016 tracked PR #142 merged-scope recovery remains required; GitHub live verification is unavailable',
    }
  }
  return summarizeReleasePrGate({ pr: null, checkRuns: null })
}

async function releaseGateUnavailable({
  readFileImpl = readFile,
  recoveryEvidenceUrl = RELEASE_RECOVERY_EVIDENCE_URL,
} = {}) {
  try {
    return summarizeReleaseRecoveryEvidence(
      await readFileImpl(recoveryEvidenceUrl, 'utf8')
    )
  } catch {
    return summarizeReleaseRecoveryEvidence(null)
  }
}

export async function checkReleasePrGate(options = {}) {
  const prResult = await githubRequest(
    `/repos/${GITHUB_REPOSITORY}/pulls/${RELEASE_PR_NUMBER}`,
    options
  )
  if (prResult.status !== 200 || !prResult.data?.head?.sha) {
    return releaseGateUnavailable(options)
  }

  const [checksResult, files] = await Promise.all([
    githubRequest(
      `/repos/${GITHUB_REPOSITORY}/commits/${prResult.data.head.sha}/check-runs?per_page=100`,
      options
    ),
    githubPaginatedArray(
      `/repos/${GITHUB_REPOSITORY}/pulls/${RELEASE_PR_NUMBER}/files`,
      options
    ),
  ])
  if (
    checksResult.status !== 200
    || !Array.isArray(checksResult.data?.check_runs)
    || !Array.isArray(files)
  ) {
    return releaseGateUnavailable(options)
  }

  const failures = checksResult.data.check_runs.filter(check =>
    check?.app?.slug === 'github-actions' && FAILURE_CONCLUSIONS.has(check.conclusion)
  )
  const annotationEntries = await Promise.all(failures.map(async check => {
    const annotations = await githubRequest(
      `/repos/${GITHUB_REPOSITORY}/check-runs/${check.id}/annotations?per_page=100`,
      options
    )
    return [
      check.id,
      annotations.status === 200 && Array.isArray(annotations.data)
        ? annotations.data
        : null,
    ]
  }))

  return summarizeReleasePrGate({
    pr: prResult.data,
    checkRuns: checksResult.data.check_runs,
    files,
    annotationsById: new Map(annotationEntries),
  })
}

export function summarizeAnalyticsDeliveryGate(rows, { deployed = true } = {}) {
  if (!deployed) {
    return {
      id: 'AR-405',
      name: 'scheduled analytics delivery streak',
      status: 'PENDING',
      summary: 'delivery audit schema is not production-live; 0/2 scheduled runs proven',
      alert: 'AR-405 durable scheduled-delivery evidence is not deployed; legacy delivery responses do not count toward the two-run gate',
    }
  }
  if (!Array.isArray(rows)) {
    return {
      id: 'AR-405',
      name: 'scheduled analytics delivery streak',
      status: 'UNAVAILABLE',
      summary: 'privacy-safe delivery status could not be verified',
      alert: 'AR-405 analytics delivery status is unavailable; verify the safe RPC and Supabase API health',
    }
  }

  const scheduled = rows
    .filter(row => row?.trigger_kind === 'scheduled')
    .slice(0, 2)
  const successful = scheduled.filter(row =>
    row.status === 'succeeded'
    && Number(row.expected_email_count) > 0
    && Number(row.emails_sent) === Number(row.expected_email_count)
    && Number(row.emails_failed) === 0
    && row.slack_requested === true
    && row.slack_sent === true
  ).length

  if (scheduled.length < 2) {
    return {
      id: 'AR-405',
      name: 'scheduled analytics delivery streak',
      status: 'PENDING',
      summary: `${successful}/2 consecutive scheduled runs proven; ${scheduled.length} durable run${scheduled.length === 1 ? '' : 's'} available`,
      alert: null,
    }
  }
  if (successful === 2) {
    return {
      id: 'AR-405',
      name: 'scheduled analytics delivery streak',
      status: 'HEALTHY',
      summary: '2/2 latest scheduled runs delivered every expected email and Slack',
      alert: null,
    }
  }
  return {
    id: 'AR-405',
    name: 'scheduled analytics delivery streak',
    status: 'DEGRADED',
    summary: `${successful}/2 latest scheduled runs fully succeeded`,
    alert: `AR-405 scheduled delivery streak is degraded: only ${successful}/2 latest runs delivered every expected email and Slack`,
  }
}

export async function checkAnalyticsDeliveryGate({
  fetchImpl = fetch,
  supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!supabaseUrl || !anonKey) return summarizeAnalyticsDeliveryGate(null)

  try {
    const response = await fetchImpl(
      `${supabaseUrl}/rest/v1/rpc/get_analytics_report_delivery_status`,
      {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_per_trigger_limit: 2 }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    )
    if (response.status === 404) {
      return summarizeAnalyticsDeliveryGate([], { deployed: false })
    }
    if (!response.ok) return summarizeAnalyticsDeliveryGate(null)
    const rows = await response.json()
    return summarizeAnalyticsDeliveryGate(rows)
  } catch {
    return summarizeAnalyticsDeliveryGate(null)
  }
}

export async function checkAnalyticsExternalGates(options = {}) {
  const checks = await Promise.allSettled([
    checkWwwCanonicalGate(options.www ?? options),
    checkDefaultBranchWorkflow(options.github ?? options),
    checkReleasePrGate(options.github ?? options),
    checkCleanWindowGate(options.cleanWindow ?? options),
    checkGaInternalFilterGate(options.gaInternalFilter ?? options),
    checkBrevoCampaignGate(options.brevo ?? options),
    checkAnalyticsDeliveryGate(options.delivery ?? options),
  ])
  const fallbacks = [
    summarizeWwwCanonicalGate([], []),
    summarizeDefaultBranchWorkflow(0),
    summarizeReleasePrGate({ pr: null, checkRuns: null }),
    summarizeCleanWindowGate(cleanWindowProgress(), null),
    summarizeGaInternalFilterGate(null),
    summarizeBrevoCampaignGate(null),
    summarizeAnalyticsDeliveryGate(null),
  ]

  return checks.map((result, index) =>
    result.status === 'fulfilled' ? result.value : fallbacks[index]
  )
}
