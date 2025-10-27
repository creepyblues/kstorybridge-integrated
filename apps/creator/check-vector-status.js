#!/usr/bin/env node

/**
 * Check the status of vector search setup
 * This script checks database schema and embedding status
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkVectorSearchStatus() {
  console.log('🔍 Checking Vector Search Status...\n');

  try {
    // 1. Check if vector search function exists
    console.log('1️⃣ Testing vector search function...');
    
    // Try to call the function with a test embedding
    const testEmbedding = new Array(1536).fill(0.1);
    const { data: functionTest, error: functionError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: testEmbedding,
      match_threshold: 0.1,
      match_count: 1
    });

    if (functionError) {
      console.log('❌ Vector search function error:', functionError.message);
      if (functionError.message.includes('does not exist')) {
        console.log('   🔧 Function needs to be created - apply database schema fix');
      }
    } else {
      console.log('✅ Vector search function exists and runs');
      console.log(`   Found ${functionTest?.length || 0} test results`);
    }

    // 2. Check title embeddings status
    console.log('\n2️⃣ Checking title embeddings...');
    
    const { data: titleStats, error: statsError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, combined_embedding, embedding_updated_at')
      .limit(100);

    if (statsError) {
      console.log('❌ Error checking titles:', statsError.message);
    } else {
      const totalTitles = titleStats.length;
      const withEmbeddings = titleStats.filter(t => t.combined_embedding !== null).length;
      const withoutEmbeddings = totalTitles - withEmbeddings;

      console.log(`📊 Title Statistics:`);
      console.log(`   Total titles (first 100): ${totalTitles}`);
      console.log(`   With embeddings: ${withEmbeddings}`);
      console.log(`   Without embeddings: ${withoutEmbeddings}`);

      if (withEmbeddings > 0) {
        console.log('\n✅ Sample titles with embeddings:');
        titleStats
          .filter(t => t.combined_embedding !== null)
          .slice(0, 3)
          .forEach(title => {
            console.log(`   • ${title.title_name_en || title.title_name_kr} (Updated: ${title.embedding_updated_at})`);
          });
      }

      if (withoutEmbeddings > 0) {
        console.log('\n⚠️ Sample titles needing embeddings:');
        titleStats
          .filter(t => t.combined_embedding === null)
          .slice(0, 5)
          .forEach(title => {
            console.log(`   • ${title.title_name_en || title.title_name_kr} (${title.title_id})`);
          });
      }
    }

    // 3. Check OpenAI API key
    console.log('\n3️⃣ Checking OpenAI configuration...');
    const openaiKey = process.env.VITE_OPENAI_API_KEY;
    
    if (!openaiKey || openaiKey === 'sk-your_actual_api_key_here') {
      console.log('❌ OpenAI API key not configured');
      console.log('   Set VITE_OPENAI_API_KEY environment variable');
    } else {
      console.log('✅ OpenAI API key configured');
      console.log(`   Key preview: ${openaiKey.substring(0, 10)}...`);
    }

    // 4. Overall status and recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('='.repeat(50));

    if (functionError) {
      console.log('🔧 REQUIRED: Apply database schema fix');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Run the SQL from fix-database-schema.js');
    }

    if (titleStats && titleStats.length > 0) {
      const totalTitles = titleStats.length;
      const withEmbeddings = titleStats.filter(t => t.combined_embedding !== null).length;
      const withoutEmbeddings = totalTitles - withEmbeddings;

      if (withoutEmbeddings > 0 && openaiKey && openaiKey !== 'sk-your_actual_api_key_here') {
        console.log('🚀 NEXT: Generate embeddings for titles');
        console.log('   Run: node generate-embeddings.js --dry-run');
        console.log('   Then: node generate-embeddings.js --limit=5');
      } else if (withoutEmbeddings > 0) {
        console.log('⚠️ Need OpenAI API key to generate embeddings');
      }

      if (withEmbeddings > 0 && !functionError) {
        console.log('🎉 Ready to test vector search in OpenAI chatbot!');
      }
    }

  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

// Run the check
checkVectorSearchStatus().catch(console.error);