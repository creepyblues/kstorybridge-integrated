#!/usr/bin/env node

/**
 * Generate SQL UPDATE statements to populate the keywords field 
 * in the titles table using extracted keyword data
 */

import fs from 'fs';
import path from 'path';

function escapeString(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function generateKeywordUpdateSQL(keywordResults) {
  const updates = [];
  
  // Add column creation if needed
  updates.push(`-- Step 1: Add keywords column to titles table if it doesn't exist`);
  updates.push(`DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'keywords') THEN
        ALTER TABLE titles ADD COLUMN keywords text[];
        COMMENT ON COLUMN titles.keywords IS 'Extracted keywords for content discovery and search';
    END IF;
END $$;`);
  
  updates.push('');
  updates.push('-- Step 2: Update keywords field with extracted keyword data');
  updates.push('');
  
  keywordResults.results.forEach((result, index) => {
    const { title_id, keyword_summary, title_name_kr, title_name_en } = result;
    
    if (!title_id || !keyword_summary || keyword_summary.length === 0) {
      updates.push(`-- Skipping ${title_name_kr} (${title_name_en}): No keywords extracted`);
      return;
    }
    
    // Clean and escape keywords
    const cleanKeywords = keyword_summary
      .filter(keyword => keyword && keyword.trim().length > 0)
      .map(keyword => `'${escapeString(keyword.trim())}'`)
      .join(', ');
    
    if (cleanKeywords.length === 0) {
      updates.push(`-- Skipping ${title_name_kr} (${title_name_en}): No valid keywords after cleaning`);
      return;
    }
    
    const comment = title_name_en ? `${title_name_kr} (${title_name_en})` : title_name_kr;
    updates.push(`-- ${comment} - ${keyword_summary.length} keywords`);
    updates.push(`UPDATE titles SET keywords = ARRAY[${cleanKeywords}] WHERE title_id = '${title_id}';`);
    updates.push('');
    
    // Add progress indicator every 25 updates
    if ((index + 1) % 25 === 0) {
      updates.push(`-- Progress: ${index + 1}/${keywordResults.results.length} titles updated`);
      updates.push('');
    }
  });
  
  // Add final statistics
  updates.push('-- Final verification query');
  updates.push('SELECT ');
  updates.push('  COUNT(*) as total_titles,');
  updates.push('  COUNT(keywords) as titles_with_keywords,');
  updates.push('  COUNT(keywords) * 100.0 / COUNT(*) as percentage_with_keywords,');
  updates.push('  AVG(array_length(keywords, 1)) as avg_keywords_per_title');
  updates.push('FROM titles;');
  
  return updates.join('\n');
}

async function main() {
  try {
    // Find the most recent keyword extraction results file
    const files = fs.readdirSync('./').filter(f => f.startsWith('keyword-extraction-results-'));
    if (files.length === 0) {
      console.error('❌ No keyword extraction results file found. Run keyword-extractor.js first.');
      process.exit(1);
    }
    
    const latestFile = files.sort().reverse()[0];
    console.log(`📄 Using keyword data from: ${latestFile}`);
    
    // Read the keyword extraction results
    const keywordData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    console.log(`📊 Processing ${keywordData.results.length} titles...`);
    
    // Generate SQL updates
    const sqlContent = generateKeywordUpdateSQL(keywordData);
    
    // Write to file
    const outputFile = 'update-keywords-complete.sql';
    fs.writeFileSync(outputFile, sqlContent);
    
    // Generate summary
    const validUpdates = keywordData.results.filter(r => 
      r.title_id && r.keyword_summary && r.keyword_summary.length > 0
    );
    
    console.log('\n📈 SQL GENERATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📚 Total titles processed: ${keywordData.results.length}`);
    console.log(`✅ Valid keyword updates: ${validUpdates.length}`);
    console.log(`⚠️  Titles without keywords: ${keywordData.results.length - validUpdates.length}`);
    console.log(`🔍 Total keywords to insert: ${keywordData.metadata.total_keywords_extracted}`);
    console.log(`💾 SQL file generated: ${outputFile}`);
    
    console.log('\n🚀 To apply these updates:');
    console.log(`   1. Review the generated SQL file: ${outputFile}`);
    console.log(`   2. Connect to your Supabase database`);
    console.log(`   3. Execute the SQL statements`);
    console.log(`   4. Run the verification query at the end`);
    
    console.log('\n⚡ Quick execution command for Supabase CLI:');
    console.log(`   supabase db reset && psql -h <host> -U <user> -d <database> -f ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error generating SQL updates:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}