#!/usr/bin/env node

/**
 * Debug Auth User Metadata
 * Check if user exists in auth.users and their metadata
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 Debug Auth User Metadata')
console.log('===========================')

async function debugAuthUser() {
  const email = 'hyobinsungho@gmail.com'
  
  console.log(`\n1. 📊 Checking auth.users for: ${email}`)
  
  try {
    // We can't directly query auth.users with anon key, but we can check
    // if a user is currently signed in and get their data
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && user.email === email) {
      console.log('   ✅ Found current authenticated user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        provider: user.app_metadata?.provider,
        account_type: user.user_metadata?.account_type,
        full_name: user.user_metadata?.full_name,
        pen_name: user.user_metadata?.pen_name
      })
      
      console.log('\n   🔍 Full user metadata:', user.user_metadata)
      console.log('   🔍 Full app metadata:', user.app_metadata)
      
      // Check if account_type is in metadata
      if (user.user_metadata?.account_type) {
        console.log(`   ✅ Account type in metadata: ${user.user_metadata.account_type}`)
      } else {
        console.log('   ❌ No account_type in user metadata!')
      }
      
      return user
    } else {
      console.log('   ❌ User not currently authenticated or different email')
      console.log('   💡 Note: Cannot query auth.users directly with anon key')
    }
  } catch (error) {
    console.log('   ❌ Error getting user:', error.message)
  }
  
  console.log('\n2. 🔧 Diagnosing the issue:')
  console.log('   Based on the fact that no profiles exist but user signed up successfully:')
  console.log('')
  console.log('   A. OAuth signup completed ✅')
  console.log('   B. User record created in auth.users ✅') 
  console.log('   C. Database trigger failed to create profile ❌')
  console.log('   D. Account type detection falls back to buyer ❌')
  console.log('')
  
  console.log('3. 🎯 Root Cause Analysis:')
  console.log('   The database trigger `handle_user_profile_routing()` either:')
  console.log('   - Failed to execute due to RLS policy')
  console.log('   - User metadata missing account_type')
  console.log('   - Trigger function has a bug')
  console.log('   - Multiple triggers conflicting again')
  
  console.log('\n4. 💡 Immediate Fix:')
  console.log('   Since we know this should be a creator, manually create the profile:')
  console.log(`
   -- Manual profile creation (run in Supabase SQL Editor)
   INSERT INTO user_creators (
     id,
     email,
     full_name,
     pen_name,
     invitation_status
   ) VALUES (
     (SELECT id FROM auth.users WHERE email = '${email}'),
     '${email}',
     'Hyobin Lim', -- or actual name from metadata
     'Hyobin', -- or actual pen name
     'invited'
   );`)
   
   console.log('\n5. 🔄 Long-term Fix:')
   console.log('   - Check why database trigger is not working')
   console.log('   - Verify consolidated trigger is active')
   console.log('   - Test OAuth signup flow end-to-end')
   console.log('   - Add better error handling in AuthCallbackPage')
}

debugAuthUser().catch(console.error)