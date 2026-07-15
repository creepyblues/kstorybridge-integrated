import assert from 'node:assert/strict'
import test from 'node:test'

import {
  billingPeriodFromStripeInterval,
  enqueueSubscriptionStarted,
  enqueueTitleWorkflowOutcomes,
  enqueueTitleWorkflowOutcomesForCreator,
  getAnalyticsTrafficType,
  subscriptionValueFromUnitAmount,
} from './analytics-outbox.ts'

test('normalizes Stripe billing and value without exposing price identifiers', () => {
  assert.equal(billingPeriodFromStripeInterval('month'), 'monthly')
  assert.equal(billingPeriodFromStripeInterval('year'), 'yearly')
  assert.equal(billingPeriodFromStripeInterval(undefined), 'monthly')
  assert.equal(subscriptionValueFromUnitAmount(25000), 250)
  assert.equal(subscriptionValueFromUnitAmount(null), 0)
})

test('enqueues approval and publication through one controlled RPC', async () => {
  const calls = []
  const client = {
    rpc: async (name, params) => {
      calls.push({ name, params })
      return {
        data: [{
          approved_outbox_id: 'approved-outbox-uuid',
          published_outbox_id: 'published-outbox-uuid',
        }],
        error: null,
      }
    },
  }

  const result = await enqueueTitleWorkflowOutcomes(client, {
    draftId: 'draft-uuid',
    titleId: 'title-uuid',
    creatorId: 'creator-uuid',
    trafficType: 'external',
    occurredAt: '2026-07-13T12:00:00.000Z',
  })

  assert.deepEqual(result, {
    approvedOutboxId: 'approved-outbox-uuid',
    publishedOutboxId: 'published-outbox-uuid',
  })
  assert.deepEqual(calls, [{
    name: 'enqueue_title_workflow_outcomes',
    params: {
      p_draft_id: 'draft-uuid',
      p_title_id: 'title-uuid',
      p_creator_id: 'creator-uuid',
      p_traffic_type: 'external',
      p_occurred_at: '2026-07-13T12:00:00.000Z',
    },
  }])
  assert.equal('title_name' in calls[0].params, false)
  assert.equal('admin_user_id' in calls[0].params, false)
})

test('fails approval success when either durable outcome id is unavailable', async () => {
  for (const data of [
    null,
    [],
    [{ approved_outbox_id: 'approved-only' }],
  ]) {
    const client = { rpc: async () => ({ data, error: null }) }
    await assert.rejects(
      () => enqueueTitleWorkflowOutcomes(client, {
        draftId: 'draft-uuid',
        titleId: 'title-uuid',
        creatorId: 'creator-uuid',
        trafficType: 'external',
        occurredAt: '2026-07-13T12:00:00.000Z',
      }),
      /analytics_title_workflow_enqueue_failed/
    )
  }
})

test('classifies the creator before atomically enqueueing title outcomes', async () => {
  const calls = []
  const client = {
    auth: { admin: { getUserById: async userId => {
      calls.push({ type: 'traffic', userId })
      return { data: { user: { app_metadata: { internal_traffic: true } } }, error: null }
    } } },
    rpc: async (name, params) => {
      calls.push({ type: 'rpc', name, params })
      return { data: [{ approved_outbox_id: 'approved-id', published_outbox_id: 'published-id' }], error: null }
    },
  }

  await enqueueTitleWorkflowOutcomesForCreator(client, {
    draftId: 'draft-uuid',
    titleId: 'title-uuid',
    creatorId: 'creator-uuid',
    occurredAt: '2026-07-13T12:00:00.000Z',
  })

  assert.equal(calls[0].type, 'traffic')
  assert.equal(calls[1].params.p_traffic_type, 'internal')
})

test('never enqueues title outcomes when creator traffic classification fails', async () => {
  let rpcCalled = false
  const client = {
    auth: { admin: { getUserById: async () => ({ data: { user: null }, error: { message: 'unavailable' } }) } },
    rpc: async () => {
      rpcCalled = true
      return { data: null, error: null }
    },
  }

  await assert.rejects(
    () => enqueueTitleWorkflowOutcomesForCreator(client, {
      draftId: 'draft-uuid',
      titleId: 'title-uuid',
      creatorId: 'creator-uuid',
      occurredAt: '2026-07-13T12:00:00.000Z',
    }),
    /analytics_traffic_lookup_failed/
  )
  assert.equal(rpcCalled, false)
})

test('derives internal traffic only from protected auth metadata', async () => {
  const internalClient = {
    auth: { admin: { getUserById: async () => ({ data: { user: { app_metadata: { internal_traffic: true } } }, error: null }) } },
  }
  const externalClient = {
    auth: { admin: { getUserById: async () => ({ data: { user: { app_metadata: {} } }, error: null }) } },
  }

  assert.equal(await getAnalyticsTrafficType(internalClient, 'user-1'), 'internal')
  assert.equal(await getAnalyticsTrafficType(externalClient, 'user-2'), 'external')
})

test('fails closed when protected traffic classification is unavailable', async () => {
  const client = {
    auth: { admin: { getUserById: async () => ({ data: { user: null }, error: { message: 'not found' } }) } },
  }
  await assert.rejects(
    () => getAnalyticsTrafficType(client, 'user-1'),
    /analytics_traffic_lookup_failed/
  )
})

test('enqueues one controlled payload keyed by account and Stripe subscription', async () => {
  const calls = []
  const client = {
    rpc: async (name, params) => {
      calls.push({ name, params })
      return { data: 'outbox-uuid', error: null }
    },
  }

  const id = await enqueueSubscriptionStarted(client, {
    stripeSubscriptionId: 'sub_123',
    userId: 'user-uuid',
    accountType: 'creator',
    trafficType: 'external',
    planType: 'premium',
    billingPeriod: 'monthly',
    currency: 'usd',
    value: 200,
    occurredAt: '2026-07-13T12:00:00.000Z',
  })

  assert.equal(id, 'outbox-uuid')
  assert.deepEqual(calls, [{
    name: 'enqueue_subscription_started',
    params: {
      p_dedupe_key: 'subscription_started:creator:sub_123',
      p_user_id: 'user-uuid',
      p_account_type: 'creator',
      p_traffic_type: 'external',
      p_plan_type: 'premium',
      p_billing_period: 'monthly',
      p_currency: 'USD',
      p_value: 200,
      p_occurred_at: '2026-07-13T12:00:00.000Z',
    },
  }])
  assert.equal('creator_email' in calls[0].params, false)
  assert.equal('stripe_subscription_id' in calls[0].params, false)
  assert.equal('title_id' in calls[0].params, false)
})

test('fails the webhook boundary when durable enqueue fails', async () => {
  const client = {
    rpc: async () => ({ data: null, error: { message: 'database unavailable' } }),
  }
  await assert.rejects(
    () => enqueueSubscriptionStarted(client, {
      stripeSubscriptionId: 'sub_123',
      userId: 'user-uuid',
      accountType: 'buyer',
      trafficType: 'external',
      planType: 'pro',
      billingPeriod: 'monthly',
      currency: 'USD',
      value: 250,
      occurredAt: '2026-07-13T12:00:00.000Z',
    }),
    /analytics_outbox_enqueue_failed/
  )
})
