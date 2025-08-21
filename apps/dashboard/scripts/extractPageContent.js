#!/usr/bin/env node

/**
 * FlipHTML5 Page Content Extractor
 * 
 * This script attempts to extract actual page content (titles, authors, etc.)
 * by looking for page-specific data files and content
 * 
 * Usage:
 * node extractPageContent.js [--dry-run] [--start=10] [--end=20]
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs').promises;

const BASE_URL = 'https://online.fliphtml5.com/ohjyz/lczp/';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const startPage = parseInt(args.find(arg => arg.startsWith('--start='))?.split('=')[1]) || 10;
const endPage = parseInt(args.find(arg => arg.startsWith('--end='))?.split('=')[1]) || 20;

console.log('📖 FlipHTML5 Page Content Extractor');
console.log(`📄 Target pages: ${startPage}-${endPage}`);
console.log(`🧪 Dry run: ${isDryRun ? 'YES' : 'NO'}`);
console.log('');

async function tryPageContentExtraction() {
  const results = [];
  
  console.log('🔍 Attempting to extract page content...');
  
  // Try various page content approaches
  const pageUrlPatterns = [
    // Direct page URLs
    (page) => `${BASE_URL}#p=${page}`,
    // Image-based approaches (often FlipHTML5 renders as images)
    (page) => `${BASE_URL}files/mobile/pages/${page}.jpg`,
    (page) => `${BASE_URL}files/large/pages/${page}.jpg`,
    (page) => `${BASE_URL}files/medium/pages/${page}.jpg`,
    // JSON data files
    (page) => `${BASE_URL}files/pageConfig${page}.json`,
    (page) => `${BASE_URL}mobile/javascript/page${page}.js`,
    // HTML files
    (page) => `${BASE_URL}files/basic-html/page${page}.html`,
    (page) => `${BASE_URL}files/mobile/page${page}.html`,
  ];
  
  for (let page = startPage; page <= endPage; page++) {
    console.log(`📄 Processing page ${page}...`);
    
    let pageData = {
      page: page,
      timestamp: new Date().toISOString(),
      foundContent: false,
      attempts: []
    };
    
    // Try each URL pattern for this page
    for (const [index, urlPattern] of pageUrlPatterns.entries()) {
      const url = urlPattern(page);
      
      try {
        console.log(`  🔗 Trying pattern ${index + 1}: ${url}`);
        
        const result = await makeHttpRequest(url);
        
        const attempt = {
          url: url,
          statusCode: result.statusCode,
          contentLength: result.data ? result.data.length : 0,
          contentType: result.headers['content-type'] || 'unknown'
        };
        
        if (result.statusCode >= 200 && result.statusCode < 300 && result.data.length > 100) {
          console.log(`    ✅ Success! ${result.data.length} bytes`);
          
          // Analyze the content
          const contentAnalysis = analyzePageContent(result.data, result.headers['content-type']);
          attempt.analysis = contentAnalysis;
          
          if (contentAnalysis.likelyTitles.length > 0) {
            pageData.foundContent = true;
            pageData.titles = contentAnalysis.likelyTitles;
            pageData.authors = contentAnalysis.likelyAuthors;
            pageData.metadata = contentAnalysis.metadata;
          }
          
          // If this looks like useful content, save a sample
          if (result.data.length > 500) {
            attempt.contentSample = result.data.substring(0, 1000);
          }
          
        } else {
          console.log(`    ❌ Failed: ${result.statusCode}`);
        }
        
        pageData.attempts.push(attempt);
        
        // If we found good content, stop trying other patterns for this page
        if (pageData.foundContent) {
          break;
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        pageData.attempts.push({
          url: url,
          error: error.message
        });
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    results.push(pageData);
    
    // Progress indicator
    const progress = ((page - startPage + 1) / (endPage - startPage + 1) * 100).toFixed(1);
    console.log(`📊 Page ${page} complete. Progress: ${progress}%`);
    
    // Delay between pages
    if (page < endPage) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': 'https://online.fliphtml5.com/ohjyz/lczp/'
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
    
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function analyzePageContent(content, contentType) {
  const analysis = {
    contentType: contentType,
    likelyTitles: [],
    likelyAuthors: [],
    metadata: {},
    patterns: {
      htmlTags: (content.match(/<[^>]+>/g) || []).length,
      jsonStructures: (content.match(/\{[^{}]*\}/g) || []).length,
      koreanText: (content.match(/[\u3131-\u3163\uAC00-\uD7A3]+/g) || []).length,
      urls: (content.match(/https?:\/\/[^\s'"]+/g) || []).length
    }
  };
  
  // If it's HTML content, extract text
  if (contentType && contentType.includes('html')) {
    // Extract title tags
    const titleMatches = content.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
    titleMatches.forEach(match => {
      const title = match.replace(/<[^>]+>/g, '').trim();
      if (title && title.length > 3 && title.length < 100) {
        analysis.likelyTitles.push({ text: title, source: 'html_title' });
      }
    });
    
    // Extract h1, h2, h3 headings
    const headingMatches = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
    headingMatches.forEach(match => {
      const heading = match.replace(/<[^>]+>/g, '').trim();
      if (heading && heading.length > 3 && heading.length < 100) {
        analysis.likelyTitles.push({ text: heading, source: 'html_heading' });
      }
    });
    
    // Extract text content
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Look for title-like patterns in text
    const titlePatterns = [
      /(?:^|\n)\s*([A-Z][^.!?\n]{10,80})\s*(?:\n|$)/g,
      /Title:\s*([^\n]{5,80})/gi,
      /제목:\s*([^\n]{5,80})/gi
    ];
    
    titlePatterns.forEach(pattern => {
      const matches = [...textContent.matchAll(pattern)];
      matches.forEach(match => {
        const title = match[1].trim();
        if (title && isLikelyTitle(title)) {
          analysis.likelyTitles.push({ text: title, source: 'text_pattern' });
        }
      });
    });
  }
  
  // If it's JSON, try to extract structured data
  if ((contentType && contentType.includes('json')) || content.trim().startsWith('{')) {
    try {
      const jsonData = JSON.parse(content);
      extractFromJSON(jsonData, analysis);
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // General text analysis for any content type
  const generalTitlePatterns = [
    /"([^"]{10,80})"/g,
    /'([^']{10,80})'/g,
    /title['":\s]+([^'",\n]{10,80})/gi,
    /name['":\s]+([^'",\n]{10,80})/gi
  ];
  
  generalTitlePatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const text = match[1].trim();
      if (text && isLikelyTitle(text)) {
        analysis.likelyTitles.push({ text: text, source: 'general_pattern' });
      }
    });
  });
  
  // Deduplicate titles
  const titleMap = new Map();
  analysis.likelyTitles.forEach(item => {
    const key = item.text.toLowerCase().trim();
    if (!titleMap.has(key)) {
      titleMap.set(key, item);
    }
  });
  analysis.likelyTitles = Array.from(titleMap.values());
  
  return analysis;
}

function extractFromJSON(jsonData, analysis) {
  function traverse(obj, path = '') {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.length > 5 && value.length < 100) {
          if (key.toLowerCase().includes('title') || key.toLowerCase().includes('name')) {
            if (isLikelyTitle(value)) {
              analysis.likelyTitles.push({ text: value, source: `json_${key}` });
            }
          } else if (key.toLowerCase().includes('author') || key.toLowerCase().includes('creator')) {
            analysis.likelyAuthors.push({ text: value, source: `json_${key}` });
          }
        } else if (typeof value === 'object') {
          traverse(value, currentPath);
        }
      }
    }
  }
  
  if (Array.isArray(jsonData)) {
    jsonData.forEach((item, index) => traverse(item, `[${index}]`));
  } else {
    traverse(jsonData);
  }
}

function isLikelyTitle(text) {
  const blacklist = [
    'sound setting', 'share it', 'video list', 'access restricted',
    'submit', 'verify', 'contact', 'loading', 'error', 'click here',
    'read more', 'next page', 'previous', 'home', 'search', 'menu',
    'settings', 'help', 'about', 'login', 'register', 'download',
    'upload', 'save', 'cancel', 'config', 'function', 'var ', 'const ',
    'return', 'if (', 'for (', 'while (', 'switch (', 'javascript',
    'html', 'css', 'http', 'www.', '.com', '.js', '.css', '.html'
  ];
  
  const lowerText = text.toLowerCase().trim();
  
  // Check blacklist
  if (blacklist.some(item => lowerText.includes(item))) {
    return false;
  }
  
  // Check for code-like content
  if (text.includes('{') || text.includes('}') || text.includes('(') || text.includes(')') || text.includes('[') || text.includes(']')) {
    return false;
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(text)) {
    return false;
  }
  
  // Check for reasonable title characteristics
  if (text.length < 5 || text.length > 100) {
    return false;
  }
  
  return true;
}

async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting page content extraction...\n');
    
    const results = await tryPageContentExtraction();
    
    // Process results
    const summary = {
      extractedAt: new Date().toISOString(),
      pageRange: `${startPage}-${endPage}`,
      totalPages: results.length,
      pagesWithContent: results.filter(r => r.foundContent).length,
      totalTitlesFound: results.reduce((sum, r) => sum + (r.titles?.length || 0), 0),
      totalAuthorsFound: results.reduce((sum, r) => sum + (r.authors?.length || 0), 0),
      processingTimeMs: Date.now() - startTime
    };
    
    const output = {
      summary,
      pages: results,
      allTitles: []
    };
    
    // Collect all unique titles
    const allTitlesMap = new Map();
    results.forEach(page => {
      if (page.titles) {
        page.titles.forEach(title => {
          const key = title.text.toLowerCase().trim();
          if (!allTitlesMap.has(key)) {
            allTitlesMap.set(key, {
              title: title.text,
              source: title.source,
              page: page.page,
              confidence: 0.8 // Default confidence for manually extracted titles
            });
          }
        });
      }
    });
    
    output.allTitles = Array.from(allTitlesMap.values());
    
    // Display results
    console.log('\n📊 EXTRACTION RESULTS');
    console.log('=' .repeat(50));
    console.log(`📄 Pages processed: ${summary.totalPages}`);
    console.log(`✅ Pages with content: ${summary.pagesWithContent}`);
    console.log(`🎯 Titles found: ${summary.totalTitlesFound}`);
    console.log(`👤 Authors found: ${summary.totalAuthorsFound}`);
    console.log(`📚 Unique titles: ${output.allTitles.length}`);
    console.log(`⏱️  Processing time: ${(summary.processingTimeMs / 1000).toFixed(1)}s`);
    
    // Show sample titles
    if (output.allTitles.length > 0) {
      console.log('\n📝 TITLES FOUND:');
      output.allTitles.slice(0, 15).forEach((title, i) => {
        console.log(`  ${i + 1}. ${title.title} (Page ${title.page})`);
      });
      if (output.allTitles.length > 15) {
        console.log(`  ... and ${output.allTitles.length - 15} more titles`);
      }
    }
    
    // Show pages with content
    const pagesWithContent = results.filter(r => r.foundContent);
    if (pagesWithContent.length > 0) {
      console.log('\n📖 PAGES WITH EXTRACTED CONTENT:');
      pagesWithContent.forEach(page => {
        console.log(`  Page ${page.page}: ${page.titles?.length || 0} titles, ${page.authors?.length || 0} authors`);
      });
    }
    
    // Save results
    if (!isDryRun) {
      const outputFile = 'fliphtml5_page_content.json';
      await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n💾 Results saved to: ${outputFile}`);
    } else {
      console.log('\n🧪 Dry run mode - no file saved');
    }
    
    console.log('\n🎉 Page content extraction completed!');
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();