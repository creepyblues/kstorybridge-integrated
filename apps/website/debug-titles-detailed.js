#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugTitles() {
  try {
    console.log('🔍 Debugging titles access...');
    
    // Try to check table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'titles')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log('❌ Cannot access table information:', tableError.message);
    } else {
      console.log('✅ Table exists');
    }
    
    // Try simple count
    const { count, error: countError } = await supabase
      .from('titles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Cannot count titles:', countError.message);
    } else {
      console.log(`📊 Total titles count: ${count}`);
    }
    
    // Try getting specific columns only
    const { data: titleIds, error: idsError } = await supabase
      .from('titles')
      .select('title_id')
      .limit(5);
    
    if (idsError) {
      console.log('❌ Cannot get title IDs:', idsError.message);
    } else {
      console.log(`📊 Title IDs found: ${titleIds?.length || 0}`);
      if (titleIds && titleIds.length > 0) {
        titleIds.forEach(t => console.log(`   - ${t.title_id}`));
      }
    }
    
    // Get the current featured title IDs to check against
    const { data: featuredIds, error: featuredError } = await supabase
      .from('featured')
      .select('title_id');
    
    if (!featuredError && featuredIds) {
      console.log('\n🔍 Featured table title_ids:');
      featuredIds.forEach(f => console.log(`   - ${f.title_id}`));
      
      // Try to find any of these in titles
      for (const featured of featuredIds) {
        const { data: titleData, error: titleError } = await supabase
          .from('titles')
          .select('*')
          .eq('title_id', featured.title_id)
          .single();
        
        if (!titleError && titleData) {
          console.log(`✅ Found title: ${titleData.title_name_en || titleData.title_name_kr} (${featured.title_id})`);
        } else {
          console.log(`❌ Title not found: ${featured.title_id}`);
          if (titleError) {
            console.log(`   Error: ${titleError.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugTitles();