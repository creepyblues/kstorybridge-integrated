/**
 * Test vector search for "horror" genre
 * Diagnose why horror search returns non-horror titles
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Missing required environment variable: OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function testHorrorSearch() {
  console.log('🎬 Testing Vector Search for "horror" Genre\n');
  console.log('='.repeat(70) + '\n');

  // Step 1: Check database for horror titles
  console.log('1️⃣ CHECKING DATABASE FOR HORROR TITLES\n');

  const { data: allTitles, error: allError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, genre, tone, synopsis, combined_embedding')
    .not('combined_embedding', 'is', null)
    .limit(1000);

  if (allError) {
    console.error('❌ Error fetching titles:', allError);
    return;
  }

  console.log(`📊 Total titles with embeddings: ${allTitles.length}\n`);

  // Find titles with "horror" in genre
  const horrorTitles = allTitles.filter(t => {
    if (!t.genre) return false;
    const genres = Array.isArray(t.genre) ? t.genre : [t.genre];
    return genres.some(g => g.toLowerCase().includes('horror'));
  });

  console.log(`🎃 Titles with "horror" in genre: ${horrorTitles.length}`);

  if (horrorTitles.length > 0) {
    console.log('\nHorror titles found:');
    horrorTitles.slice(0, 10).forEach(t => {
      const genres = Array.isArray(t.genre) ? t.genre.join(', ') : t.genre;
      console.log(`  - ${t.title_name_en || t.title_name_kr}: [${genres}]`);
      if (t.synopsis) {
        console.log(`    Synopsis: ${t.synopsis.substring(0, 100)}...`);
      }
    });
    if (horrorTitles.length > 10) {
      console.log(`  ... and ${horrorTitles.length - 10} more`);
    }
  } else {
    console.log('⚠️  NO HORROR TITLES FOUND IN DATABASE');
    console.log('   This explains why horror search returns non-horror titles!\n');

    // Show what genres exist
    const genreSet = new Set();
    allTitles.forEach(t => {
      if (t.genre) {
        const genres = Array.isArray(t.genre) ? t.genre : [t.genre];
        genres.forEach(g => genreSet.add(g));
      }
    });
    console.log(`\nGenres in database (${genreSet.size} unique):`);
    Array.from(genreSet).sort().slice(0, 20).forEach(g => console.log(`  - ${g}`));
    if (genreSet.size > 20) {
      console.log(`  ... and ${genreSet.size - 20} more`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Step 2: Generate embedding for "horror"
  console.log('2️⃣ GENERATING EMBEDDING FOR "horror"\n');

  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: 'horror'
  });

  const horrorEmbedding = response.data[0].embedding;
  console.log(`✅ Generated ${horrorEmbedding.length}-dimension embedding for "horror"\n`);

  console.log('='.repeat(70) + '\n');

  // Step 3: Test vector search with different thresholds
  console.log('3️⃣ TESTING VECTOR SEARCH WITH DIFFERENT THRESHOLDS\n');

  const thresholds = [0.7, 0.6, 0.5, 0.4, 0.3];

  for (const threshold of thresholds) {
    console.log(`\n🔍 Testing with threshold ${threshold}:`);

    const { data, error } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: horrorEmbedding,
      match_threshold: threshold,
      match_count: 10
    });

    if (error) {
      console.error(`   ❌ Error:`, error.message);
      continue;
    }

    console.log(`   Found ${data.length} titles`);

    if (data.length > 0) {
      // Check how many are actually horror
      const actualHorror = data.filter(t => {
        if (!t.genre) return false;
        const genres = Array.isArray(t.genre) ? t.genre : [t.genre];
        return genres.some(g => g.toLowerCase().includes('horror'));
      });

      console.log(`   Horror titles: ${actualHorror.length}/${data.length}`);

      console.log(`\n   Top 5 results:`);
      data.slice(0, 5).forEach((t, i) => {
        const genres = Array.isArray(t.genre) ? t.genre.join(', ') : (t.genre || 'No genre');
        const isHorror = genres.toLowerCase().includes('horror');
        const icon = isHorror ? '🎃' : '❌';
        console.log(`   ${i + 1}. ${icon} ${t.title_name_en || t.title_name_kr} (${t.similarity.toFixed(3)})`);
        console.log(`      Genres: [${genres}]`);
        console.log(`      Tone: ${t.tone || 'N/A'}`);
      });
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Step 4: Analyze embedding content
  console.log('4️⃣ ANALYZING TOP RESULTS EMBEDDING CONTENT\n');

  // Get top result's full data
  const { data: topResults, error: topError } = await supabase.rpc('match_titles_by_embedding', {
    query_embedding: horrorEmbedding,
    match_threshold: 0.3,
    match_count: 5
  });

  if (!topError && topResults && topResults.length > 0) {
    console.log('Checking if top results have "horror" in their text content:\n');

    for (const result of topResults) {
      const { data: fullTitle } = await supabase
        .from('titles')
        .select('title_name_en, title_name_kr, synopsis, description_kr, genre, tone, perfect_for, audience')
        .eq('title_id', result.title_id)
        .single();

      if (fullTitle) {
        console.log(`📖 ${fullTitle.title_name_en || fullTitle.title_name_kr}:`);

        // Check what text would have been used for embedding
        const embeddingText = [
          fullTitle.title_name_en || '',
          fullTitle.title_name_kr || '',
          fullTitle.synopsis || '',
          fullTitle.description_kr || '',
          (fullTitle.genre || []).join(' '),
          fullTitle.tone || '',
          fullTitle.perfect_for || '',
          fullTitle.audience || ''
        ].filter(Boolean).join(' ').toLowerCase();

        const hasHorror = embeddingText.includes('horror');
        console.log(`   Contains "horror": ${hasHorror ? '✅ YES' : '❌ NO'}`);
        console.log(`   Genres: [${(fullTitle.genre || []).join(', ')}]`);
        console.log(`   Tone: ${fullTitle.tone || 'N/A'}`);

        // Show where "horror" appears if it does
        if (hasHorror) {
          if (fullTitle.genre && fullTitle.genre.join(' ').toLowerCase().includes('horror')) {
            console.log(`   📍 "horror" found in: GENRE`);
          }
          if (fullTitle.synopsis && fullTitle.synopsis.toLowerCase().includes('horror')) {
            console.log(`   📍 "horror" found in: SYNOPSIS`);
          }
          if (fullTitle.tone && fullTitle.tone.toLowerCase().includes('horror')) {
            console.log(`   📍 "horror" found in: TONE`);
          }
        }
        console.log('');
      }
    }
  }

  console.log('='.repeat(70) + '\n');

  // Step 5: Summary and recommendations
  console.log('5️⃣ SUMMARY & RECOMMENDATIONS\n');

  if (horrorTitles.length === 0) {
    console.log('❌ ROOT CAUSE: No horror titles exist in the database');
    console.log('\nRECOMMENDATION:');
    console.log('   The database does not contain titles with "horror" in the genre field.');
    console.log('   Vector search is working correctly - it\'s finding semantically similar titles,');
    console.log('   but since there are no actual horror titles, it returns the closest matches based');
    console.log('   on tone, themes, and content similarity.\n');
    console.log('SOLUTION:');
    console.log('   1. Add horror titles to the database, OR');
    console.log('   2. Use traditional genre filtering instead of vector search for genre queries\n');
  } else {
    console.log('✅ Horror titles exist in database\n');
    console.log('DIAGNOSIS:');
    console.log('   Testing at different thresholds to see if horror titles appear...');
    console.log('   If horror titles don\'t appear even at low thresholds (0.3), the issue is:');
    console.log('   - Embeddings don\'t capture genre semantics well, OR');
    console.log('   - Genre field isn\'t weighted heavily enough in embedding text\n');
    console.log('SOLUTION:');
    console.log('   1. Lower the threshold for genre queries (0.4-0.5 instead of 0.6), OR');
    console.log('   2. Regenerate embeddings with genre emphasized: "Genre: horror horror horror [title]", OR');
    console.log('   3. Use hybrid approach: filter by genre first, then vector rank within genre\n');
  }

  console.log('='.repeat(70));
}

testHorrorSearch();
