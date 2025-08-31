#!/usr/bin/env node

/**
 * Script to debug database schema for vector search
 * Run with: node debug-database-schema.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugDatabaseSchema() {
  console.log('🔍 Debugging database schema for vector search...\n');
  
  try {
    // 1. Check if we can connect to the database
    console.log('1. Testing database connection...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('*')
      .limit(1);
    
    if (titlesError) {
      console.error('❌ Database connection failed:', titlesError.message);
      return;
    }
    
    console.log('✅ Database connection successful\n');
    
    // 2. Check what columns exist in the titles table
    console.log('2. Analyzing titles table structure...');
    if (titles && titles.length > 0) {
      const columns = Object.keys(titles[0]);
      console.log('📊 Available columns in titles table:');
      columns.forEach(col => console.log(`   - ${col}`));
      
      // Check for key columns we need
      const requiredColumns = ['description', 'synopsis', 'combined_embedding'];
      console.log('\n🔍 Checking required columns:');
      requiredColumns.forEach(col => {
        const exists = columns.includes(col);
        console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
    } else {
      console.log('⚠️ No titles found in database');
    }
    
    // 3. Test the vector search function
    console.log('\n3. Testing vector search function...');
    const mockEmbedding = new Array(1536).fill(0.1);
    
    const { data: searchResults, error: searchError } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: mockEmbedding,
      match_threshold: 0.1,
      match_count: 3
    });
    
    if (searchError) {
      console.error('❌ Vector search function error:', searchError.message);
      console.error('📝 Full error details:', searchError);
      
      // Analyze the error
      if (searchError.message?.includes('function') && searchError.message?.includes('does not exist')) {
        console.log('\n💡 Solution: The vector search function needs to be created');
        console.log('   Run the database migration to create it');
      } else if (searchError.message?.includes('column') && searchError.message?.includes('does not exist')) {
        console.log('\n💡 Solution: Missing database columns');
        console.log('   The function references columns that dont exist in the titles table');
      } else if (searchError.message?.includes('vector')) {
        console.log('\n💡 Solution: Vector extension issue');
        console.log('   The pgvector extension may not be enabled');
      }
    } else {
      console.log(`✅ Vector search function works! Returned ${searchResults?.length || 0} results`);
      if (searchResults && searchResults.length > 0) {
        console.log('📋 Sample result:', searchResults[0]);
      }
    }
    
    // 4. Check for vector extension
    console.log('\n4. Checking vector extension...');
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('extname')
      .eq('extname', 'vector');
      
    if (extError) {
      console.log('⚠️ Could not check extensions (this is normal for some setups)');
    } else {
      const vectorEnabled = extensions && extensions.length > 0;
      console.log(`${vectorEnabled ? '✅' : '❌'} Vector extension: ${vectorEnabled ? 'ENABLED' : 'NOT ENABLED'}`);
    }
    
    console.log('\n🎯 Summary and next steps will be provided based on the results above.');
    
  } catch (error) {
    console.error('❌ Unexpected error during database debugging:', error);
  }
}

// Run the debug
debugDatabaseSchema().catch(console.error);