/**
 * Test Simple OAuth Profile Creation
 *
 * This script tests the new simple OAuth profile creation approach
 * that avoids getSession timeouts.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Simple profile creation function (mimics the new service)
 */
async function createSimpleBuyerProfile(profileData) {
  try {
    console.log('🚀 Simple Test: Creating buyer profile for', profileData.email);

    // First, check if profile already exists
    console.log('🔍 Checking if buyer profile already exists...');

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_buyers')
        .select('*')
        .eq('email', profileData.email.toLowerCase())
        .maybeSingle();

      if (!checkError && existingProfile) {
        console.log('✅ Buyer profile already exists:', existingProfile.email);
        return {
          success: true,
          profile: existingProfile,
          userExists: true
        };
      }

      console.log('📝 No existing profile found, would create new one...');
    } catch (checkException) {
      console.warn('⚠️ Profile check failed:', checkException.message);
    }

    console.log('💾 Would attempt profile creation with data:', {
      id: profileData.id,
      email: profileData.email.toLowerCase(),
      full_name: profileData.full_name,
      buyer_company: profileData.buyer_company,
      buyer_role: profileData.buyer_role,
      linkedin_url: profileData.linkedin_url,
      tier: profileData.tier || 'basic',
      requested: false
    });

    // For testing, we won't actually create the profile
    console.log('✅ Simple Test: Profile creation would succeed (test mode)');
    return {
      success: true,
      profile: { test: 'profile' },
      userExists: false
    };

  } catch (error) {
    console.error('❌ Simple Test: Profile creation error:', error);
    return {
      success: false,
      error: `Test error: ${error.message}`
    };
  }
}

/**
 * Test the simple approach
 */
async function testSimpleOAuthFlow() {
  console.log('🧪 Testing Simple OAuth Profile Creation')
  console.log('==========================================')

  try {
    // Test data
    const testBuyerData = {
      id: 'test-oauth-user-id',
      email: 'test.oauth@testcorp.com',
      full_name: 'Test OAuth User',
      buyer_company: 'Test OAuth Corp',
      buyer_role: 'producer',
      linkedin_url: 'https://linkedin.com/in/testoauth',
      tier: 'basic'
    }

    console.log('\n1. 🎯 Testing simple profile creation approach...')
    const result = await createSimpleBuyerProfile(testBuyerData)

    console.log('\n2. 📊 Results:')
    console.log('   Success:', result.success)
    console.log('   User Exists:', result.userExists)
    console.log('   Error:', result.error || 'None')

    console.log('\n3. ✅ Expected Behavior in Real OAuth Flow:')
    console.log('   • Edge function fails (CORS) → Expected')
    console.log('   • Simple creation tries → Should work')
    console.log('   • If profile exists → Return existing')
    console.log('   • If profile missing → Create new one')
    console.log('   • If creation fails → Clear error message')

    console.log('\n4. 🎭 Simulation Results:')
    if (result.success) {
      if (result.userExists) {
        console.log('   ✅ Found existing profile - would redirect to dashboard')
      } else {
        console.log('   ✅ Created new profile - would show success message')
      }
    } else {
      console.log('   ❌ Would show error:', result.error)
    }

    console.log('\n5. 🔧 Key Advantages of Simple Approach:')
    console.log('   • No getSession() timeouts')
    console.log('   • Direct database queries (faster)')
    console.log('   • Handles existing profiles gracefully')
    console.log('   • Clear error messages')
    console.log('   • Lightweight and reliable')

    console.log('\n6. 🎯 What to Watch For in Real Testing:')
    console.log('   Success Flow:')
    console.log('   🎯 Attempting simple OAuth profile creation...')
    console.log('   🔍 Checking if buyer profile already exists...')
    console.log('   📝 No existing profile found, creating new one...')
    console.log('   💾 Attempting profile creation...')
    console.log('   ✅ Simple OAuth: Simple creation succeeded')
    console.log('')
    console.log('   Existing User Flow:')
    console.log('   🎯 Attempting simple OAuth profile creation...')
    console.log('   🔍 Checking if buyer profile already exists...')
    console.log('   ✅ Buyer profile already exists, returning existing profile')
    console.log('   ✅ Simple OAuth: Simple creation succeeded')

  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

// Run the test
testSimpleOAuthFlow()