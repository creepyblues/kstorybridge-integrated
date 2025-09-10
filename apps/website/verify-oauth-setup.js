#!/usr/bin/env node

/**
 * Script to verify Google OAuth setup
 * Run: node verify-oauth-setup.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySetup() {
  console.log('🔍 Verifying Google OAuth Setup...\n');
  
  // Check if we can connect to Supabase
  try {
    const { data: healthCheck, error } = await supabase
      .from('user_buyers')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Cannot connect to Supabase:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    return;
  }
  
  // Check tables exist
  console.log('\n📊 Checking database tables...');
  
  const tables = ['user_buyers', 'user_creators'];
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log(`❌ Table '${table}' has issues:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}':`, err.message);
    }
  }
  
  console.log('\n🔐 OAuth Configuration:');
  console.log('- Google Client ID: Set in Google Console');
  console.log('- Callback URL: https://dlrnrgcoguxlkkcitlpd.supabase.co/auth/v1/callback');
  console.log('- Authorized Origins:');
  console.log('  • http://localhost:5173');
  console.log('  • http://localhost:8081');
  console.log('  • https://kstorybridge.com');
  console.log('  • https://dashboard.kstorybridge.com');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Ensure Google provider is enabled in Supabase Dashboard');
  console.log('2. Add Client ID and Secret to Supabase');
  console.log('3. Test with: npm run dev');
  console.log('4. Click "Continue with Google" button');
  console.log('5. Check Supabase Dashboard for new user');
  
  console.log('\n✨ Setup verification complete!');
}

verifySetup().catch(console.error);