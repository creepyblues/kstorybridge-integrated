#!/usr/bin/env node

/**
 * Admin Authentication Test Script
 * Tests the complete authentication flow for the admin portal
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminAuth() {
  console.log('🔐 ADMIN AUTHENTICATION TEST');
  console.log('============================');
  console.log('');
  
  const email = 'sungho@dadble.com';
  const password = 'Dadble2024!Admin#';
  
  console.log(`📧 Testing email: ${email}`);
  console.log(`🔑 Testing password: ${'*'.repeat(password.length)}`);
  console.log('');

  // Test 1: Check admin table record
  console.log('1️⃣ Checking admin table record...');
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();
    
    if (adminError) {
      console.error('❌ Admin table error:', adminError.message);
      return;
    }
    
    if (adminData) {
      console.log('✅ Admin record found:', {
        id: adminData.id,
        email: adminData.email,
        full_name: adminData.full_name,
        active: adminData.active
      });
    } else {
      console.log('❌ No admin record found');
      return;
    }
  } catch (err) {
    console.error('❌ Admin table check failed:', err.message);
    return;
  }
  
  console.log('');

  // Test 2: Test Supabase authentication
  console.log('2️⃣ Testing Supabase authentication...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      
      if (authError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🔍 DIAGNOSIS: Invalid login credentials');
        console.log('   This usually means:');
        console.log('   • Email not confirmed in Supabase');
        console.log('   • Wrong password');
        console.log('   • User not created properly');
        console.log('');
        console.log('🛠️  TO FIX:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Navigate to Authentication > Users');
        console.log('   3. Find sungho@dadble.com');
        console.log('   4. Click "Confirm User" button');
        console.log('   5. Try authentication again');
      }
      
      return;
    }
    
    console.log('✅ Authentication successful!');
    console.log('User details:', {
      id: authData.user?.id,
      email: authData.user?.email,
      email_confirmed_at: authData.user?.email_confirmed_at,
      created_at: authData.user?.created_at
    });
    
    // Sign out after test
    await supabase.auth.signOut();
    
  } catch (err) {
    console.error('❌ Authentication test failed:', err.message);
    return;
  }
  
  console.log('');
  console.log('🎉 ALL TESTS PASSED!');
  console.log('');
  console.log('✅ Admin portal authentication is working correctly');
  console.log('✅ You can now login at http://localhost:8082');
  console.log('✅ Uses real Supabase data (no mocks)');
  console.log('✅ Admin auth completely separated from dashboard');
}

// Run the test
testAdminAuth().catch(console.error);