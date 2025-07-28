#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSpecificTitles() {
  try {
    console.log('🔍 Checking for the specific title IDs you provided...');
    
    const targetTitleIds = [
      'b8f1367c-94a7-41a2-baf6-a8ac974584ef',
      'ea2167ba-3d89-4c09-979c-1d5114bfcb19',
      'e388e37f-7a11-4ca4-8164-15339c6bfda4',
      'e87ca7b0-976c-44c8-84be-898611bd62ff',
      '38198638-610d-4eaa-a7f0-941cdd8b3d77',
      '234b05fd-1624-4fe6-9318-4baea38688e3'
    ];

    console.log('🔄 Looking for these title IDs in the titles table...');
    targetTitleIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });

    const { data: existingTitles, error } = await supabase
      .from('titles')
      .select('*')
      .in('title_id', targetTitleIds);

    if (error) {
      console.error('❌ Error fetching titles:', error);
      return;
    }

    console.log(`\n📊 Found ${existingTitles?.length || 0} out of ${targetTitleIds.length} titles`);
    
    if (existingTitles && existingTitles.length > 0) {
      console.log('\n✅ Existing titles:');
      existingTitles.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`      ID: ${title.title_id}`);
        console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
        console.log(`      Tagline: ${title.tagline || 'None'}`);
        console.log('');
      });
    }

    // Check which ones are missing
    const foundIds = existingTitles?.map(t => t.title_id) || [];
    const missingIds = targetTitleIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log('❌ Missing title IDs:');
      missingIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
    }

    // Now test the featured query with existing data
    if (existingTitles && existingTitles.length > 0) {
      console.log('\n🔄 Testing featured titles query...');
      const { data: featuredData, error: featuredError } = await supabase
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
            content_format
          )
        `)
        .order('created_at', { ascending: false });

      if (featuredError) {
        console.error('❌ Featured query error:', featuredError);
      } else {
        console.log(`✅ Featured query successful: ${featuredData?.length || 0} results`);
        if (featuredData && featuredData.length > 0) {
          featuredData.forEach((featured, index) => {
            const title = featured.titles;
            console.log(`   ${index + 1}. ${title ? (title.title_name_en || title.title_name_kr) : 'No title data'} (${featured.title_id})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSpecificTitles();