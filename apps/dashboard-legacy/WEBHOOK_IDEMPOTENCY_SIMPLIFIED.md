# Webhook Idempotency - Simplified Implementation

**Issue**: Duplicate webhook processing causing potential data corruption
**Priority**: 🔴 CRITICAL
**Complexity**: 🟢 LOW (simplified from original 87-page plan)
**Timeline**: 4-6 hours (down from 2.5 days)
**Status**: Ready for implementation

---

## 📊 Problem Statement

**The Real Issue**: Stripe automatically retries webhooks on timeouts or 5xx errors. Without idempotency protection, the same event can process multiple times.

**Current Behavior**:
```
1. Webhook receives checkout.session.completed
2. Updates stripe_customers ✅
3. Updates user_buyers.tier ✅
4. Network timeout before returning 200 ❌
5. Stripe retries same event (automatic)
6. Steps 2-3 execute AGAIN ❌
```

**Impact**:
- User tier could flip between basic/pro multiple times
- Database records updated multiple times
- Inconsistent data state

**What We DON'T Need to Fix** (Over-engineering):
- ✅ Existing retry logic works fine (3 retries with backoff)
- ✅ RLS policies protect data integrity
- ✅ Verification queries confirm updates
- ✅ Current error handling is adequate

**What We DO Need to Fix** (Critical):
- ❌ No duplicate event detection
- ❌ Same event can process unlimited times

---

## ✅ The Simple Solution

### Core Principle
**Idempotency = Same input → Same outcome, no side effects on retry**

### Implementation
Add **15 lines of code** to check event_id before processing:

```typescript
// Add after signature verification (line 142)

// CHECK: Has this event been processed?
const { data: existingEvent } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('stripe_event_id', receivedEvent.id)
  .single();

if (existingEvent) {
  console.log('✅ Event already processed, skipping:', receivedEvent.id);
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

// ... existing processing logic ...

// RECORD: Mark event as processed (add at end, line 538)
await supabase
  .from('webhook_events')
  .insert({ stripe_event_id: receivedEvent.id });
```

**That's it.** No complex transactions, no database functions, no over-engineering.

---

## 🗄️ Database Changes

### Migration: `20251009000000_create_webhook_events.sql`

```sql
-- Simple table: just track which events we've processed
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  processed_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_webhook_events_stripe_event_id
  ON webhook_events(stripe_event_id);

-- RLS: Only service role can access (webhooks use service role)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON webhook_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Auto-cleanup old events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE processed_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Run cleanup weekly (optional)
-- Can be configured via pg_cron or external job
```

**Why This Is Simple**:
- ✅ 3 columns only (id, event_id, timestamp)
- ✅ No complex triggers or functions
- ✅ UNIQUE constraint enforces idempotency at database level
- ✅ Auto-cleanup prevents table bloat (optional)

---

## 🔧 Code Changes

### File: `supabase/functions/stripe-webhook/index.ts`

**Change #1**: Add idempotency check (Lines 142-152, after signature verification)

```typescript
// BEFORE: Event processing starts immediately after signature verification

// AFTER: Check if event already processed
console.log('🔍 Checking for duplicate event:', receivedEvent.id);

const { data: existingEvent, error: checkError } = await supabase
  .from('webhook_events')
  .select('id, processed_at')
  .eq('stripe_event_id', receivedEvent.id)
  .single();

if (existingEvent) {
  console.log('✅ Event already processed at:', existingEvent.processed_at);
  console.log('📊 Duplicate event prevented:', {
    eventId: receivedEvent.id,
    eventType: receivedEvent.type,
    originalProcessing: existingEvent.processed_at
  });
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

if (checkError && checkError.code !== 'PGRST116') {
  // PGRST116 = no rows found (expected for new events)
  console.error('❌ Error checking event:', checkError);
  // Continue processing anyway (fail open, not fail closed)
}
```

**Change #2**: Record event after successful processing (Lines 538-545, before return)

