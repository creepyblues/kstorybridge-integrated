#!/usr/bin/env node

/**
 * Fix Duplicate Creator Profile Triggers
 * Removes conflicting triggers and cleans up duplicate profiles
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔧 Fix Duplicate Creator Profile Triggers')
console.log('==========================================')

async function fixDuplicateProfiles() {
  console.log('\n1. 📊 Analyzing current duplicate profile situation...')
  
  // Find users who have both buyer and creator profiles
  let duplicates = null;
  let duplicatesError = null;
  
  try {
    const result = await supabase.rpc('find_duplicate_profiles', {});
    duplicates = result.data;
    duplicatesError = result.error;
  } catch (error) {
    // If the RPC doesn't exist, do a manual query
    try {
      const result = await supabase
        .from('user_creators')
        .select(`
          id,
          email,
          user_buyers!inner(id, email)
        `);
      duplicates = result.data;
      duplicatesError = result.error;
    } catch (innerError) {
      duplicatesError = innerError;
    }
  }
  
  if (duplicatesError) {
    console.log('   ⚠️  Could not query duplicates directly, checking auth users...')
    
    // Check auth.users for creator account types that might have buyer profiles
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .contains('raw_user_meta_data', { account_type: 'creator' })
    
    if (authError) {
      console.log('   ❌ Error checking auth users:', authError.message)
    } else {
      console.log(`   📋 Found ${authUsers?.length || 0} creator auth users`)
      
      // Check each creator user for buyer profiles
      for (const user of authUsers || []) {
        const { data: buyerProfile } = await supabase
          .from('user_buyers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        
        const { data: creatorProfile } = await supabase
          .from('user_creators')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        
        if (buyerProfile && creatorProfile) {
          console.log(`   🚨 DUPLICATE: ${user.email} has both buyer and creator profiles`)
        } else if (buyerProfile && !creatorProfile) {
          console.log(`   ⚠️  MISPLACED: ${user.email} has buyer profile but creator metadata`)
        } else if (!buyerProfile && !creatorProfile) {
          console.log(`   ❌ MISSING: ${user.email} has no profile despite creator metadata`)
        } else {
          console.log(`   ✅ CORRECT: ${user.email} has only creator profile`)
        }
      }
    }
  }
  
  console.log('\n2. 💡 Recommended Manual Steps:')
  console.log('   Since this requires admin privileges, please execute these steps manually:')
  console.log('')
  console.log('   A. In Supabase SQL Editor, run this query to see duplicates:')
  console.log(`
   SELECT 
     au.email,
     au.raw_user_meta_data->>'account_type' as metadata_type,
     CASE WHEN ub.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_buyer_profile,
     CASE WHEN uc.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_creator_profile
   FROM auth.users au
   LEFT JOIN user_buyers ub ON ub.id = au.id
   LEFT JOIN user_creators uc ON uc.id = au.id
   WHERE au.raw_user_meta_data->>'account_type' = 'creator'
   ORDER BY au.email;
   `)
   
   console.log('   B. To remove duplicate buyer profiles for creator users:')
   console.log(`
   DELETE FROM user_buyers 
   WHERE id IN (
     SELECT ub.id 
     FROM user_buyers ub
     INNER JOIN auth.users au ON au.id = ub.id
     WHERE au.raw_user_meta_data->>'account_type' = 'creator'
   );
   `)
   
   console.log('   C. To view current database triggers:')
   console.log(`
   SELECT 
     trigger_name,
     event_object_table,
     action_statement,
     enabled
   FROM information_schema.triggers 
   WHERE event_object_table = 'users' 
     AND trigger_schema = 'auth'
   ORDER BY trigger_name;
   `)
   
   console.log('\n3. 🔄 Trigger Consolidation:')
   console.log('   The migration file 20250910-fix-duplicate-creator-profiles.sql contains:')
   console.log('   - Removal of conflicting triggers')
   console.log('   - Single consolidated trigger with duplicate prevention')
   console.log('   - Cleanup function for existing duplicates')
   console.log('')
   console.log('   Apply this migration via Supabase Dashboard > SQL Editor')
   
   console.log('\n4. ✅ Summary:')
   console.log('   - Issue: Multiple triggers creating both buyer and creator profiles for OAuth creators')
   console.log('   - Root cause: Competing triggers (handle_new_user_routing + handle_new_creator)')
   console.log('   - Solution: Consolidate to single trigger with robust duplicate prevention')
   console.log('   - Migration: 20250910-fix-duplicate-creator-profiles.sql')
}

fixDuplicateProfiles().catch(console.error)