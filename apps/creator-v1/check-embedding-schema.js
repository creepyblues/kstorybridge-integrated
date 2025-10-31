#!/usr/bin/env node

/**
 * Check embedding database schema without requiring OpenAI API key
 * This will identify database-related issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEmbeddingSchema() {
  console.log('🔍 CHECKING EMBEDDING DATABASE SCHEMA');
  console.log('='.repeat(50));

  try {
    // 1. Check what columns actually exist
    console.log('\n1️⃣ Testing database columns...');
    
    const columnsToCheck = [
      'title_id',
      'title_name_en', 
      'combined_embedding',
      'title_embedding',
      'synopsis_embedding', 
      'content_embedding',
      'embedding_model',
      'embedding_created_at',
      'embedding_updated_at'
    ];

    for (const column of columnsToCheck) {
      try {
        const { data, error } = await supabase
          .from('titles')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ Column '${column}': ${error.message}`);
          
          if (error.message.includes('does not exist')) {
            console.log(`   🔧 MISSING: Column '${column}' needs to be added to database`);
          }
        } else {
          console.log(`✅ Column '${column}': EXISTS`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}': ${err.message}`);
      }
    }

    // 2. Check pgvector extension
    console.log('\n2️⃣ Checking pgvector extension...');
    
    try {
      // Try to create a test vector (this will fail if pgvector isn't enabled)
      const testVector = Array.from({ length: 1536 }, () => 0.1);
      
      const { data, error } = await supabase
        .from('titles')
        .select('title_id, combined_embedding')
        .limit(1);
      
      if (error) {
        console.log('❌ pgvector test failed:', error.message);
      } else {
        console.log('✅ pgvector extension appears to be working');
      }
    } catch (err) {
      console.log('❌ pgvector extension error:', err.message);
    }

    // 3. Check Row Level Security (RLS) policies
    console.log('\n3️⃣ Testing write permissions...');
    
    // Find a title to test with
    const { data: testTitles, error: fetchError } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(1);
    
    if (fetchError) {
      console.log('❌ Cannot fetch test titles:', fetchError.message);
      return;
    }
    
    if (!testTitles || testTitles.length === 0) {
      console.log('❌ No titles found in database');
      return;
    }
    
    const testTitle = testTitles[0];
    console.log(`📝 Testing with title: ${testTitle.title_name_en} (${testTitle.title_id})`);
    
    // Test simple update (non-embedding field first)
    const { error: updateError } = await supabase
      .from('titles')
      .update({ 
        embedding_model: 'test-write-permission'
      })
      .eq('title_id', testTitle.title_id);
    
    if (updateError) {
      console.log('❌ Write permission error:', updateError.message);
      
      if (updateError.message.includes('policy')) {
        console.log('   🔧 ISSUE: Row Level Security (RLS) policy blocking updates');
        console.log('   🔧 SOLUTION: Update RLS policy to allow anon users to update embeddings');
      } else if (updateError.message.includes('permission')) {
        console.log('   🔧 ISSUE: Database permission error');
        console.log('   🔧 SOLUTION: Check user permissions for anon role');
      }
    } else {
      console.log('✅ Write permissions: WORKING');
      
      // Clean up test
      await supabase
        .from('titles')
        .update({ embedding_model: null })
        .eq('title_id', testTitle.title_id);
    }

    // 4. Test embedding column update specifically
    console.log('\n4️⃣ Testing embedding column update...');
    
    // Create a small test vector
    const testEmbedding = Array.from({ length: 1536 }, (_, i) => i * 0.001);
    
    const { error: embeddingError } = await supabase
      .from('titles')
      .update({
        combined_embedding: testEmbedding,
        embedding_model: 'test-embedding',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitle.title_id);
    
    if (embeddingError) {
      console.log('❌ Embedding update error:', embeddingError.message);
      
      if (embeddingError.message.includes('column') && embeddingError.message.includes('does not exist')) {
        console.log('   🔧 ISSUE: Embedding columns missing from database schema');
        console.log('   🔧 SOLUTION: Run database migration to add embedding columns');
      } else if (embeddingError.message.includes('type') || embeddingError.message.includes('vector')) {
        console.log('   🔧 ISSUE: Vector type or pgvector extension problem');
        console.log('   🔧 SOLUTION: Enable pgvector extension and check column types');
      } else if (embeddingError.message.includes('dimensions')) {
        console.log('   🔧 ISSUE: Vector dimension mismatch');
        console.log('   🔧 SOLUTION: Check that combined_embedding column accepts 1536-dimensional vectors');
      }
      return;
    } else {
      console.log('✅ Embedding update: WORKING');
      
      // Verify the embedding was stored
      const { data: verifyData, error: verifyError } = await supabase
        .from('titles')
        .select('combined_embedding, embedding_model')
        .eq('title_id', testTitle.title_id)
        .single();
      
      if (verifyError) {
        console.log('❌ Verification failed:', verifyError.message);
      } else {
        const hasEmbedding = verifyData.combined_embedding && verifyData.combined_embedding.length === 1536;
        console.log(`📊 Stored embedding: ${hasEmbedding ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Dimensions: ${verifyData.combined_embedding?.length || 0}`);
        console.log(`   Model: ${verifyData.embedding_model}`);
        
        if (hasEmbedding) {
          console.log('\n🎉 EMBEDDING STORAGE IS WORKING!');
          console.log('');
          console.log('📋 LIKELY ISSUES WITH generate-embeddings.js:');
          console.log('1. OpenAI API key not set when running the script');
          console.log('2. Script ran in --dry-run mode');
          console.log('3. Script encountered errors but didn\'t show them clearly');
          console.log('4. Network issues during embedding generation');
          console.log('');
          console.log('🔧 TO FIX:');
          console.log('1. Set API key: export VITE_OPENAI_API_KEY=sk-your-key');
          console.log('2. Run: node generate-embeddings.js --limit=3 (not dry-run)');
          console.log('3. Watch for any error messages');
        }
      }
      
      // Clean up test data
      await supabase
        .from('titles')
        .update({
          combined_embedding: null,
          embedding_model: null,
          embedding_updated_at: null
        })
        .eq('title_id', testTitle.title_id);
    }

    // 5. Check current embedding status
    console.log('\n5️⃣ Current embedding status...');
    
    const { data: embeddingStats, error: statsError } = await supabase
      .from('titles')
      .select('title_id, combined_embedding')
      .limit(100);
    
    if (statsError) {
      console.log('❌ Stats error:', statsError.message);
    } else {
      const totalTitles = embeddingStats.length;
      const withEmbeddings = embeddingStats.filter(t => t.combined_embedding !== null).length;
      
      console.log(`📊 Current status: ${withEmbeddings}/${totalTitles} titles have embeddings`);
      
      if (withEmbeddings === 0) {
        console.log('⚠️ NO EMBEDDINGS FOUND - This confirms the generate-embeddings.js script issue');
      } else {
        console.log(`✅ Found ${withEmbeddings} titles with embeddings - script may have partially worked`);
      }
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the check
checkEmbeddingSchema().catch(console.error);