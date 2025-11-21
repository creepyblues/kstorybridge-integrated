/**
 * Fix the invalid embedding for "I Became a Doting Father"
 * Current embedding: 19,428 dimensions (corrupted)
 * Target embedding: 1,536 dimensions (valid)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const TITLE_ID = '6a0a8bea-10be-486e-89ee-34177828e19b'; // I Became a Doting Father

async function fixEmbedding() {
  console.log('🔧 Fixing embedding for "I Became a Doting Father"...\n');

  // 1. Fetch the title details
  const { data: title, error: fetchError } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, synopsis, description, combined_embedding')
    .eq('title_id', TITLE_ID)
    .single();

  if (fetchError || !title) {
    console.error('❌ Failed to fetch title:', fetchError);
    return;
  }

  console.log(`✅ Found title: ${title.title_name_en}`);
  console.log(`   Current embedding dimension: ${title.combined_embedding ? title.combined_embedding.length : 0}\n`);

  if (title.combined_embedding && title.combined_embedding.length === 1536) {
    console.log('✅ Embedding is already valid (1536 dimensions)');
    return;
  }

  // 2. Generate new embedding from title content
  const contentToEmbed = [
    title.title_name_en,
    title.title_name_kr,
    title.synopsis || '',
    title.description || ''
  ].filter(Boolean).join(' ');

  console.log(`📝 Generating new embedding from content (${contentToEmbed.length} chars)...`);

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: contentToEmbed
    });

    const newEmbedding = response.data[0].embedding;

    console.log(`✅ Generated new embedding (${newEmbedding.length} dimensions)\n`);

    // 3. Update the database
    console.log('💾 Updating database...');

    const { error: updateError } = await supabase
      .from('titles')
      .update({
        combined_embedding: newEmbedding,
        embedding_updated_at: new Date().toISOString(),
        embedding_model: 'text-embedding-ada-002'
      })
      .eq('title_id', TITLE_ID);

    if (updateError) {
      console.error('❌ Failed to update embedding:', updateError);
      return;
    }

    console.log('✅ Successfully updated embedding!\n');

    // 4. Verify the update
    const { data: updated, error: verifyError } = await supabase
      .from('titles')
      .select('combined_embedding')
      .eq('title_id', TITLE_ID)
      .single();

    if (verifyError || !updated) {
      console.error('❌ Failed to verify update:', verifyError);
      return;
    }

    console.log(`✅ Verified: Embedding now has ${updated.combined_embedding.length} dimensions`);
    console.log('\n🎉 Fix complete! Title should now appear in comp searches.\n');

  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
  }
}

// Check for all titles with invalid embeddings
async function checkAllEmbeddings() {
  console.log('🔍 Checking all titles for invalid embeddings...\n');

  const { data: titles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, combined_embedding')
    .not('combined_embedding', 'is', null)
    .limit(1000);

  if (error) {
    console.error('❌ Error fetching titles:', error);
    return;
  }

  const invalid = titles.filter(t =>
    t.combined_embedding && t.combined_embedding.length !== 1536
  );

  console.log(`📊 Found ${invalid.length} titles with invalid embeddings out of ${titles.length} total\n`);

  if (invalid.length > 0) {
    console.log('Invalid embeddings:');
    invalid.forEach(t => {
      console.log(`  - ${t.title_name_en}: ${t.combined_embedding.length} dimensions`);
    });
    console.log('');
  }

  return invalid;
}

// Main execution
if (process.argv.includes('--check-all')) {
  checkAllEmbeddings();
} else {
  fixEmbedding();
}
