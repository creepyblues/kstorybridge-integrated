# Webhook Idempotency - Deployment Guide

**Status**: ✅ Implementation Complete - Ready for Production Deployment
**Date**: 2025-10-09
**Estimated Time**: 30-45 minutes

---

## 📋 Pre-Deployment Checklist

- ✅ Database migration created: `20251009000000_create_webhook_events.sql`
- ✅ Webhook handler updated with idempotency check
- ✅ Event recording logic added
- ✅ Unit tests created and passing (7/7 tests)
- ⏳ Database migration needs deployment
- ⏳ Edge function needs deployment

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration (10 minutes)

The migration creates the `webhook_events` table for tracking processed events.

**Option A: Using Supabase CLI**
```bash
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard

# Push migration to production
npx supabase db push

# When prompted, enter your Supabase database password
# (Available in Supabase Dashboard → Settings → Database)
```

**Option B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/editor
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20251009000000_create_webhook_events.sql`
5. Paste and click "Run"

**Verify Migration**:
```sql
-- Check table exists
SELECT * FROM webhook_events LIMIT 1;

-- Check unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'webhook_events';

-- Should see UNIQUE constraint on stripe_event_id
```

---

### Step 2: Deploy Edge Function (15 minutes)

Deploy the updated webhook handler with idempotency protection.

**Deploy Command**:
```bash
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard

# Deploy the updated webhook function
npx supabase functions deploy stripe-webhook

# This will deploy the edge function with:
# - Idempotency check (lines 143-171)
# - Event recording (lines 570-595)
```

**Verify Deployment**:
1. Go to https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
2. Find `stripe-webhook` function
3. Check deployment timestamp (should be recent)
4. Click "Logs" to verify function is running

---

### Step 3: Test with Stripe CLI (15 minutes)

Test the idempotency protection with real webhook events.

**Setup Stripe CLI**:
```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to production function
stripe listen --forward-to https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook
```

**Test Scenarios**:

**Scenario 1: New Event (Should Process)**
```bash
# Trigger a test checkout event
stripe trigger checkout.session.completed

# Expected in logs:
# ✅ "Event recorded successfully"
# ✅ Check webhook_events table - should have 1 entry
```

**Scenario 2: Duplicate Event (Should Skip)**
```bash
# Get the event ID from previous test (e.g., evt_xxx)
# Resend the same event
stripe events resend evt_xxx

# Expected in logs:
# ✅ "Event already processed at: [timestamp]"
# ✅ "Duplicate event prevented"
# ✅ Check webhook_events table - still only 1 entry
```

**Scenario 3: Concurrent Duplicates (Should Handle)**
```bash
# Send same event 10 times concurrently
for i in {1..10}; do
  stripe events resend evt_xxx &
done
wait

# Expected in logs:
# ✅ Multiple "Event already processed" messages
# ✅ All return 200 OK
# ✅ Check webhook_events table - still only 1 entry
```

---

### Step 4: Verify in Production (5-10 minutes)

**Database Verification**:
```sql
-- Check webhook_events table
SELECT COUNT(*) FROM webhook_events;
-- Should show events being recorded

-- Check recent events
SELECT
  stripe_event_id,
  processed_at,
  EXTRACT(EPOCH FROM (now() - processed_at)) as seconds_ago
FROM webhook_events
ORDER BY processed_at DESC
LIMIT 10;
```

**Stripe Dashboard Verification**:
1. Go to https://dashboard.stripe.com/webhooks
2. Find your webhook endpoint
3. Check recent events
4. Verify all show "Success" status (200 response)

**Supabase Function Logs**:
1. Go to https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
2. Click on `stripe-webhook`
3. Click "Logs"
4. Look for:
   - ✅ "🔍 Checking for duplicate event"
   - ✅ "📝 Recording successfully processed event"
   - ✅ "✅ Event recorded successfully"

---

## 🔍 Monitoring Checklist

After deployment, monitor these metrics for 24-48 hours:

**Webhook Success Rate**:
- [ ] Check Stripe Dashboard → Webhooks
- [ ] Success rate should be ≥99%
- [ ] No increase in failed webhooks

**Idempotency Protection**:
- [ ] Check Supabase logs for "Duplicate event prevented" messages
- [ ] Verify only ONE database entry per unique event_id
- [ ] Confirm duplicate webhooks return 200 immediately

**Performance**:
- [ ] Check average response time in Supabase logs
- [ ] Should be <500ms for new events
- [ ] Should be <100ms for duplicate events

**Database Growth**:
```sql
-- Check webhook_events table size
SELECT
  COUNT(*) as total_events,
  COUNT(DISTINCT stripe_event_id) as unique_events,
  MAX(processed_at) as latest_event,
  MIN(processed_at) as earliest_event
FROM webhook_events;

-- Should see: total_events = unique_events (no duplicates)
```

---

## ⚠️ Troubleshooting

### Issue: Migration Fails with "table already exists"

**Solution**: Table may have been created manually. Verify it has the correct structure:
```sql
-- Check table structure
\d webhook_events

-- Should have:
-- - id (uuid, primary key)
-- - stripe_event_id (text, unique)
-- - processed_at (timestamptz)
-- - created_at (timestamptz)
```

If structure is correct, mark migration as applied:
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20251009000000', 'create_webhook_events');
```

---

### Issue: Edge Function Deployment Fails

