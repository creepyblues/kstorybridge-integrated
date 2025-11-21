/**
 * Check the exact similarity scores for the 2 horror titles
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

async function checkHorrorSimilarity() {
  console.log('🔍 Checking exact similarity scores for horror titles\n');

  // Generate horror embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: 'horror'
  });

  const horrorEmbedding = response.data[0].embedding;

  // Get ALL results with very low threshold to find the horror titles
  const { data, error } = await supabase.rpc('match_titles_by_embedding', {
    query_embedding: horrorEmbedding,
    match_threshold: 0.1,  // Very low threshold
    match_count: 100  // Get many results
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} total results\n`);

  // Find the horror titles
  const horrorResults = data.filter(t => {
    if (!t.genre) return false;
    const genres = Array.isArray(t.genre) ? t.genre : [t.genre];
    return genres.some(g => g.toLowerCase().includes('horror'));
  });

  console.log(`Horror titles in results: ${horrorResults.length}\n`);

  if (horrorResults.length > 0) {
    console.log('Horror titles found:');
    horrorResults.forEach(t => {
      const genres = Array.isArray(t.genre) ? t.genre.join(', ') : t.genre;
      const rank = data.findIndex(r => r.title_id === t.title_id) + 1;
      console.log(`\n${t.title_name_en || t.title_name_kr}:`);
      console.log(`  Rank: ${rank}/${data.length}`);
      console.log(`  Similarity: ${t.similarity.toFixed(4)} (${(t.similarity * 100).toFixed(1)}%)`);
      console.log(`  Genres: [${genres}]`);
      console.log(`  Tone: ${t.tone || 'N/A'}`);
    });
  } else {
    console.log('❌ Horror titles NOT FOUND even with threshold 0.1 and 100 results!');
    console.log('   This means their similarity is < 0.1 (10%)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\nTop 10 results for comparison:');
  data.slice(0, 10).forEach((t, i) => {
    const genres = Array.isArray(t.genre) ? t.genre.join(', ') : (t.genre || 'N/A');
    console.log(`${i + 1}. ${t.title_name_en || t.title_name_kr} (${t.similarity.toFixed(4)})`);
    console.log(`   Genres: [${genres}]`);
  });
}

checkHorrorSimilarity();
