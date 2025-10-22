#!/usr/bin/env node

/**
 * Webhook Signature Debug Test Instructions
 * Provides comprehensive testing approach to debug 401 webhook errors
 */

console.log('🧪 Webhook Signature Debug Test Guide');
console.log('=====================================');
console.log('');

console.log('✅ COMPLETED: Enhanced Webhook Logging Deployed');
console.log('===============================================');
console.log('The webhook function now has comprehensive debugging that will show:');
console.log('- Incoming request details (headers, body, signature)');
console.log('- Webhook secret availability and format');
console.log('- Step-by-step signature verification process');
console.log('- Detailed error information if verification fails');
console.log('');

console.log('🧪 TESTING METHODS:');
console.log('==================');
console.log('');

console.log('Method 1: Trigger New Payment (RECOMMENDED)');
console.log('-------------------------------------------');
console.log('1. Go to your app upgrade button');
console.log('2. Complete a new test payment');
console.log('3. This will trigger a real webhook event');
console.log('4. Check Supabase function logs immediately after');
console.log('');

console.log('Method 2: Use Stripe CLI (Alternative)');
console.log('--------------------------------------');
console.log('1. Install Stripe CLI if not already installed:');
console.log('   brew install stripe/stripe-cli/stripe');
console.log('');
console.log('2. Login to Stripe CLI:');
console.log('   stripe login');
console.log('');
console.log('3. Test webhook delivery:');
console.log('   stripe trigger checkout.session.completed');
console.log('');
console.log('4. Check the webhook logs in Stripe dashboard and Supabase');
console.log('');

console.log('Method 3: Check Recent Webhook Events');
console.log('------------------------------------');
console.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks');
console.log('2. Click on your webhook endpoint');
console.log('3. Look at recent events and their delivery status');
console.log('4. Click on failed events to see error details');
console.log('');

console.log('📊 WHERE TO CHECK LOGS:');
console.log('=======================');
console.log('');

console.log('Supabase Function Logs:');
console.log('- URL: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions');
console.log('- Click on "stripe-webhook" function');
console.log('- Check "Logs" tab for detailed output');
console.log('');

console.log('Stripe Dashboard Logs:');
console.log('- URL: https://dashboard.stripe.com/webhooks');
console.log('- Click on your webhook');
console.log('- Check "Event deliveries" for status codes');
console.log('');

console.log('🔍 WHAT TO LOOK FOR IN LOGS:');
console.log('============================');
console.log('');

console.log('✅ SUCCESSFUL WEBHOOK LOGS SHOULD SHOW:');
console.log('- "📨 Webhook received - DETAILED DEBUG" with all request info');
console.log('- "⏳ Attempting signature verification" with secret format check');
console.log('- "✅ SIGNATURE VERIFICATION SUCCESSFUL" with event details');
console.log('- Subsequent processing of the event (tier updates, etc.)');
console.log('');

console.log('❌ FAILED WEBHOOK LOGS WILL SHOW:');
console.log('- "❌ AUTHENTICATION FAILURE: No Stripe signature header" (missing signature)');
console.log('- "❌ AUTHENTICATION FAILURE: No webhook secret configured" (secret not set)');
console.log('- "❌ SIGNATURE VERIFICATION FAILED" with detailed error info');
console.log('');

console.log('🎯 SPECIFIC DEBUG INFO TO CHECK:');
console.log('=================================');
console.log('');

console.log('1. Webhook Secret Check:');
console.log('   - hasWebhookSecret: should be true');
console.log('   - secretFormat: should start with "whsec_"');
console.log('   - secretLength: should be ~64 characters');
console.log('');

console.log('2. Signature Check:');
console.log('   - hasSignature: should be true');
console.log('   - signatureFormat: should contain timestamp and signature parts');
console.log('');

console.log('3. Request Format Check:');
console.log('   - method: should be "POST"');
console.log('   - content-type: should be "application/json"');
console.log('   - bodyLength: should be > 0');
console.log('');

console.log('🚨 COMMON ISSUES TO IDENTIFY:');
console.log('=============================');
console.log('');

console.log('Issue 1: Secret Not Set');
console.log('- Log shows: hasWebhookSecret: false');
console.log('- Solution: Run "npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."');
console.log('');

console.log('Issue 2: Wrong Secret Value');
console.log('- Log shows: "SIGNATURE VERIFICATION FAILED"');
console.log('- Error message about invalid signature');
console.log('- Solution: Double-check secret matches Stripe dashboard');
console.log('');

console.log('Issue 3: Malformed Request');
console.log('- Log shows: Missing signature header or empty body');
console.log('- Solution: Check Stripe webhook URL configuration');
console.log('');

console.log('📋 NEXT STEPS AFTER TESTING:');
console.log('============================');
console.log('');
console.log('1. Run one of the testing methods above');
console.log('2. Check both Supabase and Stripe logs');
console.log('3. Identify the specific issue from debug output');
console.log('4. Apply the appropriate fix based on findings');
console.log('5. Test again to verify the fix works');
console.log('');

console.log('📞 IMMEDIATE ACTION:');
console.log('===================');
console.log('Go ahead and trigger a payment or webhook event now!');
console.log('The enhanced logging will show exactly what\'s happening.');
console.log('Check the logs immediately after triggering the event.');