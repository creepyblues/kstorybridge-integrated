#!/usr/bin/env python3
"""
Fixed Toons.kr Scraper - Extract data from Next.js JSON data
"""

import csv
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FixedToonsKrScraper:
    def __init__(self):
        self.base_url = "https://www.toons.kr"
        self.list_url = "https://www.toons.kr/toons/list"
        self.driver = None

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
        """Extract data from Next.js __NEXT_DATA__ script tag"""
        logger.info("Loading toons list page...")
        self.driver.get(self.list_url)
        time.sleep(5)  # Wait for page to load
        
        # Get page source and extract __NEXT_DATA__
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
                
                # Extract title information
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
                    'cover_image': '',  # Would need additional processing
                    'link': self.extract_property_text(properties.get('j=G;', [])),  # External link
                    'status': self.extract_property_text(properties.get('e}{q', [])),  # Status
                    'english_title': self.extract_property_text(properties.get('@m~r', [])),  # English title
                }
                
                # Clean up data
                for key, value in title_data.items():
                    if isinstance(value, str):
                        title_data[key] = self.clean_text(value)
                
                # Only add if we have a valid title
                if title_data['title']:
                    titles.append(title_data)
                    logger.info(f"Extracted: {title_data['title']}")
            
            logger.info(f"Successfully parsed {len(titles)} titles")
            return titles
            
        except Exception as e:
            logger.error(f"Error parsing title data: {e}")
            return []

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
        
        return text.strip()

    def save_to_csv(self, titles_data, filename='toons_kr_fixed.csv'):
        """Save data to CSV"""
        if not titles_data:
            logger.error("No data to save")
            return
        
        fieldnames = [
            'title', 'english_title', 'url', 'genre', 'writer', 'artist', 
            'original', 'featured', 'pages', 'characters', 'synopsis', 
            'cover_image', 'link', 'status'
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
            logger.info("Starting fixed Toons.kr scraper...")
            
            # Setup WebDriver
            self.setup_driver()
            
            # Extract Next.js data
            next_data = self.extract_next_data()
            if not next_data:
                logger.error("Failed to extract Next.js data")
                return
            
            # Parse title information
            titles_data = self.parse_title_data(next_data)
            if not titles_data:
                logger.error("No title data found")
                return
            
            # Save results
            self.save_to_csv(titles_data, 'toons_kr_fixed.csv')
            
            # Save backup JSON
            with open('toons_kr_fixed.json', 'w', encoding='utf-8') as f:
                json.dump(titles_data, f, ensure_ascii=False, indent=2)
            
            # Save raw Next.js data for analysis
            with open('toons_kr_raw_data.json', 'w', encoding='utf-8') as f:
                json.dump(next_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Scraping completed! Total titles: {len(titles_data)}")
            
            # Print summary
            print(f"\n=== SCRAPING SUMMARY ===")
            print(f"Total titles extracted: {len(titles_data)}")
            print(f"Output files:")
            print(f"  - toons_kr_fixed.csv (main output)")
            print(f"  - toons_kr_fixed.json (JSON backup)")
            print(f"  - toons_kr_raw_data.json (raw Next.js data)")
            
            # Show sample data
            if titles_data:
                print(f"\nSample titles:")
                for i, title in enumerate(titles_data[:5]):
                    print(f"  {i+1}. {title['title']} ({title['genre']})")
            
        except Exception as e:
            logger.error(f"Fatal error: {e}")
            raise
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("WebDriver closed")

if __name__ == "__main__":
    scraper = FixedToonsKrScraper()
    scraper.run()