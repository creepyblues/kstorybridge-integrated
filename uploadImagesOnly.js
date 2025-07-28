import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

// Helper function to extract title name from filename
function extractTitleFromFilename(filename) {
  return filename
    .replace('.png', '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  try {
    console.log('🚀 Starting image upload process...');

    // 1. Check storage bucket
    console.log('📁 Checking storage bucket...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (testError && testError.message.includes('not found')) {
      console.error(`❌ Storage bucket '${BUCKET_NAME}' does not exist. Please create it manually in Supabase dashboard first.`);
      return;
    } else if (testError) {
      console.error('Error accessing bucket:', testError);
      return;
    } else {
      console.log('✅ Storage bucket is accessible');
    }

    // 2. Get existing titles from database
    console.log('📚 Fetching existing titles from database...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_kr, title_name_en, title_image');

    if (titlesError) {
      console.error('Error fetching titles:', titlesError);
      return;
    }

    console.log(`📊 Found ${titles.length} titles in database`);

    if (titles.length === 0) {
      console.log('⚠️  No titles found. Please import titles first using the generated SQL/CSV files.');
      return;
    }

    // 3. Get image files
    console.log('🖼️  Reading image files...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
      return;
    }

    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();

    console.log(`📊 Found ${imageFiles.length} image files`);

    // 4. Create mapping between images and titles
    console.log('🔗 Creating image-to-title mappings...');
    const mappings = [];

    for (const imageFile of imageFiles) {
      const titleFromFilename = extractTitleFromFilename(imageFile);
      
      // Find matching title by name
      const matchedTitle = titles.find(title => {
        const titleEn = (title.title_name_en || '').toLowerCase();
        const titleKr = (title.title_name_kr || '').toLowerCase();
        const filename = titleFromFilename.toLowerCase();
        
        return titleEn === filename || titleKr.includes(filename) || filename.includes(titleEn);
      });

      if (matchedTitle) {
        mappings.push({
          fileName: imageFile,
          titleName: titleFromFilename,
          matchedTitle
        });
      }
    }

    console.log(`✅ Successfully matched ${mappings.length} images to titles`);

    if (mappings.length === 0) {
      console.log('⚠️  No images could be matched to titles. Check that titles are imported correctly.');
      return;
    }

    // Show some examples
    console.log('\n🔍 SAMPLE MATCHES:');
    mappings.slice(0, 5).forEach(mapping => {
      console.log(`  ${mapping.fileName} -> ${mapping.matchedTitle.title_name_en || mapping.matchedTitle.title_name_kr}`);
    });

    console.log(`\n❓ Proceeding to upload ${mappings.length} images...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Upload images and update titles
    console.log('⬆️  Starting image upload process...');
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = `[${i + 1}/${mappings.length}]`;
      
      try {
        console.log(`${progress} Uploading: ${mapping.fileName}`);
        
        // Read image file
        const imagePath = path.join(IMAGES_DIR, mapping.fileName);
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Generate unique filename
        const fileExtension = path.extname(mapping.fileName);
        const uniqueFileName = `${mapping.matchedTitle.title_id}${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uniqueFileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`❌ ${progress} Upload failed:`, uploadError.message);
          errorCount++;
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uniqueFileName);

        const publicUrl = publicUrlData.publicUrl;

        // Update title with image URL
        const { error: updateError } = await supabase
          .from('titles')
          .update({ title_image: publicUrl })
          .eq('title_id', mapping.matchedTitle.title_id);

        if (updateError) {
          console.error(`❌ ${progress} Database update failed:`, updateError.message);
          errorCount++;
          continue;
        }

        console.log(`✅ ${progress} Success`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ ${progress} Error:`, error.message);
        errorCount++;
      }
    }

    // 6. Summary
    console.log('\n🎉 UPLOAD COMPLETED!');
    console.log('===================');
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🌟 Images are now linked to titles! You can view them in your dashboard.');
      console.log('🔗 The title_image field now contains public URLs for the cover images.');
    }

  } catch (error) {
    console.error('❌ Fatal error during upload process:', error);
  }
}

// Run the script
main();