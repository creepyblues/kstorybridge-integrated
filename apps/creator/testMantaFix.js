#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testMantaFix() {
  const url = 'https://manta.net/en/series/reborn-as-the-enemy-prince?seriesId=2328';
  const expectedImage = 'https://static.mantacdn.net/2024-06-28/Un/UnQoBGpwJsGrNarq.jpg';
  
  console.log('🧪 Testing improved Manta.net detection...');
  console.log(`📄 URL: ${url}`);
  console.log(`✅ Expected image: ${expectedImage}\n`);

  const browser = await puppeteer.launch({ 
    headless: true,
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
    
    // Extract cover image with improved Manta.net logic
    const coverImageUrl = await page.evaluate(() => {
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

        // IMPROVED: Special handling for Manta.net
        if (window.location.hostname.includes('manta.net')) {
          // Heavily favor images in the top section (main cover area)
          if (rect.top < 500) { 
            score += 200; 
            scoreDetails.push('manta top section (+200)'); 
          }
          
          // Penalize images that are too far down (likely recommendations)
          if (rect.top > 800) { 
            score -= 100; 
            scoreDetails.push('manta bottom section (-100)'); 
          }
          
          // For Manta, prefer square-ish images over very tall ones for main covers
          if (width > 0 && height > 0) {
            const aspectRatio = height / width;
            if (aspectRatio >= 1.0 && aspectRatio <= 1.2) { 
              score += 100; 
              scoreDetails.push('manta square aspect (+100)'); 
            } else if (aspectRatio > 1.4) { 
              score -= 50; 
              scoreDetails.push('manta too tall (-50)'); 
            }
          }
          
          // Look for specific Manta classes that indicate main content
          const mantaMainClasses = ['_1pznckh0']; // class from the expected image's parent
          const hasMainClass = mantaMainClasses.some(cls => 
            img.closest(`.${cls}`) !== null
          );
          if (hasMainClass) { 
            score += 150; 
            scoreDetails.push('manta main class (+150)'); 
          }
        }

        return {
          src,
          score,
          scoreDetails,
          width,
          height,
          area,
          alt,
          className,
          position: rect.top
        };
      }).filter(item => item !== null);

      scoredImages.sort((a, b) => b.score - a.score);

      // Log top candidates
      console.log('🏆 Top 3 candidates with IMPROVED scoring:');
      scoredImages.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. Score: ${item.score} | Position: ${Math.round(item.position)} | Size: ${item.width}x${item.height}`);
        console.log(`   Src: ${item.src.substring(0, 80)}...`);
        console.log(`   Alt: "${item.alt}"`);
        console.log(`   Score breakdown: ${item.scoreDetails.join(', ')}`);
        console.log('');
      });

      return scoredImages.length > 0 ? scoredImages[0].src : null;
    });
    
    console.log('🎯 RESULT:');
    if (coverImageUrl === expectedImage) {
      console.log('✅ SUCCESS! Found the correct image');
      console.log(`   Expected: ${expectedImage}`);
      console.log(`   Found: ${coverImageUrl}`);
    } else {
      console.log('❌ Still incorrect');
      console.log(`   Expected: ${expectedImage}`);
      console.log(`   Found: ${coverImageUrl}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMantaFix();