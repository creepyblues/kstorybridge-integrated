# Webhook Idempotency Implementation Plan

**Issue**: No Webhook Idempotency Protection (Issue #1 from Production Readiness Review)
**Status**: 🔴 CRITICAL - Required before production
**Created**: 2025-10-09
**Last Updated**: 2025-10-09

---

## 📊 Executive Summary

This document provides a comprehensive plan to implement idempotency protection for Stripe webhooks, preventing duplicate event processing that could lead to data corruption, incorrect tier assignments, or financial discrepancies.

### Problem Statement
Currently, the webhook handler (`stripe-webhook/index.ts`) has **zero protection against duplicate event processing**. If Stripe retries a webhook (which happens automatically on timeouts or 5xx errors), the same event could:
- Update `stripe_customers` table multiple times
- Toggle user tier between basic/pro multiple times
- Create inconsistent database state
- Potentially create duplicate records

### Solution Overview
Implement a **three-layer idempotency protection**:
1. **Event deduplication** - Track processed events in database
2. **Atomic updates** - Wrap database operations in transactions
3. **Verification** - Confirm state after all updates

### Impact Assessment
- **Risk Level**: 🔴 CRITICAL if not implemented
- **Breaking Changes**: ⚠️ MODERATE (requires database migration, edge function update)
- **Development Time**: 2-3 days (including testing)
- **Deployment Risk**: 🟡 LOW (with proper rollout strategy)

---

## 🔍 Current State Analysis

### Files Affected
```
apps/dashboard/supabase/functions/stripe-webhook/index.ts (559 lines)
├── Line 144-330: checkout.session.completed (187 lines)
├── Line 333-403: customer.subscription.updated (71 lines)
├── Line 405-437: customer.subscription.deleted (33 lines)
├── Line 439-512: invoice.payment_succeeded (74 lines)
└── Line 514-527: invoice.payment_failed (14 lines)
```

### Current Processing Flow
```
1. Receive webhook request
2. Verify Stripe signature ✅ (SECURE)
3. Process event immediately ❌ (NO IDEMPOTENCY CHECK)
4. Update stripe_customers table ❌ (NO TRANSACTION)
5. Update user_buyers.tier table ❌ (NO TRANSACTION)
6. Return 200 response
```

### Vulnerable Operations

**Operation 1: checkout.session.completed** (Lines 226-228 + 284-288)
```typescript
// FIRST UPDATE (no transaction)
await supabase
  .from('stripe_customers')
  .upsert(stripeCustomerData) // Could execute twice

// SECOND UPDATE (separate, no transaction)
await supabase
  .from('user_buyers')
  .update({ tier: 'pro' }) // Could execute twice
  .eq('id', userId)
```
**Risk**: User could end up with Pro tier but no subscription record, or vice versa.

**Operation 2: customer.subscription.updated** (Lines 360-363 + 390-393)
```typescript
// Updates in sequence, not atomic
await supabase.from('stripe_customers').update(updateData)
await supabase.from('user_buyers').update({ tier: newTier })
```
**Risk**: Tier could be updated but subscription status not updated, creating data inconsistency.

**Operation 3: customer.subscription.deleted** (Lines 415-427)
```typescript
// Three separate operations
await supabase.from('stripe_customers').update({ subscription_status: 'canceled' })
await supabase.from('user_buyers').update({ tier: 'basic' })
```
**Risk**: User downgraded to basic but subscription still shows active in database.

### Dependencies Analysis

**Direct Dependencies**:
- `stripe_customers` table (read/write)
- `user_buyers` table (read/write)
- Supabase client with service role
- Stripe SDK for webhook verification

**Indirect Dependencies**:
- `useTierAccess` hook (reads from `user_buyers.tier`)
- `PaymentSuccess` page (reads from both tables)
- `SubscriptionManagement` page (reads from `stripe_customers`)
- All tier-gated content (depends on tier validation)

**External Dependencies**:
- Stripe webhook retries (automatic, uncontrollable)
- Network timeouts (could cause incomplete responses)
- Database performance (slow queries could timeout webhook)

---

## 🚨 Risk Assessment

### Risk #1: Duplicate Event Processing
**Severity**: 🔴 CRITICAL
**Likelihood**: HIGH (Stripe retries on any 5xx or timeout)

**Scenario**:
```
1. Webhook receives checkout.session.completed
2. Updates stripe_customers (succeeds)
3. Updates user_buyers.tier = 'pro' (succeeds)
4. Network timeout before returning 200
5. Stripe retries same event (automatic)
6. Updates stripe_customers again (duplicate)
7. Updates tier again (could toggle between basic/pro)
```

**Impact**:
- Data corruption in `stripe_customers` table
- Incorrect tier assignments
- User experience issues (Pro features flickering)
- Financial reporting inaccuracies

**Current Protection**: ❌ NONE

---

### Risk #2: Race Conditions
**Severity**: 🔴 CRITICAL
**Likelihood**: MEDIUM (requires simultaneous events)

**Scenario**:
```
1. Payment succeeds → checkout.session.completed fires
2. Simultaneously, subscription updates → customer.subscription.updated fires
3. Both webhooks try to update same user tier
4. No transaction wrapping = unpredictable outcome
```

**Impact**:
- Undefined final tier state
- Database constraints violated
- Potential deadlocks

**Current Protection**: ❌ NONE (no transaction wrapping)

---

### Risk #3: Partial Updates
**Severity**: 🟠 HIGH
**Likelihood**: MEDIUM (database errors, network issues)

**Scenario**:
```
1. Update stripe_customers (succeeds)
2. Update user_buyers.tier (fails due to RLS policy, network error, etc.)
3. Result: Subscription record exists, but tier still 'basic'
```

**Impact**:
- User charged but no Pro access
- Support tickets
- Manual data cleanup required

**Current Protection**: ⚠️ PARTIAL (retry logic exists but not atomic)

---

### Risk #4: Out-of-Order Events
**Severity**: 🟡 MEDIUM
**Likelihood**: LOW (Stripe generally delivers in order)

**Scenario**:
```
1. subscription.deleted fires first (downgrade to basic)
2. checkout.session.completed fires after (upgrade to pro)
3. No timestamp checking = wrong final state
```

**Impact**:
- Incorrect tier after event processing
- User confusion

**Current Protection**: ❌ NONE (processes events as received)

---

## 💥 Breaking Changes Analysis

### Database Changes
**NEW TABLE REQUIRED**: `webhook_events`

**Impact Assessment**:
- ✅ **Non-breaking** - New table doesn't affect existing queries
- ✅ **Zero downtime** - Can be created while system runs
- ✅ **Reversible** - Can be dropped if needed

**Migration File**: `apps/dashboard/supabase/migrations/20251009000000_create_webhook_events.sql`

---

### Edge Function Changes
**FILE**: `supabase/functions/stripe-webhook/index.ts`

**Changes Required**:
1. Add idempotency check (Lines 142-150, new code)
2. Add event recording (Lines 151-160, new code)
3. Wrap updates in transaction (Lines 226-330, modify existing)
4. Add verification queries (Lines 331-340, new code)

**Impact Assessment**:
- ⚠️ **Deployment required** - Edge function must be redeployed
- ⚠️ **Backward compatible** - New code doesn't break existing logic
- ✅ **Rollback friendly** - Can revert to previous version

**Breaking Change Risk**: 🟡 LOW
- Webhook signature verification unchanged
- Event types processed unchanged
- Database schema compatible (new table only)
- Return responses unchanged (still 200 OK)

---

### Frontend Changes
**FILES AFFECTED**: NONE directly

**Indirect Impacts**:
- `useTierAccess` - Might see tier updates faster (more reliable)
- `PaymentSuccess` - Might need fewer retries (webhook more reliable)
- `SubscriptionManagement` - Data more consistent

**Breaking Change Risk**: 🟢 NONE

---

### RLS Policy Changes
**REQUIRED**: Add policy for `webhook_events` table

**Impact Assessment**:
- ✅ **Non-breaking** - New table, new policies
- ✅ **Secure by default** - Service role only

---

## 🛠️ Implementation Strategy

### Phase 1: Database Migration (Safe, Non-Breaking)
**Duration**: 30 minutes
**Risk**: 🟢 MINIMAL

**Tasks**:
- [ ] Create migration file
- [ ] Add `webhook_events` table
- [ ] Add unique constraint on `stripe_event_id`
- [ ] Add indexes for performance
- [ ] Add RLS policies
- [ ] Test migration in local environment
- [ ] Apply migration to production

**Success Criteria**:
- Table exists in database
- Unique constraint prevents duplicates
- Service role can insert/query
- Zero impact on existing webhooks

**Rollback**: Simple `DROP TABLE webhook_events`

---

### Phase 2: Idempotency Check (Read-Only, Safe)
**Duration**: 2 hours
**Risk**: 🟡 LOW

**Tasks**:
- [ ] Add idempotency check function
- [ ] Query `webhook_events` table before processing
- [ ] Return 200 if event already processed
- [ ] Log duplicate event detection
- [ ] Add feature flag (process duplicates in dry-run mode initially)

**Code Addition** (Lines 142-155, after signature verification):
```typescript
// Check if event already processed
const { data: existingEvent } = await supabase
  .from('webhook_events')
  .select('id, processed_at')
  .eq('stripe_event_id', receivedEvent.id)
  .single();

if (existingEvent) {
  console.log('✅ Event already processed:', {
    eventId: receivedEvent.id,
    processedAt: existingEvent.processed_at,
    action: 'skipping'
  });
  return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
}
```

**Success Criteria**:
- Duplicate events return 200 immediately
- No database updates for duplicates
- Logs show duplicate detection
- No false positives (new events processed normally)

**Rollback**: Remove idempotency check code, redeploy

---

### Phase 3: Event Recording (Write-Safe, Monitored)
**Duration**: 2 hours
**Risk**: 🟡 LOW

**Tasks**:
- [ ] Record event before processing
- [ ] Handle insertion errors gracefully
- [ ] Add retry logic for event recording
- [ ] Monitor event recording success rate

**Code Addition** (Lines 156-170, before event processing):
```typescript
// Record event as processing
const { error: recordError } = await supabase
  .from('webhook_events')
  .insert({
    stripe_event_id: receivedEvent.id,
    event_type: receivedEvent.type,
    processing_started_at: new Date().toISOString()
  });

if (recordError) {
  // Handle duplicate key violation (concurrent processing)
  if (recordError.code === '23505') { // PostgreSQL unique violation
    console.log('✅ Event being processed by another instance, returning success');
    return new Response(JSON.stringify({ received: true, concurrent: true }), { status: 200 });
  }

  // Other errors - log but continue (don't block webhook)
  console.error('⚠️ Failed to record event, continuing anyway:', recordError);
}
```

**Success Criteria**:
- Events recorded before processing
- Concurrent requests handled gracefully
- Recording failures don't block webhooks
- Monitoring shows 99%+ recording success

**Rollback**: Remove event recording, redeploy (idempotency check still works via processed events)

---

### Phase 4: Transaction Wrapping (CRITICAL, High Impact)
**Duration**: 4 hours
**Risk**: 🟠 MODERATE

**Tasks**:
- [ ] Wrap stripe_customers + user_buyers updates in transaction
- [ ] Add rollback on any failure
- [ ] Test transaction behavior with failures
- [ ] Add verification queries after commit
- [ ] Update event record to 'processed' status

**Implementation Note**:
Supabase doesn't support client-side transactions in JavaScript. Alternative approach:
1. Use database function with transaction
2. Or use optimistic locking with retry logic
3. Or implement saga pattern with compensation

**Recommended Approach**: Database function with transaction

**Create Migration** `20251009000001_create_update_tier_function.sql`:
```sql
CREATE OR REPLACE FUNCTION update_user_tier_transactional(
  p_user_id uuid,
  p_tier text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_subscription_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
) RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Update stripe_customers
  INSERT INTO stripe_customers (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_status,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_subscription_status,
    p_current_period_end,
    p_cancel_at_period_end
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    subscription_status = EXCLUDED.subscription_status,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();

  -- Update user_buyers tier
  UPDATE user_buyers
  SET tier = p_tier, updated_at = now()
  WHERE id = p_user_id;

  -- Verify both updates succeeded
  SELECT json_build_object(
    'stripe_customer', (SELECT row_to_json(sc) FROM stripe_customers sc WHERE user_id = p_user_id),
    'user_tier', (SELECT tier FROM user_buyers WHERE id = p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

**Update Webhook Handler** (Lines 226-330 replacement):
```typescript
// Call transactional function
const { data: transactionResult, error: transactionError } = await supabase
  .rpc('update_user_tier_transactional', {
    p_user_id: userId,
    p_tier: 'pro',
    p_stripe_customer_id: subscription.customer as string,
    p_stripe_subscription_id: subscription.id,
    p_subscription_status: subscription.status,
    p_current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    p_cancel_at_period_end: subscription.cancel_at_period_end
  });

if (transactionError) {
  console.error('❌ Transaction failed, rolling back:', transactionError);
  // Mark event as failed
  await supabase
    .from('webhook_events')
    .update({ processing_failed_at: new Date().toISOString(), error_message: transactionError.message })
    .eq('stripe_event_id', receivedEvent.id);

  return new Response(JSON.stringify({ error: 'Transaction failed' }), { status: 500 });
}

// Verify transaction result
console.log('✅ Transaction succeeded:', transactionResult);

// Mark event as successfully processed
await supabase
  .from('webhook_events')
  .update({ processed_at: new Date().toISOString() })
  .eq('stripe_event_id', receivedEvent.id);
```

**Success Criteria**:
- All updates atomic (both succeed or both fail)
- No partial updates in database
- Verification confirms both tables updated
- Failed transactions logged properly

**Rollback**: Revert to previous webhook version, drop function

---

### Phase 5: Verification & Monitoring
**Duration**: 1 day
**Risk**: 🟢 MINIMAL

**Tasks**:
- [ ] Add monitoring for duplicate events
- [ ] Add alerts for transaction failures
- [ ] Create dashboard for webhook health
- [ ] Test with Stripe CLI duplicate events
- [ ] Load test with concurrent webhooks
- [ ] Verify rollback procedure works

**Monitoring Metrics**:
```sql
-- Duplicate event detection rate
SELECT
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL AND created_at != processed_at) as duplicates_prevented,
  COUNT(*) FILTER (WHERE processing_failed_at IS NOT NULL) as failed
