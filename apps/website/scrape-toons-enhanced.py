#!/usr/bin/env python3
"""
Enhanced Toons.kr Scraper - Extract data from Next.js JSON + detail pages
Now includes 작품 줄거리 and cover image URLs from individual title pages
"""

import csv
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import logging
from urllib.parse import urljoin
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedToonsKrScraper:
    def __init__(self):
        self.base_url = "https://www.toons.kr"
        self.list_url = "https://www.toons.kr/toons/list"
        self.driver = None
        self.session = requests.Session()
        
        # Setup session headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })

    def setup_driver(self):
        """Setup Chrome WebDriver"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')
        
        # Run headless for efficiency
        chrome_options.add_argument('--headless')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        logger.info("Chrome WebDriver initialized")

    def extract_next_data(self):
        """Extract data from Next.js __NEXT_DATA__ script tag with automatic scrolling"""
        logger.info("Loading toons list page...")
        self.driver.get(self.list_url)
        time.sleep(5)  # Wait for page to load
        
        # Scroll to load all content
        logger.info("Scrolling to load all titles...")
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        scroll_attempts = 0
        max_scroll_attempts = 20
        
        while scroll_attempts < max_scroll_attempts:
            # Scroll down to bottom
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            
            # Wait for new content to load
            time.sleep(3)
            
            # Calculate new scroll height and compare with last scroll height
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            
            if new_height == last_height:
                # No new content loaded, try a few more times to be sure
                scroll_attempts += 1
                logger.info(f"Scroll attempt {scroll_attempts}/{max_scroll_attempts} - No new content")
            else:
                scroll_attempts = 0  # Reset counter if new content found
                last_height = new_height
                logger.info(f"New content loaded, page height: {new_height}")
        
        logger.info("Finished scrolling, extracting final page data...")
        
        # Get final page source and extract __NEXT_DATA__
        page_source = self.driver.page_source
        
        # Find the __NEXT_DATA__ JSON
        next_data_match = re.search(r'__NEXT_DATA__" type="application/json">({.*?})</script>', page_source, re.DOTALL)
        
        if not next_data_match:
            logger.error("Could not find __NEXT_DATA__ in page")
            return None
        
        try:
            next_data = json.loads(next_data_match.group(1))
            logger.info("Successfully extracted Next.js data")
            return next_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Next.js JSON: {e}")
            return None

    def extract_detail_page_info(self, url):
        """Extract 작품 줄거리 and cover image from detail page"""
        try:
            logger.info(f"Extracting detail info from: {url}")
            
            # Use Selenium for dynamic content
            self.driver.get(url)
            time.sleep(3)
            
            # Get page source for BeautifulSoup parsing
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Extract cover image - first image on the page
            cover_image = ''
            img_selectors = [
                'img[src*="cdn."]',
                'img[src*="oopy."]',
                'img[src*="amazonaws"]',
                'img[src*="cloudfront"]',
                'img:not([alt="home"])',
                'img'
            ]
            
            for selector in img_selectors:
                imgs = soup.select(selector)
                for img in imgs:
                    src = img.get('src', '')
                    if src and not any(skip in src.lower() for skip in ['home', 'logo', 'icon', 'favicon']):
                        if not src.startswith('http'):
                            src = urljoin(self.base_url, src)
                        cover_image = src
                        break
                if cover_image:
                    break
            
            # Extract 작품 줄거리 (story synopsis) from the page
            story_synopsis = ''
            
            # Method 1: Look for text containing "줄거리"
            text_content = soup.get_text()
            
            # Find sections with 줄거리
            synopsis_patterns = [
                r'작품\s*줄거리[:\s]*([^\.]+(?:\.[^\.]+)*)',
                r'줄거리[:\s]*([^\.]+(?:\.[^\.]+)*)',
                r'synopsis[:\s]*([^\.]+(?:\.[^\.]+)*)',
                r'스토리[:\s]*([^\.]+(?:\.[^\.]+)*)'
            ]
            
            for pattern in synopsis_patterns:
                match = re.search(pattern, text_content, re.IGNORECASE | re.MULTILINE)
                if match:
                    story_synopsis = match.group(1).strip()
                    break
            
            # Method 2: Look in structured content blocks
            if not story_synopsis:
                # Look for blocks that might contain synopsis
                content_blocks = soup.find_all(['p', 'div'], string=re.compile(r'줄거리|synopsis|스토리', re.IGNORECASE))
                for block in content_blocks:
                    parent = block.find_parent()
                    if parent:
                        text = parent.get_text().strip()
                        if len(text) > 20 and '줄거리' in text:
                            # Extract text after 줄거리
                            parts = text.split('줄거리')
                            if len(parts) > 1:
                                story_synopsis = parts[1].strip()[:500]  # Limit length
                                break
            
            # Method 3: Extract from Next.js data if available on detail page
            if not story_synopsis:
                next_data_match = re.search(r'__NEXT_DATA__" type="application/json">({.*?})</script>', page_source, re.DOTALL)
                if next_data_match:
                    try:
                        detail_data = json.loads(next_data_match.group(1))
                        # Look for synopsis in the block data
                        record_map = detail_data.get('props', {}).get('pageProps', {}).get('recordMap', {})
                        blocks = record_map.get('block', {})
                        
                        for block_id, block_data in blocks.items():
                            if isinstance(block_data, dict) and 'value' in block_data:
                                value = block_data['value']
                                if 'properties' in value:
                                    properties = value['properties']
                                    # Look for synopsis-like properties
                                    for prop_key, prop_value in properties.items():
                                        if isinstance(prop_value, list) and len(prop_value) > 0:
                                            text = self.extract_property_text(prop_value)
                                            if len(text) > 30 and any(keyword in text for keyword in ['이야기', '스토리', '주인공', '세계']):
                                                story_synopsis = text[:500]
                                                break
                                    if story_synopsis:
                                        break
                    except:
                        pass
            
            # Clean up extracted data
            story_synopsis = self.clean_text(story_synopsis)
            cover_image = cover_image.strip()
            
            logger.info(f"Extracted - Cover: {cover_image[:100]}{'...' if len(cover_image) > 100 else ''}")
            logger.info(f"Extracted - Synopsis: {story_synopsis[:100]}{'...' if len(story_synopsis) > 100 else ''}")
            
            return {
                'cover_image': cover_image,
                'story_synopsis': story_synopsis
            }
            
        except Exception as e:
            logger.error(f"Error extracting detail info from {url}: {e}")
            return {
                'cover_image': '',
                'story_synopsis': ''
            }

    def parse_title_data(self, next_data):
        """Parse title information from Next.js data"""
        titles = []
        
        try:
            # Navigate to the block data where titles are stored
            record_map = next_data.get('props', {}).get('pageProps', {}).get('recordMap', {})
            blocks = record_map.get('block', {})
            
            logger.info(f"Found {len(blocks)} blocks in data")
            
            for block_id, block_data in blocks.items():
                if not isinstance(block_data, dict) or 'value' not in block_data:
                    continue
                
                value = block_data['value']
                
                # Skip if not a page type or no properties
                if value.get('type') != 'page' or 'properties' not in value:
                    continue
                
                properties = value['properties']
                
                # Skip if no title
                if 'title' not in properties:
                    continue
                
                # Extract basic title information
                title_data = {
                    'title': self.extract_property_text(properties.get('title', [])),
                    'url': f"https://www.toons.kr/{block_id}",
                    'genre': self.extract_property_text(properties.get('JgOi', [])),  # Genre
                    'writer': self.extract_property_text(properties.get('TGUB', [])),  # 글 (Writer)
                    'artist': self.extract_property_text(properties.get('ft;E', [])),  # 그림 (Artist) 
                    'original': self.extract_property_text(properties.get('QvJr', [])),  # Could be original info
                    'featured': self.extract_property_text(properties.get('F:an', [])),  # Featured info
                    'pages': self.extract_property_text(properties.get('X|g{', [])),  # Page count
                    'characters': '',  # Not found in this structure
                    'synopsis': self.extract_property_text(properties.get('QvJr', [])),  # Synopsis info
                    'cover_image': '',  # Will be filled from detail page
                    'link': self.extract_property_text(properties.get('j=G;', [])),  # External link
                    'status': self.extract_property_text(properties.get('e}{q', [])),  # Status
                    'english_title': self.extract_property_text(properties.get('@m~r', [])),  # English title
                    'story_synopsis': ''  # Will be filled from detail page
                }
                
                # Clean up data
                for key, value in title_data.items():
                    if isinstance(value, str):
                        title_data[key] = self.clean_text(value)
                
                # Only add if we have a valid title
                if title_data['title']:
                    titles.append(title_data)
                    logger.info(f"Extracted basic data: {title_data['title']}")
            
            logger.info(f"Successfully parsed {len(titles)} titles from list page")
            return titles
            
        except Exception as e:
            logger.error(f"Error parsing title data: {e}")
            return []

    def enhance_with_detail_pages(self, titles):
        """Enhance title data with information from detail pages"""
        logger.info(f"Enhancing ALL {len(titles)} titles with detail page information...")
        
        for i, title in enumerate(titles, 1):
            logger.info(f"Processing {i}/{len(titles)}: {title['title']}")
            
            # Extract detail information
            detail_info = self.extract_detail_page_info(title['url'])
            
            # Update title data
            title['cover_image'] = detail_info['cover_image']
            title['story_synopsis'] = detail_info['story_synopsis']
            
            # Rate limiting to be respectful
            time.sleep(1)
            
            # Save progress every 20 titles
            if i % 20 == 0:
                self.save_to_csv(titles[:i], f'toons_kr_enhanced_progress_{i}.csv')
                logger.info(f"Progress saved: {i} titles processed")
        
        return titles

    def extract_property_text(self, property_data):
        """Extract text from Notion property format"""
        if not property_data or not isinstance(property_data, list):
            return ''
        
        text_parts = []
        for item in property_data:
            if isinstance(item, list) and len(item) > 0:
                if isinstance(item[0], str):
                    text_parts.append(item[0])
                elif isinstance(item[0], list) and len(item[0]) > 0:
                    # Handle nested arrays
                    text_parts.append(str(item[0][0]))
        
        return ' '.join(text_parts).strip()

    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ''
        
        # Remove extra whitespace and normalize
        text = ' '.join(text.split())
        
        # Remove common noise
        text = text.replace('\n', ' ').replace('\t', ' ')
        
        # Remove HTML tags if any
        text = re.sub(r'<[^>]+>', '', text)
        
        return text.strip()

    def save_to_csv(self, titles_data, filename='toons_kr_enhanced.csv'):
        """Save data to CSV"""
        if not titles_data:
            logger.error("No data to save")
            return
        
        fieldnames = [
            'title', 'english_title', 'url', 'genre', 'writer', 'artist', 
            'original', 'featured', 'pages', 'characters', 'synopsis', 
            'story_synopsis', 'cover_image', 'link', 'status'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for data in titles_data:
                # Ensure all fields exist
                row_data = {}
                for field in fieldnames:
                    row_data[field] = data.get(field, '')
                writer.writerow(row_data)
        
        logger.info(f"Data saved to {filename}")

    def run(self):
        """Main execution"""
        try:
            logger.info("Starting enhanced Toons.kr scraper...")
            
            # Setup WebDriver
            self.setup_driver()
            
            # Extract Next.js data from list page
            next_data = self.extract_next_data()
            if not next_data:
                logger.error("Failed to extract Next.js data")
                return
            
            # Parse basic title information
            titles_data = self.parse_title_data(next_data)
            if not titles_data:
                logger.error("No title data found")
                return
            
            logger.info(f"Found {len(titles_data)} titles, now extracting detail page information...")
            
            # Enhance with detail page information
            enhanced_titles = self.enhance_with_detail_pages(titles_data)
            
            # Save final results
            self.save_to_csv(enhanced_titles, 'toons_kr_enhanced_final.csv')
            
            # Save backup JSON
            with open('toons_kr_enhanced_final.json', 'w', encoding='utf-8') as f:
                json.dump(enhanced_titles, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Scraping completed! Total titles: {len(enhanced_titles)}")
            
            # Print summary
            print(f"\n=== ENHANCED SCRAPING SUMMARY ===")
            print(f"Total titles extracted: {len(enhanced_titles)}")
            
            # Count how many have additional info
            with_cover = len([t for t in enhanced_titles if t.get('cover_image')])
            with_story = len([t for t in enhanced_titles if t.get('story_synopsis')])
            
            print(f"Titles with cover images: {with_cover}/{len(enhanced_titles)} ({with_cover/len(enhanced_titles)*100:.1f}%)")
            print(f"Titles with story synopsis: {with_story}/{len(enhanced_titles)} ({with_story/len(enhanced_titles)*100:.1f}%)")
            
            print(f"\nOutput files:")
            print(f"  - toons_kr_enhanced_final.csv (main output)")
            print(f"  - toons_kr_enhanced_final.json (JSON backup)")
            
            # Show sample enhanced data
            if enhanced_titles:
                print(f"\nSample enhanced titles:")
                for i, title in enumerate(enhanced_titles[:3]):
                    print(f"  {i+1}. {title['title']}")
                    print(f"     Genre: {title['genre']}")
                    print(f"     Cover: {title['cover_image'][:50]}{'...' if len(title['cover_image']) > 50 else ''}")
                    print(f"     Story: {title['story_synopsis'][:100]}{'...' if len(title['story_synopsis']) > 100 else ''}")
                    print()
            
        except Exception as e:
            logger.error(f"Fatal error: {e}")
            raise
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("WebDriver closed")

if __name__ == "__main__":
    scraper = EnhancedToonsKrScraper()
    scraper.run()