#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugMantaPage() {
  const url = 'https://manta.net/en/series/reborn-as-the-enemy-prince?seriesId=2328';
  const expectedImage = 'https://static.mantacdn.net/2024-06-28/Un/UnQoBGpwJsGrNarq.jpg';
  const foundImage = 'https://static.mantacdn.net/2025-07-18/9k/9kRZRgdpk9Llh50Z.jpg';
  
  console.log('🔍 Debugging Manta.net page...');
  console.log(`📄 URL: ${url}`);
  console.log(`✅ Expected image: ${expectedImage}`);
  console.log(`❌ Script found: ${foundImage}\n`);

  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('🌐 Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('⏳ Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'debug_manta_page.png', fullPage: true });
    console.log('📸 Screenshot saved as debug_manta_page.png');
    
    // Analyze all images on the page
    const imageAnalysis = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      
      return images.map(img => {
        const src = img.src || 
                   img.getAttribute('data-src') || 
                   img.getAttribute('data-lazy-src') ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('srcset')?.split(' ')[0];
        
        const rect = img.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        return {
          src: src || 'NO_SRC',
          alt: img.alt || '',
          className: img.className || '',
          id: img.id || '',
          title: img.title || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          area: (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0),
          position: {
            top: rect.top,
            left: rect.left,
            visible: isVisible
          },
          parent: {
            className: img.parentElement?.className || '',
            tagName: img.parentElement?.tagName || '',
            id: img.parentElement?.id || ''
          }
        };
      }).filter(img => img.src !== 'NO_SRC' && img.width > 50 && img.height > 50);
    });
    
    console.log(`\n📊 Found ${imageAnalysis.length} images on the page:\n`);
    
    imageAnalysis.forEach((img, index) => {
      const isExpected = img.src === expectedImage;
      const isFound = img.src === foundImage;
      const marker = isExpected ? '✅ EXPECTED' : isFound ? '❌ SCRIPT FOUND' : '  ';
      
      console.log(`${index + 1}. ${marker}`);
      console.log(`   📐 Size: ${img.width}x${img.height} (area: ${img.area.toLocaleString()})`);
      console.log(`   🖼️  Src: ${img.src}`);
      console.log(`   📝 Alt: "${img.alt}"`);
      console.log(`   🏷️  Class: "${img.className}"`);
      console.log(`   🆔 ID: "${img.id}"`);
      console.log(`   📍 Position: top=${Math.round(img.position.top)}, visible=${img.position.visible}`);
      console.log(`   👨‍👩‍👧‍👦 Parent: <${img.parent.tagName.toLowerCase()}> class="${img.parent.className}" id="${img.parent.id}"`);
      
      // Check for cover-related keywords
      const text = `${img.alt} ${img.className} ${img.id} ${img.title} ${img.src}`.toLowerCase();
      const hasKeywords = text.includes('cover') || text.includes('poster') || text.includes('series') || 
                         text.includes('thumbnail') || text.includes('title') || text.includes('book');
      console.log(`   🔍 Has cover keywords: ${hasKeywords}`);
      console.log('');
    });
    
    // Now run our scoring algorithm and see what it picks
    console.log('\n🎯 Running scoring algorithm...\n');
    
    const scoringResult = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      
      const getImageSrc = (img) => {
        return img.src || 
               img.getAttribute('data-src') || 
               img.getAttribute('data-lazy-src') ||
               img.getAttribute('data-original') ||
               img.getAttribute('srcset')?.split(' ')[0];
      };

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

      const scoredImages = images.map(img => {
        const src = getImageSrc(img);
        if (!src) return null;

        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        const area = width * height;

        if (width < 150 || height < 150) return null;

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
        const scoreDetails = [];

        if (hasCoverKeywords(alt)) { score += 100; scoreDetails.push('alt keywords (+100)'); }
        if (hasCoverKeywords(className)) { score += 100; scoreDetails.push('class keywords (+100)'); }
        if (hasCoverKeywords(id)) { score += 100; scoreDetails.push('id keywords (+100)'); }
        if (hasCoverKeywords(title)) { score += 100; scoreDetails.push('title keywords (+100)'); }
        if (hasCoverKeywords(srcPath)) { score += 50; scoreDetails.push('src keywords (+50)'); }

        if (height > width && height / width > 1.2) { score += 50; scoreDetails.push('portrait (+50)'); }

        const rect = img.getBoundingClientRect();
        if (rect.top > 100 && rect.top < window.innerHeight - 100) { 
          score += 30; 
          scoreDetails.push('main area (+30)'); 
        }

        if (area > 50000 && area < 500000) { 
          const areaBonus = Math.min(area / 10000, 50);
          score += areaBonus; 
          scoreDetails.push(`size bonus (+${Math.round(areaBonus)})`); 
        }

        const parent = img.closest('[class*="cover"], [class*="poster"], [class*="thumbnail"], [class*="image"], [id*="cover"], [id*="poster"]');
        if (parent) { score += 75; scoreDetails.push('cover parent (+75)'); }

        const isMainImage = img.closest('main, article, .content, .series, .book, .manga') && 
                           !img.closest('nav, header, footer, .menu, .sidebar');
        if (isMainImage) { score += 40; scoreDetails.push('main content (+40)'); }

        return {
          src,
          score,
          scoreDetails,
          width,
          height,
          area,
          alt,
          className
        };
      }).filter(item => item !== null);

      scoredImages.sort((a, b) => b.score - a.score);
      return scoredImages;
    });
    
    console.log('🏆 Top 5 scored images:');
    scoringResult.slice(0, 5).forEach((item, index) => {
      const isExpected = item.src === expectedImage;
      const isFound = item.src === foundImage;
      const marker = isExpected ? '✅ EXPECTED' : isFound ? '❌ SCRIPT FOUND' : '  ';
      
      console.log(`\n${index + 1}. ${marker} Score: ${item.score}`);
      console.log(`   📐 Size: ${item.width}x${item.height}`);
      console.log(`   🖼️  Src: ${item.src.substring(0, 80)}...`);
      console.log(`   📝 Alt: "${item.alt}"`);
      console.log(`   🏷️  Class: "${item.className}"`);
      console.log(`   🎯 Score breakdown: ${item.scoreDetails.join(', ')}`);
    });
    
    // Check if expected image exists but has low score
    const expectedImageData = scoringResult.find(img => img.src === expectedImage);
    if (expectedImageData) {
      console.log(`\n✅ Expected image found with score: ${expectedImageData.score}`);
      console.log(`   Score details: ${expectedImageData.scoreDetails.join(', ')}`);
    } else {
      console.log(`\n❌ Expected image not found in scoring results`);
      // Check if it exists in the raw analysis
      const inRawAnalysis = imageAnalysis.find(img => img.src === expectedImage);
      if (inRawAnalysis) {
        console.log(`   But it exists in raw analysis - likely filtered out by scoring logic`);
      } else {
        console.log(`   And it doesn't exist in raw analysis - image not on page or not detected`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugMantaPage();