#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testExactServiceQuery() {
  try {
    console.log('🔍 Testing the EXACT query used by featuredService...');
    
    // This is the exact query from featuredService.ts
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          title_image,
          tagline,
          genre,
          content_format,
          story_author,
          pitch
        )
      `)
      .order('created_at', { ascending: false });

    console.log('📊 Query result:');
    console.log(`   Error: ${error ? error.message : 'None'}`);
    console.log(`   Data length: ${data?.length || 0}`);
    
    if (error) {
      console.error('❌ Query error details:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n✅ Data structure:');
      data.forEach((item, index) => {
        console.log(`   ${index + 1}. Featured ID: ${item.id}`);
        console.log(`      Title ID: ${item.title_id}`);
        console.log(`      Note: ${item.note}`);
        console.log(`      Titles object: ${item.titles ? 'Present' : 'Missing'}`);
        if (item.titles) {
          console.log(`      Title name: ${item.titles.title_name_en || item.titles.title_name_kr}`);
          console.log(`      Title image: ${item.titles.title_image ? 'Present' : 'Missing'}`);
          console.log(`      Tagline: ${item.titles.tagline || 'None'}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No data returned');
    }

    // Also test if there's an issue with the specific columns
    console.log('\n🔄 Testing with minimal columns...');
    const { data: minimalData, error: minimalError } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          title_id,
          title_name_en
        )
      `)
      .order('created_at', { ascending: false });
    
    console.log(`📊 Minimal query result: ${minimalData?.length || 0} items, Error: ${minimalError ? minimalError.message : 'None'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExactServiceQuery();