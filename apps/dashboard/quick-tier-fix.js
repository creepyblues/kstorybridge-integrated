#!/usr/bin/env node

/**
 * Quick Tier Fix - Direct Database Update
 * Uses standard PostgreSQL client to update tier directly
 */

console.log('🔧 Quick Tier Fix Script');
console.log('========================');

const userId = 'a39c89a1-425f-4796-906c-a0c0723fa449';
const userEmail = 'sunghol@cultureflipper.com';

console.log(`User ID: ${userId}`);
console.log(`Email: ${userEmail}`);
console.log('');

console.log('📋 Manual Update Instructions:');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd');
console.log('2. Navigate to SQL Editor');
console.log('3. Run the following SQL commands:');
console.log('');

console.log('--- SQL COMMANDS START ---');
console.log(`
-- Step 1: Check current user status
SELECT 'BEFORE UPDATE' as status, id, email, tier, created_at
FROM user_buyers
WHERE id = '${userId}';

-- Step 2: Update user tier to Pro
UPDATE user_buyers
SET tier = 'pro'
WHERE id = '${userId}';

-- Step 3: Update stripe_customers record
UPDATE stripe_customers
SET
    subscription_status = 'active',
    current_period_end = (NOW() + INTERVAL '30 days'),
    cancel_at_period_end = false,
    updated_at = NOW()
WHERE user_id = '${userId}';

-- Step 4: Verify the updates
SELECT 'AFTER UPDATE' as status,
       ub.id, ub.email, ub.tier,
       sc.subscription_status, sc.current_period_end
FROM user_buyers ub
LEFT JOIN stripe_customers sc ON ub.id = sc.user_id
WHERE ub.id = '${userId}';
`);
console.log('--- SQL COMMANDS END ---');
console.log('');

console.log('🎯 Expected Results:');
console.log('- user_buyers.tier should be "pro"');
console.log('- stripe_customers.subscription_status should be "active"');
console.log('- current_period_end should be ~30 days from now');
console.log('');

console.log('🔄 After running SQL commands:');
console.log('1. Refresh the payment success page');
console.log('2. Check if Pro tier is now showing');
console.log('3. Test Pro features access');

// Alternative: Try a simple direct update using environment variables
const altApproach = `
Alternative approach using environment variables:

1. Set the service role key:
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

2. Run the Node.js script with proper imports installed:
npm install @supabase/supabase-js
node manual-tier-fix.js

3. Or use psql if you have database credentials:
psql "postgresql://postgres:[password]@db.dlrnrgcoguxlkkcitlpd.supabase.co:5432/postgres" -f manual-tier-fix.sql
`;

console.log('📝 Alternative Approaches:');
console.log(altApproach);