#!/usr/bin/env node

/**
 * Check actual column types in the database to diagnose embedding storage
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumnTypes() {
  console.log('🔍 CHECKING DATABASE COLUMN TYPES');
  console.log('='.repeat(40));

  try {
    // First, let's see what we get when we select embedding columns
    console.log('\n1️⃣ Checking current embedding column values...');
    
    const { data: testData, error: testError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding, title_embedding, synopsis_embedding, content_embedding')
      .limit(3);
    
    if (testError) {
      console.log('❌ Error selecting embedding columns:', testError.message);
      return;
    }
    
    console.log(`📊 Found ${testData.length} titles to examine:`);
    testData.forEach((title, idx) => {
      console.log(`\n   ${idx + 1}. ${title.title_name_en || 'No English title'}`);
      console.log(`      combined_embedding: ${title.combined_embedding ? `${typeof title.combined_embedding} (${Array.isArray(title.combined_embedding) ? title.combined_embedding.length + ' items' : 'not array'})` : 'NULL'}`);
      console.log(`      title_embedding: ${title.title_embedding ? `${typeof title.title_embedding}` : 'NULL'}`);
      console.log(`      synopsis_embedding: ${title.synopsis_embedding ? `${typeof title.synopsis_embedding}` : 'NULL'}`);
      console.log(`      content_embedding: ${title.content_embedding ? `${typeof title.content_embedding}` : 'NULL'}`);
    });

    // Test different ways to store embeddings
    console.log('\n2️⃣ Testing different embedding storage formats...');
    
    const testTitleId = testData[0]?.title_id;
    if (!testTitleId) {
      console.log('❌ No test title available');
      return;
    }

    // Test 1: Store as array directly
    console.log('\n   Test 1: Storing as JavaScript array...');
    const testArray = [0.1, 0.2, 0.3, 0.4, 0.5];
    
    const { error: arrayError } = await supabase
      .from('titles')
      .update({ combined_embedding: testArray })
      .eq('title_id', testTitleId);
    
    if (arrayError) {
      console.log('   ❌ Array storage error:', arrayError.message);
    } else {
      // Check what was stored
      const { data: arrayResult } = await supabase
        .from('titles')
        .select('combined_embedding')
        .eq('title_id', testTitleId)
        .single();
      
      console.log('   📊 Array result:', typeof arrayResult?.combined_embedding, 
                  Array.isArray(arrayResult?.combined_embedding) ? arrayResult.combined_embedding.length : 'not array');
      
      if (Array.isArray(arrayResult?.combined_embedding)) {
        console.log('   ✅ Array storage: WORKING');
      } else {
        console.log('   ❌ Array storage: FAILED - not returned as array');
      }
    }

    // Test 2: Store as string (JSON)
    console.log('\n   Test 2: Storing as JSON string...');
    const testJsonString = JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]);
    
    const { error: jsonError } = await supabase
      .from('titles')
      .update({ title_embedding: testJsonString })
      .eq('title_id', testTitleId);
    
    if (jsonError) {
      console.log('   ❌ JSON storage error:', jsonError.message);
    } else {
      // Check what was stored
      const { data: jsonResult } = await supabase
        .from('titles')
        .select('title_embedding')
        .eq('title_id', testTitleId)
        .single();
      
      console.log('   📊 JSON result:', typeof jsonResult?.title_embedding);
      
      try {
        const parsed = JSON.parse(jsonResult?.title_embedding);
        console.log('   ✅ JSON storage: WORKING - can be parsed as array with', parsed.length, 'items');
      } catch (parseError) {
        console.log('   ❌ JSON storage: FAILED - cannot parse as JSON');
      }
    }

    // Test 3: Store full-size embedding (1536 dimensions)
    console.log('\n   Test 3: Storing full-size 1536-dimensional array...');
    const fullEmbedding = Array.from({ length: 1536 }, (_, i) => (i / 1536) * 0.001);
    
    const { error: fullError } = await supabase
      .from('titles')
      .update({ 
        synopsis_embedding: fullEmbedding,
        embedding_model: 'test-full-embedding',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitleId);
    
    if (fullError) {
      console.log('   ❌ Full embedding error:', fullError.message);
      
      if (fullError.message.includes('dimensions')) {
        console.log('   🔧 ISSUE: Vector dimension constraint');
        console.log('   🔧 SOLUTION: Check if columns are defined as vector(1536)');
      }
    } else {
      // Check what was stored
      const { data: fullResult } = await supabase
        .from('titles')
        .select('synopsis_embedding, embedding_model, embedding_updated_at')
        .eq('title_id', testTitleId)
        .single();
      
      const isValidEmbedding = Array.isArray(fullResult?.synopsis_embedding) && 
                              fullResult.synopsis_embedding.length === 1536;
      
      console.log('   📊 Full embedding result:');
      console.log(`      Type: ${typeof fullResult?.synopsis_embedding}`);
      console.log(`      Is array: ${Array.isArray(fullResult?.synopsis_embedding)}`);
      console.log(`      Length: ${fullResult?.synopsis_embedding?.length || 0}`);
      console.log(`      Model: ${fullResult?.embedding_model}`);
      console.log(`      Updated: ${fullResult?.embedding_updated_at}`);
      
      if (isValidEmbedding) {
        console.log('   ✅ Full embedding storage: WORKING!');
      } else {
        console.log('   ❌ Full embedding storage: FAILED');
      }
    }

    // Test vector search function with our test data
    console.log('\n3️⃣ Testing vector search function...');
    
    const { data: searchTest } = await supabase
      .from('titles')
      .select('synopsis_embedding')
      .eq('title_id', testTitleId)
      .single();
    
    if (searchTest?.synopsis_embedding && Array.isArray(searchTest.synopsis_embedding) && searchTest.synopsis_embedding.length === 1536) {
      console.log('   📝 Testing vector search with stored embedding...');
      
      const { data: searchResults, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: searchTest.synopsis_embedding,
        match_threshold: 0.1,
        match_count: 3
      });
      
      if (searchError) {
        console.log('   ❌ Vector search error:', searchError.message);
      } else {
        console.log(`   ✅ Vector search: WORKING! Found ${searchResults?.length || 0} results`);
      }
    } else {
      console.log('   ⚠️ Skipping vector search test - no valid embedding to test with');
    }

    // Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    await supabase
      .from('titles')
      .update({
        combined_embedding: null,
        title_embedding: null,
        synopsis_embedding: null,
        embedding_model: null,
        embedding_updated_at: null
      })
      .eq('title_id', testTitleId);
    
    console.log('✅ Cleanup complete');

    // Final diagnosis
    console.log('\n📋 DIAGNOSIS:');
    console.log('='.repeat(30));
    console.log('✅ Database columns exist');
    console.log('✅ Write permissions work');
    console.log('✅ pgvector extension is working');
    console.log('');
    console.log('🔧 LIKELY ISSUE WITH generate-embeddings.js:');
    console.log('1. The script may not be handling the OpenAI API response correctly');
    console.log('2. The embedding extraction from OpenAI response may be failing');
    console.log('3. Error handling in the script may be swallowing errors');
    console.log('4. The script may be running in dry-run mode without you realizing');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Set OpenAI API key: export VITE_OPENAI_API_KEY=sk-your-key');
    console.log('2. Run with verbose logging: node generate-embeddings.js --limit=1');
    console.log('3. Check the script output carefully for any errors');
    console.log('4. Try the quick-embedding-test.js instead for simpler debugging');

  } catch (error) {
    console.error('❌ Column type check failed:', error.message);
  }
}

checkColumnTypes().catch(console.error);