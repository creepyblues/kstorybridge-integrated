#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Same Supabase project but might have different data
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDashboardTitles() {
  try {
    console.log('🔍 Checking titles table structure and data...');
    
    // Get all titles with full info
    const { data: allTitles, error } = await supabase
      .from('titles')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching titles:', error);
      return;
    }

    console.log(`📊 Total titles found: ${allTitles?.length || 0}`);
    
    if (allTitles && allTitles.length > 0) {
      console.log('\n📋 Available columns:', Object.keys(allTitles[0]));
      
      console.log('\n📋 Sample titles:');
      allTitles.forEach((title, index) => {
        console.log(`   ${index + 1}. ID: ${title.title_id}`);
        console.log(`      Name EN: ${title.title_name_en || 'None'}`);
        console.log(`      Name KR: ${title.title_name_kr || 'None'}`);
        console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
        if ('tagline' in title) {
          console.log(`      Tagline: ${title.tagline || 'None'}`);
        }
        if ('description' in title) {
          console.log(`      Description: ${title.description ? 'Yes' : 'No'}`);
        }
        console.log('');
      });
      
      // Check for the specific IDs
      const targetTitleIds = [
        'b8f1367c-94a7-41a2-baf6-a8ac974584ef',
        'ea2167ba-3d89-4c09-979c-1d5114bfcb19',
        'e388e37f-7a11-4ca4-8164-15339c6bfda4',
        'e87ca7b0-976c-44c8-84be-898611bd62ff',
        '38198638-610d-4eaa-a7f0-941cdd8b3d77',
        '234b05fd-1624-4fe6-9318-4baea38688e3'
      ];
      
      console.log('🔍 Checking for your specific title IDs...');
      const { data: specificTitles } = await supabase
        .from('titles')
        .select('*')
        .in('title_id', targetTitleIds);
      
      console.log(`📊 Found ${specificTitles?.length || 0} of your specified titles`);
      
      if (specificTitles && specificTitles.length > 0) {
        console.log('\n✅ Your titles found:');
        specificTitles.forEach((title, index) => {
          console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr}`);
          console.log(`      ID: ${title.title_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDashboardTitles();