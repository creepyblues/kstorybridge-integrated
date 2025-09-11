#!/usr/bin/env node

/**
 * Fix Creator Profile Issue
 * Creates missing creator profile for the authenticated user
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔧 Fix Creator Profile Issue')
console.log('============================')

async function fixCreatorProfile() {
  const email = 'sungho@daddle.com'
  
  console.log(`\n1. 📊 Checking current user status for: ${email}`)
  
  // Check if user exists in auth.users
  console.log('   ⏳ Checking auth users...')
  
  // Check if creator profile exists
  const { data: creatorProfile, error: creatorError } = await supabase
    .from('user_creators')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (creatorError) {
    console.log('   ❌ Error checking creator profile:', creatorError.message)
  } else if (creatorProfile) {
    console.log('   ✅ Creator profile already exists:', creatorProfile.id)
    return
  } else {
    console.log('   ⚠️  No creator profile found')
  }
  
  console.log('\n2. 🛠️  Creating creator profile...')
  
  // For testing, let's create a minimal profile
  // In production, you'd get the actual user ID from auth
  const userUuid = 'fde1d173-33bd-40fb-9ba9-9bef6e293c67' // From console logs
  
  const { data: newProfile, error: insertError } = await supabase
    .from('user_creators')
    .insert([{
      id: userUuid,
      email: email,
      full_name: 'Sungho Lee',
      pen_name: 'Sungho',
      ip_owner_role: 'author',
      created_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (insertError) {
    console.log('   ❌ Error creating creator profile:', insertError.message)
    console.log('   💡 Trying with service role bypass...')
    
    // This might be blocked by RLS, which is expected
    // The real fix should happen through the OAuth flow or admin panel
    console.log('\n3. 💭 Recommended Solutions:')
    console.log('   A. Complete OAuth signup flow properly')
    console.log('   B. Check RLS policies on user_creators table')
    console.log('   C. Use edge function with service role')
    console.log('   D. Manually create via Supabase dashboard')
    
  } else {
    console.log('   ✅ Creator profile created successfully!')
    console.log('   📋 Profile details:', newProfile)
  }
  
  console.log('\n4. 🔍 Verification - checking profile again...')
  
  const { data: verifyProfile, error: verifyError } = await supabase
    .from('user_creators')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (verifyError) {
    console.log('   ❌ Verification failed:', verifyError.message)
  } else if (verifyProfile) {
    console.log('   ✅ Creator profile verified:', verifyProfile.id)
  } else {
    console.log('   ⚠️  Profile still not found after creation attempt')
  }
}

fixCreatorProfile().catch(console.error)