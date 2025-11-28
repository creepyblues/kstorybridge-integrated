#!/usr/bin/env node

/**
 * Verify Test Setup CLI Script
 *
 * Check that all test infrastructure is properly configured.
 *
 * Usage:
 *   npm run test:verify
 *   node scripts/verify-test-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local explicitly (not .env)
dotenv.config({ path: resolve('.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function checkPass(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function checkFail(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function checkWarn(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

// Environment checks
function checkEnvironment() {
  console.log('\n📋 Environment Configuration:');

  if (SUPABASE_URL) {
    checkPass(`Supabase URL configured: ${SUPABASE_URL}`);
  } else {
    checkFail('Supabase URL not configured (VITE_SUPABASE_URL)');
  }

  if (SUPABASE_ANON_KEY) {
    checkPass('Supabase anon key configured');
  } else {
    checkFail('Supabase anon key not configured (VITE_SUPABASE_ANON_KEY)');
  }

  if (process.env.VITE_TEST_MODE === 'true') {
    checkPass('Test mode enabled (VITE_TEST_MODE=true)');
  } else {
    checkWarn('Test mode not enabled (set VITE_TEST_MODE=true in .env.test)');
  }

  if (process.env.VITE_SKIP_EMAIL_SEND === 'true') {
    checkPass('Email sending disabled for tests (VITE_SKIP_EMAIL_SEND=true)');
  } else {
    checkWarn('Email sending not disabled (set VITE_SKIP_EMAIL_SEND=true in .env.test)');
  }
}

// File structure checks
function checkFileStructure() {
  console.log('\n📁 File Structure:');

  const files = [
    '.env.test',
    'supabase/seed.sql',
    'supabase/config.toml',
    'src/test-utils/index.ts',
    'src/test-utils/setup-test-user.ts',
    'src/test-utils/mock-stripe.ts',
    'src/test-utils/chatbot-test-queries.ts',
    'src/test-utils/cleanup-test-data.ts',
    'src/test-utils/supabase-test-client.ts',
    'src/lib/feature-flags.ts',
    'scripts/create-test-user.js',
    'scripts/cleanup-test-data.js',
    'scripts/verify-test-setup.js',
  ];

  for (const file of files) {
    const fullPath = resolve(file);
    if (existsSync(fullPath)) {
      checkPass(file);
    } else {
      checkFail(`Missing: ${file}`);
    }
  }
}

// Database connectivity check
async function checkDatabaseConnection() {
  console.log('\n🔌 Database Connection:');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    checkFail('Cannot test connection - missing credentials');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('titles')
      .select('title_id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      checkFail(`Database connection failed: ${error.message}`);
    } else {
      checkPass('Database connection successful');
    }
  } catch (error) {
    checkFail(`Database connection error: ${error.message}`);
  }
}

// Test data check
async function checkTestData() {
  console.log('\n🧪 Test Data:');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    checkFail('Cannot check test data - missing credentials');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Count test buyers
    const { count: buyerCount } = await supabase
      .from('user_buyers')
      .select('*', { count: 'exact', head: true })
      .ilike('email', 'test-%');

    if (buyerCount > 0) {
      checkWarn(`Found ${buyerCount} test buyers (run 'npm run test:cleanup' to remove)`);
    } else {
      checkPass('No test buyers in database (clean state)');
    }

    // Count test creators
    const { count: creatorCount } = await supabase
      .from('user_creators')
      .select('*', { count: 'exact', head: true })
      .ilike('email', 'test-%');

    if (creatorCount > 0) {
      checkWarn(`Found ${creatorCount} test creators (run 'npm run test:cleanup' to remove)`);
    } else {
      checkPass('No test creators in database (clean state)');
    }

    // Count test sessions
    const { count: sessionCount } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .ilike('user_email', 'test-%');

    if (sessionCount > 0) {
      checkWarn(`Found ${sessionCount} test sessions (run 'npm run test:cleanup' to remove)`);
    } else {
      checkPass('No test sessions in database (clean state)');
    }
  } catch (error) {
    checkFail(`Test data check error: ${error.message}`);
  }
}

// NPM scripts check
function checkNpmScripts() {
  console.log('\n📦 NPM Scripts:');

  const packageJson = JSON.parse(
    readFileSync(resolve('package.json'), 'utf-8')
  );

  const requiredScripts = [
    'test:local',
    'test:create-user',
    'test:create-buyer',
    'test:create-creator',
    'test:cleanup',
    'test:verify',
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      checkPass(`Script configured: ${script}`);
    } else {
      checkFail(`Missing script: ${script}`);
    }
  }
}

// Main execution
(async () => {
  console.log('🔍 KStoryBridge Test Setup Verification\n');
  console.log('=' .repeat(60));

  checkEnvironment();
  checkFileStructure();
  await checkDatabaseConnection();
  await checkTestData();
  checkNpmScripts();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:');
  console.log(`  ✅ Passed: ${checks.passed}`);
  console.log(`  ❌ Failed: ${checks.failed}`);
  console.log(`  ⚠️  Warnings: ${checks.warnings}`);

  if (checks.failed === 0) {
    console.log('\n✅ Test setup is properly configured!\n');
    console.log('🚀 Quick Start Commands:');
    console.log('  - Create test buyer: npm run test:create-buyer');
    console.log('  - Create test creator: npm run test:create-creator');
    console.log('  - Start test mode: npm run test:local');
    console.log('  - Cleanup test data: npm run test:cleanup');
    console.log('');
    process.exit(0);
  } else {
    console.log('\n❌ Test setup has issues that need to be fixed\n');
    process.exit(1);
  }
})();
