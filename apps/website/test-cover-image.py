#!/usr/bin/env python3
"""
Test script to verify the updated cover image extraction
"""

import sys
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_driver():
    """Setup Chrome WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')
    chrome_options.add_argument('--headless')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    logger.info("Chrome WebDriver initialized")
    return driver

def extract_cover_image(driver, url):
    """Extract the main cover image using the updated algorithm"""
    try:
        logger.info(f"Extracting cover image from: {url}")
        
        driver.get(url)
        time.sleep(3)
        
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Extract the largest/main cover image (not logo)
        cover_image = ''
        best_image_score = 0
        best_image_info = {}
        
        # Look for images in descending order of preference
        img_selectors = [
            'img[src*="prod-files-secure.s3.us-west-2.amazonaws.com"]',  # High-res S3 images
            'img[src*="amazonaws.com"]',  # Other AWS images
            'img[src*="oopy.lazyrockets.com/api/v2/notion/image"]',  # Notion API images with blockId
            'img[src*="oopy."]',  # Other oopy images
            'img[src*="cdn."]',  # CDN images
            'img[src*="cloudfront"]',  # CloudFront images
            'img'  # All other images as fallback
        ]
        
        all_images = []
        
        for selector in img_selectors:
            imgs = soup.select(selector)
            for img in imgs:
                src = img.get('src', '')
                if not src:
                    continue
                    
                # Skip logos, icons, and navigation images
                if any(skip in src.lower() for skip in ['home', 'logo', 'icon', 'favicon', 'header', 'nav']):
                    continue
                
                # Calculate image score based on URL patterns and dimensions
                score = 0
                
                # High priority for secure S3 URLs (main content images)
                if 'prod-files-secure.s3.us-west-2.amazonaws.com' in src:
                    score += 100
                
                # High priority for Notion API images with blockId (processed images)
                if 'oopy.lazyrockets.com/api/v2/notion/image' in src and 'blockId=' in src:
                    score += 90
                
                # Medium priority for other AWS/CDN images
                elif any(pattern in src for pattern in ['amazonaws.com', 'cloudfront', 'cdn.']):
                    score += 50
                
                # Consider image dimensions if available
                width = img.get('width', '')
                height = img.get('height', '')
                
                try:
                    if width and height:
                        w, h = int(width), int(height)
                        # Prefer landscape images (typical for webtoon covers)
                        if w > h and w > 400:
                            score += 30
                        elif w > 300 and h > 200:
                            score += 20
                except (ValueError, TypeError):
                    pass
                
                # Prefer larger images based on file size indicators in URL
                if any(size_indicator in src for size_indicator in ['large', 'full', 'original', '1200', '800']):
                    score += 15
                
                # Store image info for debugging
                img_info = {
                    'src': src,
                    'score': score,
                    'width': width,
                    'height': height,
                    'alt': img.get('alt', ''),
                    'selector': selector
                }
                all_images.append(img_info)
                
                # Update best image if this one scores higher
                if score > best_image_score:
                    best_image_score = score
                    if not src.startswith('http'):
                        src = urljoin('https://www.toons.kr', src)
                    cover_image = src
                    best_image_info = img_info
            
            # If we found a high-scoring image, stop looking
            if best_image_score >= 90:
                break
        
        return cover_image, best_image_info, all_images
        
    except Exception as e:
        logger.error(f"Error extracting cover image from {url}: {e}")
        return '', {}, []

def main():
    """Test the cover image extraction"""
    test_url = "https://www.toons.kr/toons/ex_girlfriend"
    expected_pattern = "oopy.lazyrockets.com/api/v2/notion/image"
    
    print("🔍 Testing Cover Image Extraction")
    print("=" * 50)
    print(f"Test URL: {test_url}")
    print(f"Expected pattern: {expected_pattern}")
    print()
    
    driver = setup_driver()
    
    try:
        cover_image, best_info, all_images = extract_cover_image(driver, test_url)
        
        print("📊 RESULTS:")
        print("-" * 30)
        
        if cover_image:
            print(f"✅ Best cover image found:")
            print(f"   URL: {cover_image}")
            print(f"   Score: {best_info.get('score', 'N/A')}")
            print(f"   Dimensions: {best_info.get('width', 'N/A')} x {best_info.get('height', 'N/A')}")
            print(f"   Alt text: {best_info.get('alt', 'N/A')}")
            print()
            
            # Check if it matches expected pattern
            if expected_pattern in cover_image:
                print("🎉 SUCCESS: Found expected Notion API image URL!")
            else:
                print("⚠️  WARNING: Image doesn't match expected pattern")
            
            # Check for the specific blockId URL pattern
            if "blockId=" in cover_image:
                print("✅ BONUS: URL includes blockId parameter (high-quality processed image)")
            
        else:
            print("❌ No cover image found")
        
        print(f"\n📋 All images found ({len(all_images)}):")
        print("-" * 40)
        for i, img in enumerate(sorted(all_images, key=lambda x: x['score'], reverse=True)[:10], 1):
            print(f"{i:2d}. Score: {img['score']:3d} | {img['src'][:80]}{'...' if len(img['src']) > 80 else ''}")
        
        if len(all_images) > 10:
            print(f"    ... and {len(all_images) - 10} more images")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        driver.quit()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)