FROM webhook_events
WHERE created_at > now() - interval '1 hour';

-- Transaction failure rate
SELECT
  event_type,
  COUNT(*) FILTER (WHERE processing_failed_at IS NOT NULL) as failures,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as successes
FROM webhook_events
WHERE created_at > now() - interval '24 hours'
GROUP BY event_type;
```

**Alerts**:
- Transaction failure rate >1% (alert immediately)
- Duplicate events >10/hour (investigate)
- Event recording failures >5% (check database)

**Success Criteria**:
- 100% of duplicate events prevented
- <0.1% transaction failure rate
- <5 second webhook processing time (p95)
- Zero data inconsistencies

---

## 🧪 Testing Strategy

### Unit Tests
**Location**: `src/__tests__/webhooks/`

**Test Files to Create**:

**1. `idempotency.test.ts`** (15 test cases)
```typescript
describe('Webhook Idempotency', () => {
  it('should process new event successfully', async () => {
    // Test first-time event processing
  });

  it('should skip duplicate event', async () => {
    // Test duplicate detection
  });

  it('should handle concurrent duplicate requests', async () => {
    // Test race condition with same event ID
  });

  it('should record event before processing', async () => {
    // Test event recording
  });

  it('should return 200 for duplicate events', async () => {
    // Test response for duplicates
  });

  // ... 10 more test cases
});
```

**2. `transaction-handling.test.ts`** (12 test cases)
```typescript
describe('Transaction Handling', () => {
  it('should update both tables atomically', async () => {
    // Test successful transaction
  });

  it('should rollback on tier update failure', async () => {
    // Test rollback behavior
  });

  it('should rollback on subscription update failure', async () => {
    // Test rollback behavior
  });

  it('should verify updates after transaction', async () => {
    // Test verification logic
  });

  // ... 8 more test cases
});
```

**3. `event-recording.test.ts`** (10 test cases)
```typescript
describe('Event Recording', () => {
  it('should record event with correct data', async () => {
    // Test event insertion
  });

  it('should handle duplicate key violations', async () => {
    // Test concurrent insertion handling
  });

  it('should mark event as processed after success', async () => {
    // Test status updates
  });

  // ... 7 more test cases
});
```

---

### Integration Tests
**Location**: `src/__tests__/integration/`

**Test File**: `webhook-flow.integration.test.ts` (8 scenarios)
```typescript
describe('Webhook Integration Tests', () => {
  it('should process checkout.session.completed end-to-end', async () => {
    // Test full flow from webhook to tier update
  });

  it('should handle duplicate webhook delivery', async () => {
    // Send same event twice, verify processed once
  });

  it('should maintain data consistency on network timeout', async () => {
    // Simulate timeout, verify rollback
  });

  it('should handle concurrent webhooks for different users', async () => {
    // Test parallel processing
  });

  // ... 4 more scenarios
});
```

---

### Load Tests
**Tool**: k6 or Artillery

**Test Scenarios**:
```javascript
// Scenario 1: Duplicate event load
export default function() {
  const eventId = 'evt_test_duplicate_123';

  // Send same event 100 times concurrently
  for (let i = 0; i < 100; i++) {
    sendWebhook(eventId);
  }

  // Verify: Only 1 database update, 100 successful responses
}

