/**
 * Featured Data Verification Script
 * 
 * This script checks if the featured table is properly populated
 * and verifies that the Featured Titles section is using real data from Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check featured table data
 */
async function checkFeaturedData() {
  console.log('🔍 Checking Featured Table Data');
  console.log('================================');
  
  try {
    // Check if featured table exists and has data
    const { data: featuredData, error: featuredError } = await supabase
      .from('featured')
      .select('*')
      .order('created_at', { ascending: false });

    if (featuredError) {
      console.error('❌ Error accessing featured table:', featuredError.message);
      return;
    }

    console.log(`✅ Featured table exists with ${featuredData.length} records`);
    console.log('\n📋 Featured Records:');
    featuredData.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   Title ID: ${record.title_id}`);
      console.log(`   Note: ${record.note || 'No note'}`);
      console.log(`   Created: ${record.created_at}`);
      console.log('');
    });

    // Test the same query that featuredService.getFeaturedTitles() uses
    console.log('🧪 Testing Featured Service Query');
    console.log('=================================');
    
    const { data: featuredWithTitles, error: serviceError } = await supabase
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

    if (serviceError) {
      console.error('❌ Error with featured service query:', serviceError.message);
      return;
    }

    console.log(`✅ Featured service query successful with ${featuredWithTitles.length} records`);
    console.log('\n📖 Featured Titles Data:');
    
    featuredWithTitles.forEach((featured, index) => {
      const title = featured.titles;
      if (title) {
        console.log(`${index + 1}. ${title.title_name_en || title.title_name_kr}`);
        console.log(`   Image: ${title.title_image ? 'Available' : 'No image'}`);
        console.log(`   Genre: ${Array.isArray(title.genre) ? title.genre.join(', ') : title.genre || 'No genre'}`);
        console.log(`   Tagline: ${title.tagline || 'No tagline'}`);
      } else {
        console.log(`${index + 1}. ❌ No title data found for featured ID: ${featured.id}`);
      }
      console.log('');
    });

    // Check if any title IDs in featured table don't exist in titles table
    console.log('🔍 Validating Title References');
    console.log('==============================');
    
    const invalidReferences = featuredWithTitles.filter(featured => !featured.titles);
    if (invalidReferences.length > 0) {
      console.log(`⚠️  Found ${invalidReferences.length} featured records with invalid title references:`);
      invalidReferences.forEach(invalid => {
        console.log(`   - Featured ID ${invalid.id} references non-existent title ID: ${invalid.title_id}`);
      });
    } else {
      console.log('✅ All featured records have valid title references');
    }

  } catch (error) {
    console.error('💥 Script error:', error.message);
  }
}

/**
 * Check environment variables that might affect mock data usage
 */
function checkEnvironment() {
  console.log('\n🌍 Environment Check');
  console.log('====================');
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'node-environment';
  const isLocalhost = hostname === 'localhost';
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log(`Hostname: ${hostname}`);
  console.log(`Is Localhost: ${isLocalhost}`);
  console.log(`Is Development: ${isDev}`);
  console.log(`VITE_DISABLE_AUTH_LOCALHOST: ${process.env.VITE_DISABLE_AUTH_LOCALHOST || 'not set'}`);
  
  if (isLocalhost && process.env.VITE_DISABLE_AUTH_LOCALHOST === 'true') {
    console.log('⚠️  Mock data might be used in localhost development');
  } else {
    console.log('✅ Real data should be used (not localhost or auth bypass not enabled)');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Featured Data Verification');
  console.log('=============================\n');
  
  await checkFeaturedData();
  checkEnvironment();
  
  console.log('\n🎉 Verification complete!');
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { checkFeaturedData, checkEnvironment, main };