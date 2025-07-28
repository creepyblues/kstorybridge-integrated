import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

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
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Advanced text normalization for better matching
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[&]/g, 'and')
    .replace(/[-_\s]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract title from filename
function extractTitleFromFilename(filename) {
  return filename
    .replace('.png', '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  if (norm1 === norm2) return 100;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 90;
  
  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const similarity = ((maxLen - distance) / maxLen) * 80;
  
  return Math.max(0, similarity);
}

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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function findBestMatch(filename, titles, threshold = 50) {
  const titleFromFilename = extractTitleFromFilename(filename);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const title of titles) {
    if (title.title_name_en) {
      const score1 = calculateSimilarity(titleFromFilename, title.title_name_en);
      if (score1 > bestScore && score1 >= threshold) {
        bestScore = score1;
        bestMatch = { title, score: score1, matchedField: 'title_name_en' };
      }
    }
    
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

// Prompt for service key
function promptForServiceKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🔑 SUPABASE SERVICE ROLE KEY REQUIRED');
    console.log('To bypass RLS policies, we need your service role key.');
    console.log('📍 Find it in: Supabase Dashboard → Settings → API → service_role key');
    console.log('⚠️  This key will not be saved anywhere.\n');

    rl.question('Enter your service role key (or press Enter to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    console.log('🚀 Starting image upload with service key authentication...');

    // Check for titles file
    const csvFile = 'my_titles.csv';
    const jsonFile = 'my_titles.json';
    
    let titles = [];
    
    if (fs.existsSync(csvFile)) {
      console.log(`✅ Found ${csvFile}! Loading titles from CSV...`);
      titles = parseCSV(fs.readFileSync(csvFile, 'utf8'));
    } else if (fs.existsSync(jsonFile)) {
      console.log(`✅ Found ${jsonFile}! Loading titles from JSON...`);
      titles = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    } else {
      console.log(`❌ Neither ${csvFile} nor ${jsonFile} found.`);
      console.log('Please export your titles from Supabase first.');
      return;
    }

    console.log(`📊 Loaded ${titles.length} titles`);

    if (titles.length === 0) {
      console.log('⚠️  No titles found in file.');
      return;
    }

    // Prompt for service key
    const serviceKey = await promptForServiceKey();
    
    let supabase;
    if (serviceKey && serviceKey.length > 50) {
      console.log('🔑 Using service role key for uploads...');
      supabase = createClient(SUPABASE_URL, serviceKey);
    } else {
      console.log('⚠️  No service key provided. Using anon key (may fail due to RLS)...');
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      console.log('\n💡 If uploads fail, you can:');
      console.log('1. Provide the service role key when prompted');
      console.log('2. Or disable RLS on storage.objects table in Supabase Dashboard');
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

    // Create mappings
    console.log('\n🧠 Creating smart mappings...');
    const mappings = [];

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
      }
    }

    console.log(`✅ Mapped ${mappings.length} images to titles`);

    if (mappings.length === 0) {
      console.log('⚠️  No matches found.');
      return;
    }

    // Show top matches
    console.log('\n🔍 TOP MATCHES:');
    mappings
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)
      .forEach((mapping, i) => {
        const confidence = mapping.matchScore.toFixed(1);
        const titleText = mapping.matchedTitle[mapping.matchedField];
        console.log(`  ${i + 1}. ${confidence}% | "${mapping.titleFromFile}" -> "${titleText}"`);
      });

    // Upload images
    console.log(`\n⬆️  Starting upload of ${mappings.length} images...`);
    
    let successCount = 0;
    let errorCount = 0;
    const uploadResults = [];

    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = `[${i + 1}/${mappings.length}]`;
      
      try {
        console.log(`${progress} Uploading: ${mapping.fileName}`);
        
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
          errorCount++;
          
          if (uploadError.message.includes('row-level security')) {
            console.log('\n🔑 RLS Error detected. Solutions:');
            console.log('1. Restart script and provide service role key');
            console.log('2. Or disable RLS on storage.objects in Supabase Dashboard');
            break; // Stop processing
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

        console.log(`✅ ${progress} Success`);
        successCount++;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ ${progress} Error:`, error.message);
        errorCount++;
      }
    }

    // Generate results
    if (uploadResults.length > 0) {
      const updateStatements = uploadResults.map(result => {
        return `UPDATE titles SET title_image = '${result.image_url}' WHERE title_id = '${result.title_id}';`;
      });

      fs.writeFileSync('update_titles_with_images.sql', updateStatements.join('\n'));
      fs.writeFileSync('upload_results.json', JSON.stringify(uploadResults, null, 2));

      console.log('\n🎉 UPLOAD COMPLETED!');
      console.log(`✅ Successfully uploaded: ${successCount} images`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log('\n📄 Generated files:');
      console.log('- update_titles_with_images.sql (run in Supabase SQL editor)');
      console.log('- upload_results.json (results summary)');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

main();