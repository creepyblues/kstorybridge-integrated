#!/usr/bin/env node

/**
 * Create Test User CLI Script
 *
 * Quickly create test users from command line.
 *
 * Usage:
 *   npm run test:create-user
 *   npm run test:create-buyer -- --tier=pro
 *   npm run test:create-creator -- --role=agent
 *   node scripts/create-test-user.js --type=buyer --tier=suite
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly (not .env)
dotenv.config({ path: resolve('.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_PASSWORD = 'Test-Password-123';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const type = getArg('type') || 'buyer';
const tier = getArg('tier') || 'basic';
const role = getArg('role') || 'author';
const customEmail = getArg('email');

function generateTestEmail(prefix, domain = 'testcompany.com') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${prefix}-${timestamp}-${random}@${domain}`;
}

async function createTestBuyer(tier = 'basic', customEmail) {
  const email = customEmail || generateTestEmail(`buyer-${tier}`);

  console.log(`\n🧪 Creating test buyer: ${email} (tier: ${tier})\n`);

  try {
    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: {
        data: {
          account_type: 'buyer',
          full_name: `Test Buyer ${tier.toUpperCase()}`,
          buyer_company: 'Test Company LLC',
          buyer_role: tier === 'suite' ? 'Executive Producer' : tier === 'pro' ? 'Senior Producer' : 'Producer',
          tier,
        },
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Create profile via edge function
    const { error: profileError } = await supabase.functions.invoke('create-buyer-profile', {
      body: {
        email,
        full_name: `Test Buyer ${tier.toUpperCase()}`,
        buyer_company: 'Test Company LLC',
        buyer_role: tier === 'suite' ? 'Executive Producer' : tier === 'pro' ? 'Senior Producer' : 'Producer',
        tier,
      },
    });

    if (profileError) {
      console.warn('⚠️  Profile creation warning:', profileError.message);
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n✅ Test buyer created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log(`🏆 Tier: ${tier}\n`);

    return { email, password: TEST_PASSWORD };
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function createTestCreator(role = 'author', customEmail) {
  const email = customEmail || generateTestEmail(`creator-${role}`, 'gmail.com');

  console.log(`\n🧪 Creating test creator: ${email} (role: ${role})\n`);

  try {
    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: {
        data: {
          account_type: 'creator',
          full_name: `Test ${role === 'author' ? 'Author' : 'Agent'}`,
          pen_name: role === 'author' ? 'Test Pen Name' : 'Test Agency',
          ip_owner_role: role,
          ip_owner_company: role === 'agent' ? 'Test Literary Agency' : undefined,
          invitation_status: 'active',
        },
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Create profile via edge function
    const { error: profileError } = await supabase.functions.invoke('create-creator-profile', {
      body: {
        email,
        full_name: `Test ${role === 'author' ? 'Author' : 'Agent'}`,
        pen_name: role === 'author' ? 'Test Pen Name' : 'Test Agency',
        ip_owner_role: role,
        ip_owner_company: role === 'agent' ? 'Test Literary Agency' : undefined,
        invitation_status: 'active',
      },
    });

    if (profileError) {
      console.warn('⚠️  Profile creation warning:', profileError.message);
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n✅ Test creator created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log(`👤 Role: ${role}\n`);

    return { email, password: TEST_PASSWORD };
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('🧪 KStoryBridge Test User Creator\n');

  if (type === 'buyer') {
    await createTestBuyer(tier, customEmail);
  } else if (type === 'creator') {
    await createTestCreator(role, customEmail);
  } else {
    console.error('❌ Invalid type. Use --type=buyer or --type=creator');
    process.exit(1);
  }
})();
