#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSpecificTitle() {
  try {
    console.log('🔍 Testing access to specific title: 06a6ac30-0b8b-49c6-9b37-e9e02ed99537');
    
    // Try to get this specific title
    const { data: title, error } = await supabase
      .from('titles')
      .select('*')
      .eq('title_id', '06a6ac30-0b8b-49c6-9b37-e9e02ed99537');

    if (error) {
      console.error('❌ Error fetching specific title:', error);
      return;
    }

    console.log(`📊 Found ${title?.length || 0} record(s) for this title_id`);
    
    if (title && title.length > 0) {
      console.log('\n✅ Title data found:');
      title.forEach((t, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`      ID: ${t.title_id}`);
        console.log(`      Name EN: ${t.title_name_en}`);
        console.log(`      Name KR: ${t.title_name_kr || 'None'}`);
        console.log(`      Image: ${t.title_image || 'None'}`);
        console.log(`      Tagline: ${t.tagline || 'None'}`);
        console.log(`      Genre: ${t.genre || 'None'}`);
        console.log(`      Available columns: ${Object.keys(t).join(', ')}`);
        console.log('');
      });
      
      // Now test the featured query for this specific title
      console.log('🔄 Testing featured query for this title...');
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
        .eq('title_id', '06a6ac30-0b8b-49c6-9b37-e9e02ed99537');

      if (featuredError) {
        console.error('❌ Featured query error:', featuredError);
      } else {
        console.log(`✅ Featured query successful: ${featuredData?.length || 0} results`);
        if (featuredData && featuredData.length > 0) {
          featuredData.forEach((featured, index) => {
            const titleData = featured.titles;
            console.log(`   Featured ${index + 1}:`);
            console.log(`      Featured ID: ${featured.id}`);
            console.log(`      Title ID: ${featured.title_id}`);
            console.log(`      Note: ${featured.note}`);
            console.log(`      Title Data: ${titleData ? 'Yes' : 'No'}`);
            if (titleData) {
              console.log(`      Title Name: ${titleData.title_name_en || titleData.title_name_kr}`);
              console.log(`      Image: ${titleData.title_image ? 'Yes' : 'No'}`);
              console.log(`      Tagline: ${titleData.tagline || 'None'}`);
            }
            console.log('');
          });
        }
      }
      
      // Test the full featured query
      console.log('🔄 Testing full featured query...');
      const { data: allFeatured, error: allFeaturedError } = await supabase
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

      if (allFeaturedError) {
        console.error('❌ Full featured query error:', allFeaturedError);
      } else {
        console.log(`✅ Full featured query successful: ${allFeatured?.length || 0} results`);
        let foundTitles = 0;
        if (allFeatured) {
          allFeatured.forEach((featured, index) => {
            const titleData = featured.titles;
            if (titleData) foundTitles++;
            console.log(`   ${index + 1}. ${titleData ? (titleData.title_name_en || titleData.title_name_kr) : 'No title data'} (${featured.title_id})`);
          });
        }
        console.log(`📊 Featured entries with title data: ${foundTitles}/${allFeatured?.length || 0}`);
      }
      
    } else {
      console.log('❌ No title found with that ID');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificTitle();