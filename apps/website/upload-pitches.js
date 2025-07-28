#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Fuzzy string matching function
function calculateSimilarity(str1, str2) {
  // Normalize strings: lowercase, remove special characters, trim
  const normalize = (str) => str.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // If exact match after normalization
  if (s1 === s2) return 1.0;
  
  // Levenshtein distance calculation
  const matrix = [];
  const len1 = s1.length;
  const len2 = s2.length;
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
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
  
  const maxLen = Math.max(len1, len2);
  const similarity = (maxLen - matrix[len2][len1]) / maxLen;
  
  // Bonus for word order matches
  const words1 = s1.split(' ').filter(w => w.length > 2);
  const words2 = s2.split(' ').filter(w => w.length > 2);
  let wordMatches = 0;
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        wordMatches++;
        break;
      }
    }
  }
  
  const wordBonus = words1.length > 0 ? (wordMatches / words1.length) * 0.2 : 0;
  
  return Math.min(1.0, similarity + wordBonus);
}

// Clean filename to get title
function cleanFilename(filename) {
  return filename
    .replace('.pdf', '')
    .replace(/_manta$/i, '')
    .replace(/_RIDI$/i, '')
    .replace(/_Deck$/i, '')
    .replace(/_Wever$/i, '')
    .replace(/[_]/g, ' ')
    .trim();
}

async function uploadPitches() {
  try {
    console.log('🚀 Starting PDF pitch upload and matching process...\n');
    
    // Get list of PDF files
    const pitchesDir = path.join(__dirname, '../../pitches');
    const pdfFiles = fs.readdirSync(pitchesDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .sort();
    
    console.log(`📁 Found ${pdfFiles.length} PDF files in pitches directory`);
    console.log('📋 PDF files to process:');
    pdfFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');
    
    // Get all titles from database
    console.log('🔍 Fetching titles from database...');
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, pitch');
    
    if (titlesError) {
      throw new Error(`Failed to fetch titles: ${titlesError.message}`);
    }
    
    console.log(`📊 Found ${titles.length} titles in database\n`);
    
    // Process each PDF file
    const results = {
      totalPdfs: pdfFiles.length,
      uploaded: 0,
      matched: 0,
      errors: 0,
      matches: []
    };
    
    for (let i = 0; i < pdfFiles.length; i++) {
      const filename = pdfFiles[i];
      const cleanTitle = cleanFilename(filename);
      
      console.log(`\n📄 Processing ${i + 1}/${pdfFiles.length}: ${filename}`);
      console.log(`   Cleaned title: "${cleanTitle}"`);
      
      try {
        // Read PDF file
        const filePath = path.join(pitchesDir, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
        
        console.log(`   File size: ${fileSize}MB`);
        
        // Find best matching title
        let bestMatch = null;
        let bestScore = 0;
        let allMatches = [];
        
        for (const title of titles) {
          const titleEn = title.title_name_en || '';
          const titleKr = title.title_name_kr || '';
          
          const scoreEn = calculateSimilarity(cleanTitle, titleEn);
          const scoreKr = calculateSimilarity(cleanTitle, titleKr);
          const maxScore = Math.max(scoreEn, scoreKr);
          
          allMatches.push({
            title_id: title.title_id,
            title_name_en: titleEn,
            title_name_kr: titleKr,
            score: maxScore,
            scoreEn,
            scoreKr
          });
          
          if (maxScore > bestScore) {
            bestScore = maxScore;
            bestMatch = {
              ...title,
              score: maxScore,
              scoreEn,
              scoreKr
            };
          }
        }
        
        // Sort all matches by score for logging
        allMatches.sort((a, b) => b.score - a.score);
        
        console.log(`   🎯 Best match (${(bestScore * 100).toFixed(1)}%): "${bestMatch.title_name_en || bestMatch.title_name_kr}"`);
        console.log(`   📊 Top 3 candidates:`);
        allMatches.slice(0, 3).forEach((match, idx) => {
          console.log(`      ${idx + 1}. ${(match.score * 100).toFixed(1)}% - "${match.title_name_en || match.title_name_kr}"`);
        });
        
        if (bestScore >= 0.8) {
          // Generate unique filename for storage
          const storageFilename = `${bestMatch.title_id}/pitch.pdf`;
          
          console.log(`   ⬆️  Uploading to: ${storageFilename}`);
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pitch-pdfs')
            .upload(storageFilename, fileBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });
          
          if (uploadError) {
            console.log(`   ❌ Upload failed: ${uploadError.message}`);
            results.errors++;
            continue;
          }
          
          console.log(`   ✅ Upload successful: ${uploadData.path}`);
          results.uploaded++;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('pitch-pdfs')
            .getPublicUrl(storageFilename);
          
          const pdfUrl = urlData.publicUrl;
          console.log(`   🔗 PDF URL: ${pdfUrl}`);
          
          // Update title's pitch column
          const { error: updateError } = await supabase
            .from('titles')
            .update({ pitch: pdfUrl })
            .eq('title_id', bestMatch.title_id);
          
          if (updateError) {
            console.log(`   ❌ Database update failed: ${updateError.message}`);
            results.errors++;
            continue;
          }
          
          console.log(`   💾 Database updated successfully`);
          results.matched++;
          
          results.matches.push({
            filename,
            cleanTitle,
            matchedTitle: bestMatch.title_name_en || bestMatch.title_name_kr,
            titleId: bestMatch.title_id,
            score: bestScore,
            pdfUrl
          });
          
        } else {
          console.log(`   ⚠️  Skipped: Match score ${(bestScore * 100).toFixed(1)}% is below 80% threshold`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing ${filename}: ${error.message}`);
        results.errors++;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`📁 Total PDF files processed: ${results.totalPdfs}`);
    console.log(`⬆️  Successfully uploaded: ${results.uploaded}`);
    console.log(`🎯 Successfully matched: ${results.matched}`);
    console.log(`❌ Errors encountered: ${results.errors}`);
    console.log(`📈 Success rate: ${((results.matched / results.totalPdfs) * 100).toFixed(1)}%`);
    
    if (results.matches.length > 0) {
      console.log('\n📋 SUCCESSFUL MATCHES:');
      console.log('-'.repeat(80));
      results.matches.forEach((match, index) => {
        console.log(`${index + 1}. "${match.filename}"`);
        console.log(`   → "${match.matchedTitle}" (${(match.score * 100).toFixed(1)}%)`);
        console.log(`   → Title ID: ${match.titleId}`);
        console.log(`   → PDF URL: ${match.pdfUrl}`);
        console.log('');
      });
    }
    
    const unmatched = results.totalPdfs - results.matched;
    if (unmatched > 0) {
      console.log(`⚠️  ${unmatched} PDFs were not matched (similarity < 80%)`);
      console.log('   These may need manual review and upload');
    }
    
    console.log('\n✅ Process completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
uploadPitches();