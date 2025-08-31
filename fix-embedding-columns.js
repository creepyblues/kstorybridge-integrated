#!/usr/bin/env node

/**
 * Fix Embedding Column Types in Database
 * This script fixes the column types for embedding storage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'apps/dashboard/.env.local') });

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔧 Fixing Embedding Column Types...\n');

async function checkAndFixColumns() {
  try {
    // First, check current column types
    console.log('📊 Checking current column types...');
    
    const { data: columns, error: checkError } = await supabase.rpc('get_column_types', {
      table_name: 'titles'
    }).single();

    if (checkError) {
      // If the function doesn't exist, create it
      console.log('Creating helper function...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_column_types(table_name text)
        RETURNS TABLE(column_name text, data_type text, udt_name text)
        LANGUAGE sql
        AS $$
          SELECT 
            column_name::text,
            data_type::text,
            udt_name::text
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND information_schema.columns.table_name = get_column_types.table_name
            AND column_name LIKE '%embedding%'
          ORDER BY ordinal_position;
        $$;
      `;

      const { error: createFnError } = await supabase.rpc('exec_sql', {
        sql: createFunctionSQL
      });

      if (createFnError) {
        console.log('⚠️  Could not create helper function, proceeding with fix...');
      }
    }

    // Apply the fix using SQL
    console.log('\n🔄 Applying column type fixes...');
    
    // First, drop existing columns if they have wrong type
    const dropColumnsSQL = `
      DO $$ 
      BEGIN
        -- Check if columns exist and drop them if wrong type
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'titles' 
          AND column_name IN ('description_embedding', 'combined_embedding', 'title_embedding', 'synopsis_embedding', 'content_embedding')
          AND udt_name != 'vector'
        ) THEN
          ALTER TABLE public.titles 
            DROP COLUMN IF EXISTS description_embedding CASCADE,
            DROP COLUMN IF EXISTS combined_embedding CASCADE,
            DROP COLUMN IF EXISTS title_embedding CASCADE,
            DROP COLUMN IF EXISTS synopsis_embedding CASCADE,
            DROP COLUMN IF EXISTS content_embedding CASCADE;
        END IF;
      END $$;
    `;

    // Add columns with correct vector type
    const addColumnsSQL = `
      DO $$
      BEGIN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'description_embedding') THEN
          ALTER TABLE public.titles ADD COLUMN description_embedding vector(1536);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'combined_embedding') THEN
          ALTER TABLE public.titles ADD COLUMN combined_embedding vector(1536);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'title_embedding') THEN
          ALTER TABLE public.titles ADD COLUMN title_embedding vector(1536);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'synopsis_embedding') THEN
          ALTER TABLE public.titles ADD COLUMN synopsis_embedding vector(1536);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'content_embedding') THEN
          ALTER TABLE public.titles ADD COLUMN content_embedding vector(1536);
        END IF;
      END $$;
    `;

    // Execute the fixes
    console.log('Dropping incorrect columns...');
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropColumnsSQL });
    if (dropError) {
      console.log('Note:', dropError.message);
    }

    console.log('Adding columns with correct types...');
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    if (addError) {
      console.log('Note:', addError.message);
    }

    // If direct SQL execution doesn't work, try alternative approach
    console.log('\n📝 Creating migration file for manual execution...');
    
    const migrationSQL = `
-- Fix Embedding Column Types
-- Run this in Supabase SQL Editor if the script doesn't work

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop columns with wrong types
ALTER TABLE public.titles 
  DROP COLUMN IF EXISTS description_embedding CASCADE,
  DROP COLUMN IF EXISTS combined_embedding CASCADE,
  DROP COLUMN IF EXISTS title_embedding CASCADE,
  DROP COLUMN IF EXISTS synopsis_embedding CASCADE,
  DROP COLUMN IF EXISTS content_embedding CASCADE;

-- Add columns with correct vector type
ALTER TABLE public.titles 
  ADD COLUMN description_embedding vector(1536),
  ADD COLUMN combined_embedding vector(1536),
  ADD COLUMN title_embedding vector(1536),
  ADD COLUMN synopsis_embedding vector(1536),
  ADD COLUMN content_embedding vector(1536);

-- Add indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_titles_description_embedding ON public.titles USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_titles_combined_embedding ON public.titles USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

-- Verify the changes
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'titles' 
  AND column_name LIKE '%embedding%';
    `;

    // Save migration file
    const fs = await import('fs');
    fs.writeFileSync('fix-embedding-columns.sql', migrationSQL);
    console.log('✅ Migration file created: fix-embedding-columns.sql');

    console.log('\n📋 Next Steps:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql/new');
    console.log('2. Copy and paste the contents of fix-embedding-columns.sql');
    console.log('3. Click "Run" to execute the migration');
    console.log('4. After fixing, run your embedding generation script again');
    
    console.log('\n💡 Alternative: You can also run this command:');
    console.log('   npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.dlrnrgcoguxlkkcitlpd.supabase.co:5432/postgres"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Manual Fix Instructions:');
    console.log('1. Open fix-embedding-columns.sql');
    console.log('2. Copy the SQL and run it in Supabase SQL Editor');
    console.log('3. This will fix the column types for embedding storage');
  }
}

// Run the fix
checkAndFixColumns().then(() => {
  console.log('\n✨ Process complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Failed:', err);
  process.exit(1);
});