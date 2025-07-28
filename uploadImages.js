import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

// Helper function to normalize title names for matching
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

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
    console.log('🚀 Starting title image upload process...');

    // 1. Check if bucket exists (skip creation for now - needs service role)
    console.log('📁 Checking storage bucket...');
    
    // Test if we can access the bucket by trying to list files
    const { data: testFiles, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (testError && testError.message.includes('not found')) {
      console.error(`❌ Storage bucket '${BUCKET_NAME}' does not exist. Please create it manually in Supabase dashboard first.`);
      console.log('💡 Go to your Supabase project -> Storage -> Create bucket:');
      console.log(`   - Name: ${BUCKET_NAME}`);
      console.log('   - Public: Yes');
      console.log('   - Allowed file types: image/png, image/jpeg');
      return;
    } else if (testError) {
      console.error('Error accessing bucket:', testError);
      return;
    } else {
      console.log('✅ Storage bucket is accessible');
    }

    // 2. Get existing titles from database
    console.log('📚 Fetching existing titles from database...');
    const { data: sampleTitle, error: sampleError } = await supabase
      .from('titles')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample title:', sampleError);
      return;
    }

    if (sampleTitle.length > 0) {
      console.log('📋 Sample title structure:', Object.keys(sampleTitle[0]));
    } else {
      console.log('⚠️  No titles found in database. Need to create sample titles first.');
    }

    // Now get all titles with the correct columns
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_kr, title_name_en, title_image');

    if (titlesError) {
      console.error('Error fetching all titles:', titlesError);
      return;
    }

    console.log(`📊 Found ${titles.length} titles in database`);

    // 3. Get image files from local directory
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
    const unmatchedImages = [];

    for (const imageFile of imageFiles) {
      const titleFromFilename = extractTitleFromFilename(imageFile);
      const normalizedImageTitle = normalizeTitle(titleFromFilename);
      
      // Try to find matching title
      const matchedTitle = titles.find(title => {
        const normalizedKr = normalizeTitle(title.title_name_kr || '');
        const normalizedEn = normalizeTitle(title.title_name_en || '');
        
        return normalizedImageTitle === normalizedKr || 
               normalizedImageTitle === normalizedEn ||
               normalizedImageTitle.includes(normalizedKr) ||
               normalizedImageTitle.includes(normalizedEn) ||
               normalizedKr.includes(normalizedImageTitle) ||
               normalizedEn.includes(normalizedImageTitle);
      });

      if (matchedTitle) {
        mappings.push({
          fileName: imageFile,
          titleName: titleFromFilename,
          matchedTitle
        });
      } else {
        unmatchedImages.push(imageFile);
      }
    }

    console.log(`✅ Successfully matched ${mappings.length} images to titles`);
    console.log(`⚠️  ${unmatchedImages.length} images couldn't be matched`);

    // Show some examples of matches
    console.log('\n🔍 SAMPLE MATCHES:');
    mappings.slice(0, 5).forEach(mapping => {
      console.log(`  ${mapping.fileName} -> ${mapping.matchedTitle.title_name_en || mapping.matchedTitle.title_name_kr}`);
    });

    if (unmatchedImages.length > 0) {
      console.log('\n🔍 SAMPLE UNMATCHED IMAGES:');
      unmatchedImages.slice(0, 10).forEach(img => console.log(`  - ${img}`));
    }

    // Ask for confirmation
    console.log(`\n❓ Do you want to proceed with uploading ${mappings.length} images? (Press Ctrl+C to cancel, or continue...)`);
    
    // Wait a bit for user to see the preview
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Upload images and update titles
    console.log('⬆️  Starting image upload process...');
    
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = `[${i + 1}/${mappings.length}]`;
      
      console.log(`${progress} Processing: ${mapping.fileName}`);
      
      try {
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
          console.error(`❌ Upload failed for ${mapping.fileName}:`, uploadError);
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
          console.error(`❌ Database update failed for ${mapping.fileName}:`, updateError);
          continue;
        }

        console.log(`✅ ${progress} Success: ${mapping.fileName}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error processing ${mapping.fileName}:`, error);
      }
    }

    // 6. Summary
    console.log('\n🎉 UPLOAD COMPLETED!');
    console.log('==================');
    console.log(`✅ Successfully processed: ${mappings.length} images`);
    console.log(`⚠️  Unmatched images: ${unmatchedImages.length}`);
    
    console.log('\n✨ Images are now available in the titles database with public URLs!');

  } catch (error) {
    console.error('❌ Fatal error during upload process:', error);
  }
}

// Run the script
main();