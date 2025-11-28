/**
 * Check Profile Creation After Signup
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkProfiles() {
  console.log('🔍 Checking Profile Creation Status')
  console.log('===================================')

  try {
    // Check buyer profiles
    console.log('\n1. 🔵 Checking buyer profiles...')
    const { data: buyers, error: buyerError } = await supabase
      .from('user_buyers')
      .select('email, full_name, buyer_company, tier, created_at')
      .like('email', 'test.buyer%')
      .order('created_at', { ascending: false })
      .limit(5)

    if (buyerError) {
      console.log('   ❌ Buyer query failed:', buyerError.message)
    } else {
      console.log(`   📊 Found ${buyers.length} buyer profiles:`)
      buyers.forEach(buyer => {
        console.log(`   - ${buyer.email} | ${buyer.full_name} | ${buyer.buyer_company} | tier: ${buyer.tier}`)
      })
    }

    // Check creator profiles
    console.log('\n2. 🟡 Checking creator profiles...')
    const { data: creators, error: creatorError } = await supabase
      .from('user_creators')
      .select('email, full_name, pen_name, invitation_status, created_at')
      .like('email', 'test.creator%')
      .order('created_at', { ascending: false })
      .limit(5)

    if (creatorError) {
      console.log('   ❌ Creator query failed:', creatorError.message)
    } else {
      console.log(`   📊 Found ${creators.length} creator profiles:`)
      creators.forEach(creator => {
        console.log(`   - ${creator.email} | ${creator.full_name} | ${creator.pen_name} | status: ${creator.invitation_status}`)
      })
    }

    // Check OAuth test profiles
    console.log('\n3. 🟣 Checking OAuth test profiles...')
    const { data: oauthBuyers, error: oauthError } = await supabase
      .from('user_buyers')
      .select('email, full_name, buyer_company, tier, created_at')
      .like('email', 'oauth.test%')
      .order('created_at', { ascending: false })
      .limit(5)

    if (oauthError) {
      console.log('   ❌ OAuth buyer query failed:', oauthError.message)
    } else {
      console.log(`   📊 Found ${oauthBuyers.length} OAuth buyer profiles:`)
      oauthBuyers.forEach(buyer => {
        console.log(`   - ${buyer.email} | ${buyer.full_name} | ${buyer.buyer_company} | tier: ${buyer.tier}`)
      })
    }

    // Check auth users to see if they were created
    console.log('\n4. 👤 Checking auth users...')

    // We can't directly query auth.users, but we can check if our test emails exist
    // by attempting to sign in or checking user metadata

    console.log('\n5. 🔧 Database Trigger Analysis')
    console.log('===============================')

    if (buyers.length === 0 && creators.length === 0 && oauthBuyers.length === 0) {
      console.log('❌ No profiles found for test users')
      console.log('')
      console.log('Possible issues:')
      console.log('1. Database triggers are not working')
      console.log('2. Users were created but triggers failed')
      console.log('3. Test users were cleaned up automatically')
      console.log('4. RLS policies are preventing profile creation')
      console.log('')
      console.log('Next steps:')
      console.log('- Check database triggers are active')
      console.log('- Check RLS policies on user tables')
      console.log('- Test with real signup flow instead of programmatic')
    } else {
      console.log('✅ Some profiles were found - triggers appear to be working')
    }

  } catch (error) {
    console.error('💥 Profile check failed:', error.message)
  }
}

checkProfiles()