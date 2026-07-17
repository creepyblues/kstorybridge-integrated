import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkAnalyticsDeliveryGate,
  checkBrevoCampaignGate,
  checkGaInternalFilterGate,
  checkReleasePrGate,
  checkWwwCanonicalGate,
  summarizeAnalyticsDeliveryGate,
  summarizeDefaultBranchWorkflow,
  summarizeGaInternalFilterGate,
  summarizeReleasePrGate,
  summarizeReleaseRecoveryEvidence,
  summarizeWwwCanonicalGate,
} from './analytics-external-gates.mjs'
import { REQUIRED_BREVO_SEND_DATES } from './brevo-campaign-evidence.mjs'

const ok = { ok: true }
const failed = { ok: false }

test('marks the www gate healthy only when every TLS and redirect probe passes', () => {
  assert.deepEqual(
    summarizeWwwCanonicalGate([ok, ok, ok], [ok, ok, ok]),
    {
      id: 'AR-115',
      name: 'www TLS and canonical redirect',
      status: 'HEALTHY',
      summary: '3/3 valid TLS; 3/3 canonical redirects',
      alert: null,
    }
  )
})

test('marks intermittent expired-certificate results degraded', () => {
  const result = summarizeWwwCanonicalGate(
    [ok, failed, ok, failed],
    [ok, failed, ok, failed]
  )

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '2/4 valid TLS; 2/4 canonical redirects')
  assert.match(result.alert, /entry point is degraded/)
})

test('marks a valid certificate with a wrong redirect degraded', () => {
  const result = summarizeWwwCanonicalGate([ok, ok], [failed, failed])

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '2/2 valid TLS; 0/2 canonical redirects')
})

test('marks a completely unreachable entry point unavailable', () => {
  const result = summarizeWwwCanonicalGate([failed, failed], [failed, failed])

  assert.equal(result.status, 'UNAVAILABLE')
  assert.match(result.alert, /entry point is unavailable/)
})

test('converts rejected probes into a non-throwing degraded result', async () => {
  const result = await checkWwwCanonicalGate({
    probeCount: 2,
    tlsProbe: async () => {
      throw new Error('network detail must not enter the report')
    },
    redirectProbe: async () => ok,
  })

  assert.equal(result.status, 'DEGRADED')
  assert.equal(result.summary, '0/2 valid TLS; 2/2 canonical redirects')
  assert.doesNotMatch(result.alert, /network detail/)
})

test('classifies default-branch workflow presence, absence, and unavailable state', () => {
  assert.equal(summarizeDefaultBranchWorkflow(200).status, 'HEALTHY')
  assert.equal(summarizeDefaultBranchWorkflow(404).status, 'PENDING')
  assert.equal(summarizeDefaultBranchWorkflow(503).status, 'UNAVAILABLE')
})

test('requires an exact GA internal-filter evidence marker', () => {
  assert.equal(summarizeGaInternalFilterGate(null).status, 'UNAVAILABLE')
  assert.equal(summarizeGaInternalFilterGate('status: TESTING').status, 'UNAVAILABLE')
  assert.equal(
    summarizeGaInternalFilterGate('<!-- analytics-ga-internal-filter:status=UNVERIFIED -->').status,
    'PENDING'
  )
})

test('accepts Testing but flags Inactive and Active evidence', () => {
  const testing = summarizeGaInternalFilterGate(
    '<!-- analytics-ga-internal-filter:status=TESTING -->'
  )
  assert.equal(testing.status, 'HEALTHY')
  assert.equal(testing.alert, null)

  const inactive = summarizeGaInternalFilterGate(
    '<!-- analytics-ga-internal-filter:status=INACTIVE -->'
  )
  assert.equal(inactive.status, 'PENDING')
  assert.match(inactive.summary, /Inactive/)

  const active = summarizeGaInternalFilterGate(
    '<!-- analytics-ga-internal-filter:status=ACTIVE -->'
  )
  assert.equal(active.status, 'UNSAFE')
  assert.match(active.alert, /permanently excluded/)
})

test('turns a missing GA evidence file into an unavailable gate', async () => {
  const gate = await checkGaInternalFilterGate({
    readFileImpl: async () => {
      throw new Error('missing')
    },
  })
  assert.equal(gate.status, 'UNAVAILABLE')
})

test('loads the Brevo aggregate record and fails closed when it is missing', async () => {
  const complete = JSON.stringify({
    schemaVersion: 1,
    source: 'brevo-ui',
    collectedAt: '2026-07-14T18:00:00Z',
    campaigns: REQUIRED_BREVO_SEND_DATES.map(sendDate => ({
      sendDate,
      delivered: 100,
      uniqueClicks: 10,
      knownHumanClicks: 5,
      humanClickMethod: 'brevo-reported',
    })),
  })
  assert.equal((await checkBrevoCampaignGate({
    readFileImpl: async () => complete,
  })).status, 'HEALTHY')
  assert.equal((await checkBrevoCampaignGate({
    readFileImpl: async () => { throw new Error('missing') },
  })).status, 'UNAVAILABLE')
})

