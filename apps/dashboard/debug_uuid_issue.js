#!/usr/bin/env node

/**
 * Debug UUID Format Issue
 * The OAuth user ID is being rejected as invalid UUID format
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 UUID Format Issue Investigation')
console.log('===================================')

async function debugUuidIssue() {
  // The OAuth user ID from your token
  const oauthUserId = 'fde1d173-33bd-40fb-9ba9-9bef6e293c6'
  
  console.log('\n1. 📊 Analyzing OAuth User ID')
  console.log('OAuth User ID:', oauthUserId)
  console.log('Length:', oauthUserId.length)
  console.log('Format:', oauthUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? 'Valid UUID format' : 'Invalid UUID format')
  
  // Check for hidden characters
  const bytes = Buffer.from(oauthUserId, 'utf8')
  console.log('Byte representation:', Array.from(bytes).map(b => b.toString(16)).join(' '))
  
  // Test various UUID formats
  const testUuids = [
    oauthUserId, // Original OAuth ID
    oauthUserId.toLowerCase(), // Lowercase
    oauthUserId.toUpperCase(), // Uppercase
    crypto.randomUUID(), // Fresh UUID
    'fde1d173-33bd-40fb-9ba9-9bef6e293c6', // Manually typed
  ]
  
  console.log('\n2. 🧪 Testing Different UUID Formats')
  
  for (let i = 0; i < testUuids.length; i++) {
    const testId = testUuids[i]
    console.log(`\n   Test ${i + 1}: ${testId}`)
    console.log(`   Length: ${testId.length}`)
    console.log(`   Case: ${testId === testId.toLowerCase() ? 'lowercase' : testId === testId.toUpperCase() ? 'uppercase' : 'mixed'}`)
    
    try {
      const { data, error } = await supabase
        .from('user_creators')
        .insert([{
          id: testId,
          email: `test${i}@example.com`,
          full_name: 'Test User',
          pen_name: 'Test Writer',
          ip_owner_role: 'author'
        }])
        .select()
      
      if (error) {
        if (error.code === '22P02') {
          console.log(`   ❌ UUID format rejected: ${error.message}`)
        } else if (error.code === '42501') {
          console.log(`   ✅ RLS blocked (UUID format is OK)`)
        } else {
          console.log(`   ⚠️  Other error: ${error.code} - ${error.message}`)
        }
      } else {
        console.log(`   ⚠️  Unexpected success`)
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
    }
  }
  
  console.log('\n3. 🔍 Checking Existing User IDs in Database')
  
  // Check auth.users table format by looking at user_buyers
  const { data: buyers, error: buyersError } = await supabase
    .from('user_buyers')
    .select('id, email')
    .limit(3)
  
  if (buyersError) {
    console.log('❌ Error fetching buyers:', buyersError.message)
  } else {
    console.log(`✅ Found ${buyers.length} buyer profiles:`)
    buyers.forEach((buyer, index) => {
      console.log(`   ${index + 1}. ID: ${buyer.id}`)
      console.log(`      Email: ${buyer.email}`)
      console.log(`      ID Length: ${buyer.id.length}`)
      console.log(`      Format: ${buyer.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? 'Valid UUID' : 'Other format'}`)
    })
  }
  
  console.log('\n4. 💡 Potential Solutions')
  console.log('   A. Check if OAuth user IDs have special encoding')
  console.log('   B. Verify database column type (UUID vs TEXT)')
  console.log('   C. Check if there are database triggers modifying the ID')
  console.log('   D. Test with exact ID from a working email signup')
}

debugUuidIssue()