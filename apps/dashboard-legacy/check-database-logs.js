#!/usr/bin/env node

/**
 * Check database logs and detailed storage debugging
 * This will help identify why embeddings aren't being stored
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseLogs() {
  console.log('🔍 DATABASE STORAGE DEBUGGING');
  console.log('='.repeat(50));

  try {
    // Step 1: Check if we can modify any column at all
    console.log('\n1️⃣ Testing basic database modification...');
    
    const { data: titles, error: fetchError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, note, tagline')
      .limit(1);

    if (fetchError || !titles || titles.length === 0) {
      console.log('❌ Cannot fetch titles:', fetchError?.message);
      return;
    }

    const testTitle = titles[0];
    console.log(`📝 Testing with: ${testTitle.title_name_en || testTitle.title_name_kr}`);

    // Test simple text field update
    const testValue = `test-${Date.now()}`;
    const { error: textUpdateError } = await supabase
      .from('titles')
      .update({ note: testValue })
      .eq('title_id', testTitle.title_id);

    if (textUpdateError) {
      console.log('❌ Cannot update text field:', textUpdateError.message);
      console.log('❌ This suggests RLS or permission issues');
      return;
    }

    // Verify text update worked
    const { data: verifyText, error: verifyError } = await supabase
      .from('titles')
      .select('note')
      .eq('title_id', testTitle.title_id)
      .single();

    if (verifyError || verifyText.note !== testValue) {
      console.log('❌ Text update failed - RLS policy issue');
      console.log(`   Expected: ${testValue}`);
      console.log(`   Got: ${verifyText?.note}`);
      return;
    }

    console.log('✅ Basic text updates work');

    // Step 2: Test embedding column updates with detailed error reporting
    console.log('\n2️⃣ Testing embedding column updates...');
    
    // Create a simple test array
    const testEmbedding = Array.from({ length: 1536 }, (_, i) => i * 0.001);
    
    console.log(`📊 Test embedding: ${testEmbedding.length} dimensions`);
    console.log(`   First values: [${testEmbedding.slice(0, 3).join(', ')}...]`);
    console.log(`   Data type: ${typeof testEmbedding}`);
    console.log(`   Is array: ${Array.isArray(testEmbedding)}`);

    // Try different update approaches
    const updateAttempts = [
      {
        name: 'combined_embedding only',
        data: { combined_embedding: testEmbedding }
      },
      {
        name: 'combined_embedding + model',
        data: { 
          combined_embedding: testEmbedding,
          embedding_model: 'test-model'
        }
      },
      {
        name: 'all embedding fields',
        data: {
          combined_embedding: testEmbedding,
          title_embedding: testEmbedding.slice(0, 1536),
          embedding_model: 'test-comprehensive',
          embedding_updated_at: new Date().toISOString()
        }
      }
    ];

    for (const attempt of updateAttempts) {
      console.log(`\n   🧪 Attempt: ${attempt.name}`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('titles')
        .update(attempt.data)
        .eq('title_id', testTitle.title_id)
        .select(); // This will show what was actually updated

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        console.log(`   ❌ Error code: ${updateError.code}`);
        console.log(`   ❌ Error details:`, JSON.stringify(updateError, null, 6));
        
        if (updateError.message.includes('violates row-level security policy')) {
          console.log('   🔧 ISSUE: Row Level Security policy blocking the update');
        } else if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          console.log('   🔧 ISSUE: Column does not exist in database');
        } else if (updateError.message.includes('type')) {
          console.log('   🔧 ISSUE: Data type mismatch');
        }
        continue;
      }

      console.log(`   ✅ Update succeeded`);
      console.log(`   📊 Updated rows: ${updateResult?.length || 0}`);
      
      if (updateResult && updateResult.length > 0) {
        const updated = updateResult[0];
        console.log(`   📝 Result preview:`, {
          embedding_model: updated.embedding_model,
          has_combined_embedding: !!updated.combined_embedding,
          combined_embedding_type: typeof updated.combined_embedding
        });
      }

      // Try to read it back
      const { data: readBack, error: readError } = await supabase
        .from('titles')
        .select('combined_embedding, embedding_model, embedding_updated_at')
        .eq('title_id', testTitle.title_id)
        .single();

      if (readError) {
        console.log(`   ❌ Read-back failed: ${readError.message}`);
      } else {
        console.log(`   📊 Read-back result:`);
        console.log(`      embedding_model: ${readBack.embedding_model}`);
        console.log(`      combined_embedding type: ${typeof readBack.combined_embedding}`);
        console.log(`      combined_embedding is null: ${readBack.combined_embedding === null}`);
        console.log(`      embedding_updated_at: ${readBack.embedding_updated_at}`);
      }
    }

    // Step 3: Check database function compatibility
    console.log('\n3️⃣ Testing database function compatibility...');
    
    // Test vector search function with a simple vector
    const simpleVector = Array.from({ length: 1536 }, () => 0.1);
    
    const { data: functionResult, error: functionError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: simpleVector,
      match_threshold: 0.1,
      match_count: 5
    });

    if (functionError) {
      console.log('❌ Vector search function error:', functionError.message);
      console.log('❌ This suggests the vector extension or function has issues');
    } else {
      console.log(`✅ Vector search function works: found ${functionResult?.length || 0} results`);
    }

    // Step 4: Check constraints and policies
    console.log('\n4️⃣ Checking database constraints...');
    
    // This query will show us constraints on the titles table
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT conname, contype, confdeltype 
              FROM pg_constraint 
              WHERE conrelid = 'titles'::regclass`
      })
      .catch(() => ({ data: null, error: { message: 'Cannot access constraint info (expected for anon user)' } }));

    if (constraintError) {
      console.log('⚠️ Cannot check constraints (expected for anon user)');
    } else {
      console.log('📊 Database constraints:', constraints);
    }

    // Clean up test data
    console.log('\n5️⃣ Cleaning up...');
    await supabase
      .from('titles')
      .update({
        note: null,
        combined_embedding: null,
        title_embedding: null,
        embedding_model: null,
        embedding_updated_at: null
      })
      .eq('title_id', testTitle.title_id);

  } catch (error) {
    console.error('❌ Debugging failed:', error.message);
    console.error('Stack:', error.stack);
  }

  // Step 6: Recommendations
  console.log('\n📋 NEXT STEPS TO CHECK DATABASE LOGS:');
  console.log('='.repeat(40));
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Check "Database URL" and "JWT Secret"');
  console.log('3. Go to Supabase Dashboard → Logs');
  console.log('4. Filter by "Database" logs');
  console.log('5. Look for error messages during update attempts');
  console.log('');
  console.log('🔧 If you have access to service role key:');
  console.log('   Set SUPABASE_SERVICE_KEY=your-service-key');
  console.log('   Re-run this script for more detailed debugging');
  console.log('');
  console.log('🎯 Alternative: Use Supabase SQL Editor to run:');
  console.log('   SELECT pg_stat_activity.* FROM pg_stat_activity WHERE state = \'active\';');
}

checkDatabaseLogs().catch(console.error);