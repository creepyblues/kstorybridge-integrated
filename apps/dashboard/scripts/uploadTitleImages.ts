import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // You'll need to provide this
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

interface ImageMapping {
  fileName: string;
  titleName: string;
  matchedTitle?: any;
}

// Helper function to normalize title names for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Helper function to extract title name from filename
function extractTitleFromFilename(filename: string): string {
  return filename
    .replace('.png', '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  try {
    console.log('🚀 Starting title image upload process...');

    // 1. Check if bucket exists, create if not
    console.log('📁 Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      console.log('📁 Creating storage bucket...');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        maxFileSizeBytes: 5 * 1024 * 1024 // 5MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log('✅ Storage bucket created successfully');
    } else {
      console.log('✅ Storage bucket already exists');
    }

    // 2. Get existing titles from database
    console.log('📚 Fetching existing titles from database...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_kr, title_name_en, author, title_image');

    if (titlesError) {
      console.error('Error fetching titles:', titlesError);
      return;
    }

    console.log(`📊 Found ${titles.length} titles in database`);

    // 3. Get image files from local directory
    console.log('🖼️  Reading image files...');
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();

    console.log(`📊 Found ${imageFiles.length} image files`);

    // 4. Create mapping between images and titles
    console.log('🔗 Creating image-to-title mappings...');
    const mappings: ImageMapping[] = [];
    const unmatchedImages: string[] = [];
    const unmatchedTitles: any[] = [];

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

    // Find titles without images
    const titlesWithImages = mappings.map(m => m.matchedTitle.title_id);
    unmatchedTitles.push(...titles.filter(title => !titlesWithImages.includes(title.title_id)));

    console.log(`✅ Successfully matched ${mappings.length} images to titles`);
    console.log(`⚠️  ${unmatchedImages.length} images couldn't be matched`);
    console.log(`⚠️  ${unmatchedTitles.length} titles don't have matching images`);

    // 5. Upload images and update titles
    console.log('⬆️  Starting image upload process...');
    
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = `[${i + 1}/${mappings.length}]`;
      
      console.log(`${progress} Processing: ${mapping.fileName} -> ${mapping.matchedTitle.title_name_en || mapping.matchedTitle.title_name_kr}`);
      
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

        console.log(`✅ ${progress} Successfully uploaded and linked: ${mapping.fileName}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${mapping.fileName}:`, error);
      }
    }

    // 6. Summary
    console.log('\n📊 UPLOAD SUMMARY');
    console.log('==================');
    console.log(`✅ Successfully processed: ${mappings.length} images`);
    console.log(`⚠️  Unmatched images: ${unmatchedImages.length}`);
    console.log(`⚠️  Titles without images: ${unmatchedTitles.length}`);
    
    if (unmatchedImages.length > 0) {
      console.log('\n🔍 UNMATCHED IMAGES:');
      unmatchedImages.forEach(img => console.log(`  - ${img}`));
    }
    
    if (unmatchedTitles.length > 0) {
      console.log('\n🔍 TITLES WITHOUT IMAGES:');
      unmatchedTitles.forEach(title => 
        console.log(`  - ${title.title_name_en || title.title_name_kr} (ID: ${title.title_id})`)
      );
    }

    console.log('\n🎉 Image upload process completed!');

  } catch (error) {
    console.error('❌ Fatal error during upload process:', error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as uploadTitleImages };