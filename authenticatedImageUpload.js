import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGES_DIR = '/Users/sungholee/Downloads/manta_title_left_images';
const BUCKET_NAME = 'title-images';

// Parse CSV data into JSON format
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

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
function findBestMatch(filename, titles, threshold = 50) {
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

async function authenticateUser() {
  console.log('🔐 Authentication required to access titles...');
  console.log('Please provide your login credentials:');
  
  // In a real scenario, you'd prompt for email/password
  // For now, we'll return false to indicate manual authentication needed
  return false;
}

async function main() {
  try {
    console.log('🚀 Starting authenticated image upload process...');
    
    // Step 1: Try to authenticate (you may need to do this manually)
    const isAuthenticated = await authenticateUser();
    
    if (!isAuthenticated) {
      console.log('\n⚠️  AUTHENTICATION REQUIRED');
      console.log('The database requires authentication to access titles.');
      console.log('\n🔧 MANUAL WORKAROUND:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to Table Editor → titles');
      console.log('3. Export your titles as CSV');
      console.log('4. Save the file as "my_titles.csv" in this directory');
      console.log('5. Run this script again');
      
      // Check if manual files exist
      const csvFile = 'my_titles.csv';
      const jsonFile = 'my_titles.json';
      
      if (fs.existsSync(csvFile)) {
        console.log(`\n✅ Found ${csvFile}! Loading titles from CSV...`);
        const titlesData = parseCSV(fs.readFileSync(csvFile, 'utf8'));
        await processWithTitles(titlesData);
      } else if (fs.existsSync(jsonFile)) {
        console.log(`\n✅ Found ${jsonFile}! Loading titles from JSON...`);
        const titlesData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        await processWithTitles(titlesData);
      } else {
        console.log(`\n❌ File ${csvFile} or ${jsonFile} not found. Please create one first.`);
        
        // Create example CSV format
        const exampleCSV = `title_id,title_name_en,title_name_kr,title_image
example-uuid-1,"Under the Oak Tree","떡갈나무 아래",
example-uuid-2,"Cold Blooded Beast","냉혈한 야수",`;
        
        fs.writeFileSync('example_titles_format.csv', exampleCSV);
        console.log('✅ Created example_titles_format.csv showing the expected format');
        
        // Also create JSON format for reference
        const exampleFormat = [
          {
            "title_id": "example-uuid-1",
            "title_name_en": "Under the Oak Tree",
            "title_name_kr": "떡갈나무 아래",
            "title_image": null
          },
          {
            "title_id": "example-uuid-2", 
            "title_name_en": "Cold Blooded Beast",
            "title_name_kr": "냉혈한 야수",
            "title_image": null
          }
        ];
        
        fs.writeFileSync('example_titles_format.json', JSON.stringify(exampleFormat, null, 2));
        console.log('✅ Also created example_titles_format.json for reference');
      }
      
      return;
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

async function processWithTitles(titles) {
  try {
    console.log(`📊 Loaded ${titles.length} titles from file`);

    // Show sample titles
    if (titles.length > 0) {
      console.log('\n📋 Sample titles:');
      titles.slice(0, 3).forEach((title, i) => {
        console.log(`  ${i + 1}. EN: "${title.title_name_en}" | KR: "${title.title_name_kr}"`);
      });
    }

    // Check storage bucket and create if needed
    console.log('\n📁 Checking storage bucket...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (testError && (testError.message.includes('not found') || testError.message.includes('Bucket not found'))) {
      console.log(`📁 Bucket '${BUCKET_NAME}' doesn't exist. Attempting to create...`);
      
      const { data: bucketData, error: createError } = await supabase.storage
        .createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
          maxFileSizeBytes: 10 * 1024 * 1024 // 10MB
        });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n💡 Manual fix required:');
        console.log('1. Go to Supabase Dashboard → Storage');
        console.log('2. Click "New bucket"');
        console.log(`3. Name: ${BUCKET_NAME}`);
        console.log('4. Make it Public: Yes');
        console.log('5. Allow image files: png, jpeg, jpg');
        return;
      } else {
        console.log('✅ Storage bucket created successfully!');
      }
    } else if (testError) {
      console.error('Error accessing bucket:', testError);
      return;
    } else {
      console.log('✅ Storage bucket is accessible');
    }

    // Get image files
    console.log('\n🖼️  Reading image files...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
      return;
    }

    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();

    console.log(`📊 Found ${imageFiles.length} image files`);

    // Create smart mappings
    console.log('\n🧠 Creating smart mappings...');
    const mappings = [];
    const unmatchedFiles = [];

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
      } else {
        unmatchedFiles.push(imageFile);
      }
    }

    console.log(`\n📊 MATCHING RESULTS:`);
    console.log(`✅ Matched: ${mappings.length} images`);
    console.log(`❌ Unmatched: ${unmatchedFiles.length} images`);

    // Show top matches
    if (mappings.length > 0) {
      console.log('\n🔍 TOP MATCHES:');
      mappings
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)
        .forEach((mapping, i) => {
          const confidence = mapping.matchScore.toFixed(1);
          const titleText = mapping.matchedTitle[mapping.matchedField];
          console.log(`  ${i + 1}. ${confidence}% | "${mapping.titleFromFile}" -> "${titleText}"`);
        });

      // Upload images
      console.log(`\n⬆️  Starting upload of ${mappings.length} images...`);
      
      let successCount = 0;
      const uploadResults = [];

      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        const progress = `[${i + 1}/${mappings.length}]`;
        
        try {
          console.log(`${progress} Uploading: ${mapping.fileName}`);
          
          // Read and upload image
          const imagePath = path.join(IMAGES_DIR, mapping.fileName);
          const imageBuffer = fs.readFileSync(imagePath);
          const fileExtension = path.extname(mapping.fileName);
          const uniqueFileName = `${mapping.matchedTitle.title_id}${fileExtension}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(uniqueFileName, imageBuffer, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            console.error(`❌ ${progress} Upload failed:`, uploadError.message);
            
            // If bucket still doesn't exist, suggest manual creation
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
              console.log('💡 The storage bucket still doesn\'t exist. Please create it manually:');
              console.log('1. Go to Supabase Dashboard → Storage');
              console.log('2. Create a new public bucket named "title-images"');
              return; // Stop processing
            }
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(uniqueFileName);

          const publicUrl = publicUrlData.publicUrl;
          
          uploadResults.push({
            title_id: mapping.matchedTitle.title_id,
            title_name: mapping.matchedTitle.title_name_en || mapping.matchedTitle.title_name_kr,
            image_url: publicUrl,
            filename: mapping.fileName
          });

          console.log(`✅ ${progress} Uploaded successfully`);
          successCount++;
          
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (error) {
          console.error(`❌ ${progress} Error:`, error.message);
        }
      }

      // Generate SQL update statements
      console.log('\n📝 Generating update statements...');
      const updateStatements = uploadResults.map(result => {
        return `UPDATE titles SET title_image = '${result.image_url}' WHERE title_id = '${result.title_id}';`;
      });

      fs.writeFileSync('update_titles_with_images.sql', updateStatements.join('\n'));
      console.log('✅ Created update_titles_with_images.sql');

      // Generate summary
      fs.writeFileSync('upload_results.json', JSON.stringify(uploadResults, null, 2));
      console.log('✅ Created upload_results.json');

      console.log('\n🎉 UPLOAD COMPLETED!');
      console.log(`✅ Successfully uploaded: ${successCount} images`);
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Run the SQL statements in update_titles_with_images.sql in your Supabase SQL editor');
      console.log('2. Or manually update the title_image field for each title in the table editor');
      console.log('3. Check upload_results.json for the complete mapping');

    } else {
      console.log('\n⚠️  No matches found. You may need to:');
      console.log('1. Check that your titles file has the correct format');
      console.log('2. Lower the similarity threshold');
      console.log('3. Manually rename image files to match titles exactly');
    }

  } catch (error) {
    console.error('❌ Error processing titles:', error);
  }
}

// Run the script
main();