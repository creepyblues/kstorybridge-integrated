#!/usr/bin/env node

/**
 * Test script to debug embedding storage for a single title
 * This will show detailed error information to diagnose the issue
 *
 * Usage:
 * export VITE_OPENAI_API_KEY=your-key
 * export SUPABASE_SERVICE_ROLE_KEY=your-key
 * node test-single-embedding.js TITLE_ID
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set!');
  process.exit(1);
}

const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('❌ VITE_OPENAI_API_KEY not set!');
  process.exit(1);
}

const titleId = process.argv[2];
if (!titleId) {
  console.error('❌ Usage: node test-single-embedding.js TITLE_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function main() {
  console.log('🔍 Testing embedding storage for single title');
  console.log(`   Title ID: ${titleId}\n`);

  try {
    // 1. Fetch the title
    console.log('📖 Step 1: Fetching title...');
    const { data: title, error: fetchError } = await supabase
      .from('titles')
      .select('*')
      .eq('title_id', titleId)
      .single();

    if (fetchError || !title) {
      console.error('❌ Failed to fetch title:', fetchError?.message);
      return;
    }

    console.log('✅ Title found:', title.title_name_en || title.title_name_kr);

    // 2. Generate a test embedding
    console.log('\n🤖 Step 2: Generating test embedding...');
    const testText = `${title.title_name_en || title.title_name_kr}`;

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testText,
    });

    const embedding = response.data[0].embedding;
    console.log('✅ Embedding generated:', {
      dimensions: embedding.length,
      type: typeof embedding,
      isArray: Array.isArray(embedding),
      firstFewValues: embedding.slice(0, 3)
    });

    // 3. Try to store the embedding
    console.log('\n💾 Step 3: Attempting to store embedding...');
    console.log('   Using: SUPABASE_SERVICE_ROLE_KEY');

    const { data: updateResult, error: updateError } = await supabase
      .from('titles')
      .update({
        combined_embedding: embedding,
        embedding_model: 'text-embedding-ada-002',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', titleId)
      .select('combined_embedding, embedding_model, embedding_updated_at');

    if (updateError) {
      console.error('❌ UPDATE FAILED:');
      console.error('   Message:', updateError.message);
      console.error('   Details:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Update query executed successfully');
    console.log('   Update result:', JSON.stringify(updateResult, null, 2));

    // 4. Verify what was stored
    console.log('\n🔍 Step 4: Verifying stored embedding...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('titles')
      .select('combined_embedding, embedding_model, embedding_updated_at')
      .eq('title_id', titleId)
      .single();

    if (verifyError) {
      console.error('❌ VERIFICATION FETCH FAILED:', verifyError.message);
      return;
    }

    console.log('📊 Verification result:');
    console.log('   Has embedding:', !!verifyData?.combined_embedding);
    console.log('   Type:', typeof verifyData?.combined_embedding);
    console.log('   Is array:', Array.isArray(verifyData?.combined_embedding));
    console.log('   Length:', Array.isArray(verifyData?.combined_embedding) ? verifyData.combined_embedding.length : 'N/A');
    console.log('   Model:', verifyData?.embedding_model);
    console.log('   Updated at:', verifyData?.embedding_updated_at);

    if (Array.isArray(verifyData?.combined_embedding)) {
      console.log('   First few values:', verifyData.combined_embedding.slice(0, 3));
    }

    // 5. Final verdict
    const hasEmbedding = !!verifyData?.combined_embedding;
    const isArray = Array.isArray(verifyData?.combined_embedding);
    const isValid = isArray && verifyData.combined_embedding.length === 1536;

    console.log('\n' + '='.repeat(50));
    if (hasEmbedding) {
      console.log('✅ SUCCESS: Embedding stored in database!');
      console.log('   Has embedding:', hasEmbedding);
      console.log('   Is array:', isArray);
      console.log('   Length:', isArray ? verifyData.combined_embedding.length : 'N/A');
      console.log('   Model:', verifyData.embedding_model);

      if (isValid) {
        console.log('\n✅ PERFECT: Embedding has correct dimensions (1536)');
        console.log('   The database is working properly for this title.');
      } else {
        console.log('\n⚠️  WARNING: Embedding stored but format is unexpected');
        console.log('   This may be how Supabase serializes pgvector types');
        console.log('   As long as the embedding exists, vector search should work');
      }
    } else {
      console.log('❌ FAILURE: No embedding found in database');
      console.log('   Expected: Vector embedding data');
      console.log('   Got:', {
        type: typeof verifyData?.combined_embedding,
        value: verifyData?.combined_embedding,
        model: verifyData?.embedding_model,
        updated: verifyData?.embedding_updated_at
      });
      console.log('\n💡 Possible causes:');
      console.log('   1. Database column type is not vector(1536)');
      console.log('   2. UPDATE query failed silently');
      console.log('   3. RLS policy is blocking the write (even with service role)');
      console.log('\n🔧 Next steps:');
      console.log('   1. Run diagnose-embeddings.sql in Supabase SQL Editor');
      console.log('   2. Check the column type for combined_embedding');
      console.log('   3. Verify pgvector extension is enabled');
      console.log('   4. Check RLS policies on titles table');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('   Stack:', error.stack);
  }
}

main().catch(console.error);
