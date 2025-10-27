#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkActualData() {
  console.log('🔍 Checking actual database data\n');
  
  // Check what's in the titles table for our problematic title
  console.log('1️⃣ Checking titles table...');
  try {
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, pitch')
      .eq('title_id', 'd6cdcc3a-b7a0-446b-97e0-1310d672c6aa');
    
    if (titlesError) {
      console.log('❌ Cannot query titles:', titlesError.message);
    } else if (titles && titles.length > 0) {
      const title = titles[0];
      console.log('✅ Title found:', {
        id: title.title_id,
        name: title.title_name_en || title.title_name_kr,
        pitch_url: title.pitch
      });
      
      if (title.pitch) {
        console.log('📋 Stored pitch URL:', title.pitch);
        
        // Test direct access to this URL
        console.log('\n2️⃣ Testing direct access to stored URL...');
        try {
          const response = await fetch(title.pitch);
          console.log(`📊 Direct access: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            console.log(`📄 Content-Type: ${contentType}`);
            console.log('✅ PDF is accessible via direct URL!');
          }
        } catch (fetchError) {
          console.log('💥 Direct access failed:', fetchError.message);
        }
      } else {
        console.log('❌ No pitch URL stored for this title');
      }
    } else {
      console.log('❌ Title not found in database');
    }
  } catch (err) {
    console.log('💥 Database query failed:', err.message);
  }
  
  // Check all titles with pitch URLs
  console.log('\n3️⃣ Checking all titles with pitch URLs...');
  try {
    const { data: allTitles, error: allError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, pitch')
      .not('pitch', 'is', null)
      .limit(5);
    
    if (allError) {
      console.log('❌ Cannot query all titles:', allError.message);
    } else {
      console.log(`✅ Found ${allTitles.length} titles with pitch URLs:`);
      allTitles.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`      ID: ${title.title_id}`);
        console.log(`      URL: ${title.pitch}`);
        console.log();
      });
    }
  } catch (err) {
    console.log('💥 All titles query failed:', err.message);
  }
}

checkActualData().catch(console.error);