**Solution**: Check Supabase service role key:
```bash
# Verify secret is set
npx supabase secrets list

# Should see STRIPE_WEBHOOK_SECRET
# If missing, set it:
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### Issue: Duplicate Events Still Processing

**Symptoms**: Multiple database updates for same event_id

**Debugging Steps**:
1. Check Supabase function logs for idempotency check messages
2. Verify webhook_events table has UNIQUE constraint:
   ```sql
   SELECT constraint_name
   FROM information_schema.table_constraints
   WHERE table_name = 'webhook_events'
   AND constraint_type = 'UNIQUE';
   ```
3. Check for errors during event recording:
   - Look for "⚠️ Failed to record event" in logs
   - If recording fails consistently, check RLS policies

**Fix**: Ensure RLS policy allows service role to insert:
```sql
-- Verify policy exists
SELECT * FROM pg_policies
WHERE tablename = 'webhook_events';

-- Should see "Service role full access on webhook_events"
```

---

### Issue: False Positives (New Events Marked as Duplicate)

**Symptoms**: Legitimate new events returning "already processed"

**Debugging Steps**:
1. Check webhook_events table for unexpected entries
2. Verify event IDs in Stripe Dashboard match database entries
3. Check for clock skew or timestamp issues

**Fix**: If false positives occur, check event processing timing:
```sql
-- Find events processed multiple times
SELECT stripe_event_id, COUNT(*) as count
FROM webhook_events
GROUP BY stripe_event_id
HAVING COUNT(*) > 1;
```

---

## 🔄 Rollback Procedure

**If Issues Are Detected**:

### Rollback Edge Function (5 minutes)
```bash
# Revert to previous version
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard/supabase/functions/stripe-webhook

# Get previous commit
git log --oneline index.ts

# Checkout previous version
git checkout <commit-hash> index.ts

# Redeploy
npx supabase functions deploy stripe-webhook

# Verify webhooks work as before
```

### Disable Idempotency Check (Without Full Rollback)
If you want to keep the code but disable idempotency temporarily:

**Option**: Comment out idempotency check in `index.ts`:
```typescript
// Comment out lines 143-171 (idempotency check)
// Comment out lines 570-595 (event recording)
```

Then redeploy:
```bash
npx supabase functions deploy stripe-webhook
```

### Remove Database Table (Optional)
```sql
-- Only if rolling back completely
DROP TABLE IF EXISTS webhook_events CASCADE;
```

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ **Migration Applied**: `webhook_events` table exists in production
2. ✅ **Edge Function Deployed**: Latest version shows in Supabase dashboard
3. ✅ **Idempotency Working**:
   - New events process normally
   - Duplicate events return 200 immediately
   - Only one database entry per event_id
4. ✅ **No Regressions**:
   - Webhook success rate ≥99%
   - No increase in failed webhooks
   - User tier updates work correctly
5. ✅ **Monitoring Active**:
   - Can query webhook_events table
   - Logs show idempotency messages
   - Stripe dashboard shows successful webhooks

---

## 📊 Post-Deployment Metrics

**After 24 Hours**:
```sql
-- Events processed in last 24 hours
SELECT COUNT(*) FROM webhook_events
WHERE processed_at > NOW() - INTERVAL '24 hours';

-- Check for any duplicates (should be 0)
SELECT stripe_event_id, COUNT(*) as count
FROM webhook_events
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY stripe_event_id
HAVING COUNT(*) > 1;

-- Average events per hour
SELECT
  DATE_TRUNC('hour', processed_at) as hour,
  COUNT(*) as events
FROM webhook_events
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**After 1 Week**:
- [ ] Review Stripe webhook delivery rate
- [ ] Check for any duplicate processing incidents
- [ ] Verify table growth is expected (1 row per webhook)
- [ ] Consider enabling cleanup function if table size is growing too large

---

## 🎯 Next Steps After Deployment

**Immediate (Day 1)**:
- Monitor Supabase function logs for errors
- Check Stripe webhook dashboard for success rate
- Verify first few production webhooks process correctly

**Short-term (Week 1)**:
- Review webhook_events table growth
- Confirm no duplicate processing incidents
- Document any learnings or issues

**Long-term (After 1 Month)**:
- Consider implementing cleanup function if needed:
  ```sql
  -- Run monthly to keep last 90 days
  SELECT cleanup_old_webhook_events();
  ```
- Evaluate need for additional monitoring/alerts
- Review and update documentation based on production experience

---

## 📝 Deployment Log Template

Use this template to track your deployment:

```
Webhook Idempotency Deployment Log
Date: ___________
Deployed By: ___________

[ ] Step 1: Database migration applied
    Time: _________
    Method: CLI / Dashboard
    Notes: _________

[ ] Step 2: Edge function deployed
    Time: _________
    Deployment ID: _________
    Notes: _________

[ ] Step 3: Testing completed
    Time: _________
    Test scenarios passed: ___/3
    Notes: _________

[ ] Step 4: Production verification
    Time: _________
    Webhook success rate: ____%
    Events processed: _____
    Notes: _________

Issues Encountered: _________
Resolution: _________
Rollback Required: Yes / No
Sign-off: _________
```

---

## 📚 Related Documentation

- **Implementation Plan**: `WEBHOOK_IDEMPOTENCY_SIMPLIFIED.md`
- **Production Readiness**: `PAYMENT_SYSTEM_PRODUCTION_READINESS.md`
- **Unit Tests**: `src/__tests__/webhooks/idempotency.test.ts`
- **Migration File**: `supabase/migrations/20251009000000_create_webhook_events.sql`
- **Webhook Handler**: `supabase/functions/stripe-webhook/index.ts`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Ready for Deployment
