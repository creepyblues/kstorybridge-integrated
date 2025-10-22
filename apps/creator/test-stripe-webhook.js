#!/usr/bin/env node

/**
 * Test Script for Stripe Webhook Integration
 *
 * This script helps test the Stripe webhook locally using the Stripe CLI
 * Run this to verify the webhook is receiving and processing events correctly.
 *
 * Prerequisites:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Login to Stripe CLI: stripe login
 * 3. Have the webhook secret set in Supabase edge function secrets
 */

console.log(`
🚀 Stripe Webhook Test Instructions
=====================================

1. **Start the Stripe CLI webhook forwarding:**
   stripe listen --forward-to https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook

2. **Test a checkout session completion:**
   stripe trigger checkout.session.completed

3. **Test subscription events:**
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted
   stripe trigger invoice.payment_succeeded

4. **Monitor the webhook logs:**
   - Check Supabase function logs: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
   - Check browser console on payment success page
   - Look for the enhanced logging we added

5. **Expected Flow:**
   ✅ Checkout session completed
   ✅ Stripe customer record updated in database
   ✅ User tier updated to 'pro'
   ✅ Tier access hook validates subscription
   ✅ Payment success page shows Pro tier

6. **Debug Commands:**
   # View recent webhook events
   stripe events list --limit 10

   # View specific event details
   stripe events retrieve evt_XXXXXXXXXX

7. **What to check if tier update fails:**
   - Webhook secret is correctly set in Supabase
   - User metadata contains correct user_id
   - stripe_customers table gets updated
   - user_buyers table tier gets updated
   - useTierAccess hook validation logic

📊 Database Queries to Check Status:
=====================================

-- Check user tier
SELECT id, email, tier FROM user_buyers WHERE email = 'your-test-email@example.com';

-- Check Stripe customer record
SELECT * FROM stripe_customers WHERE user_id = 'your-user-id';

-- Check recent webhook activity (if you have logging)
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

🐛 Common Issues:
=================
- Webhook secret mismatch
- User not found in user_buyers table
- Subscription status not 'active'
- Date parsing issues with current_period_end
- Tier access hook downgrading immediately

💡 Pro Tips:
============
- Use test mode Stripe keys during development
- Monitor both Stripe dashboard and Supabase logs
- Check browser network tab for any failed requests
- Verify environment variables are set correctly
`);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  process.exit(0);
}

if (process.argv.includes('--webhook-url')) {
  console.log('🔗 Webhook URL: https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/stripe-webhook');
  process.exit(0);
}

if (process.argv.includes('--dashboard-url')) {
  console.log('📊 Supabase Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions');
  process.exit(0);
}

console.log('\nRun with --help for full instructions or --webhook-url to get the webhook URL.\n');