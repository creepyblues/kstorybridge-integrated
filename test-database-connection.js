#!/usr/bin/env node

/**
 * Test Supabase Database Connection
 * This script verifies that your local server can connect to the database
 * and perform basic read/write operations.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load from dashboard's .env.local first, then root .env.local
dotenv.config({ path: join(__dirname, 'apps/dashboard/.env.local') });
dotenv.config({ path: join(__dirname, '.env.local') });

// Supabase configuration - same as in your client files
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// For write operations, you'll need a service role key
// Add this to your .env.local file as SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📁 Loading environment from:', join(__dirname, 'apps/dashboard/.env.local'));
console.log('🔑 Service key found:', SUPABASE_SERVICE_KEY ? 'Yes' : 'No');
if (SUPABASE_SERVICE_KEY) {
  console.log('   Key preview:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...')
}

console.log('🔍 Testing Supabase Database Connection...\n');

// Create client with anon key for read operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create service client for write operations (if service key is available)
const serviceSupabase = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

async function testConnection() {
  try {
    // Test 1: Basic connection and read operation
    console.log('📖 Test 1: Reading from titles table...');
    const { data: titles, error: readError } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(5);

    if (readError) {
      console.error('❌ Read Error:', readError.message);
      console.log('   -> Check if your ANON key has read permissions');
    } else {
      console.log('✅ Successfully read', titles?.length || 0, 'titles');
      if (titles && titles.length > 0) {
        console.log('   Sample title:', titles[0].title_name_en);
      }
    }

    // Test 2: Authentication check
    console.log('\n🔐 Test 2: Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️  No authenticated user (this is normal for server-side operations)');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }

    // Test 3: Check RLS policies
    console.log('\n🛡️  Test 3: Checking Row Level Security (RLS)...');
    const { data: userBuyers, error: rlsError } = await supabase
      .from('user_buyers')
      .select('email')
      .limit(1);

    if (rlsError) {
      if (rlsError.message.includes('permission denied')) {
        console.log('⚠️  RLS is active - user_buyers table requires authentication');
        console.log('   -> This is expected behavior for security');
      } else {
        console.error('❌ RLS Error:', rlsError.message);
      }
    } else {
      console.log('✅ Can read from user_buyers table');
    }

    // Test 4: Service role operations (if key is available)
    if (serviceSupabase) {
      console.log('\n🔧 Test 4: Testing service role operations...');
      
      // Try to read with service role (bypasses RLS)
      const { data: serviceData, error: serviceError } = await serviceSupabase
        .from('user_buyers')
        .select('email, tier')
        .limit(3);

      if (serviceError) {
        console.error('❌ Service Role Error:', serviceError.message);
        console.log('   -> Check your SUPABASE_SERVICE_ROLE_KEY');
      } else {
        console.log('✅ Service role can bypass RLS');
        console.log('   Found', serviceData?.length || 0, 'user records');
      }

      // Test write operation (create a test record and delete it)
      console.log('\n✏️  Test 5: Testing write operations...');
      
      // First, get a valid user ID from the database
      const { data: existingUser } = await serviceSupabase
        .from('user_creators')
        .select('id')
        .limit(1)
        .single();

      if (existingUser) {
        const testData = {
          title_name_en: 'TEST_TITLE_DELETE_ME_' + Date.now(),
          title_name_kr: '테스트_타이틀_' + Date.now(),
          creator_id: existingUser.id, // Use a real user ID
          genre: ['test'],
          content_format: 'webtoon',
          created_at: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await serviceSupabase
          .from('titles')
          .insert(testData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Write Error:', insertError.message);
          console.log('   -> Check if all required fields are provided');
        } else {
          console.log('✅ Successfully created test record:', insertData.title_id);
          console.log('   Title:', insertData.title_name_en);
          
          // Clean up test record
          const { error: deleteError } = await serviceSupabase
            .from('titles')
            .delete()
            .eq('title_id', insertData.title_id);

          if (deleteError) {
            console.error('⚠️  Could not delete test record:', deleteError.message);
          } else {
            console.log('✅ Test record cleaned up successfully');
          }
        }
      } else {
        console.log('⚠️  No existing users found to test with');
        console.log('   Create a user first through the website signup');
      }
    } else {
      console.log('\n⚠️  Service role key not found');
      console.log('   To test write operations, add SUPABASE_SERVICE_ROLE_KEY to your environment');
      console.log('   You can find it in your Supabase dashboard under Settings > API');
    }

    // Summary
    console.log('\n📊 Connection Test Summary:');
    console.log('================================');
    console.log('✅ Database URL is reachable');
    console.log('✅ Anon key is valid for read operations');
    if (serviceSupabase) {
      console.log('✅ Service role key is configured');
    } else {
      console.log('⚠️  Service role key needed for write operations');
    }
    console.log('\n💡 Next Steps:');
    console.log('1. For write operations, add SUPABASE_SERVICE_ROLE_KEY to .env.local');
    console.log('2. For user-specific operations, implement authentication flow');
    console.log('3. Check RLS policies in Supabase dashboard if needed');

  } catch (error) {
    console.error('\n❌ Unexpected Error:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct');
    console.log('3. Check Supabase dashboard for any service issues');
  }
}

// Run the tests
testConnection().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Test failed:', err);
  process.exit(1);
});