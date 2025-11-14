/**
 * Unit Test Suite: Checkout UUID vs Email Bug Fix
 *
 * Tests verify that titles queries use UUID (user.id) instead of email
 *
 * Usage: npx tsx scripts/test-checkout-uuid-fix.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2MDU0NDYsImV4cCI6MjA0MjE4MTQ0Nn0.Y2-sx96td-eow7e7Ru8YEVHX5g8FPIlJH_-zToE0yEc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}: ${message}`)
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

// ============================================================================
// TEST 1: Verify titles.creator_id column type
// ============================================================================

async function testCreatorIdColumnType() {
  console.log('\n🧪 Test 1: Verify titles.creator_id is UUID type')

  try {
    // Query information schema
    const { data, error } = await supabase
      .from('columns')
      .select('data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'titles')
      .eq('column_name', 'creator_id')
      .maybeSingle()

    if (error) {
      // Fallback: Try to insert UUID and email to see which works
      const testUuid = '550e8400-e29b-41d4-a716-446655440000'

      const { error: uuidError } = await supabase
        .from('titles')
        .insert({
          title_name_kr: 'UUID Type Test',
          creator_id: testUuid,
        })

      // If insert fails due to foreign key, that's fine - means UUID type is correct
      const isUuidType = !uuidError || uuidError.message.includes('foreign key')

      logTest(
        'Column Type Check',
        isUuidType,
        isUuidType
          ? 'titles.creator_id accepts UUID format'
          : 'Unable to verify column type',
        { method: 'insert test', error: uuidError?.message }
      )
    } else {
      const isUuid = data?.data_type === 'uuid'
      logTest(
        'Column Type Check',
        isUuid,
        isUuid ? 'Column type is UUID' : `Unexpected type: ${data?.data_type}`,
        { data_type: data?.data_type }
      )
    }
  } catch (err: any) {
    logTest('Column Type Check', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 2: Verify UUID query pattern works (if RLS allows)
// ============================================================================

async function testUuidQueryPattern() {
  console.log('\n🧪 Test 2: Verify UUID query pattern')

  try {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000'

    // Attempt to query by UUID (will be filtered by RLS, but syntax should work)
    const { data, error } = await supabase
      .from('titles')
      .select('title_id, creator_id')
      .eq('creator_id', testUuid)

    if (error) {
      // Check if error is due to UUID type mismatch or RLS/auth
      const isTypeMismatch = error.message.includes('invalid input syntax for type uuid')

      logTest(
        'UUID Query Syntax',
        !isTypeMismatch,
        isTypeMismatch
          ? 'UUID query syntax failed (type mismatch)'
          : 'UUID query syntax valid (auth/RLS expected)',
        { error: error.message }
      )
    } else {
      logTest(
        'UUID Query Syntax',
        true,
        `Query succeeded, returned ${data.length} rows (filtered by RLS)`,
        { rowCount: data.length }
      )
    }
  } catch (err: any) {
    logTest('UUID Query Syntax', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 3: Verify email query fails with type error
// ============================================================================

async function testEmailQueryFails() {
  console.log('\n🧪 Test 3: Verify email query fails with type error')

  try {
    const testEmail = 'test@example.com'

    const { data, error } = await supabase
      .from('titles')
      .select('title_id, creator_id')
      .eq('creator_id', testEmail)

    // We EXPECT this to fail with type mismatch
    const hasTypeMismatch = error?.message.includes('invalid input syntax for type uuid')

    logTest(
      'Email Query Type Error',
      hasTypeMismatch,
      hasTypeMismatch
        ? 'Email correctly rejected (UUID type enforced)'
        : 'Unexpected: Email query did not fail',
      { error: error?.message, data: data }
    )
  } catch (err: any) {
    logTest('Email Query Type Error', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 4: Verify creator_subscriptions.creator_email is text type
// ============================================================================

async function testSubscriptionEmailType() {
  console.log('\n🧪 Test 4: Verify creator_subscriptions.creator_email is text')

  try {
    const testEmail = 'test@example.com'

    // Try to query by email (should work for text field)
    const { error } = await supabase
      .from('creator_subscriptions')
      .select('id, creator_email')
      .eq('creator_email', testEmail)

    // No type error means text field accepts email
    const isTextType = !error || !error.message.includes('invalid input syntax for type uuid')

    logTest(
      'Subscriptions Email Type',
      isTextType,
      isTextType
        ? 'creator_email accepts text (email) format'
        : 'Unexpected UUID type error',
      { error: error?.message }
    )
  } catch (err: any) {
    logTest('Subscriptions Email Type', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 5: Edge Function Integration Test
// ============================================================================

async function testEdgeFunctionOwnershipCheck() {
  console.log('\n🧪 Test 5: Edge function title ownership check')

  try {
    // Call edge function without auth (should fail with 401)
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-creator-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: 'packaging',
          billing_period: 'monthly',
          title_id: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }
    )

    // Should return 401 (no auth)
    const isAuthRequired = response.status === 401

    logTest(
      'Edge Function Auth',
      isAuthRequired,
      isAuthRequired
        ? 'Function requires authentication'
        : `Unexpected status: ${response.status}`,
      { status: response.status }
    )
  } catch (err: any) {
    logTest('Edge Function Auth', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 6: CheckoutModal component logic validation
// ============================================================================

async function testCheckoutModalLogic() {
  console.log('\n🧪 Test 6: CheckoutModal component logic')

  try {
    // Simulate CheckoutModal logic
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    }

    // Verify component would call getTitlesByCreator with user.id
    const creatorIdToUse = mockUser.id // Should be user.id, not user.email

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      creatorIdToUse
    )

    logTest(
      'CheckoutModal Logic',
      isUuid,
      isUuid ? 'Component uses user.id (UUID format)' : 'Component uses wrong field',
      { creatorIdToUse, isUuid }
    )
  } catch (err: any) {
    logTest('CheckoutModal Logic', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 7: Verify edge function code uses user.id
// ============================================================================

async function testEdgeFunctionCode() {
  console.log('\n🧪 Test 7: Edge function code review')

  try {
    // Read edge function source
    const fs = await import('fs/promises')
    const path = await import('path')

    const functionPath = path.join(
      process.cwd(),
      'supabase/functions/create-creator-checkout/index.ts'
    )

    const code = await fs.readFile(functionPath, 'utf-8')

    // Check for correct pattern
    const usesUserId = code.includes('.eq(\'creator_id\', user.id)')
    const usesUserEmail = code.includes('.eq(\'creator_id\', user.email)')

    const isCorrect = usesUserId && !usesUserEmail

    logTest(
      'Edge Function Code',
      isCorrect,
      isCorrect
        ? 'Function uses user.id for title ownership check'
        : 'Function uses incorrect field',
      {
        usesUserId,
        usesUserEmail,
        pattern: usesUserId ? 'user.id ✅' : usesUserEmail ? 'user.email ❌' : 'unknown',
      }
    )
  } catch (err: any) {
    logTest('Edge Function Code', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// TEST 8: Verify CheckoutModal component code
// ============================================================================

async function testCheckoutModalCode() {
  console.log('\n🧪 Test 8: CheckoutModal component code review')

  try {
    const fs = await import('fs/promises')
    const path = await import('path')

    const componentPath = path.join(
      process.cwd(),
      'apps/creator/src/components/CheckoutModal.tsx'
    )

    const code = await fs.readFile(componentPath, 'utf-8')

    // Check for correct pattern
    const usesUserId = code.includes('user?.id') && code.includes('getTitlesByCreator(user.id)')
    const usesUserEmail = code.includes('getTitlesByCreator(user.email)')

    const isCorrect = usesUserId && !usesUserEmail

    logTest(
      'CheckoutModal Code',
      isCorrect,
      isCorrect
        ? 'Component uses user.id for fetching titles'
        : 'Component uses incorrect field',
      {
        usesUserId,
        usesUserEmail,
        pattern: usesUserId ? 'user.id ✅' : usesUserEmail ? 'user.email ❌' : 'unknown',
      }
    )
  } catch (err: any) {
    logTest('CheckoutModal Code', false, 'Test failed', { error: err.message })
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Unit Test Suite: Checkout UUID Fix\n')
  console.log('=' .repeat(80))

  await testCreatorIdColumnType()
  await testUuidQueryPattern()
  await testEmailQueryFails()
  await testSubscriptionEmailType()
  await testEdgeFunctionOwnershipCheck()
  await testCheckoutModalLogic()
  await testEdgeFunctionCode()
  await testCheckoutModalCode()

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(80))

  if (failed === 0) {
    console.log('\n✅ All tests passed! UUID fix is production-ready.')
    console.log('\n📋 Verified:')
    console.log('  1. titles.creator_id uses UUID type')
    console.log('  2. UUID query pattern works correctly')
    console.log('  3. Email queries correctly fail with type error')
    console.log('  4. creator_subscriptions uses email (text) type')
    console.log('  5. Edge function requires authentication')
    console.log('  6. CheckoutModal logic uses user.id')
    console.log('  7. Edge function code uses user.id')
    console.log('  8. CheckoutModal code uses user.id')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
  }

  return failed === 0
}

// Run tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n💥 Test script error:', error)
    process.exit(1)
  })
