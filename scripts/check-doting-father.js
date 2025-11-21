/**
 * Check why "I Became a Doting Father" doesn't show up in comp search
 * Expected: Should match "This Is Us" comp
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDotingFather() {
  console.log('🔍 Checking "I Became a Doting Father" title...\n');

  // 1. Check if title exists
  const { data: title, error: titleError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, comps, genre, tone, synopsis, combined_embedding, views, rating, content_format')
    .or('title_name_en.ilike.%doting%,title_name_en.ilike.%father%')
    .limit(5);

  if (titleError) {
    console.error('❌ Error fetching title:', titleError);
    return;
  }

  if (!title || title.length === 0) {
    console.log('❌ Title not found in database');
    return;
  }

  console.log(`✅ Found ${title.length} matching title(s):\n`);

  for (const t of title) {
    console.log(`Title: ${t.title_name_en} (${t.title_name_kr})`);
    console.log(`  ID: ${t.title_id}`);
    console.log(`  Comps: ${t.comps}`);
    console.log(`  Genre: ${t.genre}`);
    console.log(`  Tone: ${t.tone}`);
    console.log(`  Views: ${t.views}`);
    console.log(`  Rating: ${t.rating}`);
    console.log(`  Has Embedding: ${t.combined_embedding ? 'YES' : 'NO'}`);
    console.log(`  Embedding Length: ${t.combined_embedding ? t.combined_embedding.length : 0}`);
    console.log(`  Synopsis Length: ${t.synopsis ? t.synopsis.length : 0} chars`);
    console.log('');

    // 2. Check if it has valid embedding
    if (!t.combined_embedding) {
      console.log('⚠️  ISSUE: Title has no embedding! Cannot be found by vector search.');
      console.log('   Solution: Need to generate embedding for this title.\n');
    } else if (t.combined_embedding.length !== 1536) {
      console.log(`⚠️  ISSUE: Invalid embedding dimension (${t.combined_embedding.length}, expected 1536)`);
      console.log('   Solution: Need to regenerate embedding.\n');
    } else {
      // Check for null values
      const nullCount = t.combined_embedding.filter(v => v === null || v === undefined).length;
      if (nullCount > 0) {
        console.log(`⚠️  ISSUE: Embedding contains ${nullCount} null values`);
        console.log('   Solution: Need to regenerate embedding.\n');
      } else {
        console.log('✅ Embedding is valid (1536 dimensions, no nulls)\n');
      }
    }

    // 3. Test similarity with "This Is Us" embedding
    console.log('🔍 Testing similarity with "This Is Us" comp...\n');

    // Check if "This Is Us" is in the comp_title_cache
    const { data: thisIsUsCache, error: cacheError } = await supabase
      .from('comp_title_cache')
      .select('embedding')
      .eq('comp_title', 'this is us')
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.error('❌ Error fetching "This Is Us" cache:', cacheError);
    }

    if (thisIsUsCache && thisIsUsCache.embedding) {
      console.log('✅ "This Is Us" embedding found in cache');

      // Calculate cosine similarity
      const titleEmb = t.combined_embedding;
      const compEmb = thisIsUsCache.embedding;

      let dotProduct = 0;
      let titleMag = 0;
      let compMag = 0;

      for (let i = 0; i < 1536; i++) {
        dotProduct += titleEmb[i] * compEmb[i];
        titleMag += titleEmb[i] * titleEmb[i];
        compMag += compEmb[i] * compEmb[i];
      }

      const similarity = dotProduct / (Math.sqrt(titleMag) * Math.sqrt(compMag));
      console.log(`   Similarity score: ${similarity.toFixed(4)} (threshold: 0.6)\n`);

      if (similarity < 0.6) {
        console.log('⚠️  ISSUE: Similarity below threshold (0.6)');
        console.log('   This title would not appear in vector search results.');
      } else {
        console.log('✅ Similarity above threshold - should appear in results!\n');
      }
    } else {
      console.log('⚠️  "This Is Us" not in cache yet\n');
    }
  }

  // 4. Check match_titles_by_embedding function
  console.log('='.repeat(60));
  console.log('Testing vector search function directly...\n');

  if (title[0] && title[0].combined_embedding) {
    const { data: matches, error: matchError } = await supabase
      .rpc('match_titles_by_embedding', {
        query_embedding: title[0].combined_embedding,
        match_threshold: 0.6,
        match_count: 10
      });

    if (matchError) {
      console.error('❌ Error in match_titles_by_embedding:', matchError);
    } else {
      console.log(`✅ Vector search returned ${matches ? matches.length : 0} matches`);
      if (matches && matches.length > 0) {
        console.log('   Top matches:');
        matches.slice(0, 5).forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title_name_en} (similarity: ${m.similarity})`);
        });
      }
    }
  }
}

checkDotingFather();
