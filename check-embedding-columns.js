/**
 * Check and fix embedding column types in the database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here') {
  console.error('❌ Service role key not configured in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumnTypes() {
  console.log('🔍 Checking embedding column types...\n');
  
  try {
    // Get column information
    const { data: columns, error } = await supabase
      .rpc('get_column_info', {
        table_name: 'titles',
        column_names: ['description_embedding', 'combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding']
      })
      .single();
    
    if (error) {
      // If the RPC doesn't exist, try a different approach
      console.log('📝 Checking column types using test query...');
      
      // Try to select one row to see the structure
      const { data: testData, error: testError } = await supabase
        .from('titles')
        .select('title_id, title_name_en, description_embedding, combined_embedding')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error checking columns:', testError.message);
      } else if (testData && testData[0]) {
        console.log('✅ Sample data structure:');
        console.log('  - title_id:', testData[0].title_id);
        console.log('  - title_name_en:', testData[0].title_name_en);
        console.log('  - description_embedding type:', typeof testData[0].description_embedding);
        console.log('  - description_embedding value:', testData[0].description_embedding ? 'Present' : 'NULL');
        console.log('  - combined_embedding type:', typeof testData[0].combined_embedding);
        console.log('  - combined_embedding value:', testData[0].combined_embedding ? 'Present' : 'NULL');
      }
    } else {
      console.log('Column information:', columns);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function createFixScript() {
  console.log('\n📝 Creating SQL fix script...\n');
  
  const fixSQL = `
-- Fix embedding column types in titles table
-- Run this in Supabase SQL Editor

-- First, check current column types
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM information_schema.columns
WHERE table_name = 'titles' 
  AND column_name IN ('description_embedding', 'combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding');

-- If columns are not vector type, alter them:
ALTER TABLE titles 
  ALTER COLUMN description_embedding TYPE vector(1536),
  ALTER COLUMN combined_embedding TYPE vector(1536),
  ALTER COLUMN title_embedding TYPE vector(1536),
  ALTER COLUMN synopsis_embedding TYPE vector(1536),
  ALTER COLUMN content_embedding TYPE vector(1536);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM information_schema.columns
WHERE table_name = 'titles' 
  AND column_name IN ('description_embedding', 'combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding');
`;

  console.log('📋 SQL Fix Script:');
  console.log('=' .repeat(60));
  console.log(fixSQL);
  console.log('=' .repeat(60));
  
  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('fix-embedding-columns.sql', fixSQL);
  console.log('\n✅ SQL script saved to: fix-embedding-columns.sql');
  console.log('📌 Run this script in your Supabase SQL Editor to fix the column types');
}

async function testEmbeddingStorage() {
  console.log('\n🧪 Testing embedding storage...\n');
  
  try {
    // Create a test embedding (1536 dimensions for OpenAI ada-002)
    const testEmbedding = Array(1536).fill(0).map((_, i) => Math.random() - 0.5);
    
    // Format as PostgreSQL array string
    const embeddingString = `[${testEmbedding.join(',')}]`;
    
    console.log('📝 Test embedding created:');
    console.log('  - Dimensions:', testEmbedding.length);
    console.log('  - Format: PostgreSQL array string');
    console.log('  - Sample values:', testEmbedding.slice(0, 3).join(', '), '...');
    
    // Try to update a title with the test embedding
    const { data: titles } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(1);
    
    if (titles && titles[0]) {
      console.log('\n🔄 Attempting to store embedding for:', titles[0].title_name_en);
      
      const { error: updateError } = await supabase
        .from('titles')
        .update({ 
          description_embedding: embeddingString,
          embedding_updated_at: new Date().toISOString()
        })
        .eq('title_id', titles[0].title_id);
      
      if (updateError) {
        console.error('❌ Storage failed:', updateError.message);
        console.log('\n⚠️  The embedding columns need to be converted to vector type.');
        console.log('   Please run the SQL script in fix-embedding-columns.sql');
      } else {
        console.log('✅ Embedding stored successfully!');
        
        // Verify storage
        const { data: verifyData } = await supabase
          .from('titles')
          .select('description_embedding')
          .eq('title_id', titles[0].title_id)
          .single();
        
        if (verifyData && verifyData.description_embedding) {
          console.log('✅ Verification: Embedding retrieved successfully');
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

// Run all checks
async function main() {
  console.log('🚀 Embedding Column Type Checker\n');
  console.log('=' .repeat(60));
  
  await checkColumnTypes();
  await createFixScript();
  await testEmbeddingStorage();
  
  console.log('\n✅ Check complete!');
}

main().catch(console.error);