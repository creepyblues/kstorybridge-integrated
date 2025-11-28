#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (using anon key for debugging)
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

// Initialize Supabase client with anon key (read-only access)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugTitles() {
  console.log('🔍 Debugging Titles Table...\n');

  try {
    // Check if we can access the titles table at all
    console.log('1. Testing basic table access...');
    const { data: testData, error: testError } = await supabase
      .from('titles')
      .select('title_id')
      .limit(1);

    if (testError) {
      console.log(`❌ Cannot access titles table: ${testError.message}`);
      console.log('   This might be due to RLS (Row Level Security) policies.');
      console.log('   You may need to use the service role key instead.');
      return;
    }

    console.log('✅ Can access titles table');

    // Check total count
    console.log('\n2. Checking total titles...');
    const { count, error: countError } = await supabase
      .from('titles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Error counting titles: ${countError.message}`);
    } else {
      console.log(`📊 Total titles in database: ${count}`);
    }

    // Get sample data
    console.log('\n3. Fetching sample titles...');
    const { data: sampleTitles, error: sampleError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_url, title_image')
      .limit(5);

    if (sampleError) {
      console.log(`❌ Error fetching sample: ${sampleError.message}`);
      return;
    }

    console.log(`📝 Sample titles (${sampleTitles.length} shown):`);
    sampleTitles.forEach((title, index) => {
      console.log(`\n   ${index + 1}. ${title.title_name_en || title.title_name_kr || 'No name'}`);
      console.log(`      ID: ${title.title_id}`);
      console.log(`      URL: ${title.title_url || 'NO URL'}`);
      console.log(`      Image: ${title.title_image || 'NO IMAGE'}`);
    });

    // Check for titles with URLs
    console.log('\n4. Checking titles with URLs...');
    const { data: withUrls, error: urlError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_url')
      .not('title_url', 'is', null)
      .neq('title_url', '');

    if (urlError) {
      console.log(`❌ Error checking URLs: ${urlError.message}`);
    } else {
      console.log(`🔗 Titles with valid URLs: ${withUrls.length}`);
      
      if (withUrls.length > 0) {
        console.log(`\n   Examples with URLs:`);
        withUrls.slice(0, 3).forEach((title, index) => {
          console.log(`   ${index + 1}. "${title.title_name_en || title.title_name_kr}"`);
          console.log(`      URL: ${title.title_url}`);
        });
      }
    }

    // Check for titles without images
    console.log('\n5. Checking titles without images...');
    const { data: withoutImages, error: imageError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_url, title_image')
      .not('title_url', 'is', null)
      .neq('title_url', '')
      .is('title_image', null);

    if (imageError) {
      console.log(`❌ Error checking images: ${imageError.message}`);
    } else {
      console.log(`🖼️  Titles with URLs but no images: ${withoutImages.length}`);
      
      if (withoutImages.length > 0) {
        console.log(`\n   These titles need cover images:`);
        withoutImages.slice(0, 5).forEach((title, index) => {
          console.log(`   ${index + 1}. "${title.title_name_en || title.title_name_kr}"`);
          console.log(`      URL: ${title.title_url}`);
        });
      }
    }

  } catch (error) {
    console.log(`❌ Fatal error: ${error.message}`);
  }

  console.log('\n🎉 Debug complete!');
  console.log('\nNext steps:');
  console.log('- If you see titles with URLs but no images, the extraction script should work');
  console.log('- You may need the service role key from Supabase Dashboard → Settings → API');
  console.log('- The service role key bypasses RLS policies and allows updates');
}

debugTitles();