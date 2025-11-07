/**
 * Simple health check for analyze-pitch-for-assets function
 * Tests validation without making expensive OpenAI calls
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFunctionHealth() {
  console.log('\n🏥 Testing edge function health...\n');

  try {
    // Test 1: Missing required fields (should return INVALID_INPUT, no API call)
    console.log('Test 1: Missing required fields');
    const { data, error } = await supabase.functions.invoke('analyze-pitch-for-assets', {
      body: {
        title_name: 'Test Title'
        // Missing title_id, pitch_deck_url, admin_email
      }
    });

    // Supabase client throws an error for non-2xx responses
    // We need to check the context to get the actual response body
    if (error) {
      // Check if it's a 400 error with our expected response
      if (error.context && error.context.status === 400) {
        // Function is responding! Now get the body
        const responseText = await error.context.text();
        const responseData = JSON.parse(responseText);

        if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
          console.log(`  ✅ Function responding correctly`);
          console.log(`  Status: 400 Bad Request`);
          console.log(`  Error code: ${responseData.error.code}`);
          console.log(`  Message: ${responseData.error.message}`);
          return true;
        }
      }

      console.log(`  ❌ Function error: ${error.message}`);
      console.log(`  Status: ${error.context?.status || 'Unknown'}`);
      return false;
    }

    if (data && !data.success) {
      if (data.error.code === 'INVALID_INPUT') {
        console.log(`  ✅ Function responding correctly`);
        console.log(`  Error code: ${data.error.code}`);
        console.log(`  Message: ${data.error.message}`);
        return true;
      } else {
        console.log(`  ⚠️  Unexpected error code: ${data.error.code}`);
        return false;
      }
    }

    console.log(`  ⚠️  Expected error response, got:`, data);
    return false;

  } catch (error) {
    console.error(`  ❌ Exception:`, error.message);
    return false;
  }
}

testFunctionHealth().then(success => {
  if (success) {
    console.log('\n✅ Function is healthy and responding');
  } else {
    console.log('\n❌ Function health check failed');
  }
  process.exit(success ? 0 : 1);
});
