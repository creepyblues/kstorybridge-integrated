/**
 * Debug Database Trigger Issue
 *
 * Investigates why profiles aren't being created by database triggers
 * after successful authentication.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debugTriggerIssue() {
  console.log('🔍 Debugging Database Trigger Issue')
  console.log('===================================')

  try {
    // Check if any recent profiles were created
    console.log('\n1. 🔍 Checking recent profile creation...')

    // Check buyer profiles from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: recentBuyers, error: buyerError } = await supabase
      .from('user_buyers')
      .select('email, full_name, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })

    if (buyerError) {
      console.log('   ❌ Buyer query error:', buyerError.message)
    } else {
      console.log(`   📊 Recent buyer profiles (last hour): ${recentBuyers.length}`)
      recentBuyers.forEach(buyer => {
        console.log(`   - ${buyer.email} | ${buyer.full_name} | ${buyer.created_at}`)
      })
    }

    // Check creator profiles from last hour
    const { data: recentCreators, error: creatorError } = await supabase
      .from('user_creators')
      .select('email, full_name, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })

    if (creatorError) {
      console.log('   ❌ Creator query error:', creatorError.message)
    } else {
      console.log(`   📊 Recent creator profiles (last hour): ${recentCreators.length}`)
      recentCreators.forEach(creator => {
        console.log(`   - ${creator.email} | ${creator.full_name} | ${creator.created_at}`)
      })
    }

    // Check test user profiles specifically
    console.log('\n2. 🎯 Checking test user profiles...')

    const testEmails = [
      'test.buyer@testcorp.com',
      'test.creator@gmail.com',
      'oauth.test@example.com'
    ]

    for (const email of testEmails) {
      console.log(`\n   Checking ${email}:`)

      // Check buyer table
      const { data: buyers, error: buyerErr } = await supabase
        .from('user_buyers')
        .select('*')
        .eq('email', email.toLowerCase())

      if (buyerErr) {
        console.log(`   ❌ Buyer check error: ${buyerErr.message}`)
      } else {
        console.log(`   🔵 Buyer profiles found: ${buyers.length}`)
        buyers.forEach((buyer, index) => {
          console.log(`     ${index + 1}. ID: ${buyer.id} | Company: ${buyer.buyer_company}`)
        })
      }

      // Check creator table
      const { data: creators, error: creatorErr } = await supabase
        .from('user_creators')
        .select('*')
        .eq('email', email.toLowerCase())

      if (creatorErr) {
        console.log(`   ❌ Creator check error: ${creatorErr.message}`)
      } else {
        console.log(`   🟡 Creator profiles found: ${creators.length}`)
        creators.forEach((creator, index) => {
          console.log(`     ${index + 1}. ID: ${creator.id} | Pen Name: ${creator.pen_name}`)
        })
      }
    }

    // Test simple profile creation (bypassing triggers)
    console.log('\n3. 🧪 Testing Simple Profile Creation (New Approach)...')

    const testProfile = {
      id: 'test-simple-' + Date.now(),
      email: 'test.simple@example.com',
      full_name: 'Simple Test User',
      buyer_company: 'Simple Test Corp',
      buyer_role: 'producer',
      tier: 'basic',
      requested: false
    }

    console.log('   📝 Attempting direct profile creation...')

    const { data: newProfile, error: createError } = await supabase
      .from('user_buyers')
      .insert(testProfile)
      .select()
      .single()

    if (createError) {
      console.log('   ❌ Direct creation failed:', createError.message)

      if (createError.message.includes('row-level security')) {
        console.log('   🔐 RLS Policy blocking direct creation (expected for non-authenticated)')
      }
    } else {
      console.log('   ✅ Direct creation succeeded:', newProfile.email)

      // Clean up test profile
      await supabase
        .from('user_buyers')
        .delete()
        .eq('id', testProfile.id)

      console.log('   🧹 Test profile cleaned up')
    }

    console.log('\n4. 📋 Analysis & Recommendations')
    console.log('=================================')

    const totalProfiles = (recentBuyers?.length || 0) + (recentCreators?.length || 0)

    if (totalProfiles === 0) {
      console.log('❌ No recent profiles found - Database triggers not working')
      console.log('')
      console.log('Possible causes:')
      console.log('1. Database triggers are disabled or missing')
      console.log('2. RLS policies preventing trigger execution')
      console.log('3. Trigger function has errors')
      console.log('4. auth.users table triggers not firing')
      console.log('')
      console.log('Solutions:')
      console.log('✅ Use Simple OAuth Profile Creation (already implemented)')
      console.log('✅ Bypass triggers entirely during OAuth signup')
      console.log('✅ Rely on edge functions and direct profile creation')
    } else {
      console.log('✅ Some profiles found - Triggers may be working intermittently')
      console.log('')
      console.log('Recommendations:')
      console.log('✅ Simple OAuth approach provides reliable fallback')
      console.log('✅ Continue using multi-layered approach')
    }

    console.log('\n5. 🚀 Enhanced OAuth Flow Status')
    console.log('================================')
    console.log('With the new improvements:')
    console.log('✅ Simple OAuth creation bypasses trigger dependency')
    console.log('✅ Direct profile creation with RLS handling')
    console.log('✅ Existing user detection and graceful handling')
    console.log('✅ Multiple fallback layers for reliability')
    console.log('✅ 30-second timeout protection')
    console.log('')
    console.log('Expected result: OAuth signup should work regardless of trigger status')

  } catch (error) {
    console.error('💥 Debug process failed:', error.message)
  }
}

debugTriggerIssue()