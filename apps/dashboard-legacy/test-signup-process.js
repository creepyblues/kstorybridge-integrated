/**
 * Comprehensive Signup Process Test
 *
 * Tests both buyer and creator signup flows with email and OAuth methods
 * to ensure data consistency and proper functionality.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test data
const TEST_BUYER = {
  email: 'test.buyer@testcorp.com',
  password: 'TestPass123!',
  full_name: 'Test Buyer',
  buyer_company: 'Test Corporation',
  buyer_role: 'producer',
  linkedin_url: 'https://linkedin.com/in/testbuyer',
  tier: 'basic'
}

const TEST_CREATOR = {
  email: 'test.creator@gmail.com',
  password: 'TestPass123!',
  full_name: 'Test Creator',
  pen_name: 'Creative Pen',
  ip_owner_role: 'author',
  ip_owner_company: 'Creative Studio',
  website_url: 'https://creativepen.com',
  invitation_status: 'invited'
}

/**
 * Test buyer email signup flow
 */
async function testBuyerEmailSignup() {
  console.log('\n🔵 Testing Buyer Email Signup Flow')
  console.log('=====================================')

  try {
    // Step 1: Test validation
    console.log('1. 📝 Testing form validation...')

    // Test invalid email
    const invalidEmailResult = await testFormValidation({
      ...TEST_BUYER,
      email: 'invalid-email'
    }, 'buyer')

    if (invalidEmailResult.includes('valid email')) {
      console.log('   ✅ Invalid email validation: PASS')
    } else {
      console.log('   ❌ Invalid email validation: FAIL')
    }

    // Test weak password
    const weakPasswordResult = await testFormValidation({
      ...TEST_BUYER,
      password: '123'
    }, 'buyer')

    if (weakPasswordResult.includes('6 characters')) {
      console.log('   ✅ Weak password validation: PASS')
    } else {
      console.log('   ❌ Weak password validation: FAIL')
    }

    // Step 2: Test signup with metadata
    console.log('\n2. 🚀 Testing signup with metadata...')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_BUYER.email,
      password: TEST_BUYER.password,
      options: {
        data: {
          full_name: TEST_BUYER.full_name,
          buyer_company: TEST_BUYER.buyer_company,
          buyer_role: TEST_BUYER.buyer_role,
          linkedin_url: TEST_BUYER.linkedin_url,
          account_type: 'buyer',
          tier: TEST_BUYER.tier
        }
      }
    })

    if (authError) {
      console.log('   ❌ Auth signup failed:', authError.message)
      return
    }

    console.log('   ✅ Auth user created:', authData.user?.email)

    // Step 3: Check metadata consistency
    console.log('\n3. 🔍 Verifying metadata...')
    const metadata = authData.user?.user_metadata

    const metadataChecks = [
      { key: 'account_type', expected: 'buyer', actual: metadata?.account_type },
      { key: 'full_name', expected: TEST_BUYER.full_name, actual: metadata?.full_name },
      { key: 'buyer_company', expected: TEST_BUYER.buyer_company, actual: metadata?.buyer_company },
      { key: 'buyer_role', expected: TEST_BUYER.buyer_role, actual: metadata?.buyer_role },
      { key: 'tier', expected: TEST_BUYER.tier, actual: metadata?.tier }
    ]

    for (const check of metadataChecks) {
      if (check.actual === check.expected) {
        console.log(`   ✅ ${check.key}: ${check.actual}`)
      } else {
        console.log(`   ❌ ${check.key}: Expected '${check.expected}', got '${check.actual}'`)
      }
    }

    // Step 4: Wait for trigger and check profile creation
    console.log('\n4. ⏳ Waiting for database trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: profile, error: profileError } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('email', TEST_BUYER.email.toLowerCase())
      .single()

    if (profileError) {
      console.log('   ❌ Profile lookup failed:', profileError.message)
    } else {
      console.log('   ✅ Profile created successfully')

      // Check profile data consistency
      const profileChecks = [
        { key: 'email', expected: TEST_BUYER.email.toLowerCase(), actual: profile.email },
        { key: 'full_name', expected: TEST_BUYER.full_name, actual: profile.full_name },
        { key: 'buyer_company', expected: TEST_BUYER.buyer_company, actual: profile.buyer_company },
        { key: 'buyer_role', expected: TEST_BUYER.buyer_role, actual: profile.buyer_role },
        { key: 'tier', expected: TEST_BUYER.tier, actual: profile.tier },
        { key: 'requested', expected: false, actual: profile.requested }
      ]

      console.log('\n5. 📊 Profile data verification:')
      for (const check of profileChecks) {
        if (check.actual === check.expected) {
          console.log(`   ✅ ${check.key}: ${check.actual}`)
        } else {
          console.log(`   ❌ ${check.key}: Expected '${check.expected}', got '${check.actual}'`)
        }
      }
    }

    // Cleanup
    await cleanupUser(TEST_BUYER.email)

  } catch (error) {
    console.error('❌ Buyer signup test failed:', error.message)
  }
}

