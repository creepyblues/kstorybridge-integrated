/**
 * Test Database Access with Service Role Key
 * This script tests both read and write access to Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Database Access Test');
console.log('========================\n');

// Test with Anon Key (RLS enabled)
async function testAnonKey() {
  console.log('📌 Testing with ANON KEY (RLS enabled)...');
  
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ Anon key not found in environment');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test read
    const { data: readData, error: readError } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(1);
    
    if (readError) {
      console.log('  ❌ Read failed:', readError.message);
    } else {
      console.log('  ✅ Read access: SUCCESS');
    }
    
    // Test insert
    const testData = {
      feedback: 'Test from anon key - ' + new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('feedback_buyer')
      .insert(testData);
    
    if (insertError) {
      console.log('  ❌ Insert failed:', insertError.message);
    } else {
      console.log('  ✅ Insert access: SUCCESS');
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
}

// Test with Service Role Key (bypasses RLS)
async function testServiceRoleKey() {
  console.log('\n📌 Testing with SERVICE ROLE KEY (bypasses RLS)...');
  
  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here') {
    console.log('  ⚠️  Service role key not configured!');
    console.log('  📝 To get your service role key:');
    console.log('     1. Visit: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/settings/api');
    console.log('     2. Copy the "Service role key (secret)"');
    console.log('     3. Update SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Test read
    const { data: readData, error: readError } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(1);
    
    if (readError) {
      console.log('  ❌ Read failed:', readError.message);
    } else {
      console.log('  ✅ Read access: SUCCESS');
    }
    
    // Test insert
    const testData = {
      feedback: 'Test from service role - ' + new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('feedback_buyer')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('  ❌ Insert failed:', insertError.message);
    } else {
      console.log('  ✅ Insert access: SUCCESS');
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('feedback_buyer')
          .delete()
          .eq('id', insertData[0].id);
        console.log('  🧹 Test data cleaned up');
      }
    }
    
    // Test update
    const { data: titleData } = await supabase
      .from('titles')
      .select('title_id, note')
      .limit(1);
    
    if (titleData && titleData[0]) {
      const originalNote = titleData[0].note;
      const testNote = 'SERVICE ROLE TEST - ' + new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('titles')
        .update({ note: testNote })
        .eq('title_id', titleData[0].title_id);
      
      if (updateError) {
        console.log('  ❌ Update failed:', updateError.message);
      } else {
        console.log('  ✅ Update access: SUCCESS');
        
        // Restore original
        await supabase
          .from('titles')
          .update({ note: originalNote })
          .eq('title_id', titleData[0].title_id);
        console.log('  🔄 Original data restored');
      }
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
}

// Example: How to use in your application
function showUsageExample() {
  console.log('\n📚 USAGE EXAMPLE');
  console.log('================');
  console.log(`
// In your application code:
const { createClient } = require('@supabase/supabase-js');

// For operations that need full access (bypasses RLS):
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Example: Insert new title
const { data, error } = await supabaseAdmin
  .from('titles')
  .insert({
    title_name_en: 'New Title',
    title_name_kr: '새로운 제목',
    creator_id: 'user-uuid-here',
    // ... other fields
  });

// Example: Bulk update
const { error: updateError } = await supabaseAdmin
  .from('titles')
  .update({ updated_at: new Date() })
  .in('title_id', ['id1', 'id2', 'id3']);
`);
}

// Run tests
async function runTests() {
  await testAnonKey();
  await testServiceRoleKey();
  showUsageExample();
  
  console.log('\n✅ Test complete!');
}

runTests().catch(console.error);