const actionCheck = (id, conclusion, status = 'completed') => ({
  id,
  status,
  conclusion,
  app: { slug: 'github-actions' },
})

const openPr = { state: 'open', draft: true, merged_at: null }

test('distinguishes an account billing lock from a code failure', () => {
  const lockedChecks = [actionCheck(1, 'failure'), actionCheck(2, 'failure')]
  const annotations = new Map([
    [1, [{ message: 'The job was not started because your account is locked due to a billing issue.' }]],
    [2, [{ message: 'The job was not started because your account is locked due to a billing issue.' }]],
  ])
  const locked = summarizeReleasePrGate({
    pr: openPr,
    checkRuns: lockedChecks,
    annotationsById: annotations,
  })
  assert.equal(locked.status, 'BILLING_LOCKED')
  assert.match(locked.summary, /ran zero steps/)

  const failed = summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(3, 'failure')],
    annotationsById: new Map([[3, [{ message: 'TypeScript compilation failed' }]]]),
  })
  assert.equal(failed.status, 'FAILED')
  assert.doesNotMatch(failed.alert, /TypeScript compilation failed/)
})

test('does not turn missing failure annotations into a generic code diagnosis', () => {
  const unavailable = summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(3, 'failure')],
    annotationsById: new Map([[3, null]]),
  })
  assert.equal(unavailable.status, 'UNAVAILABLE')
  assert.match(unavailable.summary, /annotations could not be fully verified/)
  assert.doesNotMatch(unavailable.alert, /billing|code failure/)
})

test('reports healthy, pending, and unavailable release CI without counting external checks', () => {
  const vercelCheck = {
    id: 99,
    status: 'completed',
    conclusion: 'success',
    app: { slug: 'vercel' },
  }
  assert.equal(summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(1, 'success'), vercelCheck],
  }).status, 'HEALTHY')

  assert.equal(summarizeReleasePrGate({
    pr: openPr,
    checkRuns: [actionCheck(2, null, 'in_progress'), vercelCheck],
  }).status, 'PENDING')

  assert.equal(summarizeReleasePrGate({
    pr: null,
    checkRuns: null,
  }).status, 'UNAVAILABLE')
})

test('reports a closed unmerged release PR as a release-path failure', () => {
  const result = summarizeReleasePrGate({
    pr: { state: 'closed', draft: false, merged_at: null },
    checkRuns: [],
  })
  assert.equal(result.status, 'CLOSED')
  assert.match(result.alert, /closed without merge/)
})

test('fails the release gate when recovery scope drifts or cannot be fully inventoried', () => {
  const drift = summarizeReleasePrGate({
    pr: { ...openPr, changed_files: 1 },
    checkRuns: [actionCheck(1, 'success')],
    files: [{ filename: 'supabase/migrations/20260715000000_unapproved.sql' }],
  })
  assert.equal(drift.status, 'SCOPE_DRIFT')
  assert.match(drift.summary, /focused recovery allowlist/)
  assert.doesNotMatch(drift.alert, /20260715000000/)

  const incomplete = summarizeReleasePrGate({
    pr: { ...openPr, changed_files: 2 },
    checkRuns: [actionCheck(1, 'success')],
    files: [{ filename: 'package.json' }],
  })
  assert.equal(incomplete.status, 'UNAVAILABLE')
  assert.match(incomplete.summary, /1\/2 files loaded/)
})

test('reports an already-merged scope violation as a recovery incident', () => {
  const result = summarizeReleasePrGate({
    pr: { ...openPr, merged_at: '2026-07-15T23:31:31Z', changed_files: 1 },
    checkRuns: [actionCheck(1, 'success')],
    files: [{ filename: 'supabase/migrations/20260714011558_analytics_event_outbox.sql' }],
  })
  assert.equal(result.status, 'MERGED_SCOPE_DRIFT')
  assert.match(result.summary, /^merged;/)
  assert.match(result.alert, /repair the recovery scope/)
})

test('preserves tracked merged-scope evidence when live GitHub is unavailable', () => {
  const tracked = summarizeReleaseRecoveryEvidence(
    '<!-- analytics-release-recovery:status=RECOVERY_REQUIRED -->'
  )
  assert.equal(tracked.status, 'MERGED_SCOPE_DRIFT')
  assert.match(tracked.summary, /live verification is unavailable/)

  assert.equal(summarizeReleaseRecoveryEvidence(null).status, 'UNAVAILABLE')
  assert.equal(summarizeReleaseRecoveryEvidence(
    '<!-- analytics-release-recovery:status=RECOVERED -->'
  ).status, 'UNAVAILABLE')
})

