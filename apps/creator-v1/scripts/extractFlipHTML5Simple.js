#!/usr/bin/env node

/**
 * Simple FlipHTML5 Data Extractor
 * 
 * This script attempts to extract data using direct HTTP requests
 * and looks for FlipHTML5 API endpoints or data structures
 * 
 * Usage:
 * node extractFlipHTML5Simple.js [--dry-run] [--output=data.json]
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const PUBLICATION_ID = 'ohjyz';
const BOOK_ID = 'lczp';
const START_PAGE = 10;
const END_PAGE = 85;

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'fliphtml5_simple_data.json';

console.log('🔍 Simple FlipHTML5 Data Extractor');
console.log(`📖 Publication ID: ${PUBLICATION_ID}`);
console.log(`📚 Book ID: ${BOOK_ID}`);
console.log(`📄 Target pages: ${START_PAGE}-${END_PAGE}`);
console.log(`💾 Output file: ${outputFile}`);
console.log(`🧪 Dry run: ${isDryRun ? 'YES' : 'NO'}`);
console.log('');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/`
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function tryFlipHTML5APIs() {
  const attempts = [];
  
  // Common FlipHTML5 API endpoints to try
  const apiEndpoints = [
    `https://online.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/`,
    `https://online.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/pages/`,
    `https://online.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/content/`,
    `https://api.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/`,
    `https://service.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/`,
    `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/mobile/javascript/config.js`,
    `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/mobile/1.json`,
    `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/search/searchdemo.xml`,
    `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/extfiles/links.json`
  ];
  
  console.log('🔍 Trying FlipHTML5 API endpoints...');
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`📡 Trying: ${endpoint}`);
      const response = await makeRequest(endpoint);
      
      attempts.push({
        url: endpoint,
        statusCode: response.statusCode,
        success: response.statusCode >= 200 && response.statusCode < 300,
        dataLength: response.data.length,
        contentType: response.headers['content-type']
      });
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`✅ Success! Status: ${response.statusCode}, Size: ${response.data.length} bytes`);
        
        // Try to parse JSON
        try {
          const jsonData = JSON.parse(response.data);
          attempts[attempts.length - 1].parsedData = jsonData;
          console.log(`📊 JSON parsed successfully:`, Object.keys(jsonData));
        } catch (e) {
          // Not JSON, try to extract text patterns
          console.log(`📝 Non-JSON response, analyzing text...`);
          attempts[attempts.length - 1].textSample = response.data.substring(0, 500);
        }
      } else {
        console.log(`❌ Failed: ${response.statusCode}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      attempts.push({
        url: endpoint,
        error: error.message
      });
    }
  }
  
  return attempts;
}

async function tryPageSpecificAPIs() {
  const pageAttempts = [];
  
  // Try page-specific endpoints for a few sample pages
  const samplePages = [10, 15, 20, 25];
  
  console.log('\n🔍 Trying page-specific endpoints...');
  
  for (const pageNum of samplePages) {
    const pageEndpoints = [
      `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/mobile/${pageNum}.json`,
      `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/large/${pageNum}.json`,
      `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/files/page${pageNum}.json`,
      `https://online.fliphtml5.com/api/book/${PUBLICATION_ID}/${BOOK_ID}/page/${pageNum}/`,
    ];
    
    for (const endpoint of pageEndpoints) {
      try {
        console.log(`📄 Page ${pageNum}: ${endpoint}`);
        const response = await makeRequest(endpoint);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          console.log(`✅ Page ${pageNum} success!`);
          
          const attempt = {
            page: pageNum,
            url: endpoint,
            statusCode: response.statusCode,
            dataLength: response.data.length
          };
          
          try {
            const jsonData = JSON.parse(response.data);
            attempt.parsedData = jsonData;
            console.log(`📊 Page ${pageNum} JSON keys:`, Object.keys(jsonData));
          } catch (e) {
            attempt.textSample = response.data.substring(0, 200);
          }
          
          pageAttempts.push(attempt);
          break; // Found working endpoint for this page
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return pageAttempts;
}

async function extractStructuredData(attempts, pageAttempts) {
  const structuredData = {
    titles: [],
    metadata: {},
    pages: []
  };
  
  // Process successful API responses
  const successfulAttempts = attempts.filter(a => a.parsedData);
  
  for (const attempt of successfulAttempts) {
    const data = attempt.parsedData;
    
    // Look for common data structures
    if (data.pages) {
      structuredData.pages = data.pages;
    }
    
    if (data.titles || data.content) {
      const titles = data.titles || data.content;
      if (Array.isArray(titles)) {
        structuredData.titles.push(...titles);
      }
    }
    
    // Extract metadata
    const metadataFields = ['title', 'author', 'description', 'category', 'tags', 'language'];
    metadataFields.forEach(field => {
      if (data[field]) {
        structuredData.metadata[field] = data[field];
      }
    });
  }
  
  // Process page-specific data
  for (const pageAttempt of pageAttempts) {
    if (pageAttempt.parsedData) {
      const pageData = {
        page: pageAttempt.page,
        url: pageAttempt.url,
        content: pageAttempt.parsedData
      };
      
      // Extract titles from page content
      if (pageAttempt.parsedData.text) {
        const titleMatches = pageAttempt.parsedData.text.match(/[A-Z][^.!?]*[.!?]?/g);
        if (titleMatches) {
          titleMatches.forEach(match => {
            if (match.length > 5 && match.length < 100) {
              structuredData.titles.push({
                text: match.trim(),
                page: pageAttempt.page,
                source: 'page_extraction'
              });
            }
          });
        }
      }
      
      structuredData.pages.push(pageData);
    }
  }
  
  return structuredData;
}

async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting FlipHTML5 data extraction...\n');
    
    // Try general API endpoints
    const apiAttempts = await tryFlipHTML5APIs();
    
    // Try page-specific endpoints
    const pageAttempts = await tryPageSpecificAPIs();
    
    // Extract structured data from successful responses
    const structuredData = await extractStructuredData(apiAttempts, pageAttempts);
    
    // Create final output
    const output = {
      extractedAt: new Date().toISOString(),
      source: `https://online.fliphtml5.com/${PUBLICATION_ID}/${BOOK_ID}/`,
      targetPages: `${START_PAGE}-${END_PAGE}`,
      method: 'api_exploration',
      apiAttempts: apiAttempts,
      pageAttempts: pageAttempts,
      structuredData: structuredData,
      summary: {
        successfulAPIEndpoints: apiAttempts.filter(a => a.success).length,
        totalAPIAttempts: apiAttempts.length,
        successfulPageExtractions: pageAttempts.length,
        titlesFound: structuredData.titles.length,
        pagesProcessed: structuredData.pages.length,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    // Display summary
    console.log('\n📊 EXTRACTION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`🔗 Successful API endpoints: ${output.summary.successfulAPIEndpoints}/${output.summary.totalAPIAttempts}`);
    console.log(`📄 Page extractions: ${output.summary.successfulPageExtractions}`);
    console.log(`🎯 Titles found: ${output.summary.titlesFound}`);
    console.log(`📚 Pages processed: ${output.summary.pagesProcessed}`);
    console.log(`⏱️  Processing time: ${(output.summary.processingTimeMs / 1000).toFixed(1)}s`);
    
    // Show successful endpoints
    const successfulEndpoints = apiAttempts.filter(a => a.success);
    if (successfulEndpoints.length > 0) {
      console.log('\n✅ SUCCESSFUL ENDPOINTS:');
      successfulEndpoints.forEach(endpoint => {
        console.log(`  ${endpoint.url} (${endpoint.statusCode})`);
      });
    }
    
    // Save results
    if (!isDryRun) {
      await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n💾 Data saved to: ${path.resolve(outputFile)}`);
    } else {
      console.log('\n🧪 Dry run mode - no file saved');
      if (structuredData.titles.length > 0) {
        console.log('\n📝 Sample titles found:');
        structuredData.titles.slice(0, 5).forEach((title, i) => {
          console.log(`  ${i + 1}. ${title.text || title}`);
        });
      }
    }
    
    console.log('\n🎉 Extraction completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();