// Scenario 2: Concurrent unique events
export default function() {
  // Send 1000 unique events concurrently
  for (let i = 0; i < 1000; i++) {
    sendWebhook(`evt_test_${i}`);
  }

  // Verify: All processed, no failures, no data corruption
}
```

---

### Manual Testing Checklist

- [ ] **Test 1**: Send same webhook event twice
  - Expected: First processes, second returns 200 immediately
  - Verify: Only one entry in `webhook_events`, tier updated once

- [ ] **Test 2**: Simulate network timeout
  - Send webhook, kill connection before 200 response
  - Stripe retries
  - Verify: Event processed once, duplicate detected

- [ ] **Test 3**: Send events out of order
  - Send `subscription.deleted` first
  - Then send `checkout.session.completed`
  - Verify: Final state is correct (based on timestamps)

- [ ] **Test 4**: Test transaction rollback
  - Force tier update to fail (violate RLS policy)
  - Verify: Subscription record NOT created (rollback worked)

- [ ] **Test 5**: Test concurrent webhooks
  - Send 10 different webhooks simultaneously
  - Verify: All processed, no deadlocks, data consistent

---

## 🔄 Rollback Procedures

### Emergency Rollback (If Production Issues)
**Time Required**: 5-10 minutes

**Steps**:
1. **Revert Edge Function** (immediate):
```bash
cd apps/dashboard/supabase/functions/stripe-webhook
git checkout HEAD~1 index.ts
supabase functions deploy stripe-webhook
```

2. **Monitor**: Check webhook delivery in Stripe dashboard
   - Should return to previous behavior (no idempotency, but functional)

3. **Investigate**: Review logs to identify issue

**When to Rollback**:
- Webhook success rate drops below 95%
- Data corruption detected in `stripe_customers` or `user_buyers`
- Transaction failures >5%
- Edge function crashes/timeouts

---

### Phased Rollback (If Gradual Issues)
**Time Required**: 30 minutes

**Steps**:
1. **Disable Idempotency Check** (keep event recording):
   - Comment out duplicate check code
   - Keep event logging for analysis
   - Redeploy

2. **Analyze Events**:
   - Query `webhook_events` for patterns
   - Identify root cause

3. **Fix and Redeploy**:
   - Apply fix
   - Test thoroughly
   - Gradual rollout

---

### Database Rollback (If Migration Issues)
**Time Required**: 15 minutes

**Steps**:
1. **Drop Function** (if created):
```sql
DROP FUNCTION IF EXISTS update_user_tier_transactional;
```

2. **Drop Table** (if empty or test data only):
```sql
DROP TABLE IF EXISTS webhook_events;
```

3. **Preserve Data** (if production events exist):
```sql
-- Export events first
COPY webhook_events TO '/tmp/webhook_events_backup.csv' CSV HEADER;

