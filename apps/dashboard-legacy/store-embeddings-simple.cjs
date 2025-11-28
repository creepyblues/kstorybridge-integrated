#!/usr/bin/env node

/**
 * Simple Embedding Storage Script
 * Just generates and stores embeddings without verification
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables');
  console.log('Required: SUPABASE_SERVICE_ROLE_KEY, VITE_OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateAndStore(titleId) {
  try {
    // Fetch the title
    const { data: title, error: fetchError } = await supabase
      .from('titles')
      .select('*')
      .eq('title_id', titleId)
      .single();
    
    if (fetchError) throw fetchError;
    
    console.log(`\n📝 Processing: ${title.title_name_en || title.title_name_kr}`);
    
    // Create combined text
    const text = [
      title.title_name_en,
      title.title_name_kr,
      title.description_kr,
      title.synopsis,
      title.pitch,
      title.tagline,
      title.perfect_for
    ].filter(Boolean).join(' ');
    
    if (!text) {
      console.log('  ⚠️  No text to embed');
      return false;
    }
    
    // Generate embedding
    console.log('  🤖 Generating embedding...');
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8191)
    });
    
    const embedding = response.data[0].embedding;
    console.log(`  ✅ Generated embedding (${embedding.length} dimensions)`);
    
    // Store as JSON string
    console.log('  💾 Storing in database...');
    const { error: updateError } = await supabase
      .from('titles')
      .update({
        combined_embedding: JSON.stringify(embedding),
        description_embedding: JSON.stringify(embedding),
        content_embedding: JSON.stringify(embedding),
        embedding_model: 'text-embedding-ada-002',
        embedding_created_at: new Date().toISOString(),
        embedding_updated_at: new Date().toISOString()
      })
      .eq('title_id', titleId);
    
    if (updateError) {
      console.error('  ❌ Storage error:', updateError.message);
      return false;
    }
    
    console.log('  ✅ Successfully stored!');
    return true;
    
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Simple Embedding Storage\n');
  
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '5');
  
  // Get titles without embeddings
  const { data: titles, error } = await supabase
    .from('titles')
    .select('title_id, title_name_en, title_name_kr')
    .is('combined_embedding', null)
    .limit(limit);
  
  if (error) {
    console.error('❌ Failed to fetch titles:', error.message);
    process.exit(1);
  }
  
  if (!titles || titles.length === 0) {
    console.log('ℹ️  No titles need embeddings');
    return;
  }
  
  console.log(`📚 Processing ${titles.length} titles...\n`);
  
  let success = 0;
  for (const title of titles) {
    if (await generateAndStore(title.title_id)) {
      success++;
    }
    // Rate limit
    if (titles.indexOf(title) < titles.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`✅ Successfully processed: ${success}/${titles.length}`);
  console.log(`💰 Estimated cost: $${(success * 0.00002).toFixed(5)}`);
}

main().catch(console.error);