#!/usr/bin/env node

/**
 * Create Test Accounts Script
 *
 * Automatically creates test user accounts in Supabase for E2E testing.
 * Requires Supabase service role key (admin access).
 *
 * Usage:
 *   node tests/scripts/create-test-accounts.js
 *
 * Environment variables required:
 *   SUPABASE_SERVICE_ROLE_KEY - Admin key from Supabase dashboard
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Test account configurations
const TEST_ACCOUNTS = {
  buyer: {
    email: 'test-buyer@kstorybridge-test.com',
    password: generateSecurePassword(),
    profile: {
      full_name: 'Test Buyer Account',
      buyer_company: 'Test Company Inc',
      buyer_role: 'Content Acquisition',
      tier: 'basic',
      requested: false
    }
  },
  creator: {
    email: 'test-creator@kstorybridge-test.com',
    password: generateSecurePassword(),
    profile: {
      full_name: 'Test Creator Account',
      pen_name: 'Test Author',
      ip_owner_role: 'author',
      invitation_status: 'active'
    }
  }
}

function generateSecurePassword() {
  // Generate a secure random password
  return `Test${randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}!`
}

async function main() {
  console.log('🚀 Creating test accounts for E2E testing...\n')

  // Check for service role key
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set')
    console.log('\nTo get your service role key:')
    console.log('1. Go to: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api')
    console.log('2. Copy the "service_role" key (not the anon key)')
    console.log('3. Run: export SUPABASE_SERVICE_ROLE_KEY="your-key-here"')
    console.log('4. Run this script again\n')
    process.exit(1)
  }

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const results = {
    buyer: null,
    creator: null,
    errors: []
  }

  // Create buyer test account
  console.log('👤 Creating buyer test account...')
  try {
    results.buyer = await createBuyerAccount(supabase, TEST_ACCOUNTS.buyer)
    console.log('✅ Buyer account created successfully')
  } catch (error) {
    console.error('❌ Failed to create buyer account:', error.message)
    results.errors.push({ type: 'buyer', error: error.message })
  }

  console.log('')

  // Create creator test account
  console.log('✍️  Creating creator test account...')
  try {
    results.creator = await createCreatorAccount(supabase, TEST_ACCOUNTS.creator)
    console.log('✅ Creator account created successfully')
  } catch (error) {
    console.error('❌ Failed to create creator account:', error.message)
    results.errors.push({ type: 'creator', error: error.message })
  }

  console.log('\n' + '='.repeat(70))
  console.log('📋 RESULTS')
  console.log('='.repeat(70) + '\n')

  if (results.buyer) {
    console.log('✅ Buyer Account:')
    console.log(`   Email:    ${TEST_ACCOUNTS.buyer.email}`)
    console.log(`   Password: ${TEST_ACCOUNTS.buyer.password}`)
    console.log(`   User ID:  ${results.buyer.userId}`)
    console.log('')
  }

  if (results.creator) {
    console.log('✅ Creator Account:')
    console.log(`   Email:    ${TEST_ACCOUNTS.creator.email}`)
    console.log(`   Password: ${TEST_ACCOUNTS.creator.password}`)
    console.log(`   User ID:  ${results.creator.userId}`)
    console.log('')
  }

  if (results.errors.length > 0) {
    console.log('⚠️  Errors:')
    results.errors.forEach(err => {
      console.log(`   - ${err.type}: ${err.error}`)
    })
    console.log('')
  }

  // Generate .env.test configuration
  console.log('='.repeat(70))
  console.log('📝 .env.test CONFIGURATION')
  console.log('='.repeat(70) + '\n')

  if (results.buyer && results.creator) {
    console.log('Copy these values to your .env.test file:\n')
    console.log('TEST_ENV=staging')
    console.log(`TEST_BUYER_EMAIL=${TEST_ACCOUNTS.buyer.email}`)
    console.log(`TEST_BUYER_PASSWORD=${TEST_ACCOUNTS.buyer.password}`)
    console.log(`TEST_CREATOR_EMAIL=${TEST_ACCOUNTS.creator.email}`)
    console.log(`TEST_CREATOR_PASSWORD=${TEST_ACCOUNTS.creator.password}`)
    console.log('')

    // Offer to create .env.test automatically
    console.log('💡 To save these automatically, run:')
    console.log('   node tests/scripts/create-test-accounts.js > .env.test.generated')
    console.log('   # Then manually review and rename to .env.test')
  } else {
    console.log('⚠️  Some accounts failed to create. Fix errors and run again.')
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ DONE')
  console.log('='.repeat(70) + '\n')

  if (results.buyer && results.creator) {
    console.log('Next steps:')
    console.log('1. Copy credentials to .env.test')
    console.log('2. Run tests: npm run test:e2e:staging')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

async function createBuyerAccount(supabase, config) {
  // Step 1: Create auth user
  console.log('   Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: config.email,
    password: config.password,
    email_confirm: true,
    user_metadata: {
      account_type: 'buyer',
      full_name: config.profile.full_name
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('   ⚠️  Auth user already exists, continuing...')
      // Try to get existing user
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === config.email)
      if (!existingUser) {
        throw new Error('User exists but could not retrieve user ID')
      }
      authData.user = existingUser
    } else {
      throw authError
    }
  }

  const userId = authData.user.id
  console.log(`   Auth user created: ${userId}`)

  // Step 2: Insert into user_buyers table
  console.log('   Adding to user_buyers table...')
  const { error: buyerError } = await supabase
    .from('user_buyers')
    .upsert({
      email: config.email,
      ...config.profile
    }, {
      onConflict: 'email'
    })

  if (buyerError) {
    console.error('   ⚠️  Warning: Failed to insert into user_buyers:', buyerError.message)
    // Don't throw, auth user is already created
  }

  // Step 3: Verify
  console.log('   Verifying account...')
  const { data: buyerData, error: verifyError } = await supabase
    .from('user_buyers')
    .select('email, full_name, tier')
    .eq('email', config.email)
    .single()

  if (verifyError) {
    throw new Error(`Verification failed: ${verifyError.message}`)
  }

  return {
    userId,
    profile: buyerData
  }
}

async function createCreatorAccount(supabase, config) {
  // Step 1: Create auth user
  console.log('   Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: config.email,
    password: config.password,
    email_confirm: true,
    user_metadata: {
      account_type: 'creator',
      full_name: config.profile.full_name,
      pen_name: config.profile.pen_name
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('   ⚠️  Auth user already exists, continuing...')
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === config.email)
      if (!existingUser) {
        throw new Error('User exists but could not retrieve user ID')
      }
      authData.user = existingUser
    } else {
      throw authError
    }
  }

  const userId = authData.user.id
  console.log(`   Auth user created: ${userId}`)

  // Step 2: Insert into user_creators table
  console.log('   Adding to user_creators table...')
  const { error: creatorError } = await supabase
    .from('user_creators')
    .upsert({
      email: config.email,
      ...config.profile
    }, {
      onConflict: 'email'
    })

  if (creatorError) {
    console.error('   ⚠️  Warning: Failed to insert into user_creators:', creatorError.message)
  }

  // Step 3: Verify
  console.log('   Verifying account...')
  const { data: creatorData, error: verifyError } = await supabase
    .from('user_creators')
    .select('email, full_name, pen_name, ip_owner_role')
    .eq('email', config.email)
    .single()

  if (verifyError) {
    throw new Error(`Verification failed: ${verifyError.message}`)
  }

  return {
    userId,
    profile: creatorData
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
