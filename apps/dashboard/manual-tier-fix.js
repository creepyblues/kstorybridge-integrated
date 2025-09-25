#!/usr/bin/env node

/**
 * Manual Tier Fix Script
 *
 * This script manually updates the user tier to Pro for the specific user
 * who had a successful payment but webhook failed to process correctly.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
// Use the service role key from environment or fallback to a different approach
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5MjMzNCwiZXhwIjoyMDY3MzY4MzM0fQ.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixUserTier() {
  // User information from debug logs
  const userId = 'a39c89a1-425f-4796-906c-a0c0723fa449';
  const userEmail = 'sunghol@cultureflipper.com';
  const sessionId = 'cs_test_a1n0Mmxq8cxn3WNbR5Nc51vHrduwHdJ3PBhA1I86JJGGoxtiriUbPuNEtR';

  console.log('🔧 Manual Tier Fix Script');
  console.log('========================');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${userEmail}`);
  console.log(`Session ID: ${sessionId}`);
  console.log('');

  try {
    // Step 1: Check current user tier
    console.log('1️⃣ Checking current user tier...');
    const { data: currentUser, error: checkError } = await supabase
      .from('user_buyers')
      .select('tier, email')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('❌ Error checking current user:', checkError);
      return;
    }

    console.log(`   Current tier: ${currentUser.tier}`);
    console.log(`   Email: ${currentUser.email}`);
    console.log('');

    // Step 2: Update user tier to Pro
    console.log('2️⃣ Updating user tier to Pro...');
    const { error: tierError } = await supabase
      .from('user_buyers')
      .update({ tier: 'pro' })
      .eq('id', userId);

    if (tierError) {
      console.error('❌ Failed to update tier:', tierError);
      return;
    }

    console.log('   ✅ User tier updated to Pro');
    console.log('');

    // Step 3: Update stripe_customers record
    console.log('3️⃣ Updating Stripe customer record...');

    // Note: Since we don't have the exact subscription ID from the successful payment,
    // we'll mark it as active with a placeholder subscription ID that matches the session
    const { error: stripeError } = await supabase
      .from('stripe_customers')
      .update({
        subscription_status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false,
      })
      .eq('user_id', userId);

    if (stripeError) {
      console.error('❌ Failed to update Stripe customer record:', stripeError);
    } else {
      console.log('   ✅ Stripe customer record updated');
    }
    console.log('');

    // Step 4: Verify the fix
    console.log('4️⃣ Verifying the fix...');

    const { data: updatedUser, error: verifyError } = await supabase
      .from('user_buyers')
      .select('tier')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    const { data: updatedStripe, error: stripeVerifyError } = await supabase
      .from('stripe_customers')
      .select('subscription_status, current_period_end')
      .eq('user_id', userId)
      .single();

    console.log('   📊 Verification Results:');
    console.log(`   User tier: ${updatedUser.tier}`);
    console.log(`   Subscription status: ${updatedStripe?.subscription_status}`);
    console.log(`   Period end: ${updatedStripe?.current_period_end}`);
    console.log('');

    if (updatedUser.tier === 'pro' && updatedStripe?.subscription_status === 'active') {
      console.log('🎉 SUCCESS! User tier has been manually fixed.');
      console.log('   The user should now have access to Pro features.');
      console.log('   Please refresh the payment success page to see the changes.');
    } else {
      console.log('⚠️  Partial success - some updates may not have applied correctly.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixUserTier();