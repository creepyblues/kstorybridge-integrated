/**
 * Validation-Only Test Script: analyze-pitch-for-assets Edge Function
 * Tests input validation without making expensive OpenAI API calls
 *
 * Usage: node scripts/test-validation-only.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TEST FUNCTIONS (NO API CALLS - FREE)
// ============================================================================

/**
 * Test 1: Unauthorized admin email
 */
async function testUnauthorizedAdmin() {
  console.log('\n🧪 Test 1: Unauthorized admin email');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-unauthorized-' + Date.now(),
      title_name: 'Test Title',
      pitch_deck_url: 'https://example.com/pitch.pdf',
      admin_email: 'unauthorized@example.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    // Should fail with unauthorized error
    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'UNAUTHORIZED') {
        console.log('✅ PASSED - Correctly rejected unauthorized admin');
        console.log(`   Error code: ${responseData.error.code}`);
        console.log(`   Message: ${responseData.error.message}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected unauthorized admin');
    return { success: false, error: 'Expected UNAUTHORIZED error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Missing required field - title_id
 */
async function testMissingTitleId() {
  console.log('\n🧪 Test 2: Missing required field (title_id)');
  console.log('='.repeat(60));

  try {
    const testData = {
      // Missing title_id
      title_name: 'Test Title',
      pitch_deck_url: 'https://example.com/pitch.pdf',
      admin_email: 'sungho@kstorybridge.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
        console.log('✅ PASSED - Correctly rejected missing title_id');
        console.log(`   Error code: ${responseData.error.code}`);
        console.log(`   Message: ${responseData.error.message}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected missing title_id');
    return { success: false, error: 'Expected INVALID_INPUT error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Missing required field - title_name
 */
async function testMissingTitleName() {
  console.log('\n🧪 Test 3: Missing required field (title_name)');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-123',
      // Missing title_name
      pitch_deck_url: 'https://example.com/pitch.pdf',
      admin_email: 'sungho@kstorybridge.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
        console.log('✅ PASSED - Correctly rejected missing title_name');
        console.log(`   Error code: ${responseData.error.code}`);
        console.log(`   Message: ${responseData.error.message}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected missing title_name');
    return { success: false, error: 'Expected INVALID_INPUT error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Missing required field - pitch_deck_url
 */
async function testMissingPitchDeckUrl() {
  console.log('\n🧪 Test 4: Missing required field (pitch_deck_url)');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-123',
      title_name: 'Test Title',
      // Missing pitch_deck_url
      admin_email: 'sungho@kstorybridge.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
        console.log('✅ PASSED - Correctly rejected missing pitch_deck_url');
        console.log(`   Error code: ${responseData.error.code}`);
        console.log(`   Message: ${responseData.error.message}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected missing pitch_deck_url');
    return { success: false, error: 'Expected INVALID_INPUT error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Missing required field - admin_email
 */
async function testMissingAdminEmail() {
  console.log('\n🧪 Test 5: Missing required field (admin_email)');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-123',
      title_name: 'Test Title',
      pitch_deck_url: 'https://example.com/pitch.pdf'
      // Missing admin_email
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
        console.log('✅ PASSED - Correctly rejected missing admin_email');
        console.log(`   Error code: ${responseData.error.code}`);
        console.log(`   Message: ${responseData.error.message}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected missing admin_email');
    return { success: false, error: 'Expected INVALID_INPUT error' };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 6: Authorized admin - Kevin
 */
async function testAuthorizedAdminKevin() {
  console.log('\n🧪 Test 6: Authorized admin (kevin@sandstoneartists.com)');
  console.log('='.repeat(60));

  try {
    const testData = {
      title_id: 'test-123',
      title_name: 'Test Title',
      pitch_deck_url: 'https://example.com/pitch.pdf',
      admin_email: 'kevin@sandstoneartists.com'
    };

    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: testData
    });

    // This should NOT fail with UNAUTHORIZED
    // It will fail later (likely OPENAI_ERROR since we're not providing real data)
    // but the important thing is it passes the admin authorization check

    if (error && error.context) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'UNAUTHORIZED') {
        console.error('❌ FAILED - Should have authorized kevin@sandstoneartists.com');
        return { success: false, error: 'Kevin should be authorized' };
      }

      // Any other error is fine - we just want to confirm NOT unauthorized
      console.log('✅ PASSED - Kevin authorized (failed later as expected)');
      console.log(`   Error code: ${responseData.error.code}`);
      console.log(`   Message: ${responseData.error.message}`);
      return { success: true };
    }

    console.log('✅ PASSED - Kevin authorized');
    return { success: true };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runValidationTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Validation Tests: analyze-pitch-for-assets Edge Function');
  console.log('💰 Cost: $0.00 (No OpenAI API calls)');
  console.log('='.repeat(60));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Run tests
  const tests = [
    { name: 'Unauthorized admin email', fn: testUnauthorizedAdmin },
    { name: 'Missing title_id', fn: testMissingTitleId },
    { name: 'Missing title_name', fn: testMissingTitleName },
    { name: 'Missing pitch_deck_url', fn: testMissingPitchDeckUrl },
    { name: 'Missing admin_email', fn: testMissingAdminEmail },
    { name: 'Authorized admin (Kevin)', fn: testAuthorizedAdminKevin }
  ];

  for (const test of tests) {
    results.total++;
    const result = await test.fn();
    results.tests.push({ name: test.name, ...result });

    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`💰 Total cost: $0.00`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.success).forEach(t => {
      console.log(`   - ${t.name}`);
      if (t.error) {
        console.log(`     Error: ${typeof t.error === 'object' ? JSON.stringify(t.error) : t.error}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runValidationTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
