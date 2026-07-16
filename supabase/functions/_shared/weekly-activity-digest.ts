// Pure logic for the weekly activity digest (Sunday email).
//
// Answers three questions for the reporting window:
//   1. Who signed up?      (auth.created_at inside the window)
//   2. Who returned?       (auth.last_sign_in_at inside the window, account
//                           created before the window — i.e. a repeat visit)
//   3. Which pages, how long? (GA4 aggregate — per-named-user journeys arrive
//                           later once page_view_events logging accrues)
//
// Kept IO-free so it is unit-testable without Supabase or GA4.

import type { GA4Response } from './ga4-client.ts'

// Team accounts whose activity should be labelled internal and excluded from
// the external headline counts. Mirrors the frontend isInternalEmail list.
export const INTERNAL_EMAIL_PATTERNS: RegExp[] = [
  /@kstorybridge\.com$/i,
  /@voyagerx\.com$/i,
  /^kevin@sandstoneartists\.com$/i,
  /^sleekr21@gmail\.com$/i,
  /^creepyblues@gmail\.com$/i,
]

export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const value = email.trim()
  return INTERNAL_EMAIL_PATTERNS.some(re => re.test(value))
}

export interface AuthUserRecord {
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
}

export interface ProfileRecord {
  full_name?: string | null
  company?: string | null
  tier?: string | null
  account_type?: 'buyer' | 'creator'
}

export interface DigestPerson {
  email: string
  name: string | null
  company: string | null
  tier: string | null
  accountType: 'buyer' | 'creator' | null
  at: string // ISO timestamp of the relevant event (signup or last return)
  internal: boolean
}

export interface DigestPageRow {
  path: string
  views: number
  avgEngagementSeconds: number
}

export interface ActivityDigest {
  signups: DigestPerson[]
  returns: DigestPerson[]
  internalSignups: number
  internalReturns: number
  topPages: DigestPageRow[]
}

function inWindow(iso: string | null, startMs: number, endMs: number): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  return Number.isFinite(t) && t >= startMs && t < endMs
}

function toPerson(
  user: AuthUserRecord,
  profiles: Map<string, ProfileRecord>,
  at: string
): DigestPerson {
  const email = (user.email ?? '').toLowerCase()
  const profile = profiles.get(email)
  return {
    email,
    name: profile?.full_name ?? null,
    company: profile?.company ?? null,
    tier: profile?.tier ?? null,
    accountType: profile?.account_type ?? null,
    at,
    internal: isInternalEmail(email),
  }
}

export function buildActivityDigest(params: {
  users: AuthUserRecord[]
  profilesByEmail: Map<string, ProfileRecord>
  windowStartMs: number
  windowEndMs: number
  topPages: DigestPageRow[]
}): ActivityDigest {
  const { users, profilesByEmail, windowStartMs, windowEndMs, topPages } = params

  const signupsAll: DigestPerson[] = []
  const returnsAll: DigestPerson[] = []

  for (const user of users) {
    if (!user.email) continue
    const isSignup = inWindow(user.created_at, windowStartMs, windowEndMs)
    if (isSignup) {
      signupsAll.push(toPerson(user, profilesByEmail, user.created_at as string))
      continue // a brand-new account is a signup, not a "return"
    }
    if (
      inWindow(user.last_sign_in_at, windowStartMs, windowEndMs) &&
      user.created_at &&
      Date.parse(user.created_at) < windowStartMs
    ) {
      returnsAll.push(toPerson(user, profilesByEmail, user.last_sign_in_at as string))
    }
  }

  const byAtDesc = (a: DigestPerson, b: DigestPerson) => Date.parse(b.at) - Date.parse(a.at)

  return {
    signups: signupsAll.filter(p => !p.internal).sort(byAtDesc),
    returns: returnsAll.filter(p => !p.internal).sort(byAtDesc),
    internalSignups: signupsAll.filter(p => p.internal).length,
    internalReturns: returnsAll.filter(p => p.internal).length,
    topPages,
  }
}

// GA4 rows: [pagePath, screenPageViews, averageSessionDuration]
export function parseTopPages(response: GA4Response, limit = 12): DigestPageRow[] {
  const rows = response.rows ?? []
  return rows.slice(0, limit).map(row => ({
    path: row.dimensionValues[0]?.value ?? '(unknown)',
    views: Number(row.metricValues[0]?.value ?? '0'),
    avgEngagementSeconds: Math.round(Number(row.metricValues[1]?.value ?? '0')),
  }))
}

function fmtDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0s'
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function personLine(p: DigestPerson): string {
  const who = p.name ? `${p.name} (${p.email})` : p.email
  const meta: string[] = []
  if (p.accountType) meta.push(p.accountType)
  if (p.tier) meta.push(`tier ${p.tier}`)
  if (p.company) meta.push(p.company)
  const suffix = meta.length ? ` — ${meta.join(', ')}` : ''
  return `- ${who}${suffix} · ${fmtDay(p.at)}`
}

export function renderActivityDigestMarkdown(
  digest: ActivityDigest,
  window: { startDate: string; endDate: string }
): string {
  const lines: string[] = []
  lines.push(`# KStoryBridge Weekly Activity`)
  lines.push(`**${window.startDate} → ${window.endDate}** (America/Los_Angeles)`)
  lines.push('')

  lines.push(`## Signed up (${digest.signups.length})`)
  if (digest.signups.length === 0) {
    lines.push('_No external signups this week._')
  } else {
    digest.signups.forEach(p => lines.push(personLine(p)))
  }
  lines.push('')

  lines.push(`## Returned (${digest.returns.length})`)
  if (digest.returns.length === 0) {
    lines.push('_No external returning users this week._')
  } else {
    digest.returns.forEach(p => lines.push(personLine(p)))
  }
  lines.push('')

  lines.push('## Top pages (site-wide, external traffic)')
  if (digest.topPages.length === 0) {
    lines.push('_No page activity recorded._')
  } else {
    lines.push('| Page | Views | Avg engagement |')
    lines.push('|------|-------|----------------|')
    digest.topPages.forEach(pg =>
      lines.push(`| ${pg.path} | ${pg.views} | ${fmtDuration(pg.avgEngagementSeconds)} |`)
    )
  }
  lines.push('')

  const internalNote =
    digest.internalSignups + digest.internalReturns > 0
      ? ` (excluded ${digest.internalSignups} internal signup(s), ${digest.internalReturns} internal return(s))`
      : ''
  lines.push(
    `_Page timings are site-wide aggregates; per-person page journeys will appear once page-view logging accrues._${internalNote}`
  )

  return lines.join('\n')
}
