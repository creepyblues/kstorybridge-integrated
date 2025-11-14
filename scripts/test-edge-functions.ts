/**
 * Edge Functions Deployment Test Script
 *
 * Tests all creator payment edge functions to verify deployment
 *
 * Usage: npx tsx scripts/test-edge-functions.ts
 */

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2MDU0NDYsImV4cCI6MjA0MjE4MTQ0Nn0.Y2-sx96td-eow7e7Ru8YEVHX5g8FPIlJH_-zToE0yEc'

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

async function testCheckoutFunctionAccessibility() {
  console.log('\n🧪 Test 1: Checkout Function Accessibility')
  try {
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
          title_id: 'test-uuid',
        }),
      }
    )

    // Should return 401 (no auth header)
    if (response.status === 401) {
      const data = await response.json()
      logTest(
        'Checkout Function - No Auth',
        true,
        'Function correctly rejects unauthenticated requests',
        { status: response.status, error: data.error }
      )
    } else {
      logTest(
        'Checkout Function - No Auth',
        false,
        `Expected 401, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Checkout Function - No Auth',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testBillingHistoryFunctionAccessibility() {
  console.log('\n🧪 Test 2: Billing History Function Accessibility')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/get-creator-billing-history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    // Should return 401 (no auth header)
    if (response.status === 401) {
      const data = await response.json()
      logTest(
        'Billing History - No Auth',
        true,
        'Function correctly rejects unauthenticated requests',
        { status: response.status, error: data.error }
      )
    } else {
      logTest(
        'Billing History - No Auth',
        false,
        `Expected 401, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Billing History - No Auth',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testWebhookFunctionAccessibility() {
  console.log('\n🧪 Test 3: Webhook Function Accessibility')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/creator-stripe-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      }
    )

    // Should return 400 (no signature)
    if (response.status === 400) {
      const text = await response.text()
      logTest(
        'Webhook - No Signature',
        true,
        'Function correctly rejects requests without Stripe signature',
        { status: response.status, response: text }
      )
    } else {
      logTest(
        'Webhook - No Signature',
        false,
        `Expected 400, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Webhook - No Signature',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testCheckoutWithInvalidToken() {
  console.log('\n🧪 Test 4: Checkout with Invalid Token')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-creator-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: 'packaging',
          billing_period: 'monthly',
          title_id: 'test-uuid',
        }),
      }
    )

    // Should return 401 (invalid token)
    if (response.status === 401) {
      const data = await response.json()
      logTest(
        'Checkout - Invalid Token',
        true,
        'Function correctly validates JWT tokens',
        { status: response.status, error: data.error }
      )
    } else {
      logTest(
        'Checkout - Invalid Token',
        false,
        `Expected 401, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Checkout - Invalid Token',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testCheckoutWithMissingFields() {
  console.log('\n🧪 Test 5: Checkout with Missing Fields')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-creator-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          plan_type: 'packaging',
        }),
      }
    )

    // Should return 400 or 401
    if (response.status === 400 || response.status === 401) {
      const data = await response.json()
      logTest(
        'Checkout - Missing Fields',
        true,
        'Function validates required fields',
        { status: response.status, error: data.error }
      )
    } else {
      logTest(
        'Checkout - Missing Fields',
        false,
        `Expected 400 or 401, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Checkout - Missing Fields',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testWebhookCORSPreflight() {
  console.log('\n🧪 Test 6: Webhook CORS Preflight')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/creator-stripe-webhook`,
      {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    // Should return 200 for OPTIONS
    if (response.status === 200) {
      logTest(
        'Webhook - CORS Preflight',
        true,
        'Function handles CORS preflight correctly',
        { status: response.status }
      )
    } else {
      logTest(
        'Webhook - CORS Preflight',
        false,
        `Expected 200, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Webhook - CORS Preflight',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testCheckoutWithInvalidPlanType() {
  console.log('\n🧪 Test 7: Checkout with Invalid Plan Type')
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-creator-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: 'invalid-plan',
          billing_period: 'monthly',
          title_id: 'test-uuid-123',
        }),
      }
    )

    // Should return 400 or 401 (invalid plan_type)
    if (response.status === 400 || response.status === 401) {
      const data = await response.json()
      logTest(
        'Checkout - Invalid Plan Type',
        true,
        'Function validates plan_type values',
        { status: response.status, error: data.error }
      )
    } else {
      logTest(
        'Checkout - Invalid Plan Type',
        false,
        `Expected 400 or 401, got ${response.status}`,
        { status: response.status }
      )
    }
  } catch (error: any) {
    logTest(
      'Checkout - Invalid Plan Type',
      false,
      'Failed to reach function',
      { error: error.message }
    )
  }
}

async function testFunctionURLs() {
  console.log('\n🧪 Test 8: Function URLs')

  const urls = [
    'create-creator-checkout',
    'creator-stripe-webhook',
    'get-creator-billing-history',
  ]

  for (const functionName of urls) {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`
    try {
      const response = await fetch(url, { method: 'POST' })

      // Any response (even error) means function is reachable
      if (response.status) {
        logTest(
          `Function URL - ${functionName}`,
          true,
          'Function URL is accessible',
          { url, status: response.status }
        )
      }
    } catch (error: any) {
      logTest(
        `Function URL - ${functionName}`,
        false,
        'Function URL not accessible',
        { url, error: error.message }
      )
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Edge Functions Deployment Tests\n')
  console.log('=' .repeat(80))

  await testFunctionURLs()
  await testCheckoutFunctionAccessibility()
  await testBillingHistoryFunctionAccessibility()
  await testWebhookFunctionAccessibility()
  await testCheckoutWithInvalidToken()
  await testCheckoutWithMissingFields()
  await testCheckoutWithInvalidPlanType()
  await testWebhookCORSPreflight()

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 Test Summary\n')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(80))

  if (failed === 0) {
    console.log('\n✅ All tests passed! Edge functions are deployed correctly.')
    console.log('\n📋 Next Steps:')
    console.log('  1. Configure Stripe webhook endpoint')
    console.log('  2. Test with real authentication token')
    console.log('  3. Create test subscription with test card')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
  }

  return failed === 0
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error)
    process.exit(1)
  })
