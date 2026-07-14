import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS,
  authenticatedBuyerEngagementRows,
  COMMERCIAL_OUTCOME_EVENTS,
  SCHEDULED_REPORT_EVENTS,
  TRIAL_FUNNEL_EVENTS,
} from './analytics-report-events.ts'

test('scheduled reporting uses the canonical authenticated event contract', () => {
  assert.deepEqual(AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS, [
    'title_search_submitted',
    'title_detail_viewed',
    'chat_message_sent',
    'comps_search_submitted',
    'mandate_search_submitted',
    'favorite_added',
    'favorite_removed',
    'pitch_deck_opened',
    'pitch_deck_page_viewed',
  ])
  assert.deepEqual(COMMERCIAL_OUTCOME_EVENTS, [
    'checkout_started',
    'subscription_started',
  ])

  for (const obsoleteName of ['signin', 'comps_search', 'checkout_completed']) {
    assert.equal(SCHEDULED_REPORT_EVENTS.includes(obsoleteName), false)
  }
  for (const canonicalName of [
    'signin_completed',
    ...AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS,
    ...COMMERCIAL_OUTCOME_EVENTS,
  ]) {
    assert.equal(SCHEDULED_REPORT_EVENTS.includes(canonicalName), true)
  }
})

test('report rows never backfill canonical outcomes from legacy aliases', () => {
  const rows = authenticatedBuyerEngagementRows({
    comps_search_submitted: { eventCount: 2, totalUsers: 1 },
    comps_search: { eventCount: 99, totalUsers: 50 },
    checkout_completed: { eventCount: 40, totalUsers: 40 },
  })

  assert.deepEqual(
    rows.find(row => row.eventName === 'comps_search_submitted'),
    {
      eventName: 'comps_search_submitted',
      label: 'Comps search submitted',
      eventCount: 2,
      totalUsers: 1,
    }
  )
  assert.equal(rows.some(row => row.eventName === 'comps_search'), false)
  assert.equal(rows.some(row => row.eventName === 'checkout_completed'), false)
})

test('active public-trial events remain separate from authenticated outcomes', () => {
  assert.deepEqual(TRIAL_FUNNEL_EVENTS, [
    'trial_page_view',
    'trial_tool_selected',
    'trial_comps_search',
    'trial_mandate_search',
    'trial_chat_message_sent',
    'trial_search_completed',
    'trial_limit_reached',
    'trial_signup_cta_clicked',
  ])
  assert.equal(
    TRIAL_FUNNEL_EVENTS.some(eventName =>
      AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS.includes(eventName)
    ),
    false
  )
})