-- Then drop
DROP TABLE webhook_events;
```

**IMPORTANT**: Never drop `webhook_events` if it contains production data without backup

---

## 📈 Success Metrics

### Pre-Implementation Baseline
- Webhook success rate: Measure current rate
- Duplicate event handling: Currently 0% (all processed)
- Data inconsistencies: Count current issues
- Average processing time: Measure current p50, p95, p99

### Post-Implementation Targets
- ✅ Webhook success rate: 99.9%+ (unchanged or improved)
- ✅ Duplicate event handling: 100% prevented
- ✅ Data inconsistencies: 0 (down from current issues)
- ✅ Average processing time: <500ms p50, <2s p95 (no regression)
- ✅ Transaction failures: <0.1%
- ✅ Event recording success: >99.5%

### Monitoring Dashboard

**Metrics to Track**:
```sql
-- Dashboard Query 1: Webhook Health
SELECT
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
  COUNT(*) FILTER (WHERE processing_failed_at IS NOT NULL) as failed,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds,
  MAX(EXTRACT(EPOCH FROM (processed_at - created_at))) as max_processing_time_seconds
FROM webhook_events
WHERE created_at > now() - interval '24 hours'
GROUP BY event_type;

-- Dashboard Query 2: Duplicate Detection
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE created_at = processed_at) as unique_events,
  COUNT(*) FILTER (WHERE created_at != processed_at) as duplicate_events