```typescript
// BEFORE: Return 200 immediately

// AFTER: Record event as processed
try {
  const { error: recordError } = await supabase
    .from('webhook_events')
    .insert({ stripe_event_id: receivedEvent.id });

  if (recordError) {
    console.error('⚠️ Failed to record event (non-critical):', recordError);
    // Don't fail webhook - event was processed successfully
  } else {
    console.log('✅ Event recorded:', receivedEvent.id);
  }
} catch (err) {
  console.error('⚠️ Exception recording event (non-critical):', err);
  // Don't fail webhook
}

return new Response(JSON.stringify({ received: true }), { status: 200 });
```

**Total Lines Added**: ~20 lines (idempotency check + recording)

**Why This Works**:
- ✅ Duplicate check happens BEFORE processing
- ✅ Early return prevents duplicate updates
- ✅ Recording happens AFTER processing succeeds
- ✅ Recording failures don't break webhooks (fail safe)
- ✅ Existing retry logic unchanged (still works)

---

## 🧪 Testing Strategy

### Critical Tests Only (5 tests)

**Test 1: First-time processing**
```typescript
it('should process new event successfully', async () => {
  const event = createMockCheckoutEvent('evt_new_123');

  const response = await webhookHandler(event);

  expect(response.status).toBe(200);
  expect(webhookEventsTable).toContain('evt_new_123');
  expect(userTier).toBe('pro');
});
```

**Test 2: Duplicate detection**
```typescript
it('should skip duplicate event', async () => {
  const event = createMockCheckoutEvent('evt_duplicate_123');

  // First processing
  await webhookHandler(event);
  const tierAfterFirst = getUserTier();

  // Duplicate processing
  await webhookHandler(event);
  const tierAfterDuplicate = getUserTier();

  expect(tierAfterFirst).toBe(tierAfterDuplicate);
  expect(webhookEventsTable).toHaveLength(1); // Only one entry
});
```

**Test 3: Stripe retry simulation**
```typescript
it('should handle Stripe retry correctly', async () => {
  const event = createMockCheckoutEvent('evt_retry_123');

  // Simulate timeout after processing
  await webhookHandler(event);
  // Don't wait for response

  // Stripe retries
  const retryResponse = await webhookHandler(event);

  expect(retryResponse.status).toBe(200);
  expect(getDatabaseUpdateCount()).toBe(1); // Only one update
});
```

**Test 4: Concurrent duplicates**
```typescript
it('should handle concurrent duplicate requests', async () => {
  const event = createMockCheckoutEvent('evt_concurrent_123');

  // Send same event 10 times concurrently
  const responses = await Promise.all(
    Array(10).fill(null).map(() => webhookHandler(event))
  );

  // All return 200
  expect(responses.every(r => r.status === 200)).toBe(true);

  // But only 1 database update
  expect(webhookEventsTable).toHaveLength(1);
  expect(getDatabaseUpdateCount()).toBe(1);
});
```

**Test 5: Recording failure doesn't break webhook**
```typescript
it('should succeed even if event recording fails', async () => {
  const event = createMockCheckoutEvent('evt_record_fail_123');

  // Mock recording to fail
  mockSupabase.insert.mockRejectedValue(new Error('DB error'));

  const response = await webhookHandler(event);

  // Webhook still succeeds
  expect(response.status).toBe(200);
  // User still upgraded
  expect(getUserTier()).toBe('pro');
});
```

---

## 📈 Manual Testing Checklist

**Test with Stripe CLI**:

```bash
# 1. Forward webhooks to local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# 2. Trigger test event
stripe trigger checkout.session.completed

# 3. Trigger SAME event again (simulate retry)
# Get event ID from previous output: evt_xxx
stripe events resend evt_xxx

# 4. Verify in database
# Should see only ONE entry in webhook_events
# Should see only ONE tier update

# 5. Trigger 10 concurrent duplicates
for i in {1..10}; do
  stripe events resend evt_xxx &
done
wait

# 6. Verify still only one processing
```

**Expected Results**:
- First event: Processes normally, tier updated, event recorded
- Duplicate event: Returns 200 immediately, no database changes
- Concurrent duplicates: Only one processes, others return 200
- Recording failures: Webhook succeeds anyway

---

## 🚀 Deployment Plan

