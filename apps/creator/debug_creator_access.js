#!/usr/bin/env node

/**
 * Debug Creator Access Issue
 * Investigate why hyobinsungho@gmail.com is being treated as buyer
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 Debug Creator Access Issue')
console.log('============================')

async function debugCreatorAccess() {
  const email = 'hyobinsungho@gmail.com'
  
  console.log(`\n1. 📊 Investigating user: ${email}`)
  
  console.log('\n2. 🔍 Checking user_buyers table...')
  try {
    const { data: buyerData, error: buyerError } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    
    if (buyerError) {
      console.log('   ❌ Buyer query error:', buyerError.message)
    } else if (buyerData) {
      console.log('   🚨 FOUND BUYER PROFILE:', {
        id: buyerData.id,
        email: buyerData.email,
        full_name: buyerData.full_name,
        tier: buyerData.tier,
        created_at: buyerData.created_at
      })
    } else {
      console.log('   ✅ No buyer profile found')
    }
  } catch (error) {
    console.log('   ❌ Exception in buyer query:', error.message)
  }
  
  console.log('\n3. 🔍 Checking user_creators table...')
  try {
    const { data: creatorData, error: creatorError } = await supabase
      .from('user_creators')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    
    if (creatorError) {
      console.log('   ❌ Creator query error:', creatorError.message)
    } else if (creatorData) {
      console.log('   ✅ FOUND CREATOR PROFILE:', {
        id: creatorData.id,
        email: creatorData.email,
        full_name: creatorData.full_name,
        pen_name: creatorData.pen_name,
        created_at: creatorData.created_at
      })
    } else {
      console.log('   ❌ No creator profile found')
    }
  } catch (error) {
    console.log('   ❌ Exception in creator query:', error.message)
  }
  
  console.log('\n4. 🔍 Simulating account type detection logic...')
  
  // Check what profiles exist
  const [buyerCheck, creatorCheck] = await Promise.all([
    supabase.from('user_buyers').select('id').eq('email', email).maybeSingle(),
    supabase.from('user_creators').select('id').eq('email', email).maybeSingle()
  ])
  
  console.log('   📋 Profile existence check:')
  console.log(`   - Buyer profile exists: ${!!buyerCheck.data}`)
  console.log(`   - Creator profile exists: ${!!creatorCheck.data}`)
  
  if (buyerCheck.data && creatorCheck.data) {
    console.log('   🚨 DUPLICATE PROFILES DETECTED!')
    console.log('   This is why the user is being treated as buyer (buyer lookup comes first)')
    
    console.log('\n5. 💡 Recommended fix:')
    console.log('   Remove the duplicate buyer profile for this creator user')
    console.log(`   DELETE FROM user_buyers WHERE email = '${email}';`)
    
  } else if (buyerCheck.data && !creatorCheck.data) {
    console.log('   ⚠️  User has ONLY buyer profile but should be creator')
    console.log('   Need to investigate why creator profile was not created')
    
  } else if (!buyerCheck.data && creatorCheck.data) {
    console.log('   ✅ Correct profile setup - only creator profile exists')
    console.log('   Issue might be in account type detection logic')
    
  } else {
    console.log('   ❌ No profiles found - this should not happen for existing user')
  }
  
  console.log('\n6. 🔧 Account Type Detection Priority:')
  console.log('   1. User metadata (OAuth flows)')
  console.log('   2. Database buyer lookup (CHECKED FIRST)')
  console.log('   3. Database creator lookup (checked second)')
  console.log('   4. Default to buyer')
  console.log('')
  console.log('   The issue: If both profiles exist, buyer is always chosen!')
  
  console.log('\n7. 📝 Solution Steps:')
  console.log('   A. Remove duplicate buyer profile')
  console.log('   B. Verify only creator profile remains')
  console.log('   C. Test account type detection')
  console.log('   D. Ensure user routes to /creators/home')
}

debugCreatorAccess().catch(console.error)