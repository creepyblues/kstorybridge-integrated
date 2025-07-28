import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

// You'll need to provide a creator_id from your auth users table
const CREATOR_ID = 'your-creator-user-id'; // This needs to be updated with a real user ID

// Helper function to extract title name from filename
function extractTitleFromFilename(filename) {
  return filename
    .replace('.png', '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to generate Korean title name (placeholder)
function generateKoreanTitle(englishTitle) {
  // This is a placeholder - in reality you'd want proper Korean translations
  return englishTitle + ' (Korean)';
}

// Helper to randomly assign genres
function getRandomGenre() {
  const genres = ['romance', 'fantasy', 'action', 'drama', 'comedy', 'thriller', 'sci_fi'];
  return genres[Math.floor(Math.random() * genres.length)];
}

// Helper to randomly assign content format
function getRandomFormat() {
  const formats = ['webtoon', 'web_novel', 'book'];
  return formats[Math.floor(Math.random() * formats.length)];
}

async function main() {
  try {
    console.log('🚀 Starting title creation and image upload process...');

    // For demo purposes, we'll use a placeholder UUID as creator_id
    // In production, this should be a real user ID from auth.users
    const creatorId = '00000000-0000-0000-0000-000000000001';
    console.log(`📋 Using placeholder creator ID: ${creatorId}`);

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

    // 2. Get image files
    console.log('🖼️  Reading image files...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
      return;
    }

    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();

    console.log(`📊 Found ${imageFiles.length} image files`);

    // 3. Create titles and upload images
    console.log('📚 Creating titles and uploading images...');
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < Math.min(imageFiles.length, 10); i++) { // Limit to first 10 for testing
      const imageFile = imageFiles[i];
      const progress = `[${i + 1}/10]`;
      
      try {
        console.log(`${progress} Processing: ${imageFile}`);
        
        // Extract title information
        const titleNameEn = extractTitleFromFilename(imageFile);
        const titleNameKr = generateKoreanTitle(titleNameEn);
        
        // Create title record
        const titleData = {
          title_id: uuidv4(),
          title_name_en: titleNameEn,
          title_name_kr: titleNameKr,
          creator_id: creatorId,
          genre: getRandomGenre(),
          content_format: getRandomFormat(),
          synopsis: `An exciting story about ${titleNameEn.toLowerCase()}. This compelling narrative explores themes of adventure, friendship, and personal growth.`,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
          likes: Math.floor(Math.random() * 5000) + 100,
          views: Math.floor(Math.random() * 50000) + 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert title into database
        const { data: insertedTitle, error: insertError } = await supabase
          .from('titles')
          .insert(titleData)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ ${progress} Failed to create title:`, insertError);
          errorCount++;
          continue;
        }

        // Upload image
        const imagePath = path.join(IMAGES_DIR, imageFile);
        const imageBuffer = fs.readFileSync(imagePath);
        const fileExtension = path.extname(imageFile);
        const uniqueFileName = `${insertedTitle.title_id}${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uniqueFileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`❌ ${progress} Failed to upload image:`, uploadError);
          errorCount++;
          continue;
        }

        // Get public URL and update title
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uniqueFileName);

        const { error: updateError } = await supabase
          .from('titles')
          .update({ title_image: publicUrlData.publicUrl })
          .eq('title_id', insertedTitle.title_id);

        if (updateError) {
          console.error(`❌ ${progress} Failed to update title with image URL:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`✅ ${progress} Successfully created: ${titleNameEn}`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ ${progress} Error processing ${imageFile}:`, error);
        errorCount++;
      }
    }

    // 4. Summary
    console.log('\n🎉 PROCESS COMPLETED!');
    console.log('===================');
    console.log(`✅ Successfully created: ${successCount} titles with images`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Remaining images: ${imageFiles.length - 10} (run script again to process more)`);

    if (successCount > 0) {
      console.log('\n🌟 Sample titles created! You can now view them in your dashboard.');
      console.log('🔗 Visit your dashboard to see the titles with cover images.');
    }

  } catch (error) {
    console.error('❌ Fatal error during process:', error);
  }
}

// Run the script
main();