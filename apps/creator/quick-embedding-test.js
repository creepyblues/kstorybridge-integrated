#!/usr/bin/env node

/**
 * Quick test to generate one embedding and test vector search
 * This will prove the system works end-to-end
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check for OpenAI key
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
if (!openaiApiKey || openaiApiKey === 'sk-your_actual_api_key_here') {
  console.log('❌ OpenAI API key required!');
  console.log('   Run: export VITE_OPENAI_API_KEY=sk-your-actual-key');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiApiKey });

async function quickTest() {
  console.log('🚀 QUICK VECTOR SEARCH TEST');
  console.log('='.repeat(40));

  try {
    // 1. Get one title to test with
    console.log('\n1️⃣ Getting a test title...');
    const { data: titles, error: titleError } = await supabase
      .from('titles')
      .select('*')
      .is('combined_embedding', null)
      .limit(1);

    if (titleError || !titles || titles.length === 0) {
      console.log('❌ No titles found or error:', titleError?.message);
      return;
    }

    const testTitle = titles[0];
    console.log(`✅ Test title: ${testTitle.title_name_en || testTitle.title_name_kr}`);
    console.log(`   ID: ${testTitle.title_id}`);

    // 2. Generate embedding for this title
    console.log('\n2️⃣ Generating embedding...');
    
    const titleText = [testTitle.title_name_en, testTitle.title_name_kr]
      .filter(Boolean)
      .join(' | ');
    
    const combinedText = [
      `Title: ${titleText}`,
      `Description: ${testTitle.synopsis || 'No description'}`,
      `Genre: ${Array.isArray(testTitle.genre) ? testTitle.genre.join(', ') : testTitle.genre || 'Not specified'}`,
      `Tone: ${testTitle.tone || 'Not specified'}`
    ].join('\n');

    console.log(`📝 Text to embed: "${combinedText.substring(0, 200)}..."`);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: combinedText,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // 3. Store embedding in database
    console.log('\n3️⃣ Storing embedding...');
    
    const { error: updateError } = await supabase
      .from('titles')
      .update({
        combined_embedding: embedding,
        embedding_model: 'text-embedding-ada-002',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', testTitle.title_id);

    if (updateError) {
      console.log('❌ Failed to store embedding:', updateError.message);
      return;
    }

    console.log('✅ Embedding stored successfully');

    // 4. Test vector search with the same embedding (should find itself)
    console.log('\n4️⃣ Testing vector search...');
    
    const { data: searchResults, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: embedding,
      match_threshold: 0.1, // Low threshold
      match_count: 5
    });

    if (searchError) {
      console.log('❌ Vector search failed:', searchError.message);
      return;
    }

    console.log(`📊 Vector search found: ${searchResults?.length || 0} results`);

    if (searchResults && searchResults.length > 0) {
      console.log('\n✅ SUCCESS! Vector search is working:');
      searchResults.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.title_name_en || result.title_name_kr}`);
        console.log(`      Similarity: ${result.similarity.toFixed(4)}`);
        console.log(`      ID: ${result.title_id}`);
      });
    } else {
      console.log('❌ No results found - there may be a database function issue');
    }

    // 5. Test with a different query
    console.log('\n5️⃣ Testing with a different query...');
    
    const queryText = "romantic comedy webtoon about love";
    console.log(`📝 Query: "${queryText}"`);

    const queryResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: queryText,
    });

    const queryEmbedding = queryResponse.data[0]?.embedding;
    
    const { data: queryResults, error: queryError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 5
    });

    if (queryError) {
      console.log('❌ Query search failed:', queryError.message);
    } else {
      console.log(`📊 Query search found: ${queryResults?.length || 0} results`);
      
      if (queryResults && queryResults.length > 0) {
        console.log('   📋 Query results:');
        queryResults.forEach((result, idx) => {
          console.log(`      ${idx + 1}. ${result.title_name_en || result.title_name_kr} (${result.similarity.toFixed(4)})`);
        });
      }
    }

    console.log('\n🎉 QUICK TEST COMPLETE!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Generate more embeddings: node generate-embeddings.js --limit=10');
    console.log('2. Test OpenAI chatbot with real queries');
    console.log('3. Verify vector search works in production');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest().catch(console.error);