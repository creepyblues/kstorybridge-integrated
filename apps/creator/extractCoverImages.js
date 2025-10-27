#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
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

class CoverImageExtractor {
  constructor() {
    this.browser = null;
    this.results = [];
    this.logFile = path.join(__dirname, 'cover_extraction_log.txt');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async initBrowser() {
    this.log('🚀 Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  async extractLargestImage(url, titleName) {
    let page = null;
    try {
      console.log(`\n📄 Processing: ${titleName}`);
      console.log(`🔗 URL: ${url}`);
      
      page = await this.browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 720 });
      
      // Navigate to the page with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract cover image with smart detection
      const coverImageUrl = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        
        // Helper function to get image source
        const getImageSrc = (img) => {
          return img.src || 
                 img.getAttribute('data-src') || 
                 img.getAttribute('data-lazy-src') ||
                 img.getAttribute('data-original') ||
                 img.getAttribute('srcset')?.split(' ')[0];
        };

        // Helper function to check if string contains cover-related keywords
        const hasCoverKeywords = (str) => {
          if (!str) return false;
          const lowerStr = str.toLowerCase();
          return lowerStr.includes('cover') || 
                 lowerStr.includes('poster') || 
                 lowerStr.includes('thumbnail') ||
                 lowerStr.includes('series') ||
                 lowerStr.includes('title') ||
                 lowerStr.includes('book') ||
                 lowerStr.includes('manga') ||
                 lowerStr.includes('webtoon');
        };

        // Helper function to check if string contains UI/irrelevant keywords
        const hasIrrelevantKeywords = (str) => {
          if (!str) return false;
          const lowerStr = str.toLowerCase();
          return lowerStr.includes('icon') || 
                 lowerStr.includes('logo') || 
                 lowerStr.includes('avatar') || 
                 lowerStr.includes('button') || 
                 lowerStr.includes('ui') || 
                 lowerStr.includes('menu') ||
                 lowerStr.includes('banner') ||
                 lowerStr.includes('ad') ||
                 lowerStr.includes('nav') ||
                 lowerStr.includes('header') ||
                 lowerStr.includes('footer');
        };

        // Score each image based on likelihood of being a cover
        const scoredImages = images.map(img => {
          const src = getImageSrc(img);
          if (!src) return null;

          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          const area = width * height;

          // Skip very small images
          if (width < 150 || height < 150) return null;

          // Skip images with irrelevant keywords
          const alt = img.alt || '';
          const className = img.className || '';
          const id = img.id || '';
          const title = img.title || '';
          const srcPath = src;

          if (hasIrrelevantKeywords(alt) || 
              hasIrrelevantKeywords(className) || 
              hasIrrelevantKeywords(id) ||
              hasIrrelevantKeywords(title) ||
              hasIrrelevantKeywords(srcPath)) {
            return null;
          }

          let score = 0;

          // Bonus points for cover-related keywords
          if (hasCoverKeywords(alt)) score += 100;
          if (hasCoverKeywords(className)) score += 100;
          if (hasCoverKeywords(id)) score += 100;
          if (hasCoverKeywords(title)) score += 100;
          if (hasCoverKeywords(srcPath)) score += 50;

          // Bonus for portrait orientation (typical for covers)
          if (height > width && height / width > 1.2) score += 50;

          // Bonus for being in main content area (not header/footer)
          const rect = img.getBoundingClientRect();
          if (rect.top > 100 && rect.top < window.innerHeight - 100) score += 30;

          // Bonus for larger size (but not too large to avoid banners)
          if (area > 50000 && area < 500000) score += Math.min(area / 10000, 50);

          // Bonus for specific selectors that often contain covers
          const parent = img.closest('[class*="cover"], [class*="poster"], [class*="thumbnail"], [class*="image"], [id*="cover"], [id*="poster"]');
          if (parent) score += 75;

          // Check if image is in a prominent position
          const isMainImage = img.closest('main, article, .content, .series, .book, .manga') && 
                             !img.closest('nav, header, footer, .menu, .sidebar');
          if (isMainImage) score += 40;

          // Special handling for Manta.net - prioritize images that appear early on page
          if (window.location.hostname.includes('manta.net')) {
            const rect = img.getBoundingClientRect();
            
            // Heavily favor images in the top section (main cover area)
            if (rect.top < 500) score += 200;
            
            // Penalize images that are too far down (likely recommendations)
            if (rect.top > 800) score -= 100;
            
            // For Manta, prefer square-ish images over very tall ones for main covers
            if (width > 0 && height > 0) {
              const aspectRatio = height / width;
              if (aspectRatio >= 1.0 && aspectRatio <= 1.2) { 
                score += 100;
              } else if (aspectRatio > 1.4) { 
                score -= 50;
              }
            }
            
            // Look for specific Manta classes that indicate main content
            const mantaMainClasses = ['_1pznckh0']; // class from the expected image's parent
            const hasMainClass = mantaMainClasses.some(cls => 
              img.closest(`.${cls}`) !== null
            );
            if (hasMainClass) score += 150;
          }

          return {
            img,
            src,
            score,
            width,
            height,
            area,
            alt,
            className,
            debugInfo: {
              alt,
              className,
              id,
              src: src.substring(0, 100) + (src.length > 100 ? '...' : '')
            }
          };
        }).filter(item => item !== null);

        // Sort by score (highest first)
        scoredImages.sort((a, b) => b.score - a.score);

        // Debug information
        console.log('🔍 Image scoring results:');
        scoredImages.slice(0, 5).forEach((item, index) => {
          console.log(`${index + 1}. Score: ${item.score}, Size: ${item.width}x${item.height}`);
          console.log(`   Alt: "${item.alt}"`);
          console.log(`   Class: "${item.className}"`);
          console.log(`   Src: ${item.debugInfo.src}`);
        });

        if (scoredImages.length === 0) {
          console.log('❌ No suitable cover images found');
          return null;
        }

        const bestImage = scoredImages[0];
        console.log(`✅ Selected image with score: ${bestImage.score}`);
        return bestImage.src;
      });