FROM webhook_events
WHERE created_at > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Dashboard Query 3: Data Consistency Check
SELECT
  ub.id,
  ub.email,
  ub.tier,
  sc.subscription_status,
  sc.stripe_subscription_id,
  CASE
    WHEN ub.tier = 'pro' AND sc.subscription_status IN ('active', 'trialing') THEN 'CONSISTENT'
    WHEN ub.tier = 'basic' AND (sc.subscription_status IS NULL OR sc.subscription_status NOT IN ('active', 'trialing')) THEN 'CONSISTENT'
    ELSE 'INCONSISTENT'
  END as consistency_status
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.tier IN ('pro', 'basic')
  AND CASE
    WHEN ub.tier = 'pro' AND sc.subscription_status IN ('active', 'trialing') THEN 'CONSISTENT'
    WHEN ub.tier = 'basic' AND (sc.subscription_status IS NULL OR sc.subscription_status NOT IN ('active', 'trialing')) THEN 'CONSISTENT'
    ELSE 'INCONSISTENT'
  END = 'INCONSISTENT';
```

---

## 📅 Implementation Timeline

### Day 1: Database & Infrastructure
- **Morning** (4 hours):
  - [ ] Create `webhook_events` table migration
  - [ ] Create `update_user_tier_transactional` function migration
  - [ ] Test migrations locally
  - [ ] Apply to production database
  - [ ] Verify migrations successful

- **Afternoon** (4 hours):
  - [ ] Write unit tests for idempotency logic (15 tests)
  - [ ] Write unit tests for transaction handling (12 tests)
  - [ ] Write unit tests for event recording (10 tests)
  - [ ] Run tests locally, verify all pass

### Day 2: Edge Function Implementation
- **Morning** (4 hours):
  - [ ] Implement Phase 2: Idempotency check
  - [ ] Implement Phase 3: Event recording
  - [ ] Test locally with Stripe CLI
  - [ ] Deploy to staging (if available)

- **Afternoon** (4 hours):
  - [ ] Implement Phase 4: Transaction wrapping
  - [ ] Update all 5 event handlers
  - [ ] Test transaction rollback scenarios
  - [ ] Run integration tests
  - [ ] Verify all tests pass

### Day 3: Testing & Deployment
- **Morning** (4 hours):
  - [ ] Run load tests (duplicate events, concurrent events)
  - [ ] Manual testing with Stripe test mode
  - [ ] Test rollback procedures
  - [ ] Create monitoring dashboard
  - [ ] Set up alerts

- **Afternoon** (2 hours):
  - [ ] Deploy to production
  - [ ] Monitor webhook processing for 2 hours
  - [ ] Verify metrics meet targets
  - [ ] Document any issues
  - [ ] Update production readiness status

**Total Time**: 2.5 days (20 hours)

---

## 🎯 Acceptance Criteria

### Must Have (Before Production)
- [ ] `webhook_events` table exists with unique constraint
- [ ] Idempotency check prevents duplicate processing (100% success rate)
- [ ] Transaction function wraps all database updates
- [ ] All 37 unit tests pass
- [ ] All 8 integration tests pass
- [ ] Load test handles 1000 concurrent webhooks
- [ ] Rollback procedure tested and documented
- [ ] Monitoring dashboard shows all green metrics
- [ ] Zero data inconsistencies after test runs

### Should Have (Before Production)
- [ ] Alerts configured for failures
- [ ] Performance monitoring in place
- [ ] Documentation updated
- [ ] Team briefed on new system
- [ ] Runbook created for common issues

### Nice to Have (Post-Launch)
- [ ] Webhook event retention policy (auto-delete old events)
- [ ] Advanced analytics on webhook patterns
- [ ] Automated data consistency checks
- [ ] Self-healing mechanisms for detected issues

---

## 📞 Support & Escalation

### Common Issues & Solutions

**Issue**: Webhook shows "duplicate" but wasn't actually duplicate
**Diagnosis**: Check `webhook_events.processed_at` timestamp
**Solution**: Verify event ID is truly unique, check Stripe logs
**Escalation**: If false positives >1%, disable idempotency temporarily

**Issue**: Transaction failures increasing
**Diagnosis**: Check database connection pool, RLS policies
**Solution**: Increase connection limits, review RLS policies
**Escalation**: If failures >5%, rollback edge function

**Issue**: Webhook processing slower after implementation
**Diagnosis**: Check event recording query performance
**Solution**: Verify indexes exist, optimize queries
**Escalation**: If p95 >5s, consider async event recording

**Issue**: Data inconsistency detected post-deployment
**Diagnosis**: Run consistency check query (see Monitoring Dashboard)
**Solution**: Identify affected users, manual correction if needed
**Escalation**: If >10 users affected, investigate transaction function

---

## 📝 Documentation Updates Required

### Files to Update After Implementation
- [ ] `/apps/dashboard/PAYMENT_SYSTEM_PRODUCTION_READINESS.md`
  - Update Phase 1 Task 1.1 status to COMPLETE
  - Update progress tracking
  - Add lessons learned

- [ ] `/apps/dashboard/STRIPE_WEBHOOK_SETUP_GUIDE.md`
  - Document new `webhook_events` table
  - Explain idempotency behavior
  - Update troubleshooting guide

- [ ] `/apps/dashboard/supabase/functions/stripe-webhook/README.md` (create new)
  - Explain idempotency strategy
  - Document transaction function
  - Provide debugging guide

- [ ] `/apps/dashboard/DATABASE_SCHEMA.md`
  - Add `webhook_events` table documentation
  - Document `update_user_tier_transactional` function

---

## ✅ Final Checklist

**Before Deployment**:
- [ ] All migrations tested locally
- [ ] All unit tests passing (37/37)
- [ ] All integration tests passing (8/8)
- [ ] Load tests show acceptable performance
- [ ] Rollback procedure tested
- [ ] Monitoring dashboard ready
- [ ] Alerts configured
- [ ] Team briefed
- [ ] Documentation updated

**During Deployment**:
- [ ] Apply database migrations
- [ ] Deploy edge function
- [ ] Verify deployment successful
- [ ] Monitor first 10 webhooks closely
- [ ] Check metrics dashboard
- [ ] Verify no errors in logs

**After Deployment**:
- [ ] Monitor for 24 hours
- [ ] Verify zero data inconsistencies
- [ ] Confirm duplicate events prevented
- [ ] Check performance metrics
- [ ] Collect feedback from monitoring
- [ ] Update documentation with learnings

---

**Document Version**: 1.0
**Author**: Production Readiness Review
**Status**: Ready for Implementation
**Next Review**: After Phase 1 completion
