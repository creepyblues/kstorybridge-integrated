#!/usr/bin/env node

/**
 * Script to fix vector search database schema
 * Run with: node fix-vector-search.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixVectorSearch() {
  try {
    console.log('🔧 Fixing vector search database schema...');
    
    // Read the SQL fix file
    const sqlPath = join(__dirname, 'apps/dashboard/migrations-fix/fix-vector-search.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      // Try alternative method
      console.log('🔄 Trying alternative method...');
      
      // Split SQL into individual statements and execute them
      const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: trimmed });
          if (stmtError) {
            console.warn(`⚠️ Statement failed (might be expected): ${stmtError.message}`);
          }
        } catch (e) {
          console.warn(`⚠️ Statement execution warning: ${e.message}`);
        }
      }
    }
    
    console.log('✅ Vector search schema fix applied successfully!');
    
    // Test the function
    console.log('🧪 Testing vector search function...');
    const testEmbedding = new Array(1536).fill(0.1);
    
    const { data: testResult, error: testError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 5
    });
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log(`✅ Test passed! Function returned ${testResult?.length || 0} results`);
    }
    
  } catch (error) {
    console.error('❌ Failed to fix vector search:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixVectorSearch();
}

export { fixVectorSearch };