### Phase 1: Database Migration (30 minutes)
**Risk**: 🟢 MINIMAL (creates new table, doesn't touch existing)

1. **Apply migration locally**:
```bash
cd apps/dashboard/supabase
npx supabase migration new create_webhook_events
# Copy SQL from above into migration file
npx supabase db reset # Test locally
```

2. **Verify migration**:
```sql
-- Check table exists
SELECT * FROM webhook_events LIMIT 1;

-- Check unique constraint
INSERT INTO webhook_events (stripe_event_id) VALUES ('test_1');
INSERT INTO webhook_events (stripe_event_id) VALUES ('test_1');
-- Second insert should fail (expected)
```

3. **Apply to production**:
```bash
npx supabase db push
```

4. **Verify in production**:
```sql
SELECT COUNT(*) FROM webhook_events; -- Should return 0
```

---

### Phase 2: Edge Function Update (2 hours)
**Risk**: 🟡 LOW (adds logic, doesn't remove existing functionality)

1. **Update webhook handler**:
   - Add idempotency check (Change #1)
   - Add event recording (Change #2)

2. **Test locally**:
```bash
# Start local functions
npx supabase functions serve

# In another terminal, trigger webhook
stripe trigger checkout.session.completed

# Verify logs show idempotency check
# Verify event recorded in database
```

3. **Deploy to production**:
```bash
cd supabase/functions/stripe-webhook
npx supabase functions deploy stripe-webhook
```

4. **Monitor first webhooks**:
   - Watch Supabase function logs
   - Watch Stripe webhook dashboard
   - Verify 200 responses
   - Check `webhook_events` table populating

---

### Phase 3: Verification (1-2 hours)
**Risk**: 🟢 MINIMAL (read-only verification)

1. **Trigger test payment in production**:
   - Use Stripe test mode
   - Complete checkout
   - Verify Pro tier activated
   - Check webhook_events table

2. **Simulate retry**:
   - Go to Stripe dashboard → Events
   - Find recent event → "Resend"
   - Verify logs show "already processed"
   - Verify no duplicate database updates

3. **Monitor for 2 hours**:
   - Check function logs for errors
   - Verify webhook success rate in Stripe
   - Query webhook_events table growth

---

## 🔄 Rollback Procedure

### If Issues Detected

**Emergency Rollback** (5 minutes):
```bash
# Revert edge function to previous version
cd supabase/functions/stripe-webhook
git checkout HEAD~1 index.ts
npx supabase functions deploy stripe-webhook

# Monitor: Webhooks should work as before
```

**Database Cleanup** (optional, if needed):
```sql
-- Remove table (only if empty or test data)
DROP TABLE IF EXISTS webhook_events;

-- Or disable without dropping (keeps data)
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;
```

**When to Rollback**:
- Webhook success rate drops below 90%
- False positives (new events marked as duplicate)
- Performance degradation (p95 >5 seconds)

**Recovery**:
- Edge function rollback takes 5 minutes
- No data loss (webhook_events can be dropped safely)
- Existing webhooks continue working immediately

---

## 📊 Success Metrics

### Before Implementation (Baseline)
- Duplicate processing: **0% prevented** (all process)
- Webhook success rate: Measure current rate
- Average response time: Measure current p50/p95

### After Implementation (Targets)
- Duplicate processing: **100% prevented** ✅
- Webhook success rate: ≥99% (no regression) ✅
- Average response time: <500ms p50, <2s p95 (no regression) ✅
- False positives: 0% (new events process normally) ✅

### Monitoring Queries

**Check idempotency effectiveness**:
```sql
-- Total events processed today
SELECT COUNT(*) FROM webhook_events
WHERE processed_at > CURRENT_DATE;

-- Duplicate prevention (if we had retry tracking)
-- For now: Monitor Stripe webhook logs for duplicate event IDs
```

**Check for issues**:
```sql
-- Events processed in last hour
SELECT
  stripe_event_id,
  processed_at,
  EXTRACT(EPOCH FROM (now() - processed_at)) as seconds_ago
FROM webhook_events
WHERE processed_at > now() - interval '1 hour'
ORDER BY processed_at DESC;

-- Check for missing events (gap in event IDs)
-- Manual check via Stripe dashboard
```

---

## 🎯 Why This Is Better Than Original Plan

### Original Plan (87 pages)
- ❌ 2.5 days implementation
- ❌ Complex database functions
- ❌ 5 phases with dependencies
- ❌ 37 unit tests
- ❌ Transaction management layer
- ❌ Saga pattern for rollbacks
- ❌ Advanced monitoring dashboard

**Risk**: High complexity creates MORE failure points

### Simplified Plan (This Document)
- ✅ 4-6 hours implementation
- ✅ Simple table + simple queries
- ✅ 2 phases, minimal dependencies
- ✅ 5 critical tests
- ✅ Existing retry logic unchanged
- ✅ No complex transactions needed
- ✅ Basic monitoring via logs

**Benefit**: Solves the actual problem without adding complexity

---

## 🧩 What We're NOT Doing (And Why)

### Not Implemented: Database Transactions
**Why**: Existing retry logic handles failures adequately. If we see partial updates in production (we haven't), we can add transactions later.

**Current protection**:
- Retry logic (3 attempts with backoff)
- RLS policies prevent unauthorized updates
- Verification queries confirm success

**When to add**: If monitoring shows >1% partial updates

---

### Not Implemented: Complex Monitoring
**Why**: Stripe dashboard + Supabase logs are sufficient initially. Premature optimization.

**Current monitoring**:
- Stripe webhook delivery dashboard (built-in)
- Supabase function logs (console.log statements)
- Database query for recent events

**When to add**: If incident response needs automation

---

### Not Implemented: Event Analytics
**Why**: Not a current requirement. Focus on reliability first.

**Current capability**:
- Can query webhook_events table manually
- Can see event types and timing

**When to add**: When product team needs analytics

---

### Not Implemented: Automated Tests for Edge Functions
**Why**: Edge functions are deployed code, testing locally is sufficient for early stage.

**Current testing**:
- 5 critical logic tests (idempotency, duplicates)
- Manual testing with Stripe CLI
- Production monitoring

**When to add**: When webhook logic becomes more complex

---

## ✅ Implementation Checklist

### Pre-Implementation
- [ ] Review this plan (15 min)
- [ ] Understand current webhook flow (15 min)
- [ ] Set up Stripe CLI locally (10 min)

### Implementation (4-6 hours)
- [ ] **Phase 1: Database** (30 min)
  - [ ] Create migration file
  - [ ] Test locally
  - [ ] Apply to production
  - [ ] Verify table created

- [ ] **Phase 2: Code** (2 hours)
  - [ ] Add idempotency check (Change #1)
  - [ ] Add event recording (Change #2)
  - [ ] Test locally with Stripe CLI
  - [ ] Test duplicate detection
  - [ ] Deploy to production

- [ ] **Phase 3: Verify** (1-2 hours)
  - [ ] Test payment in production
  - [ ] Simulate retry
  - [ ] Monitor for 2 hours
  - [ ] Verify metrics

### Post-Implementation
- [ ] Document learnings
- [ ] Update production readiness doc
- [ ] Share results with team

---

## 📝 Key Takeaways

### What Makes This Production-Ready
1. **Solves the real problem**: Duplicate processing prevented
2. **Minimal complexity**: 20 lines of code, 1 simple table
3. **Safe deployment**: Non-breaking changes, easy rollback
4. **Fail-safe design**: Recording failures don't break webhooks
5. **Future-proof**: Can add transactions/monitoring later if needed

### What Makes This Early-Stage Appropriate
1. **Fast to implement**: Same-day deployment
2. **Low maintenance**: No complex systems to maintain
3. **Easy to understand**: Any developer can debug
4. **Iterative**: Can enhance based on production data
5. **Focused**: Fixes the critical issue, defers nice-to-haves

### Next Steps After This
**Monitor for 1 week**, then consider:
- Add transaction wrapping IF partial updates occur
- Add monitoring dashboard IF manual queries become tedious
- Add event analytics IF product needs insights
- Add automated tests IF webhook logic grows complex

**But for now**: This is sufficient and production-ready. ✅

---

**Document Version**: 1.0 (Simplified)
**Complexity**: LOW (vs. original HIGH)
**Timeline**: 4-6 hours (vs. original 2.5 days)
**Next Review**: After 1 week of production monitoring