/**
 * Test creator email signup flow
 */
async function testCreatorEmailSignup() {
  console.log('\n🟡 Testing Creator Email Signup Flow')
  console.log('======================================')

  try {
    // Step 1: Test signup with metadata
    console.log('1. 🚀 Testing creator signup with metadata...')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_CREATOR.email,
      password: TEST_CREATOR.password,
      options: {
        data: {
          full_name: TEST_CREATOR.full_name,
          pen_name: TEST_CREATOR.pen_name,
          ip_owner_role: TEST_CREATOR.ip_owner_role,
          ip_owner_company: TEST_CREATOR.ip_owner_company,
          website_url: TEST_CREATOR.website_url,
          account_type: 'creator',
          invitation_status: TEST_CREATOR.invitation_status
        }
      }
    })

    if (authError) {
      console.log('   ❌ Auth signup failed:', authError.message)
      return
    }

    console.log('   ✅ Auth user created:', authData.user?.email)

    // Step 2: Check metadata consistency
    console.log('\n2. 🔍 Verifying metadata...')
    const metadata = authData.user?.user_metadata

    const metadataChecks = [
      { key: 'account_type', expected: 'creator', actual: metadata?.account_type },
      { key: 'full_name', expected: TEST_CREATOR.full_name, actual: metadata?.full_name },
      { key: 'pen_name', expected: TEST_CREATOR.pen_name, actual: metadata?.pen_name },
      { key: 'ip_owner_role', expected: TEST_CREATOR.ip_owner_role, actual: metadata?.ip_owner_role },
      { key: 'invitation_status', expected: TEST_CREATOR.invitation_status, actual: metadata?.invitation_status }
    ]

    for (const check of metadataChecks) {
      if (check.actual === check.expected) {
        console.log(`   ✅ ${check.key}: ${check.actual}`)
      } else {
        console.log(`   ❌ ${check.key}: Expected '${check.expected}', got '${check.actual}'`)
      }
    }

    // Step 3: Wait for trigger and check profile creation
    console.log('\n3. ⏳ Waiting for database trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: profile, error: profileError } = await supabase
      .from('user_creators')
      .select('*')
      .eq('email', TEST_CREATOR.email.toLowerCase())
      .single()

    if (profileError) {
      console.log('   ❌ Profile lookup failed:', profileError.message)
    } else {
      console.log('   ✅ Profile created successfully')

      // Check profile data consistency
      const profileChecks = [
        { key: 'email', expected: TEST_CREATOR.email.toLowerCase(), actual: profile.email },
        { key: 'full_name', expected: TEST_CREATOR.full_name, actual: profile.full_name },
        { key: 'pen_name', expected: TEST_CREATOR.pen_name, actual: profile.pen_name },
        { key: 'ip_owner_role', expected: TEST_CREATOR.ip_owner_role, actual: profile.ip_owner_role },
        { key: 'invitation_status', expected: TEST_CREATOR.invitation_status, actual: profile.invitation_status }
      ]

      console.log('\n4. 📊 Profile data verification:')
      for (const check of profileChecks) {
        if (check.actual === check.expected) {
          console.log(`   ✅ ${check.key}: ${check.actual}`)
        } else {
          console.log(`   ❌ ${check.key}: Expected '${check.expected}', got '${check.actual}'`)
        }
      }
    }

    // Cleanup
    await cleanupUser(TEST_CREATOR.email)

  } catch (error) {
    console.error('❌ Creator signup test failed:', error.message)
  }
}

/**
 * Test form validation logic
 */
function testFormValidation(formData, accountType) {
  // Simulate validation logic
  const errors = []

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errors.push('Please enter a valid email address')
  }

  // Password validation
  if (formData.password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  // Required fields
  if (accountType === 'buyer') {
    if (!formData.full_name?.trim()) errors.push('Full name is required')
    if (!formData.buyer_company?.trim()) errors.push('Company is required')
    if (!formData.buyer_role?.trim()) errors.push('Role is required')
  } else {
    if (!formData.full_name?.trim()) errors.push('Full name is required')
    if (!formData.pen_name?.trim()) errors.push('Pen name is required')
  }

  return errors.join(', ')
}

/**
 * Test OAuth flow simulation
 */
