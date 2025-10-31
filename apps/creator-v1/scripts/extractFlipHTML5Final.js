#!/usr/bin/env node

/**
 * Final FlipHTML5 Data Extractor
 * 
 * This script extracts and processes the structured data from FlipHTML5 config
 * and generates a comprehensive JSON file with title information
 * 
 * Usage:
 * node extractFlipHTML5Final.js [--dry-run] [--output=titles.json] [--pages=10-85]
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;

// Configuration
const CONFIG_URL = 'https://online.fliphtml5.com/ohjyz/lczp/javascript/config.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'webtoon_directory_2025.json';
const pageRange = args.find(arg => arg.startsWith('--pages='))?.split('=')[1] || '10-85';
const [startPage, endPage] = pageRange.split('-').map(Number);

console.log('🎯 Final FlipHTML5 Data Extractor');
console.log(`📄 Config URL: ${CONFIG_URL}`);
console.log(`📖 Target pages: ${startPage}-${endPage}`);
console.log(`💾 Output file: ${outputFile}`);
console.log(`🧪 Dry run: ${isDryRun ? 'YES' : 'NO'}`);
console.log('');

async function fetchConfigData() {
  try {
    console.log('📥 Fetching FlipHTML5 config...');
    const curlCommand = `curl -s -L "${CONFIG_URL}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"`;
    const configContent = execSync(curlCommand, { encoding: 'utf8', timeout: 15000 });
    
    console.log(`✅ Config fetched: ${configContent.length} characters`);
    return configContent;
  } catch (error) {
    throw new Error(`Failed to fetch config: ${error.message}`);
  }
}

function extractStructuredData(configContent) {
  console.log('🔍 Extracting structured data...');
  
  const extractedData = {
    metadata: {
      extractedAt: new Date().toISOString(),
      source: CONFIG_URL,
      configLength: configContent.length,
      targetPages: `${startPage}-${endPage}`
    },
    titles: [],
    pages: [],
    rawPatterns: {
      titleLike: [],
      authorLike: [],
      genreLike: [],
      urlLike: []
    }
  };
  
  // Extract title-like patterns
  console.log('📚 Extracting title patterns...');
  
  const titlePatterns = [
    // Look for quoted strings that could be titles (10-100 chars)
    /"([^"]{10,100})"/g,
    /'([^']{10,100})'/g,
    // Look for title: value patterns
    /title['"]\s*:\s*['"]([^'"]+)['"]/gi,
    // Look for name: value patterns
    /name['"]\s*:\s*['"]([^'"]+)['"]/gi,
    // Look for text between specific delimiters
    />\s*([A-Z][^<>{}\[\]]{5,80})\s*</g,
  ];
  
  titlePatterns.forEach((pattern, index) => {
    const matches = [...configContent.matchAll(pattern)];
    matches.forEach(match => {
      const text = match[1]?.trim();
      if (text && isLikelyTitle(text)) {
        extractedData.rawPatterns.titleLike.push({
          text: text,
          pattern: `title_pattern_${index}`,
          confidence: calculateTitleConfidence(text)
        });
      }
    });
  });
  
  // Extract author-like patterns
  console.log('👤 Extracting author patterns...');
  const authorPatterns = [
    /author['"]\s*:\s*['"]([^'"]+)['"]/gi,
    /creator['"]\s*:\s*['"]([^'"]+)['"]/gi,
    /writer['"]\s*:\s*['"]([^'"]+)['"]/gi,
    /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  authorPatterns.forEach(pattern => {
    const matches = [...configContent.matchAll(pattern)];
    matches.forEach(match => {
      const author = match[1]?.trim();
      if (author && author.length > 2 && author.length < 50) {
        extractedData.rawPatterns.authorLike.push(author);
      }
    });
  });
  
  // Extract genre-like patterns
  console.log('🏷️ Extracting genre patterns...');
  const genrePatterns = [
    /genre['"]\s*:\s*['"]([^'"]+)['"]/gi,
    /category['"]\s*:\s*['"]([^'"]+)['"]/gi,
    /type['"]\s*:\s*['"]([^'"]+)['"]/gi
  ];
  
  genrePatterns.forEach(pattern => {
    const matches = [...configContent.matchAll(pattern)];
    matches.forEach(match => {
      const genre = match[1]?.trim();
      if (genre && genre.length > 2 && genre.length < 30) {
        extractedData.rawPatterns.genreLike.push(genre);
      }
    });
  });
  
  // Look for page-specific data
  console.log('📄 Extracting page data...');
  for (let page = startPage; page <= Math.min(endPage, startPage + 20); page++) {
    const pagePatterns = [
      new RegExp(`page${page}['"\\s]*:[\\s]*['"]*([^'",\\]\\}]+)`, 'gi'),
      new RegExp(`"${page}"[\\s]*:[\\s]*[{\\[]([^\\}\\]]+)[}\\]]`, 'gi'),
      new RegExp(`p${page}['"\\s]*:[\\s]*['"]*([^'",\\]\\}]+)`, 'gi')
    ];
    
    let pageData = null;
    pagePatterns.forEach(pattern => {
      const matches = [...configContent.matchAll(pattern)];
      if (matches.length > 0 && !pageData) {
        pageData = {
          page: page,
          data: matches[0][1]?.trim(),
          pattern: pattern.source
        };
      }
    });
    
    if (pageData) {
      extractedData.pages.push(pageData);
    }
  }
  
  // Process and clean the extracted data
  console.log('🧹 Processing extracted data...');
  
  // Deduplicate and rank titles
  const titleMap = new Map();
  extractedData.rawPatterns.titleLike.forEach(item => {
    const key = item.text.toLowerCase().trim();
    if (!titleMap.has(key) || titleMap.get(key).confidence < item.confidence) {
      titleMap.set(key, item);
    }
  });
  
  // Convert to final title list and filter out obvious non-titles
  extractedData.titles = Array.from(titleMap.values())
    .filter(item => item.confidence > 0.3) // Filter by confidence
    .sort((a, b) => b.confidence - a.confidence)
    .map((item, index) => ({
      id: `title_${index + 1}`,
      title: item.text,
      confidence: item.confidence,
      pattern: item.pattern,
      source: 'fliphtml5_config_extraction'
    }));
  
  // Add summary statistics
  extractedData.summary = {
    totalRawTitlePatterns: extractedData.rawPatterns.titleLike.length,
    finalFilteredTitles: extractedData.titles.length,
    authorPatterns: extractedData.rawPatterns.authorLike.length,
    genrePatterns: extractedData.rawPatterns.genreLike.length,
    pageDataExtracted: extractedData.pages.length,
    highConfidenceTitles: extractedData.titles.filter(t => t.confidence > 0.7).length,
    mediumConfidenceTitles: extractedData.titles.filter(t => t.confidence > 0.5 && t.confidence <= 0.7).length,
    lowConfidenceTitles: extractedData.titles.filter(t => t.confidence <= 0.5).length
  };
  
  return extractedData;
}

function isLikelyTitle(text) {
  // Filter out common non-title strings
  const blacklist = [
    'sound setting', 'share it', 'video list', 'access restricted',
    'submit', 'verify', 'contact', 'the author', 'loading', 'error',
    'click here', 'read more', 'next page', 'previous', 'home',
    'search', 'menu', 'settings', 'help', 'about', 'login',
    'register', 'download', 'upload', 'save', 'cancel', 'ok',
    'yes', 'no', 'true', 'false', 'null', 'undefined'
  ];
  
  const lowerText = text.toLowerCase().trim();
  
  // Check blacklist
  if (blacklist.some(item => lowerText.includes(item))) {
    return false;
  }
  
  // Check for HTML/code-like content
  if (text.includes('<') || text.includes('>') || text.includes('{') || text.includes('}')) {
    return false;
  }
  
  // Check for URLs or file paths
  if (text.includes('http') || text.includes('www.') || text.includes('.com') || text.includes('.js')) {
    return false;
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(text)) {
    return false;
  }
  
  return true;
}

function calculateTitleConfidence(text) {
  let confidence = 0.5; // Base confidence
  
  // Positive indicators
  if (/^[A-Z]/.test(text)) confidence += 0.1; // Starts with capital
  if (/[a-z].*[a-z]/.test(text)) confidence += 0.1; // Has lowercase letters
  if (text.length > 15 && text.length < 60) confidence += 0.1; // Good length
  if (/\w+\s+\w+/.test(text)) confidence += 0.1; // Multiple words
  if (!/\d{4}/.test(text)) confidence += 0.05; // No years/dates
  
  // Webtoon-specific indicators
  if (/love|romance|heart|story|tale|adventure|magic|hero|demon|dragon|princess|knight|school|academy|high school|university/i.test(text)) {
    confidence += 0.2;
  }
  
  // Negative indicators
  if (text.length < 5) confidence -= 0.3;
  if (text.length > 100) confidence -= 0.2;
  if (/^\d+$/.test(text)) confidence -= 0.5; // Pure numbers
  if (/[<>{}[\]()=+]/.test(text)) confidence -= 0.3; // Code-like characters
  if (text.toLowerCase().includes('config')) confidence -= 0.4;
  if (text.toLowerCase().includes('setting')) confidence -= 0.3;
  
  return Math.max(0, Math.min(1, confidence));
}

async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting final FlipHTML5 extraction...\n');
    
    // Fetch config data
    const configContent = await fetchConfigData();
    
    // Extract structured data
    const extractedData = await extractStructuredData(configContent);
    
    // Display results
    console.log('\n📊 EXTRACTION RESULTS');
    console.log('=' .repeat(60));
    console.log(`📄 Config size: ${extractedData.metadata.configLength.toLocaleString()} characters`);
    console.log(`🎯 Raw title patterns found: ${extractedData.summary.totalRawTitlePatterns}`);
    console.log(`📚 Filtered titles: ${extractedData.summary.finalFilteredTitles}`);
    console.log(`⭐ High confidence: ${extractedData.summary.highConfidenceTitles}`);
    console.log(`🔸 Medium confidence: ${extractedData.summary.mediumConfidenceTitles}`);
    console.log(`🔹 Low confidence: ${extractedData.summary.lowConfidenceTitles}`);
    console.log(`👤 Author patterns: ${extractedData.summary.authorPatterns}`);
    console.log(`🏷️  Genre patterns: ${extractedData.summary.genrePatterns}`);
    console.log(`📄 Page data: ${extractedData.summary.pageDataExtracted}`);
    console.log(`⏱️  Processing time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    
    // Show sample titles by confidence
    if (extractedData.titles.length > 0) {
      console.log('\n📝 HIGH CONFIDENCE TITLES:');
      const highConfidence = extractedData.titles.filter(t => t.confidence > 0.7);
      highConfidence.slice(0, 10).forEach((title, i) => {
        console.log(`  ${i + 1}. ${title.title} (${title.confidence.toFixed(2)})`);
      });
      
      if (highConfidence.length === 0) {
        console.log('  (No high confidence titles found)');
        console.log('\n📝 MEDIUM CONFIDENCE TITLES:');
        const mediumConfidence = extractedData.titles.filter(t => t.confidence > 0.5);
        mediumConfidence.slice(0, 10).forEach((title, i) => {
          console.log(`  ${i + 1}. ${title.title} (${title.confidence.toFixed(2)})`);
        });
      }
    }
    
    // Show authors if found
    if (extractedData.rawPatterns.authorLike.length > 0) {
      console.log('\n👤 AUTHORS FOUND:');
      [...new Set(extractedData.rawPatterns.authorLike)].slice(0, 5).forEach((author, i) => {
        console.log(`  ${i + 1}. ${author}`);
      });
    }
    
    // Show genres if found
    if (extractedData.rawPatterns.genreLike.length > 0) {
      console.log('\n🏷️  GENRES FOUND:');
      [...new Set(extractedData.rawPatterns.genreLike)].slice(0, 5).forEach((genre, i) => {
        console.log(`  ${i + 1}. ${genre}`);
      });
    }
    
    // Save results
    if (!isDryRun) {
      await fs.writeFile(outputFile, JSON.stringify(extractedData, null, 2), 'utf8');
      console.log(`\n💾 Complete data saved to: ${outputFile}`);
      
      // Also save a simplified version for easy import
      const simplifiedData = {
        metadata: extractedData.metadata,
        summary: extractedData.summary,
        titles: extractedData.titles.map(t => ({
          title: t.title,
          confidence: t.confidence,
          source: t.source
        }))
      };
      
      const simpleFile = outputFile.replace('.json', '_simple.json');
      await fs.writeFile(simpleFile, JSON.stringify(simplifiedData, null, 2), 'utf8');
      console.log(`📄 Simplified data saved to: ${simpleFile}`);
    } else {
      console.log('\n🧪 Dry run mode - no files saved');
    }
    
    console.log('\n🎉 Extraction completed successfully!');
    
    if (!isDryRun) {
      console.log('\n💡 Next steps:');
      console.log('  1. Review the extracted titles in the JSON file');
      console.log('  2. Filter by confidence score as needed');
      console.log('  3. Import high-confidence titles into your database');
      console.log('  4. Manually verify and clean the data as needed');
    }
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();