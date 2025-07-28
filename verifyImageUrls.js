import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test image URL accessibility
async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  try {
    console.log('🔍 Verifying image URLs in titles table...');

    // Fetch all titles from database
    console.log('📚 Fetching titles from database...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_image')
      .order('created_at', { ascending: false });

    if (titlesError) {
      console.error('❌ Error fetching titles:', titlesError.message);
      
      if (titlesError.message.includes('row-level security')) {
        console.log('\n💡 Database access restricted by RLS. Options:');
        console.log('1. Check upload_results.json file for upload summary');
        console.log('2. Check your Supabase dashboard directly');
        console.log('3. Or run: UPDATE titles query from update_titles_with_images.sql');
        
        // Check if results file exists
        if (fs.existsSync('upload_results.json')) {
          console.log('\n📊 Reading from upload_results.json...');
          const uploadResults = JSON.parse(fs.readFileSync('upload_results.json', 'utf8'));
          
          console.log(`✅ Found ${uploadResults.length} uploaded images in results file:`);
          
          uploadResults.slice(0, 10).forEach((result, i) => {
            console.log(`  ${i + 1}. ${result.title_name}`);
            console.log(`     🔗 ${result.image_url}`);
          });
          
          if (uploadResults.length > 10) {
            console.log(`     ... and ${uploadResults.length - 10} more`);
          }
          
          console.log('\n💡 All image URLs should be accessible at those links.');
        }
      }
      return;
    }

    console.log(`📊 Found ${titles.length} titles in database`);

    // Analyze image URL status
    let withImages = 0;
    let withoutImages = 0;
    let workingImages = 0;
    let brokenImages = 0;

    console.log('\n🔍 Analyzing image URLs...');
    
    const titlesWithImages = titles.filter(title => title.title_image);
    const titlesWithoutImages = titles.filter(title => !title.title_image);
    
    withImages = titlesWithImages.length;
    withoutImages = titlesWithoutImages.length;

    console.log(`\n📊 IMAGE URL SUMMARY:`);
    console.log(`✅ Titles with images: ${withImages}`);
    console.log(`❌ Titles without images: ${withoutImages}`);
    console.log(`📈 Coverage: ${((withImages / titles.length) * 100).toFixed(1)}%`);

    if (withImages > 0) {
      console.log('\n🔍 TITLES WITH IMAGES (showing first 10):');
      
      for (let i = 0; i < Math.min(titlesWithImages.length, 10); i++) {
        const title = titlesWithImages[i];
        const titleName = title.title_name_en || title.title_name_kr;
        console.log(`  ${i + 1}. "${titleName}"`);
        console.log(`     🔗 ${title.title_image}`);
        
        // Test if image URL is accessible (for first 3 only to avoid rate limiting)
        if (i < 3) {
          const isAccessible = await testImageUrl(title.title_image);
          if (isAccessible) {
            console.log(`     ✅ Image accessible`);
            workingImages++;
          } else {
            console.log(`     ❌ Image not accessible`);
            brokenImages++;
          }
        }
      }
      
      if (titlesWithImages.length > 10) {
        console.log(`     ... and ${titlesWithImages.length - 10} more titles with images`);
      }
    }

    if (withoutImages > 0) {
      console.log('\n❌ TITLES WITHOUT IMAGES (showing first 5):');
      titlesWithoutImages.slice(0, 5).forEach((title, i) => {
        const titleName = title.title_name_en || title.title_name_kr;
        console.log(`  ${i + 1}. "${titleName}" (ID: ${title.title_id})`);
      });
      
      if (titlesWithoutImages.length > 5) {
        console.log(`     ... and ${titlesWithoutImages.length - 5} more titles without images`);
      }
    }

    // Summary and next steps
    console.log('\n🎯 VERIFICATION RESULTS:');
    console.log(`📊 Total titles: ${titles.length}`);
    console.log(`🖼️  With images: ${withImages} (${((withImages / titles.length) * 100).toFixed(1)}%)`);
    console.log(`📷 Without images: ${withoutImages}`);
    
    if (workingImages > 0 || brokenImages > 0) {
      console.log(`✅ Working image URLs tested: ${workingImages}`);
      console.log(`❌ Broken image URLs tested: ${brokenImages}`);
    }

    if (withImages > 0) {
      console.log('\n🎉 SUCCESS! Images have been uploaded and linked to titles.');
      console.log('💡 You can now view these images in your dashboard and website.');
      
      // Generate sample image URLs for testing
      console.log('\n🔗 SAMPLE IMAGE URLS FOR TESTING:');
      titlesWithImages.slice(0, 3).forEach((title, i) => {
        console.log(`${i + 1}. ${title.title_image}`);
      });
      
    } else {
      console.log('\n⚠️  No images found in titles. This could mean:');
      console.log('1. The UPDATE statements from update_titles_with_images.sql were not run');
      console.log('2. RLS policies prevent reading the updated data');
      console.log('3. The upload process did not complete successfully');
      
      console.log('\n💡 NEXT STEPS:');
      console.log('1. Check if update_titles_with_images.sql file exists');
      console.log('2. Run those UPDATE statements in Supabase SQL Editor');
      console.log('3. Or check your Supabase Dashboard → Table Editor → titles');
    }

    // Check for generated files
    console.log('\n📄 GENERATED FILES CHECK:');
    const files = ['upload_results.json', 'update_titles_with_images.sql'];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} not found`);
      }
    });

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

main();