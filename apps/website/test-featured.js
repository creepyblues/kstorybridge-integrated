#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using the anon key for client-side access
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFeaturedTitles() {
  try {
    console.log('🔍 Testing connection to Supabase...');
    
    // First, test if we can access the featured table at all
    console.log('🔄 Checking if featured table exists...');
    const { data: featuredCheck, error: featuredError } = await supabase
      .from('featured')
      .select('*')
      .limit(1);

    if (featuredError) {
      console.error('❌ Error accessing featured table:', featuredError);
      console.log('This suggests the table may not exist or RLS policies are blocking access');
      return;
    }

    console.log('✅ Featured table accessible');

    // First check what columns exist in titles table
    console.log('🔄 Checking titles table structure...');
    const { data: titlesStructure, error: structureError } = await supabase
      .from('titles')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error checking titles structure:', structureError);
      return;
    }

    if (titlesStructure && titlesStructure.length > 0) {
      console.log('📊 Available columns in titles table:');
      console.log(Object.keys(titlesStructure[0]));
    }

    // Test the query from featuredService with only available columns
    console.log('🔄 Testing featured titles query with joins...');
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          title_image,
          tagline
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching featured titles:', error);
      return;
    }

    console.log(`✅ Successfully fetched ${data.length} featured titles`);
    
    if (data.length === 0) {
      console.log('⚠️  No featured titles found in the database');
      
      // Check if there are any records in featured table
      const { data: allFeatured } = await supabase
        .from('featured')
        .select('*');
      
      console.log(`📊 Total records in featured table: ${allFeatured?.length || 0}`);
      
      if (allFeatured && allFeatured.length > 0) {
        console.log('Featured records found:', allFeatured);
        
        // Check if titles exist for these IDs
        const titleIds = allFeatured.map(f => f.title_id);
        const { data: titlesCheck } = await supabase
          .from('titles')
          .select('title_id, title_name_en, title_name_kr')
          .in('title_id', titleIds);
        
        console.log(`📊 Matching titles found: ${titlesCheck?.length || 0}`);
        if (titlesCheck) {
          console.log('Titles:', titlesCheck);
        }
        
        // Also check what titles DO exist
        const { data: existingTitles } = await supabase
          .from('titles')
          .select('title_id, title_name_en, title_name_kr')
          .limit(5);
        
        console.log('📊 Sample existing titles:');
        if (existingTitles) {
          existingTitles.forEach(title => {
            console.log(`   - ${title.title_id}: ${title.title_name_en || title.title_name_kr}`);
          });
        }
      }
    } else {
      console.log('\n📋 Featured titles:');
      data.forEach((featured, index) => {
        const title = featured.titles;
        console.log(`   ${index + 1}. ${title ? (title.title_name_en || title.title_name_kr) : 'No title data'}`);
        console.log(`      ID: ${featured.title_id}`);
        console.log(`      Note: ${featured.note}`);
        if (title) {
          console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
          console.log(`      Tagline: ${title.tagline || 'None'}`);
          console.log(`      Synopsis: ${title.synopsis ? 'Yes' : 'None'}`);
        }
        console.log('');
      });
      
      // Since we have data but no title data, check if titles exist for these IDs
      console.log('🔍 Investigating why titles data is missing...');
      const titleIds = data.map(f => f.title_id);
      const { data: titlesCheck } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr')
        .in('title_id', titleIds);
      
      console.log(`📊 Matching titles found: ${titlesCheck?.length || 0}`);
      if (titlesCheck && titlesCheck.length > 0) {
        console.log('Titles:', titlesCheck);
      }
      
      // Check what titles DO exist
      const { data: existingTitles } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr')
        .limit(5);
      
      console.log('📊 Sample existing titles:');
      if (existingTitles) {
        existingTitles.forEach(title => {
          console.log(`   - ${title.title_id}: ${title.title_name_en || title.title_name_kr}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testFeaturedTitles();