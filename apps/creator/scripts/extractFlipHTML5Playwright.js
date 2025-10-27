#!/usr/bin/env node

/**
 * FlipHTML5 Data Extractor using Playwright (lighter alternative)
 * 
 * This script uses a different approach to extract data from FlipHTML5
 * Target: https://online.fliphtml5.com/ohjyz/lczp/ (pages 10-85)
 * 
 * Usage:
 * node extractFlipHTML5Playwright.js [--dry-run] [--start=10] [--end=15]
 */

const https = require('https');
const fs = require('fs').promises;
const { execSync } = require('child_process');

// Configuration
const BASE_URL = 'https://online.fliphtml5.com/ohjyz/lczp/';
const DEFAULT_START_PAGE = 10;
const DEFAULT_END_PAGE = 15; // Smaller default range for testing

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const startPage = parseInt(args.find(arg => arg.startsWith('--start='))?.split('=')[1]) || DEFAULT_START_PAGE;
const endPage = parseInt(args.find(arg => arg.startsWith('--end='))?.split('=')[1]) || DEFAULT_END_PAGE;

console.log('🚀 FlipHTML5 Data Extractor (Lightweight)');
console.log(`📖 Target URL: ${BASE_URL}`);
console.log(`📄 Pages: ${startPage}-${endPage}`);
console.log(`🧪 Dry run: ${isDryRun ? 'YES' : 'NO'}`);
console.log('');

async function tryDirectPageAccess() {
  console.log('🔍 Attempting direct page content extraction...');
  
  const results = [];
  
  for (let page = startPage; page <= endPage; page++) {
    try {
      console.log(`📖 Processing page ${page}...`);
      
      const pageUrl = `${BASE_URL}#p=${page}`;
      
      // Try to extract page content using curl (if available)
      try {
        const curlCommand = `curl -s -L "${pageUrl}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"`;
        const htmlContent = execSync(curlCommand, { encoding: 'utf8', timeout: 10000 });
        
        if (htmlContent && htmlContent.length > 1000) {
          // Extract potential title data from HTML
          const titleMatches = htmlContent.match(/title[^>]*>([^<]+)</gi) || [];
          const textMatches = htmlContent.match(/>[^<]{10,100}</g) || [];
          
          const pageData = {
            page: page,
            url: pageUrl,
            timestamp: new Date().toISOString(),
            htmlLength: htmlContent.length,
            potentialTitles: titleMatches.map(m => m.replace(/^[^>]*>|<.*$/g, '').trim()),
            textContent: textMatches
              .map(m => m.replace(/^>/, '').trim())
              .filter(t => t.length > 10 && t.length < 100)
              .slice(0, 10) // Limit to first 10 matches
          };
          
          results.push(pageData);
          console.log(`✅ Page ${page}: Found ${pageData.potentialTitles.length} title candidates`);
        } else {
          console.log(`⚠️  Page ${page}: Limited content retrieved`);
          results.push({
            page: page,
            url: pageUrl,
            error: 'Limited content',
            timestamp: new Date().toISOString()
          });
        }
      } catch (curlError) {
        console.log(`❌ Page ${page}: Curl failed - ${curlError.message}`);
        results.push({
          page: page,
          url: pageUrl,
          error: curlError.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Add delay between requests
      if (page < endPage) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ Error processing page ${page}:`, error.message);
      results.push({
        page: page,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}

async function tryAlternativeApproach() {
  console.log('\n🔄 Trying alternative data discovery...');
  
  // Try to find FlipHTML5's JavaScript config or data files
  const potentialDataUrls = [
    `https://online.fliphtml5.com/ohjyz/lczp/javascript/config.js`,
    `https://online.fliphtml5.com/ohjyz/lczp/files/mobile/javascript/config.js`,
    `https://online.fliphtml5.com/ohjyz/lczp/files/basic-html/page1.html`,
    `https://online.fliphtml5.com/ohjyz/lczp/files/search/searchdemo.xml`
  ];
  
  const dataResults = [];
  
  for (const url of potentialDataUrls) {
    try {
      console.log(`🔗 Trying: ${url}`);
      const curlCommand = `curl -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"`;
      const content = execSync(curlCommand, { encoding: 'utf8', timeout: 5000 });
      
      if (content && content.length > 100) {
        console.log(`✅ Found data: ${content.length} characters`);
        dataResults.push({
          url: url,
          contentLength: content.length,
          sample: content.substring(0, 200),
          timestamp: new Date().toISOString()
        });
        
        // If it looks like JSON, try to parse it
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          try {
            const jsonData = JSON.parse(content);
            dataResults[dataResults.length - 1].parsedData = jsonData;
            console.log(`📊 JSON parsed successfully`);
          } catch (e) {
            console.log(`⚠️  Content looks like JSON but failed to parse`);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  return dataResults;
}

function extractTitlesFromContent(results) {
  const allTitles = new Set();
  
  results.forEach(result => {
    if (result.potentialTitles) {
      result.potentialTitles.forEach(title => {
        if (title && title.length > 3 && title.length < 100) {
          allTitles.add(title.trim());
        }
      });
    }
    
    if (result.textContent) {
      result.textContent.forEach(text => {
        // Look for title-like patterns
        if (text.match(/^[A-Z][a-z].*[a-z]$/)) {
          allTitles.add(text.trim());
        }
      });
    }
  });
  
  return Array.from(allTitles).map(title => ({ title, source: 'lightweight_extraction' }));
}

async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting lightweight FlipHTML5 extraction...\n');
    
    // Try direct page access
    const pageResults = await tryDirectPageAccess();
    
    // Try alternative approaches
    const dataResults = await tryAlternativeApproach();
    
    // Extract structured data
    const extractedTitles = extractTitlesFromContent(pageResults);
    
    // Create output
    const output = {
      extractedAt: new Date().toISOString(),
      source: BASE_URL,
      method: 'lightweight_curl_extraction',
      pageRange: `${startPage}-${endPage}`,
      pageResults: pageResults,
      dataResults: dataResults,
      extractedTitles: extractedTitles,
      summary: {
        totalPages: pageResults.length,
        successfulPages: pageResults.filter(r => !r.error).length,
        failedPages: pageResults.filter(r => r.error).length,
        titlesFound: extractedTitles.length,
        dataSourcesFound: dataResults.length,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    // Display results
    console.log('\n📊 EXTRACTION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📄 Pages processed: ${output.summary.totalPages}`);
    console.log(`✅ Successful: ${output.summary.successfulPages}`);
    console.log(`❌ Failed: ${output.summary.failedPages}`);
    console.log(`🎯 Titles found: ${output.summary.titlesFound}`);
    console.log(`🔗 Data sources: ${output.summary.dataSourcesFound}`);
    console.log(`⏱️  Time: ${(output.summary.processingTimeMs / 1000).toFixed(1)}s`);
    
    if (extractedTitles.length > 0) {
      console.log('\n📝 Sample titles found:');
      extractedTitles.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.title}`);
      });
      if (extractedTitles.length > 10) {
        console.log(`  ... and ${extractedTitles.length - 10} more`);
      }
    }
    
    // Save results
    if (!isDryRun) {
      const outputFile = 'fliphtml5_lightweight_data.json';
      await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n💾 Data saved to: ${outputFile}`);
    } else {
      console.log('\n🧪 Dry run mode - no file saved');
    }
    
    console.log('\n🎉 Extraction completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();