test('applies the GitHub deadline to a response body that never settles', async () => {
  const startedAt = Date.now()
  const gate = await checkReleasePrGate({
    fetchImpl: async () => ({
      status: 200,
      json: async () => new Promise(() => {}),
    }),
    githubToken: 'test-token',
    timeoutMs: 10,
    readFileImpl: async () => '<!-- analytics-release-recovery:status=RECOVERY_REQUIRED -->',
  })

  assert.equal(gate.status, 'MERGED_SCOPE_DRIFT')
  assert.ok(Date.now() - startedAt < 500)
})

test('uses the local GitHub CLI transport to classify the recovery PR', async () => {
  const responses = new Map([
    ['repos/creepyblues/kstorybridge-integrated/pulls/144', {
      state: 'open',
      draft: true,
      merged_at: null,
      changed_files: 1,
      head: { sha: 'head-sha' },
    }],
    ['repos/creepyblues/kstorybridge-integrated/commits/head-sha/check-runs?per_page=100', {
      check_runs: [actionCheck(81, 'failure')],
    }],
    ['repos/creepyblues/kstorybridge-integrated/pulls/144/files?per_page=100&page=1', [
      { filename: 'apps/dashboard/vercel.json' },
    ]],
    ['repos/creepyblues/kstorybridge-integrated/check-runs/81/annotations?per_page=100', [
      { message: 'The job was not started because your account is locked due to a billing issue.' },
    ]],
  ])
  const requested = []
  const gate = await checkReleasePrGate({
    preferLocalCli: true,
    execFileImpl: async (_binary, args) => {
      const endpoint = args[1]
      requested.push(endpoint)
      if (!responses.has(endpoint)) throw new Error('unexpected endpoint')
      return { stdout: JSON.stringify(responses.get(endpoint)) }
    },
  })

  assert.equal(gate.status, 'BILLING_LOCKED')
  assert.deepEqual(requested, [...responses.keys()])
})

test('accepts a complete allowlisted recovery scope before classifying CI', () => {
  const result = summarizeReleasePrGate({
    pr: { ...openPr, changed_files: 2 },
    checkRuns: [actionCheck(1, 'success')],
    files: [
      { filename: 'apps/dashboard/vercel.json' },
      { filename: 'scripts/vercel-build-contract.test.mjs' },
    ],
  })
  assert.equal(result.status, 'HEALTHY')
})

const scheduledRun = (overrides = {}) => ({
  trigger_kind: 'scheduled',
  status: 'succeeded',
  expected_email_count: 3,
  emails_sent: 3,
  emails_failed: 0,
  slack_requested: true,
  slack_sent: true,
  ...overrides,
})

test('requires two complete scheduled runs and ignores manual/progress evidence', () => {
  const pending = summarizeAnalyticsDeliveryGate([
    scheduledRun(),
    { ...scheduledRun(), trigger_kind: 'manual' },
    { ...scheduledRun(), trigger_kind: 'local_progress' },
  ])
  assert.equal(pending.status, 'PENDING')
  assert.match(pending.summary, /1\/2/)

  const healthy = summarizeAnalyticsDeliveryGate([scheduledRun(), scheduledRun()])
  assert.equal(healthy.status, 'HEALTHY')
  assert.equal(healthy.alert, null)
})

test('marks partial email, missing Slack, and inconsistent counts degraded', () => {
  for (const broken of [
    scheduledRun({ status: 'partial', emails_sent: 2, emails_failed: 1 }),
    scheduledRun({ slack_sent: false }),
    scheduledRun({ emails_sent: 2 }),
    scheduledRun({ expected_email_count: 0, emails_sent: 0 }),
  ]) {
    const result = summarizeAnalyticsDeliveryGate([scheduledRun(), broken])
    assert.equal(result.status, 'DEGRADED')
    assert.match(result.alert, /only 1\/2/)
  }
})

test('distinguishes an undeployed ledger from an unavailable safe RPC', async () => {
  const missing = await checkAnalyticsDeliveryGate({
    supabaseUrl: 'https://example.invalid',
    anonKey: 'anon',
    fetchImpl: async () => ({ status: 404, ok: false }),
  })
  assert.equal(missing.status, 'PENDING')
  assert.match(missing.summary, /not production-live/)

  const unavailable = await checkAnalyticsDeliveryGate({
    supabaseUrl: 'https://example.invalid',
    anonKey: 'anon',
    fetchImpl: async () => ({ status: 503, ok: false }),
  })
  assert.equal(unavailable.status, 'UNAVAILABLE')
})
