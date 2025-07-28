#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTitles() {
  try {
    console.log('🔍 Checking titles table...');
    
    // Get all titles
    const { data: allTitles, error } = await supabase
      .from('titles')
      .select('*');

    if (error) {
      console.error('❌ Error fetching titles:', error);
      return;
    }

    console.log(`📊 Total titles in database: ${allTitles?.length || 0}`);
    
    if (allTitles && allTitles.length > 0) {
      console.log('\n📋 First few titles:');
      allTitles.slice(0, 6).forEach((title, index) => {
        console.log(`   ${index + 1}. ID: ${title.title_id}`);
        console.log(`      Name EN: ${title.title_name_en || 'None'}`);
        console.log(`      Name KR: ${title.title_name_kr || 'None'}`);
        console.log(`      Image: ${title.title_image ? 'Yes' : 'No'}`);
        console.log(`      Tagline: ${title.tagline || 'None'}`);
        console.log('');
      });
      
      // Show all available columns
      console.log('📊 Available columns:', Object.keys(allTitles[0]));
    } else {
      console.log('⚠️  No titles found in the database');
      
      // Let's try to see what tables exist
      console.log('\n🔍 Checking available tables...');
      
      // Try different table patterns that might exist
      const tablesToCheck = ['titles', 'title', 'content', 'webtoons', 'stories'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (!error && data) {
            console.log(`✅ Found table: ${tableName} with ${data.length} records`);
            if (data.length > 0) {
              console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            }
          }
        } catch (e) {
          // Table doesn't exist, continue
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTitles();