import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildActivityDigest,
  isInternalEmail,
  parseTopPages,
  renderActivityDigestMarkdown,
} from './weekly-activity-digest.ts'

const WINDOW_START = Date.parse('2026-07-06T07:00:00.000Z') // Mon 00:00 PT
const WINDOW_END = Date.parse('2026-07-13T07:00:00.000Z') // next Mon 00:00 PT

function profiles(entries) {
  return new Map(entries.map(([email, p]) => [email.toLowerCase(), p]))
}

test('signups are accounts created within the window', () => {
  const digest = buildActivityDigest({
    users: [
      { email: 'new@studio.com', created_at: '2026-07-08T10:00:00Z', last_sign_in_at: '2026-07-08T10:00:00Z' },
      { email: 'old@studio.com', created_at: '2026-05-01T10:00:00Z', last_sign_in_at: null },
    ],
    profilesByEmail: profiles([['new@studio.com', { full_name: 'New Buyer', account_type: 'buyer', tier: 'basic' }]]),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    topPages: [],
  })
  assert.equal(digest.signups.length, 1)
  assert.equal(digest.signups[0].email, 'new@studio.com')
  assert.equal(digest.signups[0].name, 'New Buyer')
  assert.equal(digest.returns.length, 0)
})

test('returns are pre-existing accounts that signed in during the window', () => {
  const digest = buildActivityDigest({
    users: [
      { email: 'repeat@studio.com', created_at: '2026-05-01T10:00:00Z', last_sign_in_at: '2026-07-10T09:00:00Z' },
    ],
    profilesByEmail: profiles([]),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    topPages: [],
  })
  assert.equal(digest.returns.length, 1)
  assert.equal(digest.returns[0].email, 'repeat@studio.com')
  assert.equal(digest.signups.length, 0)
})

test('a brand-new account is a signup, never also a return', () => {
  const digest = buildActivityDigest({
    users: [
      { email: 'fresh@studio.com', created_at: '2026-07-07T10:00:00Z', last_sign_in_at: '2026-07-09T10:00:00Z' },
    ],
    profilesByEmail: profiles([]),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    topPages: [],
  })
  assert.equal(digest.signups.length, 1)
  assert.equal(digest.returns.length, 0)
})

test('internal/team accounts are excluded from headline counts but tallied', () => {
  const digest = buildActivityDigest({
    users: [
      { email: 'sungho@kstorybridge.com', created_at: '2026-07-07T10:00:00Z', last_sign_in_at: '2026-07-07T10:00:00Z' },
      { email: 'kevin@sandstoneartists.com', created_at: '2026-01-01T10:00:00Z', last_sign_in_at: '2026-07-11T10:00:00Z' },
      { email: 'real@studio.com', created_at: '2026-07-08T10:00:00Z', last_sign_in_at: '2026-07-08T10:00:00Z' },
    ],
    profilesByEmail: profiles([]),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    topPages: [],
  })
  assert.equal(digest.signups.length, 1)
  assert.equal(digest.signups[0].email, 'real@studio.com')
  assert.equal(digest.internalSignups, 1)
  assert.equal(digest.internalReturns, 1)
})

test('activity outside the window is ignored', () => {
  const digest = buildActivityDigest({
    users: [
      { email: 'early@studio.com', created_at: '2026-07-05T10:00:00Z', last_sign_in_at: '2026-07-05T10:00:00Z' },
      { email: 'late@studio.com', created_at: '2026-07-14T10:00:00Z', last_sign_in_at: '2026-07-14T10:00:00Z' },
    ],
    profilesByEmail: profiles([]),
    windowStartMs: WINDOW_START,
    windowEndMs: WINDOW_END,
    topPages: [],
  })
  assert.equal(digest.signups.length, 0)
  assert.equal(digest.returns.length, 0)
})

test('isInternalEmail matches team patterns only', () => {
  assert.equal(isInternalEmail('someone@kstorybridge.com'), true)
  assert.equal(isInternalEmail('sleekr21@gmail.com'), true)
  assert.equal(isInternalEmail('neo.e2e.signup@mailinator.com'), true)
  assert.equal(isInternalEmail('test-creator@kstorybridge-test.com'), true)
  assert.equal(isInternalEmail('buyer@warnerbros.com'), false)
  assert.equal(isInternalEmail(null), false)
})

test('parseTopPages maps pagePath + rounded engagement seconds', () => {
  const pages = parseTopPages({
    rows: [
      { dimensionValues: [{ value: '/buyers/titles' }], metricValues: [{ value: '14' }, { value: '130.6' }] },
      { dimensionValues: [{ value: '/buyers/chat' }], metricValues: [{ value: '6' }, { value: '242.2' }] },
    ],
  })
  assert.deepEqual(pages, [
    { path: '/buyers/titles', views: 14, avgEngagementSeconds: 131 },
    { path: '/buyers/chat', views: 6, avgEngagementSeconds: 242 },
  ])
})

test('markdown renders named people, page table, and empty states', () => {
  const md = renderActivityDigestMarkdown(
    {
      signups: [
        {
          email: 'jane@studio.com',
          name: 'Jane Doe',
          company: 'Studio X',
          tier: 'basic',
          accountType: 'buyer',
          at: '2026-07-08T10:00:00Z',
          internal: false,
        },
      ],
      returns: [],
      internalSignups: 2,
      internalReturns: 0,
      topPages: [{ path: '/buyers/titles', views: 14, avgEngagementSeconds: 131 }],
    },
    { startDate: '2026-07-06', endDate: '2026-07-12' }
  )
  assert.match(md, /## Signed up \(1\)/)
  assert.match(md, /Jane Doe \(jane@studio\.com\)/)
  assert.match(md, /## Returned \(0\)/)
  assert.match(md, /_No external returning users this week\._/)
  assert.match(md, /\/buyers\/titles \| 14 \| 2m 11s/)
  assert.match(md, /excluded 2 internal signup/)
})
