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
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
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

// Enhanced filename to title conversion
function convertFilenameToTitle(filename) {
  // Remove .png extension
  let title = filename.replace('.png', '');
  
  // Replace special character patterns
  title = title.replace(/___/g, ' & '); // Three underscores = &
  title = title.replace(/__/g, '... '); // Two underscores might be ellipsis
  title = title.replace(/_/g, ' '); // Single underscore = space
  
  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();
  
  return title;
}

// Normalize text for comparison
function normalizeForComparison(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/[,!?.:;]/g, '') // Remove punctuation
    .replace(/&/g, 'and') // Normalize & to 'and'
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Check if filename matches title with special rules
function checkSpecialMatch(filenameTitle, actualTitle) {
  const normFilename = normalizeForComparison(filenameTitle);
  const normTitle = normalizeForComparison(actualTitle);
  
  // Exact match after normalization
  if (normFilename === normTitle) return true;
  
  // Check if filename is a prefix (for truncated titles)
  if (normTitle.startsWith(normFilename) && normFilename.length > 10) return true;
  
  // Check if all words from filename appear in title in order
  const filenameWords = normFilename.split(' ').filter(w => w.length > 2);
  const titleWords = normTitle.split(' ');
  
  let titleIndex = 0;
  for (const word of filenameWords) {
    let found = false;
    for (let i = titleIndex; i < titleWords.length; i++) {
      if (titleWords[i] === word || titleWords[i].includes(word)) {
        titleIndex = i + 1;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  
  return true;
}

// Find best match for a filename
function findBestMatch(filename, titles) {
  const convertedTitle = convertFilenameToTitle(filename);
  console.log(`\n🔍 Matching: "${filename}" -> "${convertedTitle}"`);
  
  // First pass: Look for exact or special matches
  for (const title of titles) {
    if (title.title_name_en && checkSpecialMatch(convertedTitle, title.title_name_en)) {
      console.log(`  ✅ Matched with: "${title.title_name_en}"`);
      return {
        title,
        matchType: 'exact',
        matchedField: 'title_name_en'
      };
    }
  }
  
  // Second pass: Fuzzy matching
  let bestMatch = null;
  let bestScore = 0;
  
  for (const title of titles) {
    if (title.title_name_en) {
      const score = calculateSimilarity(convertedTitle, title.title_name_en);
      if (score > bestScore && score >= 70) {
        bestScore = score;
        bestMatch = {
          title,
          matchType: 'fuzzy',
          score: score,
          matchedField: 'title_name_en'
        };
      }
    }
  }
  
  if (bestMatch) {
    console.log(`  🔄 Fuzzy matched (${bestMatch.score.toFixed(1)}%): "${bestMatch.title.title_name_en}"`);
  } else {
    console.log(`  ❌ No match found`);
  }
  
  return bestMatch;
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeForComparison(str1);
  const norm2 = normalizeForComparison(str2);
  
  if (norm1 === norm2) return 100;
  
  // Calculate word-based similarity
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  let matchedWords = 0;
  for (const word1 of words1) {
    if (words2.some(w2 => w2 === word1 || w2.includes(word1) || word1.includes(w2))) {
      matchedWords++;
    }
  }
  
  const wordScore = (matchedWords / Math.max(words1.length, words2.length)) * 100;
  
  // Calculate character-based similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const charScore = ((maxLen - distance) / maxLen) * 100;
  
  // Weighted average
  return (wordScore * 0.7 + charScore * 0.3);
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

async function main() {
  try {
    console.log('🚀 Starting image-title matching process...');
    
    // Check for local titles file
    const csvFile = 'my_titles.csv';
    const jsonFile = 'my_titles.json';
    
    let titles = null;
    
    if (fs.existsSync(csvFile)) {
      console.log(`✅ Loading titles from ${csvFile}...`);
      titles = parseCSV(fs.readFileSync(csvFile, 'utf8'));
    } else if (fs.existsSync(jsonFile)) {
      console.log(`✅ Loading titles from ${jsonFile}...`);
      titles = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    } else {
      console.log('❌ No titles file found!');
      console.log('\n📋 Please create one of these files:');
      console.log('  - my_titles.csv (exported from Supabase)');
      console.log('  - my_titles.json');
      
      // Create example with your provided titles
      const exampleTitles = [
        {
          "title_id": "uuid-1",
          "title_name_en": "The Fallen Duke & the Knight Who Hated Him",
          "title_name_kr": null
        },
        {
          "title_id": "uuid-2",
          "title_name_en": "Stand Up, Now!",
          "title_name_kr": null
        },
        {
          "title_id": "uuid-3",
          "title_name_en": "Werewolves Going Crazy Over Me",
          "title_name_kr": null
        },
        {
          "title_id": "uuid-4",
          "title_name_en": "Even If...",
          "title_name_kr": null
        },
        {
          "title_id": "uuid-5",
          "title_name_en": "Goodbye, Dieting!",
          "title_name_kr": null
        },
        {
          "title_id": "uuid-6",
          "title_name_en": "Juliet, We're Not in Kansas Anymore!",
          "title_name_kr": null
        }
      ];
      
      fs.writeFileSync('example_titles.json', JSON.stringify(exampleTitles, null, 2));
      console.log('✅ Created example_titles.json with sample data');
      return;
    }
    
    console.log(`📊 Loaded ${titles.length} titles`);
    
    // Process images
    await processImages(titles);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

async function processImages(titles) {
  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
      return;
    }
    
    // Get all PNG files
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.png') && file !== 'blank.png')
      .sort();
    
    console.log(`\n📊 Found ${imageFiles.length} image files`);
    
    // Match images to titles
    console.log('\n🔄 Starting matching process...');
    const matches = [];
    const unmatched = [];
    
    for (const imageFile of imageFiles) {
      const match = findBestMatch(imageFile, titles);
      
      if (match) {
        matches.push({
          filename: imageFile,
          title: match.title,
          matchType: match.matchType,
          score: match.score
        });
      } else {
        unmatched.push(imageFile);
      }
    }
    
    // Summary
    console.log('\n📊 MATCHING SUMMARY:');
    console.log(`✅ Matched: ${matches.length} images`);
    console.log(`❌ Unmatched: ${unmatched.length} images`);
    
    // Find titles without matches
    const matchedTitleIds = new Set(matches.map(m => m.title.title_id));
    const titlesWithoutImages = titles.filter(t => !matchedTitleIds.has(t.title_id));
    
    console.log(`📷 Titles without images: ${titlesWithoutImages.length}`);
    
    // Create detailed unmatched report
    if (unmatched.length > 0 || titlesWithoutImages.length > 0) {
      createUnmatchedReport(unmatched, titlesWithoutImages);
    }
    
    // Check storage bucket
    console.log('\n📁 Checking storage bucket...');
    const { error: bucketError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.log(`⚠️  Bucket '${BUCKET_NAME}' not accessible`);
      console.log('Please create it in Supabase Dashboard → Storage');
      
      // Still generate the mapping file
      generateMappingFile(matches);
      return;
    }
    
    // Upload images
    console.log('\n⬆️  Starting upload process...');
    let uploadCount = 0;
    const results = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const progress = `[${i + 1}/${matches.length}]`;
      
      try {
        console.log(`${progress} Uploading: ${match.filename}`);
        
        // Read image
        const imagePath = path.join(IMAGES_DIR, match.filename);
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Create filename using title_id
        const uniqueFileName = `${match.title.title_id}.png`;
        
        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uniqueFileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (error) {
          console.error(`  ❌ Upload failed: ${error.message}`);
          continue;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uniqueFileName);
        
        results.push({
          title_id: match.title.title_id,
          title_name: match.title.title_name_en,
          original_filename: match.filename,
          storage_filename: uniqueFileName,
          public_url: urlData.publicUrl
        });
        
        uploadCount++;
        console.log(`  ✅ Success! URL: ${urlData.publicUrl}`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
    
    // Generate results
    console.log(`\n✅ Upload complete! ${uploadCount}/${matches.length} successful`);
    
    // Save results
    fs.writeFileSync('upload_results.json', JSON.stringify(results, null, 2));
    
    // Generate SQL update statements
    const sqlStatements = results.map(r => 
      `UPDATE titles SET title_image = '${r.public_url}' WHERE title_id = '${r.title_id}';`
    );
    fs.writeFileSync('update_titles.sql', sqlStatements.join('\n'));
    
    console.log('\n📁 Generated files:');
    console.log('  - upload_results.json (complete mapping)');
    console.log('  - update_titles.sql (SQL update statements)');
    
  } catch (error) {
    console.error('❌ Error in processing:', error);
  }
}

function generateMappingFile(matches) {
  const mapping = matches.map(m => ({
    filename: m.filename,
    title_id: m.title.title_id,
    title_name: m.title.title_name_en,
    match_type: m.matchType,
    match_score: m.score
  }));
  
  fs.writeFileSync('image_title_mapping.json', JSON.stringify(mapping, null, 2));
  console.log('\n✅ Created image_title_mapping.json');
  console.log('You can review this file and upload images manually if needed.');
}

function createUnmatchedReport(unmatchedFiles, titlesWithoutImages) {
  console.log('\n📝 Creating unmatched report...');
  
  // Create detailed report
  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      unmatched_files: unmatchedFiles.length,
      titles_without_images: titlesWithoutImages.length
    },
    unmatched_files: unmatchedFiles.map(file => ({
      filename: file,
      converted_title: convertFilenameToTitle(file)
    })),
    titles_without_images: titlesWithoutImages.map(title => ({
      title_id: title.title_id,
      title_name_en: title.title_name_en,
      title_name_kr: title.title_name_kr
    }))
  };
  
  // Save JSON report
  fs.writeFileSync('unmatched_report.json', JSON.stringify(report, null, 2));
  
  // Create human-readable text report
  let textReport = 'UNMATCHED ITEMS REPORT\n';
  textReport += '======================\n\n';
  textReport += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  textReport += 'UNMATCHED IMAGE FILES\n';
  textReport += '---------------------\n';
  if (unmatchedFiles.length > 0) {
    unmatchedFiles.forEach((file, i) => {
      textReport += `${i + 1}. ${file}\n`;
      textReport += `   Converted: "${convertFilenameToTitle(file)}"\n\n`;
    });
  } else {
    textReport += 'None - all images were matched!\n\n';
  }
  
  textReport += '\nTITLES WITHOUT IMAGES\n';
  textReport += '---------------------\n';
  if (titlesWithoutImages.length > 0) {
    titlesWithoutImages.forEach((title, i) => {
      textReport += `${i + 1}. ${title.title_name_en || title.title_name_kr}\n`;
      textReport += `   ID: ${title.title_id}\n`;
      if (title.title_name_kr) {
        textReport += `   Korean: ${title.title_name_kr}\n`;
      }
      textReport += '\n';
    });
  } else {
    textReport += 'None - all titles have images!\n';
  }
  
  fs.writeFileSync('unmatched_report.txt', textReport);
  
  // Create CSV for easy import to spreadsheet
  let csvContent = 'Type,ID,English Title,Korean Title,Filename,Converted Title\n';
  
  // Add unmatched files
  unmatchedFiles.forEach(file => {
    csvContent += `"Unmatched File","","","","${file}","${convertFilenameToTitle(file)}"\n`;
  });
  
  // Add titles without images
  titlesWithoutImages.forEach(title => {
    csvContent += `"Title Without Image","${title.title_id}","${title.title_name_en || ''}","${title.title_name_kr || ''}","",""\n`;
  });
  
  fs.writeFileSync('unmatched_report.csv', csvContent);
  
  console.log('\n📄 Unmatched reports created:');
  console.log('  - unmatched_report.json (detailed JSON format)');
  console.log('  - unmatched_report.txt (human-readable format)');
  console.log('  - unmatched_report.csv (for spreadsheet import)');
  
  // Display summary in console
  if (unmatchedFiles.length > 0) {
    console.log('\n❌ Unmatched image files:');
    unmatchedFiles.slice(0, 5).forEach(f => {
      console.log(`  - ${f} → "${convertFilenameToTitle(f)}"`);
    });
    if (unmatchedFiles.length > 5) {
      console.log(`  ... and ${unmatchedFiles.length - 5} more`);
    }
  }
  
  if (titlesWithoutImages.length > 0) {
    console.log('\n📷 Titles without images:');
    titlesWithoutImages.slice(0, 5).forEach(t => {
      console.log(`  - ${t.title_name_en || t.title_name_kr} (ID: ${t.title_id})`);
    });
    if (titlesWithoutImages.length > 5) {
      console.log(`  ... and ${titlesWithoutImages.length - 5} more`);
    }
  }
}

// Run the script
main();
