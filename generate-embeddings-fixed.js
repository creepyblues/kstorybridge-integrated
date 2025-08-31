#!/usr/bin/env node

/**
 * Generate and Store OpenAI Embeddings for Titles
 * Fixed version with proper vector formatting
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'apps/dashboard/.env.local') });

// Configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ VITE_OPENAI_API_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Format vector for PostgreSQL
function formatVector(embedding) {
  if (!embedding || !Array.isArray(embedding)) {
    return null;
  }
  // PostgreSQL expects format: [0.1, 0.2, 0.3, ...]
  return JSON.stringify(embedding);
}

async function generateEmbedding(text, retries = 3) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.slice(0, 8191), // Max tokens for ada-002
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.log(`  Attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function processTitle(title) {
  console.log(`\n📝 Processing: ${title.title_name_en || title.title_name_kr}`);
  
  try {
    // Prepare text representations
    const titleText = `${title.title_name_en || ''} | ${title.title_name_kr || ''}`.trim();
    const descriptionText = `${title.description_kr || ''} ${title.pitch || ''}`.trim();
    const synopsisText = title.synopsis || '';
    const contentText = `${titleText} ${descriptionText} ${synopsisText} ${title.tagline || ''} ${title.perfect_for || ''}`.trim();
    
    console.log('  Text representations prepared');
    
    // Generate embeddings
    console.log('  Generating embeddings...');
    const [titleEmb, descEmb, synEmb, contentEmb] = await Promise.all([
      titleText ? generateEmbedding(titleText) : null,
      descriptionText ? generateEmbedding(descriptionText) : null,
      synopsisText ? generateEmbedding(synopsisText) : null,
      contentText ? generateEmbedding(contentText) : null,
    ]);
    
    console.log(`  ✅ Generated ${[titleEmb, descEmb, synEmb, contentEmb].filter(e => e).length} embeddings`);
    
    // Prepare update data with properly formatted vectors
    const updateData = {
      embedding_model: 'text-embedding-ada-002',
      embedding_updated_at: new Date().toISOString(),
    };
    
    // Only add non-null embeddings
    if (titleEmb) updateData.title_embedding = formatVector(titleEmb);
    if (descEmb) updateData.description_embedding = formatVector(descEmb);
    if (synEmb) updateData.synopsis_embedding = formatVector(synEmb);
    if (contentEmb) updateData.content_embedding = formatVector(contentEmb);
    
    // Use combined embedding as the main one
    if (contentEmb) {
      updateData.combined_embedding = formatVector(contentEmb);
      updateData.embedding_created_at = updateData.embedding_created_at || new Date().toISOString();
    }
    
    // Store in database
    console.log('  💾 Storing embeddings...');
    const { error } = await supabase
      .from('titles')
      .update(updateData)
      .eq('title_id', title.title_id);
    
    if (error) {
      console.error('  ❌ Storage error:', error.message);
      return false;
    }
    
    console.log('  ✅ Successfully stored embeddings');
    return true;
    
  } catch (error) {
    console.error('  ❌ Processing error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 OpenAI Embedding Generator (Fixed Version)\n');
  console.log('================================');
  
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || 5;
    const titleId = args.find(arg => arg.startsWith('--title='))?.split('=')[1];
    
    // Fetch titles
    let query = supabase
      .from('titles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (titleId) {
      query = query.eq('title_id', titleId);
    } else {
      // Only get titles without embeddings
      query = query.is('combined_embedding', null).limit(parseInt(limit));
    }
    
    const { data: titles, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!titles || titles.length === 0) {
      console.log('ℹ️  No titles found to process');
      return;
    }
    
    console.log(`📚 Found ${titles.length} title(s) to process\n`);
    
    // Process each title
    let successful = 0;
    let failed = 0;
    
    for (const title of titles) {
      const success = await processTitle(title);
      if (success) {
        successful++;
      } else {
        failed++;
      }
      
      // Rate limiting
      if (titles.indexOf(title) < titles.length - 1) {
        console.log('  ⏳ Waiting for rate limit...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('================================');
    console.log(`✅ Successfully processed: ${successful} titles`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} titles`);
    }
    console.log(`💰 Estimated cost: $${(successful * 0.0001).toFixed(4)}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().then(() => {
  console.log('\n✨ Complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Script failed:', err);
  process.exit(1);
});