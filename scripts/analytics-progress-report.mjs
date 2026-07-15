#!/usr/bin/env node

import { appendFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { checkAnalyticsExternalGates } from './analytics-external-gates.mjs'
import {
  claimProgressReportRun,
  detectAnalyticsAuditLedger,
  progressInvocationKey,
  progressTriggerKind,
} from './analytics-report-audit-client.mjs'

const PLAN_PATH = resolve('docs/active/ANALYTICS_RELIABILITY_EXECUTION_PLAN.md')
const args = new Set(process.argv.slice(2))
const shouldSend = args.has('--send')

const plan = await readFile(PLAN_PATH, 'utf8')
const statusMatch = plan.match(/<!--\s*analytics-program:status=(ACTIVE|DONE)\s*-->/)

if (!statusMatch) {
  throw new Error('Missing analytics program status marker in execution plan')
}

const programStatus = statusMatch[1]
const phasePattern = /^## (Phase \d+:[^\n]+)$/gm
const taskPattern = /^- \[([ xX])\] `?(AR-\d+)`? (.+)$/gm
const phases = [...plan.matchAll(phasePattern)].map(match => ({
  name: match[1],
  index: match.index,
}))

const tasks = [...plan.matchAll(taskPattern)].map(match => {
  const phase = [...phases].reverse().find(candidate => candidate.index < match.index)
  return {
    id: match[2],
    description: match[3],
    complete: match[1].toLowerCase() === 'x',
    phase: phase?.name ?? 'Decisions required from the founder',
  }
})

if (tasks.length === 0) {
  throw new Error('No AR tasks found in execution plan')
}

const completed = tasks.filter(task => task.complete)
const pending = tasks.filter(task => !task.complete)
const percent = Math.round((completed.length / tasks.length) * 100)
const byPhase = new Map()
const externalGates = programStatus === 'ACTIVE'
  ? await checkAnalyticsExternalGates()
  : []

for (const task of tasks) {
  const phase = byPhase.get(task.phase) ?? { complete: 0, total: 0 }
  phase.total += 1
  phase.complete += task.complete ? 1 : 0
  byPhase.set(task.phase, phase)
}

const reportLines = [
  '# KStoryBridge Analytics Program Progress',
  '',
  `**Status:** ${programStatus}`,
  `**Progress:** ${completed.length}/${tasks.length} tasks (${percent}%)`,
  '',
  '## Phase progress',
  '',
  '| Phase | Complete | Progress |',
  '|---|---:|---:|',
]

for (const [phase, counts] of byPhase) {
  reportLines.push(`| ${phase} | ${counts.complete}/${counts.total} | ${Math.round((counts.complete / counts.total) * 100)}% |`)
}

if (externalGates.length > 0) {
  reportLines.push(
    '',
    '## External gates',
    '',
    '| Task | Gate | Status | Evidence |',
    '|---|---|---|---|'
  )

  for (const gate of externalGates) {
    reportLines.push(`| ${gate.id} | ${gate.name} | ${gate.status} | ${gate.summary} |`)
  }
}

reportLines.push('', '## Next pending tasks', '')

for (const task of pending.slice(0, 10)) {
  reportLines.push(`- **${task.id}:** ${task.description}`)
}

if (pending.length > 10) {
  reportLines.push(`- ...and ${pending.length - 10} additional pending tasks.`)
}

const report = `${reportLines.join('\n')}\n`
console.log(report)

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, report)
}

if (programStatus === 'DONE') {
  console.log('Program is DONE; scheduled delivery is disabled by the plan status marker.')
  process.exit(0)
}

if (!shouldSend) {
  process.exit(0)
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL/SUPABASE_ANON_KEY (or their VITE_ equivalents) are required with --send')
}

const auditLedgerLive = await detectAnalyticsAuditLedger({
  supabaseUrl,
  anonKey: supabaseAnonKey,
})
let reportRunId
let authorizationKey = supabaseAnonKey

if (auditLedgerLive) {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required after analytics delivery audit cutover')
  }
  const triggerKind = progressTriggerKind()
  const invocationDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const claim = await claimProgressReportRun({
    supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
    invocationKey: progressInvocationKey(triggerKind, invocationDate),
    triggerKind,
  })
  if (!claim.should_execute) {
    console.log(`Progress report delivery already recorded with status ${claim.run_status}.`)
    process.exit(0)
  }
  reportRunId = claim.report_run_id
  authorizationKey = supabaseServiceRoleKey
}

const response = await fetch(`${supabaseUrl}/functions/v1/send-analytics-report`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${authorizationKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reportType: 'weekly',
    ...(reportRunId ? { auditReportType: 'progress' } : {}),
    reportDate: new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeZone: 'America/Los_Angeles',
    }).format(new Date()),
    reportMarkdown: report,
    ...(reportRunId ? { reportRunId } : {}),
    alerts: [
      ...(pending.length > 0
        ? [`Analytics reliability program has ${pending.length} pending tasks`]
        : []),
      ...externalGates.flatMap(gate => gate.alert ? [gate.alert] : []),
    ],
    sendSlack: true,
  }),
})

const responseText = await response.text()

if (!response.ok) {
  throw new Error(`Progress report delivery failed (${response.status}): ${responseText}`)
}

console.log(`Progress report delivered: ${responseText}`)
