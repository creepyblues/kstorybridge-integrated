#!/usr/bin/env node

/**
 * Database Verification Test Script
 *
 * Verifies database state for authentication testing:
 * - Profile existence checks
 * - Metadata verification
 * - Orphaned users detection
 * - Table integrity
 *
 * Usage:
 *   node test-database-verification.js [--email=user@example.com]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEyODA3NTMsImV4cCI6MjAzNjg1Njc1M30.kIdJIaSByPS63LDdPx3L7D3Bpzn3B1C1FoXAKSxrQcw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const TEST_EMAIL = emailArg ? emailArg.split('=')[1] : null;

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function checkProfileByEmail(email) {
  logSection(`Profile Check: ${email}`);

  try {
    // Check buyer profile
    log('\n🔍 Checking user_buyers table...', 'blue');
    const { data: buyer, error: buyerError } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (buyerError) {
      log(`❌ Error querying user_buyers: ${buyerError.message}`, 'red');
    } else if (buyer) {
      log('✅ Buyer profile found:', 'green');
      console.log(JSON.stringify(buyer, null, 2));
    } else {
      log('ℹ️  No buyer profile found', 'yellow');
    }

    // Check creator profile
    log('\n🔍 Checking user_creators table...', 'blue');
    const { data: creator, error: creatorError } = await supabase
      .from('user_creators')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (creatorError) {
      log(`❌ Error querying user_creators: ${creatorError.message}`, 'red');
    } else if (creator) {
      log('✅ Creator profile found:', 'green');
      console.log(JSON.stringify(creator, null, 2));
    } else {
      log('ℹ️  No creator profile found', 'yellow');
    }

    // Check auth.users (requires service role or admin access)
    log('\n🔍 Note: auth.users metadata check requires service role access', 'yellow');
    log('    Use Supabase dashboard SQL editor to run:', 'yellow');
    log(`    SELECT email, raw_user_meta_data->>'account_type' as account_type`, 'cyan');
    log(`    FROM auth.users WHERE email = '${email}';`, 'cyan');

    // Summary
    log('\n📊 Summary:', 'magenta');
    if (buyer) {
      log(`  ✅ Account Type: BUYER`, 'green');
      log(`  ✅ Tier: ${buyer.tier}`, 'green');
      log(`  ✅ Company: ${buyer.buyer_company}`, 'green');
    } else if (creator) {
      log(`  ✅ Account Type: CREATOR`, 'green');
      log(`  ✅ Status: ${creator.invitation_status}`, 'green');
      log(`  ✅ Pen Name: ${creator.pen_name}`, 'green');
    } else {
      log(`  ⚠️  No profile found - user needs to complete signup`, 'yellow');
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

async function checkOrphanedUsers() {
  logSection('Orphaned Users Check');

  log('\nℹ️  Orphaned users = auth.users entries without matching profile', 'blue');
  log('   This is normal for users who started OAuth but did not complete signup', 'blue');

  log('\n📝 To check for orphaned users, run this SQL in Supabase dashboard:', 'yellow');
  log(`
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'account_type' as intended_type
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM user_buyers WHERE id = u.id)
    AND NOT EXISTS (SELECT 1 FROM user_creators WHERE id = u.id)
  ORDER BY u.created_at DESC
  LIMIT 10;
  `, 'cyan');

  log('\n🧹 To cleanup orphaned users older than 7 days:', 'yellow');
  log(`
  DELETE FROM auth.users u
  WHERE u.created_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (SELECT 1 FROM user_buyers WHERE id = u.id)
    AND NOT EXISTS (SELECT 1 FROM user_creators WHERE id = u.id);
  `, 'cyan');
}

async function checkTableStats() {
  logSection('Table Statistics');

  try {
    // Count buyers
    const { count: buyerCount, error: buyerError } = await supabase
      .from('user_buyers')
      .select('*', { count: 'exact', head: true });

    if (buyerError) {
      log(`❌ Error counting buyers: ${buyerError.message}`, 'red');
    } else {
      log(`👥 Total Buyers: ${buyerCount}`, 'green');
    }

    // Count creators
    const { count: creatorCount, error: creatorError } = await supabase
      .from('user_creators')
      .select('*', { count: 'exact', head: true });

    if (creatorError) {
      log(`❌ Error counting creators: ${creatorError.message}`, 'red');
    } else {
      log(`✍️  Total Creators: ${creatorCount}`, 'green');
    }

    // Buyer tier distribution
    log('\n📊 Buyer Tier Distribution:', 'blue');
    const { data: tierData, error: tierError } = await supabase
      .from('user_buyers')
      .select('tier');

    if (tierError) {
      log(`❌ Error fetching tier data: ${tierError.message}`, 'red');
    } else if (tierData) {
      const tierCounts = tierData.reduce((acc, { tier }) => {
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      Object.entries(tierCounts).forEach(([tier, count]) => {
        log(`  ${tier}: ${count} users`, 'cyan');
      });
    }

    // Creator status distribution
    log('\n📊 Creator Status Distribution:', 'blue');
    const { data: statusData, error: statusError } = await supabase
      .from('user_creators')
      .select('invitation_status');

    if (statusError) {
      log(`❌ Error fetching status data: ${statusError.message}`, 'red');
    } else if (statusData) {
      const statusCounts = statusData.reduce((acc, { invitation_status }) => {
        acc[invitation_status] = (acc[invitation_status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        log(`  ${status}: ${count} users`, 'cyan');
      });
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

async function checkRecentSignups() {
  logSection('Recent Signups (Last 24 Hours)');

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Recent buyers
    log('\n👥 Recent Buyers:', 'blue');
    const { data: recentBuyers, error: buyerError } = await supabase
      .from('user_buyers')
      .select('email, full_name, buyer_company, tier, created_at')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    if (buyerError) {
      log(`❌ Error: ${buyerError.message}`, 'red');
    } else if (recentBuyers && recentBuyers.length > 0) {
      recentBuyers.forEach(buyer => {
        log(`  ${buyer.email} | ${buyer.full_name} | ${buyer.buyer_company} | Tier: ${buyer.tier}`, 'green');
      });
    } else {
      log('  No recent buyer signups', 'yellow');
    }

    // Recent creators
    log('\n✍️  Recent Creators:', 'blue');
    const { data: recentCreators, error: creatorError } = await supabase
      .from('user_creators')
      .select('email, full_name, pen_name, invitation_status, created_at')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    if (creatorError) {
      log(`❌ Error: ${creatorError.message}`, 'red');
    } else if (recentCreators && recentCreators.length > 0) {
      recentCreators.forEach(creator => {
        log(`  ${creator.email} | ${creator.full_name} | ${creator.pen_name} | Status: ${creator.invitation_status}`, 'green');
      });
    } else {
      log('  No recent creator signups', 'yellow');
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

async function main() {
  log('\n🔍 Database Verification Tool', 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');

  if (TEST_EMAIL) {
    // Check specific email
    await checkProfileByEmail(TEST_EMAIL);
  } else {
    // Run all checks
    await checkTableStats();
    await checkRecentSignups();
    await checkOrphanedUsers();
  }

  log('\n✅ Verification complete!\n', 'green');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}\n`, 'red');
  console.error(error);
  process.exit(1);
});
