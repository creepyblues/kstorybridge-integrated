/**
 * Regenerate embedding for a specific title by name
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

const TITLE_NAME = 'I Became a Doting Father';

async function regenerateTitle() {
  console.log(`🔍 Finding "${TITLE_NAME}"...\n`);

  // Find the title
  const { data: title, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, synopsis, description_kr, genre, tone, views, combined_embedding')
    .eq('title_name_en', TITLE_NAME)
    .single();

  if (error || !title) {
    console.error('❌ Title not found:', error);
    return;
  }

  console.log(`✅ Found: ${title.title_name_en}`);
  console.log(`   Views: ${title.views || 0}`);
  console.log(`   Has embedding: ${title.combined_embedding ? 'YES' : 'NO'}\n`);

  if (title.combined_embedding) {
    console.log(`⚠️  Title already has embedding (${title.combined_embedding.length} dimensions)`);
    console.log('   Regenerating anyway...\n');
  }

  // Create embedding text
  const embeddingParts = [
    title.title_name_en || '',
    title.title_name_kr || '',
    title.synopsis || '',
    title.description_kr || '',
    (title.genre || []).join(' '),
    title.tone || ''
  ].filter(Boolean);

  const embeddingText = embeddingParts.join(' ').trim();

  console.log(`📝 Generating embedding from ${embeddingText.length} characters...`);

  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: embeddingText.substring(0, 8000)
  });

  const embedding = response.data[0].embedding;

  console.log(`✅ Generated embedding: ${embedding.length} dimensions\n`);

  // Update database
  console.log('💾 Updating database...');

  const { error: updateError } = await supabase
    .from('titles')
    .update({
      combined_embedding: embedding,
      embedding_model: 'text-embedding-ada-002',
      embedding_updated_at: new Date().toISOString()
    })
    .eq('title_id', title.title_id);

  if (updateError) {
    console.error('❌ Update failed:', updateError);
    return;
  }

  console.log('✅ Successfully regenerated embedding!\n');
  console.log('🎉 Title should now appear in "This Is Us" searches.');
}

regenerateTitle();
