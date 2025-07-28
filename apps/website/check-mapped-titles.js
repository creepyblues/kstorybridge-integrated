#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMappedTitles() {
  try {
    console.log('🔍 Checking the manually mapped title IDs...');
    
    // Get the title IDs from featured table
    const { data: featuredIds } = await supabase
      .from('featured')
      .select('title_id');
    
    const titleIds = featuredIds?.map(f => f.title_id) || [];
    console.log(`📋 Looking for ${titleIds.length} title IDs in titles table`);
    
    // Check if ANY of these titles exist
    const { data: matchingTitles, error } = await supabase
      .from('titles')
      .select('*')
      .in('title_id', titleIds);
    
    if (error) {
      console.error('❌ Error checking titles:', error);
      return;
    }
    
    console.log(`✅ Found ${matchingTitles?.length || 0} matching titles`);
    
    if (matchingTitles && matchingTitles.length > 0) {
      console.log('\n📋 Matching titles:');
      matchingTitles.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`      ID: ${title.title_id}`);
        console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
        console.log(`      Tagline: ${title.tagline || 'None'}`);
        console.log('');
      });
      
      // Now test the full featured query
      console.log('🔄 Testing featured titles query with real data...');
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
          console.log('\n📋 Featured titles with data:');
          featuredData.forEach((featured, index) => {
            const title = featured.titles;
            console.log(`   ${index + 1}. ${title ? (title.title_name_en || title.title_name_kr) : 'No title data'}`);
            console.log(`      ID: ${featured.title_id}`);
            console.log(`      Note: ${featured.note}`);
            if (title) {
              console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
              console.log(`      Tagline: ${title.tagline || 'None'}`);
            }
            console.log('');
          });
        }
      }
    } else {
      console.log('\n❌ No matching titles found. The title_ids in featured table don\'t exist in titles table.');
      
      // Show what DOES exist in titles table
      const { data: allTitles } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr')
        .limit(10);
      
      if (allTitles && allTitles.length > 0) {
        console.log('\n📋 Available titles in database:');
        allTitles.forEach((title, index) => {
          console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr} (${title.title_id})`);
        });
      } else {
        console.log('\n⚠️  No titles exist in the titles table at all.');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMappedTitles();