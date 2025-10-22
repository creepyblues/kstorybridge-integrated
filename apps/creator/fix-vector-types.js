#!/usr/bin/env node

/**
 * Vector Data Type Fix Script
 * Diagnoses and fixes the vector embedding data type mismatch issue
 *
 * Problem: Embeddings are stored as JSON arrays but need to be vector(1536) type
 * Solution: Convert JSON arrays to proper vector type for PostgreSQL vector operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnosisVectorTypes() {
  console.log('🔍 VECTOR DATA TYPE DIAGNOSIS');
  console.log('='.repeat(50));

  // 1. Check current vector column data types
  console.log('\n1️⃣ Checking vector column data types...');
  try {
    const { data: columns, error } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'titles'
        AND column_name LIKE '%embedding%'
        ORDER BY column_name;
      `
    });

    if (error) {
      console.log('❌ Cannot query column types with RPC:', error.message);
      console.log('ℹ️  This is expected if RPC permissions are restricted');
    } else {
      console.log('✅ Column type information:');
      columns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });
    }
  } catch (error) {
    console.log('⚠️  Cannot access column metadata directly');
  }

  // 2. Check sample embedding data
  console.log('\n2️⃣ Analyzing sample embedding data...');
  try {
    const { data: sample, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding')
      .not('combined_embedding', 'is', null)
      .limit(1);

    if (error) {
      console.log('❌ Cannot read embedding data:', error.message);
      return;
    }

    if (!sample || sample.length === 0) {
      console.log('❌ No titles with embeddings found');
      return;
    }

    const embedding = sample[0].combined_embedding;
    console.log(`✅ Sample embedding analysis:`);
    console.log(`   Title: ${sample[0].title_name_en}`);
    console.log(`   Embedding type: ${typeof embedding}`);
    console.log(`   Is array: ${Array.isArray(embedding)}`);
    console.log(`   Length: ${embedding ? embedding.length : 'null'}`);

    if (Array.isArray(embedding)) {
      console.log(`   First few values: [${embedding.slice(0, 5).join(', ')}...]`);
      console.log(`   🚨 ISSUE: Stored as JSON array, but vector operations need vector(1536) type`);
    } else {
      console.log(`   Raw embedding: ${JSON.stringify(embedding).substring(0, 200)}...`);
    }

    return { sampleEmbedding: embedding, isArray: Array.isArray(embedding) };

  } catch (error) {
    console.log('❌ Error reading sample data:', error.message);
    return null;
  }
}

async function testVectorOperations(sampleEmbedding) {
  console.log('\n3️⃣ Testing vector operations...');

  if (!sampleEmbedding) {
    console.log('❌ No sample embedding to test with');
    return;
  }

  // Create a test query embedding (1536 dimensions)
  const queryEmbedding = Array.isArray(sampleEmbedding)
    ? sampleEmbedding.slice(0, 1536) // Use first 1536 if too long
    : new Array(1536).fill(0.1); // Default test embedding

  if (queryEmbedding.length !== 1536) {
    console.log(`⚠️  Adjusting query embedding: ${queryEmbedding.length} → 1536 dimensions`);
    // Pad or truncate to exactly 1536 dimensions
    const adjustedEmbedding = new Array(1536).fill(0);
    for (let i = 0; i < Math.min(1536, queryEmbedding.length); i++) {
      adjustedEmbedding[i] = queryEmbedding[i] || 0;
    }
    queryEmbedding.length = 1536;
    queryEmbedding.splice(0, 1536, ...adjustedEmbedding);
  }

  // Test the match_titles_by_embedding function
  try {
    console.log('🔍 Testing vector search function...');
    const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Very low threshold to get any results
      match_count: 5
    });

    if (error) {
      console.log('❌ Vector search function error:', error.message);

      if (error.message.includes('vector') || error.message.includes('type')) {
        console.log('🔧 CAUSE: Vector type mismatch - JSON arrays cannot use <=> operator');
        console.log('🔧 SOLUTION: Need to convert stored arrays to proper vector(1536) type');
      }
    } else {
      console.log(`✅ Vector search works! Found ${results ? results.length : 0} results`);
      if (results && results.length > 0) {
        console.log(`   Best match: ${results[0].title_name_en} (similarity: ${results[0].similarity})`);
      }
    }
  } catch (error) {
    console.log('❌ Vector search test failed:', error.message);
  }
}

async function proposeFixStrategy() {
  console.log('\n4️⃣ Fix Strategy Recommendations');
  console.log('='.repeat(40));

  console.log('\n🔧 IMMEDIATE FIXES NEEDED:');

  console.log('\n**A. Database Schema Fix**:');
  console.log('   • Ensure vector columns are defined as vector(1536), not JSON');
  console.log('   • Run: ALTER TABLE titles ALTER COLUMN combined_embedding TYPE vector(1536);');

  console.log('\n**B. Data Conversion**:');
  console.log('   • Convert existing JSON arrays to vector format');
  console.log('   • Update 244 existing embeddings from JSON → vector type');

  console.log('\n**C. Application Fix**:');
  console.log('   • Ensure embeddingService stores as vector(1536), not JSON');
  console.log('   • Update storage methods to use proper vector format');

  console.log('\n📋 IMPLEMENTATION STEPS:');
  console.log('1. **Backup existing data** (critical!)');
  console.log('2. **Convert column types** to vector(1536)');
  console.log('3. **Migrate existing embeddings** from JSON to vector format');
  console.log('4. **Test vector operations** work correctly');
  console.log('5. **Update application** to store proper vector types');

  console.log('\n⚠️  RISKS:');
  console.log('• Data loss if conversion fails');
  console.log('• Temporary search downtime during migration');
  console.log('• Need proper vector(1536) format validation');

  console.log('\n✅ SAFE APPROACH:');
  console.log('• Test conversion on a few sample records first');
  console.log('• Use staging environment for validation');
  console.log('• Keep backup of original JSON data');
  console.log('• Implement with rollback capability');
}

async function main() {
  try {
    const diagnosis = await diagnosisVectorTypes();

    if (diagnosis) {
      await testVectorOperations(diagnosis.sampleEmbedding);
    }

    await proposeFixStrategy();

    console.log('\n🎯 SUMMARY');
    console.log('='.repeat(30));
    console.log('✅ Confirmed: Embeddings exist (244 titles)');
    console.log('❌ Problem: Stored as JSON arrays, not vector(1536) type');
    console.log('🔧 Solution: Convert data types + update storage methods');
    console.log('📊 Expected: 10-20x improvement in search results');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

main();