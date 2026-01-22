/**
 * Test why "I Became a Doting Father" doesn't show up when searching for "This Is Us"
 * The title has "This Is Us" in its comps array
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testThisIsUsSearch() {
  console.log('🔍 Testing "This Is Us" search...\n');

  // 1. Check the title's comps field
  const { data: title, error: titleError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, comps, combined_embedding, synopsis, genre, tone, content_format')
    .eq('title_name_en', 'I Became a Doting Father')
    .single();

  if (titleError) {
    console.error('❌ Error:', titleError);
    return;
  }

  console.log('Title:', title.title_name_en);
  console.log('Comps:', title.comps);
  console.log('Has embedding:', title.combined_embedding ? 'YES' : 'NO');
  console.log('Embedding length:', title.combined_embedding ? title.combined_embedding.length : 0);
  console.log('Synopsis:', title.synopsis?.substring(0, 100) + '...');
  console.log('Genre:', title.genre);
  console.log('Tone:', title.tone);
  console.log('Format:', title.content_format);
  console.log('');

  // 2. Generate embedding for "This Is Us"
  console.log('📝 Calling comp-navigator edge function...\n');

  const { data, error } = await supabase.functions.invoke('comp-navigator', {
    body: {
      comp_titles: ['This Is Us'],
      user_email: 'sungho@kstorybridge.com',
      save_search: false
    },
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (error) {
    console.error('❌ Edge function error:', error);
    return;
  }

  console.log('Results count:', data.results.length);
  console.log('Processing time:', data.processing_time_ms, 'ms');
  console.log('Cost:', data.cost_estimate);
  console.log('');

  if (data.results.length === 0) {
    console.log('⚠️  NO RESULTS RETURNED\n');
    console.log('Possible reasons:');
    console.log('1. Vector search threshold too high (currently 0.6)');
    console.log('2. LLM filtered out all candidates during re-ranking');
    console.log('3. Embedding dimension mismatch');
    console.log('4. Title has no valid embedding');
  } else {
    console.log('✅ Results:');
    data.results.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.title_name_en}`);
      console.log(`   Match Score: ${r.match_score}`);
      console.log(`   Explanation: ${r.explanation}`);
    });
  }

  // 3. Check if we can find it with lower threshold
  console.log('\n' + '='.repeat(60));
  console.log('Testing with direct vector search (lower threshold)...\n');

  // Get "This Is Us" embedding from cache
  const { data: cached } = await supabase
    .from('comp_title_cache')
    .select('embedding')
    .eq('comp_title', 'this is us')
    .single();

  if (cached && cached.embedding) {
    console.log('✅ Found "This Is Us" embedding in cache\n');

    // Direct vector search with lower threshold
    const { data: matches, error: matchError } = await supabase
      .rpc('match_titles_by_embedding', {
        query_embedding: cached.embedding,
        match_threshold: 0.5, // Lower threshold
        match_count: 30
      });

    if (matchError) {
      console.error('❌ Vector search error:', matchError);
    } else {
      console.log(`Found ${matches.length} candidates (threshold: 0.5)\n`);

      // Check if "I Became a Doting Father" is in the results
      const dotingFather = matches.find(m => m.title_name_en === 'I Became a Doting Father');

      if (dotingFather) {
        console.log('✅ "I Became a Doting Father" FOUND in vector search!');
        console.log(`   Similarity: ${dotingFather.similarity}`);
        console.log(`   Rank: ${matches.indexOf(dotingFather) + 1} / ${matches.length}`);
        console.log('\n   This means the LLM is filtering it out during re-ranking.');
      } else {
        console.log('❌ "I Became a Doting Father" NOT in vector search results');
        console.log('   This means the embedding similarity is too low.');
        console.log('\nTop 5 matches:');
        matches.slice(0, 5).forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title_name_en} (similarity: ${m.similarity})`);
        });
      }
    }
  } else {
    console.log('⚠️  "This Is Us" not in cache yet');
  }
}

testThisIsUsSearch();
