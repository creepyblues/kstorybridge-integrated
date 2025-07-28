import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

// Advanced text normalization for better matching
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[''`]/g, '') // Remove apostrophes and quotes
    .replace(/[&]/g, 'and') // Replace & with 'and'
    .replace(/[-_\s]+/g, ' ') // Replace dashes, underscores, multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove all special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Extract title from filename with better handling
function extractTitleFromFilename(filename) {
  return filename
    .replace('.png', '')
    .replace(/_+/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  // Exact match gets highest score
  if (norm1 === norm2) return 100;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 90;
  
  // Calculate Levenshtein distance-based similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const similarity = ((maxLen - distance) / maxLen) * 80; // Max 80 for partial matches
  
  return Math.max(0, similarity);
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Find best match for a filename among titles
function findBestMatch(filename, titles, threshold = 60) {
  const titleFromFilename = extractTitleFromFilename(filename);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const title of titles) {
    // Check against English title
    if (title.title_name_en) {
      const score1 = calculateSimilarity(titleFromFilename, title.title_name_en);
      if (score1 > bestScore && score1 >= threshold) {
        bestScore = score1;
        bestMatch = { title, score: score1, matchedField: 'title_name_en' };
      }
    }
    
    // Check against Korean title
    if (title.title_name_kr) {
      const score2 = calculateSimilarity(titleFromFilename, title.title_name_kr);
      if (score2 > bestScore && score2 >= threshold) {
        bestScore = score2;
        bestMatch = { title, score: score2, matchedField: 'title_name_kr' };
      }
    }
  }
  
  return bestMatch;
}

async function main() {
  try {
    console.log('🚀 Starting smart image upload and matching process...');

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
      console.log('⚠️  No titles found in database.');
      return;
    }

    // Show some sample titles for reference
    console.log('\n📋 Sample titles from database:');
    titles.slice(0, 3).forEach((title, i) => {
      console.log(`  ${i + 1}. EN: "${title.title_name_en}" | KR: "${title.title_name_kr}"`);
    });

    // 3. Get image files
    console.log('\n🖼️  Reading image files...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
      return;
    }

    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();

    console.log(`📊 Found ${imageFiles.length} image files`);

    // Show some sample filenames for reference
    console.log('\n📋 Sample image filenames:');
    imageFiles.slice(0, 3).forEach((file, i) => {
      console.log(`  ${i + 1}. "${file}" -> "${extractTitleFromFilename(file)}"`);
    });

    // 4. Create smart mappings
    console.log('\n🧠 Creating smart mappings with similarity matching...');
    const mappings = [];
    const unmatchedFiles = [];
    const matchingStats = { perfect: 0, good: 0, fair: 0 };

    for (const imageFile of imageFiles) {
      const match = findBestMatch(imageFile, titles);
      
      if (match) {
        mappings.push({
          fileName: imageFile,
          titleFromFile: extractTitleFromFilename(imageFile),
          matchedTitle: match.title,
          matchScore: match.score,
          matchedField: match.matchedField
        });

        // Categorize match quality
        if (match.score >= 95) matchingStats.perfect++;
        else if (match.score >= 80) matchingStats.good++;
        else matchingStats.fair++;
      } else {
        unmatchedFiles.push(imageFile);
      }
    }

    console.log(`\n📊 MATCHING RESULTS:`);
    console.log(`✅ Total matches: ${mappings.length}`);
    console.log(`  🎯 Perfect matches (95%+): ${matchingStats.perfect}`);
    console.log(`  👍 Good matches (80-94%): ${matchingStats.good}`);
    console.log(`  👌 Fair matches (60-79%): ${matchingStats.fair}`);
    console.log(`❌ Unmatched files: ${unmatchedFiles.length}`);

    // Show best matches
    console.log('\n🔍 TOP MATCHES (showing confidence scores):');
    mappings
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)
      .forEach((mapping, i) => {
        const confidence = mapping.matchScore.toFixed(1);
        const titleText = mapping.matchedTitle[mapping.matchedField];
        console.log(`  ${i + 1}. ${confidence}% | "${mapping.titleFromFile}" -> "${titleText}"`);
      });

    // Show some unmatched files
    if (unmatchedFiles.length > 0) {
      console.log('\n❌ UNMATCHED FILES (first 10):');
      unmatchedFiles.slice(0, 10).forEach((file, i) => {
        console.log(`  ${i + 1}. "${file}" -> "${extractTitleFromFilename(file)}"`);
      });
    }

    if (mappings.length === 0) {
      console.log('\n⚠️  No matches found. You may need to adjust the similarity threshold or check title formats.');
      return;
    }

    // Ask for confirmation
    console.log(`\n❓ Proceed with uploading ${mappings.length} matched images? (Waiting 5 seconds...)`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Upload images and update titles
    console.log('\n⬆️  Starting image upload process...');
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = `[${i + 1}/${mappings.length}]`;
      
      try {
        const confidence = mapping.matchScore.toFixed(1);
        console.log(`${progress} (${confidence}%) Uploading: ${mapping.fileName}`);
        
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

        console.log(`✅ ${progress} Success!`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        console.error(`❌ ${progress} Error:`, error.message);
        errorCount++;
      }
    }

    // 6. Final Summary
    console.log('\n🎉 UPLOAD COMPLETED!');
    console.log('===================');
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Match quality breakdown:`);
    console.log(`  🎯 Perfect: ${matchingStats.perfect} | 👍 Good: ${matchingStats.good} | 👌 Fair: ${matchingStats.fair}`);
    
    if (successCount > 0) {
      console.log('\n🌟 Images are now linked to titles in your database!');
      console.log('🔗 The title_image field contains public URLs for the cover images.');
      console.log('📱 You can now view these images in your dashboard and website.');
    }

    if (unmatchedFiles.length > 0) {
      console.log(`\n💡 TIP: ${unmatchedFiles.length} files couldn't be matched. You can:`);
      console.log('1. Manually check the unmatched files list above');
      console.log('2. Lower the similarity threshold (currently 60%)');
      console.log('3. Manually rename files to match title names exactly');
    }

  } catch (error) {
    console.error('❌ Fatal error during upload process:', error);
  }
}

// Run the script
main();