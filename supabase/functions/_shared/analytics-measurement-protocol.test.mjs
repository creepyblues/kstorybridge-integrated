import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildMeasurementProtocolPayload,
  retryDelaySeconds,
} from './analytics-measurement-protocol.ts'

const validRow = {
  id: 'outbox-1',
  event_name: 'subscription_started',
  user_id: '123e4567-e89b-42d3-a456-426614174000',
  event_params: {
    account_type: 'buyer',
    app_section: 'dashboard',
    traffic_type: 'external',
    plan_type: 'suite',
    billing_period: 'monthly',
    currency: 'USD',
    value: 500,
  },
  occurred_at: '2026-07-13T12:00:00.000Z',
  attempt_count: 1,
}

test('builds one privacy-safe Measurement Protocol event', () => {
  const payload = buildMeasurementProtocolPayload(validRow)

  assert.equal(payload.client_id, validRow.user_id)
  assert.equal(payload.user_id, validRow.user_id)
  assert.equal(payload.events[0].name, 'subscription_started')
  assert.deepEqual(payload.events[0].params, {
    page_location: 'https://dashboard.kstorybridge.com/',
    ...validRow.event_params,
  })
  assert.equal('email' in payload.events[0].params, false)
  assert.equal('stripe_subscription_id' in payload.events[0].params, false)
  assert.equal('title_id' in payload.events[0].params, false)
})

test('rejects extra, high-cardinality, and mismatched fields', () => {
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...validRow,
      event_params: { ...validRow.event_params, stripe_subscription_id: 'sub_123' },
    }),
    /invalid_outbox_param_shape/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...validRow,
      event_params: { ...validRow.event_params, app_section: 'creator' },
    }),
    /invalid_outbox_app_section/
  )
})

test('derives the fixed creator production origin without accepting a URL field', () => {
  const payload = buildMeasurementProtocolPayload({
    ...validRow,
    event_params: {
      ...validRow.event_params,
      account_type: 'creator',
      app_section: 'creator',
      plan_type: 'premium',
    },
  })

  assert.equal(
    payload.events[0].params.page_location,
    'https://creator.kstorybridge.com/'
  )
})

test('builds exact creator approval and publication events', () => {
  const draftId = '223e4567-e89b-42d3-a456-426614174001'
  const titleId = '323e4567-e89b-42d3-a456-426614174002'
  const approved = buildMeasurementProtocolPayload({
    ...validRow,
    event_name: 'title_approved',
    event_params: {
      app_section: 'creator',
      traffic_type: 'external',
      draft_id: draftId,
    },
  })
  const published = buildMeasurementProtocolPayload({
    ...validRow,
    event_name: 'title_published',
    event_params: {
      app_section: 'creator',
      traffic_type: 'internal',
      draft_id: draftId,
      title_id: titleId,
    },
  })

  assert.deepEqual(approved.events[0], {
    name: 'title_approved',
    params: {
      page_location: 'https://creator.kstorybridge.com/',
      app_section: 'creator',
      traffic_type: 'external',
      draft_id: draftId,
    },
  })
  assert.deepEqual(published.events[0], {
    name: 'title_published',
    params: {
      page_location: 'https://creator.kstorybridge.com/',
      app_section: 'creator',
      traffic_type: 'internal',
      draft_id: draftId,
      title_id: titleId,
    },
  })
})

test('rejects malformed, extra, and mismatched title workflow fields', () => {
  const titleRow = {
    ...validRow,
    event_name: 'title_published',
    event_params: {
      app_section: 'creator',
      traffic_type: 'external',
      draft_id: '223e4567-e89b-42d3-a456-426614174001',
      title_id: '323e4567-e89b-42d3-a456-426614174002',
    },
  }
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...titleRow,
      event_params: { ...titleRow.event_params, title_name: 'Sensitive title' },
    }),
    /invalid_outbox_param_shape/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...titleRow,
      event_params: { ...titleRow.event_params, app_section: 'dashboard' },
    }),
    /invalid_outbox_app_section/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...titleRow,
      event_params: { ...titleRow.event_params, draft_id: 'not-a-uuid' },
    }),
    /invalid_outbox_draft_id/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...titleRow,
      event_params: { ...titleRow.event_params, title_id: 'not-a-uuid' },
    }),
    /invalid_outbox_title_id/
  )
})

test('rejects invalid identity, controlled values, and timestamps', () => {
  assert.throws(
    () => buildMeasurementProtocolPayload({ ...validRow, user_id: 'buyer@example.com' }),
    /invalid_outbox_identity_or_event/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({
      ...validRow,
      event_params: { ...validRow.event_params, value: -1 },
    }),
    /invalid_outbox_value/
  )
  assert.throws(
    () => buildMeasurementProtocolPayload({ ...validRow, occurred_at: 'not-a-date' }),
    /invalid_outbox_timestamp/
  )
})

test('uses bounded exponential retry delays', () => {
  assert.equal(retryDelaySeconds(1), 60)
  assert.equal(retryDelaySeconds(2), 120)
  assert.equal(retryDelaySeconds(20), 61440)
})
