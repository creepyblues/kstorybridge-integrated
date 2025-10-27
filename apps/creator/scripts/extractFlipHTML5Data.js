#!/usr/bin/env node

/**
 * FlipHTML5 Data Extractor
 * 
 * This script extracts structured data from FlipHTML5 publications
 * Target: https://online.fliphtml5.com/ohjyz/lczp/ (pages 10-85)
 * 
 * Usage:
 * node extractFlipHTML5Data.js [--dry-run] [--start=10] [--end=85] [--output=data.json]
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'https://online.fliphtml5.com/ohjyz/lczp/#p=';
const DEFAULT_START_PAGE = 10;
const DEFAULT_END_PAGE = 85;
const DEFAULT_OUTPUT_FILE = 'fliphtml5_titles_data.json';
const DELAY_BETWEEN_PAGES = 3000; // 3 seconds delay between pages
const PAGE_LOAD_TIMEOUT = 15000; // 15 seconds timeout for page load

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const startPage = parseInt(args.find(arg => arg.startsWith('--start='))?.split('=')[1]) || DEFAULT_START_PAGE;
const endPage = parseInt(args.find(arg => arg.startsWith('--end='))?.split('=')[1]) || DEFAULT_END_PAGE;
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || DEFAULT_OUTPUT_FILE;

console.log('🚀 FlipHTML5 Data Extractor Starting...');
console.log(`📖 Target URL: ${BASE_URL}[${startPage}-${endPage}]`);
console.log(`📄 Pages to process: ${endPage - startPage + 1}`);
console.log(`💾 Output file: ${outputFile}`);
console.log(`🧪 Dry run mode: ${isDryRun ? 'ENABLED' : 'DISABLED'}`);
console.log('');

async function extractPageData(page, pageNumber) {
  try {
    console.log(`📖 Processing page ${pageNumber}...`);
    
    // Wait for page to load completely
    await page.goto(`${BASE_URL}${pageNumber}`, { 
      waitUntil: 'networkidle0',
      timeout: PAGE_LOAD_TIMEOUT 
    });
    
    // Wait for FlipHTML5 content to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract data from the page
    const pageData = await page.evaluate((pageNum) => {
      const data = {
        page: pageNum,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        titles: [],
        rawText: '',
        metadata: {}
      };
      
      // Try multiple selectors to find content
      const contentSelectors = [
        '.page-content',
        '.fliphtml5-page',
        '[data-page]',
        '.page',
        '.content',
        'div[style*="position"]',
        'body'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = document.querySelector(selector);
        if (contentElement) break;
      }
      
      if (contentElement) {
        // Extract all text content
        data.rawText = contentElement.innerText || contentElement.textContent || '';
        
        // Look for title patterns (common in webtoon/manga directories)
        const titlePatterns = [
          /Title:\s*(.+)/gi,
          /제목:\s*(.+)/gi,
          /^([A-Z][^.!?]*[.!?]?)$/gm, // Sentences starting with capital letters
          /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Title case phrases
        ];
        
        titlePatterns.forEach(pattern => {
          const matches = data.rawText.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const cleaned = match.replace(/^(Title:|제목:)\s*/i, '').trim();
              if (cleaned.length > 3 && cleaned.length < 100) {
                data.titles.push({
                  text: cleaned,
                  pattern: pattern.source
                });
              }
            });
          }
        });
        
        // Extract metadata patterns
        const metadataPatterns = {
          author: /(?:Author|작가):\s*(.+)/gi,
          genre: /(?:Genre|장르):\s*(.+)/gi,
          status: /(?:Status|상태):\s*(.+)/gi,
          year: /(?:Year|연도):\s*(\d{4})/gi,
          chapters: /(?:Chapters?|화수):\s*(\d+)/gi,
          rating: /(?:Rating|평점):\s*([\d.]+)/gi
        };
        
        Object.entries(metadataPatterns).forEach(([key, pattern]) => {
          const matches = data.rawText.match(pattern);
          if (matches) {
            data.metadata[key] = matches.map(match => 
              match.replace(pattern, '$1').trim()
            );
          }
        });
        
        // Look for image sources
        const images = Array.from(contentElement.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          title: img.title
        }));
        
        if (images.length > 0) {
          data.images = images;
        }
        
        // Look for links
        const links = Array.from(contentElement.querySelectorAll('a')).map(link => ({
          href: link.href,
          text: link.textContent?.trim(),
          title: link.title
        })).filter(link => link.text);
        
        if (links.length > 0) {
          data.links = links;
        }
      }
      
      return data;
    }, pageNumber);
    
    console.log(`✅ Page ${pageNumber} processed - Found ${pageData.titles.length} potential titles`);
    
    return pageData;
    
  } catch (error) {
    console.error(`❌ Error processing page ${pageNumber}:`, error.message);
    return {
      page: pageNumber,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function main() {
  const startTime = Date.now();
  const results = [];
  
  let browser;
  try {
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📖 Starting data extraction...\n');
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const pageData = await extractPageData(page, pageNum);
      results.push(pageData);
      
      // Add delay between pages to be respectful
      if (pageNum < endPage) {
        console.log(`⏱️  Waiting ${DELAY_BETWEEN_PAGES/1000}s before next page...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES));
      }
      
      // Progress indicator
      const progress = ((pageNum - startPage + 1) / (endPage - startPage + 1) * 100).toFixed(1);
      console.log(`📊 Progress: ${progress}% (${pageNum - startPage + 1}/${endPage - startPage + 1})\n`);
    }
    
  } catch (error) {
    console.error('❌ Browser error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Process and save results
  const summary = {
    extractedAt: new Date().toISOString(),
    source: `${BASE_URL}[${startPage}-${endPage}]`,
    totalPages: results.length,
    successfulPages: results.filter(r => !r.error).length,
    failedPages: results.filter(r => r.error).length,
    totalTitlesFound: results.reduce((sum, r) => sum + (r.titles?.length || 0), 0),
    processingTimeMs: Date.now() - startTime
  };
  
  const output = {
    summary,
    pages: results,
    // Aggregate all unique titles
    allTitles: [...new Set(
      results
        .flatMap(r => r.titles || [])
        .map(t => t.text)
    )].map(title => ({ title, source: 'fliphtml5_extraction' }))
  };
  
  // Display summary
  console.log('\n📊 EXTRACTION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`📄 Total pages processed: ${summary.totalPages}`);
  console.log(`✅ Successful extractions: ${summary.successfulPages}`);
  console.log(`❌ Failed extractions: ${summary.failedPages}`);
  console.log(`🎯 Total titles found: ${summary.totalTitlesFound}`);
  console.log(`📚 Unique titles: ${output.allTitles.length}`);
  console.log(`⏱️  Processing time: ${(summary.processingTimeMs / 1000).toFixed(1)}s`);
  
  // Save to file (unless dry run)
  if (!isDryRun) {
    try {
      await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8');
      console.log(`💾 Data saved to: ${path.resolve(outputFile)}`);
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
    }
  } else {
    console.log('🧪 Dry run mode - no file saved');
    console.log('\n📝 Sample extracted data:');
    console.log(JSON.stringify(output.pages.slice(0, 2), null, 2));
  }
  
  console.log('\n🎉 Extraction completed!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Extraction interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});