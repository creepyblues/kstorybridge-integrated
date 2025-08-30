#!/usr/bin/env node

/**
 * Debug embedding generation and storage issues
 * This will help identify why embeddings aren't being stored
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZUI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check OpenAI setup
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
let openai = null;

if (!openaiApiKey || openaiApiKey === 'sk-your_actual_api_key_here') {
  console.log('❌ OpenAI API key not configured');
  console.log('   Run: export VITE_OPENAI_API_KEY=sk-your-actual-key');
  process.exit(1);
}

openai = new OpenAI({ apiKey: openaiApiKey });

async function debugEmbeddingStorage() {
  console.log('🔍 DEBUGGING EMBEDDING STORAGE');
  console.log('='.repeat(50));

  try {
    // 1. Check database schema - what columns exist
    console.log('\n1️⃣ Checking database schema...');
    
    const { data: schemaTest, error: schemaError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding, title_embedding, synopsis_embedding, content_embedding, embedding_model, embedding_created_at, embedding_updated_at')
      .limit(1);

    if (schemaError) {
      console.log('❌ Schema error:', schemaError.message);
      
      if (schemaError.message.includes('column') && schemaError.message.includes('does not exist')) {
        const missingColumn = schemaError.message.match(/column "([^"]+)"/)?.[1];
        console.log(`🔧 Missing column: ${missingColumn}`);
        console.log('   The embedding columns may not exist in the database');
        console.log('   Check your database migrations');
      }
      return;
    } else {
      console.log('✅ Schema check successful');
      console.log('   Available embedding columns confirmed');
    }

    // 2. Check permissions - can we write to the table?
    console.log('\n2️⃣ Testing database write permissions...');
    
    const testTitleId = '28997934-79a3-433a-98b7-8182a8ee83a5'; // First title from earlier
    
    // Try a simple update (without embeddings first)
    const { error: permissionError } = await supabase
      .from('titles')
      .update({ 
        embedding_model: 'test-permission-check',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitleId);

    if (permissionError) {
      console.log('❌ Write permission error:', permissionError.message);
      console.log('   The anon key may not have write permissions');
      console.log('   Check Row Level Security (RLS) policies');
      return;
    } else {
      console.log('✅ Write permissions confirmed');
      
      // Clean up test
      await supabase
        .from('titles')
        .update({ 
          embedding_model: null,
          embedding_updated_at: null
        })
        .eq('title_id', testTitleId);
    }

    // 3. Test embedding generation
    console.log('\n3️⃣ Testing embedding generation...');
    
    const testText = "This is a test text for embedding generation";
    console.log(`📝 Test text: "${testText}"`);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testText,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      console.log('❌ Failed to generate embedding');
      return;
    }

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    console.log(`💰 Tokens used: ${response.usage.total_tokens}`);

    // 4. Test embedding storage
    console.log('\n4️⃣ Testing embedding storage...');
    
    const { data: beforeUpdate, error: beforeError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding')
      .eq('title_id', testTitleId)
      .single();

    if (beforeError) {
      console.log('❌ Failed to fetch test title:', beforeError.message);
      return;
    }

    console.log(`📊 Before update: ${beforeUpdate.title_name_en}`);
    console.log(`   Combined embedding: ${beforeUpdate.combined_embedding ? 'EXISTS' : 'NULL'}`);

    // Try to store the embedding
    const { error: storageError, data: updateData } = await supabase
      .from('titles')
      .update({
        combined_embedding: embedding,
        embedding_model: 'text-embedding-ada-002',
        embedding_created_at: new Date().toISOString(),
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitleId)
      .select('title_id, combined_embedding');

    if (storageError) {
      console.log('❌ Storage error:', storageError.message);
      console.log('   Error details:', storageError);
      
      if (storageError.message.includes('column') && storageError.message.includes('does not exist')) {
        console.log('🔧 SOLUTION: Add missing embedding columns to database');
        console.log('   Run the vector search migration SQL');
      } else if (storageError.message.includes('permission') || storageError.message.includes('policy')) {
        console.log('🔧 SOLUTION: Update Row Level Security policies');
        console.log('   Allow anon users to update title embeddings');
      } else if (storageError.message.includes('type') || storageError.message.includes('vector')) {
        console.log('🔧 SOLUTION: Check vector extension and column types');
        console.log('   Ensure pgvector extension is enabled');
      }
      return;
    } else {
      console.log('✅ Embedding stored successfully!');
      console.log(`   Updated ${updateData?.length || 0} rows`);
    }

    // 5. Verify storage
    console.log('\n5️⃣ Verifying embedding storage...');
    
    const { data: afterUpdate, error: afterError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, combined_embedding, embedding_model, embedding_updated_at')
      .eq('title_id', testTitleId)
      .single();

    if (afterError) {
      console.log('❌ Failed to verify storage:', afterError.message);
      return;
    }

    console.log(`📊 After update: ${afterUpdate.title_name_en}`);
    console.log(`   Combined embedding: ${afterUpdate.combined_embedding ? `EXISTS (${afterUpdate.combined_embedding.length} dims)` : 'NULL'}`);
    console.log(`   Model: ${afterUpdate.embedding_model || 'NULL'}`);
    console.log(`   Updated: ${afterUpdate.embedding_updated_at || 'NULL'}`);

    if (afterUpdate.combined_embedding && afterUpdate.combined_embedding.length === 1536) {
      console.log('\n🎉 SUCCESS! Embedding storage is working correctly');
      console.log('');
      console.log('📋 NEXT STEPS:');
      console.log('1. The database and permissions are working');
      console.log('2. Re-run generate-embeddings.js --limit=5');
      console.log('3. Check for any script errors or exceptions');
      console.log('4. Verify the script is using the correct API key');
    } else {
      console.log('\n❌ Embedding storage verification failed');
      console.log('   The embedding was not stored correctly');
    }

    // 6. Test vector search with stored embedding
    console.log('\n6️⃣ Testing vector search...');
    
    if (afterUpdate.combined_embedding) {
      const { data: searchResults, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
        query_embedding: afterUpdate.combined_embedding,
        match_threshold: 0.1,
        match_count: 3
      });

      if (searchError) {
        console.log('❌ Vector search error:', searchError.message);
      } else {
        console.log(`✅ Vector search found ${searchResults?.length || 0} results`);
        if (searchResults && searchResults.length > 0) {
          console.log('   📋 Results:');
          searchResults.forEach((result, idx) => {
            console.log(`      ${idx + 1}. ${result.title_name_en || result.title_name_kr} (${result.similarity.toFixed(4)})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Check specific issues with generate-embeddings.js
async function checkScriptIssues() {
  console.log('\n🔍 CHECKING GENERATE-EMBEDDINGS.JS ISSUES');
  console.log('='.repeat(50));

  // Check if the script file exists and is readable
  try {
    const fs = await import('fs/promises');
    const scriptContent = await fs.readFile('generate-embeddings.js', 'utf8');
    console.log('✅ generate-embeddings.js file exists and is readable');
    
    // Check for common issues in the script
    if (scriptContent.includes('isDryRun')) {
      console.log('✅ Dry-run mode check exists');
    }
    
    if (scriptContent.includes('.from(\'titles\')')) {
      console.log('✅ Database table reference looks correct');
    }
    
    if (scriptContent.includes('combined_embedding')) {
      console.log('✅ Embedding column reference exists');
    }
    
    // Check for potential issues
    if (scriptContent.includes('console.log') && !scriptContent.includes('console.error')) {
      console.log('⚠️ Script may not be showing errors properly');
    }
    
  } catch (error) {
    console.log('❌ Cannot read generate-embeddings.js:', error.message);
  }

  // Check recent titles that should have been processed
  console.log('\n📊 Checking recent embedding attempts...');
  
  const { data: recentTitles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding, embedding_updated_at')
    .order('embedding_updated_at', { ascending: false, nullsLast: true })
    .limit(10);

  if (error) {
    console.log('❌ Error checking recent titles:', error.message);
  } else {
    console.log(`📋 Recent titles (showing embedding status):`);
    recentTitles.forEach((title, idx) => {
      const hasEmbedding = title.combined_embedding ? '✅' : '❌';
      const updated = title.embedding_updated_at || 'Never';
      console.log(`   ${idx + 1}. ${hasEmbedding} ${title.title_name_en || 'No English title'} (${updated})`);
    });
    
    const withEmbeddings = recentTitles.filter(t => t.combined_embedding).length;
    console.log(`\n📊 Summary: ${withEmbeddings}/${recentTitles.length} titles have embeddings`);
  }
}

async function main() {
  await debugEmbeddingStorage();
  await checkScriptIssues();
}

main().catch(console.error);