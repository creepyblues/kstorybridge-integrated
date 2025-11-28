#!/usr/bin/env node

/**
 * Cleanup Test Data CLI Script
 *
 * Remove all test users and their data from database.
 *
 * Usage:
 *   npm run test:cleanup
 *   node scripts/cleanup-test-data.js
 *   node scripts/cleanup-test-data.js --confirm
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

// Load .env.local explicitly (not .env)
dotenv.config({ path: resolve('.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const autoConfirm = args.includes('--confirm') || args.includes('-y');

async function cleanupTestBuyers() {
  const { data: testBuyers, error } = await supabase
    .from('user_buyers')
    .select('email')
    .ilike('email', 'test-%');

  if (error) {
    console.error('❌ Error fetching test buyers:', error.message);
    return { deleted: 0, errors: 1 };
  }

  if (!testBuyers || testBuyers.length === 0) {
    console.log('  No test buyers found');
    return { deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;

  for (const buyer of testBuyers) {
    const { error: deleteError } = await supabase
      .from('user_buyers')
      .delete()
      .eq('email', buyer.email);

    if (deleteError) {
      console.error(`  ❌ Failed to delete ${buyer.email}:`, deleteError.message);
      errors++;
    } else {
      console.log(`  ✅ Deleted buyer: ${buyer.email}`);
      deleted++;
    }
  }

  return { deleted, errors };
}

async function cleanupTestCreators() {
  const { data: testCreators, error } = await supabase
    .from('user_creators')
    .select('email')
    .ilike('email', 'test-%');

  if (error) {
    console.error('❌ Error fetching test creators:', error.message);
    return { deleted: 0, errors: 1 };
  }

  if (!testCreators || testCreators.length === 0) {
    console.log('  No test creators found');
    return { deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;

  for (const creator of testCreators) {
    const { error: deleteError } = await supabase
      .from('user_creators')
      .delete()
      .eq('email', creator.email);

    if (deleteError) {
      console.error(`  ❌ Failed to delete ${creator.email}:`, deleteError.message);
      errors++;
    } else {
      console.log(`  ✅ Deleted creator: ${creator.email}`);
      deleted++;
    }
  }

  return { deleted, errors };
}

async function cleanupTestChatSessions() {
  const { data: testSessions, error } = await supabase
    .from('chat_sessions')
    .select('id, user_email')
    .ilike('user_email', 'test-%');

  if (error) {
    console.error('❌ Error fetching test sessions:', error.message);
    return { deleted: 0, errors: 1 };
  }

  if (!testSessions || testSessions.length === 0) {
    console.log('  No test chat sessions found');
    return { deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;

  for (const session of testSessions) {
    // Delete messages first
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', session.id);

    // Delete session
    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', session.id);

    if (deleteError) {
      console.error(`  ❌ Failed to delete session ${session.id}:`, deleteError.message);
      errors++;
    } else {
      console.log(`  ✅ Deleted session: ${session.id} (${session.user_email})`);
      deleted++;
    }
  }

  return { deleted, errors };
}

async function verifyCleanup() {
  const { data: buyers } = await supabase
    .from('user_buyers')
    .select('email', { count: 'exact', head: true })
    .ilike('email', 'test-%');

  const { data: creators } = await supabase
    .from('user_creators')
    .select('email', { count: 'exact', head: true })
    .ilike('email', 'test-%');

  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .ilike('user_email', 'test-%');

  const remainingBuyers = buyers?.length || 0;
  const remainingCreators = creators?.length || 0;
  const remainingSessions = sessions?.length || 0;

  const clean = remainingBuyers === 0 && remainingCreators === 0 && remainingSessions === 0;

  return {
    clean,
    remainingBuyers,
    remainingCreators,
    remainingSessions,
  };
}

async function askConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('\n⚠️  This will delete ALL test data. Continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Main execution
(async () => {
  console.log('🧹 KStoryBridge Test Data Cleanup\n');

  // Ask for confirmation unless --confirm flag is provided
  if (!autoConfirm) {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled\n');
      process.exit(0);
    }
  }

  console.log('\n🧹 Starting cleanup...\n');

  // Cleanup buyers
  console.log('🧹 Cleaning up test buyers...');
  const buyersResult = await cleanupTestBuyers();

  // Cleanup creators
  console.log('\n🧹 Cleaning up test creators...');
  const creatorsResult = await cleanupTestCreators();

  // Cleanup chat sessions
  console.log('\n🧹 Cleaning up test chat sessions...');
  const sessionsResult = await cleanupTestChatSessions();

  // Summary
  const totalDeleted = buyersResult.deleted + creatorsResult.deleted + sessionsResult.deleted;
  const totalErrors = buyersResult.errors + creatorsResult.errors + sessionsResult.errors;

  console.log('\n📊 Cleanup Summary:');
  console.log(`  - Buyers deleted: ${buyersResult.deleted}`);
  console.log(`  - Creators deleted: ${creatorsResult.deleted}`);
  console.log(`  - Chat sessions deleted: ${sessionsResult.deleted}`);
  console.log(`  - Total items deleted: ${totalDeleted}`);
  if (totalErrors > 0) {
    console.log(`  - Errors: ${totalErrors}`);
  }

  // Verify
  console.log('\n🔍 Verifying cleanup...');
  const verification = await verifyCleanup();

  if (verification.clean) {
    console.log('✅ All test data cleaned up successfully\n');
  } else {
    console.log('⚠️  Some test data remains:');
    if (verification.remainingBuyers > 0) console.log(`  - ${verification.remainingBuyers} test buyers`);
    if (verification.remainingCreators > 0) console.log(`  - ${verification.remainingCreators} test creators`);
    if (verification.remainingSessions > 0) console.log(`  - ${verification.remainingSessions} test sessions`);
    console.log('');
  }

  process.exit(verification.clean ? 0 : 1);
})();
