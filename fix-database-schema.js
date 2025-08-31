#!/usr/bin/env node

/**
 * Script to fix the database schema for vector search
 * This will update the vector search function to use existing columns
 * Run with: node fix-database-schema.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration  
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyPH6yCfHueEEMIlA';

// Try service key if available (needed for DDL operations)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const API_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, API_KEY);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema for vector search...\n');
  
  try {
    console.log('1. Creating updated vector search function...');
    
    // Updated SQL function that uses existing columns
    const fixedFunctionSQL = `
      -- Drop existing function
      DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
      
      -- Create updated function using existing columns
      CREATE OR REPLACE FUNCTION match_titles_by_embedding(
        query_embedding vector(1536),
        match_threshold float DEFAULT 0.7,
        match_count int DEFAULT 10
      )
      RETURNS TABLE (
        title_id uuid,
        title_name_en text,
        title_name_kr text,
        description text,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          t.title_id,
          t.title_name_en,
          t.title_name_kr,
          -- Use synopsis (English) or description_kr, whichever exists
          COALESCE(t.synopsis, t.description_kr, '')::text as description,
          -- Calculate similarity using combined_embedding
          CASE 
            WHEN t.combined_embedding IS NOT NULL 
            THEN (1 - (t.combined_embedding <=> query_embedding))::float
            ELSE 0::float
          END AS similarity
        FROM titles t
        WHERE t.combined_embedding IS NOT NULL
          AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
        ORDER BY t.combined_embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
      
      -- Add comment
      COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search using existing schema columns';
    `;
    
    // Since we can't execute DDL with RPC, let's try a different approach
    // We'll create a migration file that can be applied manually
    
    console.log('📝 SQL fix has been prepared. Since DDL operations require elevated privileges,');
    console.log('   you have two options:\n');
    
    console.log('Option 1 - Manual SQL execution (Recommended):');
    console.log('1. Go to your Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste this SQL:');
    console.log('----------------------------------------');
    console.log(fixedFunctionSQL);
    console.log('----------------------------------------\n');
    
    console.log('Option 2 - Try automated fix (may require service key):');
    console.log('Set SUPABASE_SERVICE_KEY environment variable and run again\n');
    
    if (SUPABASE_SERVICE_KEY) {
      console.log('🔄 Attempting automated fix with service key...');
      // This won't work with RPC, but let's try anyway
      try {
        const { data, error } = await supabase.rpc('exec', { sql: fixedFunctionSQL });
        if (error) throw error;
        console.log('✅ Automated fix successful!');
      } catch (error) {
        console.log('❌ Automated fix failed (expected). Use manual method above.');
      }
    }
    
    // Test the current state
    console.log('3. Testing current vector search function...');
    console.log('⚠️ Skipping function test - requires real embeddings and database schema fix');
    
    // Note: Real testing requires:
    // 1. Database schema fix (apply SQL above)
    // 2. Real title embeddings in the database
    // 3. Real query embedding generation
    
    const testResults = null;
    const testError = { message: 'Test skipped - apply database schema fix first' };
    
    if (testError) {
      console.log('❌ Function still needs fixing:', testError.message);
      console.log('\n🎯 Next step: Apply the SQL fix above manually in Supabase Dashboard');
    } else {
      console.log(`✅ Vector search function is working! Found ${testResults?.length || 0} results`);
    }
    
  } catch (error) {
    console.error('❌ Error during schema fix:', error);
  }
}

// Run the fix
fixDatabaseSchema().catch(console.error);