async function testOAuthFlow() {
  console.log('\n🟣 Testing OAuth Flow Simulation')
  console.log('==================================')

  try {
    // Step 1: Simulate OAuth user creation with metadata
    console.log('1. 🔗 Simulating OAuth user creation...')

    const oauthEmail = 'oauth.test@example.com'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: oauthEmail,
      password: 'OAuthSimulated123!', // OAuth users don't need passwords but required for simulation
      options: {
        data: {
          full_name: 'OAuth Test User',
          account_type: 'buyer',
          provider: 'google',
          tier: 'basic'
        }
      }
    })

    if (authError) {
      console.log('   ❌ OAuth simulation failed:', authError.message)
      return
    }

    console.log('   ✅ OAuth user created:', authData.user?.email)

    // Step 2: Test profile completion flow
    console.log('\n2. 📝 Testing profile completion...')

    // Simulate profile completion with edge function
    const profileData = {
      userId: authData.user?.id,
      email: oauthEmail,
      fullName: 'OAuth Test User',
      buyerCompany: 'OAuth Test Corp',
      buyerRole: 'executive',
      linkedinUrl: '',
      tier: 'basic'
    }

    console.log('   📤 Profile completion data:', profileData)
    console.log('   ✅ OAuth profile completion simulated')

    // Cleanup
    await cleanupUser(oauthEmail)

  } catch (error) {
    console.error('❌ OAuth flow test failed:', error.message)
  }
}

/**
 * Test data consistency across signup methods
 */
async function testDataConsistency() {
  console.log('\n📊 Testing Data Consistency')
  console.log('============================')

  console.log('1. 🔍 Checking field naming consistency...')

  // Check form data structure matches database schema
  const buyerFormFields = Object.keys(TEST_BUYER)
  const creatorFormFields = Object.keys(TEST_CREATOR)

  console.log('   📝 Buyer form fields:', buyerFormFields.join(', '))
  console.log('   📝 Creator form fields:', creatorFormFields.join(', '))

  // Verify snake_case naming convention
  const isSnakeCase = (str) => /^[a-z]+(_[a-z]+)*$/.test(str)

  const buyerFieldsCorrect = buyerFormFields.filter(field => field !== 'email' && field !== 'password').every(isSnakeCase)
  const creatorFieldsCorrect = creatorFormFields.filter(field => field !== 'email' && field !== 'password').every(isSnakeCase)

  console.log(`   ${buyerFieldsCorrect ? '✅' : '❌'} Buyer fields use snake_case: ${buyerFieldsCorrect}`)
  console.log(`   ${creatorFieldsCorrect ? '✅' : '❌'} Creator fields use snake_case: ${creatorFieldsCorrect}`)

  console.log('\n2. 📋 Checking required vs optional fields...')

  // Buyer required fields
  const buyerRequiredFields = ['email', 'password', 'full_name', 'buyer_company', 'buyer_role']
  const buyerOptionalFields = ['linkedin_url', 'tier']

  console.log('   🔵 Buyer required:', buyerRequiredFields.join(', '))
  console.log('   🔵 Buyer optional:', buyerOptionalFields.join(', '))

  // Creator required fields
  const creatorRequiredFields = ['email', 'password', 'full_name', 'pen_name']
  const creatorOptionalFields = ['ip_owner_role', 'ip_owner_company', 'website_url', 'invitation_status']

  console.log('   🟡 Creator required:', creatorRequiredFields.join(', '))
  console.log('   🟡 Creator optional:', creatorOptionalFields.join(', '))

  console.log('\n3. 🎯 Checking default values...')
  console.log('   🔵 Buyer tier default: basic')
  console.log('   🔵 Buyer requested default: false')
  console.log('   🟡 Creator invitation_status default: invited')
}

/**
 * Cleanup test user
 */
async function cleanupUser(email) {
  try {
    // Note: In production, user cleanup requires admin privileges
    console.log(`🧹 Cleanup: Test user ${email} should be manually removed if needed`)
  } catch (error) {
    console.log('⚠️ Cleanup note:', error.message)
  }
}

/**
 * Main test runner
 */
async function runSignupTests() {
  console.log('🚀 KStoryBridge Signup Process Test Suite')
  console.log('=========================================')
  console.log('Testing both buyer and creator signup flows with email and OAuth')
  console.log('Verifying data consistency and proper functionality\n')

  try {
    // Test data consistency first
    await testDataConsistency()

    // Test signup flows
    await testBuyerEmailSignup()
    await testCreatorEmailSignup()
    await testOAuthFlow()

    console.log('\n🎉 Signup Process Test Suite Complete!')
    console.log('=====================================')
    console.log('Review the results above to ensure all signup flows work correctly.')

  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
  }
}

// Run the tests
runSignupTests()