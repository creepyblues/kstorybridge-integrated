#!/usr/bin/env node

/**
 * Fix Creator Profile via Edge Function
 * Uses the create-creator-profile edge function to properly create missing profile
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔧 Fix Creator Profile via Edge Function')
console.log('=======================================')

async function fixCreatorProfile() {
  const email = 'hyobinsungho@gmail.com'
  
  console.log(`\n1. 📊 Attempting to fix creator profile for: ${email}`)
  
  // We need the user ID from auth.users, but we can't query it directly
  // We'll need to use a placeholder or get it from admin panel
  
  // For now, let's try to call the edge function with the known email
  // The edge function should be able to find the user by email
  
  console.log('\n2. 🚀 Calling create-creator-profile edge function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('create-creator-profile', {
      body: {
        // We don't have the userId directly, so we'll need to modify the edge function
        // to accept email-based lookup, or get the ID from admin panel
        email: email,
        fullName: 'Hyobin Lim',
        penName: 'Hyobin',
        ipOwnerRole: 'author', // default
        ipOwnerCompany: null,
        websiteUrl: null
      }
    })
    
    if (error) {
      console.log('   ❌ Edge function error:', error)
      console.log('\n3. 💡 Alternative approach needed:')
      console.log('   The edge function expects userId, but we need to look it up.')
      console.log('   Manual steps required:')
      console.log('')
      console.log('   A. Go to Supabase Dashboard > Authentication > Users')
      console.log(`   B. Find user: ${email}`)
      console.log('   C. Copy their UUID')
      console.log('   D. Run this SQL in Supabase SQL Editor:')
      console.log(`
   INSERT INTO user_creators (
     id,
     email,
     full_name,
     pen_name,
     invitation_status
   ) VALUES (
     'PASTE_USER_UUID_HERE'::uuid,
     '${email}',
     'Hyobin Lim',
     'Hyobin',
     'invited'
   ) ON CONFLICT (id) DO NOTHING;`)
   
    } else {
      console.log('   ✅ Edge function success:', data)
    }
  } catch (error) {
    console.log('   ❌ Exception calling edge function:', error.message)
  }
  
  console.log('\n4. 🔍 Verification - checking if profile now exists...')
  
  const { data: creatorProfile, error: creatorError } = await supabase
    .from('user_creators')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (creatorError) {
    console.log('   ❌ Error checking creator profile:', creatorError.message)
  } else if (creatorProfile) {
    console.log('   ✅ SUCCESS! Creator profile now exists:', {
      id: creatorProfile.id,
      email: creatorProfile.email,
      full_name: creatorProfile.full_name,
      pen_name: creatorProfile.pen_name
    })
  } else {
    console.log('   ❌ Creator profile still not found')
  }
  
  console.log('\n5. 🎯 Next steps after profile creation:')
  console.log('   A. User should refresh the dashboard page')
  console.log('   B. Account type detection should find creator profile')
  console.log('   C. User should be redirected to /creators/home')
  console.log('   D. Account type should show "Creator" in UI')
  
  console.log('\n6. 🔧 Root cause investigation:')
  console.log('   - Database trigger failed during OAuth signup')
  console.log('   - Need to test trigger is working: INSERT test user')
  console.log('   - Check trigger exists and is enabled')
  console.log('   - Verify RLS policies allow trigger operations')
}

fixCreatorProfile().catch(console.error)