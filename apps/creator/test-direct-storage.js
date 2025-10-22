#!/usr/bin/env node

/**
 * Test direct embedding storage to isolate the issue
 * This bypasses the generate-embeddings.js script to test the database directly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectStorage() {
  console.log('🧪 TESTING DIRECT EMBEDDING STORAGE');
  console.log('='.repeat(50));

  try {
    // Step 1: Get a test title
    const { data: titles, error: fetchError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr')
      .limit(1);

    if (fetchError || !titles || titles.length === 0) {
      console.log('❌ Failed to get test title:', fetchError?.message);
      return;
    }

    const testTitle = titles[0];
    console.log(`\n1️⃣ Test title: ${testTitle.title_name_en || testTitle.title_name_kr}`);
    console.log(`   ID: ${testTitle.title_id}`);

    // Step 2: Create a test embedding
    console.log('\n2️⃣ Creating test embedding...');
    const testEmbedding = Array.from({ length: 1536 }, (_, i) => (i / 1536) * 0.001);
    console.log(`   Generated embedding with ${testEmbedding.length} dimensions`);
    console.log(`   First few values: [${testEmbedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);

    // Step 3: Store the embedding
    console.log('\n3️⃣ Storing embedding directly...');
    
    const { error: updateError } = await supabase
      .from('titles')
      .update({
        combined_embedding: testEmbedding,
        embedding_model: 'test-direct-storage',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitle.title_id);

    if (updateError) {
      console.log('❌ Storage error:', updateError.message);
      console.log('   Full error:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Embedding stored successfully');

    // Step 4: Retrieve and verify immediately
    console.log('\n4️⃣ Retrieving stored embedding...');
    
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('titles')
      .select('combined_embedding, embedding_model, embedding_updated_at')
      .eq('title_id', testTitle.title_id)
      .single();

    if (retrieveError) {
      console.log('❌ Retrieval error:', retrieveError.message);
      return;
    }

    console.log('\n📊 Retrieved data analysis:');
    console.log(`   Type: ${typeof retrievedData.combined_embedding}`);
    console.log(`   Is array: ${Array.isArray(retrievedData.combined_embedding)}`);
    console.log(`   Is null: ${retrievedData.combined_embedding === null}`);
    console.log(`   Is undefined: ${retrievedData.combined_embedding === undefined}`);
    
    if (retrievedData.combined_embedding) {
      console.log(`   Length: ${retrievedData.combined_embedding.length}`);
      if (Array.isArray(retrievedData.combined_embedding) && retrievedData.combined_embedding.length > 0) {
        console.log(`   First few values: [${retrievedData.combined_embedding.slice(0, 5).map(v => v?.toFixed?.(6) || v).join(', ')}...]`);
      }
    }

    console.log(`   Model: ${retrievedData.embedding_model}`);
    console.log(`   Updated: ${retrievedData.embedding_updated_at}`);

    // Step 5: Test different retrieval methods
    console.log('\n5️⃣ Testing different retrieval methods...');

    // Method 1: Just the embedding column
    const { data: method1, error: error1 } = await supabase
      .from('titles')
      .select('combined_embedding')
      .eq('title_id', testTitle.title_id)
      .single();

    console.log(`   Method 1 (select embedding only):`);
    console.log(`      Type: ${typeof method1?.combined_embedding}`);
    console.log(`      Length: ${method1?.combined_embedding?.length || 'N/A'}`);

    // Method 2: Multiple columns
    const { data: method2, error: error2 } = await supabase
      .from('titles')
      .select('title_id, combined_embedding')
      .eq('title_id', testTitle.title_id)
      .single();

    console.log(`   Method 2 (select with title_id):`);
    console.log(`      Type: ${typeof method2?.combined_embedding}`);
    console.log(`      Length: ${method2?.combined_embedding?.length || 'N/A'}`);

    // Method 3: Raw SQL query
    console.log('\n6️⃣ Testing raw SQL query...');
    
    const { data: rawData, error: rawError } = await supabase.rpc('exec_sql', {
      sql: `SELECT combined_embedding, array_length(combined_embedding, 1) as embedding_length 
            FROM titles 
            WHERE title_id = '${testTitle.title_id}'`
    });

    if (rawError) {
      console.log('   Raw SQL not available (expected for anon user)');
    } else {
      console.log('   Raw SQL result:', rawData);
    }

    // Step 6: Test vector search function
    console.log('\n7️⃣ Testing vector search function...');
    
    if (retrievedData.combined_embedding && Array.isArray(retrievedData.combined_embedding)) {
      const { data: searchResults, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: retrievedData.combined_embedding,
        match_threshold: 0.1,
        match_count: 3
      });

      if (searchError) {
        console.log('❌ Vector search error:', searchError.message);
      } else {
        console.log(`✅ Vector search works! Found ${searchResults?.length || 0} results`);
        if (searchResults && searchResults.length > 0) {
          searchResults.forEach((result, idx) => {
            console.log(`      ${idx + 1}. ${result.title_name_en || result.title_name_kr} (similarity: ${result.similarity?.toFixed(4)})`);
          });
        }
      }
    } else {
      console.log('⚠️ Cannot test vector search - invalid embedding format');
    }

    // Final verdict
    console.log('\n📋 FINAL ANALYSIS:');
    console.log('='.repeat(30));

    const isWorkingCorrectly = retrievedData.combined_embedding && 
                              Array.isArray(retrievedData.combined_embedding) && 
                              retrievedData.combined_embedding.length === 1536;

    if (isWorkingCorrectly) {
      console.log('🎉 SUCCESS: Direct storage and retrieval is working!');
      console.log('');
      console.log('🔧 ISSUE: The problem is in the generate-embeddings.js script');
      console.log('   The database is working correctly, but the script verification logic has a bug');
      console.log('');
      console.log('🎯 SOLUTION: The script may be checking the wrong data structure');
      console.log('   Check the updateResult parsing in the script');
    } else {
      console.log('❌ PROBLEM: Direct storage is not working correctly');
      console.log('');
      console.log('🔧 POSSIBLE CAUSES:');
      console.log('   1. Supabase client version incompatibility with vector type');
      console.log('   2. Database connection configuration issue');
      console.log('   3. Row Level Security (RLS) policy blocking vector data');
      console.log('   4. Supabase-js library version issue');
    }

    // Clean up
    console.log('\n8️⃣ Cleaning up test data...');
    await supabase
      .from('titles')
      .update({
        combined_embedding: null,
        embedding_model: null,
        embedding_updated_at: null
      })
      .eq('title_id', testTitle.title_id);

    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDirectStorage().catch(console.error);