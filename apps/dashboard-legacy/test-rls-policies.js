#!/usr/bin/env node

/**
 * Test if RLS policies are affecting vector data retrieval
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLSPolicies() {
  console.log('🔍 TESTING RLS POLICIES AND VECTOR DATA');
  console.log('='.repeat(50));

  try {
    // Test 1: Check if we can read basic title data
    console.log('\n1️⃣ Testing basic title data access...');
    
    const { data: basicData, error: basicError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr')
      .limit(1);

    if (basicError) {
      console.log('❌ Cannot read basic title data:', basicError.message);
      return;
    }

    if (!basicData || basicData.length === 0) {
      console.log('❌ No titles found');
      return;
    }

    const testTitle = basicData[0];
    console.log(`✅ Can read basic data: ${testTitle.title_name_en || testTitle.title_name_kr}`);

    // Test 2: Check if we can read non-vector embedding columns
    console.log('\n2️⃣ Testing non-vector embedding columns...');
    
    const { data: metaData, error: metaError } = await supabase
      .from('titles')
      .select('title_id, embedding_model, embedding_created_at, embedding_updated_at')
      .eq('title_id', testTitle.title_id)
      .single();

    if (metaError) {
      console.log('❌ Cannot read embedding metadata:', metaError.message);
    } else {
      console.log('✅ Can read embedding metadata:');
      console.log(`   Model: ${metaData.embedding_model}`);
      console.log(`   Created: ${metaData.embedding_created_at}`);
      console.log(`   Updated: ${metaData.embedding_updated_at}`);
    }

    // Test 3: Try to read just one vector column
    console.log('\n3️⃣ Testing individual vector column access...');
    
    const { data: vectorData, error: vectorError } = await supabase
      .from('titles')
      .select('combined_embedding')
      .eq('title_id', testTitle.title_id)
      .single();

    if (vectorError) {
      console.log('❌ Cannot read vector column:', vectorError.message);
      
      if (vectorError.message.includes('policy') || vectorError.message.includes('permission')) {
        console.log('🔧 SOLUTION: RLS policy is blocking vector data access');
      }
    } else {
      console.log(`✅ Can read vector column (type: ${typeof vectorData.combined_embedding})`);
    }

    // Test 4: Store a simple array (not vector type) to see if it works
    console.log('\n4️⃣ Testing simple array storage in text field...');
    
    // First, add a test text column if it doesn't exist
    const testArray = [1, 2, 3, 4, 5];
    
    const { error: updateError } = await supabase
      .from('titles')
      .update({
        note: JSON.stringify(testArray) // Store array as JSON in text field
      })
      .eq('title_id', testTitle.title_id);

    if (updateError) {
      console.log('❌ Cannot update text field:', updateError.message);
    } else {
      console.log('✅ Can update text field');
      
      // Try to read it back
      const { data: readBack, error: readError } = await supabase
        .from('titles')
        .select('note')
        .eq('title_id', testTitle.title_id)
        .single();

      if (readError) {
        console.log('❌ Cannot read back text field:', readError.message);
      } else {
        console.log(`✅ Can read back text field: ${readBack.note}`);
        
        try {
          const parsedArray = JSON.parse(readBack.note);
          console.log(`   Parsed array: [${parsedArray.join(', ')}]`);
        } catch (parseError) {
          console.log('❌ Cannot parse stored JSON');
        }
      }
    }

    // Test 5: Check what happens when we try to store vector with different method
    console.log('\n5️⃣ Testing alternative vector storage method...');
    
    const testEmbedding = Array.from({ length: 10 }, (_, i) => i * 0.1); // Smaller test
    
    // Try storing as string first
    const { error: stringError } = await supabase
      .from('titles')
      .update({
        tagline: JSON.stringify(testEmbedding) // Store in text field as JSON
      })
      .eq('title_id', testTitle.title_id);

    if (!stringError) {
      console.log('✅ Can store embedding as JSON string');
      
      // Now try to store same data as vector
      const { error: vectorStoreError } = await supabase
        .from('titles')
        .update({
          combined_embedding: testEmbedding
        })
        .eq('title_id', testTitle.title_id);

      if (vectorStoreError) {
        console.log('❌ Cannot store as vector:', vectorStoreError.message);
        console.log('❌ Full error:', JSON.stringify(vectorStoreError, null, 2));
      } else {
        console.log('✅ Can store as vector (no error)');
        
        // Try to read it back
        const { data: vectorReadBack, error: vectorReadError } = await supabase
          .from('titles')
          .select('combined_embedding')
          .eq('title_id', testTitle.title_id)
          .single();

        if (vectorReadError) {
          console.log('❌ Cannot read vector back:', vectorReadError.message);
        } else {
          console.log(`📊 Vector read result:`);
          console.log(`   Type: ${typeof vectorReadBack.combined_embedding}`);
          console.log(`   Is null: ${vectorReadBack.combined_embedding === null}`);
          console.log(`   Is array: ${Array.isArray(vectorReadBack.combined_embedding)}`);
          if (vectorReadBack.combined_embedding) {
            console.log(`   Length: ${vectorReadBack.combined_embedding.length}`);
          }
        }
      }
    }

    // Test 6: Check Supabase client configuration
    console.log('\n6️⃣ Testing Supabase client configuration...');
    
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log(`   Client version: Supabase JS v2.53.0`);

    // Final cleanup
    console.log('\n7️⃣ Cleaning up test data...');
    await supabase
      .from('titles')
      .update({
        note: null,
        tagline: null,
        combined_embedding: null
      })
      .eq('title_id', testTitle.title_id);

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(30));
    console.log('The tests above will help identify if the issue is:');
    console.log('1. RLS policies blocking vector column access');
    console.log('2. Vector data type compatibility issue');
    console.log('3. Supabase client configuration problem');
    console.log('4. Database column definition issue');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRLSPolicies().catch(console.error);