      if (coverImageUrl) {
        console.log(`✅ Found cover image: ${coverImageUrl}`);
        this.log(`✅ Found cover image: ${coverImageUrl}`);
        return coverImageUrl;
      } else {
        console.log(`⚠️  No suitable cover image found`);
        this.log(`⚠️  No suitable cover image found for ${titleName}`);
        return null;
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      this.log(`❌ Error processing ${titleName}: ${error.message}`);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async fetchTitlesWithUrls() {
    this.log('📊 Fetching titles from database...');
    
    // First, let's check what's in the database
    const { data: allTitles, error: allError } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_url, title_image')
      .limit(10);

    if (allError) {
      throw new Error(`Failed to fetch titles: ${allError.message}`);
    }

    this.log(`📋 Total titles in database (first 10): ${allTitles.length}`);
    
    // Show sample data for debugging
    allTitles.forEach((title, index) => {
      this.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr || 'No name'}`);
      this.log(`      URL: ${title.title_url || 'NO URL'}`);
      this.log(`      Image: ${title.title_image || 'NO IMAGE'}`);
    });

    // Now fetch ALL titles with URLs (including those with existing images)
    const { data, error } = await supabase
      .from('titles')
      .select('title_id, title_name_en, title_name_kr, title_url, title_image')
      .not('title_url', 'is', null)
      .neq('title_url', '');

    if (error) {
      throw new Error(`Failed to fetch titles with URLs: ${error.message}`);
    }

    this.log(`📝 Found ${data.length} titles with URLs`);
    
    if (data.length === 0) {
      this.log('🔍 Debugging: No titles found with URLs. Checking for any titles with title_url column...');
      
      // Check if any titles have title_url at all
      const { data: withUrls, error: urlError } = await supabase
        .from('titles')
        .select('title_id, title_name_en, title_name_kr, title_url')
        .not('title_url', 'is', null);

      if (urlError) {
        this.log(`❌ Error checking URLs: ${urlError.message}`);
      } else {
        this.log(`🔗 Found ${withUrls.length} titles with any title_url (including empty strings)`);
        withUrls.slice(0, 5).forEach((title, index) => {
          this.log(`   ${index + 1}. "${title.title_name_en || title.title_name_kr}" - URL: "${title.title_url}"`);
        });
      }
    }

    return data;
  }

  async updateTitleImage(titleId, imageUrl, titleName) {
    try {
      const { error } = await supabase
        .from('titles')
        .update({ title_image: imageUrl })
        .eq('title_id', titleId);

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      console.log(`💾 Database updated successfully!`);
      this.log(`💾 Updated database for ${titleName}`);
      return true;
    } catch (error) {
      console.log(`❌ Database update failed: ${error.message}`);
      this.log(`❌ Failed to update ${titleName}: ${error.message}`);
      return false;
    }
  }

  async processAllTitles() {
    try {
      // Initialize browser
      await this.initBrowser();

      // Fetch titles from database
      const titles = await this.fetchTitlesWithUrls();
      
      if (titles.length === 0) {
        this.log('ℹ️  No titles with URLs found to process');
        return;
      }

      console.log(`🔄 Starting extraction for ${titles.length} titles...\n`);
      this.log(`🔄 Starting extraction for ${titles.length} titles...`);

      // Process each title
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const titleName = title.title_name_en || title.title_name_kr || `Title ${title.title_id}`;
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 Progress: [${i + 1}/${titles.length}] (${Math.round(((i + 1) / titles.length) * 100)}%)`);
        console.log(`📝 Title: ${titleName}`);
        console.log(`🆔 ID: ${title.title_id}`);
        this.log(`\n[${i + 1}/${titles.length}] Processing: ${titleName}`);

        // Show existing image status
        if (title.title_image) {
          console.log(`🔄 Updating existing image - will replace current image`);
          console.log(`🖼️  Current image: ${title.title_image}`);
          this.log(`🔄 Updating ${titleName} - replacing existing image`);
        } else {
          console.log(`➕ Adding new image - no existing image found`);
          this.log(`➕ Adding new image for ${titleName}`);
        }

        try {
          // Extract cover image
          const imageUrl = await this.extractLargestImage(title.title_url, titleName);
          
          if (imageUrl) {
            // Update database
            const updated = await this.updateTitleImage(title.title_id, imageUrl, titleName);
            
            if (updated) {
              console.log(`\n🎉 SUCCESS! Title processed successfully:`);
              console.log(`   📝 Title: ${titleName}`);
              console.log(`   🔗 Source URL: ${title.title_url}`);
              console.log(`   🖼️  New Image URL: ${imageUrl}`);
              if (title.title_image) {
                console.log(`   📋 Previous Image: ${title.title_image}`);
                console.log(`   ✅ Action: UPDATED existing image`);
              } else {
                console.log(`   ✅ Action: ADDED new image`);
              }
            }
            
            this.results.push({
              title_id: title.title_id,
              title_name: titleName,
              status: updated ? 'success' : 'update_failed',
              action: title.title_image ? 'updated' : 'added',
              image_url: imageUrl,
              previous_image: title.title_image || null,
              url: title.title_url
            });
          } else {
            console.log(`\n❌ No suitable image found for this title`);
            this.results.push({
              title_id: title.title_id,
              title_name: titleName,
              status: 'no_image_found',
              url: title.title_url
            });
          }

          // Add delay between requests to be respectful
          if (i < titles.length - 1) {
            console.log(`\n⏳ Waiting 2 seconds before next title...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.log(`\n❌ PROCESSING ERROR:`);
          console.log(`   📝 Title: ${titleName}`);
          console.log(`   🔗 URL: ${title.title_url}`);
          console.log(`   ⚠️  Error: ${error.message}`);
          this.log(`❌ Error processing ${titleName}: ${error.message}`);
          this.results.push({
            title_id: title.title_id,
            title_name: titleName,
            status: 'error',
            error: error.message,
            url: title.title_url
          });
        }
      }

    } catch (error) {
      this.log(`❌ Fatal error: ${error.message}`);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.log('🔒 Browser closed');
      }
    }
  }

  generateReport() {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 FINAL EXTRACTION REPORT');
    console.log('='.repeat(80));
    
    const successful = this.results.filter(r => r.status === 'success').length;
    const added = this.results.filter(r => r.status === 'success' && r.action === 'added').length;
    const updated = this.results.filter(r => r.status === 'success' && r.action === 'updated').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const failed = this.results.filter(r => r.status !== 'success' && r.status !== 'skipped').length;
    
    console.log(`✅ Successfully processed: ${successful}`);
    console.log(`   ➕ New images added: ${added}`);
    console.log(`   🔄 Existing images updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total processed: ${this.results.length}`);
    
    this.log('\n📊 EXTRACTION REPORT');
    this.log('='.repeat(50));
    this.log(`✅ Successfully processed: ${successful}`);
    this.log(`   ➕ New images added: ${added}`);
    this.log(`   🔄 Existing images updated: ${updated}`);
    this.log(`⏭️  Skipped: ${skipped}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`📝 Total processed: ${this.results.length}`);

    // Save detailed results to JSON file
    const resultsFile = path.join(__dirname, 'cover_extraction_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    this.log(`💾 Detailed results saved to: ${resultsFile}`);

    // Show successful extractions
    if (successful > 0) {
      console.log(`\n✅ Successfully processed ${successful} titles:`);
      this.results
        .filter(r => r.status === 'success')
        .forEach((r, index) => {
          const actionIcon = r.action === 'updated' ? '🔄' : '➕';
          const actionText = r.action === 'updated' ? 'UPDATED' : 'ADDED';
          console.log(`   ${index + 1}. ${actionIcon} ${actionText}: ${r.title_name}`);
          console.log(`      🔗 Source: ${r.url}`);
          console.log(`      🖼️  New Image: ${r.image_url}`);
          if (r.previous_image) {
            console.log(`      📋 Previous: ${r.previous_image}`);
          }
        });
    }

    if (failed > 0) {
      console.log(`\n❌ Failed titles (${failed}):`);
      this.results
        .filter(r => r.status !== 'success' && r.status !== 'skipped')
        .forEach((r, index) => {
          console.log(`   ${index + 1}. ${r.title_name}: ${r.status}`);
          if (r.error) console.log(`      ⚠️  Error: ${r.error}`);
          console.log(`      🔗 URL: ${r.url}`);
        });
      
      this.log('\n❌ Failed titles:');
      this.results
        .filter(r => r.status !== 'success' && r.status !== 'skipped')
        .forEach(r => {
          this.log(`   - ${r.title_name}: ${r.status} ${r.error ? `(${r.error})` : ''}`);
        });
    }

    console.log(`\n🎉 Extraction process completed!`);
    console.log(`📄 Detailed log saved to: cover_extraction_log.txt`);
    console.log(`📊 Results saved to: cover_extraction_results.json`);
    this.log('\n🎉 Extraction process completed!');
  }
}

// Main execution
async function main() {
  const extractor = new CoverImageExtractor();
  
  try {
    await extractor.processAllTitles();
    extractor.generateReport();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CoverImageExtractor;