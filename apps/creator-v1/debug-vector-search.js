#!/usr/bin/env node

/**
 * Comprehensive Vector Search Debugging Script
 * This will help identify exactly why vector search returns 0 results
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check OpenAI setup
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
let openai = null;

if (openaiApiKey && openaiApiKey !== 'sk-your_actual_api_key_here') {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

async function debugVectorSearch() {
  console.log('🔍 COMPREHENSIVE VECTOR SEARCH DEBUG');
  console.log('='.repeat(50));

  // 1. Check database function exists and what it returns
  console.log('\n1️⃣ Testing Database Function...');
  
  try {
    // Test with a simple embedding
    const testEmbedding = new Array(1536).fill(0.1);
    console.log('🔍 Calling match_titles_by_embedding with test embedding...');
    
    const { data: functionResult, error: functionError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: testEmbedding,
      match_threshold: 0.01, // Very low threshold
      match_count: 10
    });

    if (functionError) {
      console.log('❌ Function Error:', functionError.message);
      console.log('   📋 This indicates the database function needs to be fixed');
      
      if (functionError.message.includes('does not exist')) {
        console.log('   🔧 SOLUTION: Apply database schema fix in Supabase Dashboard');
      } else if (functionError.message.includes('column') && functionError.message.includes('does not exist')) {
        console.log('   🔧 SOLUTION: Update function to use correct column names');
      }
      return;
    } else {
      console.log('✅ Function exists and runs');
      console.log(`   📊 Returned ${functionResult?.length || 0} results`);
      
      if (functionResult && functionResult.length > 0) {
        console.log('   📋 Sample result structure:');
        console.log('  ', JSON.stringify(functionResult[0], null, 6));
      }
    }
  } catch (error) {
    console.log('❌ Function test failed:', error.message);
    return;
  }

  // 2. Check database schema - what columns actually exist
  console.log('\n2️⃣ Checking Database Schema...');
  
  try {
    const { data: titles, error: schemaError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, synopsis, description_kr, combined_embedding, title_embedding, synopsis_embedding, content_embedding')
      .limit(3);

    if (schemaError) {
      console.log('❌ Schema check error:', schemaError.message);
      
      if (schemaError.message.includes('column') && schemaError.message.includes('does not exist')) {
        console.log('   🔧 SOLUTION: Some embedding columns may not exist in the database');
      }
    } else {
      console.log('✅ Schema check successful');
      console.log(`   📊 Found ${titles?.length || 0} sample titles`);
      
      if (titles && titles.length > 0) {
        const sampleTitle = titles[0];
        console.log('\n   📋 Sample title structure:');
        console.log(`      title_id: ${sampleTitle.title_id}`);
        console.log(`      title_name_en: ${sampleTitle.title_name_en}`);
        console.log(`      title_name_kr: ${sampleTitle.title_name_kr}`);
        console.log(`      synopsis: ${sampleTitle.synopsis ? 'EXISTS' : 'NULL'}`);
        console.log(`      description_kr: ${sampleTitle.description_kr ? 'EXISTS' : 'NULL'}`);
        console.log(`      combined_embedding: ${sampleTitle.combined_embedding ? 'EXISTS (length: ' + sampleTitle.combined_embedding.length + ')' : 'NULL'}`);
        console.log(`      title_embedding: ${sampleTitle.title_embedding ? 'EXISTS' : 'NULL'}`);
        console.log(`      synopsis_embedding: ${sampleTitle.synopsis_embedding ? 'EXISTS' : 'NULL'}`);
        console.log(`      content_embedding: ${sampleTitle.content_embedding ? 'EXISTS' : 'NULL'}`);
      }
    }
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  }

  // 3. Count embeddings in database
  console.log('\n3️⃣ Counting Embeddings...');
  
  try {
    const { data: embeddingStats, error: countError } = await supabase
      .from('titles')
      .select('title_id, combined_embedding')
      .not('combined_embedding', 'is', null);

    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`📊 Titles with combined_embedding: ${embeddingStats?.length || 0}`);
      
      if (embeddingStats && embeddingStats.length === 0) {
        console.log('   ⚠️ NO EMBEDDINGS FOUND - This is why vector search returns 0 results');
        console.log('   🔧 SOLUTION: Generate embeddings using generate-embeddings.js');
      } else if (embeddingStats && embeddingStats.length > 0) {
        console.log('   ✅ Found embeddings! Let\'s test vector search with them...');
        
        // Test vector search with actual embeddings
        if (openai) {
          console.log('\n4️⃣ Testing Real Vector Search...');
          await testRealVectorSearch(embeddingStats[0]);
        } else {
          console.log('\n4️⃣ Cannot test real vector search - OpenAI API key not configured');
        }
      }
    }
  } catch (error) {
    console.log('❌ Count failed:', error.message);
  }

  // 4. Test the vector search service directly if possible
  console.log('\n5️⃣ Direct Service Test...');
  
  if (openai) {
    try {
      console.log('🔍 Testing embedding generation...');
      const testQuery = "romantic comedy webtoon";
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: testQuery,
      });

      const queryEmbedding = response.data[0]?.embedding;
      if (queryEmbedding) {
        console.log(`✅ Generated embedding with ${queryEmbedding.length} dimensions`);
        
        // Test with the real embedding
        const { data: realResults, error: realError } = await supabase.rpc('match_titles_by_embedding', {
          query_embedding: queryEmbedding,
          match_threshold: 0.1, // Lower threshold
          match_count: 5
        });

        if (realError) {
          console.log('❌ Real embedding search error:', realError.message);
        } else {
          console.log(`📊 Real embedding search returned: ${realResults?.length || 0} results`);
          
          if (realResults && realResults.length > 0) {
            console.log('   📋 Sample results:');
            realResults.slice(0, 2).forEach((result, idx) => {
              console.log(`      ${idx + 1}. ${result.title_name_en || result.title_name_kr} (similarity: ${result.similarity})`);
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ OpenAI embedding test failed:', error.message);
    }
  } else {
    console.log('⚠️ Cannot test OpenAI embedding - API key not configured');
    console.log('   Set VITE_OPENAI_API_KEY environment variable');
  }

  // 6. Summary and recommendations
  console.log('\n📋 DIAGNOSIS SUMMARY');
  console.log('='.repeat(50));
  
  // Check what we learned
  const { data: finalCheck } = await supabase
    .from('titles')
    .select('title_id')
    .not('combined_embedding', 'is', null)
    .limit(1);

  const hasEmbeddings = finalCheck && finalCheck.length > 0;
  const hasOpenAI = openai !== null;

  if (!hasEmbeddings) {
    console.log('🎯 ROOT CAUSE: No embeddings in database');
    console.log('');
    console.log('📋 TO FIX:');
    console.log('1. Set OpenAI API key: export VITE_OPENAI_API_KEY=sk-your-key');
    console.log('2. Generate embeddings: node generate-embeddings.js --limit=5');
    console.log('3. Test again: node debug-vector-search.js');
  } else if (!hasOpenAI) {
    console.log('🎯 ROOT CAUSE: OpenAI API key not configured');
    console.log('');
    console.log('📋 TO FIX:');
    console.log('1. Set OpenAI API key: export VITE_OPENAI_API_KEY=sk-your-key');
    console.log('2. Test chatbot with real queries');
  } else {
    console.log('🎉 Vector search should be working!');
    console.log('');
    console.log('📋 IF STILL NOT WORKING:');
    console.log('1. Check match_threshold (try lower values like 0.1)');
    console.log('2. Check embedding quality and content');
    console.log('3. Verify database function implementation');
  }
}

async function testRealVectorSearch(titleWithEmbedding) {
  console.log(`🧪 Testing vector search with existing embedding from: ${titleWithEmbedding.title_id}`);
  
  try {
    // Use the existing embedding as a query (should find similar titles including itself)
    const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: titleWithEmbedding.combined_embedding,
      match_threshold: 0.5, // Moderate threshold
      match_count: 5
    });

    if (error) {
      console.log('❌ Existing embedding search error:', error.message);
    } else {
      console.log(`📊 Using existing embedding found: ${results?.length || 0} results`);
      
      if (results && results.length > 0) {
        console.log('   📋 Results (should include the source title):');
        results.forEach((result, idx) => {
          console.log(`      ${idx + 1}. ${result.title_name_en || result.title_name_kr} (similarity: ${result.similarity})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Existing embedding test failed:', error.message);
  }
}

// Run the debug
debugVectorSearch().catch(console.error);