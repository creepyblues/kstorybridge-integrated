#!/usr/bin/env node

/**
 * Test OAuth User Structure vs Email User Structure
 * This investigates whether OAuth users have different data structure
 * that might cause profile creation to fail
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 Investigating OAuth vs Email User Differences')
console.log('================================================')

async function testUserStructures() {
  try {
    console.log('\n1. 📊 Checking existing users in auth.users (via user_creators)')
    
    // Get existing creator profiles to analyze user structure
    const { data: creators, error: creatorsError } = await supabase
      .from('user_creators')
      .select('id, email, created_at')
      .limit(5)
    
    if (creatorsError) {
      console.error('❌ Error fetching creators:', creatorsError.message)
    } else {
      console.log(`✅ Found ${creators.length} existing creator profiles`)
      creators.forEach((creator, index) => {
        console.log(`   ${index + 1}. ID: ${creator.id} | Email: ${creator.email}`)
        console.log(`      ID Format: ${creator.id.includes('-') ? 'UUID' : 'Other'}`)
        console.log(`      Created: ${creator.created_at}`)
      })
    }

    console.log('\n2. 🔍 Testing Profile Creation with Mock OAuth User ID')
    
    // Test with OAuth-style user ID (from your token)
    const mockOAuthUserId = 'fde1d173-33bd-40fb-9ba9-9bef6e293c6'
    const mockEmail = 'test-oauth-creator@example.com'
    
    console.log('🧪 Mock OAuth User:', {
      id: mockOAuthUserId,
      email: mockEmail,
      idFormat: 'UUID',
      provider: 'google'
    })
    
    // Test 1: Direct INSERT (should fail with RLS)
    console.log('\n   Test A: Direct INSERT (expecting RLS failure)')
    const { data: insertData, error: insertError } = await supabase
      .from('user_creators')
      .insert([{
        id: mockOAuthUserId,
        email: mockEmail,
        full_name: 'Test OAuth Creator',
        pen_name: 'Test Writer',
        ip_owner_role: 'author',
        ip_owner_company: 'Independent'
      }])
      .select()
    
    if (insertError) {
      if (insertError.code === '42501') {
        console.log('   ✅ Expected RLS error (policies working correctly)')
      } else if (insertError.code === '23505') {
        console.log('   ⚠️  Duplicate key error (user already exists)')
      } else {
        console.log(`   ❌ Unexpected error: ${insertError.code} - ${insertError.message}`)
      }
    } else {
      console.log('   ⚠️  Unexpected success (RLS might be disabled)')
    }

    console.log('\n3. 🔍 Checking Database Constraints')
    
    // Check user_creators table structure
    console.log('\n   Checking table constraints...')
    
    // Test various potential issues
    const testCases = [
      {
        name: 'Empty pen_name',
        data: { id: crypto.randomUUID(), email: 'test1@example.com', full_name: 'Test', pen_name: '', ip_owner_role: 'author' }
      },
      {
        name: 'NULL pen_name', 
        data: { id: crypto.randomUUID(), email: 'test2@example.com', full_name: 'Test', pen_name: null, ip_owner_role: 'author' }
      },
      {
        name: 'Invalid role',
        data: { id: crypto.randomUUID(), email: 'test3@example.com', full_name: 'Test', pen_name: 'Writer', ip_owner_role: 'invalid_role' }
      },
      {
        name: 'Long email',
        data: { id: crypto.randomUUID(), email: 'a'.repeat(300) + '@example.com', full_name: 'Test', pen_name: 'Writer', ip_owner_role: 'author' }
      }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`)
      const { error } = await supabase
        .from('user_creators')
        .insert([testCase.data])
        .select()
      
      if (error) {
        if (error.code === '42501') {
          console.log(`   ✅ RLS blocked (expected)`)
        } else {
          console.log(`   ❌ Constraint violation: ${error.code} - ${error.message}`)
        }
      }
    }

    console.log('\n4. 🔍 Potential OAuth-Specific Issues')
    console.log('   Possible causes of OAuth failure:')
    console.log('   • User ID format differences (UUID vs other)')
    console.log('   • Email domain restrictions') 
    console.log('   • Metadata structure differences')
    console.log('   • Provider-specific constraints')
    console.log('   • Timing issues with profile creation')
    console.log('   • Database triggers interfering with OAuth users')

  } catch (error) {
    console.error('❌ Test execution failed:', error)
  }
}

runTests()

async function runTests() {
  await testUserStructures()
  
  console.log('\n📋 Investigation Summary:')
  console.log('========================')
  console.log('Next steps to investigate:')
  console.log('1. Check if OAuth users have different metadata structure')
  console.log('2. Verify if database triggers handle OAuth users differently') 
  console.log('3. Test with exact OAuth user data from real authentication')
  console.log('4. Check for email domain restrictions on OAuth users')
  console.log('5. Investigate timing issues between OAuth completion and profile creation')
}