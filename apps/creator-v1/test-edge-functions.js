#!/usr/bin/env node

/**
 * Edge Function Testing Script
 *
 * Tests Supabase edge functions for profile creation:
 * - create-buyer-profile
 * - create-creator-profile
 * - create-oauth-profile
 *
 * Usage:
 *   node test-edge-functions.js [--function=name]
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEyODA3NTMsImV4cCI6MjAzNjg1Njc1M30.kIdJIaSByPS63LDdPx3L7D3Bpzn3B1C1FoXAKSxrQcw';

const args = process.argv.slice(2);
const functionArg = args.find(arg => arg.startsWith('--function='));
const SPECIFIC_FUNCTION = functionArg ? functionArg.split('=')[1] : null;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function testEdgeFunction(name, payload, description) {
  logSection(`Testing: ${name}`);
  log(description, 'blue');

  const startTime = Date.now();

  try {
    log(`\n📤 Sending request to ${name}...`, 'blue');
    log(`Payload: ${JSON.stringify(payload, null, 2)}`, 'cyan');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    });

    const duration = Date.now() - startTime;

    log(`\n⏱️  Response time: ${duration}ms`, 'yellow');
    log(`📊 Status: ${response.status} ${response.statusText}`,
      response.ok ? 'green' : 'red');

    const result = await response.json();

    if (response.ok && result.success) {
      log('✅ Edge function succeeded', 'green');
      log('Response:', 'green');
      console.log(JSON.stringify(result, null, 2));
      return { success: true, duration, result };
    } else {
      log('❌ Edge function failed', 'red');
      log('Error:', 'red');
      console.log(JSON.stringify(result, null, 2));
      return { success: false, duration, error: result.error };
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ Request failed: ${error.message}`, 'red');
    return { success: false, duration, error: error.message };
  }
}

async function testBuyerProfileFunction() {
  const testId = `test-${Date.now()}`;
  const payload = {
    userId: testId,
    email: `test-buyer-${testId}@testcompany.com`,
    fullName: 'Test Buyer',
    buyerCompany: 'Test Company',
    buyerRole: 'producer',
    tier: 'basic',
    requested: false
  };

  return await testEdgeFunction(
    'create-buyer-profile',
    payload,
    'Creates buyer profile via edge function (email signup flow)'
  );
}

async function testCreatorProfileFunction() {
  const testId = `test-${Date.now()}`;
  const payload = {
    account_type: 'creator',
    user_id: testId,
    profile_data: {
      id: testId,
      email: `test-creator-${testId}@gmail.com`,
      full_name: 'Test Creator',
      pen_name: 'Test Pen Name',
      ip_owner_role: 'author',
      invitation_status: 'invited'
    }
  };

  return await testEdgeFunction(
    'create-oauth-profile',
    payload,
    'Creates creator profile via OAuth edge function (OAuth signup flow)'
  );
}

async function testOAuthBuyerFunction() {
  const testId = `test-${Date.now()}`;
  const payload = {
    account_type: 'buyer',
    user_id: testId,
    profile_data: {
      id: testId,
      email: `test-oauth-buyer-${testId}@company.com`,
      full_name: 'Test OAuth Buyer',
      buyer_company: 'OAuth Test Company',
      buyer_role: 'executive',
      tier: 'basic',
      requested: false
    }
  };

  return await testEdgeFunction(
    'create-oauth-profile',
    payload,
    'Creates buyer profile via OAuth edge function (OAuth signup flow)'
  );
}

async function testEdgeFunctionErrors() {
  logSection('Testing Error Handling');

  // Test 1: Missing required fields
  log('\n🧪 Test: Missing required fields', 'yellow');
  await testEdgeFunction(
    'create-buyer-profile',
    {
      userId: 'test',
      email: 'test@test.com'
      // Missing fullName, buyerCompany, buyerRole
    },
    'Should return error for missing required fields'
  );

  // Test 2: Invalid account type
  log('\n🧪 Test: Invalid account type', 'yellow');
  await testEdgeFunction(
    'create-oauth-profile',
    {
      account_type: 'invalid',
      user_id: 'test',
      profile_data: {}
    },
    'Should return error for invalid account type'
  );

  // Test 3: Empty profile data
  log('\n🧪 Test: Empty profile data', 'yellow');
  await testEdgeFunction(
    'create-oauth-profile',
    {
      account_type: 'buyer',
      user_id: 'test',
      profile_data: {}
    },
    'Should return error for empty profile data'
  );
}

async function checkEdgeFunctionAvailability() {
  logSection('Edge Function Availability Check');

  const functions = [
    'create-buyer-profile',
    'create-creator-profile',
    'create-oauth-profile'
  ];

  for (const func of functions) {
    try {
      log(`\n🔍 Checking ${func}...`, 'blue');

      // Send OPTIONS request to check CORS
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'OPTIONS',
        headers: {
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (response.ok) {
        log(`✅ ${func} is available`, 'green');
      } else {
        log(`⚠️  ${func} returned ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${func} is not accessible: ${error.message}`, 'red');
    }
  }
}

async function main() {
  log('\n🧪 Edge Function Testing Tool', 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  log(`Supabase URL: ${SUPABASE_URL}`, 'blue');

  const results = [];

  try {
    // Check availability first
    await checkEdgeFunctionAvailability();

    if (SPECIFIC_FUNCTION) {
      // Test specific function
      log(`\nTesting specific function: ${SPECIFIC_FUNCTION}`, 'yellow');

      switch (SPECIFIC_FUNCTION) {
        case 'create-buyer-profile':
          results.push(await testBuyerProfileFunction());
          break;
        case 'create-oauth-profile':
          results.push(await testOAuthBuyerFunction());
          results.push(await testCreatorProfileFunction());
          break;
        default:
          log(`Unknown function: ${SPECIFIC_FUNCTION}`, 'red');
      }
    } else {
      // Test all functions
      results.push(await testBuyerProfileFunction());
      results.push(await testOAuthBuyerFunction());
      results.push(await testCreatorProfileFunction());

      // Test error handling
      await testEdgeFunctionErrors();
    }

    // Summary
    logSection('Test Summary');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    log(`\nTotal Tests: ${results.length}`, 'cyan');
    log(`Successful: ${successful}`, successful > 0 ? 'green' : 'red');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Average Duration: ${avgDuration.toFixed(0)}ms`, 'yellow');

    if (failed === 0) {
      log('\n✅ All edge function tests passed!', 'green');
    } else {
      log('\n⚠️  Some edge function tests failed', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
